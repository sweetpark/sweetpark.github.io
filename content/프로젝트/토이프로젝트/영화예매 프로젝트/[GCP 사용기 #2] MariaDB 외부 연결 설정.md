---
title: "[GCP 사용기 #2] MariaDB 외부 연결 설정"
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [GCP 사용기 #2] MariaDB 외부 연결 설정

> [!NOTE] 실행 환경
> 같은 폴더의 "[GCP 사용기 #3] Spring boot 서버 구축" 노트에 명시된 스택 기준 — Spring Boot 3.3.5, Java 17, MariaDB.

1. MariaDB 설정  
2. GCP 클라우드 방화벽 설정  
3. spring boot 설정

## MariaDB 설정

*   계정 자체 외부 접속 허용

[계정 자체 외부 접속 허용]  
- mysql 데이터베이스로 들어가면 기본적으로 localhost로 지정되어있다  
- 새로운 계정을 생성하거나 root 외부접속 권한을 열어줘야함 ( Host : % -> 모든 범위에서 허용 )
```java
use [database];

//조회
select user,host from user;

+-------------+-----------+
| User        | Host      |
+-------------+-----------+
| mariadb.sys | localhost |
| mysql       | localhost |
| root        | localhost |
+-------------+-----------+

//수정
grant all privileges on *.* to 'root'@'%' identified by '[패스워드]';

select user,host from user;
+-------------+-----------+
| User        | Host      |
+-------------+-----------+
| root        | %         |
| mariadb.sys | localhost |
| mysql       | localhost |
| root        | localhost |
+-------------+-----------+
```

*   mariaDB Binding IP 확인 (127.0.0.1)

기본 설정 파일을 열어보면 아래와 같이 `bind-address`가 `127.0.0.1`(localhost)로 고정되어 있어, 외부에서는 접속이 불가능한 상태임을 확인할 수 있다.

```text
[mysqld]
bind-address = 127.0.0.1
```

*   mariaDB Binding IP 설정
    *   /etc/mysql/mariadb.conf.d/50-server.cnf
    *   **bind-address : 127.0.0.1 (주석 처리)**

해당 라인을 아래처럼 주석 처리하여 모든 IP 대역에서의 접속을 허용하도록 변경한다.

```text
[mysqld]
# bind-address = 127.0.0.1
```

수정 후 설정 파일을 저장하고 나온 모습(변경된 `.cnf` 파일 내용)까지 확인한다.

*   MariaDB 재시동 및 방화벽 오픈

systemctl restart mariaDB  
ufw enable 3306 **// 따로 GCP 플랫폼에서도 열어줘야함**

## GCP 클라우드 방화벽 설정

1. 이름작성  
2.트래픽방향 (인그레스)  
(외부 -> 마리아db 서버 접속)  
3. 네트워크 모든 인스턴스  
(0.0.0.0/0 (전범위))  
4.TCP 포트 지정  
(3306)

GCP 콘솔의 VPC 네트워크 > 방화벽 규칙 생성 화면에서 아래와 같이 입력하여 규칙을 만든다.

| 항목 | 값 |
| --- | --- |
| 이름 | mariadb-allow-3306 |
| 트래픽 방향 | 인그레스 (Ingress) |
| 일치 시 작업 | 허용 |
| 대상 | 네트워크의 모든 인스턴스 |
| 소스 IP 범위 | 0.0.0.0/0 |
| 프로토콜 및 포트 | TCP: 3306 |

규칙 생성 후 방화벽 목록에 위 규칙이 정상적으로 추가되어 활성화된 것을 확인한다.

## Spring Boot 설정

*   application.properties 설정

```properties
spring.datasource.url=jdbc:mariadb://[GCP 외부 IP]:3306/[database]
spring.datasource.username=root
spring.datasource.password=[패스워드]
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
```

## 관련 문서

- [[GCP 사용기 #3] Spring boot 서버 구축]([GCP%20사용기%20%233]%20Spring%20boot%20서버%20구축.md) — 같은 GCP 배포 시리즈의 다음 편으로, 여기서 연결한 MariaDB를 사용할 Spring Boot 서버를 GCP에 구축하는 과정

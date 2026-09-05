---
title: [GCP 사용기 #2] MariaDB 외부 연결 설정
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [GCP 사용기 #2] MariaDB 외부 연결 설정

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

![](https://blog.kakaocdn.net/dna/cmTosp/btsKv8eGjmh/AAAAAAAAAAAAAAAAAAAAAL80O2Ygk6ifulrrD0jUhVBankLTtEBgthlGY300xi6P/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=JMJytDWTcfoegZj1PIwyKHPYV90%3D)

*   mariaDB Binding IP 설정
    *   /etc/mysql/mariadb.conf.d/50-server.cnf
    *   **bind-address : 127.0.0.1 (주석 처리)**

![](https://blog.kakaocdn.net/dna/CF3zq/btsKwt3TxvW/AAAAAAAAAAAAAAAAAAAAAEqd0avY3IOZoUTdE5MeOtpUBx4We5mw0niJ6IwbApb8/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=0D5Ha3cRK5xbacdVQ9y9OJHfhGY%3D)

![](https://blog.kakaocdn.net/dna/bGZfMA/btsKvErvvl2/AAAAAAAAAAAAAAAAAAAAALPmPn445pCEGPva-y4tVJrti7FyBJ-vo2QGX6rOJCDE/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=47oZNKj%2B6swHfxBrB07yx%2FrCYQU%3D)

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

![](https://blog.kakaocdn.net/dna/bx84nd/btsKwDrCXNa/AAAAAAAAAAAAAAAAAAAAAHNOSQWsy9SKbRB1DdKn1E5FYKoWMnJceq1FBBMzr-Gu/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=VrS5R8LLj9WpgZbETAopuiQsc8k%3D)

![](https://blog.kakaocdn.net/dna/H6w4W/btsKwiuMHUf/AAAAAAAAAAAAAAAAAAAAAKzSCQPW-W1Rn_6serRACpyCczuh9Av8zhGXhWrEcI09/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=D3YQNR9%2FHklyO9vdSc3rLlMtbUw%3D)

## Spring Boot 설정

*   application.properties 설정

![](https://blog.kakaocdn.net/dna/SpGyB/btsKvJM2O2N/AAAAAAAAAAAAAAAAAAAAAPZIvyrM9EV8bGq4S5jmNVZV5j_3nQtqW07op_JWdIbk/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=Wmz8S18efPbG11bnymwPdhV7L7A%3D)

> 원문: https://gradualprecision.tistory.com/166

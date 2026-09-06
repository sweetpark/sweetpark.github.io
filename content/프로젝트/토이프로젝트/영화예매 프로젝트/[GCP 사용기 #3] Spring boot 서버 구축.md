---
title: "[GCP 사용기 #3] Spring boot 서버 구축"
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [GCP 사용기 #3] Spring boot 서버 구축

[구성]  
spirng boot : 3.3.5  
java : 17

## JAVA 설치

[root 게정]  
1. apt update  
2. apt install openjdk-17-jdk -y  
3. java -version

## Springboot 서비스 등록

*   /opt 디렉토리로 .jar파일 이동

cp my-app.jar /opt/my-app.jar

*   systemd 데몬 서비스 등록

/etc/systemd/system/ 경로에서 서비스 등록
```shell
sudo vi /etc/systemd/system/my-app.service

[Unit]
Description=SpringBoot Application
After=network.target

[Service]
User=root
ExecStart=/usr/bin/java -jar /opt/my-app.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## GCP 포트열기

GCP 콘솔의 VPC 네트워크 > 방화벽 규칙에서 아래와 같이 8080 포트를 여는 규칙을 추가한다.

| 항목 | 값 |
| --- | --- |
| 이름 | springboot-allow-8080 |
| 트래픽 방향 | 인그레스 (Ingress) |
| 일치 시 작업 | 허용 |
| 대상 | 네트워크의 모든 인스턴스 |
| 소스 IP 범위 | 0.0.0.0/0 |
| 프로토콜 및 포트 | TCP: 8080 |

*   [서버외부ip]:8080 접속 확인

## 관련 문서

- [[GCP 사용기 #2] MariaDB 외부 연결 설정]([GCP%20사용기%20%232]%20MariaDB%20외부%20연결%20설정.md) — 같은 GCP 배포 시리즈의 이전 편으로, 이 서버가 연결할 MariaDB 외부 접속 설정 과정
- [[배포 #2] WAR & JAR 차이]([배포%20%232]%20WAR%20&%20JAR%20차이.md) — 여기서 배포하는 jar 파일의 빌드 방식과 WAR와의 차이를 다룬 문서

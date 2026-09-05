---
title: [GCP 사용기 #3] Spring boot 서버 구축
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

![](https://blog.kakaocdn.net/dna/dzFek0/btsKwxsiSbY/AAAAAAAAAAAAAAAAAAAAAIgFBeXh9XX2Ep0psYO3t9OMHrrwAa5dqfkX78D-YwA4/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=QVhpR4f7xfQg1ou%2BJa9oZF0U8Io%3D)

*   [서버외부ip]:8080 접속 확인

> 원문: https://gradualprecision.tistory.com/170

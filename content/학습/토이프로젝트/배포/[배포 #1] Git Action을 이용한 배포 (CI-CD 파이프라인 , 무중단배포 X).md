---
title: [배포 #1] Git Action을 이용한 배포 (CI/CD 파이프라인 , 무중단배포 X)
tags: [토이프로젝트, 배포]
created: 2026-09-05
modified: 2026-09-05
---

# [배포 #1] Git Action을 이용한 배포 (CI/CD 파이프라인 , 무중단배포 X)

## ▶ Spring Boot 프로젝트 배포 흐름도 & GitHub Actions 활용 CI/CD 구축

Docker 기반 자동 배포를 구축한 실제 프로젝트를 바탕으로 배포 과정을 정리

![](https://blog.kakaocdn.net/dna/ejIVrb/btsNsqcePXx/AAAAAAAAAAAAAAAAAAAAABhgHkZP0Wrx_RukjPTIPjH5_sqYEk_yzwxJHBMazPZA/img.jpg?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=or8CBhhlIXq%2BYzs50fnuYlnjOSE%3D)

프로젝트 적용 과정

* * *

## ▶ 일반적인 배포 과정

1. 서버 환경 구성

*   JDK 설치 및 환경변수 등록
*   디렉터리 구성
*   GitHub/SVN 연동

2. 소스 최신화 및 Build

*   Gradle or Maven 빌드
*   jar 생성 시: java -jar [파일명] 으로 실행
*   war 생성 시: Tomcat 서버에 배치

## ▶ 자동화된 배포 방식 개요

*   소스 저장소(GitHub, SVN 등)에서 **이벤트(푸시/PR)** 발생
*   빌드 트리거 감지 → 빌드 파일(또는 Docker 이미지) 생성 → 운영 서버에 전송 적용 (또는 Docker 실행)
*   파일 변경 및 Docker 이미지 변경 후 **재배포 시 약간의 중단**은 발생할 수 있음

※ 무중단 배포를 원할경우, Rolling update / Blue-Green 방식을 이용하여 delay없이 재배포 가능  
( 현재 파일 바꿔치기 및 Docker이미지의 경우 기존 프로세스를 kill 해야하므로 약간의 down time이 존재 )

## ▶ 자동 배포 도구 비교

| 도구 | 설명 | 특징 |
| --- | --- | --- |
| Jenkins | 오픈소스 CI/CD 툴 | 커스터마이징 다양 서버 직접 구축 필요 GitHub 연동 수동 설정 |
| GitHub Actions | GitHub 제공 CI/CD 서비스 | 이벤트 감지 자동 Ubuntu 기반 빌드환경 제공 DockerHub & AWS 연동 가능 |

## ▶  GitHub Actions로 Docker 자동 배포하기

1.  브랜치 `push` 또는 `pull request` 발생
2.  GitHub Ubuntu 서버에서 `jar` 빌드 & Docker 이미지 생성
3.  Docker Hub에 이미지 `push`
4.  AWS 서버에 SSH 접속 → Docker pull → 컨테이너 실행
5.  환경변수는 `GitHub Secrets`에 저장하여 보안 유지

* * *

GitHub Actions 전체 코드 예시

```
name: Deploy to AWS with Docker

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master

jobs:
  build-and-deploy:
    name: Build JAR, Create Docker Image & Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: JDK 17 설치
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: 소스코드 빌드
        run: |
          chmod +x gradlew
          ./gradlew clean build -x test

      - name: 도커 이미지 만들기
        run: |
          docker buildx build --platform linux/amd64 -t ${{ secrets.DOCKER_HUB_USERNAME }}/[docker container name]:latest .

      - name: 도커 허브 로그인
        run: |
          echo "${{ secrets.DOCKER_HUB_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_HUB_USERNAME }}" --password-stdin

      - name: 도커 이미지를 도커 허브에 PUSH 하기
        run: |
          docker push ${{ secrets.DOCKER_HUB_USERNAME }}/[docker container name]:latest

      - name: 배포 서버 접속 및 도커허브에서 이미지 PULL 받고 실행 (재배포 포함 로직) // 8080포트로 바인딩
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.AWS_APPLICATION_SERVER_SSH_KEY }}" | base64 --decode > ~/.ssh/app_server.pem
          chmod 400 ~/.ssh/app_server.pem
          ssh-keyscan -H ${{ secrets.AWS_APPLICATION_SERVER_HOST }} >> ~/.ssh/known_hosts
          
          ssh -i ~/.ssh/app_server.pem ubuntu@${{ secrets.AWS_APPLICATION_SERVER_HOST }} << 'EOF'
            sudo su -
            docker stop web-container || true
            docker rm web-container || true
            docker pull ${{ secrets.DOCKER_HUB_USERNAME }}/backend-server:latest
            docker run -d --name web-container \
                -e DB_HOST=${{ secrets.DB_HOST }} \
                -e DB_PASSWORD=${{ secrets.DB_PASSWORD }} \
                -e DB_USER=${{ secrets.DB_USER }} \
                -p 8080:8080 \
                ${{ secrets.DOCKER_HUB_USERNAME }}/[docker container name]:latest
          EOF
```

## ▽ 보안 관련 팁

1. 민감한 정보 처리  
- GitHub Secrets를 통해 DB 접속 정보, OAuth 키 등 민감 정보를 안전하게 관리  
2. SSH KEY 처리  
- AWS 접속 SSH Key는  base64 인코딩 후 비공개 저장  
(키 값에는 파싱에 방해되는 부분이 있을 수 있기에 base64를 적용하여 처리)

> 원문: https://gradualprecision.tistory.com/265

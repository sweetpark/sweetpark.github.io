---
title: "Git Action (CD)"
tags: [학습, 개발-CS, 인프라, 형상관리, 개발]
modified: 2026-09-05
---

# Git Action (CD)

> [!NOTE]
> GitHub Actions를 이용한 CD(지속적 배포) 정리. 별도 러너 서버에서 빌드 → Docker 이미지 생성 → Docker Hub push → 배포 서버 SSH 배포까지의 흐름과 워크플로우 예시.

## 📌 개념

### GitHub Actions 배포 흐름

GitHub Actions는 별도의 러너(runner) 서버에서 실행된다.

1. 레포지토리의 업데이트 내용을 받는다 (Actions 러너)
2. 빌드를 진행한다 (Actions 러너)
3. Dockerfile로 Docker 이미지를 생성한다 (Actions 러너)
4. Docker 이미지를 Docker Hub에 push 한다 (Actions 러너)

이후 배포 단계:

- Actions 러너에서 SSH로 배포 서버에 접속
    - 기존 Docker 컨테이너 종료 및 삭제 (배포 서버)
    - Docker Hub에서 이미지 pull
    - `docker run`으로 컨테이너 기동
- 민감 값은 GitHub Secrets(`${{ secrets.* }}`)로 저장·사용

### YAML `|` 연산자 (블록 스칼라)

`|`는 여러 줄을 개행을 유지한 채 하나의 문자열로 넘긴다.

```yaml
run: |
  echo "Hello World"
  echo "End"
# 실행 결과
# Hello World
# End
```

> [!IMPORTANT]
> YAML의 파이프(`|`)와 리눅스 셸의 파이프(`|`)는 의미가 다르다. 리눅스 파이프는 이전 명령의 출력을 다음 명령의 입력으로 넘긴다.

```bash
echo "Hello World" | cat
# 실행 결과
# Hello World
```

## 💻 예시

### AWS + Docker 배포 워크플로우

```yaml
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

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Build JAR with Gradle
        run: |
          chmod +x gradlew
          ./gradlew clean build -x test

      - name: Build Docker Image
        run: |
          docker buildx build -t ${{ secrets.DOCKER_HUB_USERNAME }}/backend-server:latest .

      - name: Login to Docker Hub
        run: |
          echo "${{ secrets.DOCKER_HUB_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_HUB_USERNAME }}" --password-stdin

      - name: Push Docker Image to Docker Hub
        run: |
          docker push ${{ secrets.DOCKER_HUB_USERNAME }}/backend-server:latest

      - name: Deploy to Application Server
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.AWS_APPLICATION_SERVER_SSH_KEY }}" > ~/.ssh/app_server.pem
          chmod 600 ~/.ssh/app_server.pem
          ssh-keyscan -H ${{ secrets.AWS_APPLICATION_SERVER_HOST }} >> ~/.ssh/known_hosts

          ssh -i ~/.ssh/app_server.pem ubuntu@${{ secrets.AWS_APPLICATION_SERVER_HOST }} << 'EOF'
            docker stop web-container || true
            docker rm web-container || true
            docker pull ${{ secrets.DOCKER_HUB_USERNAME }}/backend-server:latest
            echo "${{ secrets.ENV_FILE }}" > .env
            docker run -d --name web-container --env-file .env -p 8080:8080 ${{ secrets.DOCKER_HUB_USERNAME }}/backend-server:latest
          EOF
```

---
title: "서버 배포 (+Docker)"
tags: [학습, 개발-CS, 인프라, 기초, 개발, Docker, 배포]
modified: 2026-09-05
---

# 서버 배포 (+Docker)

> [!NOTE]
> Docker 기반 서버 배포 정리. Dockerfile 작성, 이미지 빌드(buildx), Docker Hub push/pull, 환경변수·컨테이너 관리, Ubuntu 설치까지.

> [!WARNING]
> 원본에 접속정보(.env) 첨부가 있었으나 보안상 제외함.

## 📌 개념

### 준비사항

- Docker Desktop 설치 — [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Docker docs — [Compose Quickstart](https://docs.docker.com/compose/gettingstarted/)

### Dockerfile

아래 단계 순서로 작성한다: Base Image → Application Dependencies → Source Code → Final Image.

> [!IMPORTANT]
> Dockerfile은 확장자가 없다. 일부 에디터가 자동으로 확장자를 붙이므로 주의한다.

```dockerfile
FROM python:3.12
WORKDIR /usr/local/app

# Install the application dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy in the source code
COPY src ./src
EXPOSE 5000

# Setup an app user so the container doesn't run as the root user
RUN useradd app
USER app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

| 지시어 | 설명 |
| --- | --- |
| FROM | 사용할 베이스 이미지(언어) |
| WORKDIR | 파일이 복사되고 명령이 실행되는 이미지의 "작업 디렉토리" 설정 |
| COPY | 호스트에서 파일을 복사하여 해당 경로에 넣기 |
| RUN | 필요한 의존성 패키지 설치(지정된 명령어 실행) |
| ENV | 환경 변수 설정 |
| EXPOSE | 오픈할 포트 |
| USER | 기본 사용자 설정 |
| CMD | 컨테이너가 실행할 기본 명령어(START 명령어) |

### 관련 명령 개요

- `docker init` — 프로젝트 실행에 필요한 파일로 초기화(python, java, asp.net 등 템플릿 제공)
- `docker compose` — 만들어진 서비스를 실행하는 명령

| 명령 | 설명 |
| --- | --- |
| `docker compose up` | compose.yaml에 정의된 모든 서비스 실행 |
| `docker compose down` | 실행 중인 서비스 중지 |
| `docker compose logs` | 실행 중인 서비스 로그 기록 |
| `docker compose ps` | 모든 서비스 현재 상태 출력 |

## 💻 예시

### 도커 이미지 만들기

```bash
docker buildx build -t [dockerHub 이름]/[container 이름]:[태그명] [DockerFile 위치]

# ex)
docker buildx build --platform linux/amd64 --push -t wooyeong0715/backend-server:latest .
```

- docker 19버전 이상부터는 `buildx` 이용

```text
# docker buildx 주요 명령
Management Commands:
  history     Commands to work on build records
  imagetools  Commands to work on images in registry

Commands:
  bake        Build from a file
  build       Start a build
  create      Create a new builder instance
  du          Disk usage
  inspect     Inspect current builder instance
  ls          List builder instances
  prune       Remove build cache
  rm          Remove one or more builder instances
  stop        Stop builder instance
  use         Set the current builder instance
  version     Show buildx version information
```

주요 빌드 옵션: `--build-arg`(빌드 변수), `--cache-from`/`--cache-to`(캐시), `--load`(로컬 로드), `--push`(레지스트리 push), `-t`/`--tag`(이름:태그), `--target`(타겟 스테이지), `--secret`(빌드 시크릿).

### Docker Hub 올리기 / 가져오기

```bash
# Docker Hub는 무료 요금제 시 계정당 private 1개 가능. 로그인 필요
docker login

# push (이미지 파일: [dockerHub 이름]/[컨테이너이름]:[태그명])
docker push [이미지파일]

# pull
docker pull [이미지파일]
```

### Docker 환경변수 설정

> [!NOTE]
> `docker run`은 처음 이미지를 컨테이너로 만들 때 사용(env 값 설정)하며, 이후 `docker start/stop`으로 컨테이너를 관리한다.

```bash
# run 에 옵션으로 env 주입
docker run -d \
  --name mariadb_container \
  -e MARIADB_ROOT_PASSWORD=루트패스워드 \
  -e MARIADB_DATABASE=데이터베이스명 \
  -e MARIADB_USER=사용자명 \
  -e MARIADB_PASSWORD=사용자패스워드 \
  -p 호스트포트:3306 \
  mariadb:11

# .env 파일로 주입
docker run -d --name mariadb_container --env-file ./env
```

### Docker 컨테이너 관리

```bash
docker container ls -a            # 컨테이너 확인
docker start [container명]        # 켜기
docker stop [container명]         # 끄기
docker container rm [컨테이너명]  # 삭제

# 컨테이너 IP 확인 (서로 다른 서버의 컨테이너 통신용)
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' [컨테이너명]
```

### Ubuntu Docker 설치

관련 문서: [Docker Desktop for Ubuntu](https://docs.docker.com/desktop/setup/install/linux/ubuntu/)
- [Docker Engine for Ubuntu](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)

```bash
sudo apt install gnome-terminal
sudo apt-get update

# Add Docker's official GPG key:
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Docker Desktop 패키지 설치
sudo apt-get install ./docker-desktop-amd64.deb
systemctl --user start docker-desktop
```

```bash
# 스냅 설치
snap install docker

# 서비스 실행 / 버전 확인 / 서비스 등록
systemctl --user start docker-desktop
docker compose version
docker --version
docker version
systemctl --user enable docker-desktop

# Docker Desktop 업그레이드
sudo apt-get install ./docker-desktop-amd64.deb
```

## 🔗 참고

- [GitHub Actions에서 비밀(Secrets) 사용 - GitHub Docs](https://docs.github.com/ko/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)

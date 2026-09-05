---
title: "sk m&s (배포/CICD 정리)"
tags: [학습, 개발-CS, 인프라, 기타, 개발, 배포, CICD]
created: 2026-06-26
modified: 2026-09-05
---

# sk m&s (배포/CICD 정리)

> [!NOTE]
> GitHub SSH 커밋 서명과 GitHub Actions 기반 EC2 자동 배포(CI/CD) 구축 정리. push → Actions → SSH → EC2(pm2) 흐름.

> [!WARNING]
> 원본에 접속정보(SSH 개인키/.pem/액세스키 CSV) 및 실서버 IP가 포함되어 있었으나 보안상 제외함.

## 📌 개념

### 구성 개요

```text
git push (main) → GitHub Actions → SSH → EC2
                                       → server_stop.sh
                                       → server_deploy.sh
                                         (git pull → npm install → pm2 restart)
```

### 배포 환경

| 항목 | 값 |
| --- | --- |
| 서버 | AWS EC2 (Amazon Linux 2) |
| 사용자 | `ec2-user` |
| 앱 경로 | `/home/ec2-user/PPP-Partner-Privacy-Protector` |
| Runtime | Node.js 20 (nvm), pm2 |
| 브랜치 | `main` push 시 트리거 |

## 💻 예시

### 1. GitHub SSH 커밋 서명 (GPG 대체)

GPG 키 대신 기존 SSH 키로 커밋에 서명하는 방식. GitHub에서 2022년부터 지원하며, 별도 GPG 설치 없이 SSH 키 하나로 인증 + 서명을 모두 처리한다.

```bash
# 1. SSH 키 생성 (이미 있으면 생략)
ssh-keygen -t ed25519 -C "developer@internal.local" -f ~/.ssh/id_ed25519 -N ""

# 2. 공개키 확인 (아래 2곳에 같은 키 등록)
cat ~/.ssh/id_ed25519.pub
```

같은 공개키를 두 곳에 모두 등록해야 한다.

| 등록 위치 | 용도 |
| --- | --- |
| Settings → SSH and GPG keys → **SSH keys** | 인증 (push/pull) |
| Settings → SSH and GPG keys → **Signing keys** | 커밋 서명 (Verified 배지) |

```bash
# 3. Git 서명 설정
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
git config --global user.email "developer@internal.local"
git config --global user.name "wypark"

# 4. allowed_signers 파일 설정 (로컬 검증용)
echo "developer@internal.local namespaces=\"git\" $(cat ~/.ssh/id_ed25519.pub)" > ~/.ssh/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers

# 5. 서명 커밋 테스트 → GitHub에서 Verified 배지 확인
git commit --allow-empty -m "test: SSH 서명 확인"
git log --show-signature -1
```

#### 트러블슈팅

| 증상 | 해결 |
| --- | --- |
| Verified 안 뜸 | Signing keys 등록 누락 확인 |
| `user.email` 불일치 | GitHub 계정 이메일과 동일하게 설정 |
| Windows에서 경로 오류 | `~/.ssh/` → `C:/Users/username/.ssh/` 절대경로로 입력 |

### 2. GitHub Actions CI/CD 자동배포

#### EC2 사전 준비

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Node.js 20 설치
nvm install 20
nvm use 20
nvm alias default 20

# pm2 설치
npm install -g pm2
pm2 startup
pm2 save
```

```bash
# 앱 최초 실행
cd /home/ec2-user/PPP-Partner-Privacy-Protector
npm install
npm run db:init
npm run db:seed   # 샘플 계정 필요 시
pm2 start src/server.js --name ppp
pm2 save
```

#### 배포 스크립트

```bash
# deploy/server_stop.sh
#!/bin/bash
pm2 stop ppp 2>/dev/null || true
```

```bash
# deploy/server_deploy.sh
#!/bin/bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

APP_DIR="/home/ec2-user/PPP-Partner-Privacy-Protector"

cd "$APP_DIR"
echo "[deploy] git pull..."
git pull origin main
echo "[deploy] npm install..."
npm install --production
echo "[deploy] pm2 restart..."
pm2 restart ppp || pm2 start src/server.js --name ppp
pm2 save
echo "[deploy] 완료"
```

```bash
# 실행 권한 부여 (최초 1회)
chmod +x deploy/server_stop.sh deploy/server_deploy.sh
```

#### GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy to EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            bash /home/ec2-user/PPP-Partner-Privacy-Protector/deploy/server_stop.sh
            bash /home/ec2-user/PPP-Partner-Privacy-Protector/deploy/server_deploy.sh
```

#### GitHub Secrets 등록

**저장소 → Settings → Secrets and variables → Actions → New repository secret**

| Secret 이름 | 값 |
| --- | --- |
| `EC2_HOST` | EC2 퍼블릭 IP |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | EC2 deploy 전용 SSH 개인키 전체 내용 |

```bash
# EC2 deploy 키 생성 (EC2에서 실행)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""

# 공개키 → authorized_keys 등록
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# 개인키 내용 → GitHub Secret EC2_SSH_KEY에 등록
cat ~/.ssh/github_deploy
```

#### GitHub remote 인증 (PAT 방식)

EC2에서 `git pull` 시 username/password 요청을 방지한다.

```bash
git remote set-url origin https://<PAT>@github.com/yeoyoonsu/PPP-Partner-Privacy-Protector.git
git config --global credential.helper store
```

**PAT 발급**: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → `repo` 권한 체크

#### 로그 확인

```bash
pm2 logs ppp                        # pm2 실시간 로그
cat ~/.pm2/logs/ppp-error.log       # 에러 로그
# GitHub Actions 로그: 저장소 → Actions 탭 → 해당 워크플로우 클릭
```

#### 트러블슈팅

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| `ssh: no key found` | .pem 파일을 Secret에 등록 | EC2 전용 ed25519 키 새로 생성 후 등록 |
| `npm: command not found` | SSH 접속 시 PATH 미로드 | `server_deploy.sh`에 nvm source 추가 |
| `no such table: users` | DB 초기화 미실행 | EC2에서 `npm run db:init` 실행 |
| `git pull` username 요청 | HTTPS 인증 없음 | PAT remote URL 방식으로 전환 |
| push 거절 (fetch first) | EC2 merge 커밋이 remote에 올라간 경우 | 로컬에서 `git pull` 후 `git push` |

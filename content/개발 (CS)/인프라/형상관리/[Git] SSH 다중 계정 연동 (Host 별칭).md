---
title: "SSH 다중 계정 연동 (Host 별칭)"
tags: [학습, 개발-CS, 인프라, 형상관리, Git, SSH, 공유계정]
created: 2026-09-16
modified: 2026-09-16
---

# SSH 다중 계정 연동 (Host 별칭)

> [!NOTE]
> 같은 리눅스 계정을 여러 명이 공유해서 쓰는 개발 서버에서, 사람마다 다른 Git 원격 저장소 계정으로 clone/push해야 할 때 SSH Host 별칭으로 계정별 키를 분리하는 방법.

## 배경

같은 리눅스 계정을 여러 명이 공유해서 쓰는 개발 서버에서, 사람마다 다른 Git 계정(GitHub/GitLab/Bitbucket 등)으로 clone/push해야 하는 상황. SSH의 **Host 별칭(alias)** 기능으로 계정별 키를 분리해서 해결한다.

## 핵심 원리

`~/.ssh/config`에 가짜 호스트 이름(별칭)을 등록해서, 실제로는 같은 원격 저장소 호스트에 접속하지만 별칭마다 다른 SSH 키를 쓰도록 강제한다. 계정 구분은 `User` 필드가 아니라 **어떤 IdentityFile을 쓰느냐**로 결정된다.

> [!NOTE] User는 항상 git
> 대부분의 Git 호스팅 서비스는 SSH 로그인 계정명을 `git`으로 고정하는 게 표준이다. 실제 사용자 식별은 등록된 SSH 공개키로 이루어진다.

## 절차

### 1. 계정별 SSH 키 생성
```bash
ssh-keygen -t ed25519 -C "이메일" -f ~/.ssh/별칭_id
```

### 2. Git 호스팅 계정에 공개키 등록
Personal settings → SSH keys → Add key
```bash
cat ~/.ssh/별칭_id.pub
```

### 3. ~/.ssh/config에 Host 블록 추가
```
Host 별칭.example.com
    User git
    Hostname example.com
    IdentityFile ~/.ssh/별칭_id
    IdentitiesOnly yes
```

| 옵션 | 역할 |
| --- | --- |
| Host | 실제로 쓸 별칭. `git clone`/`remote` URL에서 원래 호스트 이름 자리에 그대로 들어간다 |
| User | 항상 `git` |
| Hostname | 진짜 접속 대상(원래 호스트 도메인) |
| IdentityFile | 이 별칭 전용 개인키 경로 |
| IdentitiesOnly yes | 다른 계정 키를 같이 시도하지 않도록 강제 (한 서버에 여러 키가 있을 때 인증이 꼬이는 걸 방지) |

기존에 다른 사람이 등록해둔 블록이 있으면 건드리지 말고 파일 맨 아래에 내 블록만 추가한다.

### 4. 권한 설정 (공유 서버에서 특히 중요)
```bash
chmod 600 ~/.ssh/별칭_id
chmod 644 ~/.ssh/별칭_id.pub
chmod 600 ~/.ssh/config
```
private key 권한이 열려 있으면 ssh가 키 자체를 무시한다.

### 5. 연결 테스트
```bash
ssh -T git@별칭.example.com
```
```
authenticated via ssh key.
You can use git to connect. Shell access is disabled.
```
`Shell access is disabled`는 에러가 아니라 정상 메시지인 경우가 많다. 대부분의 Git 호스팅 서비스는 SSH shell 자체는 막고 git 프로토콜만 허용한다.

### 6. clone / remote 변경
```bash
git clone git@별칭.example.com:워크스페이스/저장소.git
```
기존 저장소의 계정을 바꾸고 싶을 때:
```bash
git remote set-url origin git@별칭.example.com:워크스페이스/저장소.git
```

## 적용 예시 (공유 계정에서 여러 사람이 각자 다른 계정으로 push)

```
Host a.example.com      # 기존 계정 (다른 사람)
    User git
    Hostname example.com
    IdentityFile ~/.ssh/a_id

Host b.example.com      # 내 계정
    User git
    Hostname example.com
    IdentityFile ~/.ssh/b_id
    IdentitiesOnly yes
```

```bash
git clone git@b.example.com:team/project.git
```

## 관련 문서

- [공유 계정에서 커밋 계정 분리하기 (user.name·user.email)]([Git]%20공유%20계정에서%20커밋%20계정%20분리하기%20(user.name·user.email).md)

---
title: "공유 계정에서 커밋 계정 분리하기 (user.name·user.email)"
tags: [학습, 개발-CS, 인프라, 형상관리, Git, 공유계정]
created: 2026-09-16
modified: 2026-09-16
---

# 공유 계정에서 커밋 계정 분리하기 (user.name·user.email)

> [!NOTE]
> 여러 명이 같은 리눅스 계정을 공유하는 서버에서 `git config --global`을 쓰면 안 되는 이유와, local/환경변수 두 가지 대안.

## 배경

여러 명이 같은 리눅스 계정을 공유하는 서버에서 `git config --global`로 이름/이메일을 설정하면, 그 계정을 쓰는 **모든 사람의 커밋에** 내 정보가 찍힌다. 공유 계정에서는 global 대신 저장소 단위 또는 세션 단위로 좁혀서 설정해야 한다.

## 방법 1. 저장소 단위 (local) — 재로그인해도 유지

```bash
git config user.email "you@example.com"
git config user.name "Your Name"
```

`--global` 없이 실행하면 현재 디렉토리의 `.git/config`에만 저장된다. 다른 저장소·다른 사람에게 영향 없음. 한 저장소에서 계속 작업할 거면 이 방법이 기본.

## 방법 2. 세션 단위 (환경변수) — 로그아웃하면 사라짐

파일에 아예 흔적을 안 남기고 싶을 때 사용.

```bash
export GIT_AUTHOR_NAME="Your Name"
export GIT_AUTHOR_EMAIL="you@example.com"
export GIT_COMMITTER_NAME="Your Name"
export GIT_COMMITTER_EMAIL="you@example.com"
```

현재 쉘 세션에서 실행하는 모든 `git commit`에 적용되고, `.git/config`·`~/.gitconfig` 어디에도 저장되지 않는다. 터미널을 닫거나 로그아웃하면 사라짐. 일회성 커밋 하나만 할 때 적합.

> [!TIP] 선택 기준
> 같은 저장소에서 계속 작업 → **방법 1 (local)**
> 딱 한 번 커밋만 하고 끝 → **방법 2 (환경변수)**

## 관련 문서
- [SSH 다중 계정 연동 (Host 별칭)]([Git]%20SSH%20다중%20계정%20연동%20(Host%20별칭).md) — 같은 공유 계정에서 계정별 SSH 키를 분리하는 방법

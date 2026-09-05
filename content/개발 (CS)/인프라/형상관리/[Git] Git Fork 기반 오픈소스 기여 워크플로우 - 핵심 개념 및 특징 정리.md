---
title: "Git Fork 기반 오픈소스 기여 워크플로우"
tags: [학습, 개발-CS, 인프라, Git, GitHub, 오픈소스]
modified: 2026-09-05
---

# Git Fork 기반 오픈소스 기여 워크플로우

> [!NOTE]
> 원본 저장소에 직접 push 권한이 없는 오픈소스 프로젝트에 기여할 때 표준적으로 쓰는 fork → origin/upstream 재구성 → 브랜치 작업 → PR 워크플로우. OSSCA GlueSQL 멘티 활동 중 정리.
> 관련 노트: [(Git) GIT - 핵심 개념 및 특징 정리]([Git]%20GIT%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md) — 기본 Git 명령어 / [(Git) GITLAB _ GITHUB 작업 - 핵심 개념 및 특징 정리]([Git]%20GITLAB%20_%20GITHUB%20작업%20-%20핵심%20개념%20및%20특징%20정리.md) — 사내 GitLab↔개인 GitHub 이중 리모트 운영(별개 시나리오: 이쪽은 "누가 Source of Truth인가"의 문제이고, 이 노트는 "권한 없는 원본에 어떻게 기여하는가"의 문제)

## ⚙️ 왜 이 작업이 필요한가

로컬 클론의 `origin`은 보통 **원본 레포**를 가리키는데, 여기엔 push 권한이 없다.

```
origin → https://github.com/원본조직/원본레포.git   ← push 권한 없음
```

오픈소스 기여는 "원본에 직접 push"가 아니라 **내 fork에 push → 원본으로 PR**을 보내는 방식이다. 그래서 remote를 아래처럼 재구성한다.

```
origin   → 내 fork (github.com/내아이디/레포)   ← 내가 push 하는 곳
upstream → 원본조직/원본레포                    ← 원본, 최신 동기화용
```

## ⚙️ 1단계 — Fork 뜨기 (GitHub 웹, 본인이 직접)

> [!WARNING]
> Fork는 GitHub 계정 로그인이 필요해 CLI(에이전트)가 대신 못 한다. 반드시 웹에서 직접 진행.

1. 브라우저로 원본 저장소 페이지 접속
2. 우측 상단 **Fork** 버튼 클릭 → 본인 계정 선택 → 생성
3. 생성된 주소 확인: `https://github.com/내아이디/레포`

## ⚙️ 2단계 — remote 재구성 (로컬 터미널)

```bash
# 1) 기존 origin(원본)을 upstream으로 이름 변경
git remote rename origin upstream

# 2) 내 fork를 origin으로 추가
git remote add origin https://github.com/내아이디/레포.git

# 3) 확인 — origin=내fork, upstream=원본 이어야 정상
git remote -v

# 4) 내 fork 정보 가져오기
git fetch origin
```

기대 결과:
```
origin    https://github.com/내아이디/레포.git (fetch)
origin    https://github.com/내아이디/레포.git (push)
upstream  https://github.com/원본조직/원본레포.git (fetch)
upstream  https://github.com/원본조직/원본레포.git (push)
```

## ⚙️ 3단계 — 기여 표준 작업 흐름 (PR 보낼 때마다 반복)

```bash
# (1) 원본 최신 상태로 동기화
git checkout main
git fetch upstream
git merge upstream/main          # 또는 git rebase upstream/main

# (2) 작업 브랜치 생성 (브랜치명 규칙: 소문자 a-z, 대시-, 슬래시/ 만 허용하는 프로젝트가 많음)
git checkout -b feat/add-some-function

# (3) 코드 수정 후 — 프로젝트가 요구하는 검증(예: lint/format/test) 통과 확인
#     GlueSQL 같은 Rust 프로젝트라면: cargo clippy / cargo fmt / cargo test

# (4) 커밋 & 내 fork로 push
git add .
git commit -m "Add some function"
git push origin feat/add-some-function

# (5) GitHub 웹에서 내 fork → 원본 저장소로 Pull Request 생성
```

> [!NOTE]
> 커밋은 프로젝트가 요구하는 검증(lint/format/test)이 모두 통과한 뒤에만 하는 것이 원칙(많은 프로젝트가 `CONTRIBUTING.md`/`AGENTS.md` 등에 명시).

## ⚙️ 4단계 — 내 main을 원본과 계속 맞추기 (주기적)

작업이 쌓이면 내 fork의 main이 원본보다 뒤처진다. 새 작업 시작 전 항상:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main             # 내 fork의 main도 최신화
```

## 📋 자주 막히는 부분

| 증상 | 원인 / 해결 |
|---|---|
| push 시 권한 거부(403) | origin이 아직 원본을 가리킴 → `git remote -v` 재확인 |
| push 시 인증 요구 | GitHub은 비밀번호 대신 **PAT(Personal Access Token)** 또는 SSH 키 필요 |
| 브랜치명 거부 | 프로젝트 규칙 위반(예: 소문자 a-z, `-`, `/` 외 문자 사용 금지) |
| PR에 엉뚱한 커밋 다수 포함 | 작업 전 `upstream/main` 동기화를 안 함 → 4단계 수행 |

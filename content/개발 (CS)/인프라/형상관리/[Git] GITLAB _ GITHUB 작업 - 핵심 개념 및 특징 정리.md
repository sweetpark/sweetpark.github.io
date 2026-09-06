---
title: "GITLAB <> GITHUB 작업"
tags: [학습, 개발-CS, 인프라, 개발, Git, GitLab, GitHub, 형상관리]
modified: 2026-09-05
---

# GITLAB <> GITHUB 작업

> [!NOTE]
> 내부망 전용 GitLab과 외부(집) 작업 환경을 분리 운영하기 위해, GitHub를 작업 기준(Source of Truth)으로 삼고 GitLab은 반영/CI/Merge 전용으로 쓰는 전략 정리. Git CLI 명령 위주라 GitLab 버전에 종속적인 내용은 없다.

## 1. 배경 / 문제 상황

- 회사 GitLab은 **내부망 전용** — 집에서는 GitLab 접근 불가
- fork 불가, mirror 사용 시 운영 복잡도 급상승

해결 목표: **집/회사 어디서든 작업 가능 + GitLab은 안정적으로 반영**

## 2. 최종 운영 전략 (결론)

- **GitHub = 개발 및 작업 기준(Source of Truth)**
- **GitLab = 결과 반영 / CI / Merge 전용**

> GitHub에서 작업 → GitLab에 반영

GitLab에 직접 접근할 수 없는 환경(집)에서도 작업을 이어갈 수 있게 하면서, 회사에서만 GitLab에 반영하는 식으로 "작업 위치"와 "반영 위치"를 분리한 것이 핵심이다. 두 원격 저장소를 mirror나 fork로 자동 동기화하지 않는 이유는, 그럴 경우 어느 쪽이 진짜 최신 상태인지 애매해지고 충돌 해결이 더 복잡해지기 때문이다(운영 복잡도 급상승 문제).

## 3. Remote 구성

로컬 저장소 기준으로 origin을 하나만 두지 않고, 두 개의 remote를 등록해 push 대상만 선택하는 방식을 쓴다.

```bash
github  → https://github.com/ORG/REPO.git   (작업 기준)
gitlab  → http://gitlab.internal/ORG/REPO.git (회사 반영)
```

- remote 주소를 바꾸지 않는다 (`set-url` 금지)
- push 대상만 선택한다 (`git push github ...` / `git push gitlab ...`)

## 4. 브랜치 운영 원칙

### 브랜치 네이밍

```
feature/*
refactor/*
hotfix/*
```

예시: `refactor/log`

### GitLab에도 동일 브랜치를 미리 생성

- 기준: `main`
- 목적: 실수 방지 / CI 분리 / 리뷰 준비

## 5. 기본 작업 흐름

### 5.1 집 (GitHub에서 작업)

```bash
git checkout refactor/log
# 작업
git commit -m "Refactor log interceptor"
git push github refactor/log
```

### 5.2 회사 (GitHub → GitLab 반영)

```bash
git fetch github
git checkout refactor/log
git push gitlab refactor/log
```

- 브랜치 **통째로 반영** (커밋 SHA 동일, force/merge 없음) — 커밋 SHA가 같아야 두 원격 저장소의 히스토리가 벌어지지 않고 나중에 비교/추적이 가능하다.

### 5.3 반복 작업

- GitHub에 커밋 추가 → 동일 브랜치로 GitLab에 다시 push
- Git은 변경분만 전송하므로 반복 push의 비용은 크지 않다.

## 6. GitLab Merge 정책

- 대상: `refactor/log → main`
- 방식: **Squash merge (권장)** 또는 Rebase & merge
- 결과: 기존 파일 유지, 추가/수정/삭제된 부분만 반영

Squash merge를 권장하는 이유는, 집/회사를 오가며 쌓인 자잘한 중간 커밋(오타 수정, WIP 등)을 하나의 의미 있는 커밋으로 합쳐 `main`의 히스토리를 깔끔하게 유지하기 위해서다.

## 7. 중요한 운영 규칙 (필수)

### 7.1 Source of Truth 단일화

- GitHub 기준으로만 작업하고, GitLab에서는 직접 작업하지 않는다.

### 7.2 작업 전 필수

```bash
git fetch github
git rebase github/refactor/log
```

GitLab에서 실수로 직접 커밋이 생기면 두 원격 저장소의 히스토리가 갈라지므로, 매 작업 전 GitHub 기준으로 rebase해 항상 하나의 기준선을 유지한다.

## 8. 하지 말아야 할 것

- mirror 사용
- fork 강제
- GitLab main 직접 push
- remote 주소 변경 (`set-url`)
- 양쪽에서 무작위 커밋

이 항목들은 모두 "GitHub가 유일한 작업 기준"이라는 원칙을 깨뜨려 두 저장소의 히스토리가 갈라지게 만드는 행동이라는 공통점이 있다.

## 9. 이 구조의 장점

- 내부망 / 외부망 분리 문제 해결
- 히스토리 안정, 충돌 최소화
- CI / 리뷰 분리
- 장기 리팩토링에 최적

## 10. 한 줄 요약

> GitHub를 작업 기준으로 삼고, GitLab은 반영 및 검증용으로만 사용한다. 브랜치 단위로 그대로 push 후 merge한다.

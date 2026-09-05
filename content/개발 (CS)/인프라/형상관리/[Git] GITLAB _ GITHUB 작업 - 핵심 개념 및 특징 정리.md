---
title: "GITLAB <> GITHUB 작업"
tags: [학습, 개발-CS, 인프라, 개발, Git, GitLab, GitHub, 형상관리]
modified: 2026-09-05
---

# GITLAB <> GITHUB 작업

> [!NOTE]
> ---
> 
> # GitHub–GitLab 분리 운영 가이드
> 
> **(내부망 GitLab + 외부 작업 환경)**
> 
> ---
> 
> ## 1. 배경 / 문제 상황
> 
> - 회사 GitLab은 **내부망 전용**
> - 집에서는 GitLab 접근 불가
> - fork 불가
> - mirror 사용 시 운영 복잡도 급상승
> 
> 👉 해결 목표
> 
> **집/회사 어디서든 작업 가능 + GitLab은 안정적으로 반영**
> 
> ---
> 
> ## 2. 최종 운영 전략 (결론)
> 
> ### ✅ Source of Truth는 GitHub
> 
> - **GitHub = 개발 및 작업 기준**
> - **GitLab = 결과 반영 / CI / Merge 전용**
> 
> > GitHub에서 작업 → GitLab에 반영
> > 
> 
> ---
> 
> ## 3. Remote 구성
> 
> 로컬 저장소 기준
> 
> ```bash
> github  → https://github.com/ORG/REPO.git   (작업 기준)
> gitlab  → http://gitlab.internal/ORG/REPO.git (회사 반영)
> 
> ```
> 
> ❗ remote 주소를 바꾸지 않는다
> 
> ❗ push 대상만 선택한다
> 
> ---
> 
> ## 4. 브랜치 운영 원칙
> 
> ### 브랜치 네이밍
> 
> ```
> feature/*
> refactor/*
> hotfix/*
> 
> ```
> 
> 예시:
> 
> - `refactor/log`
> 
> ### GitLab에도 동일 브랜치를 미리 생성
> 
> - 기준: `main`
> - 목적: 실수 방지 / CI 분리 / 리뷰 준비
> 
> ---
> 
> ## 5. 기본 작업 흐름
> 
> ### 5.1 집 (GitHub에서 작업)
> 
> ```bash
> git checkout refactor/log
> # 작업
> git commit -m "Refactor log interceptor"
> git push github refactor/log
> 
> ```
> 
> ---
> 
> ### 5.2 회사 (GitHub → GitLab 반영)
> 
> ```bash
> git fetch github
> git checkout refactor/log
> git push gitlab refactor/log
> 
> ```
> 
> - 브랜치 **통째로 반영**
> - 커밋 SHA 동일
> - force / merge 없음
> 
> ---
> 
> ### 5.3 반복 작업
> 
> - GitHub에 커밋 추가
> - 동일 브랜치로 GitLab에 다시 push
> - Git은 변경분만 전송
> 
> ---
> 
> ## 6. GitLab Merge 정책
> 
> - 대상: `refactor/log → main`
> - 방식:
>     - **Squash merge (권장)**
>     - 또는 Rebase & merge
> - 결과:
>     - 기존 파일 유지
>     - 추가/수정/삭제된 부분만 반영
> 
> ---
> 
> ## 7. 중요한 운영 규칙 (필수)
> 
> ### 7.1 Source of Truth 단일화
> 
> - GitHub 기준
> - GitLab에서는 직접 작업 ❌
> 
> ### 7.2 작업 전 필수
> 
> ```bash
> git fetch github
> git rebase github/refactor/log
> 
> ```
> 
> ---
> 
> ## 8. 하지 말아야 할 것
> 
> ❌ mirror 사용
> 
> ❌ fork 강제
> 
> ❌ GitLab main 직접 push
> 
> ❌ remote 주소 변경 (`set-url`)
> 
> ❌ 양쪽에서 무작위 커밋
> 
> ---
> 
> ## 9. 이 구조의 장점
> 
> - 내부망 / 외부망 분리 해결
> - 히스토리 안정
> - 충돌 최소화
> - CI / 리뷰 분리
> - 장기 리팩토링에 최적
> 
> ---
> 
> ## 10. 한 줄 요약
> 
> > GitHub를 작업 기준으로 삼고,GitLab은 반영 및 검증용으로만 사용한다.브랜치 단위로 그대로 push 후 merge한다.
> > 
> 
> ---
> 
> 원하면 다음도 **노션용으로 이어서 정리**해줄 수 있어요:
> 
> - 🔍 GitLab MR 체크리스트
> - 🧹 커밋 정리 기준 (rebase / squash)
> - 🚨 실수 복구 시나리오
> - 🧠 팀원 공유용 1페이지 요약본
> 
> 원하는 방향 말해주면 그걸로 딱 맞게 만들어줄게요.

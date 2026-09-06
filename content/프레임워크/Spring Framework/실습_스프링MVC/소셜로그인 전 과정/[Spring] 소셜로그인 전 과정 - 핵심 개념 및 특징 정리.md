---
title: "소셜로그인 전 과정"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
modified: 2026-09-05
---

# 소셜로그인 전 과정

> [!NOTE]
> Spring Security 기반 소셜로그인 전체 흐름 정리 및 `permitAll()` 관련 트러블슈팅

> [!NOTE] 실행 환경
> 버전 명시 없음 — Spring Security의 `permitAll()`/필터 체인 개념만 다루어 특정 버전은 확정하기 어렵다.

## 🧱 기술 스택
- Spring Security

## ⚙️ 구현
- [소셜로그인과정.drawio](assets/%EC%86%8C%EC%85%9C%EB%A1%9C%EA%B7%B8%EC%9D%B8%EA%B3%BC%EC%A0%95.drawio)

![소셜로그인과정.jpg](assets/%EC%86%8C%EC%85%9C%EB%A1%9C%EA%B7%B8%EC%9D%B8%EA%B3%BC%EC%A0%95.jpg)

## 🔁 회고/배운 점

### 트러블 슈팅
- permitAll()
    - 해당 부분은 모든 필터가 그대로 적용되기는 하나, 인증없이 통과가 가능한 URL을 의미
    - 그래서, response로 필터에서 막게되면 그대로 종료가 된다
        - Exclude Path를 필터내부에서 구현하거나,
        - spring Security에서 필터를 타지 않도록 막아야한다.

## 관련 문서

- [(Spring) 로그인 기능 - 핵심 개념 및 특징 정리](../[Spring]%20로그인%20기능%20-%20핵심%20개념%20및%20특징%20정리.md) — 로그인 흐름과 세션/쿠키·Security 주의점을 다루는 개념 노트
- [(Spring) Strategy+Factory로 다중 Provider 처리하기 - 핵심 개념 및 특징 정리](../[Spring]%20Strategy+Factory로%20다중%20Provider%20처리하기%20-%20핵심%20개념%20및%20특징%20정리.md) — Kakao/Naver/Google/Apple 등 Provider별 소셜로그인 로직을 Strategy+Factory로 구조화한 실무 사례

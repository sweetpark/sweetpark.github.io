---
title: "로그인 기능"
tags: [학습, 개발-CS, 데이터베이스, 개발, 로그인, 세션, JWT, Security]
modified: 2026-09-05
---

# 로그인 기능

> [!NOTE]
> 로그인 기능 구현 시 다뤄야 할 흐름(로그인 → 검증 → 실패 처리)과 세션/쿠키·JWT·Spring Security 등 주의할 포인트를 정리한다.

## 📌 개념

- 로그인 구현 흐름
    1. 로그인하기
    2. 로그인 검증하기
    3. 로그인 실패 처리

- 주의해야 할 점
    - 세션 처리
        - 쿠키와 세션의 차이점
    - JWT
        - Spring Security
        - 쿠키 처리 방법
        - 쿠키 + 세션 처리 방법

- FilterChainProxy
    - filter 체인에서 중요한 역할

## 🔗 참고

- [Spring Security 아키텍처 (공식 문서)](https://docs.spring.io/spring-security/reference/servlet/architecture.html)

---
title: "소셜로그인 전 과정"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
modified: 2026-09-05
---

# 소셜로그인 전 과정

> [!NOTE]
> Spring Security 기반 소셜로그인 전체 흐름 정리 및 `permitAll()` 관련 트러블슈팅
> Spring 기초(김영한) 강의 실습 프로젝트에서 이관.

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

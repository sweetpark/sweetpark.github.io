---
title: "공통 예외 처리"
tags: [학습, 개발-CS, 언어, Spring]
modified: 2026-09-05
---

# 공통 예외 처리

> [!NOTE]
> `@ExceptionHandler`/`@ControllerAdvice` 기반 공통 예외 처리 방식 비교 및 결론.
> Onz(칵테일 플랫폼) 프로젝트에서 이관.

## 🧱 기술 스택
Spring (`@ExceptionHandler`, `@ControllerAdvice`, AOP)

## ⚙️ 구현

### 흐름도

[exception 과정.drawio](assets/exception_%E1%84%80%E1%85%AA%E1%84%8C%E1%85%A5%E1%86%BC.drawio)

![exception 과정.jpg](assets/exception_%EA%B3%BC%EC%A0%95.jpg)

### 공통예외처리

- @ExceptionHandler
- @ControllerAdvice
- @Aop

### 방식

- 메서드 일반적인 exception 처리
    - try ~ catch 문 이용
- 클래스 단위 예외처리
    - @ExceptionHanlder 처리
- 전역적 단위 예외처리
    - @ControllerAdvice 처리
- Http 상태값 예외처리
    - @ResponseStatus 사용
    - 메시지 지정 및 exception paload값 수정 힘듬

## 🔁 회고/배운 점

- 목적
    - 동일한 구조의 응답 패턴 형식
    - 중복 제거
- 사용
    - @ExceptionHandler, @ControllerAdvice, Enum Exception

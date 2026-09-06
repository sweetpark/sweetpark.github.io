---
title: "공통 예외 처리"
tags: [학습, 개발-CS, 언어, Spring]
modified: 2026-09-05
---

# 공통 예외 처리

> [!NOTE]
> `@ExceptionHandler`/`@ControllerAdvice` 기반 공통 예외 처리 방식 비교 및 결론.
> Onz(칵테일 플랫폼) 프로젝트에서 이관.

> [!NOTE] 실행 환경
> 버전 명시 없음 — `@ExceptionHandler`/`@ControllerAdvice` 등 Spring MVC 표준 애노테이션만 사용되어 특정 버전은 확정하기 어렵다.

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

메서드/클래스 단위(try-catch, @ExceptionHandler)는 컨트롤러마다 중복 코드가 생기기 쉬운 반면, @ControllerAdvice로 전역화하면 동일한 응답 포맷을 한 곳에서 관리할 수 있어 응답 규격 통일과 중복 제거라는 이 노트의 목적에 더 부합한다. @ResponseStatus는 상태코드 지정은 간편하지만 예외별로 동적인 메시지/페이로드를 다르게 주기 어렵다는 한계가 있어, 유연한 응답이 필요하면 @ExceptionHandler+@ControllerAdvice 조합이 더 적합하다.

## 🔁 회고/배운 점

- 목적
    - 동일한 구조의 응답 패턴 형식
    - 중복 제거
- 사용
    - @ExceptionHandler, @ControllerAdvice, Enum Exception

## 관련 문서

- [(Spring) 예외처리와 오류 페이지 - 핵심 개념 및 특징 정리](예외처리와%20오류%20페이지/[Spring]%20예외처리와%20오류%20페이지%20-%20핵심%20개념%20및%20특징%20정리.md) — 같은 `@ExceptionHandler`/`@ControllerAdvice` 개념을 서블릿 오류 페이지 흐름까지 포함해 다루는 미니 프로젝트
- [(토이프로젝트) [예외처리 #2] 예외 적용하기](../../../프로젝트/토이프로젝트/예외처리/[예외처리%20%232]%20예외%20적용하기.md) — 같은 `@RestControllerAdvice`/`@ExceptionHandler` 공통 예외 처리 방식을 통일된 응답 포맷과 함께 적용한 실전 프로젝트 사례

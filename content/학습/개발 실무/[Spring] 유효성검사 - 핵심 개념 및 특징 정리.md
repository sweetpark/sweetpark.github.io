---
title: 유효성검사
tags: [학습, 개발실무, 공통]
created: 2026-02-04
modified: 2026-09-05
---

# 유효성검사

> [!NOTE]
> 커스텀 어노테이션 + AOP + Validator Factory를 조합해 DTO별 유효성 검사를 적용하는 구조.

## 📌 개념

### 어노테이션

- `@CheckValidate`: 클래스에 적용 (Target: `ElementType.TYPE`)
    - 컨트롤러 메서드에 유효성 검사 AOP 적용
- `@CustomValidate`: 메서드에 적용 (Target: `ElementType.METHOD`)
    - DTO 클래스에 커스텀 Validator 적용

### Validator Factory

- Factory
    - `Map<Class<?>, Validator>` 저장 (DTO 클래스 : DTO 클래스 Validator)
    - AOP에서 해당 클래스(arg = DTO 클래스)가 들어왔을 때, DTO 클래스 Validator를 꺼내 유효성 검증

### AOP

- SpringValidator: `LocalValidatorFactoryBean`(Spring 기본 제공)으로 기본 어노테이션 기반 유효성 체크
- CustomValidator: `@CustomValidate`가 붙은 DTO 클래스의 Validator를 받아 커스텀 유효성 검사 진행
- errorMap이 존재할 경우 → `CustomValidException()` 예외 처리(공통 응답값 적용)

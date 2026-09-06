---
title: "유효성검사"
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

> [!NOTE] 왜 두 방식을 병행하는가
> `@NotNull`, `@Size` 같은 Bean Validation 어노테이션은 필드 하나만 보고 판단할 수 있는 단순 제약(길이, 필수 여부, 형식)에는 선언적이고 코드가 짧아 유리하다. 하지만 "필드 A가 특정 값일 때만 필드 B가 필수" 같은 **필드 간 상호 의존(교차 필드) 검증**은 어노테이션만으로 표현하기 어렵거나 억지로 클래스 레벨 커스텀 어노테이션을 만들어야 해서 코드가 지저분해진다. 이런 경우 Spring의 `Validator` 인터페이스를 구현한 프로그래밍 방식 검증기(CustomValidator)를 쓰면 임의의 자바 로직으로 여러 필드를 동시에 참조해 검증할 수 있다. 이 구조는 "단순 제약은 어노테이션, 복잡한 교차 검증은 커스텀 Validator"로 책임을 나누어 두 방식의 장점을 모두 취하는 절충안이다.

## 관련 문서

- [(토이프로젝트) [유효성검증 #3] 유효성 검증 아키텍처 설계](../../프로젝트/토이프로젝트/유효성검사%20(Validation)/[유효성검증%20#3]%20%20유효성%20검증%20아키텍처%20설계.md) — @CheckValidation/@CustomValidate + AOP + ValidateFactory 구조를 도식과 함께 상세히 다루는 토이프로젝트 노트

---
title: "검증"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
created: 2026-02-04
modified: 2026-09-05
---

# 검증

> [!NOTE]
> 상품 등록/수정 검증 구현 — @Validated, Bean Validation, Validator 구분

> [!NOTE] 실행 환경
> 버전 명시 없음 — `@Validated`, Bean Validation(JSR-380) 표준 애노테이션만 사용되어 특정 Spring Boot 버전은 확정하기 어렵다.

## 🧱 기술 스택
- Spring Validation (`@Validated`)
- Bean Validation
- Thymeleaf

## ⚙️ 구현
- 요구사항
    - 상품등록
        - 타입 검증
            - 가격, 수량 → 문자 입력시 오류
        - 필드 검증
            - 상품명 : 필수, 공백 x
            - 가격 : 1000원 이상, 1백만원 이하
            - 수량 : 최대 9999
        - 특정 필드의 범위를 넘어서는 검증
            - 가격 * 수량의 합은 10,000원 이상
    - 상품 수정
        - 필드 검증
            - ID 필수값
            - 수량의 경우 무제한
        - 나머지 조건은 동일

타입 검증과 필드 검증을 구분한 이유는 발생 시점과 처리 방식이 다르기 때문이다. 타입 검증(가격/수량에 문자 입력)은 스프링이 데이터 바인딩 시점에 자동으로 typeMismatch 오류로 잡아내는 반면, 필드 검증(필수값, 범위)은 개발자가 @NotBlank·@Range 같은 애노테이션을 명시적으로 선언해야 검증된다. "가격 * 수량의 합" 같은 여러 필드에 걸친 복합 조건은 단일 필드 애노테이션으로 표현할 수 없어 별도의 글로벌 검증 로직으로 처리해야 하며, 등록과 수정에서 검증 규칙이 다른 이유(수정 시 수량 무제한 등)도 도메인 요구사항 자체가 등록/수정 시점마다 다르기 때문이다.

### 도메인 설계
![image.png](assets/image.png)

![image.png](assets/image-1.png)

### 구현 이미지
![image.png](assets/image-2.png)

![image.png](assets/image-3.png)

### 참고
- GitSource: [sweetpark/SpringThymeleaf](https://github.com/sweetpark/SpringThymeleaf)
- 블로그: [gradualprecision.tistory.com/89](https://gradualprecision.tistory.com/89), [/90](https://gradualprecision.tistory.com/90)

## 관련 문서

- [(Spring) 상품 등록 및 조회- 수정 - 핵심 개념 및 특징 정리](../상품%20등록%20및%20조회%20수정/[Spring]%20상품%20등록%20및%20조회-%20수정%20-%20핵심%20개념%20및%20특징%20정리.md) — 같은 상품 등록/수정 도메인에 검증 로직을 추가하기 전 단계의 미니 프로젝트

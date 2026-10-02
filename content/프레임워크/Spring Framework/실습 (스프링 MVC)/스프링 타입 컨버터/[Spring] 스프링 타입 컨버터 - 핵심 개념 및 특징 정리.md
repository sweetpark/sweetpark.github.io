---
title: "스프링 타입 컨버터"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
created: 2026-02-04
modified: 2026-09-05
---

# 스프링 타입 컨버터

> [!NOTE]
> `@RequestParam`/`@ModelAttribute`/`@PathVariable` 바인딩 시 동작하는 스프링 타입 컨버터(`Converter`, `ConversionService`) 정리

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

> [!NOTE] 실행 환경
> 버전 명시 없음 — `Converter<S, T>`, `ConversionService`, `WebMvcConfigurer.addFormatters()` 등 Spring 표준 API만 사용되어 특정 버전은 확정하기 어렵다.

## 🧱 기술 스택
- Spring `Converter<S, T>` 인터페이스, `ConversionService`
- `WebMvcConfigurer.addFormatters()` (컨버터/포매터 등록)
- Thymeleaf

## ⚙️ 구현
- @RequestParam, @ModelAttribute, @PathVariable 을 할때에 타입컨버터가 작동
- @Value 등으로 YML처리 가능
- 스프링은 "컨버터 인터페이스"(`Converter<S, T>`)를 제공해서 확장이 가능하게 해준다
- WebConfigurer(`WebMvcConfigurer`)에서 등록
- ISP 원칙이 잘 지켜져 있음
    - Converter 등록 과 Converter 사용 분리
        - 등록
            - Registry (`FormatterRegistry`)
        - 사용
            - conversionService (`ConversionService`)
- thymeleaf
    - converter를 적용시키기 위해서는 괄호 "{}"를 두번씩 써줘야함
    - ex) `${{ipPort}}`
- Formatter
    - 객체 ↔ 문자 + locale (문자열 ↔ Date/Number 등 로케일이 관여하는 변환은 `Converter` 대신 `Formatter` 사용)

### 참고
- 블로그: [gradualprecision.tistory.com/97](https://gradualprecision.tistory.com/97), [/98](https://gradualprecision.tistory.com/98)

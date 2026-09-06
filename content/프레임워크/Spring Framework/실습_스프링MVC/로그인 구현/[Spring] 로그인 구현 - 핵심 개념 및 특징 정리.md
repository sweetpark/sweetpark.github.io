---
title: "로그인 구현"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
created: 2026-02-04
modified: 2026-09-05
---

# 로그인 구현

> [!NOTE]
> 쿠키/세션 기반 로그인 유지 구현 및 서블릿 필터 vs 스프링 인터셉터를 이용한 공통 관심사(인증) 처리

> [!NOTE] 실행 환경
> 버전 명시 없음 — Servlet Filter/Spring Interceptor, `HttpServletRequest.getSession()` 등 표준 API만 사용되어 jakarta/javax 네임스페이스를 포함해 특정 버전은 확정하기 어렵다.

## 🧱 기술 스택
- Servlet Filter, Spring Interceptor
- HttpServletRequest 세션 (`request.getSession()`)
- Java 8 (Lambda, Stream)

## ⚙️ 구현
- 패키지 구성
    - domain : 핵심 비즈니스 로직 (웹 기술이 바뀌어도 이것은 불변)
    - web : 웹 관련 패키지 (현재 : spring + thymeleaf)
- 패키지 의존성
    - web → domain (가능)
    - domain → web (불가능)
    - domain은 독립적이다

- 람다와 stream()을 잘 사용해야함 → java8

### 로그인 성공
- 쿠키를 사용 (로그인 상태를 유지)
- 쿠키 종류
    - 영속쿠키 : 지정 날짜까지 유지
    - 세션 쿠키 : 브라우저 종료시까지 유지
- 쿠키 사용
    - 오로지 쿠키로만 할경우 보안상의 이슈
        - 쿠키를 랜덤값으로 사용 (토큰 사용)
        - 쿠키의 생존 시간도 짧게 가져가야함
        - → 서버 세션 사용
    - 세션 구현
        1. JAVA sessionManager 직접 구현
        2. HttpServletRequest 세션 사용 (request.getSession())
    - 세션의 경우 서버의 메모리를 사용하는 것이므로, 적당하게 세션을 날리거나 최소한의 정보만 저장해야한다

### 웹 공통사항 처리 (서블릿필터 VS 인터셉트)
- 서블릿필터
    - 공통관심사 처리 → 서블릿 필터 or 인터셉트
    - HTTP 요청 흐름
        - HTTP 요청 -> WAS -> 필터 -> 서블릿 -> 컨트롤러
    - 서블릿 체인
        - 필터를 여러개 넣을 수 있다
    - logback.mdc
        - HTTP 요청시 UUID 값을 지정하는데 이를 다른 로그에도 붙이고싶으면 logback.mdc를 검색해보면 된다
- 스프링 인터셉트
    - HTTP 요청 흐름
        - HTTP 요청 -> WAS -> 필터 -> 서블릿 -> 스프링 인터셉터 -> 컨트롤러
    - 인터셉트 체인
        - 인터셉트를 여러개 넣을 수 있다
    - 인터셉트 Override
        - preHandle : 컨트롤러 호출전에 호출
        - postHandle : 컨트롤러 호출 후에 호출 (단, 컨트롤로에서 예외 발생시 호출 안됨)
        - afterCompletion : 컨트롤러 호출 후에 호출 (단, 컨트롤러에서 예외발생시에도 호출됨)
    - Spring interceptor VS Servlet
        - 인증 조건 방법들
    - ResolverArgument
        - 직접 애노테이션으로 만들어서 argument들을 쉽게 다룸 → 중복 처리 방지 (공통 처리 방지)

### 참고
- 블로그: [gradualprecision.tistory.com/91](https://gradualprecision.tistory.com/91), [/92](https://gradualprecision.tistory.com/92), [/93](https://gradualprecision.tistory.com/93), [/94](https://gradualprecision.tistory.com/94)

## 관련 문서

- [(Spring Framework) Servlet Filter](../../Servlet%20Filter.md) — 이 프로젝트에서 비교하는 서블릿 필터 vs 인터셉터 중 필터 쪽 개념을 상세히 다루는 노트
- [(Spring Framework) Cookie 사용법](../../Cookie%20사용법.md) — 이 프로젝트의 쿠키 기반 로그인 유지 구현이 사용하는 쿠키 개념 정리
- [(Spring) 로그인 기능 - 핵심 개념 및 특징 정리](../[Spring]%20로그인%20기능%20-%20핵심%20개념%20및%20특징%20정리.md) — 로그인 흐름과 세션/쿠키 주의점을 다루는 개념 노트, 이 프로젝트는 그 구현 사례
- [(학습/프로젝트/토이프로젝트/게시판 프로젝트) [기능구현#3] 로그인 기능](../../../../프로젝트/토이프로젝트/게시판%20프로젝트/[기능구현#3]%20로그인%20기능.md) — Filter/Interceptor 기반 로그인 인증을 실전 프로젝트에 적용한 사례

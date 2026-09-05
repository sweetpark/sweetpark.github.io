---
title: "예외처리와 오류 페이지"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
created: 2026-02-04
modified: 2026-09-05
---

# 예외처리와 오류 페이지

> [!NOTE]
> 서블릿/스프링 부트의 예외 처리 흐름과 오류 페이지 매핑, `@ExceptionHandler`/`@ControllerAdvice` 정리
> Spring 기초(김영한) 강의 실습 프로젝트에서 이관.

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장) — 코드 예시의 `@Exception` 표기를 `@ExceptionHandler`로, Notion 서식 잔여 기호(`*`)를 제거함.

## 🧱 기술 스택
- Servlet `DispatcherType`, `BasicErrorController`
- Spring `HandlerExceptionResolver` (`ExceptionHandlerExceptionResolver`, `ResponseStatusExceptionResolver`, `DefaultHandlerExceptionResolver`)
- `@ExceptionHandler`, `@ControllerAdvice` / `@RestControllerAdvice`

## ⚙️ 구현

### 서블릿 예외처리 (예외처리와 오류페이지 → html)
- 서블릿 오류 화면 제공
    - 오류 발생전
        - Was → Servlet Filter → Servlet → Spring Intercept → controller (오류 발생!)
        - Controller → Spring Intercept → Servlet → Servlet Filter → WAS (오류 페이지 확인 → 오류페이지 지정된 URL로 다시 요청)
    - 오류 발생후 (오류페이지 지정된 URL로 다시 요청)
        - Was → Servlet Filter → Servlet → Spring Intercept → controller (오류페이지 URL)
        - Controller → Spring Intercept → Servlet → Servlet Filter → Was
- DispatcherType
    - 서버가 내부적으로 호출된 Error 요청인지 파악이 가능
    - ERROR인 경우 다시 재요청 될때 → Servlet Filter 와 Spring Interceptor를 스킵 가능
        - Servlet Filter
            - WebConfig
                - Servlet Filter 설정에서 DispatcherType.ERROR 제거

                `filterRegistrationBean.setDispatcherTypes(DispatcherType.REQUEST, DispatcherType.ERROR);`

        - Spring Interceptor
            - WebConfig
                - excludepath로 설정(/error-page/** 등록)

                `.excludePathPatterns("/css/**","*.ico","error","/error-page/**");`
    - spring boot 오류 페이지
        - spring boot 는 페이지만 지정 경로에 넣어서 두면 된다
            - 뷰 템플릿
                - templates/error/[페이지들]
                    - 5xx.html : 500번대 html 전부
                    - 500.html : 500 에러 특정 페이지
                    - error.html : 지정되지 않는 error 페이지 (기본)
                - static/error/[페이지들]
                    - 정적 리소스 에러 페이지
            - BasicErrorController
                - 특정 Controller를 이용하여 springBoot가 자동으로 error 페이지로 리다이렉트 해줌

### 예외처리 API
- `WebServerFactoryCustomizer`
    - 커스터마이징을 통해서 error Controller (Accept:application/produces) 를 사용
- BasicErrorController 사용
    - accept 정보에 따라 자동으로 결과값을 보냄
- ExceptionResolver
    - ModelAndView 반환으로 새로운 뷰를 렌더링 할 수 있음 (오류 페이지를 보여줄 수 있음)
    - response.sendError() 로서 상태코드를 바꿀 수 있음
    - 등록 하는 방법 → WebConfigurer을 통해서 등록 가능
- spring boot 제공 exceptionResolver
    - 우선순위
        1. ExceptionHandlerExceptionResolver
        2. ResponseStatusExceptionResolver
        3. DefaultHandlerExceptionResolver
    - ResponseStatusExceptionResolver
        - HTTP 상태코드를 지정해주는 것
        - `@ResponseStatus(code = "상태코드", reason ="메시지 내용")`
        - 내부적으로, response.sendError()를 해주어 상태코드를 지정한다
    - DefaultHandlerExceptionResolver
        - spring 내부에서 발생한 예외 처리 (HTTP 상태코드 변경)
            - RequestParam (Integer) → String 으로 들어오면 500 오류가 나옴
            - 그런데, DefaultHandlerExceptionResolver 가 400 BadRequest로 변경시켜줌 (클라이언트가 잘못 제공한 값이기에)
    - ExceptionHandlerExceptionResolver (`@ExceptionHandler`)

        ```java
        @ResponseStatus(HttpStatus.BAD_REQUEST)
        @ExceptionHandler(IllegalArgumentException.class)
        public ErrorResult illgalExHandler(IllegalArgumentException e){
            log.error("[excetionHandler] ex", e);
            return new ErrorResult("BAD", e.getMessage());
        }
        ```

        - HttpStatus 상태코드값 지정 가능
        - 객체 반환 가능

        `@ExceptionHandler` 설명

        - 부모 예외 VS 자식 예외 우선권은?
            - 자식예외처리가 우선권을 가짐 (더 자세하기 때문에)
        - 여러 Exception 클래스 설정 가능 (부모 예외 클래스로 넓게 잡으면 됨)

            ```java
            @ExceptionHandler({AException.class, BException.class})
            public String exception(ABParentException ex){
            //...
            }
            ```

        - Exception 명칭 생략 가능 → 파라미터 객체가 해당 exception 일 경우

            ```java
            @ExceptionHandler
            public String exception(UserException e){
            ```

    `@ControllerAdvice`

    - `@RestControllerAdvice`
        - 패키지 별로 해당 Exception 적용 가능 (parameter → basePackages=" ")
        - 특정 class 및 interface를 지정해서 적용 가능

### 참고
- 블로그: [gradualprecision.tistory.com/95](https://gradualprecision.tistory.com/95), [/96](https://gradualprecision.tistory.com/96)

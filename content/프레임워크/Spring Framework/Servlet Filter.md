---
title: "Servlet Filter"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Servlet Filter

> [!NOTE] 실행 환경
> 버전 명시 없음 — `javax.servlet.Filter`/`FilterConfig`를 직접 구현하고 `FilterRegistrationBean`으로 등록하는 방식으로 보아 Spring Boot 2.x대(javax.servlet) 학습 자료로 추정.

Servlet Filter는 클라이언트 요청이 Controller에 도달하기 전, WAS 단계에서 요청/응답을 가로채 인증 확인·로깅 같은 공통 로직을 처리하는 서블릿 표준 기술이다. 인증되지 않은 사용자의 접근을 Controller 이전 단계에서 차단하고 싶을 때 주로 사용한다.

## Filter 사용 이유

인증 되지 않은 사용자가 접근을 시도한다면, 그 접근 자체를 거부해야하는 부분이 필요하다.  
이때에, 사용할 수 있는 기술 중 하나가 "Filter"이다

## HTTP 요청 흐름 (+ Filter)

**HTTP Request Flow**  
HTTP 요청 -> WAS -> Filter -> Servlet -> Controller

*   인증되지 않는 사용자의 요청을 거부하기 위해서는 Controller 도달 전에 거부를 해야한다 (Filter의 사용 이유)
*   Filter의 경우 Chain 기능이 존재 (= 여러개의 Filter를 둘 수 있다)

## Servlet Filter 인터페이스

```java
public interface Filter {
    default void init(FilterConfig filterConfig) throws ServletException {
    }

    void doFilter(ServletRequest var1, ServletResponse var2, FilterChain var3) throws IOException, ServletException;

    default void destroy() {
    }
}
```

*   init() : 필터 초기화 메서드 ( 서블릿 컨테이너가 생성될때 사용 )
*   doFilter() : 고객의 요청이 올 때 마다 실행됨 (해당 Filter 로직을 사용하여, 필터링 가능)
*   destory() : 필터 종료 메서드 ( 서블릿 컨테이너가 종료될 때 호출 )

## doFilter() 메서드

HTTP 요청 -> WAS -> Filter #1 -> Filter#2 -> ... -> Servlet -> Controller

*   Servlet Filter에서 가장 중요한 메서드
*   **해당 메서드를 실행하여, 다음 filter로 이동 시키거나 다음 filter가 없을 경우 서블릿을 호출**
*   **해당 메서드의 chain 부분을 실행하지 않으면 다음 HTTP Flow를 못넘기고 종료될 수 있음 (주의 요망)**

```java
@Slf4j
public class LogTest implements Filter{
    
    @Override
    //init()...
    
    @Override
    public void doFilter(ServletRequest var1, ServletResponse var2, FilterChain var3) throws IOException, ServletException{
    
        try{
            log.info("REQUEST");
            if ( Filter 검열시 ){
                return; // .doFilter() 메서드를 이용하지 않고, 바로 반환 ( 요청 종료 )
            }
            var3.doFilter(var1, var2);
        }catch (Exception e){
            throw e;
        }finally{
            log.info("RESPONSE");
        }
    }
        
    @Override
    //destroy()...
}
```

## Servlet Filter 등록 방법

*   Component 등록
    *   요청 흐름 : HTTP요청 -> WAS -> MethodFilter1 -> MethodFilter2 -> Servlet -> Controller 
    *   Component 등록으로 이용시, 스프링의 내정된 규칙에 따라 우선순위가 달라짐
    *   이런 부분을 보완하고자, @Order 애노테이션을 이용하여 우선순위를 지명해줌
    *   @WebFilter(urlPatterns="[URL]") 을 사용하여 적용하고 싶은 Filter 범위를 지정

```java
@Component
@Order(1)
@WebFilter(urlPatterns="/*")
public class MethodFilter1 implements Filter{
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        // ...
    }
}

@Component
@Order(2)
@WebFilter(urlPatterns="/*")
public class MethodFilter2 implements Filter{
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        // ...
    }
}
```

*   Bean 등록 
    *   .setFilter() 메서드를 이용하여 Filter 클래스를 추가
    *   .setOrder() 메서드를 이용하여 우선순위 선정
    *   .setUrlPatterns() 메서드를 이용하여 필터 적용 범위 설정

```java
@Configuration
public class WebConfig {
    @Bean
    public FilterRegistrationBean<Filter> logFilter() {
        FilterRegistrationBean<Filter> filterRegistrationBean = new FilterRegistrationBean<>();
        filterRegistrationBean.setFilter(new MethodFilter1());
        filterRegistrationBean.setOrder(1);
        filterRegistrationBean.addUrlPatterns("/*");
        return filterRegistrationBean;
    }
}
```

## 관련 문서

- [(Spring) 로그인 구현 - 핵심 개념 및 특징 정리](실습_스프링MVC/로그인%20구현/[Spring]%20로그인%20구현%20-%20핵심%20개념%20및%20특징%20정리.md) — 서블릿 필터 vs 스프링 인터셉터를 실제로 비교 구현한 미니 프로젝트
- [(학습/프로젝트/토이프로젝트/게시판 프로젝트) [기능구현#3] 로그인 기능](../../프로젝트/토이프로젝트/게시판%20프로젝트/[기능구현#3]%20로그인%20기능.md) — Filter를 1차 인증 로직에 실전 적용한 토이프로젝트 사례
- [(학습/프로젝트/토이프로젝트/게시판 프로젝트) [리팩터링] Session을 통한 로그인 처리](../../프로젝트/토이프로젝트/게시판%20프로젝트/[리팩터링]%20Session을%20통한%20로그인%20처리.md) — Filter를 세션 기반 로그인 처리에 실전 적용한 사례
- [(학습/프레임워크/Spring Framework) Spring Intercept](Spring%20Intercept.md) — 이 노트의 서블릿 필터 이후 동작하며 유사한 역할을 하는 HandlerInterceptor(preHandle/postHandle/afterCompletion)를 다루는 노트

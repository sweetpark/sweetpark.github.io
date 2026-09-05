---
title: Spring Intercept
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring Intercept

spring mvc Intercept...

## Intercept 란?

Servlet 필터와 유사한 역할을 하는 기능.  
다만, 차이점이 있다면 Spring MVC 에서 제공하는 기능이며, Servlet Filter 이후에 동작하는 차이점이 존재

*   Intercept의 특징은 Servlet Filter에서 제공하는 doFilter() 메서드 한개와 다르게 순서에 따라 3개의 메서드가 존재

## Intercept 흐름

HTTP 요청 -> WAS -> Filter -> Servlet -> Intercept -> Controller

*   Servlet Filter가 Intercept 보다 먼저 호출됨
*   중복 처리 되지 않도록 주의하며 설계해야함

## Intercept 인터페이스

```java
public interface HandlerInterceptor {
    default boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        return true;
    }

    default void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, @Nullable ModelAndView modelAndView) throws Exception {
    }

    default void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, @Nullable Exception ex) throws Exception {
    }
}
```

*   preHandler() : Controller 호출 전에 호출 ( boolean 반환값으로, true 이면 다음으로 진행되고 false 이면 다음으로 넘어가지 않음 )
*   postHandler() : Controller 호출 후에 호출 ( Controller에서 예외가 발생하면 postHandler() 메서드는 호출되지 않음 ) 
*   afterCompletion() : view 렌더링 이후 호출 ( Controller에서 예외가 발생하더라도 afterCompletion() 메서드는 호출됨 )
    *   afterCompletion() 메서드의 경우 Controller에서 예외 발생시 예외 정보를 반환할 수 있음

## Intercept 구현

*   주의할점
    *   MyInterceptor 클래스의 경우 bean에 등록되므로, 싱글톤으로 진행되게 된다 (멤버변수를 주의하여 사용해야함)
        *   uuid를 활용하여 request에 요청별로 구분하고, 가져다 사용할 수 있도록 진행
        *   이렇게 불편하게(?) 사용한 이유는 , preHandler() / postHandle() / afterCompletion() 호출 시기가 다 다르기 때문에 이런식으로 구현하게 됨
    *   Controller 핸들러 종류
        *   @RequestMapping (동적 처리)
            *   HandlerMethod인 경우, 추가적인 정보가 존재하기에 필터링하여 사용할 수 있다. 
            
        *   정적리소스 처리 (/resources/static)
            *   ResourceHttpRequestHandler인 경우, 정적인 처리를 위한 핸들러이므로 이것에 대한 특정 정보는 따로 처리를 해줘야한다.
    *   공통적인 정상처리 및 예외처리를 하기 위해서는 afterCompletion() 메서드를 사용
        *   Controller에서 예외 발생시, postHandle()은 호출이 되지 않기에 공통적인 예외처리는 afterCompletion() 메서드를 이용

```java
@Slf4j
public class MyInterceptor implements HandlerInterceptor{
    
    private static final String ID = "specify Id";
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object Handler) throws Exception{
        
        String requestURI = request.getRequestUri();
        
        String uuid = UUID.randomUUID().toString();
        request.setAttribute(ID, uuid);
        
        if ( handler instaceOf HandlerMethod ){
            HandlerMethod hm = (HandlerMethod) handler;        
        }
        
        return true;
    }
    
    
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        log.info("postHandle [{}]", modelAndView); // Controller 예외시 호출 되지 않음
    }
    
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        
        String requestURI = request.getRequestURI();
        String logId = request.getAttribute(ID);
        
        log.info("RESPONSE {} {}", logId, requestURI);
        
        if ( ex != null ){
            log.error("afterCompletion error!", ex);
        }
    }
}
```

## Intercept 등록 방법

*   addInterceptors() 메서드를 @Override 하여 구현한 Intercept를 등록
*   WebMvcConfigurer의 인터페이스를 이용하여 WebConfig 구성
*   order() 메서드를 이용하여 우선순위 설정
*   addPathPatterns() 메서드를 사용하여 적용 범위 설정
*   excludePathPatterns() 메서드를 사용하여 적용하지 않을 범위 설정

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new MyInterceptor())
                .order(1)
                .addPathPatterns("/**")
                .excludePathPatterns("/css/**", "/*.ico", "/error");
    }

}
```

> 원문: https://gradualprecision.tistory.com/94

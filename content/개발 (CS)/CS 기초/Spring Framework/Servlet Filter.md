---
title: "Servlet Filter"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Servlet Filter

servlet filter...

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
    void doFilter(ServletRequest var1, ServletResponse var2, FilterChain var3) throws IOException, ServletException{
    
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
        
    @Override
    //destory()...
}
```

## Servlet Filter 등록 방법

*   Component 등록
    *   요청 흐름 : HTTP요청 -> WAS -> MethodFilter#1 -> MethodFilter#2 -> Servlet -> Controller 
    *   Component 등록으로 이용시, 스프링의 내정된 규칙에 따라 우선순위가 달라짐
    *   이런 부분을 보완하고자, @Order 애노테이션을 이용하여 우선순위를 지명해줌
    *   @WebFilter(urlPatterns="[URL]") 을 사용하여 적용하고 싶은 Filter 범위를 지정

```java
@Component
@Order(1)
@WebFilter(urlPatterns="/*")
public class MethodFilter#1 implements Filter{
    @Override
    void doFilter()//..
    
}

@Component
@Order(2)
@WebFilter(urlPatterns="/*")
public class MethodFilter#2 implements Filter{
    @Override
    void doFilter()//..
    
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
     public FilterRegistrationBean logFilter() {
         FilterRegistrationBean<Filter> filterRegistrationBean = new FilterRegistrationBean<>();
         filterRegistrationBean.setFilter(new MethodFilter#1());
         filterRegistrationBean.setOrder(new MethodFilter#1());
         filterRegistrationBean.setUrlPatterns("/*");
         return filterRegistrationBean;
     }
}
```

---
title: "예외처리 (web page)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# 예외처리 (web page)

예외 페이지..

## 서블릿 예외처리

*   과정

1. HTTP 요청 -> WAS -> Filter -> Servlet -> Interceptor -> Controller  
2. Controller 예외 발생!  
3. Controller -> Interceptor -> Servlet -> Filter -> WAS  
4. WAS(error처리 페이지) -> Filter -> Servlet -> Interceptor -> Controller  
5. Controller(오류처리) -> Interceptor -> Servlet -> Filter -> WAS -> HTTP 응답

*   위의 방식대로, 정상적인 요청에서 예외발생시 해당 예외처리를 WAS에서 한번 더 재요청하게 된다
*   해당 부분을 생각하여, 예외처리를 위한 등록과정 과 예외처리용 Controller가 필요하다

## 서블릿 예외처리 등록 및 Controller

```java
@FunctionalInterface
public interface WebServerFactoryCustomizer<T extends WebServerFactory> {
    void customize(T factory);
}
```

*   WebServerFactoryCustomizer를 이용하여, Http 상태 또는 Exception 종류에 따른 예외 페이징 처리를 한다.
*   WAS에서 해당 오류에 따른 요청을 할때에, 등록되어있는 구분에 따라 재요청이 이루어지게 된다

#### Exception에 따른 등록

```java
@Component
 public class MyCustomizer implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {
     
     @Override
     public void customize(ConfigurableWebServerFactory factory) {
         
         ErrorPage errorPage404 = new ErrorPage(HttpStatus.NOT_FOUND, "/error-page/404");
         ErrorPage errorPageException = new ErrorPage(RuntimeException.class, "/error-page/500");
         
         factory.addErrorPages(errorPage404, errorPageException);
     }
     
     
 }
```

#### Exception 처리 Controller

```java
@Controller
@Slf4j
public class ErrorPageController{
    
    @RequestMapping("/error-page/404")
    public String errorPage404(HttpServletRequest request, HttpServletResponse response){
        log.info("error 404");
        return "error-page/404";
    }
    
    
    @RequestMapping("/error-page/500")
    public String errorPage404(HttpServletRequest request, HttpServletResponse response){
        log.info("error 500");
        return "error-page/500";
    }
```

*   /templates/error-page/404.html
*   /templates/error-page/500.html

## Spring boot 예외처리 적용

*   spring boot 는 자동으로 ErrorPage를 등록
*   BasicErrorController를 spring boo는 자동으로 등록
*   개발자의 경우, error page만 지정된 경로에 저장해주면 됨 ( /templates/error/** )

- 4xx로 만든다면, 해당 400번대 오류의 경우 해당 html을 view 해줌  
- 404.html 처럼 특정 오류에 대한 페이지의 경우 우선적으로 html을 view 해줌  
  
/resources/templates/error/4xx.html  
/resources/templates/error/404.html  
/resources/templates/error/5xx.html  
/resources/templates/error/500.html

*   하위 정보들을, spring boot는 기본적으로 제공함

```html
<ul>
<li>오류 정보</li> <ul>
             <li th:text="|timestamp: ${timestamp}|"></li>
             <li th:text="|path: ${path}|"></li>
             <li th:text="|status: ${status}|"></li>
             <li th:text="|message: ${message}|"></li>
             <li th:text="|error: ${error}|"></li>
             <li th:text="|exception: ${exception}|"></li>
             <li th:text="|errors: ${errors}|"></li>
             <li th:text="|trace: ${trace}|"></li>
</ul>
</li> </ul>
```

*   특정 설정을 통해서 parameter혹은 설정에 따라 오류 정보를 보여줄 수 있음

[ application.properties 설정 정보 ]  
server.error.include-exception=true  
server.error.include-message=on_param /never / always 중 하나  
server.error.include-stacktrace=on_param /never / always 중 하나  
server.error.include-binding-errors=on_param /never / always 중 하나  
  
  
  
// 테스트시 (on_param 설정)  
http://localhost:8080/error-ex?message=&errors=&trace=

## 서블릿 예외처리 ( 필터 , 인터셉트 적용 )

#### Servlet Filter 적용

*   LogFilter의 Filter 적용
*   setDispatcherTypes() 메서드를 이용하여 ERROR인 경우에도 필터가 적용되게 설정 가능 ( 기본값  : REQUEST )
    *   WAS에서 예외처리를 재전송할 때에, DispatcherType은 ERROR 이다

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
     @Bean
     public FilterRegistrationBean logFilter() {
         FilterRegistrationBean<Filter> filterRegistrationBean = new FilterRegistrationBean<>();
         filterRegistrationBean.setFilter(new LogFilter());
         filterRegistrationBean.setOrder(1);
         filterRegistrationBean.addUrlPatterns("/*");
         filterRegistrationBean.setDispatcherTypes(DispatcherType.REQUEST,DispatcherType.ERROR);
         return filterRegistrationBean;
} }
```

#### Spring Interceptor

*   Interceptor의 경우, excludePathPatterns를 이용하여 제외할 error 페이지를 지정 (해당 error페이지의 요청일 경우 인터셉트 적용 x)
*   반대로 적용하고 싶으면, 해당 부분을 제거하면 된다.

```java
@Configuration
 public class WebConfig implements WebMvcConfigurer {
     
     @Override
     public void addInterceptors(InterceptorRegistry registry) {
     
         registry.addInterceptor(new LogInterceptor())
                                .order(1)
                                .addPathPatterns("/**")
                                .excludePathPatterns("/error", "/error-page/**",);
                            
     
     }
}
```

> 원문: https://gradualprecision.tistory.com/95

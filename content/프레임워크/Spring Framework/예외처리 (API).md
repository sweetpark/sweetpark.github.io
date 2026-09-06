---
title: "예외처리 (API)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# 예외처리 (API)

> [!NOTE] 실행 환경
> 버전 명시 없음 — `WebServerFactoryCustomizer`, `BasicErrorController`, `@RestControllerAdvice` 등 Spring Boot 표준 API만 사용되어 특정 버전은 확정하기 어렵다.

예외처리... HTTP API 응답

## 요약 정리

*   HTML / TEXT 형식의 예외 처리
    *   BasicErrorController() 사용
*   API 형식의 예외처리
    *   ExceptionHandlerExceptionResovler 사용 (@ExceptionHandler)

## 사전 준비

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
 
 
 
 @Slf4j
 @RestController
 public class ApiExceptionController {
      
      
      @GetMapping("/api/exception/{id}")
      public String apiExceptionTest(@PathVariable("id") String id){
           
           if (id.equals("ex"){
               throw new RuntimeException("잘못된 사용자"); // 예외 던짐 (RuntimeException)
           }
           
           return new MemberDto(id, "hello" + id);
       }
}

@DATA
@AllArgsConstructors
public class MemberDto{
     
     private String memberId;
     private String name;
}
```

*   Customizing을 통해서 Error 발생시 error-page 경로 설정
*   RuntimeException 예외 던짐

## 예외 API 응답 처리

### 1. 직접 Error 제어 Controller 추가

*   produces = MediaType.APPLICATION_JSON_VALUE 를 이용하여 api 요청을 Mapping 함
*   ResponseEntity 를 사용하므로 , 메시지 컨버터를 이용하여 json 형식으로 반환됨

```java
@RequestMapping(value = "/error-page/500", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<Map<String, Object>> errorPage500(HttpServletRequest request, HttpServletResponse response) {
     
     Map<String, Object> result = new HashMap<>();
     Exception ex = (Exception) request.getAttribute(ERROR_EXCEPTION);
     
     // result에 api 응답을 담음
     result.put("status", request.getAttribute(ERROR_STATUS_CODE));
     result.put("message", ex.getMessage());
     
     Integer statusCode = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
     
     return new ResponseEntity(result, HttpStatus.valueOf(statusCode));
 }
```

### 2. Spring boot 기본 제공 Error 제어 (BasicErrorController)

*   기본값으로, /templates/error/ 하위에 에러페이지를 생성하면 Mapping 시켜준다.
    *   application.properties 에 "server.error.path"부분을 추가해주면 경로를 변경할 수 있다

*   errorHtml()의 경우 accept헤더 값이 "text/html"인 경우에 호출된다. (view 페이지 제공)
*   error()의 경우 accept헤더 값이 "application/json"인 경우에 호출된다 (API 제공)

```java
@Controller
@RequestMapping({"${server.error.path:${error.path:/error}}"})
public class BasicErrorController extends AbstractErrorController {

    //...
    
    public ModelAndView errorHtml(HttpServletRequest request, HttpServletResponse response) {
        HttpStatus status = this.getStatus(request);
        Map<String, Object> model = Collections.unmodifiableMap(this.getErrorAttributes(request, this.getErrorAttributeOptions(request, MediaType.TEXT_HTML)));
        response.setStatus(status.value());
        ModelAndView modelAndView = this.resolveErrorView(request, response, status, model);
        return modelAndView != null ? modelAndView : new ModelAndView("error", model);
    }

    @RequestMapping
    public ResponseEntity<Map<String, Object>> error(HttpServletRequest request) {
        HttpStatus status = this.getStatus(request);
        if (status == HttpStatus.NO_CONTENT) {
            return new ResponseEntity(status);
        } else {
            Map<String, Object> body = this.getErrorAttributes(request, this.getErrorAttributeOptions(request, MediaType.ALL));
            return new ResponseEntity(body, status);
        }
    }
    
    //...
}
```

*   application properties 설정을 통해 더 자세한 오류 결과값 출력 가능

[application.properties]  
server.error.include-binding-errors=always  
server.error.include-exception=true  
server.error.include-message=always  
server.error.include-stacktrace=always

###  3. Handler Exception Resolver

```java
public interface HandlerExceptionResolver {
    @Nullable
    ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response,
                                  @Nullable Object handler, Exception ex);
}
```

*   resolveException()메서드를 이용해서, exception 발생시 원하는 응답코드와 메시지를 ModelAndView형태로 반환이 가능
    *   반환 형태
        *   null : null을 반환할경우, 다음 resolveException을 찾고 없으면 servlet 밖으로 예외처리가 됨
        *   ModelAndView 빈 값 :  view 를 반환하지않고, 서블릿에 정상흐름으로 반환 됨
        *   ModelAndView 값 : view를 렌더링한다. 

```java
public class MyHandlerException implements HandlerExceptionResolver {
    
    @Override
    ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response,
                                  @Nullable Object handler, Exception ex){
    
    try{
        if (ex instanceOf IllegalArgumentException){
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, ex.getMessage()); // 400번대 오류발생 (Illegal 예외시)
            return new ModelAndView();
        }
    }catch (IoException e){
        log.error("error");
    }
    
    return null; // 다음 resovleException
}
```

*   HandlerExceptionResolver 등록 방법 (WebConfig)

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void extendHandlerExceptionResolvers(List<HandlerExceptionResolver> resolvers) {
        
        resolvers.add(new MyHandlerExceptionResolver());
    
    }
}
```

### 4. spring 제공 Exception Resolver

*   ResponseStatusExceptionResolver
*   DefaultHandlerExceptionResolver
*   ExcetpionHandlerExceptionResolver -> 우선순위가 가장 높고, 자주 사용됨

#### ResponseStatusExceptionResolver

*   역할
    *   HTTP 상태코드 지정
*   처리방법
    *   @ResoposeStatus 예외
        *   직접 Exception을 만들때에 사용이 가능
        *   개발자가 직접 추가를 해줘야하는 부분이므로, 직접 구현이 어렵다면 ResponseStatusException을 활용
        *   추가적으로, reason에 messages.properties를 이용하여 작성이 가능
    *   ResponseStatusException 예외
        *   ResponseStatusException클래스를 이용하여, 직접 추가하지 못한 @ResponseStatus 대신하여 상태코드 지정

```java
/*

** @ResponseStatus 사용 **

*/

//messages.properties
error.bad="잘못된 요청 오류"

// BadRequestException.class
//@ResponseStatus( code = HttpStatus.BAD_REQUEST, reason = "잘못된 요청 오류")
@ResponseStatus( code = HttpStatus.BAD_REQUEST, reason = "error.bad")
public class BadRequestException extends RuntimeException{
}

// TestController.class
@Controller
public class TestController{
     
     @GetMapping("/api/responseStatus")
     public String testException(){
           throw new BadRequestException;
     }
}
```

```java
/*

** ResponseStatusException 사용 **

*/

//messages.properties
error.bad="잘못된 요청 오류"

//ResponseExceptionResolver
//ResponseResovlerController

@Controller
public class ResponseResolverController{
     
     @GetMapping("/api/responseResolver")
     public String testException(){
         throw new ResponseStatusException(HttpStatus.NOT_FOUND,"error.bad", new IllegalArgumentException());
     }
}
```

#### DefaultHandlerExceptionResolver

```java
@Controller
public class DefaultController{

    @GetMapping("/api/default-handler-ex")
    public String defaultException(@RequestParam Integer data) {
    //data -> typeMismatch ( data ==> String )
        return "ok";
    }
}
```

*   스프링 내부적으로 자동으로 발생시켜주는 error Resolver
*   주로, TypeMismatch 로 인해 발생한다

[응답결과]  
{ "status": 400, "error": "Bad Request", "exception": "org.springframework.web.method.annotation.MethodArgumentTypeMismatchException", "message": "Failed to convert value of type 'java.lang.String' to required type 'java.lang.Integer'; nested exception is java.lang.NumberFormatException: For input string: \"hello\"", "path": "/api/default-handler-ex" }

## ExceptionHandlerExceptionResolver

*   HttpServletResponse에 .sendError() 적용할 필요 없음
*   ExceptionResolver를 이용하여 ModelAndView를 반환했어야 했지만, 그럴 필요가 없어짐
*   컨트롤러마다 다르게 예외 처리 방식 적용이 가능 ( 기존에는 RuntimeException을 예외처리 해놓으면 어떠한 컨트롤러이든지 같은예외 처리가 이루어짐)

```java
@RestControllerAdvice
public class ExControllerAdvice {
    
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public ErrorResult illegalExHandle(IllegalArgumentException e) {
        return new ErrorResult("BAD", e.getMessage());
    }
     
    @ExceptionHandler
    public ResponseEntity<ErrorResult> userExHandle(UserException e) {
        ErrorResult errorResult = new ErrorResult("USER-EX", e.getMessage());
        return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
    }
    
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler
    public ErrorResult exHandle(Exception e) {
        return new ErrorResult("EX", "내부 오류"); 
    }
}
```

*   @RestControllerAdvice를 이용하여, 기존의 Controller와 분리하여 관리가 가능해짐
    *   @RestControllerAdvice 또는 @ControllerAdvice 사용 가능
    *   @RestControllerAdvice는 @ResponseBody가 더 추가 된 것임
*   @ResponseStatus를 이용하여 HttpStatus 상태코드 지정 가능
*   @ExceptionHandler를 사용하여, 예외 처리 지정이 가능
    *   예외처리 지정을 하지 않았을 경우, 파라미터를 기준으로 적용됨
    *   @ExceptionHandler의 경우 여러 Exception들을 적용할 수 있음
    *   ( ex @ExceptionHandler(@ExceptionHandler.class, @BadRequestException.class) )
*   ResponseEntity를 사용하여 errorResult 및 Http 상태코드를 지정 가능

### 대상 컨트롤러 지정 방법

```java
// Target all Controllers annotated with @RestController
@ControllerAdvice(annotations = RestController.class)
public class ExampleAdvice1 {}
 
// Target all Controllers within specific packages
@ControllerAdvice("org.example.controllers")
public class ExampleAdvice2 {}
 
// Target all Controllers assignable to specific classes
@ControllerAdvice(assignableTypes = {ControllerInterface.class, AbstractController.class})
public class ExampleAdvice3 {}
```

## 관련 문서

- [(학습/프레임워크/Spring Framework) 예외처리 (web page)](예외처리%20(web%20page).md) — 동일한 MyCustomizer/ErrorPage 등록 코드를 웹 페이지(HTML) 응답 관점에서 다루는 짝 노트

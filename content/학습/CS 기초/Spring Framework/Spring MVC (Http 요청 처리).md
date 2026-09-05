---
title: Spring MVC (Http 요청 처리)
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring MVC (Http 요청 처리)

## HTTP 요청 파라미터 방법

*   GET - 쿼리 파라미터
    *   URL 쿼리 파라미터에 데이터를 포함해서 전달
*   POST - HTML Form
    *   Content-Type : application/x-www-form-urlencoded
    *   메시지 body 부분에 쿼리 파라미터 형식으로 전달 ( ex) username=hello&age=20 )

*   HTTP message body
    *   HTTP API 사용 (JSON, XML, TEXT )

## HTTP 요청 파라미터

*   **request.getParameter("[변수]")**

String username = request.getParameter("username");

*   **@RequestParam("[변수]")**

public String Example( @RequestParam("username") String memberName ) {  //... }

*   **@RequestParam 변수 생략**
    *   요청 변수명과 파라미터 변수명이 같을경우 생략 가능

public String Example( @RequestParam String username ) {  //... }

*   **@RequestParam 자체 생략**
    *   기본 타입일 경우 (int, String, Integer 등) @RequestParam 생략 가능

public String Example( String username ) {  //... }

*   **Map을 이용하여 파라미터 받기**

public String Example( @RequestParam Map<String, Object> paramMap ) {   
    String userName = paramMap.get("ussrname");   
}

*   **파라미터 필수 여부**
    *   기본값이 true
    *   "" VS null 은 서로 다른 의미 ("" 은 빈값을 뜻하는 "값"이다 )

public String Example( @RequestParam(value = "username", required = [true/false] ) String memberName ) {  //... }

## HTTP 요청 파라미터 - @ModelAttribute

*   ModelAttribute는 파라미터로 넘어온 값들을 객체에 저장할 때 사용하는 annotation 이다
*   사용법은 객체 틀을 만들고 lombok (@Data) 을 이용해서 편의 메서드들을 만든 후 사용하면 된다

```java
@Data
// @Getter , @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
public class HelloData{
    private String username;
    private int age;
}
```

*   @ModelAttribute 기본

```java
@ResponseBody
@RequestMapping("/main/v1")
public String modelAttributeV1 (@ModelAttribute HelloData helloData){
     log.info("username={} , age={}", helloData.getUsername(), helloData.getAge());
     return "ok";
}
```

*   @ModelAtribute 생략
    *   주의) @RequestParam도 생략이 가능하다
        *   @RequestParam : String, int, Integer 등 단순 타입 경우 적용됨
        *   @ModelAttribute : 단순타입 이외 (객체)에 적용됨

```java
@ResponseBody
@RequestMapping("/main/v1")
public String modelAttributeV1 (HelloData helloData){
     log.info("username={} , age={}", helloData.getUsername(), helloData.getAge());
     return "ok";
}
```

## HTTP 요청 메시지

*   요청 파라미터와 달리, message Body를 통해 메시지가 들어오는 경우는 @RequestParam / @ModelAttribute를 사용할 수 없다
*   ServletInputStream 혹은 InputStream 혹은 HttpEntity 혹은 @RequestBody 를 사용해서 읽어야함
*   응답을 보낼때는 @ResponseBody를 이용하여 실어서 보낼 수 있음
*   @RequestBody와 @ResponseBody 는 "HTTP 메시지 컨버터"를 이용하게 된다 
    *   HTTP 메시지를 읽어서 객체를 변환할 때, "HTTP 메시지 컨버터" 를 사용하게 된다
    *   요청 : JSON 요청 -> HTTP 메시지 컨버터 -> 객체
    *   응답 : 객체 -> HTTP 메시지 컨버터 -> JSON

## HTTP 요청 메시지 - TEXT

*   ServletInputStream 을 사용해서 요청 파라미터 파싱

```java
@Slf4j
@Controller
public class RequestBodyStringController{
    
    @PostMapping("/main/Request")
    public void requestBodyString(HttpServletRequest request, HttpServletResponse response) throws IOException{
         
         ServletInputStream inputStream = request.getInputStream();
         String messageBody = StreamUtils.copyToString(inputStream, StandardCharsets.UTF-8);
         
         log.info("messageBody={}", messageBody);
         response.getWriter().write("ok");
         }
}
```

*   InputStream
    *   스프링MVC 파라미터 지원
        *   InputStram : HTTP 요청 메시지 바디의 내용을 직접 조회
        *   OutputStream : HTTP 응답 메시지 바디에 직접 결과 출력

```java
@Slf4j
@Controller
public class RequestBodyStringController{
    
    @PostMapping("/main/RequestV2")
    public void requestBodyStringV2(InputStream inputStream, Writer responseWriter) throws IOException{
         
         String messageBody = StreamUtils.copyToString(inputStream, StandardCharsets.UTF-8);
         
         log.info("messageBody={}", messageBody);
         responseWriter.write("ok");
         }
}
```

*   HttpEntity  
    *   HTTP 요청
        *   요청 파라미터 조회 기능과는 관계 없음 (@RequestParam, @ModelAttribute)
        *   HTTP 헤더 정보 조회 가능
        *   HTTP 메시지 바디 내용 조회 가능
    *   HTTP 응답
        *   메시지 바디 내용 직접 반환
        *   헤더 정보 포함 가능
        *   view 조회 x
    *   StringHttpMessageConverter 적용됨

```java
@Slf4j
@Controller
public class RequestBodyStringController{
    
    @PostMapping("/main/RequestV3")
    public HttpEntity<String> requestBodyStringV3(HttpEntity<String> httpEntity){
         
         String messageBody = httpEntity.getBody()
         
         log.info("messageBody={}", messageBody);
         return new HttpEntity<>("ok");
         }
}
```

*   @RequestBody
    *   HTTP 요청
        *   메시지 바디 정보를 직접 조회 (헤더 조회 불가능)
    *   HTTP 응답
        *   메시지 바디 정보 직접 반환
        *   @ResponseBody를 사용하면 HTTP 메시지 바디에 직접 담아서 잔달 가능
        *   View 조회 x
    *   StringHttpMessageConverter 사용

```java
@Slf4j
@Controller
public class RequestBodyStringController{
    
    @PostMapping("/main/RequestV4")
    public String requestBodyStringV4(@RequestBody String messageBody){
                  
         log.info("messageBody={}", messageBody);
         return "ok"; // body 내용을 직접 반환 (@ResponseBody)
         }
}
```

## HTTP 요청 메시지 - JSON 변환

*   Json 변환 객체 사용
    *   ObjectMapper

```java
@Slf4j
@Controller
public class RequestBodyStringController{
    
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @PostMapping("/main/Request")
    public void requestBodyString(HttpServletRequest request, HttpServletResponse response) throws IOException{
         
         ServletInputStream inputStream = request.getInputStream();
         String messageBody = StreamUtils.copyToString(inputStream, StandardCharsets.UTF-8);
         
         log.info("messageBody={}", messageBody);
         
         //JSON 변환
         HelloData data = objectMapper.readValue(messageBody, HelloData.class);
         log.info("username={}, age={}", data.getUsername(), data.getAge());
         
         response.getWriter().write("ok");
         }
}
```

*   @RequestBody 를 이용한 Json 변환

```java
@Slf4j
@Controller
public class RequestBodyStringController{
    
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @ResponseBody
    @PostMapping("/main/RequestV2")
    public String requestBodyStringV2(@RequestBody String messageBody) throws IOException{
                  
         //JSON 변환
         HelloData data = objectMapper.readValue(messageBody, HelloData.class);
         log.info("username={}, age={}", data.getUsername(), data.getAge());
         
         return "ok"; // 문자그대로 반환 (@ResponseBody)
         }
}
```

*   @RequestBody 직접 변환 (Json 객체 사용 x)
    *   @RequestBody 생략 불가능
        *   만약에 생략하게 되면, @ModelAttribute로 Spring이 생각하기 떄문에 생략을 불가능하게 만들었다
        *   참고)
            *   @RequestParam :  int, String, Integet 기본 타입시 생략 가능 (자동 지정됨)
            *   @ModelAttribute : 기본 타입 외의 객체인 경우 생략 가능 (자동 지정됨)

```java
@Slf4j
@Controller
public class RequestBodyStringController{
    
    @ResponseBody
    @PostMapping("/main/RequestV3")
    public String requestBodyStringV3(@RequestBody HelloData data){
         
         log.info("username={}, age={}", data.getUsername(), data.getAge());
         
         return "ok";
         }
    
    //객체 자체를 응답 결과에 반환할 수 있다 (@RequestBody 사용)
    @ResponseBody
    @PostMapping("/main/RequestV4)
    public HelloData requestBodyStringV4(@RequestBody HelloData data){
         
         // httpEntity를 이용해서 객체에 담을 수 있다
         log.info("username={}, age={}", data.getUsername(), data.getAge());
         
         return data;
         }
}
```

*   HttpEntity 사용

```java
@Slf4j
@Controller
public class RequestBodyStringController{
       
    @ResponseBody
    @PostMapping("/main/RequestV5")
    public String requestBodyStringV5(HttpEntity<HelloData> httpEntity){
         
         // httpEntity를 이용해서 객체에 담을 수 있다
         HelloData data = httpEntity.getBody();
         log.info("username={}, age={}", data.getUsername(), data.getAge());
         
         return "ok";
         }
         
    
    //HttpEntity 객체를 이용해서 응답으로 반환할 수 있다
    @ResponseBody
    @PostMapping("/main/RequestV6")
    public HttpEntity<HelloData> requestBodyStringV6(HttpEntity<HelloData> httpEntity){
         
         // httpEntity를 이용해서 객체에 담을 수 있다
         HelloData data = httpEntity.getBody();
         log.info("username={}, age={}", data.getUsername(), data.getAge());
         
         return httpEntity;
         }
    
}
```

> 원문: https://gradualprecision.tistory.com/84

---
title: "SpringMVC ( Http 응답 처리 )"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# SpringMVC ( Http 응답 처리 )

## HTTP 응답 방법

*   정적 리소스 
    *   /static , /public, /resources, /META-INF/resources
    *   src/main/resources : 리소스를 보관, 클래스패스의 시작 경로
*   View Template
    *   src/main/resources/templates : 기본 뷰 템플릿 경로
*   HTTP API , 메시지 바디에 직접 입력

## View Template  응답

src/main/resources/templates/response/hello.html  
  
  
<!DOCTYPE html> <html xmlns:th="http://www.thymeleaf.org">  
<head> <meta charset="UTF-8"> <title>Title</title> </head>  
<body>  
    <p th:text="${data}">empty</p>  
</body>  
</html>

*   방법
    *   ModelAndView를 반환
    *   Model을 이용해서 데이터 전달 + URL 문자열로 전달
    *   요청 URL 과 응답 URL 이름이 동일하면 생략 (권장 x -> 명시성이 떨어짐)
*   @ResponseBody, HttpEntity를 사용하면 뷰템플릿이 아닌, HTTP 메시지 바디에 직접 응답 반환을 하는 것

```java
@Controller
public class ResponseView{
    
    @RequestMapping("/response-V1")
    public ModelAndView responseV1(){
         ModelAndView mv = new ModelAndView("response/hello").addObject("data", "hello!");
         
         return mv;
    }
    
    @RequestMapping("/response-V2")
    public String responseV2(Model model){
        model.addAttribute("data", "hello!!");
        return "response/hello";
    }
    
    
    // URL 정보가 같으면 응답 URL 생략 가능
    @RequestMapping("/response/hello")
    public void responseV3(Model model){
        model.addAttribute("data", "hello");
    }
}
```

## HTTP API,  Message Body 응답

*   방법)
    *   HttpServletResponse 이용
    *   ResponseEntity 이용
        *   문자열, 객체 등등 반환 가능
        *   HTTP 상태코드 반환 가능
        *   HTTP 메시지 컨버터 사용됨 ( JSON 형식으로 변경됨 )
    *   @ResponseBody 이용 (messageBody에 그대로 반환)
*   추가 정보)
    *   class Level에 @RestController로 두면, 모든 method에 @ResponseBody 가 적용됨

```java
@Slf4j
@Controller
public class ResponseBody{
    
    @GetMapping("/response-V1")
    public void responseBodyV1(HttpServletResponse response) throws IOException{
        response.getWriter().write("ok");
    }
    
    
    @GetMapping("/response-V2")
    public ResponseEntity<String> responseBodyV2(){
        return new ResponseEntity<>("ok", HttpStatus.OK);
    }
    
    @ResponseBody
    @GetMapping("/response-V3")
    public String responseBodyV3(){
        return "ok";
    }
    
    //ResponseEntity를 이용하여 객체 반환
    @GetMapping("/response-V4")
    public ResponseEntity<HelloData> responseBodyV4(){
        HelloData helloData = new HelloData();
        helloData.setUsername("user");
        helloData.setAge("30");
        
        return new ResponseEntity<>(helloData, HttpStatus.OK);
    }
    
    //@ResponseStatus 로 상태코드 설정
    @ResponseStatus(HttpStatus.OK)
    @ResponseBody
    @GetMapping("/response-V5")
    //객체 직접 반환
    public HelloData responseBodyV5(){
          HelloData helloData = new HelloData();
          helloData.setUsername("user");
          helloData.setAge(30);
          
          return helloData;
     }
}
```

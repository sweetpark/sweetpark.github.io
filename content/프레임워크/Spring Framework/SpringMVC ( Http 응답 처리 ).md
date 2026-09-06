---
title: "SpringMVC ( Http 응답 처리 )"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# SpringMVC ( Http 응답 처리 )

> [!NOTE] 실행 환경
> 버전 명시 없음 — `ResponseEntity`, `@ResponseBody`, `ModelAndView` 등 Spring MVC 표준 API만 사용되어 특정 버전 확정은 어려움.

## HTTP 응답 방법

*   정적 리소스 
    *   /static , /public, /resources, /META-INF/resources
    *   src/main/resources : 리소스를 보관, 클래스패스의 시작 경로
*   View Template
    *   src/main/resources/templates : 기본 뷰 템플릿 경로
*   HTTP API , 메시지 바디에 직접 입력

정적 리소스는 가공 없는 파일을 그대로 내려줄 때, View Template은 서버에서 HTML을 동적으로 렌더링해 내려줄 때, HTTP API는 JSON 등 데이터 자체를 응답해야 할 때 사용한다. 즉 무엇을 반환해야 하는지(고정 파일/렌더링된 화면/데이터)에 따라 셋 중 하나를 고른다.

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

실무에서는 컨트롤러가 뷰 이름을 String으로 반환하는 방식이 가장 널리 쓰인다. ModelAndView를 직접 다루는 것보다 Model을 통한 데이터 전달과 반환값(뷰 이름)이 분리되어 코드가 간결하기 때문이다. 요청 URL과 응답 뷰 이름이 같다고 응답 지정을 생략하면 코드만 봐서는 어떤 뷰로 렌더링되는지 알 수 없어 명시성이 떨어지므로, 특별한 사정이 없다면 생략하지 않는 편이 권장된다.

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

HttpServletResponse를 직접 다루는 방식은 서블릿 API에 코드가 종속되고 상태 코드·헤더 설정을 일일이 작성해야 해 번거롭다. ResponseEntity는 상태 코드와 헤더까지 함께 세밀하게 제어할 수 있어 API 응답을 정교하게 다뤄야 할 때 적합하고, @ResponseBody는 상태 코드 제어가 별도로 필요 없는 단순한 데이터 반환에 적합해 실무에서 가장 자주 쓰인다.

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

## 관련 문서

- [(학습/프레임워크/Spring Framework) HTTP Message Converter](HTTP%20Message%20Converter.md) — 이 노트의 @ResponseBody/ResponseEntity 처리를 담당하는 HTTP 메시지 컨버터의 내부 동작을 다루는 노트
- [(학습/프레임워크/Spring Framework) SPRING MVC 구조 #3 (Dispatcher Servlet, View)](SPRING%20MVC%20구조%20%233%20(Dispatcher%20Servlet,%20View).md) — 이 노트의 View Template 응답 처리가 DispatcherServlet의 render() 단계에서 어떻게 동작하는지를 다루는 노트

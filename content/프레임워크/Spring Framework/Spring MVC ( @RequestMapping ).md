---
title: "Spring MVC ( @RequestMapping )"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring MVC ( @RequestMapping )

RequestMapping #1

## @RequestMapping

*   Handler와 adapter 둘다 우선적으로 사용되는 부분이 RequestMapping 이다
    *   RequestMappingHandlerMapping
    *   RequestMappingHandlerAdapter

## @RequestMapping 사용

```java
@Controller
//@RequestMapping("/main") 을 하면 해당 메서드에 붙은 /main 부분을 생략할 수 있다
public class SpringExampleControllerV1{
    
    @RequestMapping("/main/new-form")
    public ModelAndView process(){
        return new ModelAndView("new-form");
    }
    
    @RequestMapping("/main/save")
    public ModelAndView save(HttpServletRequest request, HttpServletResponse response){
        
        String username = request.getParameter("username");
        int age = Integer.parseInt(request.getParameter("age"));
        
        Member member = new Member(username, age);
        memberRepository.save(member);
        
        ModelAndView mv = new ModelAndView("save-result");
        mv.addObject("member", member);
        return mv;
   }
   
   @RequestMapping("/main")
   public ModelAndView members(){
        
        List<Member> members = memberRepository.findAll();
        
        ModelAndView mv = new ModelAndView("members");
        mv.addObject("members", members);
        return mv;
   }

}
```

*   @Controller
    *   Spring에 컨트롤러(=핸들러)이라는 것을 Mapping 시켜준다
    *   RequestMappingHandlerMapping 이 해당 annotaion을 보고 매핑정보로 인식
*   @RequestMapping("[URL]")
    *   해당 URL을 통해서 들어온 요청을 받고 해당 method를 실행시킨다
*   ModelAndView 반환
    *   ModelAndView를 반환하여 Dispatch Servlet의 doDispatch() 과정을 통해 view를 렌더링한다

## 실용적인 코드로 수정

```java
@Controller
@RequestMapping("/main")
public class SpringExampleControllerV1{
    
    private MemberRepository memberRepository = MemberRepository.getInstance();
    
    @GetMapping("/new-form")
    public String process(){
        return "new-form";
    }
    
    @PostMapping("/save")
    public String save(@RequestParam("username") String username, @RequestParam("age") int age, Model model){
        
        Member member = new Member(username, age);
        memberRepository.save(member);
        
        //post로 들어온 요청의 결과값을 전송하기 위해 Model 사용
        model.addAttribute("member", member);

        return "save-result";

   }
   
   @GetMapping()
   public String members(Model model){
        
        List<Member> members = memberRepository.findAll();
        
        model.addAttribute("members", members);
        return "members";
   }

}
```

*   Spring의 지원 파라미터
    *   Model 파라미터를 사용해서 데이터의 처리 및 전달을 사용할 수 있다
    *   HttpServlerRequest, HttpServletResponse
    *   @RequestParam 을 사용하여 파라미터를 얻을 수 있다 ( request.getParameter() 대신해서 사용 가능 )
*   ViewName 직접 반환  
    *   view의 논리이름을 반환할 수 있다 ( viewResolver() 에서도 지원 하기 때문 )
*   @RequestMapping
    *   @GetMapping , @PostMapping을 통해서 HTTP Method도 구분이 가능하다
    *   똑같은 path를 사용하여 HTTP Method 만 다르게 해서 API 구현 가능
    *   주의) HTTP Method를 지정하지 않고 @RequestMapping 만 사용할경우 모든 Http Method를 허용하게 된다
*   @RequestMapping 사용법
    *   Original
        *   @RequestMapping(value = "/main", method=RequestMethod.GET)
    *   Alias 로 표현
        *   @GetMapping("/main)
    *   나머지 HTTP method도 동일하게 적용된다
    *   method가 지정되어있는데, 다른 method가 요청하면 405 Error를 발생시킨다

## @PathVariable

*   경로에 포함된 변수 값을 파라미터로 사용할 수 있게 하도록 도와주는 annotaion
*   PathVariable 은 다중으로도 사용이 가능하다
*   PathVariable의 경우 파라미터 변수명과 URL 변수명이 같을경우 생략이 가능하다

```java
//RestController를 사용하면 return 값의 텍스트를 view이름이 아니라, 단순히 텍스트로 보고 Http Message에 그대로 전달한다
@RestController
public class Example{
    @GetMapping("/main/{userId}/{orderId}")
    public String mapping(@PathVariable("userId") String data, @PathVariable("orderId") int data2){
        log.info("mapping userId = {}", data);
        return "ok"
    }
    
    @GetMapping("/main/{userId})
    public String mapping(@PathVariable String userId){
        log.info("mapping userId = {}", data);
        return "ok"
    }
}
```

## 조건 mapping

*   특정 파라미터 조건 매핑

@GetMapping(value="/main", prams= "mode=debug")

*   특정 헤더 조건 매핑

@GetMapping(value = "/main", headers = "mode=debug")

*   media Type 조건 매핑
    *   consumes 예시
        *   consumes = "text/palin"
        *   consumes = {"text/plain", "application/*"}
        *   consumes = MediaType.TEXT_PLAIN_VALUE

@PostMapping(value="/main", consumes = "application/json")

*   media Type 조건 매핑 (Accept, produce)
    *   produces = "text/html"
    *   produces = "!text/html"
    *   produces = "text/*"
    *   produces.= " *\/*"

@PostMapping(value = "/main", produces = "text/html")

## HTTP 요청 - 기본, 헤더 조회

```java
@Slf4j
@RestController
public class RequestHeaderController{
    
    @RequestMapping("/main")
    public String headers(HttpServletRequest request, HttpServletResponse response,
                          HttpMethod httpMethod, Locale locale,
                          @RequestHeader("host") String host,
                          @CookieValue(value="myCookie", required=false) String cookie){
            
            log.info("request={}", request);
            log.info("response={}", response);
            log.info("httpMethod={}", httpMethod);
            log.info("locale={}", locale);
            log.info("headerMap={}", headerMap);
            log.info("host={}", host);
            log.info("cookie={}", cookie);
            
            return "ok";
    }
}
```

*   @RequestHeader("[특정헤더]")
    *   필수값 여부 : required
    *   기본값 속성 : defaultValue
*   @Cookievalue
    *   특정 쿠키를 조회한다
    *   필수값 여부 : required
    *   기본값 : defaultValue
*   MultiValueMap
    *   특정 URL 혹은 Key에 여러개의 value가 들어갈경우 사용

MultiValueMap<String, String> map = new LinkedMultiValueMap();  
  
map.add("keyA", "value1");  
map.add("keyA", "value2");  
  
List<String> values = map.get("keyA");

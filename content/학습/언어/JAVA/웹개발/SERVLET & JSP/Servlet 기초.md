---
title: Servlet 기초
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# Servlet 기초

## Servlet ?

*   Servlet은 웹서버의 요청 메서드에 따라서 응답을 만들기 위해서 사용하는 기술
*   Servlet을 관리하는 컨테이너가 웹서버의 요청을 받고, 요청에 따른 응답을 동적으로 생성하여 주는 역할
*   Servlet은 클래스파일로서 사용되고, Tomcat과 같이 사용된다 ( 따라서, Tomcat 서버 구성이  필요 )
    *   Spring boot의 경우 내장 Tomcat이 있어서 사용하기에 수월하다.

## Servlet의 특징

*    Servlet은 어노테이션을 이용하여 지정할 수 있다 (@WebServlet)
    *   @WebServlet의 경우, 필수 입력값으로 "URLPattern='' "을 지정해줘야한다
*   웹 컨테이너의 Client Request 처리 순서  
    *   Servlet Load -> Servlet instance -> Servlet init() -> Client Request
    *   Servlet은 최초의 요청에서만 init을 사용하여 초기화하고, 이후 같은 객체를 재사용하게 된다.
    *   직접적으로 초기화를 진행해주기 위해서는 init()을 Override을 해야한다
*   Servlet의 파라미터 (Request, Response)
    *   Request의 경우 Http 프로토콜에서 요청해온 Http Header 및 Body 내용을 파싱하게 된다.
    *   Response의 경우 처리된 데이터를 Response Header와 Response Body를 HTTP 메서드에 맞게 전달하게 된다.
*   Servlet Service()
    *   Service()의 경우 HttpServlet의 멤버 함수이다 ( HttpServlet을 상속받아야한다. ) 
    *   Service의 메서드 경우, Servlet이 해당 Url에 맞는 요청이 들어왔을 때 요청을 처리하는 로직이 들어가는 부분이다.
    *   Service() @Override를 통해서 해당 로직을 구현할 수 있다.
    *   Servlet의 파라미터를 통해서 Request 처리 / Response 처리를 구현한다

## Spring boot에서의 Servlet 적용

1.  @SpringBootApplication에 @ServletComponentScan을 적용시켜야한다 ( 그래야 Spring이 Servlet을 직접 등록이 가능케 해준다)
2.  HttpServlet을 상속받은 클래스를 이용해서 해당 URL에 맞는 로직을 구현한다

```html
@ServletcomponentScan
@SpringBootApplication
public class Application{
    public static void main(String[] args){
        SpringApplication.run(Application.class,args);
    }
}

@WebServlet(urlPatterns = "/main")
public class TestServlet extends HttpServlet{

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IoException{
        
        //요청 처리 로직 및 응답 생성
        response.getWriter().write("ok"); // 간단한 Response "Ok" 메시지만 보내기
    }
}
```

> 원문: https://gradualprecision.tistory.com/70

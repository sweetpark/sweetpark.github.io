---
title: "Servlet 응답 처리"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# Servlet 응답 처리

## ServletResponse 기본 사용법

*   기본적으로 response 헤더 설정 : setHeader("[field Name]", "[value]")
*   Response 상태 코드 : setStatus("[HTTP 정의 상수]")
*   Headet 편의 메서드 : ContentType, Cookie, Redirect

```html
@WebServlet(urlPatterns="/main")
public class ResponseTest extends HttpServlet{
    
    @Override
    protected void service( HttpServletRequest request, HttpServletResponse response) throws ServletExceptio, IOException
    {
        
        response.setStatus(HttpServletResponse.SC_OK); // 200 상태코드
        
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        
        [Content Type 설정 편의 메서드]
        response.setContentType("text/plain");
        response.setCharsetEncoding("utf-8");
        
        //[쿠키 설정]
        Cookie cookie = new Cookie("TestCookie", "good");
        cookie.setMaxAge(600);
        response.addCookie(cookie);
        
        //[리다이렉트]
        response.sendRedirect("/main/redirect/page");
        
        PrintWriter writer = response.getWriter();
    
        writer.println("ok");
    }
}
```

## Response 텍스트 / HTML

*   PrintWriter 객체를 이용해서 응답 (텍스트 , html)
*   response.getWriter()을 이용하여 반환

```html
@WebServlet(urlPatterns="/main")
public class ResponseTest extends HttpServlet{
    
    @Override
    protected void service( HttpServletRequest request, HttpServletResponse response) throws ServletExceptio, IOException
    {
        
        response.setStatus(HttpServletResponse.SC_OK); // 200 상태코드
        
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        
        PrintWriter writer = response.getWriter();
        
        //단순 텍스트
        writer.println("ok");
        
        //html 반환
        writer.println("<html>");
        writer.println("<body>");
        writer.println("<p> Test </p>");
        writer.println("</body>");
        writer.println("</html>");
        
    }
}
```

## HTTP API JSON

```html
public class TestObject{
    private String username;
    private int count;
    
    void setUsername(String username)
    {
        this.username = username;
    }
    
    void setCount(int count)
    {
        this.count = count;
    }
    
    String getUsername()
    {
        return this.username;
    }
    
    int getCount()
    {
        return this.count;
    }
}

@WebServlet(urlPatterns="/main")
public class TestResponse extends HttpServlet{
    
    private ObjectMapper objecvtMapper = new ObjectMapper();
    
    @Override
    protected void service(HttpServletREquest request, HttpServletResponse response) throws ServletException, IOException{
        
        //application/json 은 utf-8을 사용하도록 정의되있다 ( 굳이 추가하지 않아도 됨 )
        response.setHeader("content-type", "application/json");
        response.setCharacterEncoding("utf-8");
        
        TestObject data = new TestObject();
        data.setUsername("test");
        data.setCount(20);
        
        String result = objectMapper.writeValueAsString(data);
        
        response.getWriter().wirte(result);
    }
}
```

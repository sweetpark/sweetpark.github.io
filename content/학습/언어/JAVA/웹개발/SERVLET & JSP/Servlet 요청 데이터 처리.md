---
title: "Servlet 요청 데이터 처리"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# Servlet 요청 데이터 처리

1. 쿼리 파라미터 (GET)  
2. HTML Form (POST)  
3. HTTP message body

## 쿼리 파라미터

http://localhost:8080/main**?name=test&count=2**

*   message body에 내용 없이, URL의 ?[query] 부분에 추가되어 데이터가 전달됨
*   GET 메서드에서 사용
*   검색 / 필터 / 페이징에서 많이 사용하는 방식

```html
@WebServlet(urlPatterns = "/main")
public class RequestGet extends HttpServlet{
    
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException{
        
        
        // 전체 조회
        Enumeration<String> parameterNames = request.getParameterNames();
        
        while (parameterNames.hasMoreElements()) {
            String paramName = paramterNames.nextElement();
        }
        
        
        //단일 조회
        String name = request.getParameter("name");
        
        
        //이름이 같은 복수 파라미터 조회
        String[] names = request.getParamterValues("name");
     }
   }
```

## HTML Form

*   Content-Type : application/x-www-form-urlencoded
*   message body 부분에 쿼리파라미터 형태로 전달
*   회원가입 / 상품 주문 / HTML Form 사용
*   **쿼리 파라미터 조회법이랑 동일**

## HTTP message Body

*   HTTP API 에서 주로 사용
*   json / xml / Text

```html
@WebServlet(urlPatterns = "/main")
public class APIServlet extends HttpServlet{
    
    @Override
    protected void service(HttpServletRequest request, HttpsServletResponse response) throws ServletException, IOException
    {
        ServletInputStream inputStream = request.getInputStream();
        
        String messageBody = StreamUtils.copyToString(inputStream, StandardCharset.UTF-8)
    }
}
```

*   Json 형태일경우, json 변환 라이브러리를 사용해야한다
*   spring MVC의 경우, Jackson 라이브러리를 함께 제공한다 **( ObjectMapper )**

```html
@WebServlet(urlPatterns = "/main")
public class APIServlet extends HttpServlet{
    
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    protected void service(HttpServletRequest request, HttpsServletResponse response) throws ServletException, IOException
    {
        ServletInputStream inputStream = request.getInputStream();
        
        String messageBody = StreamUtils.copyToString(inputStream, StandardCharset.UTF-8);
        
        Object object = objectMapper.readValue(messageBody, Object.class);
    }
}
```

> 원문: https://gradualprecision.tistory.com/71

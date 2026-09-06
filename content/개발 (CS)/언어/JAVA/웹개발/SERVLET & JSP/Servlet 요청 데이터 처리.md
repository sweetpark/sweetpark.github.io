---
title: "Servlet 요청 데이터 처리"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# Servlet 요청 데이터 처리

Servlet에서 클라이언트 요청 데이터를 읽는 세 가지 방식을 정리한 노트다. GET의 쿼리 파라미터와 POST의 HTML Form(`application/x-www-form-urlencoded`)은 둘 다 `request.getParameter()` 계열 메서드로 동일하게 조회하며, HTTP API처럼 JSON/XML 본문을 그대로 받는 경우에는 `request.getInputStream()`으로 메시지 바디를 읽은 뒤 Jackson `ObjectMapper`로 변환해야 한다.

> [!NOTE] 실행 환경
> `@WebServlet` 어노테이션 기반 등록 방식이 사용되어 Servlet 3.0 이상을 전제로 한다. JSON 처리에는 Jackson `ObjectMapper`(Spring MVC가 기본 제공)가 사용되지만, 구체적인 Servlet/Jackson 버전은 코드상 명시되어 있지 않다.

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

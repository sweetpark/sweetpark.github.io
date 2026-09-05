---
title: "JSP 이론 및 기초 문법"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# JSP 이론 및 기초 문법

1. JSP ?  
2. JSP 구성 및 동작  
3. JSP 문법

## JSP ?

*   JAVA Server Page
*   서버 사이드 템플릿 엔진
*   JAVA언어를 사용할 수 있다

## JSP 구성 및 동작

*   구성
    *   CLIENT  < - > Server (+ JSP)
*   동작

1.  Client 요청 (Request)
2.  Server 해당 JSP 찾기
3.  JSP file을 java 코드로 변환 ( .jsp -> .java )
4.  **java 코드를 컴파일** ( .java -> .class )
5.  class file을 수행해서 Server에 내용 전달
6.  Server는 해당 데이터를 이용해서 html을 구성
7.  Client에 응답 (html 전달)

*   동작에서 중요한 점
    *   **Jsp -> Java 코드 변환** (servlet 코드로 변환) -> (컴파일) servlet 클래스
        *   HttpServlet 상속
        *   Request, Response 사용 가능 ( 요청, 응답 처리 가능 )

## JSP 문법

*   JSP는 XML 표준을 준수해야함

| 문법 요소 | 표준 문법 | xml 문법 |
| --- | --- | --- |
| 주석 | <%-- ... --%> |  |
| 선언 (변수, 메서드) | <%! .. %> | ... |
| 지시어 | <%@ include .. %> |  |
| 지시어 | <%@ page .. %> |  |
| 지시어 | <%@ taglib .. %> | xmlns:prefix="tag library URL" |
| 표현식 | <%= .. %> | ... |
| 스크립트 | <% ... %> | ... |

*   jsp Action
    *   JSP에 내장된 action 문법

|  |  |
| --- | --- |
| jsp:include | 페이지 요청시 파일을 포함 |
| jsp:usebean | JavaBean을 찾거나 인스턴스화 |
| jsp:setProperty | JavaBean 속성 설정 |
| jsp:getProperty | JavaBean 속성 출력 |
| jsp:forward | 페이지 이동 (리다이렉트) |
| jsp:plugin | Java Plugin |
| jsp:element | XML요소를 동적으로 구성 |
| jsp:attribute | 동적으로 정의된 XML 요소의 속성을 정의 |
| jsp:body | 동적으로 정의된 XML 요소의 본문을 정의 |
| jsp:text | 텍스트 작성 |

*   내포된 객체
    *   <% .. %> 안에서 java 구문을 작성할때, 하위 객체들이 포함되어있으므로 바로 사용이 가능하다 (참고)

| 객체 | 해당 객체 클래스 |
| --- | --- |
| request | HttpServletRequest |
| response | HttpServletResponse |
| out | PrintWriter |
| session | HttpSession |
| application | ServletContext |
| config | ServletConfig |
| pageContext | JspWriters |
| page | Java의 this 역할 (자기 참조) |
| Exception | 예외 객체 |

*   제어 흐름  
    *   조건문
    *   반복문

```html
1. IF - ELSE 문

<%! int day = 3; %>
<html>
   <head> test </head>
   
   <body>
       <% if (day == 1 || day ==7) { %>
           <p> weekend </p>
       <% } else { %>
           <p> not weekend </p>
       <% } %>
  </body>
</html>

2. Switch 문

<%! int day = 3; %>
<html>
   <head> test </head>
   
   <body>
       <%
           switch(day){
               case 0:
                   out.println("it's Sunday");
                   break;
               ...
           }
       %>
  </body>
</html>

3. 반복문

<%! int day = 3; %>
<html>
   <head> test </head>
   
   <body>
      <% while ( day != 5) { %>
          <p> <%= day %> </p>
          <% day++; %>
      <% } %>
  </body>
</html>
```

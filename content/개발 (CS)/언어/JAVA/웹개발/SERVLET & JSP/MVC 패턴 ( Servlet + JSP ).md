---
title: "MVC 패턴 ( Servlet + JSP )"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# MVC 패턴 ( Servlet + JSP )

MVC 패턴 적용

## MVC 패턴 적용

*   Servlet
    *   "컨트롤러" 로서 사용
    *   Client 요청 처리
    *   핵심 비즈니스 담당
    *   /WEB-INF 하위에 jsp를 두어서 서버 내부에서 리다이렉트 사용 (로직 숨기기)
*   JSP 
    *   View의 목적으로 사용
    *   Servlet의 결과 내용을 토대로 웹 페이지 렌더링
*   Model
    *   Servlet과 JSP의 중간층에 위치
    *   Servlet의 데이터 내용을 저장했다가, JSP에 전달해주는 역할
    *   Model을 사용함으로써, JSP는 비즈니스 로직을 몰라도 된다

## MVC 패턴 적용 예제 ( 회원 관리 예제 )

*   Servlet -> Controller
*   JSP -> View
*   HttpServletRequest , HttpServletResponse -> Model

HttpServletRequest와 HttpServletResponse의 경우 요청에 따른 데이터 처리 값을 생애주기 동안 저장하고 있을 수 있다.

*   회원 , 회원 리포지토리 클래스

```java
class Member{
    private Long id;
    private String name;
    private int age;
    
    public Member(String name, int age)
    {
        this.name = name;
        this.age = age;
    }
    
    public void setId(Long id) { this.id = id;}
    public Long getId () { return this.id; }
    
    public void setName(String name) { this.name = name; }
    public String getName() { return this.name; }
    
    public void setAge(int age) {this.age = age;}
    public int getAge() { return this.age;}
}

class MemberRepository{
     
     private final static MemberRepository instance = new MemberRepository();
     
     public static getInstance()
     {
         return this.instance;
     }
     
     private MemberRepository() {}
     
     private Map<Long, Member> store = new HashMap<>();
     private static long sequence = 0L;
     
     public void save(Member member)
     {
        member.setId(++sequence);
        store.put(member.getId(), member);
     }
     
     public List<Member> findAll()
     {
         return new ArrayList<>(store.values());
     }
}
```

*   회원 등록 폼

```html
<!-- java 코드 -->

@WebServlet(urlPatterns="/new-form")
public class NewForm extends HttpServlet{

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String viewPath = "/WEB-INF/new-form.jsp"
        RequestDispatcher dispatcher = request.getRequestDispatrcher(viewPath);
        dispatcher.forward(request, response);
    }
}

<!-- html form (/WEB-INF/new-form.jsp) -->
<%@ page contentType="text/html; charset=UTF-8" language="java" %>
<html>
<head>
    <title> test  </title>
</head>
<body>

<form action="save" method="post">
     name: <input type="text" name="name" />
     age: <input type="text" name="age" />
     <button type="submit"> 전송 </button>
</form>

</body>
</html>
```

*   회원 저장
    *   _**${member.id}**_ 의 경우 jsp에서 지원해주는 문법 (request.setAttribute로 저장된 데이터값 사용)
    *   원래 코드 : **_<%= request.getAttribute("member") %>_**

```html
<!-- java 코드 ( url = save ) -->

@WebServlet(urlPatterns="save")
public class SaveServlet extends HttpsServlet{
    private MemberRepository memberRepository = MemberRepository.getInstnace();
    
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException{
        
        String name = request.getParameter("name");
        int age = Integer.parseInt(request.getParameter("age"));
        
        Member member = new Member(name,age);
        memberRepository.save(member);
        
        request.setAttribute("member", member);
        
        String viewPath = "/WEB-INF/save-result.jsp";
        RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
        dispatcher.forward(request, response);
    }
}

<!-- html ( /WEB-INF/save-result.jsp ) -->
<%@ page contentType="text/html; charset=UTF-8" language="java" %>
<html>
<head>
</head>

<body>
성공
<ul>
    <li> id=${member.id}</li>
    <li> name=${member.name}</li>
    <li> age=${member.age}</li>
</ul>
</body>
</html>
```

*   회원 조회

```html
<!-- java code (조회) -->
@WebServlet(urlPatterns="/members")
public class ListServlet extends HttpServlet{
    
    private MemberRepository memberRepository = MemberRepository.getInstance();
    
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException{
         
         List<Member> members = memberRespository.findAll();
         
         request.setAttribute("members", members);
         
         String viewPath = "/WEB-INF/members.jsp"
         RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
         dispatcher.forward(request,response);
         }
    }
    
    
    
    
<!-- html code (/WEB-INF/members.jsp) -->

<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<html>
 <head>
     <meta charset="UTF-8">
     <title>Title</title>
 </head>
<body>
<a href="/index.html">메인</a> 
  <table>   
     
     <thead>
       <th>id</th>
       <th>username</th>
       <th>age</th>
     </thead>
     
     <tbody>
     <!-- taglib 사용 : prefix:"c" , library : "http://java.sun.com/jsp/jstl/core"-->
     <c:forEach var="item" items="${members}">
         <tr>
             <td>${item.id}</td>
             <td>${item.username}</td>
             <td>${item.age}</td>
         </tr>
     </c:forEach>
     </tbody>
     
   </table>

</body>
 </html>
```

## JSP & Servlet MVC 패턴 정리

*   정리
    *   JSP 는 View의 목적으로 사용
    *   MODEL의 경우 HttpServletRequest를 이용하여 데이터를 컨트롤러에서 담고 JSP에 전달
    *   /WEB-INF 하위에 .jsp를 둠으로써 서버 내부에서 Redirect를 진행하였고, Client의 경우 해당 이동을 인지하지 못하게 함 ( 비즈니스 로직 숨김 )

*    한계
    *   반복적인 코드 사용 ( JSP forward 관련 코드 )
    *   컨트롤러 공통 처리 부분의 어려움 ( servlet이 각 기능마다 따로 설계되어있고, 공통적으로 처리하는 부분이 존재하지 않음 -> JSP forward )

> 원문: https://gradualprecision.tistory.com/76

---
title: "순수 JSP 예제"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# 순수 JSP 예제

Servlet 없이 JSP 파일 안에 스크립틀릿(`<% %>`)으로 비즈니스 로직(회원 저장, 조회)과 HTML 렌더링을 함께 작성한 예제다. 핵심은 이 방식이 view와 로직이 한 파일에 섞여 유지보수가 어렵고 비즈니스 로직이 노출된다는 한계를 보여주는 데 있으며, 문서 끝의 "한계" 절에서 이 문제가 MVC 패턴 도입의 이유로 이어진다고 정리한다.

> [!NOTE] 실행 환경
> 표준 JSP 지시어(`<%@ page %>`)만 사용되어 특정 Servlet/JSP 버전을 코드에서 특정할 근거는 없다. 실습하려면 JSP를 지원하는 Servlet 컨테이너(Tomcat 등) 환경이 필요하다.

JSP 회원 관리

## JSP 회원 등록 폼

*   new-form.jsp

```html
<%@ page contentType="text/html; charset=UTF-8" language="java" %>
<html>
<head>
    <title> test </title>
</head>
<body>
    
    <form action="save.jsp" method="post>
         name: <input type="text" name="username" />
         age: <input type="text" name="age" />
         <button type="submit">전송</button>
    </form>

</body>
```

## 회원 저장

*   save.jsp

```html
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

<!-- save.jsp -->

<%@ page import=MemberRepository" %>
<%@ page import=Member" %>
<%@ page contentType="text/html; charset=UTF-8" language="java" %>

<%
    MemberRepository memberRepository = MemberRepository.getInstance();
    
    String name = request.getParameter("name");
    int age = request.getParameter("age");
    
    Member member = new Member(name,age);
    memberRepository.save(member);
%>

<html>
<head>
    <meta charset="UTF-8">
</head>
<body>
    성공
    <ul>
        <li> id = <%= member.getId() %> </li>
        <li> name = <%= member.getName() %> </li>
        <li> age = <%= member.getAge() %> </li>
    </ul>
    <a href="/main"> 메인 </a>
</body>
</html>
```

## 회원 목록

*   members.jsp

```html
<!-- members.jsp -->

<%@ page import="java.util.List" %>
<%@ page import="MemberRepository" %>
<%@ page import="Member" %>
<%@ page contentType="text/html; charset=UTF-8" language="java" %>

<%
    MemberRepository memberRepository = MemberRepository.getInstance();
    List<Member> members = memberRepository.findAll();
%>

<html>
<head>
    <meta charset="UTF-8">
</head>
<body>
    <a href="/main"> 메인 </a>
    <table>
        <thread>
            <th> id </th>
            <th> name </th>
            <th> age </th>
        </thread>
        <tbody>
        
        <%
            for (Member member: members) {
                out.write("    <tr>");
                out.write(".        <td>" + member.getId() + "</td>");
                out.write(".        <td>" + member.getName() + "</td>");
                out.write(".        <td>" + member.getAge() + "</td>");
                out.write(".   </tr>");
            }
        %>
        </tbody>
     </table>
     
</body>
</html>
```

## 한계

*   JSP파일 하나에 비즈니스 로직 및 html (view) 영역이 섞여있다
*   유지보수가 어렵다
*   비즈니스 로직이 노출되어있다
*   -> MVC 패턴의 도입 이유

---
title: "Servlet 예제 ( 회원 저장 / 조회 )"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# Servlet 예제 ( 회원 저장 / 조회 )

1. 구성  
2. 구현  
3. 정리

## 구성

*   멤버 객체 구현 
    *   이름 , 나이
*   멤버 저장
    *   메모리 저장
*   멤버 조회
    *   전체 조회
    *   특정 id 조회

## 구현

*   java 클래스내부에 print 객체와 함께 동적 html을 생성한다
*   html 코드로 인해, 코드가 길어지고 가독성이 떨어진다 (유지보수의 어려움)

```java
public class Member{
    private Long id;
    private String username;
    private int age;
    
    
    public Member(){
    }
    
    public Member(String username, int age)
    {
        this.username = username;
        this.age = age;
    }
    
    
    public int getId()
    {
        return this.id;
    }
    
    public void setId(int id)
    {
        this.id = id;
    }
    
    
    public String getUsername()
    {
         return this.username;
    }
    
    public void setUsername(String username)
    {
         this.username = username;
    }
    
    public int getAge()
    {
         return this.age;
    }
    
    public void setAge(int age)
    {
        this.age = age;
    }
    
}

class MemberRepository{

     private Map<Long, Member> store = new HashMap<>();
     private static long sequence = 0L;
     
     
     private final static MemberRepository instance = new MemberRepository();
     
     private static MemberRepository getInstance()
     {
         return instance;
     }
    
    
    private MemberRepository(){}
    
    public Member save(Member member)
    {
        member.setId(++sequence);
        store.put(member.getId(), member);
        return member;
    }
    
    public Member findById(Long id)
    {
        return store.get(id);
    }
    
    public List<Member> findAll()
    {
         return ArrayList<>(store.values());
    }
    
}

@WebServlet(urlPatterns="/servlet/members/new-form")
public class MemberFormServlet extends HttpServlet{

    @Override
    protected void service (HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        response.setContentType("text/html");
        response.setCharacterEncoding("utf-8");
        
        PrintWriter w = response.getWriter();
        w.write( "<!DOCTYPE html>\n" + "<html>\n" + "<head>\n" + "<meta charset=\"UTF-8\">\n" + "</head>\n" + "<body>\n"
        + "<form action=\"/servlet/members/save\" method=\"post\">\n"
        + "username : <input type=\"text\" name=\"username\" /> \n"
        + " age : <input type=\"text\" name=\"age\" />\n"
        + "<button type=\"submit\"> 전송 </button>\n"
        + "</form>"
        + "</body>"
        + "</html>" );
    }
}

@WebServlet(urlPatterns="/servlet/members/save")
public class MemberSaveServlet extends HttpServlet{

    private MemberRepository memberRepository = MemberRepository.getInstance();
    
    @Override
    protected void service ( HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        String username = request.getParameter("username");
        int age = Integer.parseInt(request.getParameter("age"));
        
        Member member = new Member(username, age);
        memberRepository.save(member);
        
        response.setContentType("text/html");
        response.setCharacterEncoding("utf-8");
        
        PrintWriter w = response.getWriter();
        w.write("<html>\n" + "<head>\n" + "<meta charset=\"UTF-8\">\n" + "</head>"
        + "<body>\n" + "성공\n" 
        + "<ul>\n" 
        + " <li>id=" + member.getId() + "</li>\n"
        + " <li>username=" + member.getUsername() + "</li>\n"
        + " <li>age=" + member.getAge() + "</li>\n"
        + "</ul>\n"
        + "</body>"
        + "</html>" );
    }
}
```

## 정리

*   장점
    *   자바 코드로 되어있어, 객체 값을 가져오기가 수월하다
    *   서블릿을 통해 웹서비스의 동적 html을 만들수 있다
*   단점
    *   html을 직접 자바코드로 만들면서 반복적인 부분들이 존재한다
    *   코드의 길이가 길어지면서 가독성이 떨어진다
    *   분리되어있지 않아 유지보수의 어려움이 존재한다

단점들을 보완하고자, "템플릿 엔진"이 나오게 되었다

> 원문: https://gradualprecision.tistory.com/73

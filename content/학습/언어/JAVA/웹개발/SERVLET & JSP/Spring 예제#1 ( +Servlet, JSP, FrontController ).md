---
title: "Spring 예제#1 ( +Servlet, JSP, FrontController )"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# Spring 예제#1 ( +Servlet, JSP, FrontController )

회원 생성 및 조회 예제

## FrontController 목적

*   각각의 Controller마다 공통적인 부분을 처리 및 Servlet의 종속된 코드 수정 필요
    *   문제)
        *   jsp 페이지 경로 (중복되는 부분)
        *   dispatcher.forward의 반복
        *   Controller에서 잘 사용되지 않는, HttpServletRequest + HttpServletResponse (Servlet 종속)
        *   Model , View, Controller 분리된 코드의 필요성

*   View의 영역에서도 jsp의 forward을 공통적으로 계속해서 처리해줘야했음
    1.  jsp 이름의 공통적인 부분을 viewResolver()를 이용하여 처리
    2.  MyView클래스를 이용하여 forward 하는 부분을 공통적으로 처리할 수 있도록 수정
*   HttpServletRequest 및 HttpServletResponse의 종속성을 최대한 줄이는 목적 (Controller에서 사용안할때도 많음)
    1.  데이터 저장 및 전달의 역할은 ModelView의 Map(String, Object)을 이용
    2.  MyView 클래스의 modelToRequestAttribute() 에서 마지막에 ModelView에서 사용되던 데이터 Object를 request.setAttribute를 이용하여 request로 전달

## Front-Controller 도식화

![](https://blog.kakaocdn.net/dna/dyfaEm/btsJj0oce0H/AAAAAAAAAAAAAAAAAAAAAGLhFm5Q1rHbrpvxCtxRuvQVA81sK7YZ9acIwiT3x6K7/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=te6129el9gY1iQ%2FObOrgXIBtiJA%3D)

## Model  생성

*   Model 역할로서 데이터를 전달하는 역할
*   추가로, View 이름까지 전달하는 역할
    1.  View 페이지 이름 저장
    2.   Map을 통해 필요한 데이터값 저장 (데이터는 객체 형태) -> request.getParameter + request.setParameter 처럼 사용 목적
*   예시) Key("member") , value( [Member 객체] )

```java
public class ModelView{
    
    private String viewName;
    private Map<String, Object> model = new HashMap<>();
    
    public ModelView(String viewName) {
        this.viewName = viewName;
    }
    
    public String getViewName() {
        return viewName;
    }
    
    public void setViewName(String viewName){
        this.viewName = viewName;
    }
    
    public Map<String,Object> getModel() {
        return model;
    }
    
    public void setModel(Map<String, Object> model){
        this.model = model;
    }
}
```

## Controller 로직을 위한 인터페이스

*   HttpServlet의 service() 부분과 유사한 Controller 로직 실행 구간 추상화
*   실제로 paramMap에는 request.getParameter("name") 처럼 사용 목적
    *   예시) Key(name) , value([폼에서 넘어온 이름])

```java
public interface Controller{

    ModelView process(Map<String, String> paramMap);
}
```

## Controller 생성

*   view 이름 지정
*   paramMap을 통해 데이터를 처리 -> request.getParameter + request.setParameter 처럼 사용 목적

```java
//new-form Controller
public class MeberFormController implements Controller{
    
    @Override
    public ModelView process(Map<String, String> paramMap){
         return new ModelView("new-form");
    }  
}

//save Controller
public class MemberSaveController implements Controller{
    
    private MemberRepository memberRepository = MemberRepository.getInstance();
    
    @Override
    public ModelVIew process(Map<String, String> paramMap){
        String name = paramMap.get("name");
        int age = Integer.parseInt(paramMap.get("age"));
        
        Member member = new Member(name, age);
        memberRepository.save(member);
        
        ModelView mv = new ModelView("save-result");
        mv.getModel().put("member", member);
        return mv;
    }
}

//list Controller
public class MemberListController implements Controller{
     
     private MemberRepository memberRepository = MemberRepository.getInstance();
     
     @Override
     public ModelView process(Map<String, String> paramMap){
         
         List<Member> members = memberRepository.findAll();
         
         ModelView mv = new ModelView("members");
         mv.getModel().put("members", members);
         
         return mv;
     }
}
```

## FrontController 생성

*   FrontController 생성 당시 ControllerMap 초기화 ( Controller 맵핑 준비 )
    *   요청에서 들어온 URL을 통해 맞는 Controller을 호출 (맵핑 진행)
*   Controller을 특정했으면, 요청에 들어온 데이터를 ParamMap에 저장
*   ParamMap을 Controller로 보내고 로직 실행
*   MyView를 이용하여 렌더링

```java
@WebServlet(urlPatterns="/main/*")
public class FrontControllerServlet extends HttpServlet{

    private Map<String, Controller> controllerMap = new HashMap<>();
    
    // 필요한 ViewName 초기화 (Controller 조회 Map)
    public FrontControllerServlet(){
        controllerMap.put("/main/new-form", new MemberFormController());
        controllerMap.put("/main/save", new MemberSaveController());
        controllerMap.put("/main/members", new MemberListController());
    }
    
    
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) 
    throws ServletException, IOException{
        
        String requestURI = request.getRequestURI();
        
        // 요청 URL -> 해당 controller controllerMap에서 꺼내기
        Controller controller = controllerMap.get(requestURI);
        if(controller == null)
        {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        
        //request의 요청에 맞는 parameter 생성
        Map<String, String> paramMap = createParamMap(request);
        
        //controller에 파라미터를 넘겨서 로직 수행
        ModelView mv = controller.process(paramMap);
        
        // controller에서 데이터 처리한 ModelView를 이용하여 MyView로 전송 (jsp 호출)
        String viewName = mv.getViewName();
        MyView view = viewResolver(viewName);
        view.render(mv.getModel(), request, response);
    }
    
    
    private Map<String, String> createParamMap(HttpServletRequest request){
        Map<String, String>paramMap = new HashMap<>();
        
        request.getParameterNames()
        .asIterator()
        .forEachRemaining( paramName -> paramMap.put(paramName, request.getParameter(paramName)));
        
        return paramMap;
    }
    
    
    private MyView viewResolver(String viewName){
         return new MyView("/WEB-INF/" + viewName + ".jsp");
    }
    
}
```

## View 생성

*   jsp로 forward 해주는 역할
*   jsp페이지로 넘어가기전에 paramMap에 들어있던 model 객체를 Request에 저장함 -> modelToRequestAttribute

```java
public class MyView{
     
     private String viewPath;
     
     public MyView(String viewPath) {
         this.viewPath = viewPath;
     }
     
     public void render(HttpServletRequest request, HttpServletResponse response)
       throws ServletExcetpion,IOException{
           
           RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
           dispatcher.forward(request,response);
      }
      
      public void render(Map<String, Object> model, HttpServletRequest request, HttpServletResponse response)
       throws ServletExcetpion,IOException{
           
           modelToRequestAttribute(model,request);
           
           RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
           dispatcher.forward(request,response);
      }
      
      private void modelToRequestAttribute(Map<String, Object> model, HttpServletRequest request) {
           model.forEach( (key,value) -> request.setAttribute(key, value));
      }
}
```

## 부가적인 코드

*   Member, MemberRepository

```java
public class Member {

    private Long id;
    private String name;
    private int age;

    public Member(){

    }

    public Member(String name, int age){
        this.name = name;
        this.age = age;
    }
    
    //Getter,Setter
}

public class MemberRepository {

    private Map<Long, Member> store = new HashMap<>();
    private static long sequence = 0L;

    private static final MemberRepository instance = new MemberRepository();

    private MemberRepository(){

    }

    public static MemberRepository getInstance(){
        return instance;
    }

    public Member save(Member member){
        member.setId(++sequence);
        store.put(member.getId(), member);
        return member;
    }

    public Member findById(Long id){
        return store.get(id);
    }

    public List<Member> findAll(){
        return new ArrayList<>(store.values());
    }

    public void clearStore(){
        store.clear();
    }

}
```

*   new-form / list / save JSP 파일

```java
<!-- /WEB-INF/members.jsp -->
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
    <thread>
    <th>id</th>
    <th>username</th>
    <th>age</th>
    </thread>
    <tbody>
    <c:forEach var="item" items="${members}">
        <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.age}</td>
        </tr>
    </c:forEach>
    </tbody>
</table>

</body>
</html>

<!-- /WEB-INF/new-form -->
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
 <html>
 <head>
     <meta charset="UTF-8">
     <title>Title</title>
 </head>
<body>
<form action="save" method="post">
name: <input type="text" name="name" /> age: <input type="text" name="age" />
<button type="submit">전송</button>
 </form>
 </body>
</html>

<!-- /WEB-INF/save -->
 <%@ page contentType="text/html;charset=UTF-8" language="java" %>
 <html>
 <head>
     <meta charset="UTF-8">
 </head>
<body> 성공 <ul>
     <li>id=${member.id}</li>
     <li>username=${member.name}</li>
     <li>age=${member.age}</li>
</ul>
<a href="/index.html">메인</a>
</body>
</html>
```

> 원문: https://gradualprecision.tistory.com/77

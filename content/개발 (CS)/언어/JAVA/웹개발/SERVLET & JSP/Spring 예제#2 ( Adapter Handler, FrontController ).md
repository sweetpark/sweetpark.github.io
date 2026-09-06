---
title: "Spring 예제#2 ( Adapter Handler, FrontController )"
tags: [JAVA 기반 웹개발, SERVLET & JSP]
created: 2026-09-05
modified: 2026-09-05
---

# Spring 예제#2 ( Adapter Handler, FrontController )

앞선 FrontController 예제가 하나의 `Controller` 인터페이스만 처리할 수 있다는 한계를 어댑터 패턴으로 해결하는 예제다. 핵심은 `MyHandlerAdapter` 인터페이스(supports/handle)를 두고, 핸들러 타입(Controller, Controller2 등)마다 전용 어댑터를 만들어 FrontController가 `getHandlerAdapter()`로 알맞은 어댑터를 찾아 위임하도록 하는 구조다. 이는 실제 Spring MVC의 `HandlerAdapter` 설계와 동일한 아이디어다.

> [!NOTE] 실행 환경
> `@WebServlet` 어노테이션 기반 등록 방식이 사용되어 Servlet 3.0 이상을 전제로 한다. 구체적인 Servlet/Tomcat 버전은 코드상 명시되어 있지 않다.

Adapter handler

## Adapter Handler 사용이유

*   한가지 로직을 실행시키는데에 있어, A/B 경우를 골라야한다면 어떻게 처리해야할지에 대한 의문
    *   frontcontroller 의 경우 한가지 방식의 컨트롤러 인터페이스만 사용 가능

## Adapter Handler 도식화

```text
Client
  └─▶ FrontController.service(request, response)
        └─▶ getHandler(request)              // handlerMappingMap 에서 handler(=controller) 조회
              handler : Controller 객체 or Controller2 객체 (타입이 다를 수 있음)
        └─▶ getHandlerAdapter(handler)        // handlerAdapters 순회하며 supports(handler)==true 인 어댑터 탐색
              ├─ ControllerHandlerAdapter   (supports: handler instanceof Controller)
              └─ Controller2HandlerAdapter  (supports: handler instanceof Controller2)
        └─▶ adapter.handle(request, response, handler)
              └─▶ (형변환 후) controller.process(paramMap) → ModelView 반환
        └─▶ viewResolver(mv.getViewName()) → MyView
        └─▶ view.render(mv.getModel(), request, response)  // JSP forward
```

## 수정해야하는 부분

*   FrontController class에서 Controller를 객체 그대로 받는 경우가 수정되어야한다

(Before)  
private Map<String, Controller> controllerV3Map = new HashMap<>();  
  
(After)  
MyHandlerAdapter adapter = getHandlerAdapter(handler);  
ModelView mv = adapter.handle(request, response, handler);

## Adapter Interface 생성

*   handler == controller
*   adapter는 실제 controller 호출 후 ModelView 반환

```java
public interface MyHandlerAdapter{
     
     boolean supports(Object handler);
     
     ModelView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
        throws ServletException,IOException;
     }
     
}
```

## Adapter 생성

*   각각의 인터페이스의 맞는 어뎁터 생성
*   Controller , Controller2

```java
public class ControllerHandlerAdapter implements MyHandlerAdapter{

    @Override
    public boolean supports(Object handler){
        return (handler instanceOf Controller);
    }
    
    
    @Override
    public ModelView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
    {
         // 해당 컨트롤러 인터페이스로 캐스팅
         Controller controller = (Controller) handler;
         
         // 이후 작업은 동일
         Map<String, String> paramMap = createParamMap(request);
         
         ModelView mv = controller.process(paramMap);
         return mv;
    }
    
    private Map<String, String> createParamMap(HttpServletRequest request){
         Map<String,String> paramMap = new HashMap<>();
         
         request.getParameterNames().asIterator()
           .forEachRemaining(paramName -> paramMap.put(paramName, request.getParameter(paramName)));
         
         return paramMap;
    }    
   
}

public class Controller2HandlerAdapter implements MyHandlerAdapter{
    
    @Override
    public boolean supports(Object handler)
    {
        return (handler instnaceOf Controller2);
    }
    
    @Override
    public ModelView handle(HttpServletRequest request, HttpServletResponse response, Object handler){
        
        Controller2 controller = (Controller2) handler;
        
        // 이후 작업은 동일
         Map<String, String> paramMap = createParamMap(request);
         
         ModelView mv = controller.process(paramMap);
         return mv;
    }
    
    private Map<String, String> createParamMap(HttpServletRequest request){
         Map<String,String> paramMap = new HashMap<>();
         
         request.getParameterNames().asIterator()
           .forEachRemaining(paramName -> paramMap.put(paramName, request.getParameter(paramName)));
         
         return paramMap;
        
     }
}
```

## FrontController 수정

*   Controller 와 Controller2의 map을 준비
*   adapter를 이용한 handler(==controller) 호출

```java
//adapter 하위로 들어오는 경우 모두 타겟팅
@WebServlet(urlPatterns="/main/adapter/*")
public class FrontController extends HttpServlet{
    
    private final Map<String, Object> handlerMappintMap = new HashMap<>();
    private final List<MyHandlerAdapter> handlerAdapters = new ArrayList<>();
    
    public FrontController(){
       initHandlerMappingMap();
       initHandlerAdpaters();
    }
    
    private void initHandlerMappingMap(){
        handlerMappingMap.put("/main/adapter/controller/new-form", new MemberFormController());
        handlerMappingMap.put("/main/adapter/controller/save", new MemberSaveController());
        handlerMappingMap.put("/main/adapter/controller/members", new MemberListController());
        
        handlerMappingMap.put("/main/adapter/controller2/new-form", new MemberFormController2());
        handlerMappingMap.put("/main/adapter/controller2/save", new MemberSaveController2());
        handlerMappingMap.put("/main/adapter/controller2/members", new MemberListController2());
    }
    
    private initHandlerAdapters(){
        handlerAdapters.add(new ControllerHandlerAdapter());
        handlerAdapters.add(new Controller2HandlerAdapter());
    }
    
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletExcetption, IOException{
        
        Object handler = getHandler(request);
        
        if(handler == null){
             response.setStatus(HttpServletResponse.SC_NOT_FOUND);
             return;
        }
        
        MyHandlerAdapter adapter = getHandlerAdapter(handler);
        
        ModelView mv = adapter.handle(request, response, handler);
        
        String viewName = mv.getViewName();
        MyView view = viewResolver(viewName);
        
        view.render(mv.getModel(), request, response);
        
     }
     
     private MyHandlerAdapter getHandlerAdapter(Object handler) {
        for (MyHandlerAdapter adapter : handlerAdapters) {
            if(adapter.supports(handler)){
                return adapter;
            }
        }
        throw new IllegalArgumentException("Handler adapter를 찾을 수 없습니다. handler " + handler);
    }

    private Object getHandler(HttpServletRequest req) {
        String requestURI = req.getRequestURI();
        Object handler = handlerMappingMap.get(requestURI);

        return handler;
    }

    private MyView viewResolver(String viewName) {
        return new MyView("/WEB-INF/views/" + viewName + ".jsp");
    }
 
 }
```

## 정리

*   Controller1 과 Controller2의 경우, 같은 로직의 이름만 다르게해서 Adapter를 적용해보았다
*   하지만, 인터페이스 구조가 다를경우 ControllerHandlerAdapter가 서로 다른 구조였을 것이다 ( handle() 부분 )
*   이렇듯, adapter를 사용하면 "변압기"처럼 원하는 것을 끼우며 사용할 수있다
*   더 나아가, Annotaion을 지원하게 된다면 스프링과 유사하게 프레임워크를 구성할 수 있게 된다.

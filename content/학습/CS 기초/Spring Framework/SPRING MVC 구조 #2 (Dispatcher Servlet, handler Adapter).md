---
title: "SPRING MVC 구조 #2 (Dispatcher Servlet, handler Adapter)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# SPRING MVC 구조 #2 (Dispatcher Servlet, handler Adapter)

Dispatcher Servlet #2  
- handler Adapter

## Handler Adapter

*   Dispatcher Servlet의 메서드 중 하나인 doDispatcher()의 역할로 컨트롤러의 맞는 어뎁터를 찾고 로직을 실행하게 된다
*   어뎁터는 말그대로, 변압기와 같이 적절하게 맞는 규격을 맞춰주는 역할을 수행하게 된다

## Handler Adapter 과정

*   먼저, doDispatch()에서 찾은 Controller(==handler) 정보를 가지고, 해당 어뎁터를 찾게 된다.

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
        HttpServletRequest processedRequest = request;
        HandlerExecutionChain mappedHandler = null;
        boolean multipartRequestParsed = false;
        WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);

        try {
            try {
                ModelAndView mv = null;
                Exception dispatchException = null;

                try {
                    processedRequest = this.checkMultipart(request);
                    multipartRequestParsed = processedRequest != request;
                    mappedHandler = this.getHandler(processedRequest);
                    if (mappedHandler == null) {
                        this.noHandlerFound(processedRequest, response);
                        return;
                    }
					
                    // mapping 되었던 핸들러(컨트롤러)의 파라미터를 가지고 해당 어뎁터를 찾게된다. (doDispatch())
                    HandlerAdapter ha = this.getHandlerAdapter(mappedHandler.getHandler());
                    String method = request.getMethod();
                    boolean isGet = HttpMethod.GET.matches(method);
                    if (isGet || HttpMethod.HEAD.matches(method)) {
                        long lastModified = ha.getLastModified(request, mappedHandler.getHandler());
                        if ((new ServletWebRequest(request, response)).checkNotModified(lastModified) && isGet) {
                            return;
                        }
                    }
```

*   getHandlerAdapter()
    *   Handler Adapter 우선순위

0. RequestMappingHandlerAdapter ( // annotaion 기반의 컨트롤러인 @RequestMapping에서 사용 )  
1. HttpRequestHandlerAdapter ( // HttpRequestHandler 처리 )  
2. SimpleControllerHandlerAdapter ( // Controller 인터페이스 ( annotaion (x) , 과거에 사용 ) 처리
```java
protected HandlerAdapter getHandlerAdapter(Object handler) throws ServletException {
        if (this.handlerAdapters != null) {
            // handler 찾을때와 동일하게 가지고 있는 handlerAdapter들중에 맞는 정보를 반복문을 통해 찾게된다.
            Iterator var2 = this.handlerAdapters.iterator();

            while(var2.hasNext()) {
                HandlerAdapter adapter = (HandlerAdapter)var2.next();
                if (adapter.supports(handler)) {
                    return adapter;
                }
            }
        }
```

*   supports() 정보를 통해 adapter를 반환하게 된다  
    *   adapter의 handle() 메서드의 경우, 실제 컨트롤러의 수행을 담당하게 되는 method 이다
    *   handler() 메서드를 실행함으로써, ModelAndView를 반환하게 된다

```java
public interface HandlerAdapter {
    boolean supports(Object handler);

    @Nullable
    ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception;

    /** @deprecated */
    @Deprecated
    long getLastModified(HttpServletRequest request, Object handler);
}

//doDispatch()
// handle() 메서드
mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
```

## 추가) Handler Adapter 커스텀

*   Handler Adapter의 경우에는 컨트롤러의 따라서 따로 커스텀화 할 가능성이 존재한다
    *   절차
        *   HandlerAdapter인터페이스를 활용해서 구현체(HandlerAdapter)를 만든다
        *   Spring 설정 정보를 추가 및 수정 (web.xml 혹은 @Bean으로 해당 어뎁터를 저장)
        *   마지막으로, 해당 handler를 맵핑해주면 된다
    *   handler mapping Type
        *   **BeanNameUrlHandlerMapping**: 빈 이름을 URL로 매핑
        *   **RequestMappingHandlerMapping**: 애노테이션 기반 매핑 (@RequestMapping 등)
        *   **SimpleUrlHandlerMapping**: URL 패턴과 핸들러를 명시적으로 매핑
        *   **DefaultAnnotationHandlerMapping**: 과거 애노테이션 기반 매핑 (이제는 RequestMappingHandlerMapping으로 대체됨)
        *   **ControllerClassNameHandlerMapping**: 컨트롤러 클래스 이름을 URL로 매핑
        *   **SimpleServletHandlerAdapter**: 서블릿을 핸들러로 사용
        *   **AbstractHandlerMapping**: 모든 매핑 클래스의 부모 클래스
        *   **PathPatternHandlerMapping**: 최적화된 경로 패턴 매핑(Spring 5+)

## 정리

*   Hadle Adapter의 경우, 맵핑된 handler(Controller)를 통해서 support()되는 어뎁터를 찾게된다
*   찾은 adapter를 통해 handle() 메서드를 통해서 Controller를 실행하고, 그의 결과값을 ModelAndView 클래스로 반환하게 된다
*   이후, 결과값인 ModelAndView를 이용하여 View의 전달하게 된다.
*   다음 포스팅으로 View 처리를 알아보도록 하자

> 원문: https://gradualprecision.tistory.com/80

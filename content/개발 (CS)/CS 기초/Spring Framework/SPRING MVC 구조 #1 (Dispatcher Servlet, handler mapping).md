---
title: "SPRING MVC 구조 #1 (Dispatcher Servlet, handler mapping)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# SPRING MVC 구조 #1 (Dispatcher Servlet, handler mapping)

Dispatcher Servlet #1  
- handler mapping

## Dispatcher Servlet 이란?

*   HTTP 요청으로 Client가 보낸 요청메시지를 가장 먼저 받는 역할을 맡는다.
*   해당 요청에 대한 정보에 대한 컨트롤러의 메서드 실행을 위한 준비를 한다
*   Request에 대한 처리와 해당 컨트롤러와의 연계, 응답을 위한 View에 전달하는 역할을 한다

## Dispatcher Servlet 구조 및 Handler Mapping 과정

상속관계  
  
1.  java.lang.Object  
2. jakarta.servlet.GenericServlet  
3. jakarta.servlet.http.HttpServlet  
4. org.springframework.web.servlet.HttpServletBean  
5. org.springframework.web.servlet.FrameworkServlet  
6. org.springframework.web.servlet.DispatcherServlet

*   FrameWorkServlet 인터페이스
    *   protected void service([HttpServletRequest](https://jakarta.ee/specifications/platform/9/apidocs/jakarta/servlet/http/HttpServletRequest.html) request, [HttpServletResponse](https://jakarta.ee/specifications/platform/9/apidocs/jakarta/servlet/http/HttpServletResponse.html) response) throws [ServletException](https://jakarta.ee/specifications/platform/9/apidocs/jakarta/servlet/ServletException.html), [IOException](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/io/IOException.html) 메서드를 이용하여 요청이 들어온 것에 대한 처리를하면서 processRequest 과정에서 doService()를 호출하게 된다.

```java
protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        if (HTTP_SERVLET_METHODS.contains(request.getMethod())) {
            super.service(request, response);
        } else {
            this.processRequest(request, response);
        }

    }

//processRequest()
protected final void processRequest(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        long startTime = System.currentTimeMillis();
        Throwable failureCause = null;
        LocaleContext previousLocaleContext = LocaleContextHolder.getLocaleContext();
        LocaleContext localeContext = this.buildLocaleContext(request);
        RequestAttributes previousAttributes = RequestContextHolder.getRequestAttributes();
        ServletRequestAttributes requestAttributes = this.buildRequestAttributes(request, response, previousAttributes);
        WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
        asyncManager.registerCallableInterceptor(FrameworkServlet.class.getName(), new RequestBindingInterceptor());
        this.initContextHolders(request, localeContext, requestAttributes);

        try {
            this.doService(request, response);
        }
        //...
```

*   DispatcherSerlvet 인터페이스
    *   doService()를 통해 호출을 받아 doDispatch()를 호출하게 된다 
    *   protected void doDispatch([HttpServletRequest](https://jakarta.ee/specifications/platform/9/apidocs/jakarta/servlet/http/HttpServletRequest.html) request, [HttpServletResponse](https://jakarta.ee/specifications/platform/9/apidocs/jakarta/servlet/http/HttpServletResponse.html) response) throws [Exception](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Exception.html) 메서드를 이용하여 해당 Controller로 처리하기 위해 getHandler를 호출할게 된다

```java
protected void doService(HttpServletRequest request, HttpServletResponse response) throws Exception {
        this.logRequest(request);
        Map<String, Object> attributesSnapshot = null;
        if (WebUtils.isIncludeRequest(request)) {
            attributesSnapshot = new HashMap();
            Enumeration<?> attrNames = request.getAttributeNames();
//...

	try {
            this.doDispatch(request, response); // do.Dispatch() 호출
        } finally {
            if (!WebAsyncUtils.getAsyncManager(request).isConcurrentHandlingStarted() && attributesSnapshot != null) {
                this.restoreAttributesAfterInclude(request, attributesSnapshot);
            }

            if (this.parseRequestPath) {
                ServletRequestPathUtils.setParsedRequestPath(previousRequestPath, request);
            }

        }

// doDispatch()

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
                    //mapping 되어있는 handler 정보를 찾게 된다
                    
                    if (mappedHandler == null) {
                        this.noHandlerFound(processedRequest, response);
                        return;
                    }
```

*   getHandler의 메서드  
    *   spring이 @Controller 혹은 @Bean으로 등록해준 컨트롤러의 정보를 hadlermappings 에 저장을 해놓고, 반복문을 통해 mapping을 진행

```java
protected HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
        if (this.handlerMappings != null) {
            Iterator var2 = this.handlerMappings.iterator();

            while(var2.hasNext()) {
                HandlerMapping mapping = (HandlerMapping)var2.next();
                HandlerExecutionChain handler = mapping.getHandler(request);
                if (handler != null) {
                    return handler;
                }
            }
        }
```

*   getHandler() 메서드의 mapping 차즌 반복문 우선 순위

0. RequestMappingHandlerMapping ( // annotation 기반의 컨트롤러인 @RequestMapping 에서 사용 )  
1. BeanNameUrlHandlerMapping ( // spring bean의 이름으로 핸들러를 찾음 )

## 정리

*   Client의 Request의 첫번째 요청에 따른 처리 과정을 Handler Mapping 까지 진행해보았다
*   Dispatcher는 전반적인 제어를 담당하며, handler Adapter를 통해 컨트롤러를 호출하고 처리하는 과정은 다음 문서에서 다룬다.

> 원문: https://gradualprecision.tistory.com/79

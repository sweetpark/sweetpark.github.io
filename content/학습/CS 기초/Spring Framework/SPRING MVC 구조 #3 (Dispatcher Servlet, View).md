---
title: SPRING MVC 구조 #3 (Dispatcher Servlet, View)
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# SPRING MVC 구조 #3 (Dispatcher Servlet, View)

Disptacher #3  
- View Resolver  
- View

## Dispatcher Servlet ( + View)

*   Handler Mapping 과정과 Handler Adapter 과정이 이후에 Controller를 통해 받은 ModelAndView형태의 결과물을 렌더링을 진행하게 된다
*   해당 부분에서 render()함수가 호출되게 된다

## Render()

*   doDispatch() 메서드에서 processDispatchResult() 메서드의 호출로 렌더링이 시작되게 된다.

this.processDispatchResult(processedRequest, response, mappedHandler, mv, (Exception)dispatchException);
```java
private void processDispatchResult(HttpServletRequest request, HttpServletResponse response, @Nullable HandlerExecutionChain mappedHandler, @Nullable ModelAndView mv, @Nullable Exception exception) throws Exception {
        boolean errorView = false;
        if (exception != null) {
            if (exception instanceof ModelAndViewDefiningException) {
                ModelAndViewDefiningException mavDefiningException = (ModelAndViewDefiningException)exception;
                this.logger.debug("ModelAndViewDefiningException encountered", exception);
                mv = mavDefiningException.getModelAndView();
            } else {
                Object handler = mappedHandler != null ? mappedHandler.getHandler() : null;
                mv = this.processHandlerException(request, response, handler, exception);
                errorView = mv != null;
            }
        }

        if (mv != null && !mv.wasCleared()) {
            //render() 호출
            this.render(mv, request, response);
            if (errorView) {
                WebUtils.clearErrorRequestAttributes(request);
            }
        } else if (this.logger.isTraceEnabled()) {
            this.logger.trace("No view rendering, null ModelAndView returned.");
        }
```

*   View Resolver()
    *   해당 역할은 viewName을 포멧에 맞는 view 형식에 맞춰 이름 및 설정정보를 맞추는 역할을 한다

*   render() 과정

1. ViewResolver() 메서드 호출

view = this.resolveViewName(viewName, mv.getModelInternal(), locale, request);

2. render() 메서드 호출

view.render(mv.getModelInternal(), request, response);

```java
protected void render(ModelAndView mv, HttpServletRequest request, HttpServletResponse response) throws Exception {
        Locale locale = this.localeResolver != null ? this.localeResolver.resolveLocale(request) : request.getLocale();
        response.setLocale(locale);
        String viewName = mv.getViewName();
        View view;
        if (viewName != null) {
            // view 이름을 view 형식에 맞는 이름으로 수정 저장
            view = this.resolveViewName(viewName, mv.getModelInternal(), locale, request);
            if (view == null) {
                String var10002 = mv.getViewName();
                throw new ServletException("Could not resolve view with name '" + var10002 + "' in servlet with name '" + this.getServletName() + "'");
            }
        } else {
            view = mv.getView();
            if (view == null) {
                throw new ServletException("ModelAndView [" + mv + "] neither contains a view name nor a View object in servlet with name '" + this.getServletName() + "'");
            }
        }

        if (this.logger.isTraceEnabled()) {
            this.logger.trace("Rendering view [" + view + "] ");
        }

        try {
            if (mv.getStatus() != null) {
                request.setAttribute(View.RESPONSE_STATUS_ATTRIBUTE, mv.getStatus());
                response.setStatus(mv.getStatus().value());
            }
            // 해당 모델에 따른 view 형식을 지정하여 render() 진행
            view.render(mv.getModelInternal(), request, response);
        } catch (Exception var8) {
        
        //...
```

*    View interface
    *   해당 view 인터페이스의 render() 메서드를 통해 다양한 뷰템플릿을 제공하게 된다
    *   내재된 view Template
        *   JSP, thymeleaf, freemarker, velocity, json, xml, pdf 등등
    *   View Template에 맞는 view의 render()를 재정의하여 spring에 등록하면 커스텀화를 통해 사용할 수 있다

```java
public interface View {
    String RESPONSE_STATUS_ATTRIBUTE = View.class.getName() + ".responseStatus";
    String PATH_VARIABLES = View.class.getName() + ".pathVariables";
    String SELECTED_CONTENT_TYPE = View.class.getName() + ".selectedContentType";

    @Nullable
    default String getContentType() {
        return null;
    }

    void render(@Nullable Map<String, ?> model, HttpServletRequest request, HttpServletResponse response) throws Exception;
}
```

## 정리

*   반환값으로 받은 ModelAndView의 저장 내용에 따라, 형식에 맞는 ViewResolver()를 통해 이름을 재지정하고, view 인터페이스의 Render() 메서드를 통해서 렌더링 시작
*   모든 절차가 끝나면, 응답 메시지를 가지고 클라이언트에게 전달
*   Spring 의 HTTP 처리 메커니즘 완료

> 원문: https://gradualprecision.tistory.com/81

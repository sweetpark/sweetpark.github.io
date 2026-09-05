---
title: "Session 사용법"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Session 사용법

session에 대하여...

## Session을 왜 사용하는가?

Cookie는 보안상의 커다란 이슈가 있었다.  
Cookie의 경우 웹 클라이언트에서 임의로 데이터를 조작하여 보낼 수 있는 치명적 단점이 존재  
하여, 세션을 사용하여 서버에 저장하고 클라이언트에게는 임의의 값을 사용하는 방법을 채택하기 위해 Session을 사용하게 되었다.

*   Session으로 UUID (랜덤한 값)을 발급하고 이를 이용하여 cookie와 같이 사용한다
*   추정이 불가능한 값이므로, 보안상 안전도가 올라가게 된다
*   서버의 경우, Session Respository를 따로 관리하게 된다

## 1. 직접 Session 생성

#### Session 생성

```java
private createSession(Object value, HttpServletResponse response){
    
    String sessionId = UUID.randomUUID().toString();
    // DB 또는 메모리에 저장
    store.put(sessionId, value);
}
```

*   sessionId를 UUID값으로 만들어서, 추정하지 못하고 중복되지 않도록 ID 값으로 관리
*   Cookie로 실어서 UUID 값을 보내게 되면, store(session Repository)에서 관리하게 된다
*   session이 만료되거나, 갱신될경우 Session Repository의 데이터 값을 수정하면 된다

#### Session ID , Cookie 전달

```java
public sendCookie(String sessionId, HttpServletResponse response){
    
    Cookie cookie = new Cookie("[CookieID]", sessionId);
    response.addCookie(cookie);
}
```

## 2. Servlet Session

#### session 생성

```java
@PostMapping("test")
public String test(@ModelAttribute Form form, BindingResult bindingResult, HttpServletRequest request){
    
    if(bindingResult.hasErrors()){
        return "home/form";
    }
    
    HttpSession session = request.getSession(default: true);
    session.setAttribute("[sessionId]" , [session에 저장할 value]);
    
    return "redirect:/";
}
```

*   HttpSession 클래스를 이용하여, session을 생성한다
*   request.getSession(Boolean create)
    *   기본값 (true)
        *   세션이 있으면 기존 세션을 반환
        *   세션이 없으면 새로운 세션을 생성 후 반환
    *   false
        *   세션이 있으면 기존 세션을 반환
        *   세션이 없으면 null을 반환

#### session 제거

```java
@PostMapping("/test")
public String sessionExpire(HttpServletRequest request){
    
    HttpSession session = request.getSession(false); // 세션 조회시에는 "false"로 하여 생성하지 않도록 해야함 (주의!)
    if ( session != null ){
        session.invalidate(); // session 제거
    }
    
    return "redirect:/";
}
```

*   session 조회시 false로 해주어서, 세션을 생성하지 않도록 해야함
*   session.invalidate()를 해주지 않을경우, 세션이 삭제되지 않으므로 주의해야함

## 3. Servlet Session 애노테이션

#### session 조회

```java
@GetMapping("/test")
public String test( @SessionAttribute(name= [Session key] , required = false) Object sessionValue, Model model)
{
    
    if (sessionValue == null){
        return "/";
    }
    
    //session 유지시
    //원하는 페이지로 이동
    return "[go to page]";
}
```

*   애노테이션을 이용하여, 손쉽게 세션값을 가져올 수 있다

## Session TimeOut 설정

*   application.properties

server.servlet.session.timeout="원하는 (초) 기록"

*    session.getLastAccessedTime()
    *   session 마지막 접근 시간을 갱신하며, 서버시간에 맞추어서 세션을 만료 시켜도 됨
    *   session.invalidate() 를 사용하여 시간이 도래할경우 세션 만료 로직

---
title: "Cookie 사용법"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Cookie 사용법

Cookie에 대하여...

## Cookie 사용 이유

HTTP 프로토콜의 경우 Stateless 방식의 통신을 한다.  
Stateless 방식의 경우, Client가 요청 -> Server 응답으로 통신이 끝나게 되므로 상태 저장을 하지 않는 문제가 발생한다.  
이때에, 클라이언트 입장에서는 모든 정보를 계속해서 보내야하는 문제가 발생!  
(-> Cookie가 이럴때 사용되게 된다)

*   Cookie는 클라이언트가 만들어서, 서버에게 보내는 일종의 key인 역할이다.
*   해당 key가 서버에 알맞게 저장되어있다면, 서버는 그에 준하는 인증 및 절차를 수행하게 된다
*   문제) 클라이언트가 주체가 되기 때문에, 보안상의 문제가 있을 수 있다 (* 위조)

## Cookie의 종류

*   영속 쿠키
    *   만료 날짜를 입력하면, 해당 날짜까지 쿠키를 유지한다
*   세션 쿠키
    *   만료 날짜를 생략하면 브라우저 종료시 까지만 유지
    *   Session과는 별개의 내용이다

## Cookie 생성 방법

```java
Cookie cookie = new Cookie("[쿠키 key 값]", "value 값");

// HttpServletResponse
response.addCookie(cookie);
```

*   Cookie 클래스를 사용하여 쿠키를 생성
*   HttpServletResponse 응답에 쿠키를 담아서 응답

## Cookie 조회 방법 (Cookie 애노테이션)

```java
@GetMapping("/url")
public String test( @CookieValue(name="cookie key", required="true/false") [dataType (ex Long)] [변수 (ex cookieValue)])
{
    if( cookieValue == null ){
         return reject; // reject.html
    }
    
    //...
}
```

## Cookie 삭제 방법

```java
@PostMapping("/test")
public String test(HttpServletResponse response){
    Cookie cookie = new Cookie("[cookie Key]", null);
    cookie.setMaxAge(0); // 생존 주기 "0" 설정
    response.addCookie(cookie);
    
    return "redirect:/";
}
```

## Cookie 보안 이슈

*   Cookie값의 경우, 개발자모드에서 임의로 값을 변경해서 보낼 수 있다 (* 위조)
*   보안상의 큰 이슈로 인해, 쿠키 값의 경우 Random한 값을 사용하고 서버에 모든 내용이 저장된 형태를 사용하게 된다 (-> 세션)

> 원문: https://gradualprecision.tistory.com/91

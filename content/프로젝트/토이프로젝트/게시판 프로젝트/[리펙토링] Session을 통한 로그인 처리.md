---
title: "[리펙토링] Session을 통한 로그인 처리"
tags: [프로젝트, 게시판 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [리펙토링] Session을 통한 로그인 처리

## 로그인 리펙토링

기존 구조는 HttpSession의 존재 유무만 확인하여 로그인 처리를 진행하고, URL Mapping에서 로그인 아이디로 회원정보를 조회하는 과정에서 사용자가 변경되는 문제를 Interceptor로 방지하고 있었다.  

Interceptor를 통한 방지는 임시방편일 뿐 근본적인 해결책이 아니었다. 원인은 회원정보 조회를 단순화하기 위해 URL에 로그인 아이디를 직접 노출한 설계에 있었다.  

이 구조적인 문제를 해결하기 위해 다음과 같이 리펙토링을 진행한다.  
  
**1. URL 방식의 회원정보를 조회방법을 수정하고자 한다**  
**(현재 생각은, Filter에서 인증처리가 되어있으면 회원정보를 포함 값을 세션저장소에 저장을 한 후 필요한 부분에서 세션저장소에서 값을 가져와서 사용하는 방식이다)**  
  
**2. 현재는 HttpSession으로서 다른 설정없이 사용하여 세션에 대한 유효시간이 지정되어있지가 않다. 따라서 회원 로그인 인증에 유효시간을 정하고 갱신이 가능한 관리의 목적으로 세션저장소를 이용하고자 한다.**

## 스키마

```text
[Client 요청]
      │
      ▼
   [Filter]  ── 세션저장소에 세션 존재 여부 확인 (없으면 로그인 화면으로)
      │ 통과
      ▼
[Interceptor] ── 갱신 필요 시 세션 저장소 유효시간 연장 (슬라이딩)
      │ 통과
      ▼
 [Controller] ── @Resolver(커스텀 어노테이션)로 세션 저장소에서 loginId 조회
      │
      ▼
 [Session Store]  key: sessionId, value: loginId, TTL: 1일(요청마다 갱신)
```

## 세션저장소 구현 방법

*   memchched VS Redis
    *   memchached와 Redis는 외부 저장소 (메모리 기반)
    *   memcached와 Redis는 지속성에서 차이가 남 ( memcached는 서버 재시작시 다 날라감 / Redis는 백업이 가능 )
    *   다중 클라이언트 및 분산처리에서 효과적 ( 다만 외부 서버이므로 네트워크 통신비용이 발생 )
*   local cache
    *   애플리케이션 층에서 실현 가능
    *   애플리케이션 구동 안에서는 O(1) 시간복잡도를 가지므로 효율적

**현재 프로젝트에서는, 지속성을 가져야하는 데이터는 아니므로 redis는 Over Engineering이므로 제외**  
또한, memcached의 경우도 애플리케이션층의 세션저장을 통한 로그인 기능이므로 분산처리를 할 필요가 없다  
  
 따라서, Local cache를 이용하여 로그인 세션 저장소를 구축하고자 한다.

## 로그인 구성

기존 코드는 HttpSession 존재 여부만 확인하는 필터링만 있었고, 로그인된 사용자의 정보 조회를 위해 URL에 사용자 ID를 직접 노출하는 방식으로 구현되어 있었다.  

**수정된 진행상황)**  
**1. HttpSession에 로그인 ID값만 저장 (원래는 회원정보 전체 객체가 들어가 있었음....)**  
**2. HttpSession을 저장할 Store 생성**  
**(세션 생성 1일이후 요청 없을시, 삭제 진행)**  
**(재요청시 갱신을 통한 세션 유지)**  
**3. Controller 로그인 된 사용자 조회를 위해서, Resolver 사용**  
**(커스텀 어노테이션을 만들어서 회원조회 ID를 조회할 수 있도록 만들음)**  
  
이 구조로 변경한 후에는 Interceptor에서의 2차 검증이 불필요해졌고, 로그인 사용자 조회도 Resolver를 통해 단순화되었다. Session Store 도입으로 로그인 회원 관리(유효시간 연장, 로그아웃 처리)도 명확해졌다.

## 세션 저장소 기반 로그인 처리

로그인 세션을 저장소에 보관하고 유효시간을 두어 관리하는 방식으로 전환한다.  
  
0) 기존의 사용자ID로 구성한 URL 수정  
  
**1) 필터 및 인터셉터에서 진행**  
**- 세션저장소에 세션이 있는지 확인 (없으면 -> 로그인화면)**  
**- 세션 자체가 없으면 로그인화면 이동**  
**- 세션 저장소 또는 세션을 통한 페이징 이동이 있을시, 유효시간 연장 (갱신)**  
  
**2) 로그아웃**  
**- 단순히 가지고 있던 session invalidate를 하면 안되고, 세션저장소에 세션을 같이 지워줘야 제대로된 로그아웃 처리가 됨**
시간 제한이 있는 로그인 세션에서 페이지 이동 등 요청이 발생할 때마다 유효시간을 자동으로 연장하는 슬라이딩 방식을 적용하였다. 세션 저장소의 갱신 시점을 요청마다 갱신하도록 구성하면, 1시간의 유효시간을 사용자가 계속 서비스를 이용하는 동안에는 재로그인 없이 유지할 수 있다.

## Filter Vs Spring Interceptor

위의 로그인 처리에서 Filter와 Interceptor를 함께 사용한 이유는 다음과 같다.  
  
Filter와 Spring Interceptor는 요청흐름에서 서로 다른 단계에서 동작하는데, Spring Interceptor는 컨트롤러 진입 전, Filter는 Dispatcher Servlet 진입 전에 실행된다.  
  
세션 저장소는 Spring이 관리하는 Component로 DI하여 세션 유무를 확인해야 하는데, Filter는 Spring 컨텍스트와의 통합도가 Interceptor보다 낮으므로 Spring Interceptor를 사용하는 것이 더 안전하다고 판단하였다.  
  
다만 Filter가 불필요한 것은 아니며, HttpServletRequest/HttpServletResponse 수준의 기본적인 Servlet 처리는 Filter로 구현하였다.

## Git 주소

https://github.com/sweetpark/springBoard

## 다음 코드 수정시 확인

1) @Scheduled의 사용을 위해서는 main application에 @EnableScheduled를 해줘야한다  
2) AES256 패스워드 암호화 적용완료 /board/auth/enc 확인  
3) HandlerMethodArgumentResolver를 통해서 URL에 사용자id @Pathvariable을 제거하고 커스텀 어노테이션을 통해 사용자id를 추출할 수 있었음 (session 내부에 저장되어있던)  
4) session내부에는 많은정보 담아두지 말기

> 원문: https://gradualprecision.tistory.com/234

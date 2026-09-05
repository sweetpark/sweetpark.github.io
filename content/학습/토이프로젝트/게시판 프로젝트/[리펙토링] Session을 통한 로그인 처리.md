---
title: "[리펙토링] Session을 통한 로그인 처리"
tags: [프로젝트, 게시판 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [리펙토링] Session을 통한 로그인 처리

## 로그인 리펙토링..

현재는 HttpSession을 사용하여, 세션이 있는지 없는지에 대한 값만 확인 후 로그인 처리를 진행하고 있으며,  
URL Mapping 에서 로그인 아이디를 통한 맵핑과정에서 사용자를 변경하면 있는 오류를 Interceptor에서 처리하고 있다.  
  
 여기서 문제는 사용자변경건에 대해서는 Interceptor로 방지하였지만 근본적인 해결책이 되지 않았다.. 그렇다면 내가 왜 그렇게 로직을 구성하였는가에 대해서 생각해보면,  
회원정보의 조회를 URL에서 간단하게 사용하려고 하다보니 URL에 로그인 아이디를 기입하여 사용하였다  
  
 이런 방식은 지금의 문제를 근본적으로 해결하기에 어려움이 있다 판단하여 리펙토링을 진행하고자한다  
  
**1. URL 방식의 회원정보를 조회방법을 수정하고자 한다**  
**(현재 생각은, Filter에서 인증처리가 되어있으면 회원정보를 포함 값을 세션저장소에 저장을 한 후 필요한 부분에서 세션저장소에서 값을 가져와서 사용하는 방식이다)**  
  
**2. 현재는 HttpSession으로서 다른 설정없이 사용하여 세션에 대한 유효시간이 지정되어있지가 않다. 따라서 회원 로그인 인증에 유효시간을 정하고 갱신이 가능한 관리의 목적으로 세션저장소를 이용하고자 한다.**

## 스키마

![](https://blog.kakaocdn.net/dna/sBqQb/btsLFdrEZTV/AAAAAAAAAAAAAAAAAAAAAElRLv76Fr0HGp2VdVt1XJga07ftY-u6QeyoELP3dPvm/img.jpg?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=Pqrr0K%2Bv%2Bsr0s9fj4wLlYcFz%2B8g%3D)

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

원래의 코드에서는 단순히 HttpSession이 있는지 없는지에 대한 필터링만 존재했었다.. 그러다보니, 로그인된 사용자의 정보조회를 위해서 URL을 설정하여 진행했었다.. (혼자서 무덤을 팠다.. 다음부턴 생각을 더하자...)  
  
 **수정된 진행상황)**  
**1. HttpSession에 로그인 ID값만 저장 (원래는 회원정보 전체 객체가 들어가 있었음....)**  
**2. HttpSession을 저장할 Store 생성**  
**(세션 생성 1일이후 요청 없을시, 삭제 진행)**  
**(재요청시 갱신을 통한 세션 유지)**  
**3. Controller 로그인 된 사용자 조회를 위해서, Resolver 사용**  
**(커스텀 어노테이션을 만들어서 회원조회 ID를 조회할 수 있도록 만들음)**  
  
 이런식의 수정이 진행이되니, 기존에 Interceptor에서 2차검증이 필요가 없어지고, 로그인 사용자를 조회하는데 더 수월해질 수 있었다...   
 Session Store의 사용으로 로그인된 회원을 관리할 수 도 있으니.. 전보다는 확실히 좋아졌다..  
  
 앞으로 무언가를 개발할때에는 깊이 생각하면서 왜 사용해야하는지를 더 고려하며 코드를 구현해야겠다...

## 세션 사용기..

로그인을 통한 세션을 저장하였고, 해당 세션에 유효시간을 두어 관리하였다..  
이제는 세션저장소를 통한 로그인 처리를 진행해야한다..  
  
0) 기존의 사용자ID로 구성한 URL 수정  
  
**1) 필터 및 인터셉터에서 진행**  
**- 세션저장소에 세션이 있는지 확인 (없으면 -> 로그인화면)**  
**- 세션 자체가 없으면 로그인화면 이동**  
**- 세션 저장소 또는 세션을 통한 페이징 이동이 있을시, 유효시간 연장 (갱신)**  
  
**2) 로그아웃**  
**- 단순히 가지고 있던 session invalidate를 하면 안되고, 세션저장소에 세션을 같이 지워줘야 제대로된 로그아웃 처리가 됨**
생각해보니, 시간 제한이 있는 웹페이지의 로그인 처리에서 페이징 이동이나 무슨 처리를 진행할시 자동으로 연장되는 것을 본적이 있었다..  
이때에 할 수 있는 방법으로 세션저장의 시간 갱신값을 페이징처리로 잡게되면 1시간 유효시간을 잡았던 것을 사용자가 계속해서 이용하고 있으면 빈번하게 로그인해야하는 일을 방지할 수 있다는 것을 알아채고 기능을 넣게 되었다..  
  
리펙토링을 하면서 너무 놓친부분이 많았다는 것을 한번 더 깨닫게 되었다...

## Filter Vs Spring Interceptor

위의 로그인 처리에서 두개다 사용한 이유가 있다...  
  
Filter와 Spring Interceptor는 요청흐름에서 서로 다른 단계에서 위치하여 동작하게 되는데,  
Spring Interceptor는 컨트롤러 전 , Filter는 Dispatcher Servlet전에 실행되게 된다.  
  
내가 사용하려하는 세션저장소는 Spring이 관리하는 Component이고, 이를 DI하여 세션의 유무를 파악하고 진행해야하는데  
필터의 경우 Spring과 통합적인 측면에서는 Spring Interceptor보다 덜하므로, Spring Interceptor를 사용하여 안전성을 올리고자 하였다..  
  
그렇다고 Filter가 안좋다는 것은 아니다.. 기본적인 Servlet 통신에서 사용하는 HttpServletRequest이나 HttpServletResponse로 처리하는 것은 Filter로 구현해놓았다..

## Git 주소

https://github.com/sweetpark/springBoard

## 다음 코드 수정시 확인

1) @Scheduled의 사용을 위해서는 main application에 @EnableScheduled를 해줘야한다  
2) AES256 패스워드 암호화 적용완료 /board/auth/enc 확인  
3) HandlerMethodArgumentResolver를 통해서 URL에 사용자id @Pathvariable을 제거하고 커스텀 어노테이션을 통해 사용자id를 추출할 수 있었음 (session 내부에 저장되어있던)  
4) session내부에는 많은정보 담아두지 말기

> 원문: https://gradualprecision.tistory.com/234

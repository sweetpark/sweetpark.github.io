---
title: "[소셜로그인 #2] 소셜로그인 OAuth2.0 적용하기 (+디자인패턴 : 전략&팩토리)"
tags: [토이프로젝트, 계정 인증 및 인가]
created: 2026-09-05
modified: 2026-09-05
---

# [소셜로그인 #2] 소셜로그인 OAuth2.0 적용하기 (+디자인패턴 : 전략&팩토리)

## 소셜로그인 FLOW

```text
[내 서버]                              [외부 인증 서버 (구글/네이버/카카오)]
   │  1. 외부 인증서버 요청               │
   │ ───────────────────────────────▶  │
   │                                    │  2. 로그인 처리
   │  3. code 값 획득                    │
   │ ◀───────────────────────────────  │
   │  4. code로 accessToken 발급 요청     │
   │ ───────────────────────────────▶  │
   │  5. accessToken 수신                │
   │ ◀───────────────────────────────  │
   │  accessToken으로 계정정보 요청       │
   │ ───────────────────────────────▶  │
   │  계정정보 수신                      │
   │ ◀───────────────────────────────  │
   │  6. 자체 서버(DB)에 저장             │
   ▼
```

## 소셜로그인 방식

외부 서버 : 구글, 네이버, 카카오 등.. (소셜로그인을 제공하는 회사)  
내 서버 : 개발중인 애플리케이션 서버

1.  외부 인증서버 요청 (내 서버)
2.  외부 인증서버 로그인 (외부 서버)
3.  로그인 후 발급되는 code 값 획득 ( 내 서버 )
4.  code값을 통한 외부 서버 accessToken 발급 ( 내 서버 )
5.  accessToken을 이용해서 외부서버 계정정보 획득 ( 내 서버 )
6.  자체 서버 저장 ( 내 서버 )

## parameter 값

## 1. code 값 : 사용자가 로그인 할 경우, 해당 사용자에 대한 정보 인증을 위해 code 값 제공 (외부 서버 -> 로그인 요청 서버)

*   해당 code값을 이용해서 외부서버와의 통신을 위해서 access Token 발급 (내 서버 -> 외부 서버)
*   code값은 개발자센터에 등록한 redirect URL을 통해 전달

2. access Token 값 : access Token을 이용해서, 외부 서버와 통신이 가능

*   해당 access Token 을 이용하여 사용자 정보 요청 가능 (내 서버 -> 외부 서버)
*   이외에도, 사용자 정보/ 로그아웃 / 기타 기능 등을 제공한다.

## 요청 URL 정보

1. 로그인 요청 URL

Body(APPLICATION_FORM_URLENCODED, GET METHOD)  
- API CLIENT ID : API KEY ID  
- 콜백 주소 : code값 받는 엔드포인트  
- 요청할 범위 : 요청할 데이터 범위

*   https://kauth.kakao.com/oauth/authorize
*   https://accounts.google.com/o/oauth2/auth
*   https://nid.naver.com/oauth2.0/authorize

2. Access Token 발급 URL

Body (APPLICATION_FORM_URLENCODED, POST METHOD)  
- API CLIENT ID : API KEY  
- API CLIENT KEY : API SERCRET KEY  
- 콜백 주소 : 로그인 요청시 사용했던 콜백주소 (동일해야함)  
- code값 : 콜백주소로 응답값으로 준 code 값 (인증용)

*   https://kauth.kakao.com/oauth/token
*   [https://oauth2.googleapis.com/token](https://oauth2.googleapis.com/token)  
*   https://nid.naver.com/oauth2.0/token

3. 사용자 정보 조회 URL

Header ( AccessToken , APPLICATION_JSON TYPE , GET METHOD)

*   https://kapi.kakao.com/v2/user/me
*   https://people.googleapis.com/v1/people/me?personFields=emailAddresses,names
*   https://openapi.naver.com/v1/nid/me

## 전략 패턴 & 팩토리 패턴

**전략패턴  
**  
1. **공통 인터페이스 정의**: 모든 소셜 로그인 공급자(예: 구글, 페이스북, 트위터 등)가 공통으로 수행해야 하는 작업(로그인 요청, ACCESS TOKEN 발급, 사용자 정보 조회)을 하나의 인터페이스로 통일.  
  
2. **각 공급자별 구현**: 각 소셜 로그인 공급자는 해당 인터페이스를 구현하여, 공급자 고유의 로직을 작성.  
  
3. 장점: 클라이언트는 구체적인 구현 방식에 의존하지 않고, 인터페이스에 정의된 메서드만 호출하면 되므로, 코드의 결합도를 낮추고 새로운 공급자를 추가할 때도 클라이언트 코드를 수정할 필요 없음  
  
   
**팩토리 패턴**  
  
1. **동적 객체 생성**: 로그인 요청 시 전달된 정보를 기반으로, 어떤 소셜 로그인 공급자를 사용할지 결정하고 해당 전략 객체를 생성  
  
2. **런타임 유연성 제공**: 요청마다 외부 로그인이 달라질 수 있으므로, 팩토리 패턴을 사용하여 적절한 전략 객체를 동적으로 반환  
  
3. 장점: 클라이언트 코드가 직접 어떤 객체를 생성할지 결정하지 않고, 팩토리에서 생성한 객체를 사용함으로써 의존성이 줄어들고 코드의 확장성이 용이

## 코드 예시

```java
//전략 패턴
public interface SocialLoginStrategy {
    Map<String, Object> getUserInfo(String accessToken);
    String getAccessToken(String code, String state);
    String getProviderId(Map<String, Object> userInfo);
    void saveMember(Map<String, Object> userInfo);
    Member getMember(Map<String, Object> userInfo);
}

// 팩토리 패턴
public class SocialLoginFactory {
    private final NaverLoginStartegy naverLoginStartegy;
    private final GoogleLoginStartegy googleLoginStartegy;
    private final KakaoLoginStrategy kakaoLoginStategy;

    public SocialLoginStrategy getLoginStrategy(String provider){
        switch (provider.toLowerCase()){
            case "naver":
                return naverLoginStartegy;
            case "google":
                return googleLoginStartegy;
            case "kakao":
                return kakaoLoginStategy;
            default:
                throw new CustomApiException("No Support " + provider);
        }
    }
}
```

## 소셜로그인 개발자센터

[https://developers.naver.com/main/](https://developers.naver.com/main/)

 [NAVER Developers

네이버 오픈 API들을 활용해 개발자들이 다양한 애플리케이션을 개발할 수 있도록 API 가이드와 SDK를 제공합니다. 제공중인 오픈 API에는 네이버 로그인, 검색, 단축URL, 캡차를 비롯 기계번역, 음

developers.naver.com](https://developers.naver.com/main/)

[https://developers.kakao.com/](https://developers.kakao.com/)

 [Kakao Developers

카카오 API를 활용하여 다양한 어플리케이션을 개발해보세요. 카카오 로그인, 메시지 보내기, 친구 API, 인공지능 API 등을 제공합니다.

developers.kakao.com](https://developers.kakao.com/)

[https://console.cloud.google.com/auth/overview](https://console.cloud.google.com/auth/overview)

 [Google 클라우드 플랫폼

로그인 Google 클라우드 플랫폼으로 이동

accounts.google.com](https://console.cloud.google.com/auth/overview)

## + 추가 정보) 소셜로그인 Spring Securit Filter 이용하기

AbstractAuthenticationProcessingFilter
1. 커스터마이징 : attemptAuthentication() 수정  
2. 해당 메서드에서, RestTemplate또는 다른 방식을 이용하여 외부 인증서버에 요청 (사용자 계정 획득)  
   - fetchAccessToken() : 외부 인증서버 accessToken 발급받기  
   - fetchUserDetails() : 외부 인증서버에 사용자 정보 요청
```bash
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

import java.io.IOException;
import java.util.Collections;

public class CustomOAuth2LoginFilter extends AbstractAuthenticationProcessingFilter {

    public CustomOAuth2LoginFilter(String defaultFilterProcessesUrl) {
        super(defaultFilterProcessesUrl);
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws OAuth2AuthorizationException {

        // 요청에서 code 값을 추출
        String code = request.getParameter("code");
        if (code == null) {
            throw new OAuth2AuthorizationException("Authorization code is missing");
        }

        // 토큰 발급 요청
        String accessToken = fetchAccessToken(code);

        // 사용자 정보 요청 (accessToken을 이용하여 API 호출)
        CustomOAuth2User userDetails = fetchUserDetails(accessToken);

        // Spring Security 인증 객체 생성
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, accessToken, userDetails.getAuthorities());

        return authentication;
    }

    private String fetchAccessToken(String code) {
        // 외부 OAuth 서버에 code를 전달하여 accessToken을 요청하는 로직
        // (REST API 호출 또는 WebClient 사용)
        return "mock_access_token"; // 실제로는 OAuth 서버에서 받은 accessToken을 반환
    }

    private CustomOAuth2User fetchUserDetails(String accessToken) {
        // accessToken을 사용하여 사용자 정보를 가져오는 로직 (예: Google, Kakao API 호출)
        return new CustomOAuth2User("user@example.com", Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                            FilterChain chain, Authentication authResult)
            throws IOException, ServletException {
        SecurityContextHolder.getContext().setAuthentication(authResult);
        getSuccessHandler().onAuthenticationSuccess(request, response, authResult);
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              OAuth2AuthorizationException failed)
            throws IOException, ServletException {
        getFailureHandler().onAuthenticationFailure(request, response, failed);
    }
}
```

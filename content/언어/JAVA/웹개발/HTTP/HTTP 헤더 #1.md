---
title: "HTTP 헤더 #1"
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP 헤더 #1

1. HTTP Header  
2. HTTP Body

## HTTP 헤더 분류

*   General 헤더
    *   메시지 전체에 적용되는 정보 
    *   ex) Connection : close

*   Request 헤더 ( 요청 정보 )
    *   Negotiation Content ( 협상 )
        *   Accept
            *   클라이언트가 선호하는 미디어 타입 전달
            *   구체적인 것이 우선 ( text/* , text/plain , application/* ...)
        *   Accept-Charset
            *   클라이언트가 선호하는 문자 인코딩
        *   Accept-Encoding
            *   클라이언트가 선호하는 압축 인코딩
            *   gzip , deflate ...
        *   Accept-Language
            *   클라이언트가 선호하는 자연언어 ( ko , en, en-US ...)
            *   0~1 (1과 가까울 수록 우선순위가 높음)
    *   일반 정보
        *   From
            *   유저 에이전트의 이메일 정보
        *   Referer
            *   이전 웹페이지 주소
        *   User-Agent
            *   유저 에이전트 애플리케이션 정보
        *   Host
            *   요청한 호스트 정보 (도메인)
        *   Authorization
            *   클라이언트 인증 정보를 서버에 전달
    *   쿠키 정보
        *   Cookie 
            *   클라이언트가 서버에서 받은 쿠기를 저장하고, HTTP 요청시 서버로 전달

*   Response 헤더
    *   전송 방법
        *   단순 전송
            *   Content-Length
        *   압축 전송
            *   Content-Encoding
            *   gzip, deflate ...
        *   분할 전송 (Transfer - encoding)
            *   Transfer-Encoding : chunked
        *   범위 전송
            *   Content-Range : bytes 1001-2000 / 2000
    *   일반 정보
        *   Server 
            *   요청을 처리하는 Origin 서버의 소프트웨어 정보
        *   Location (Redirect)
            *   웹 브라우저 3xx 상태코드에 따라, Location 헤더 위치로 이동
        *   Allow
            *   허용 가능한 HTTP 메서드 (GET, POST) -> 이외의 메서드 사용 불가 (*405 상태코드 (Method Not Allowed) )
        *   WWW- Authenticate
            *   리소스 접근시 필요한 인증방법 정의
            *   401 Unauthorized 응답과 함께 사용
    *   쿠키 정보
        *   Set-Cookie
            *   서버에서 클라이언트로 쿠키 전달
            *   무상태 프로토콜 (HTTP)이므로 이전의 일들을 기억하지 못함 -> 매번 데이터를 줘야함 ( 그래서, 쿠키를 이용 )
        *   쿠키 설정
            *   생명주기
                *   expires = [날짜]
                *   max-age =[시간(초)] 
            *    도메인
                *   domain : 명시한 도메인 쿠키 접근
            *   경로
                *   path : 경로를 포함한 하위경로 페이지만 쿠키 접근
            *   보안
                *   Secure : HTTPS인 경우에만 쿠키 전송
                *   HttpOnly : 자바스크립트 접근 불가, HTTP 전송에만 사용
                *   SameSite : XSRF 공격 방지 (요청 도메인과 쿠키에 설정된 도메인이 같을경우에만 사용)

*   Representation 헤더 ( (구) Entity 헤더 )
    *   Representation ( (구) Entity ) 바디 정보
        *   Content-Type ( 표현 데이터 형식 ) 
            *   본문 데이터 유형 + 문자 인코딩
        *   Content-Encoding  ( 표현 데이터의 압축 방식 )
            *   표현 데이터를 압축하기 위해 사용
            *   데이터를 전달하는 곳에서 압축 후 인코딩 헤더 추가
            *   인코딩 헤더의 정보로 압축 해제 ( gzip, deflate, identity .. )
        *   Content-Language ( 표현 데이터의 자연 언어 )
            *   표현 데이터의 자연언어 ( ko, en, en-US )를 표현 
        *   Content-Length ( 표현 데이터의 길이 )  
            *   주의) Transfer-Encoding (전송 코딩)을 사용하면 Content-Length 사용 불가

## HTTP 바디

*   Representation 본문( (구) Entity 본문 )== message 본문
    *   Representation 본문은 요청이나 응답에서 전달할 데이터
    *   Representation 헤더는 이 본문의 데이터를 해석할 수 있는 정보 제공

HTTP/1.1 200 OK  
Content-Type: application/json; charset=UTF-8 <- Representation 헤더  
Content-Length: 15 <- Representation 헤더  
  
{name : "test"} <- Representation 본문

> 원문: https://gradualprecision.tistory.com/68

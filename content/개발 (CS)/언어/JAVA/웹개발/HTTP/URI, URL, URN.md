---
title: "URI, URL, URN"
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# URI, URL, URN

URI, URL, URN의 관계와 각각의 스키마 문법을 정리한 노트다. 핵심은 URI가 URL과 URN을 포괄하는 상위 개념이고, URL은 리소스가 "어디에 있는지"(위치)로, URN은 리소스가 "무엇인지"(이름)로 식별한다는 차이다.

> [!NOTE] 실행 환경
> 본 문서는 특정 프로그래밍 언어/프레임워크에 종속되지 않는 URI 일반 문법을 다루며, 버전 정보가 필요하지 않다.

1. URI  
2. URL  
3. URN

## URI (Uniform Resource Identifier)

*   인터넷에 있는 자원을 나타내는 주소
    *   Uniform : 리소스 식별하는 통일된 방식
    *   Resource : 자원 (자원에 대해 제한 없음)
    *   Identifier : 구분하는데 필요한 정보
*   URI안에 URL , URN 이 포함됨

## URI 스키마

scheme://[user[:password]@]host[:port][/path][?query][#fragment]  
  
ex)  
https://www.google.com:443/search?q=hello#getting-spring-info

*   schme
    *   주로 프로토콜 정보를 사용 (http , https ... )
*   user[:password]@
    *   사용자 정보를 포함해서 인증 (거의 사용 안함)
*   host
    *   도메인 명
*   port  
    *   접속 포트
    *   일반적으로 생략 ( 80 - http, 443 - https )
*   path
    *   리소스 경로
    *   계층적 구조
*   query
    *   key=value 형태
    *   "?" 로 시작, "&"로 추가 가능
    *   ?q=hello&hl=ko
*   fragment
    *   "#"으로 시작
    *   html 내부 북마크로 사용
    *   서버에 전달 x
    *   ex) #getting-spring-info

## URL

*   Uniform Resource Locator
    *   리소스가 위치한 정보를 나타냄
    *   리소스 위치가 변경될때마다 다른 URL을 요청해야함
*   URI가 URL로 사용됨
*   URI와 동일한 스키마를 가짐

## URN

*   Uniform Resource Name
    *   리소스의 이름으로 식별하는 역할
    *   NID (Namespace Identifier) : 네임스페이스 식별자
    *   NSS (Namespace Specific String) : 네임스페이스 특정 문자열
*   URL과 다르게 리소스의 위치가 다르더라도, 해당 리소스를 식별할 수 있다

## URN 스키마

"urn:" <NID> ":" <NSS>  
  
ex) urn:isbn:0451450523

## 관련 문서

- [(학습/프레임워크/Spring Framework) HTTP 이론 - 핵심 개념 및 특징 정리](../../../../../프레임워크/Spring%20Framework/[Spring]%20HTTP%20이론%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트의 URI/URL/URN 내용을 HTTP 전체 흐름과 함께 종합 정리한 강의 노트

---
title: "HTTP 헤더 #2 ( Cache 와 조건부 헤더  )"
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP 헤더 #2 ( Cache 와 조건부 헤더  )

HTTP 캐시와 조건부 요청에 쓰이는 헤더들을 정리한 노트다. 요청마다 같은 데이터를 매번 다시 전달하는 네트워크 낭비를 줄이기 위해 `Cache-Control`로 캐시 생명주기를 정하고, `ETag`/`Last-Modified` 같은 검증 헤더로 캐시된 데이터가 여전히 유효한지 서버에 확인(조건부 요청)하는 방식이 핵심이다. 검증에 통과하면 응답 본문 없이 캐시를 재사용할 수 있다.

> [!NOTE] 실행 환경
> 본 문서는 특정 언어/프레임워크 버전에 종속되지 않는 HTTP 캐시/조건부 요청 헤더 시맨틱을 다룬다.

Cache 와 조건부 헤더
캐시가 필요한 이유  
  - 요청할때마다 같은 데이터일지라도 전달해줘야한다  
  - 캐시를 적용하면 네트워크를 사용하지 않아됨

## Cache Header

*   Cache-Control
    *   Cache 생명주기 설정가능
*   Last-Modified
    *   Cache 생명주기 끝나고, 데이터가 아직도 유효한지 체크하기 위해 "마지막 수정일자" 사용
    *   내용이 바뀌지 않았으면, Cache에 있던 데이터 내용 재사용

## 검증 헤더

*   검증 헤더는 Cache의 데이터 내용과 서버에 데이터 내용이 일치하는지 검증하는 것
*   ETag 와 Last-Modified
*   "(request) If-Modified-Since => Last Modified" 로 검증
*   "(request) If-None-Match => ETag" 로 검증
*   검증헤더를 통과할 경우, 데이터가 바뀌지 않았던 것이니 응답 결과에 본문(Body)내용이 없음

## Cache 제어 지시어

*   Cache-Control  
    *   max-age (캐시 유효 시간, 초 단위)
    *   no-cache (데이터는 캐시해도 되지만, Origin 서버에 검증하고 사용)
    *   no-store (데이터에 민감한 정보가 있으면 cache 저장 x)
*   Pragma
    *   no-cache
    *   HTTP/1.0 하위 호환
*   Expires
    *   cache 만료일 지정
    *   max-age랑 사용시 expires 무시
*   검증 (Validator)
    *   Etag
    *   Last-Modified

## Proxy Cache

중간에 Cache서버를 두어서 빠른 응답을 해줌

*   Proxy Cache 제어 지시어
    *   Cache-Control : public
        *   응답이 public 캐시에 저장되어도 됨
    *   Cache-Control : private
        *   응답이 private 캐시에 저장되어야함 ( 해당 사용자만을 위한 것 )
    *   Cache-Control : s-maxage
        *   Proxy Cache에만 적용되는 max-age
    *   Age : 60
        *   origin 서버에서 응답후 proxy Cache 내에 머문 시간 (초)

## 캐시 무효화

Cache - Control : no-cache, no-store, must-revalidate  
Pragma : no-cache

*   Cache-Control : no-cache
    *   항상 Origin 서버에 검증하고 사용
    *   Origin 서버 접근 불가시, Proxy 캐시서버에 것으로 검증 ( 설정에 따라 Proxy Cache 서버를 이용  )
*   Cache-Control : no-store
    *   데이터에 민감한 정보가 있으므로 저장 x
*   Cache-Control : must-revalidate
    *   Origin 서버에 검증해야함 (캐시 만료 후 )
    *   항상 Origin 서버 접근 불가시 (504 Gateway 상태코드 오류 발생)

## 관련 문서

- [(학습/프레임워크/Spring Framework) HTTP 이론 - 핵심 개념 및 특징 정리](../../../../../프레임워크/Spring%20Framework/[Spring]%20HTTP%20이론%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트의 캐시/조건부 요청 내용을 메서드·상태코드까지 포함해 한 문서로 종합 정리한 강의 노트

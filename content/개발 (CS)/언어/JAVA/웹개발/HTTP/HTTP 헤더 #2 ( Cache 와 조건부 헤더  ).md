---
title: "HTTP 헤더 #2 ( Cache 와 조건부 헤더  )"
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP 헤더 #2 ( Cache 와 조건부 헤더  )

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

> 원문: https://gradualprecision.tistory.com/69

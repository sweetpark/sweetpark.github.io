---
title: "HTTP 프로토콜#3 ( 상태코드 )"
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP 프로토콜#3 ( 상태코드 )

상태코드 (Status Code)

## 2xx

*   상세설명
    *   클라이언트의 요청을 처리함

*   **200 (OK)**
    *   요청 성공
    *   Response : "HTTP/1.1 200 OK"

HTTP/1.1 200 OK  
Content-Type : application/json  
Content-Length : 29  
  
{  
    "name" : "pp",  
    "count" : 20  
}

*   201 (Created)
    *   요청 성공해서 새로운 리소스가 생성됨

HTTP/1.1 201 Created  
Content-Type : application/json  
Content-Length : 29  
**Location: /main/100**  
  
{  
    "name" : "pp",  
    "count" : 20  
}

*   202 (Accepted)
    *   요청은 되었으나, 처리가 완료되지 않음
*   204 (No Content)
    *   서버가 요청에 성공적으로 수행했지만, 응답 본문에 보낼 데이터가 없음

## 3xx

*   상세설명
    *   리다이렉션 (Location 필드가 있으면, 해당 위치로 자동 이동)
    *   요청을 완료하기 위해 추가 조치 필요
*   리다이렉션 종류
    *   a) 영구 리다이렉션
        *   특정 리소스의 URI가 영구적으로 이동
    *   **b) 일시 리다이렉션**
        *   일시적으로 이동 후 처리가 완료되면 원래 URI로 이동
    *   c) 특수 리다이렉션
        *   결과 대신해서 캐시를 사용

#### a) 영구 리다이렉션 ( 새로고침 -> 리다이렉션된 URL로 이동 )

*   **301**  
    *   과정
        1.  클라이언트 : POST 요청 
        2.  서버: 301 응답
        3.  클라이언트 : (자동) 해당 LOCATION 으로 이동  ( method : post -> get 으로 변경 )
    *   리다이렉션 되는 과정(POST -> GET)에서 처음 POST에 존재하던 message body 내용이 제거 될 수 있음  ( 확정 x )
*   308  
    *   과정  
        1.  클라이언트 : POST 요청
        2.  서버 : 308 응답
        3.  클라이언트 : (자동) 해당 LOCATION으로 이동 ( method : post -> post 유지 )
    *   리다이렉션 되는 과정에서 message body가 유지됨

#### b) 일시적인 리다이렉션 ( 새로고침 -> 원래 URL로 이동 )

*   302
    *   과정
        1.  클라이언트 : POST 요청
        2.  서버 : 302 응답
        3.  클라이언트 : (자동) **일시적으로** 해당 LOCATION 으로 요청 ( method : post -> get으로 변경 )
    *   리다이렉션 되는 과정에서 message body 날아감 ( 확정 x , 그럴 확률이 있음 )
*   307
    *   과정
        1.  클라이언트 : POST 요청
        2.  서버 : 307 응답
        3.  클라이언트 : (자동) **일시적으로** 해당 LOCATION 으로 요청 ( method : post ->  post 유지 )
    *   리다이렉션 되는 과정에서 message body 및 요청 method 유지
*   **303**
    *   과정
        1.  클라이언트 : POST 요청
        2.  서버 : 303 응답
        3.  클라이언트 : (자동) **일시적으로** 해당 LOCATION으로 요청 ( method : post -> get으로 변경 )
    *   리다이렉션시, 요청 메서드가 GET으로 변경 (확정)

302와 303은 유사하나, 302가 애매한 처리를 보여서 303으로 확실하게 한 것  
  
- 현재 권고되는 응답코드는 "307, 303" 이다.

#### POST 유지시 문제점 

*   **POST는 멱등이 안되므로, 새로고침시 중복 처리가 일어날 수 있음 (post -> post 유지)**
*   GET으로 변경하는 부분이 필요 **( PRG -> Post/Redirect/Get)**
*   **303 또는 301로 사용하는 것이 권장됨**

#### c) 기타 리다이렉션

*   304 (Not Modified)
    *   캐시를 목적으로 사용
    *   리소스 (자원) 자체가 변경이 없음 ( -> 캐시 이용)
    *   304 응답은 message body를 포함하면 안됨 ( 로컬 캐시를 이용하므로 )
    *   조건부 -> GET / HEAD 요청시 사용

## 4xx

*   상세설명
    *   오류의 원인이 클라이언트에 있음

*   400 (Bad Request)
    *   요청 구문, 메시지 오류
*   401 (Unauthorized)
    *   클라이언트가 접근 권한이 없음 (인증되지 않음)
    *   로그인 정보가 아닐때 사용됨
*   403 (Forbidden)
    *   접근권한이 불충분할 경우 (admin 리소스에 접근)
*   404(Not Found)
    *   리소스가 서버에 존재하지 않음

## 5xx

*   상세설명
    *   서버 문제로 오류 발생

*   **500 (Internal Server Error)**
    *   서버 내부 문제로 오류 발생
    *   애매할경우 주로 사용됨
*   503 (Service Unavailable)
    *   서버가 일시적인 과부하 또는 예정된 작업으로 서버 요청 처리 불가 상태

---
title: "HTTP 프로토콜 #2 ( Method )"
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP 프로토콜 #2 ( Method )

HTTP의 대표 메서드(GET, POST, PUT, PATCH, DELETE)의 의미와 사용 시점, 그리고 멱등성(idempotent)·캐시 가능 여부 차이를 정리한 노트다. 핵심은 GET·PUT·DELETE는 여러 번 호출해도 결과가 같은 멱등 메서드인 반면 POST는 아니라는 점, 그리고 PUT은 리소스 전체를 대체(생략한 필드는 사라짐)하고 PATCH는 부분 수정만 반영한다는 차이다.

> [!NOTE] 실행 환경
> 본 문서는 특정 언어/프레임워크 버전에 종속되지 않는 HTTP 프로토콜 자체의 메서드 시맨틱을 다루며, 예시의 요청 라인은 HTTP/1.1 메시지 형식을 따른다.

## GET

*   리소스 조회 목적으로 사용
*   해당 자원 리소스를 URL에 검색해서 불러옴
*   서버로 데이터를 전달할 때는 "URL의 query 부분에 작성"해서 보냄

GET /search?q=hello HTTP/1.1  
HOST: www.naver.com

## POST

*   요청 데이터 처리
*   message Body를 이용해서 데이터 전달
*   **POST 리소스 자원 위치(URL)을 서버가 관리하므로 POST로 들어오는 리소스마다 지정해줘야함**
    *   POST 요청이 올때에 사용 목적에 따라 달라지기에, 해당 리소스 요청이 올때 어떻게 처리할 것인지 리소스 마다 정해야함

POST **/main** HTTP/1,1  
Content-Type = application/json  
  
{  
    "name" : "pp",  
    "count" : 1  
}

*   POST 사용 시기
    *   아직 식별되지 않은 새 리소스를 생성
        *   ex) 신규 강의실 신설
    *   HTML양식에 입력된 필드와 같은 데이터 블록을 데이터 처리 프로세스에 제공
        *   ex) 회원가입
    *   게시판, 블로그 .. 메시지 게시
        *   ex) 블로그 글쓰기, 게시판 글쓰기, 댓글달기
    *   기존 자원에 데이터 추가
        *   ex) 한 문서 끝에 내용 추가하기
    *   기존 자원 수정
        *   ex) 상태값 변경

## PUT

*   리소스 대체
    *   리소스 없으면, 생성
    *   리소스 있으면, 덮음
*   클라이언트가 리소스 위치 (/main/100) 를 알고 있음 (POST (/main) 와 차이점)

PUT **/main/100** HTTP/1.1  
Content-Type : application/json  
  
{  
    "user" : "pp"  
    "count" : 5  
}

*   **(중요!)** PUT 사용시, 수정되지 않는 부분이더라도 다시 보내줘야함
    *   "user":"pp" 데이터가 바뀌지 않아서, 안보낼경우 **"user"필드자체가 없어짐**

PUT **/main/100** HTTP/1.1  
Content-Type : application/json  
  
{  
    **"count" : 5**  
}

## PATCH

*   리소스 부분 변경 가능 (PUT 보완)
*   PUT과 마찬가지로 리소스 위치를 알고 있음 (/main/100)

PATCH **/main/100** HTTP/1.1  
Content-Type : application/json  
  
{  
    **"count" : 10**  
}  
  
/*  
[Server 데이터 저장 정보]  
{"user ": "pp" , **"count ": 5**} -> {**"user ": "pp" , "count ": 10** }   
*/

## DELETE

*   리소스 제거

DELETE /main/100 HTTP/1.1  
HOST : www.naver.com

## 멱등 method (idempotent)

*   멱등 : 여러번 호출해도 변경되지 않고 괜찮은가
*   method : GET / PUT /DELETE
*   **중요!) POST의 경우 여러번 호출하면 중복해서 발생할 수도 있음 (멱등이 아님)**

## 캐시가능 method

*   GET / HEAD / POST / PATCH 캐시 가능
*   실제로는 GET, HEAD 정도만 캐시로 이용
*   POST, PATCH 는 구현이 어려움

## 관련 문서

- [(학습/프레임워크/Spring Framework) HTTP 이론 - 핵심 개념 및 특징 정리](../../../../../프레임워크/Spring%20Framework/[Spring]%20HTTP%20이론%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트의 HTTP 메서드/URI 설계 내용을 상태코드·헤더까지 포함해 한 문서로 종합 정리한 강의 노트

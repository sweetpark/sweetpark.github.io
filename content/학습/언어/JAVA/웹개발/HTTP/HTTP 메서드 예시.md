---
title: HTTP 메서드 예시
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP 메서드 예시

Method 활용

## 데이터 전달 방법 (client -> server)

*   쿼리 파라미터를 이용한 데이터 전송
    *   GET방식
*   Message Body를 통한 데이터 전송
    *   POST, PUT, PATCH 방식

## 데이터 전달 상황

1.  정적 데이터 조회
2.  동적 데이터 조회 (검색, 필터링 ... )
3.  HTML Form을 통한 데이터 전송 ( 회원 가입, 상품 주문, 데이터 변경)
4.  HTTP API를 통한 데이터 전송 (서버 to 서버, 앱/웹(AJAX) 클라이언트)

## 데이터 전달 예시

#### 1. 정적 데이터 조회

*   이미지 , 정적 텍스트 문서
*   GET사용

#### 2. 동적 데이터 조회

*   검색, 게시판 필터링
*   GET사용 (쿼리 파라미터를 이용해서 데이터 전달)

#### 3. HTML Form 전송

*   HTML Form 은 GET/POST 만 지원
*   GET
    *   쿼리 파라미터로 데이터 전달 ( ex) GET /main?name=text )
*   POST
    *   Content-TYPE 
        *   application/x-www-form-urlencoded  
            *   form의 내용을 message body를 통해서 전달 (* key = value 형태 )
            *   전송데이터를 encoding 처리함
        *   multipart/form-data
            *   파일업로드 같은 바이너리 데이터 전송시 사용

```html
<!-- GET -->
<form action="/main" method="get">
<input type="text" name=text/>
<button type="submit">전송</button>
</form>

<!-- POST -->
<!-- <form action="/main" method="post" enctype="multipart/form-data"> // 파일업로드 같은거 사용시 (바이너리 전달) -->
<form action="/main" method="post"> <!-- application/x-www-form-urlencoded -->
<input type="text" name=text/>
<button type="submit">전송</button>
</form>
```

#### 4. HTTP API

*   API 데이터 전송
    *   Content-TYPE : application/json
*   데이터 전송
    1.  GET ( 쿼리 파리미터 ) 
    2.  POST,  PUT, PATCH (message body)
*   API 설계 예시
    *   회원 관리 시스템
        *   회원 목록 (/members) -> GET
        *   회원 등록 (/members) -> POST
        *   회원 조회 (/members/{id}) -> GET
        *   회원 수정 (/members/{id}) -> PATCH, PUT , POST
        *   회원 삭제 (/members/{id}) -> DELETE
    *   파일 관리 시스템
        *   파일 목록 (/files) -> GET
        *   파일 조회 (/files/{filename}) -> GET
        *   파일 등록 (/files/{filename}) -> PUT
        *   파일 삭제 (/files/{filename}) -> DELETE
        *   파일 대략 등록 (/files) -> POST
    *   API를 설계시 **주체를 기준**으로 URL을 설정해야함 (**행위 기준 X**)
    *   행위는 HTTP 메서드로 이용 ( 조회 -> GET, 생성/수정 -> POST, 삭제 -> DELETE)

> 원문: https://gradualprecision.tistory.com/67

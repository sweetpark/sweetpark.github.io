---
title: "HTTP 프로토콜 #1"
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP 프로토콜 #1

HTTP(HyperText Transfer Protocol)가 무엇인지, 요청-응답 구조와 무상태(stateless) 특성이 어떤 트레이드오프를 갖는지, 그리고 HTTP 메시지가 Start-Line·field-Line·message-body로 어떻게 구성되는지를 정리한 노트다. 핵심은 HTTP가 클라이언트-서버 구조의 무상태 프로토콜이라 서버 확장은 쉽지만, 매 요청마다 필요한 정보를 다시 보내야 한다는 점이다.

## HTTP 란?

*   HyperText Transfer Protocol (프로토콜)
*   데이터 전송 및 요청/응답 구조를 위해 Web에서 많이 사용 
*   요청 - 응답 구조 (무상태 구조를 사용)

## HTTP 버전

*   TCP
    *   HTTP/1.1 (주로 사용)
    *   HTTP/2.0
*   UDP
    *   HTTP/3.0

## HTTP 메시지 전송 종류

*   html , text
*   json, xml
*   image, 음성, 영상, 파일
*   거의 모든 형태

## HTTP 특징

*   클라이언트 - 서버 구조
    *   요청(클라이언트) - 응답(서버) 구조
*   무상태(stateless)
    *    비연결성
    *   서버가 클라이언트 상태 보존x
    *   클라이언트의 상태가 보존이 안되기에, 정보를 추가적으로 보내야한다.
    *   요청에 대한 응답을하면 끝
    *   서버 확장이 쉬움

상태 유지 (stateful) 구조  
  
[단점]  
- 리소스를 많이 차지하게 됨  
- 정보를 유지하고 있는 서버가 항상 응답해야함 ( 서버 확장의 어려움 )  
- 장애가 날경우 스왑할 서버가 존재할 수 없음

## HTTP 메시지 구조

*   HTTP 구조
    *   [https://httpwg.org/specs/rfc9112.html](https://httpwg.org/specs/rfc9112.html)

Start-Line  
field-Line  
  
[message-body]

*   HTTP 요청 예시

GET /search?q=hello HTTP/1.1  
Host : www.naver.com

*   설명
    *   Start-line
        *   GET : HTTP 메서드  (GET, POST, PUT, DELETE.. )
        *   PATH : 리소스 자원 위치
        *   Query : 쿼리
        *   버전 : HTTP/1.1
    *   field-line
        *   HOST : 호스트 정보 (도메인명)

*   HTTP 응답 예시

HTTP/1.1 200 OK  
Content-Type : text/html; charset=UTF-8  
Content-Length : 3423  
  
<html>  
//  
</html>

*   Start Line
    *   버전 : HTTP/1.1
    *   상태코드 : 200 (sucess)
        *   상태코드 : 200 (Ok), 400 (클라이언트 오류) , 500( 서버오류 )
*   field Line
    *   Content-Type : message body 형태 및 인코딩정보
    *   Content-Length : message body의 길이

## 관련 문서

- [(학습/프레임워크/Spring Framework) HTTP 이론 - 핵심 개념 및 특징 정리](../../../../../프레임워크/Spring%20Framework/[Spring]%20HTTP%20이론%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트의 HTTP 메시지 구조/Stateless 내용을 URI·헤더까지 포함해 한 문서로 종합 정리한 강의 노트

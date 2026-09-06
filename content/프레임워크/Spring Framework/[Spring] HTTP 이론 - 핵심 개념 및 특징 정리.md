---
title: "HTTP 이론"
tags: [학습, 개발-CS, CS-기초, Spring-Framework, 개발, Spring]
created: 2025년 3월 12일 오후 2:14
modified: 2026-09-05
---

# HTTP 이론

> [!NOTE]
> 인터넷 네트워크(IP/TCP/UDP/DNS)부터 URI, HTTP 메시지 구조·메서드·상태코드·헤더, 쿠키·캐시·조건부 요청까지 김영한 HTTP 강의를 한 문서로 정리한다.

## 📌 개념

### 인터넷 네트워크 정리

- IP
    - IP 프로토콜의 한계
        - 패킷을 받을 대상이 없거나 서비스 불능 상태여도 패킷 전송 (* 비연결성)
        - 중간에 패킷이 사라지거나, 패킷이 순서대로 안온다면 (* 비신뢰성)
        - 같은 IP를 사용하는 서버에서 통신하는 애플리케이션이 둘 이상이면? (* 프로그램 구분)
- TCP & UDP
    - 프로토콜 계층
        - 애플리케이션 계층 ( socket 라이브러리)
        - TCP / UDP / IP ( OS )
        - LAN 드라이버 / 장비 ( 네트워크 인터페이스 (랜카드) )
    - TCP
        - 3-way-hsndshake
            1. client → server ( SYN )
            2. server → client ( SYN + ACK )
            3. client → server ( ACK )
        - 3-way-handshake 이후 데이터 전송
            1. 데이터 전송 (client → server)
            2. 데이터 잘받았다는 응답 (server → client)
        
        > [!NOTE]
        > 3-way-handshake
        > - 신뢰성 있는 전달 가능
        > - 순서 보장

    - UDP
        - IP 와 거의 같지만 PORT 가 추가된 상태
        - 데이터 전송이 빠르지만, 신뢰성이 없다
        
        > [!NOTE]
        > PORT 란?
        > - 동일 IP로 온 패킷들을 구분하고자 port를 설정 (필요한 애플리케이션별로 port 지정)
        > - ex) 뮤직 스트리밍 (동일 IP:7070) / 게임 (동일 IP:2020)

- PORT
    - 같은 IP 내에서 프로세스를 구분하기 위해 PORT 사용
- DNS
    - DNS가 있는 이유
        - IP가 변경될 수 있다
        - IP를 기억하고 있기가 힘들다

### 웹 브라우저 흐름과 URI

- URL / URI / URN
    - URL
        - Resource Locator
        - 리소스가 있는 위치를 지정
        - ex ) http://www.example.com/test/main
    - URN
        - Resource Name
        - 리소스 이름을 부여 ( 이름 그 자체로 사용 )
        - 보편화 되지 않은 방법
        - ex) example:test:main
    - URI
        - Uniform :  자원 식별하는 통일된 방식
        - Resource : 자원
        - Identifier : 식별
        - URI 와 URL은 비슷한 의미로 사용됨
    - URL 스키마
        - scheme://[userinfo@]host[:port][/path][?query][#fragment]
        - scheme : ftp / http /  https / … (프로토콜 들)
        - query : 쿼리를 날려서 원하는 데이터를 줌 ( 무조건 String으로 값이 넘어감 )
        - fragment : 웹 html에서 붙여주는 메타데이터 같은 값이지만 서버로 넘어가지는 않는다
- 웹 브라우저 흐름
    - CLIENT
        - 요청
            - [메서드 : GET / POST / DELETE ..][path][query]HTTP버전정보[host: www.example.com]
        - HTTP → TCP → IP → 네트워크 망 → SERVER
    - SERVER
        - 응답
            - [HTTP/1.1 버전] [응답 상태코드][ OK / FAIL]
            - Content TYPE = text/html
            - charset=UTF-8
            - Content Length = 데이터 내용 길이
            - [응답 데이터]
        - HTTP → TCP → IP → 네트워크 망 → CLIENT

### HTTP

- HTTP 역할
    - 전송 역할
        - HTML, TEXT , JSON, XML, IMAGE, 음성, 영상, 파일 등등
        - 특수한 상황 (게임서버) 가 아닌 경우 TCP 전송이 아닌 HTTP 전송을 사용한다
    - HTTP 버전
        - HTTP/1.1 이 대부분 사용됨
        - HTTP/2.0 : 성능 개선
        - HTTP/3.0 : UDP 위주 사용 (성능 개선)
- 클라이언트 - 서버 구조
    - CLIENT → SERVER (Request)
    - SERVER → CLIENT (Response)
    - 요청 ↔ 응답 구조
- Stateless (무상태 프로토콜 지향)
    - Stateless
        - 서버가 클라이언트의 상태를 보존하지 않는다
    - Stateful (상태 유지) VS Stateless (무상태) 차이
        - Stateful
            - Client의 상태를 유지
            - 장점) Client 상태를 유지하고 있어서, 기존의 정보를 가지고 유추가 가능하다. (데이터의 요청 정보 크기가 작다)
            - 단점) 다른 서버로 바뀔경우, 정보가 없어서 에러가 발생한다.
        - Stateless
            - Client 상태 유지x
            - 장점) 중간에 다른 서버로 바뀌어도, 정보 유지를 하지 않기에 문제가 되지 않는다 (서버 증설 가능)
            - 단점1) 모든 것을 무상태로 설계할 수 있는 것이 아니다.
            - 단점2) 데이터 요청 정보 크기가 크다
    - 상태유지가 가능한 로직 vs 무상태가 가능한 로직
        - 상태 유지 로직
            - 로그인
        - 무상태 로직
            - 로그인이 필요 없는 단순한 서비스 소개 화면
- 비연결성
    - 연결을 유지하는 모델
        - TCP/IP 연결
        - 단점) 유지해야하는 자원이 크다
    - 연결을 유지하지 않는 모델
        - HTTP
        - 장점) 최소한의 자원을 가지고 있을 수 있다
        - 단점) TCP/IP 핸드쉐이크를 또 해야함 , 계속해서 요청을 할떄마다 여러 데이터를 받아야함
            - → 보완) HTTP 지속 연결 (TCP/IP를 연결 유지를 하고, 어느정도 요청에 따른 데이터가 종료되면 연결을 종료함)
- HTTP 메시지
    - HTTP 메시지 구조
        1. Start-line 시작 라인
            - 요청 ) [HTTP 메서드 → GET/ POST ..] [PATH : 절대경로] [쿼리문] [HTTP] 버전
            - 응답 ) HTTP 버전 [응답 상태]
        2. Header
            - 헤더 규칙 → field-name:[공백][정보];
            - 요청) HOST: [정보]
            - 응답) [Content-Type]: [응답 구조], charset, content-length
        3. 공백라인 (CRLF)
            - 요청/응답 공통
        4. messsage body
            - 요청/응답 공통
            - message( 바이트로 표현할 수 있는 모든 데이터) 내용 (없으면 공백)
    - HTTP 메서드
        - GET : 리소스 조회
        - POST : 요청 내역 처리
        - PUT
        - DELETE
    - 응답 상태 코드
        - 200 : 성공
        - 400 : 클라이언트 요청 오류
        - 500 : 서버 오류
- HTTP 메서드
    - URI 설계 (API 설계)
        - 가장 중요한 것은 “리소스” (URI는 리소스만 식별!)
        - 리소스와 행위를 분리
            - 리소스 : 회원
            - 행위 : 조회, 등록, 삭제, 변경 (→ 메서드를 이용해서 표현)
    - HTTP 메서드
        - 주요 메서드
            - GET : 리소스 조회
            - POST : 요청 데이터 처리 ( 주로 등록에 사용)
            - PUT : 리소스를 대체 (해당 리소스가 없으면 생성)
            - PATCH : 리소스 부분 변경
            - DELETE : 리소스 삭제
        - GET
            - 리소스 조회
            - 서버에 전달하고 싶은 요청 데이터는 query(쿼리 파라미터, 쿼리 스트링)를 통해서 전달
            - 메시지 바디를 사용해서 데이터를 전달할 수 있지만, 지원하지 않는 곳이 많아서 권장하지 않음
        - POST
            - 요청 데이터 처리 (서버에게 데이터 처리를 요청)
            - 메시지 바디를 통해서 서버로 요청 데이터를 전달
            - 무언가를 등록할 때 많이 사용 (→ 정확한 리소스 위치를 알 수 없다 (서버가 지정해줌))
            - 응답 데이터
                - 새로운 URI 위치를 반환
                - 메시지 받은 내용 반환
            - 컨트롤 URI
                - 리소스 만으로 설계가 불가능할떄에, 행위를 URI 로 만드는 것을 “컨트롤URI” 라고 한다
                - ex) POST /orders/{orederId}/start-delevery
            - 대부분의 경우 가능하다 → GET의 역할도 가능
                - 다만, 조회의 영역에서는 GET을 사용하는 것이 캐싱하는데에 유리하다
        - PUT
            - 리소스를 대체
                - 리소스가 없으면 새로 생성
                - 리소스가 있으면 완전 대체
            - POST와 차이점
                - 리소스 위치를 정확하게 알고 있음 ( ex) /members/100 )
            - PUT의 주의점
                - 리소스를 완전 대체하기에 변경하지 않는 정보도 다시 보내줘야한다. (아니면 없애버림)
        - PATCH
            - 리소스 부분 변경
            - PUT의 개선
            - 리소스 완전대체가 아니기에, 부분적으로 원하는 값을 변경할 수 있다
            - POST와 차이점도 PUT과 동일하다
        - DELETE
            - 리소스 삭제
    
- HTTP 메서드 속성
    - 안전
        - 호출해도 리소스를 변경하지 않는다
        - GET → 안전  (POST, PUT , PATCH, DELETE → 안전하지 않음)
    - 멱등
        - 한번이든 두번이든 백번이든 결과가 똑같다 (외부 요인 고려 x → 다른 사용자가 수정한 것을 조회한 것 (이럴 경우 고려하지 않음)
        - GET, PUT , DELETE → 최종결과가 동일하기에 멱등하다
        - POST → 두 번 호출하면 같은 결제가 중복해서 발생할 수 있어서 멱등하지 않다
        - 멱등할 경우 괜찮은 경우
            - 자동 복구 메커니즘
            - 서버에서 응답 없을시 다시 호출 가능
    - 캐시 가능
        - GET, HEAD, POST, PATCH 캐시 가능
            - 다만, GET / HEAD의 경우만 주로 사용
            - POST / PATCH 는 구현이 어려워서 사용하지 않음 (본문까지 캐시 키로 고려하는게 쉽지 않음)
- HTTP 메서드 활용
    - 클라이언트 → 서버 데이터 전송
        - 쿼리 파라미터를 통한 데이터 전송
            - GET
            - ex) 주로 정렬 필터 ( 검색어 )
        - 메시지 마디를 통한 데이터 전송
            - POST , PUT, PATCH
            - 리소스를 변경할 때 주로 사용
    - 정적 데이터 조회
        - GET 주로 사용
    - 동적 데이터 조회
        - 쿼리 파라미터를 이용해서 조회
        - 검색, 게시판 목록 정렬 필터 (검색어) 주로 사용
        - GET을 이용 (쿼리 파라미터 이용)
    - HTML From 데이터 전송
        - HTML form타입을 이용하여 POST 본문 메시지를 작성
        - Key = Value 형식으로 서버에 전달
        - GET 메서드를 사용했을경우, 쿼리 파라미터로 서버에 전송한다 (정보 저장 및 수정인 경우 GET 사용을 지양해야함)
        - 파일을 전송시에 사용 enctype
            - Content-Type: multipart/form-data
            - POST 사용
        - HTML Form형식은 GET / POST 만 지원한다
    - HTTP API 데이터 전송
        - HTTP 를 직접 만들어서 요청
        - HTTP API 데이터 전송을 사용하는 곳
            - 서버 ↔ 서버
            - 앱 클라이언트
            - 웹 클라이언트 (AJAX / 자바 스크립트를 통한 통신)
            - POST /PUT / PATCH : 메시지 바디를 통해 데이터 전송
            - GET : 조회, 쿼리 파라미터로 데이터 전달
            - Text, XML, JSON
                - Content-Type: application/json
- HTTP API 설계 예시
    - API 설계
        - HTTP 포스트 기반 등록 (POST 기반 등록)
            - 회원 리소스 식별 (리소스 == 명사)
                - 회원 목록 : /members → GET
                - 회원 등록 : /members → POST
                - 회원 조회 : /member/{id} → GET
                - 회원 수정 : /members/{id} → PATCH, PUT , POST
                - 회원 삭제 : /members/{id} → DELETE
                
                > [!NOTE]
                > POST 와 PUT/PATCH 간의 차이점
                > - POST의 경우 회원 등록 URI를 모른다 (서버가 만들어서 응답으로 넘겨줌)
                > - PUT/PATCH의 경우 회원 등록 URI를 안다 (클라이언트가 위치를 알고 있음)
                >
                > 컬렉션: 서버가 관리하는 URI (서버가 위치를 지정 → POST)
                
            - 파일 관리 시스템 (PUT 기반 등록)
                - 파일 목록 : /files → GET
                - 파일 조회 : /files/{filename} → GET
                - 파일 등록 : /files/{filename} → PUT
                - 파일 삭제 : /files/{filename} → DELETE
                - 파일 대량 등록 : /files → POST
                
                > [!NOTE]
                > 파일 등록에 PUT을 이용
                > - 클라이언트가 파일 등록 URI를 알고 있다
                >
                > 스토어: 클라이언트가 관리하는 URI (클라이언트가 위치를 지정 → PUT)
                
            - HTML Form 사용
                
                > [!NOTE]
                > HTML Form 특징
                > - AJAX / JavaScript를 이용하여 API 구현 가능
                > - GET / POST 만 지원
                >     - 컨트롤 URI를 사용 (동사로 된 URI)
                >     - ex) /new, /delete, /edit 등등
                >     - 왠만하면 컨트롤 URI는 사용하지 않는 것이 좋다 (어쩔 수 없을 때만 사용)
                
                - 회원 목록 : /members → GET
                - 회원 등록 폼 : /members/new → GET
                - 회원 등록 : /members/new OR  members → POST
                    - 강사님 개인적으로 회원 등록폼 URI를 똑같이 사용하는 편
                - 회원 조회 : /members/{id} → GET
                - 회원 수정 폼 : /members/{id}/edit → GET
                - 회원 수정 : /members/{id}/edit OR members/{id} → POST
                    - 강사님 개인적으로 회원 등록폼 URI를 똑같이 사용하는 편
                - 회원 삭제 : /members/{id}/delete → POST
    - 참고하면 좋은 URI 설계 개념
        
        [REST API URI Naming Conventions and Best Practices](https://restfulapi.net/resource-naming)
        
        - 문서
            - 단일 개념 (파일,객체, 데이터베이스 row)
            - ex) /files/{fileId}
        - 컬렉션
            - 서버가 URI 지정
            - ex) /members
        - 스토어
            - 클라이언트가 URI 지정
            - ex) /members/100
        - 컨트롤러 , 컨트롤 URI
            - 문서, 컬렉션, 스토어로 해결하기 어려운경우
            - 동사를 직접 사용
            - ex) /members/{id}/delete
- HTTP 상태코드
    - 서버에서 보내는 응답에서 오는 코드
        - 100번대 : 요청이 수신되어 처리중
        - 200번대 : 요청 정상 처리
        - 300번대 : 요청을 완료하면 추가 행동 필요
        - 400번대 : 클라이언트 오류 (요청 오류)
        - 500번대 : 서버 오류 (정상 요청 처리 불가)
    - 응답코드 상세설명
        - 100 번대
            - 잘 사용되지 않음
        - 200번대
            - 200 : OK
            - 201 : Created (리소스 생성)
                - HTTP 헤더에 Location 정보도 같이 줌
                - POST에서 주로 사용
            - 202 : Accepted ( 요청이 접수 되었으나, 아직 처리 완료되지 않음 )
            - 204 : No Content ( 응답 결과로 본문에 보낼 데이터가 없음 )
                - ex) 웹 문서 편집기에서 save 버튼
        - 300번대
            - 추가 조치 필요 (Location 정보를 응답결과에 넣음)
            - 해당 Location 정보로 리다이렉트 됨
            - 리다이렉트
                - 응답 결과에 Location이 있다면 해당 위치로 이동
            - 리다이렉션 종류
                - 영구 리다이렉트 : 특정 리소스의 URI가 영구적으로 이동
                    - 301번, 308번
                        - 301번 (주로 많이 사용됨)
                            - Client(POST) → Server
                            - Server → Client : 301번 반환
                            - Client(GET) → Server  // 본문 (Body)  사라짐 (다시 작성해야함)
                        - 308번
                            - Client(Post) → Server
                            - Server → Client : 308번 반환
                            - Client(POST) → Server // 본문 (Body) 유지 (다시 작성안해도 작성된 본문 유지 )
                    - ex) /members → /users
                - 일시 리다이렉션 : 일시적인 변경
                    - 주문 완료 후 주문 내역화면으로 이동 (→ Post/Redirect/Get 패턴)
                        - PRG 사용 전
                            - POST로 주문후 , 새로고침하면 또다시 POST를 보내게됨 (중복 요청)
                        - PRG사용
                            - POST (요청) → Server
                            - Server → Client ( Location 정보 전달)
                            - 새로고침 + Client(Get) - 해당 Location위치로 GET → Server ( 본문은 날아감 )
                    - 302번 (지금도 자주 사용됨)
                        - GET으로 변하고 , 본문이 제거 될 수 있음
                        - Client(POST) → Server
                        - Server → Client : 302번 반환
                        - Client(GET) → Server  // 본문 (Body) 사라짐 (다시 작성해야함)
                    - 307번 ( HTTP에서 권장)
                        - 요청 메서드와, 본문이 유지
                        - Client(POST) → Server
                        - Server → Client : 307번 반환
                        - Client(POST) → Server  // 본문 (Body) 유지
                    - 303번 (HTTP 에서 권장)
                        - 요청 메서드를 무조건 GET으로 변경
                        - Client(POST) → Server
                        - Server → Client : 303번 반환
                        - Client(GET) → Server  // 본문 (Body) 사라짐 (다시 작성해야함)
                - 특수 리다이렉션
                    - 결과 대신 캐시를 사용
                    - 304번 (캐시에서 자주 사용)
                        - 캐시로 리다이렉트
                        - 캐시를 사용하므로, 응답에 메시지 바디가 존재하지 않는다
                        - GET / HEAD 요청시에 사용
        - 400번대
            - 클라이언트 오류
            - 400번
                - 클라이언트가 잘못 보냄 (BAD REQUEST)
            - 401번
                - 인증되지 않음 (UnAuthorized) → 로그인이 되지 않은 것을 의미
                
                > [!NOTE]
                > 인증 vs 인가
                > - 인증 (Authentication): 본인 확인 (로그인 여부)
                > - 인가 (Authorization): 권한 존재 여부
                
            - 404
                - 요청 리소스가 서버에 없음
                - 클라이언트가 권한이 부족한 리소스에 접근할때
        - 500번대
            - 서버 오류
            - 500번
                - Internal Server Error
                - 애매한 서버 문제
            - 503번
                - 서버가 일시적으로 요청을 처리할 수 없음 (과부하, 예정된 작업)
                - Retry-After : 얼마뒤에 복구되는지도 보낼 수 있음
- HTTP 헤더1 (일반헤더)
    - 엔티티
        - general 영역
            - 공통된 영역
        - request 영역
            - client 내용
        - response 영역
            - 서버 내용
        - 본문 영역
            - 메시지 타입/ 길이 / 본문 내용
    - 엔티티 → 표현 (repregentation) // 명칭이 바뀜
        - Content-Type : 표현 데이터 형식 ( → html / json …)
            - Content Body에 들어가는 타입 유형
        - Content-Encoding : 표현 데이터의 압축 방식
            - 데이터를 전달하는 곳에서 압축 후 인코딩 헤더 추가
            - gzip, deflate, identity
        - Content-Language : 표현 데이터의 자연 언어
            - ko / en / en-US
        - Content-Length : 표현 데이터 길이 (본문 내용 길이)
            - Transfer-encoding을 사용하면 Content-Length를 사용하면 안됨
- 협상 (콘텐츠 네고시에이션)
    - 협상 헤더는 요청시에만 사용
    - 클라이언트가 선호하는 표현 요청
        - Accept : 서버에게 원하는 것을 요청
            - html / json / xml / image  ….
        - Accept-Language : 원하는 자연 언어(ko, en …)을 요청
            - Quality Value (q) : 협상과 우선순위
            - ex) Accept-Lanaguage : KO-KR, ko;q=0.9,en-US;q=0.8,en;q=0.7
            - KO-KR > ko > en-US > en : 우선순위
        - Accept-Charset
            - 선호하는 문자 인코딩
            - UTF-8, …
        - Accept-Encoding
            - 선호하는 압축 인코딩
            - gzip, ..
- 전송 방식
    - 단순 전송
        - Content-Length : 본문 실제 길이를 알 수 있을때 사용
    - 압축 전송
        - Content-Encoding : 압축 방법
        - Content-Length : 압축 실제 길이
    - 분할 전송
        - Transfer-Encoding : chunked (분할해서 전송)
        - 본문 위치
            - 분할 크기
            - 분할 내용
            - … (반복)
            - (마지막) /r/n
    - 범위 전송
        - Content-Range : 1000 ~ 2000
        - 범위를 나누어서 전송
- 일반 정보
    - From
        - 유저 에이전트의 이메일 정보
    - Referer
        - 이전 웹 페이지 주소
        - 유입 경로 분석할때 많이 사용
    - User-Agent
        - 유저 애플리케이션 정보
        - ex) Apple , window ..
    - Server
        - Origin 서버 소프트웨어 정보
        - Origin 서버 : 맨마지막 뒷단에 요청을 처리하는 서버
    - Date
        - 요청 날짜
    - 특별한 정보
        - Host
            - 필수 헤더
            - 하나의 서버에 여러 도메인을 가지고 있을 수 있어서, HOST헤더를 넣어서 지정해줘야한다.
        - Location
            - 페이지 리다이렉션 (페이지 이동 → 응답코드 : 300번대 )
        - Allow
            - 허용 가능한 HTTP 메서드
            - ALLOW : GET, POST …
        - Retry-After
            - 유저 에이전트가 다음 요청을 하기까지 기다려야하는 시간
            - ex) 서버 점검
    - 인증
        - Authorization
            - 클라이언트 인증 정보를 서버에 전달
            - 로그인
        - WWW-Authenticate
            - 리소스 접근시 필요한 인증 방법 정의
            - 401 Unauthorized 응답과함께 사용
- 쿠키
    - Set-Cookie : 서버에서 응답시 클라이언트로 헤더로 전달
        - Cookie : 클라이언트가 요청을 할때마다, 쿠키 저장소에서 쿠키 값을 꺼내어 서버에 보냄 (헤더로 붙여서)
    
    > [!NOTE]
    > Stateless 상태
    > - 서버는 이전 상태 기억이 없다
    > - 요청하고 응답하면 연결을 끊는다
    >
    > 해결 방법
    > - 모든 정보를 요청할 때마다 서버에 보낸다, 또는
    > - 쿠키를 사용한다

    - 쿠키
        - ex) set-cookie : session-id : ~, expired(또는 max-age): ~ , path: ~, domain : ~, secure : ~
            - expired : 쿠키 생존범위
            - path : 쿠키 접근 권한 경로 설정 (일반적으로 “/” 경로로 설정)
            - domain : 쿠키 적용할 도메인
            - secure : https 경우에만 적용
            - HttpOnly : XSS 공격 방지 (js 접근 불가)
            - SameSite : XSRF공격방지 (요청도메인과 쿠키 도메인이 같을 때만 쿠키전송)
        - 단점) 쿠키정보는 항상 서버에 전송됨 (네트워크 트래픽이 추가로 유발하므로, 최소한의 정보만 사용
        
        > [!NOTE]
        > 웹 스토리지
        > - 쿠키처럼 서버로 전송하지 않고, 웹 브라우저 내에 데이터를 저장하는 방법 (localStorage/sessionStorage)

- 캐시와 조건부 요청
    - 캐시 기본 동작
        - 서버에서 헤더에 “chache-control: max-age = 시간” 을 실어서 보냄 ( → 클라이언트는 캐시 저장소(브라우저 캐시)에 저장)
        - 다음 클라이언트 요청 때, 브라우저 캐시를 먼저 확인
    - 검증 헤더와 조건부 요청
        
        > [!NOTE]
        > 검증 헤더
        > - Request: "If-Modified-Since"
        > - Response: "Last-Modified" + 응답코드 (304 Not Modified / 200 OK)
        >
        > 조건부 헤더
        > - Request: "If-None-Match"
        > - Response: "ETag" + 응답코드 (304 Not Modified / 200 OK)

        - 검증헤더 추가
            - 검증헤더를 추가하는 이유 → 만료된 캐시의 재사용을 위해서 ( 데이터가 동일하다면 굳이 다시 데이터를 보내어 갱신할 필요는 없으므로)
            - 서버에서는 헤더에 “Last-Modified:” 추가 (최종 수정일 기입)
            - 클라이언트가 요청할때에는 “if-modified-since:” 캐시에 있는 데이터 최종수정일을 해당 헤더에 붙여서 서버에 전달
                - 서버는 최종 수정일이 같으면, 응답코드로 304(Not Modified) 를 응답 ( 그리고 http body 없이 응답 반환)
                - 클라이언트는 캐시 데이터를 갱신 (max-age)
            - Last-Modified 단점)
                - 데이터를 수정했다가 다시 원복했는데, 최종 수정날짜가 달라져서 갱신할경우
                - → Entity Tag (Etag) 사용
        - 조건부 요청
            - ETag + If-None-Match
- 캐시와 조건부 헤더 정리
    - 캐시 헤더
        - cache-Control : max-age
            - 캐시 유효시간, 초 단위
        - cache-Control : no-cache
            - 데이터는 캐시해도 되지만, 서버에 검증하고 사용
        - cache-Control : no-store
            - 데이터에 민감한 정보가 있으므로 저장하면 안됨
        - Pragma
            - 잘 사용하지 않음
        - Expires
            - 캐시 만료일 지정
            - cache-control : max-age가 주로 사용됨
    - 검증 헤더
        - ETag , Last-Modified
    - 조건부 요청 헤더
        - If-Match, If-None-Match
        - If-Modified-Since, If-Unmodified-Since
    
- 프록시
    - CDN 서비스(= 프록시 캐시 서버)
    - Cache-Control
        - Cache-Control : public
            - public 캐시에 저장
        - Cache-Control : private
            - 해당 사용자만을 위한 캐시
        - Cache-Control : s-maxage
            - 프록시 서버에서 준 캐시가 머물 수 있는 유효시간
        - Age
            - origin 서버에서 준 정보가 프록시 캐시서버에 머물 수 있는 시간
- 캐시 무효화
    - 절대 캐시하지 않겠다 (아래 사항들을 포함해야함)
        - cache-Control : no-cache, no-store, must-revalidate
        - Pragma : no-cache
    - no-cache : 원서버에 검증하고 사용
        - Origin 서버 접근 불가시 → 프록시 서버에서 200 Ok를 보낼 수 있음
    - no-store : 저장 x , 메모리에서만 사용
    - must-revalidate : 캐시 만료후 최초 조회시 Origin 서버에 검증
        - Origin 서버 접근 불가시 → 504 Error
    - Pragma : HTTP 1.0 하위 호환

## 관련 문서

- [(학습/개발 (CS)/언어/JAVA/웹개발/HTTP) 인터넷 통신과정 ( + IP, TCP-UDP, PORT, DNS )](../../개발 (CS)/언어/JAVA/웹개발/HTTP/인터넷%20통신과정%20(%20+%20IP,%20TCP-UDP,%20PORT,%20DNS%20).md) — 이 노트의 "인터넷 네트워크 정리" 절을 더 상세히 다루는 원본 노트
- [(학습/개발 (CS)/언어/JAVA/웹개발/HTTP) URI, URL, URN](../../개발 (CS)/언어/JAVA/웹개발/HTTP/URI,%20URL,%20URN.md) — 이 노트의 "웹 브라우저 흐름과 URI" 절을 더 상세히 다루는 원본 노트
- [(학습/개발 (CS)/언어/JAVA/웹개발/HTTP) HTTP 프로토콜 #1](../../개발 (CS)/언어/JAVA/웹개발/HTTP/HTTP%20프로토콜%20%231.md) — 이 노트의 HTTP 역할/Stateless/비연결성 절을 더 상세히 다루는 원본 노트
- [(학습/개발 (CS)/언어/JAVA/웹개발/HTTP) HTTP 프로토콜 #2 ( Method )](../../개발 (CS)/언어/JAVA/웹개발/HTTP/HTTP%20프로토콜%20%232%20(%20Method%20).md) — 이 노트의 HTTP 메서드/URI 설계 절을 더 상세히 다루는 원본 노트
- [(학습/개발 (CS)/언어/JAVA/웹개발/HTTP) HTTP 프로토콜#3 ( 상태코드 )](../../개발 (CS)/언어/JAVA/웹개발/HTTP/HTTP%20프로토콜%233%20(%20상태코드%20).md) — 이 노트의 HTTP 상태코드 절을 더 상세히 다루는 원본 노트
- [(학습/개발 (CS)/언어/JAVA/웹개발/HTTP) HTTP 헤더 #1](../../개발 (CS)/언어/JAVA/웹개발/HTTP/HTTP%20헤더%20%231.md) — 이 노트의 "HTTP 헤더1 (일반헤더)" 절을 더 상세히 다루는 원본 노트
- [(학습/개발 (CS)/언어/JAVA/웹개발/HTTP) HTTP 헤더 #2 ( Cache 와 조건부 헤더  )](../../개발 (CS)/언어/JAVA/웹개발/HTTP/HTTP%20헤더%20%232%20(%20Cache%20와%20조건부%20헤더%20%20).md) — 이 노트의 캐시/조건부 요청 절을 더 상세히 다루는 원본 노트

---
title: "[JAVA 기술면접] HTTP·REST와 요청 처리 전체 흐름"
description: "REST가 TCP가 아닌 HTTP를 쓰는 이유와 브라우저에 검색어를 입력해 응답이 올 때까지의 전체 요청 처리 흐름을 Java 기술면접 질문에 맞춰 정리했습니다."
tags: [기술면접, JAVA 관련 기술면접, HTTP, REST, TCP, DNS, CDN, Spring MVC, 웹]
created: 2026-10-19
modified: 2026-10-19
---

# [JAVA 기술면접] HTTP·REST와 요청 처리 전체 흐름

---

## Q1. RESTful 설계에 왜 HTTP를 쓰나? TCP로 직접 하면 더 빠르지 않나?

### 한 줄 답변
HTTP는 TCP **위에서** 동작하는 애플리케이션 계층 프로토콜이다(TCP를 대체하는 것이 아니다). TCP만으로 하면 헤더 몇 바이트는 아낄 수 있지만, 메시지 형식·메서드 의미·상태 코드·캐시·인프라 호환을 전부 직접 정의해야 한다. 그 이득에 비해 얻는 속도는 미미하고 잃는 것이 많아서 HTTP를 쓴다.

### 핵심 논리
**1) REST는 프로토콜이 아니라 아키텍처 스타일이다.** 자원(Resource)을 URI로 식별하고, 행위를 표준 메서드로 표현하고, 서버는 무상태(Stateless)이며, 응답은 캐시 가능해야 한다는 제약의 묶음이다. HTTP가 이 제약을 거의 그대로 제공한다.

| REST 제약 | HTTP가 제공하는 것 |
| --- | --- |
| 자원 식별 | URI (`/users/1`) |
| 행위의 표준화 (Uniform Interface) | `GET` `POST` `PUT` `PATCH` `DELETE` 의미 + 안전/멱등 규칙 |
| 표현(Representation) 협상 | `Content-Type`, `Accept` (JSON/XML 선택) |
| 결과 표현 | 상태 코드 (`200` `201` `400` `401` `404` `500`) |
| 무상태 | 요청마다 필요한 정보(`Authorization` 등)를 헤더에 담음 |
| 캐시 | `Cache-Control`, `ETag`, `Last-Modified`, 조건부 요청(`304`) |
| 계층화 | 프록시·CDN·로드밸런서·API 게이트웨이가 중간에 끼어도 동작 |

**2) TCP는 "바이트 스트림"일 뿐이다.** 메시지 경계가 없다(붙어서 오거나 쪼개져 온다). 직접 쓰면 길이 필드·구분자, 요청/응답 매칭, 에러 표현, 버전·인증 방식을 전부 자체 설계해야 하고, 클라이언트 라이브러리도 직접 만들어야 한다.

**3) 인프라 생태계.** 웹 방화벽, L7 로드밸런서, CDN, API 게이트웨이, 모니터링, 브라우저, Postman/curl 같은 도구가 전부 HTTP를 전제로 만들어져 있다. 80/443 포트는 대부분의 방화벽에서 열려 있지만 임의의 TCP 포트는 막히는 경우가 많다.

**4) 속도 차이는 생각보다 작다.** 비용 대부분은 헤더 크기가 아니라 네트워크 왕복(RTT), TLS 핸드셰이크, 서버 처리 시간이다. HTTP도 Keep-Alive로 연결을 재사용하고, HTTP/2는 멀티플렉싱·헤더 압축(HPACK)으로, HTTP/3는 QUIC(UDP 기반)으로 연결 비용을 줄여 왔다.

### 꼬리 질문 대비
| 질문 | 답변 요지 |
| --- | --- |
| 그럼 TCP 직접 쓰는 게 낫다고 할 때는? | 초저지연·고빈도 양방향 통신(게임 서버, 실시간 시세, 사내 내부 프로토콜)처럼 HTTP의 요청/응답 모델이 맞지 않거나 오버헤드가 문제일 때. 이 경우 길이-접두 프레이밍 같은 자체 규약을 설계한다. |
| 내부 서비스 간 통신도 REST/JSON이 최선인가? | 아니다. 성능이 중요하면 gRPC(HTTP/2 + Protobuf)를 쓴다. 즉 "HTTP를 버리는" 것이 아니라 HTTP/2 위에서 바이너리 직렬화를 쓰는 선택이 많다. (5G 코어의 SBI도 HTTP/2 기반 REST다.) |
| HTTP는 무상태인데 로그인은 어떻게? | 쿠키+세션(서버가 상태 보관) 또는 토큰(JWT, 서버는 검증만). 세션을 쓰면 확장성을 위해 Redis 같은 외부 저장소로 세션 클러스터링이 필요. |
| HTTP/1.1 / 2 / 3 차이? | 1.1: 텍스트, Keep-Alive, 요청 순서 대기(HOL blocking). 2: 바이너리 프레이밍, 한 연결에서 멀티플렉싱, HPACK, (TCP 레벨 HOL은 남음). 3: QUIC(UDP)로 TCP HOL 제거, 연결 설정 빠름(0/1-RTT), 연결 이동 가능. |
| GET과 POST 차이? | GET: 조회, 안전·멱등, 캐시 가능, 본문 비권장. POST: 생성/처리, 비멱등, 캐시 기본 불가. 보안 차이가 아니라 **의미(semantics)** 차이다. |
| PUT vs PATCH? | PUT: 자원 전체 교체(멱등). PATCH: 일부 수정(구현에 따라 멱등 여부 다름). |
| 멱등(Idempotent)이란? | 같은 요청을 여러 번 보내도 결과 상태가 같음. GET/PUT/DELETE는 멱등, POST는 아님. 재시도 정책과 결제 중복 방지(Idempotency-Key)에서 중요. |

---

## Q2. 브라우저에 `www.naver.com` 검색을 입력한 뒤 응답이 올 때까지

> [!WARNING]
> 네이버 내부 구조는 비공개이므로 아래는 **대규모 웹 서비스의 일반적인 구성**에 Spring 서버를 끼워 넣은 설명이다. 면접에서도 "일반적으로는 이렇습니다"라고 전제하고 답하는 편이 안전하다. 특히 검색 엔진은 일반 RDB가 아니라 **역색인(Inverted Index) 기반 검색 엔진**을 쓰는 것이 일반적이다.

### 전체 지도
```
[브라우저]
  ① URL 파싱 · 브라우저 캐시 · HSTS
  ② DNS 조회  ─────────→ (캐시 → 재귀 리졸버 → Root → TLD → 권한 NS) → CNAME(CDN) → IP
  ③ TCP 3-way handshake
  ④ TLS handshake (인증서 검증, 키 교환, ALPN으로 h2/h3 협상)
  ⑤ HTTP 요청 전송
        │
        ▼
[CDN 엣지]  정적 리소스는 캐시 HIT면 여기서 응답 / 동적 요청은 오리진으로 전달
        │
        ▼
[L4/L7 로드밸런서 · WAF · API Gateway]
        │
        ▼
[Web 서버 (Nginx/Apache)]  정적 파일 · 리버스 프록시 · gzip · 타임아웃
        │
        ▼
[WAS (Tomcat) + Spring]
  커넥터 스레드 → Filter → DispatcherServlet → Interceptor → Controller
        → Service(@Transactional) → Repository → 커넥션 풀 → 캐시/DB
        │
        ▼  (응답은 같은 경로를 역방향으로)
[브라우저]  HTML 파싱 → DOM/CSSOM → 하위 리소스 병렬 요청 → 렌더링
```

### ① 브라우저 내부 처리
- 입력이 URL인지 검색어인지 판별, 스킴·호스트·경로 파싱.
- **HSTS 목록**에 있으면 `http://`를 내부적으로 `https://`로 승격.
- 브라우저 캐시/Service Worker 확인. 신선한 캐시가 있으면(`Cache-Control: max-age`) 네트워크 요청 없이 끝난다. 만료됐으면 `ETag`/`If-None-Match`로 **조건부 요청**을 보내 `304`를 받을 수 있다.

### ② DNS 처리
조회 순서: **브라우저 DNS 캐시 → OS 캐시/`hosts` 파일 → 재귀 리졸버(ISP/공용 DNS) 캐시 → 반복 질의.**
```
리졸버 → Root(.) : ".com 네임서버 어디?"
       → TLD(.com) : "naver.com 권한 네임서버 어디?"
       → 권한 NS : "www.naver.com = CNAME → ... (CDN 도메인) → A/AAAA 레코드(IP)"
```
- 각 응답은 **TTL** 동안 캐시되어 대부분의 요청은 앞 단계에서 끝난다.
- 대형 서비스는 `CNAME`으로 CDN 도메인에 연결하고, **GSLB/Anycast**로 사용자와 가까운 엣지·데이터센터 IP를 돌려준다. DNS 기반 부하 분산이므로 TTL을 짧게 두는 경우가 많다.

### ③ TCP 연결 (3-way handshake)
`SYN → SYN+ACK → ACK`. 연결이 이미 있다면(Keep-Alive, HTTP/2 연결 재사용) 생략된다. HTTP/3는 UDP 기반 QUIC이라 이 단계가 다르다.

### ④ TLS 핸드셰이크 (HTTPS)
- `ClientHello`(지원 암호군, **SNI**로 도메인 전달, **ALPN**으로 `h2`/`http/1.1` 협상) → `ServerHello` + 인증서 체인.
- 클라이언트가 **인증서 체인 검증**(신뢰하는 CA, 유효기간, 도메인 일치, 폐기 여부) 후 키 교환(ECDHE) → 세션 키로 이후 통신을 대칭키 암호화.
- TLS 1.3은 1-RTT, 재접속 시 0-RTT 가능. TLS 종료(termination)는 CDN/로드밸런서에서 하는 경우가 많다.

### ⑤ HTTP 요청
```
GET /search?query=spring HTTP/2
Host: www.naver.com
Accept: text/html
Cookie: ...
Accept-Encoding: gzip, br
```

### ⑥ CDN
- **정적 리소스**(이미지, JS, CSS)는 엣지 캐시 HIT면 엣지에서 바로 응답. MISS면 상위 계층/오리진에서 가져와 캐시(`Cache-Control`, `s-maxage` 따라).
- **동적 요청**(검색 결과)은 캐시하지 않거나 짧게 캐시하고 오리진으로 전달. 엣지↔오리진 사이는 최적화된 연결을 유지해 지연을 줄인다.
- DDoS 완충, TLS 종료, 압축, 이미지 최적화도 담당.

### ⑦ 로드밸런서 · WAF
- **L4**: IP/포트 기준 분산. **L7**: URL·헤더·쿠키 기준 분산, 헬스체크, 장애 서버 제외.
- **WAF**: SQL Injection·XSS 같은 패턴 차단, Rate Limit.

### ⑧ Web 서버 (Nginx/Apache)
- 정적 파일 직접 서빙, gzip 압축, 접속 수 제한, **리버스 프록시**로 WAS에 전달(`proxy_pass`), `X-Forwarded-For`로 원 클라이언트 IP 전달.
- Web과 WAS를 나누는 이유: 정적/동적 처리 분리, WAS 보호(느린 클라이언트 완충), 보안, 확장 용이.

### ⑨ WAS (Tomcat) + Spring MVC 처리
```
Connector(NIO)가 소켓 수락 → 요청 파싱(HttpServletRequest 생성)
  → 워커 스레드 풀에서 스레드 1개 배정 (Thread-per-request)
  → Filter 체인 (인코딩, 보안/인증 필터 등)
  → DispatcherServlet
       1. HandlerMapping : URL+메서드 → 처리할 Controller 메서드 탐색
       2. HandlerAdapter : 실행 준비
       3. Interceptor.preHandle (로그인 체크, 로깅)
       4. ArgumentResolver : @PathVariable, @RequestParam, @RequestBody(Jackson으로 JSON→객체), 검증(@Valid)
       5. Controller 메서드 실행
            → Service (@Transactional 프록시가 트랜잭션 시작)
            → Repository (JPA/MyBatis)
            → 캐시 조회 / DB 조회
       6. ReturnValueHandler : @ResponseBody면 HttpMessageConverter가 객체→JSON
          (뷰 렌더링이라면 ViewResolver → 템플릿 렌더)
       7. Interceptor.postHandle / afterCompletion
  → Filter 역순 → 응답 전송, 스레드는 풀로 반환
```
- 예외가 나면 `@ControllerAdvice`/`@ExceptionHandler`가 상태 코드와 에러 응답으로 변환한다.
- Tomcat 주요 설정: `maxThreads`(기본 200), `acceptCount`(대기 큐), `maxConnections`, `connectionTimeout`. 스레드가 다 차면 요청이 큐에 쌓이다 거절된다.

### ⑩ DB 처리와 캐싱
**캐시 전략(Cache-Aside)**
```
요청 → 로컬 캐시(Caffeine) → Redis → (MISS) → DB 조회 → Redis/로컬에 채움 → 응답
```
- 캐시 무효화, **Cache Stampede**(만료 시 동시 DB 폭주; 락/TTL 지터/사전 갱신으로 대응), 정합성(쓰기 시 삭제 vs 갱신)이 단골 꼬리 질문.

**DB 접근**
1. `HikariCP`에서 **커넥션 풀**의 커넥션을 빌린다(없으면 `connectionTimeout`까지 대기).
2. SQL 전송 → DB가 파싱 → 옵티마이저가 실행 계획 수립(인덱스 선택) → **버퍼 풀**(메모리)에 있으면 메모리에서, 없으면 디스크에서 읽기.
3. 결과 반환 → 커넥션 반납 → 결과를 객체로 매핑.
4. 읽기 부하는 **Replica(읽기 전용)** 로 분산, 쓰기는 Primary. (복제 지연 때문에 직후 읽기는 Primary로 보내기도 한다.)
5. 검색 서비스라면 질의는 RDB가 아니라 **검색 엔진(역색인)** 에서 처리하고, RDB는 회원·결제 같은 정합성이 필요한 데이터에 쓴다.

### ⑪ 응답이 돌아오는 길
- Controller 결과 → JSON/HTML 직렬화 → 상태 코드/헤더(`Content-Type`, `Cache-Control`, `Set-Cookie`) → Tomcat → Nginx(gzip 압축) → LB → CDN(캐시 가능하면 저장) → 브라우저.
- 브라우저는 HTML 파싱 → **DOM + CSSOM → Render Tree → Layout → Paint → Composite.** HTML 안의 CSS/JS/이미지는 **병렬로 추가 요청**(대부분 CDN에서 HIT). JS 실행으로 API(Ajax/fetch) 호출이 이어질 수 있다.

### 단계별 병목과 최적화 요약
| 구간 | 병목 | 대응 |
| --- | --- | --- |
| DNS | 조회 지연 | TTL, DNS prefetch, 리졸버 캐시 |
| 연결 | TCP/TLS RTT | Keep-Alive, HTTP/2·3, TLS 1.3, 세션 재개 |
| 전송 | 대역폭 | CDN, 압축(gzip/br), 이미지 최적화, 캐시 헤더 |
| WAS | 스레드 포화 | 스레드 풀 튜닝, 비동기/논블로킹(WebFlux), 타임아웃, 서킷 브레이커 |
| DB | 느린 쿼리, 커넥션 고갈 | 인덱스, N+1 제거, 커넥션 풀 크기, 캐시, Replica |
| 브라우저 | 렌더링 차단 | JS defer/async, 리소스 최소화, Lazy loading |

### 꼬리 질문 대비
| 질문 | 답변 요지 |
| --- | --- |
| DNS에서 CNAME과 A 레코드 차이? | A: 도메인→IPv4 직접. CNAME: 도메인→다른 도메인 별칭(CDN 연결에 흔함). 루트 도메인에는 CNAME을 못 두는 제약이 있다. |
| HTTPS가 왜 안전한가? | 인증서로 서버 신원 확인(MITM 방지) + 키 교환 후 대칭키로 암호화(도청 방지) + MAC/AEAD로 변조 탐지. |
| Web 서버와 WAS를 왜 나누나? | 정적/동적 분리, 보안(WAS 직접 노출 방지), 부하 분산, 느린 클라이언트로부터 WAS 스레드 보호. |
| Filter와 Interceptor 차이? | Filter: 서블릿 스펙, DispatcherServlet **앞**, 모든 요청(인코딩·보안). Interceptor: Spring MVC, **Handler 전후**, 스프링 빈 활용 쉬움. |
| 요청마다 스레드를 쓰면 문제는? | 동시 요청이 많고 I/O 대기가 길면 스레드 고갈. 대안: WebFlux(이벤트 루프), Java 21 Virtual Thread. |
| 세션은 어디에 저장? | 단일 서버면 메모리, 다중 서버면 Redis 등 외부 저장소(Spring Session) 또는 무상태 토큰. |
| 캐시 종류를 나열해보라 | 브라우저 캐시, CDN, 리버스 프록시 캐시, 애플리케이션 로컬 캐시, 분산 캐시(Redis), DB 버퍼 풀. |

## 관련 문서
- [Spring·Web 빈출 질문](기술면접/WEB/[JAVA%20기술면접]%20Spring·Web%20빈출%20질문.md)
- [동시성·락](기술면접/WEB/[JAVA%20기술면접]%20동시성·락%20—%20String%20계열·락%20종류·데드락.md)

---
title: "MSA·분산 시스템 용어"
tags: [학습, IT용어집, MSA, 분산시스템, 장애대응, Kafka]
created: 2026-10-02
modified: 2026-10-02
---

# MSA·분산 시스템 용어

> 마이크로서비스, 서비스 메시, 장애 전파 방지, 분산 추적, Kafka 등 분산 구조 용어

- 용어 22개

---

### MSA (Microservices Architecture)

**하나의 큰 시스템(monolith)을 기능별 작은 독립 서비스로 나누어 각각 배포하고 확장하는 구조.**

- 서비스가 독립적인 대신 서비스 간 호출이 늘어 장애 전파, 추적, 일관성 문제가 생긴다.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### service mesh (서비스 메시)

**서비스 간 통신 기능(재시도, 타임아웃, mTLS, 라우팅, 모니터링)을 애플리케이션 코드 밖의 인프라 계층으로 빼낸 것.**

- 각 서비스 옆에 사이드카 프록시(보통 Envoy)가 붙어 트래픽을 대신 주고받고, control plane(예: Istio)이 정책을 내려 준다.
- application에서 직접 처리(예: Resilience4j)하면 비즈니스 맥락을 알고 세밀하게 제어할 수 있고, mesh에 맡기면 언어와 무관하게 일괄 적용된다. 어느 쪽에서 처리할지는 팀의 선택이다.
- Kafka처럼 HTTP가 아닌 자체 프로토콜은 mesh가 "처리 실패"를 알 수 없어 application에서 처리하는 경우가 많다(이 부분은 일반적인 이유이고 모든 팀이 같지는 않다).
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### sidecar (사이드카)

**주 프로세스 옆에 함께 배치되어 부가 기능(프록시, 로그 수집 등)을 대신하는 보조 프로세스·컨테이너.**

- 한 pod 안에 앱 컨테이너와 sidecar 컨테이너를 같이 둔다.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md) · [쿠버네티스 기본 개념 - Pod·Node·Cluster·Deployment](개발%20%28CS%29/인프라/컨테이너·가상화/[K8s]%20쿠버네티스%20기본%20개념%20-%20Pod·Node·Cluster·Deployment.md)

### circuit breaker (서킷 브레이커)

**장애가 난 서비스로 가는 호출을 일시적으로 차단해, 장애가 호출하는 쪽으로 번지지 않게 하는 장치. 집의 차단기에서 따온 이름.**

- 상태 3개: Closed(정상, 실패율 집계) → Open(차단, 호출하지 않고 즉시 실패나 대체값 반환) → Half-Open(일부만 보내 회복 확인) → 성공하면 Closed, 실패하면 다시 Open.
- Java에서는 Resilience4j가 대표적이다.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### cascading failure (연쇄 장애)

**한 서비스의 장애가 그것을 호출하는 서비스로 연쇄적으로 번지는 현상.**

- 예) B가 느려지면 B를 호출하는 A의 스레드가 응답을 기다리며 묶이고, A의 스레드 풀이 바닥나 A도 장애가 되고, A를 호출하는 서비스도 같은 길을 간다.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### fail fast

**오래 기다리지 않고 바로 실패를 반환하는 것.**

- circuit breaker가 Open 상태일 때의 동작이다. 호출하는 쪽의 자원이 묶이지 않는다.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### bulkhead (벌크헤드, 격벽)

**배의 격벽처럼 호출 대상별로 스레드 풀·커넥션 같은 자원을 나누어, 한 곳이 막혀도 다른 곳의 자원은 남도록 하는 것.**

- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### fallback (폴백)

**원래 처리가 실패했을 때 대신 돌려주는 값이나 대체 동작.**

- 예) 호출에 실패하면 캐시에 있던 이전 값을 반환.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### retry / exponential backoff

**retry는 실패한 요청을 다시 시도하는 것, exponential backoff는 재시도 간격을 1초, 2초, 4초처럼 점점 늘리는 것.**

- 간격에 무작위 값(jitter)을 더하면 재시도가 동시에 몰리는 retry storm을 줄인다. 재시도는 멱등한 요청에만 안전하다.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### timeout (connection / read / idle)

**connection timeout은 연결을 맺을 때까지, read timeout은 응답을 읽을 때까지, idle timeout은 놀고 있는 연결을 끊기까지의 기다림 한도.**

- 타임아웃이 없으면 느린 상대 때문에 스레드가 무한정 묶인다.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### distributed tracing / trace ID (분산 추적)

**요청 하나가 여러 서비스를 거치는 흐름을 하나로 묶어 추적하는 것.**

- 모든 호출에 같은 trace ID가 따라다니게 하는데, 그 ID를 실어 나르는 곳이 HTTP 헤더다. 표준 헤더 예) W3C `traceparent`, Zipkin `X-B3-TraceId`.
- 받은 헤더를 다음 호출에 그대로 복사해 넘기는 것을 헤더 릴레이(relay)라 한다. 개발자가 손으로 복사하면 빠뜨리기 쉬워서 사내 HTTP client가 자동으로 붙이게 만든다.
- 비동기로 스레드가 바뀌면 ThreadLocal에 둔 trace 정보가 사라지므로 context propagation(컨텍스트 전파) 처리가 따로 필요하다.
- 학습 노트: [분산 추적(Distributed Tracing)과 비동기 스레드 컨텍스트 전파 아키텍처 (TraceContext, Netty, Spring Batch)](개발%20%28CS%29/인프라/모니터링·네트워크/[APM]%20분산%20추적%28Distributed%20Tracing%29과%20비동기%20스레드%20컨텍스트%20전파%20아키텍처%20%28TraceContext,%20Netty,%20Spring%20Batch%29.md)

### shadow traffic (shadow request)

**실제 요청을 복제해 새 시스템에도 보내 보고, 응답은 버리고 결과만 비교하는 안전한 검증 방법.**

- 시스템을 교체하거나 합치기 전에 새 시스템이 옛 시스템과 같은 결과를 내는지 확인한다.

### dry-run

**실제로 반영하지 않고 실행만 해 보는 것.**

- 마이그레이션이나 배포 전에 "실행하면 무엇이 바뀌는지"를 미리 확인한다.

### migration (마이그레이션)

**데이터나 시스템을 한 방식에서 다른 방식으로 옮기는 작업.**

- 검증 방법 예) 건수, 합계, 해시 값을 옛 시스템과 새 시스템에서 비교(aggregate count, sum, hash).

### dynamic config / feature flag

**재배포 없이 설정(타임아웃, 기능 on/off 등)을 바꾸고 모든 인스턴스에 즉시 반영하는 방식.**

- 설정 서버를 둔다. 예) Consul KV, Spring Cloud Config. feature flag는 기능 켜고 끄기를 설정으로 하는 것.

### fault injection / chaos engineering

**운영과 비슷한 환경에서 장애(지연, 오류 응답, 서버 종료)를 일부러 주입해 약점을 미리 찾는 것.**

- "이 API가 3초 지연되면?", "500을 반환하면?"을 시험한다. 타임아웃 미설정, circuit breaker가 안 열림, 폴백 미동작 같은 약점을 실제 장애 전에 발견한다.
- 장애 대응을 반복 연습하는 효과가 있어 복구도 빨라진다. 대표 사례: Netflix의 Chaos Monkey(서버를 무작위로 종료).
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md)

### SPOF (Single Point of Failure)

**그것 하나가 죽으면 전체가 멈추는 단일 장애점.**

- 이중화로 없앤다.
- 학습 노트: [장애 전파 방지 패턴 - Circuit Breaker·Bulkhead·Retry·Rate Limit](개발%20실무/아키텍처·설계/[Architecture]%20장애%20전파%20방지%20패턴%20-%20Circuit%20Breaker·Bulkhead·Retry·Rate%20Limit.md) · [서버 장애 대응 방안](개발%20%28CS%29/인프라/인프라%20기초%20지식/[CS]%20서버%20장애%20대응%20방안%20-%20핵심%20개념%20및%20특징%20정리.md)

### cold start (콜드 스타트)

**서버나 캐시가 막 시작되어 비어 있고 준비가 덜 된 상태.**

- 처음 요청이 느리거나 원본에 부하가 몰린다.
- 학습 노트: [캐시 전략과 운영 이슈 - Redis·stampede·무효화·write-behind](개발%20실무/아키텍처·설계/[Architecture]%20캐시%20전략과%20운영%20이슈%20-%20Redis·stampede·무효화·write-behind.md)

### push vs pull

**push는 보내는 쪽이 상대를 호출해 밀어 넣는 방식, pull은 받는 쪽이 필요할 때 가져가는 방식.**

- HTTP 호출은 push, Kafka 소비는 pull이다.
- 학습 노트: [Kafka 핵심 개념 - Topic·Partition·Offset·DLQ](개발%20실무/아키텍처·설계/[Kafka]%20Kafka%20핵심%20개념%20-%20Topic·Partition·Offset·DLQ.md)

### Kafka (카프카)

**대량의 메시지를 저장하며 주고받는 분산 메시지 브로커(이벤트 스트리밍 플랫폼).**

- producer가 topic에 메시지를 쓰고, consumer가 가져가 처리한다. consumer는 어디까지 읽었는지를 offset으로 기록한다.
- topic은 여러 partition으로 나뉘어 병렬로 처리된다. 같은 key의 메시지는 항상 같은 partition으로 가서 순서가 보장된다(`partition = hash(key) % partition 수`).
- 메시지 처리에 실패하면 재시도용 토픽으로 보내거나 offset을 커밋하지 않고 다시 읽는다. 끝내 실패한 메시지는 DLQ(Dead Letter Queue)에 따로 보관한다.
- 학습 노트: [Kafka 핵심 개념 - Topic·Partition·Offset·DLQ](개발%20실무/아키텍처·설계/[Kafka]%20Kafka%20핵심%20개념%20-%20Topic·Partition·Offset·DLQ.md) · [메시지 큐 도입 위치 결정](개발%20%28CS%29/인프라/모니터링·네트워크/[HTTP]%20메시지%20큐%20도입%20위치%20결정%20-%20핵심%20개념%20및%20특징%20정리.md)

### DLQ (Dead Letter Queue)

**끝내 처리하지 못한 메시지를 따로 보관하는 큐.**

- 나중에 원인을 분석하거나 수동으로 재처리한다.
- 학습 노트: [Kafka 핵심 개념 - Topic·Partition·Offset·DLQ](개발%20실무/아키텍처·설계/[Kafka]%20Kafka%20핵심%20개념%20-%20Topic·Partition·Offset·DLQ.md)

### key rolling (Kafka)

**partition을 정하는 key를 일정 시간(또는 건수)마다 바꿔 가며 쓰는 방식.**

- 고정 key는 한 partition에 몰리고(hot partition), 매번 랜덤 key는 batch가 잘게 쪼개진다. 짧은 구간에서는 같은 key로 batch를 크게 만들고, 길게 보면 모든 partition에 고르게 퍼뜨린다. 로그처럼 순서가 중요하지 않을 때 쓴다.
- 학습 노트: [Kafka 핵심 개념 - Topic·Partition·Offset·DLQ](개발%20실무/아키텍처·설계/[Kafka]%20Kafka%20핵심%20개념%20-%20Topic·Partition·Offset·DLQ.md)

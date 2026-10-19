---
title: "[JAVA 기술면접] 멀티 DB 트랜잭션 — 분산 트랜잭션·XA·Saga"
tags: [기술면접, JAVA 관련 기술면접, 트랜잭션, 분산 트랜잭션, XA, 2PC, Saga, Spring, JPA]
created: 2026-10-19
modified: 2026-10-19
---

# [JAVA 기술면접] 멀티 DB 트랜잭션 — 분산 트랜잭션·XA·Saga

> [!NOTE]
> 질문: **DB를 Active-Active로 두고 서로 다른 목적으로 쓰는데, 한 서버가 두 DB에 걸쳐 트랜잭션이 필요하면 어떻게 구현하나?**
> 핵심은 "DB 하나의 ACID 트랜잭션은 다른 DB까지 확장되지 않는다"는 사실을 알고, **강한 일관성(2PC/XA)** 과 **최종 일관성(Saga/Outbox)** 중 상황에 맞게 고르는 것이다.

---

## 0. 먼저 용어 정리 (면접에서 되묻기 좋은 지점)

"Active-Active"는 두 가지로 해석될 수 있어 먼저 확인한다.
| 해석 | 의미 | 트랜잭션 관점 |
| --- | --- | --- |
| **(A) 서로 다른 DB를 둘 다 활성으로 사용** (예: 주문 DB + 정산 DB) | 데이터가 다르다 | 한 업무가 **두 DB를 모두 수정** → 분산 트랜잭션 문제 |
| **(B) 같은 데이터를 양쪽 모두 쓰기 가능한 복제** (멀티 마스터) | 같은 데이터가 두 곳 | 분산 트랜잭션보다 **쓰기 충돌 해결**(Conflict Resolution)이 핵심 |

이 문서는 질문의 "다른 목적으로 쓰는 2개의 DB"에 맞춰 **(A)** 를 중심으로 설명한다.

---

## 1. 왜 어려운가

단일 DB의 `COMMIT`은 그 DB 안에서만 원자적이다. 서버가 DB-A에 커밋한 뒤 DB-B 커밋 직전에 장애가 나면 **A는 반영, B는 미반영**인 불일치 상태가 된다.

```
begin A  → update A → begin B → update B → commit A ✔ → (장애) → commit B ✘
                                             ▲ A만 반영된 상태
```

---

## 2. 해결 방안 비교

| 방식 | 일관성 | 핵심 아이디어 | 장점 | 단점 |
| --- | --- | --- | --- | --- |
| **① 분산 트랜잭션: JTA + XA (2PC)** | 강한 일관성 | 트랜잭션 매니저가 Prepare → Commit 2단계로 모든 DB를 함께 커밋/롤백 | 코드가 단순(`@Transactional` 그대로), ACID 유지 | 느림, 락 오래 유지, 코디네이터 장애 시 **in-doubt 트랜잭션**, DB/드라이버가 XA를 지원해야 함 |
| **② Best-effort 1PC (ChainedTransactionManager)** | 약함 | 트랜잭션 매니저 여러 개를 순서대로 커밋, 역순으로 롤백 | 구현 쉬움 | 첫 커밋 성공 후 두 번째 실패 시 **불일치 가능**. Spring 5.3부터 deprecated, 6에서 제거 |
| **③ Saga** | 최종 일관성 | 각 DB 로컬 트랜잭션을 순서대로 수행, 실패 시 **보상 트랜잭션**으로 되돌림 | 확장성·가용성 좋음, 락 없음 | 보상 로직 설계 필요, 중간 상태가 노출됨(격리성 없음) |
| **④ Transactional Outbox + 메시지** | 최종 일관성 | 한 DB에 데이터와 이벤트를 **같은 로컬 트랜잭션**으로 저장 → 별도 프로세스가 이벤트를 발행해 다른 DB 갱신 | 메시지 유실 방지, 로컬 트랜잭션만 사용 | 소비자 **멱등성** 필요, 지연 발생 |
| **⑤ TCC (Try-Confirm-Cancel)** | 최종 일관성(준강함) | 자원을 예약(Try) → 확정(Confirm)/취소(Cancel) | 격리성을 어느 정도 확보 | 모든 서비스에 3개 API 구현 필요 |
| **⑥ 설계 변경** | — | 한 트랜잭션이 두 DB를 건드리지 않도록 **경계(Aggregate)를 재설계** | 가장 단순하고 안전 | 도메인 분리가 어려울 수 있음 |

### 선택 가이드
```
1) 두 DB를 한 트랜잭션으로 묶지 않을 수 있는가?  → ⑥ 먼저 검토 (가장 좋은 답)
2) 금융 이체처럼 강한 일관성이 필수, 트래픽은 크지 않음 → ① XA/2PC
3) 트래픽·가용성이 중요, 잠깐의 불일치 허용      → ③ Saga 또는 ④ Outbox
4) "무조건 XA" 또는 "무조건 Saga"로 답하지 않는다. 근거(일관성 요구 vs 성능/가용성)를 말한다.
```

---

## 3. Spring에서의 구현

### 3.1 DataSource / TransactionManager 분리 (공통 기반)
```java
@Configuration
@EnableTransactionManagement
class DbConfig {
    @Bean @Primary
    DataSource orderDs() { /* HikariDataSource for DB-A */ }

    @Bean
    DataSource settleDs() { /* HikariDataSource for DB-B */ }

    @Bean @Primary
    PlatformTransactionManager orderTm(@Qualifier("orderDs") DataSource ds) {
        return new DataSourceTransactionManager(ds);   // JPA면 JpaTransactionManager
    }

    @Bean
    PlatformTransactionManager settleTm(@Qualifier("settleDs") DataSource ds) {
        return new DataSourceTransactionManager(ds);
    }
}

@Service
class OrderService {
    @Transactional("orderTm")      // 어느 DB의 트랜잭션인지 명시
    public void createOrder() { ... }
}
```
- 트랜잭션 매니저는 **하나의 DataSource에 묶인다.** `@Transactional` 하나로는 두 DB가 묶이지 않는다는 점이 핵심 포인트.
- JPA는 DB마다 `EntityManagerFactory`와 패키지 스캔 범위를 분리해야 한다.

### 3.2 ① XA / JTA 방식
- JTA 구현체: **Atomikos, Narayana, Bitronix**(Spring Boot 3에서는 Atomikos/Narayana 스타터 사용). `XADataSource`로 DB를 등록하고 `JtaTransactionManager` 하나로 두 DB를 함께 커밋한다.
- 흐름: **Phase 1(Prepare)**: 모든 참여자가 "커밋할 준비 완료"를 로그에 기록하고 응답 → **Phase 2(Commit)**: 모두 OK면 일괄 커밋, 하나라도 실패하면 일괄 롤백.
- 주의: 코디네이터가 Prepare 후 죽으면 참여 DB가 락을 쥔 채 대기(in-doubt) → 복구 로그와 수동 해결 절차 필요. MySQL/Postgres의 XA는 지원하지만 성능·운영 부담이 크다.

### 3.3 ③④ Saga / Outbox 방식 (실무에서 더 흔함)
```java
@Transactional("orderTm")
public void placeOrder(OrderCmd cmd) {
    Order o = orderRepo.save(new Order(cmd));              // DB-A 로컬 트랜잭션
    outboxRepo.save(new OutboxEvent("OrderPlaced", o.id)); // 같은 트랜잭션으로 이벤트 저장
}   // 커밋되면 둘 다 반영, 롤백되면 둘 다 취소

// 별도 퍼블리셔(폴링 또는 CDC/Debezium)가 outbox를 읽어 메시지 발행
// 소비자: 정산 서비스가 DB-B에 반영 (멱등 처리 필수), 실패 시 재시도/DLQ
// 보상 필요 시: OrderCancelled 이벤트로 DB-A 상태 되돌리기
```
- **소비자 멱등성**: 이벤트 ID를 저장해 중복 처리를 막는다(메시지는 "최소 한 번" 전달이 기본).
- **보상 트랜잭션**은 "롤백"이 아니라 **업무적으로 되돌리는 새 트랜잭션**(예: 결제 취소 → 환불)이다.
- Orchestration(중앙 조정자가 순서 지시) vs Choreography(이벤트로 서로 반응) 방식이 있다.

---

## 4. 꼬리 질문 대비

| 질문 | 답변 요지 |
| --- | --- |
| 2PC의 문제점? | 코디네이터가 SPOF, Prepare~Commit 동안 락 유지로 처리량 저하, 네트워크 분할/장애 시 in-doubt, 모든 참여자가 XA 지원해야 함. |
| CAP 정리와의 관계? | 네트워크 분할(P) 상황에서 일관성(C)과 가용성(A) 중 선택. 2PC는 C 우선, Saga는 A 우선(최종 일관성). |
| 최종 일관성이란? | 일시적으로 불일치해도 시간이 지나면 모두 같은 상태로 수렴. 사용자에게는 "처리 중" 같은 중간 상태를 보여줘야 할 수 있음. |
| Outbox를 쓰는 이유? | "DB 커밋"과 "메시지 발행"은 서로 다른 시스템이라 원자적이지 않다(이중 쓰기 문제). 이벤트를 DB에 같이 저장해 이 문제를 제거한다. |
| 멱등성을 어떻게 보장? | 요청/이벤트에 고유 키를 부여하고 처리 이력 테이블에 유니크 제약으로 중복 차단. |
| Active-Active 멀티 마스터에서 같은 행을 양쪽에서 수정하면? | 충돌 해결 정책 필요: Last-Write-Wins, 버전 벡터, 업무 규칙(키 범위로 쓰기 영역 분리) 등. 가장 안전한 방법은 **데이터별 쓰기 담당 DB를 하나로 고정**하는 것. |
| 읽기 전용 복제본으로 읽으면 방금 쓴 데이터가 안 보이는데? | 복제 지연 때문. 쓰기 직후 읽기는 Primary로, 또는 Read-Your-Writes 보장 로직 적용. |

---

## 5. 함께 나오는 Spring 트랜잭션 질문

| 질문 | 답변 요지 |
| --- | --- |
| `@Transactional`은 어떻게 동작? | AOP **프록시**가 메서드 호출을 가로채 트랜잭션 시작/커밋/롤백을 수행. 인터페이스가 있으면 JDK 동적 프록시, 없으면 CGLIB(Spring Boot 기본은 CGLIB). |
| 같은 클래스 내부 호출 시 안 되는 이유? | `this.method()`는 프록시를 거치지 않아 AOP가 적용되지 않음(self-invocation). 별도 빈으로 분리하거나 자기 자신을 주입해 호출. |
| `private` 메서드에 붙이면? | 프록시 방식에서는 적용되지 않는다(public 메서드 기준). |
| 롤백 규칙? | 기본은 **RuntimeException/Error**에서만 롤백. Checked 예외는 커밋 → `rollbackFor = Exception.class`로 변경. |
| 전파(Propagation) 옵션? | `REQUIRED`(기본: 있으면 참여, 없으면 생성), `REQUIRES_NEW`(항상 새로 생성, 기존 보류), `NESTED`(세이브포인트), `SUPPORTS`, `MANDATORY`, `NOT_SUPPORTED`, `NEVER`. |
| 격리 수준(Isolation)? | `READ_UNCOMMITTED` / `READ_COMMITTED` / `REPEATABLE_READ` / `SERIALIZABLE`. 높을수록 이상 현상(Dirty/Non-repeatable/Phantom read)이 줄고 동시성이 낮아진다. MySQL InnoDB 기본은 `REPEATABLE_READ`, Oracle/Postgres 기본은 `READ_COMMITTED`. |
| `readOnly = true`의 효과? | JPA는 flush 생략·스냅샷 최적화, 일부 DB/드라이버는 읽기 전용 힌트 사용. 쓰기를 막는 보안 장치는 아니다. |
| 트랜잭션 안에서 외부 API 호출을 하면? | 커넥션을 오래 점유해 풀 고갈 위험. 외부 호출은 트랜잭션 밖으로 빼거나 Outbox로 분리. |
| `@Transactional`을 Controller에 두면? | 트랜잭션이 너무 넓어져 응답 직렬화·뷰 렌더링까지 커넥션 점유. 보통 Service 계층에 둔다. |

## 관련 문서
- [동시성·락](기술면접/WEB/[JAVA%20기술면접]%20동시성·락%20—%20String%20계열·락%20종류·데드락.md)
- [HTTP·REST와 요청 처리 전체 흐름](기술면접/WEB/[JAVA%20기술면접]%20HTTP·REST와%20요청%20처리%20전체%20흐름.md)
- [Spring·Web 빈출 질문](기술면접/WEB/[JAVA%20기술면접]%20Spring·Web%20빈출%20질문.md)

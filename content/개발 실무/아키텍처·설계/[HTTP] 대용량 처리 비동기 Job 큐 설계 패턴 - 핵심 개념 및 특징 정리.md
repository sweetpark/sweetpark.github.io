---
title: "대용량 처리 비동기 Job 큐 설계 패턴"
tags: [학습, 개발실무, 아키텍처]
modified: 2026-09-05
---

# 대용량 처리 비동기 Job 큐 설계 패턴

> [!NOTE]
> 웹 요청-응답 주기 안에서 처리할 수 없는 대용량 작업(대용량 엑셀 생성 등)을 DB 기반 Job 큐 + Worker 풀로 비동기 처리하는 설계 패턴. 이중화(다중 서버) 환경에서의 중복 처리 방지, 재기동 복구, 취소, 멱등성까지 포함한 종합 정리.

---

## 언제 필요한가

- 요청 1건 처리 시간이 HTTP 응답 타임아웃보다 길 수 있다(수만~수십만 건 데이터 가공).
- 서버가 여러 대(이중화)로 떠 있어, 같은 작업을 두 서버가 동시에 처리하면 안 된다.
- 서버가 처리 도중 재시작되어도 사용자가 폴링 중인 작업을 잃어버리면 안 된다.

이런 조건이 하나라도 있으면 "즉시 처리 후 응답" 대신 **Job 등록 → 비동기 처리 → 폴링/알림으로 완료 확인** 구조가 필요하다.

---

## 핵심 구조

```text
[클라이언트] POST 요청
      │
      ▼
[등록 API] Job을 DB에 PENDING 으로 INSERT
      │        + BlockingQueue.offer(job)  ← 인메모리 전달 채널(폴링 없이 즉시 깨움)
      │        ← jobId 반환
      ▼
[Worker 풀] queue.take() 로 블로킹 대기 → 즉시 수신
      │
      ▼
CAS 로 Job 선점 (아래 참조)
      │
      ▼
처리 → 진행률 갱신 → DONE/FAIL
      │
      ▼
[클라이언트] jobId로 폴링 → 완료 시 결과 다운로드
```

Job 상태는 `PENDING → RUNNING → DONE / FAIL` 단방향으로만 전이한다.

---

## 1. Job 저장소는 인메모리가 아니라 DB여야 하는 이유

초기에는 `ConcurrentHashMap`으로 Job을 관리하기 쉽지만, 두 가지 문제에 부딪힌다.

| 문제 | 인메모리 | DB |
|---|---|---|
| 서버 재시작 시 Job 유실 | 전부 사라짐 | 영속 — 재기동 후 복구 가능 |
| 이중화(2대 이상) 환경 | 서버마다 별도 Map → 상태 불일치 | 공유 테이블 하나로 일관성 유지 |

**결론**: Job 자체는 DB 테이블(상태·진행률·파라미터·결과경로)로 관리하고, "지금 처리해야 할 Job이 있다"는 신호 전달만 인메모리 큐(`BlockingQueue`)로 한다. DB 폴링(매초 SELECT)은 불필요한 쿼리와 로그 노이즈를 유발하므로, Job 등록 시 큐에 `offer()`하고 Worker가 `take()`로 즉시 수신하는 **Push 모델**을 쓴다.

---

## 2. CAS 기반 Job 선점 — 이중화 환경 중복 처리 방지

여러 서버가 동시에 큐를 갖고 있어도(각 서버가 자기 큐에 동일 Job을 올릴 수 있음), 실제 처리는 한 서버만 해야 한다. `UPDATE ... WHERE`의 원자성을 이용한다.

```sql
UPDATE JOB_TABLE
   SET STATUS = 'RUNNING', SERVER_ID = #{serverId}, STARTED_AT = #{now}
 WHERE JOB_ID = #{jobId}
   AND STATUS  = 'PENDING'
-- 영향받은 행 수 = 1 → 이 서버가 선점 성공
-- 영향받은 행 수 = 0 → 다른 서버가 이미 선점 → 이 Worker는 skip 하고 다음 Job으로
```

DB의 단일 UPDATE 문이 원자적으로 실행되므로, 별도 분산 락 없이도 "정확히 한 Worker만 처리"를 보장한다.

---

## 3. Queue 이원화 — 큰 작업이 작은 작업을 블로킹하지 못하게

단일 큐 + 고정 Worker 풀 구조에서는, 처리 시간이 긴 대용량 Job이 먼저 들어오면 그 뒤의 소량 Job들이 대용량 Job이 끝날 때까지 대기하게 된다.

```text
Before: [대용량 Job(8분 소요)] → [소량 Job A] → [소량 Job B]
        ↑ Worker 1개가 순서대로 처리 → 소량 요청이 8분 대기

After:  normalJobQueue → normal-worker-{n}  (소량 전용)
        largeJobQueue  → large-worker-{n}   (대용량 전용)
        → 소량 요청은 normalJobQueue에서 즉시 처리
```

Job 등록 시 예상 처리 규모(건수 등)를 기준으로 큐를 분기(`resolveQueue()`)하고, 재기동 복구 시에도 동일한 분기 로직으로 각 큐에 재등록한다. 워커 수는 큐별로 독립 설정한다(예: 소량 4개, 대용량 2개).

---

## 4. 가상 스레드(Virtual Thread) Worker

Worker는 `queue.take()` 블로킹과 DB I/O 대기 시간이 길다. Java 21 가상 스레드는 이런 블로킹 구간에서 캐리어(OS) 스레드를 반납하므로, Worker 수를 늘려도 OS 스레드를 그만큼 소비하지 않는다.

```java
Thread.ofVirtual().name("worker-normal-" + i).start(() -> runLoop(normalQueue, ...));
```

> **주의**: 가상 스레드 안에서 레거시 라이브러리의 `synchronized` 블록(예: 엑셀 라이브러리 내부 스트리밍 writer)을 만나면 캐리어 스레드가 반환되지 못하고 "피닝(pinning)"될 수 있다. 처리량 기준으로 허용 범위인지 확인하고, 필요하면 상위 JDK 업데이트(JEP 491 등)로 해소를 기대한다.

---

## 5. 재기동 복구 — 좀비 RUNNING Job과 PENDING Job을 다르게 다룬다

서버가 비정상 종료(OOM, kill -9, 컨테이너 재시작)되면 `@PostConstruct`에서 자동 복구한다.

| 상태(재기동 전) | 처리 | 이유 |
|---|---|---|
| `RUNNING` (이 서버가 처리 중이던 것) | 임시 파일 삭제 + `FAIL` 전이 | 처리 도중 끊겼으므로 결과물이 손상됐을 가능성 — 재시도 유도 |
| `PENDING` (아직 처리 시작 전) | 큐에 재등록(offer) | 사용자가 여전히 폴링 중일 수 있음. CAS가 있으므로 여러 서버가 동시에 올려도 중복 처리 안 됨 |

`SERVER_ID` 컬럼으로 "이 서버가 만든 RUNNING Job"만 골라 복구한다 — 다른 서버가 처리 중인 Job까지 잘못 FAIL 처리하지 않기 위함이다(컨테이너 환경은 hostname이 겹칠 수 있으므로 명시적 식별자 권장).

**Orphan Job 인수**: 담당 서버가 아예 다운되어 Job이 영원히 PENDING으로 남는 경우를 대비해, 일정 시간(예: 2시간) 이상 PENDING 상태인 Job을 주기적으로 스캔해 다른 서버의 큐로 인수시키는 안전망을 둔다.

---

## 6. 취소 — RUNNING을 Thread.interrupt() 대신 폴링 플래그로

사용자가 진행 중인 Job을 취소하려 할 때, HTTP 요청을 받은 스레드는 **어느 Worker 스레드가 그 Job을 처리 중인지 알 수 없다**(별도 매핑을 유지하지 않는 한).

| 방식 | 장점 | 단점 |
|---|---|---|
| DB 플래그(`CANCEL_YN`) 폴링 | 구현 단순, Worker 스레드 안전, 정리 책임이 처리 루프에 집중 | 체크포인트 간격만큼 취소가 지연됨 |
| `Thread.interrupt()` | 즉시 중단 | jobId→Thread 매핑 관리 필요, 인터럽트가 처리 루프 전체(라이브러리 I/O 포함)에 전파되어 Worker 자체가 죽을 위험 |

체크포인트 지연이 UX상 허용 범위라면 **DB 플래그 폴링**이 더 안전하다. `Thread.interrupt()`는 한 Job만 중단시키려 했다가 Worker 스레드 자체를 죽여 이후 대기 중인 다른 Job까지 처리 못 하게 만들 위험이 있기 때문이다.

```text
PENDING 상태에서 취소  → STATUS를 즉시 FAIL로 전환
                        → Worker가 나중에 큐에서 꺼내도 CAS 조건(WHERE STATUS='PENDING') 불일치로 자동 skip
RUNNING 상태에서 취소  → CANCEL_YN='Y' 플래그만 설정
                        → 처리 루프가 일정 주기(진행률 갱신 시점)마다 플래그 확인 → 감지 시 중단 + 임시파일 정리 + FAIL 처리
```

---

## 7. 멱등성 — 중복 요청(더블클릭·재시도) 방어

동일한 `요청자 + 작업종류 + 파라미터` 조합의 PENDING Job이 이미 있으면 새 Job을 만들지 않고 기존 Job을 재사용한다.

- **PENDING만 재사용 대상**으로 삼는다. RUNNING/DONE은 재사용하지 않는다 — RUNNING은 이미 실패 진행 중일 수도 있고, DONE은 그 사이 데이터가 바뀌었을 수 있어 "최신 요청과 다른 결과"를 돌려줄 위험이 있다.
- 오래된 PENDING(멱등성 윈도우 초과)은 고착된 것으로 보고 무시한다.

---

## 8. 다른 영역에도 적용 가능한 이유

이 패턴은 "엑셀 생성"에 국한되지 않는다. 아래 조건을 만족하는 모든 배경 작업에 그대로 적용할 수 있다.

- 처리 시간이 길어 동기 응답이 부적절함
- 이중화 환경에서 중복 실행을 막아야 함
- 재시작 후에도 진행 상황을 잃지 않아야 함

예: 대용량 리포트 생성, 대량 알림 발송, 배치성 데이터 이관 작업 등.

## 관련 문서

- [(오픈소스) ha-excel-job-engine - 상세 분석 및 기술 가이드](../../프로젝트/오픈소스/[오픈소스]%20ha-excel-job-engine%20-%20상세%20분석%20및%20기술%20가이드.md) — 이 문서의 비동기 Job 큐 설계 패턴(PENDING/RUNNING 상태 전이, CAS 기반 중복 방지, 협력적 취소)을 실제로 구현한 오픈소스 프로젝트
- [(Performance) SXSSFWorkbook 대용량 엑셀 스트리밍과 동적 ZIP 분할 압축 설계 패턴](../백엔드·데이터처리/[Performance]%20SXSSFWorkbook%20대용량%20엑셀%20스트리밍과%20동적%20ZIP%20분할%20압축%20설계%20패턴.md) — 이 Job 큐의 large 워커가 실제로 실행하는 SXSSFWorkbook 스트리밍·청크 분할 설계
- [(Architecture) 가상 스레드(Virtual Thread) 기반 고가용성 분산 배치 엔진 설계](../아키텍처·설계/[Architecture]%20가상%20스레드(Virtual%20Thread)%20기반%20고가용성%20분산%20배치%20엔진%20설계%20(Atomic%20CAS,%20이중%20큐,%20자가%20치유).md) — 이 문서의 CAS 선점·이중 큐·재기동 복구 설계를 실제 구현 상세(코드, 시퀀스 다이어그램) 수준까지 확장한 자매 노트
- [(Design Pattern) 실무 프로젝트 및 오픈소스로 체득하는 GoF 핵심 디자인 패턴 10선](../아키텍처·설계/[Design%20Pattern]%20실무%20프로젝트%20및%20오픈소스로%20체득하는%20GoF%20핵심%20디자인%20패턴%2010선%20(Proxy,%20Decorator,%20Strategy,%20Chain,%20Template,%20SPI,%20Visitor,%20Facade).md) — 4.2절 생산자-소비자 패턴 항목에서 이 Job 큐의 Producer-Consumer 구조를 디자인 패턴 관점에서 다룸
- [(Design) 전원 장애(정전) 대응 설계 원칙 - Atomic Save-Transaction-Recovery 정리](../아키텍처·설계/[Design]%20전원%20장애(정전)%20대응%20설계%20원칙%20-%20Atomic%20Save-Transaction-Recovery%20정리.md) — 이 Job 큐의 재기동 복구·Disk 기반 Queue 설계가 실제로 구현하고 있는 범용 정전/비정상종료 대응 원칙

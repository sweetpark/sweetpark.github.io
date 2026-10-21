---
title: "[JAVA 기술면접] 동시성·락 — String 계열·락 종류·데드락"
description: "String, StringBuffer, StringBuilder의 thread-safe 여부, 락을 잡는 방법, 데드락을 피하면서 성능을 높이는 방법을 Java 기술면접 질문에 맞춰 정리했습니다."
tags: [기술면접, JAVA 관련 기술면접, 동시성, 락, 데드락, synchronized, ReentrantLock, StringBuilder]
created: 2026-10-19
modified: 2026-10-19
---

# [JAVA 기술면접] 동시성·락 — String 계열·락 종류·데드락

> [!NOTE]
> **(1) String / StringBuffer / StringBuilder 중 thread-safe한 것과 이유, (2) 락을 잡는 방법들, (3) 데드락을 피하면서 성능을 극대화하는 방법**을 다룬다. 마지막에 같은 영역에서 함께 나오는 질문(volatile, CAS, ConcurrentHashMap, 스레드 풀)을 묶었다.

---

## Q1. String, StringBuffer, StringBuilder — thread-safe하게 쓰려면?

| | String | StringBuffer | StringBuilder |
| --- | --- | --- | --- |
| 가변성 | **불변(immutable)** | 가변 | 가변 |
| thread-safe | **안전** (상태가 안 바뀜) | **안전** (메서드가 `synchronized`) | **안전하지 않음** |
| 동기화 비용 | 없음 | 있음 (느림) | 없음 (가장 빠름) |
| 도입 | 처음부터 | 처음부터 | Java 5 |

### 답변 요지
- **`String`**: 불변이라 여러 스레드가 공유해도 값이 변하지 않아 안전하다. 대신 `+`나 `concat`으로 바꿀 때마다 **새 객체**가 생긴다.
- **`StringBuffer`**: `append`, `insert`, `delete` 등 주요 메서드에 `synchronized`가 걸려 있어 **여러 스레드가 하나의 인스턴스를 동시에 변경**해도 내부 상태가 깨지지 않는다.
- **`StringBuilder`**: 동기화가 없어 단일 스레드에서 가장 빠르지만, 여러 스레드가 같은 인스턴스를 변경하면 내용이 유실되거나 `ArrayIndexOutOfBoundsException`이 날 수 있다.

### 실무 관점 (꼬리 질문 대비)
1. **"공유하면서 변경해야 한다면 StringBuffer"가 정답이지만, 실무에서는 대부분 공유 자체를 피한다.** 문자열 조립은 보통 메서드 지역 변수로 하므로 다른 스레드가 접근할 수 없다(스레드 한정, thread confinement). 이 경우 `StringBuilder`가 정답이다.
2. **StringBuffer도 복합 연산은 원자적이지 않다.** 메서드 하나하나가 동기화될 뿐이라 `if (sb.length() == 0) sb.append(x)`처럼 확인 후 실행(check-then-act)은 사이에 다른 스레드가 끼어들 수 있다. 이런 경우 호출하는 쪽에서 `synchronized (sb) { ... }`로 묶어야 한다.
3. **String 참조 변수는 안전하지 않을 수 있다.** 객체는 불변이어도 `String s` 필드를 여러 스레드가 재할당하면 가시성/경쟁 문제가 생긴다. → `volatile`, `AtomicReference<String>`, 불변 객체로 교체 방식 사용.
4. **반복문 안에서 `+` 연결은 피한다.** 매 반복 새 객체가 생긴다. 컴파일러가 단순 연결은 `StringBuilder`(Java 9+는 `invokedynamic`)로 최적화하지만, 루프 안에서는 최적화가 객체를 재사용하지 못한다 → 루프 밖에 `StringBuilder`를 만들어 사용.
5. **String Pool**: 리터럴은 상수 풀에서 공유된다. `new String("a")`은 힙에 별도 객체. 비교는 `equals`.
6. **불변 객체가 thread-safe한 이유**: 상태 변경이 없으므로 경쟁 조건이 없고, `final` 필드는 안전 발행(safe publication)이 보장된다. 그래서 `Map` 키로도 안전하다.

> 한 줄 결론: **공유 + 변경 = StringBuffer(또는 외부 동기화), 지역 변수 = StringBuilder, 변하지 않는 값 = String.**

---

## Q2. Lock을 잡는 방법에는 어떤 것들이 있나?

### Java 레벨
| 방법 | 특징 | 쓰는 상황 |
| --- | --- | --- |
| **`synchronized`** (메서드/블록) | 객체 모니터 락. 블록을 벗어나면 예외가 나도 자동 해제. 재진입 가능. 공정성 없음. JVM이 경량 락→중량 락으로 최적화(inflation). | 단순한 상호 배제 |
| **`ReentrantLock`** | `lock()/unlock()`을 직접 호출(`finally`에서 해제 필수). `tryLock()`(대기 안 함/타임아웃), `lockInterruptibly()`, **공정/비공정 선택**, `Condition` 여러 개. | 타임아웃·인터럽트·조건 분리가 필요할 때 |
| **`ReentrantReadWriteLock`** | 읽기 락은 공유, 쓰기 락은 배타. | 읽기가 압도적인 자료 |
| **`StampedLock`** | **낙관적 읽기**(`tryOptimisticRead` 후 `validate`). 재진입 불가. | 읽기 매우 많고 충돌 드문 경우 |
| **`volatile`** | 락이 아님. **가시성과 재배치 금지**만 보장, 원자성은 없음(`count++` 불가). | 상태 플래그 |
| **Atomic 클래스 / CAS** | 락 없이 `compareAndSet`으로 원자적 갱신. `AtomicInteger`, `LongAdder`(경합 많을 때 더 빠름). | 카운터, 단순 값 |
| **`Semaphore`** | 동시 허용 수 N개 제한. | 자원 풀, 동시 호출 제한 |
| **`CountDownLatch` / `CyclicBarrier` / `Phaser`** | 스레드들의 시작·완료 시점 맞춤. | 병렬 작업 합류 |
| **동시성 컬렉션** | `ConcurrentHashMap`(버킷 단위 CAS+락), `CopyOnWriteArrayList`, `BlockingQueue`. | 공유 컬렉션 |

### 락의 성격 분류
- **비관적 락(Pessimistic)**: 충돌이 잦다고 보고 먼저 잠근다. (`synchronized`, `SELECT ... FOR UPDATE`, JPA `PESSIMISTIC_WRITE`)
- **낙관적 락(Optimistic)**: 충돌이 드물다고 보고 잠그지 않고, 커밋 시점에 버전으로 충돌을 감지해 재시도한다. (CAS, JPA `@Version`)
- **공정(fair) vs 비공정**: 공정은 대기 순서 보장(기아 방지, 처리량↓), 비공정은 처리량↑.
- **재진입(reentrant)**: 같은 스레드가 이미 가진 락을 다시 획득 가능.

### Java 밖의 락
| 범위 | 방법 |
| --- | --- |
| DB | 행 락(`FOR UPDATE`), 낙관적 락(버전 컬럼), 격리 수준 |
| 여러 서버(분산) | Redis(`SET NX PX`, Redisson), ZooKeeper, DB 기반 락. 만료 시간·펜싱 토큰·락 보유 중 장애를 고려해야 함 |
| 여러 프로세스 | 파일 락, 공유 메모리 뮤텍스/세마포어 |

---

## Q3. 데드락을 피하면서 성능을 최대치로 가져오려면?

### 데드락 발생 4조건 (모두 성립해야 발생)
1. **상호 배제**: 자원을 한 번에 한 스레드만 사용
2. **점유와 대기**: 자원을 쥔 채 다른 자원을 기다림
3. **비선점**: 남의 자원을 강제로 뺏을 수 없음
4. **순환 대기**: A→B→A처럼 대기가 원형

→ **하나라도 깨면 데드락은 없다.** 실무에서는 4번(순환 대기)과 2/3번을 주로 깬다.

```java
// 데드락 예: 두 스레드가 서로 반대 순서로 잠금
// T1: lock(A) → lock(B)      T2: lock(B) → lock(A)
```

### 예방 기법
| 기법 | 깨는 조건 | 방법 |
| --- | --- | --- |
| **락 획득 순서 고정** | 순환 대기 | 모든 코드가 항상 같은 순서로 잠금 (예: 계좌 ID 오름차순). 가장 효과적이고 흔한 방법 |
| **`tryLock(timeout)`** | 점유와 대기/비선점 | 일정 시간 못 얻으면 쥔 락을 풀고 재시도·실패 처리 |
| **락 범위 최소화** | 확률 감소 | 임계 구역에 계산·I/O를 넣지 않는다 |
| **락 안에서 외부 호출 금지** | 순환 대기 | 콜백/오버라이드 가능한 메서드/네트워크 호출을 락 안에서 하지 않는다 ("alien method") |
| **락 개수 줄이기** | — | 가능하면 락 하나, 또는 락 없는 구조 |
| **불변 객체, 스레드 한정** | 상호 배제 자체 제거 | 공유를 줄이면 락도 줄어든다 |

### 탐지·진단
- `jstack <pid>` / `jcmd <pid> Thread.print`: 스레드 덤프에서 `Found one Java-level deadlock` 확인.
- `ThreadMXBean.findDeadlockedThreads()`로 프로그램에서 감지.
- VisualVM, JConsole, 운영 APM.
- DB 데드락: DB가 감지해 한쪽을 롤백(MySQL `Deadlock found when trying to get lock`). 대응은 **업데이트 순서 통일, 트랜잭션 짧게, 인덱스로 락 범위 축소, 재시도**.

### 성능을 최대로 끌어올리는 방법 (락 경합 줄이기)
락은 정확성을 위한 비용이다. 성능은 "락을 얼마나 **안** 쓰느냐, 얼마나 **짧게·좁게** 쓰느냐"로 결정된다.

| 전략 | 설명 | 예 |
| --- | --- | --- |
| **락 구간 축소** | 보호해야 할 최소 코드만 잠금 | 계산은 밖에서, 공유 자료 갱신만 안에서 |
| **락 분할 (Lock Striping)** | 하나의 큰 락을 여러 개로 쪼갬 | `ConcurrentHashMap`의 버킷 단위 동기화 |
| **읽기/쓰기 분리** | 읽기끼리는 동시 허용 | `ReadWriteLock`, `StampedLock`, `CopyOnWriteArrayList` |
| **락 프리(CAS)** | 잠금 없이 원자적 갱신 | `AtomicLong`, `LongAdder`(셀 분산으로 경합 감소) |
| **스레드 한정** | 데이터를 스레드별로 소유 | `ThreadLocal`, 요청별 객체, 작업 큐로 한 스레드가 소유 |
| **샤딩 + 전용 큐** | 키 해시로 워커를 고정해 락 자체 제거 | 같은 키는 같은 스레드가 처리 |
| **비동기/논블로킹** | 대기 시간 동안 스레드 점유 안 함 | `CompletableFuture`, WebFlux |
| **적절한 스레드 수** | CPU 바운드는 코어 수 근처, I/O 바운드는 더 많이 | 스레드 풀 크기 튜닝 |

**주의할 점**
- 경합이 심하지 않다면 `synchronized`가 충분히 빠르다(JVM 최적화). 측정 없이 복잡한 락으로 바꾸지 않는다.
- **암달의 법칙**: 직렬로 실행되는 구간(락 구간)이 전체 확장성의 상한을 정한다.
- **Java 21 Virtual Thread**: `synchronized` 안에서 블로킹하면 캐리어 스레드가 고정(pinning)되는 문제가 있다(이후 버전에서 개선). 블로킹 구간이 있다면 `ReentrantLock`이 유리했다.
- 성능 목표는 "락을 없애는 것"이 아니라 **정확성을 유지한 채 경합을 줄이는 것**이다. 반드시 **프로파일링/벤치마크(JMH)** 로 확인한다.

---

## Thread-safe의 조건과 `Thread.sleep()`

### Thread-safe = 원자성 + 가시성 + 순서
스레드 실행 순서(스케줄링)와 상관없이 항상 올바른 결과를 내는 것. Java Memory Model(JMM) 기준으로 세 가지가 필요하다.

| 요소 | 문제 | Java 보장 수단 |
| --- | --- | --- |
| **원자성** | `count++`는 읽기→더하기→쓰기 3단계라 중간에 끼어들 수 있음(갱신 손실). check-then-act, 여러 변수 불변식도 마찬가지 | `synchronized`, `Lock`, `AtomicInteger`/`LongAdder`(CAS), `ConcurrentHashMap.merge/compute` |
| **가시성** | 한 스레드가 쓴 값을 다른 스레드가 못 봄(CPU 캐시·레지스터) | `volatile`, `synchronized`/락의 해제→획득, `final` 필드 안전 발행, `Thread.start/join` |
| **순서** | 컴파일러·CPU 재배치로 초기화 전 객체가 노출 | happens-before를 만드는 위 수단들 (예: DCL 싱글턴은 `volatile` 필요) |

- **`volatile`은 가시성·순서만 보장하고 원자성은 보장하지 않는다.** `volatile int c; c++`는 여전히 안전하지 않다 → `AtomicInteger.incrementAndGet()`.
- 단일 값 → Atomic, **여러 값의 일관성** → 락. 가장 안전한 방법은 **공유하지 않기**(지역 변수, `ThreadLocal`, 불변 객체, 메시지 전달).

### `sleep`으로 context switching을 유도하는가?
- `Thread.sleep()`은 현재 스레드를 `TIMED_WAITING`으로 만들고 CPU를 양보하므로 결과적으로 context switch가 일어난다. 하지만 **동기화 수단이 아니라 시간 지연 수단**이다. 전환은 sleep 없이도 언제든(타임 슬라이스 만료, 블로킹 등) 일어나므로, **코드는 어느 시점에 전환돼도 정확해야** 한다.
- **`sleep`은 모니터 락(`synchronized`)을 놓지 않는다.** `Object.wait()`는 락을 놓고 대기한다 → 조건 대기는 `wait/notify`, `Condition.await`.
- 지정 시간 **이상** 자고, `interrupt()`되면 `InterruptedException`으로 일찍 깬다(인터럽트 상태를 삼키지 말고 복원).

| 용도 | 평가 |
| --- | --- |
| 주기 작업·재시도 백오프·폴링 간격 | 정당 (가능하면 `ScheduledExecutorService`) |
| 레이스 재현용 테스트(읽기-쓰기 사이 `sleep`) | 재현·교육용만. 수정 수단이 아님 |
| **"sleep 했으니 상대 스레드가 끝났겠지"로 순서 맞춤** | ❌ 타이밍 의존 → 환경에 따라 깨짐 |
| 락 대신, 또는 **락을 쥔 채 sleep** | ❌ 경합 악화, 레이스 그대로 |

| 목적 | sleep 대신 |
| --- | --- |
| 스레드 종료 대기 | `Thread.join()`, `Future.get()` |
| 조건/신호 대기 | `Condition`, `wait/notify`, `BlockingQueue.take()` |
| 여러 스레드 동시 출발·합류 | `CountDownLatch`, `CyclicBarrier`, `Phaser` |
| CPU 양보 힌트 | `Thread.yield()` (보장 없음) |
| 스핀 대기 | `Thread.onSpinWait()` |
- Java 21 Virtual Thread에서는 `sleep`이 캐리어 스레드를 점유하지 않아 가볍지만, 위 원칙(동기화 수단이 아님)은 그대로다.
- 레이스 탐지는 sleep이 아니라 **스트레스 테스트, jcstress 같은 도구**로 한다.

→ C 환경 설명: [동기화 — Lock 종류와 세마포어 vs 뮤텍스](기술면접/C/[C%20기술면접]%20동기화%20—%20Lock%20종류와%20세마포어%20vs%20뮤텍스.md) 5~6절

## 같이 나오는 질문

| 질문 | 답변 요지 |
| --- | --- |
| `synchronized`와 `ReentrantLock` 차이? | synchronized: 자동 해제, 문법 간단, 타임아웃/인터럽트/공정성 없음. ReentrantLock: 수동 해제(`finally`), `tryLock`·`lockInterruptibly`·공정 락·`Condition` 지원. |
| `volatile`은 무엇을 보장? | **가시성**(쓴 값이 다른 스레드에 보임)과 **재배치 금지(happens-before)**. 원자성은 보장 안 함 → `i++`에는 부족. |
| CAS란? | `compareAndSet(기대값, 새값)`: 현재 값이 기대값일 때만 원자적으로 교체(CPU 명령). 실패하면 재시도(스핀). ABA 문제는 `AtomicStampedReference`. |
| `HashMap`, `Hashtable`, `ConcurrentHashMap`? | HashMap: 비동기화. Hashtable: 전체 메서드 동기화(느림, 레거시). ConcurrentHashMap: 버킷 단위(CAS+synchronized), 읽기는 락 없음, null 키/값 불가. |
| `ConcurrentHashMap`도 복합 연산은? | `get` 후 `put`은 원자적이지 않다. `putIfAbsent`, `computeIfAbsent`, `merge` 같은 원자 메서드를 쓴다. |
| 스레드 풀 파라미터는? | `corePoolSize`, `maximumPoolSize`, `keepAliveTime`, `workQueue`, `RejectedExecutionHandler`. **코어 → 큐 → 최대 스레드 → 거절** 순서로 동작(큐가 무제한이면 최대 스레드까지 늘지 않음). |
| 무분별한 `new Thread`의 문제? | 생성 비용, 개수 제한 없음, 수명 관리 어려움 → `ExecutorService`로 풀링. |
| `wait/notify`와 `sleep` 차이? | wait: 모니터 락을 **놓고** 대기(synchronized 안에서만). sleep: 락을 **쥔 채** 시간만 대기. |
| 라이브락, 기아란? | 라이브락: 서로 양보하며 계속 상태만 바뀌고 진전이 없음. 기아: 우선순위·불공정 때문에 특정 스레드가 계속 실행 기회를 못 얻음. |
| Java Memory Model에서 happens-before? | 한 연산의 결과가 다른 연산에 보이도록 보장하는 순서 관계. 락 해제→획득, volatile 쓰기→읽기, 스레드 start/join 등이 만든다. |

## 관련 문서
- [HTTP·REST와 요청 처리 전체 흐름](기술면접/WEB/[JAVA%20기술면접]%20HTTP·REST와%20요청%20처리%20전체%20흐름.md)
- [멀티 DB 트랜잭션](기술면접/WEB/[JAVA%20기술면접]%20멀티%20DB%20트랜잭션%20—%20분산%20트랜잭션·XA·Saga.md)
- C 환경에서의 락 종류: [세마포어와 동시성 제어](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20세마포어와%20동시성%20제어.md)

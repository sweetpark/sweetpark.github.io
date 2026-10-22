---
title: "세마포어 & 뮤텍스 ( JAVA LOCK )"
description: "Mutex와 Semaphore의 개념과 Java 구현, TPS 실험 결과와 트러블슈팅, 주의사항을 정리했습니다."
tags: [학습, 개발-CS, 언어, JAVA, 개발, 뮤텍스, 세마포어, 동시성]
created: 2026-09-05
modified: 2026-10-22
---

# 세마포어 & 뮤텍스 ( JAVA LOCK )

> [!NOTE]
> Mutex vs Semaphore 개념과 Java 구현, 그리고 TPS 실험 트러블슈팅·주의사항 정리.

## 📌 개념

### [실험 정리] Java Lock / Semaphore TPS 실험

#### 실험 목적

- Mutex vs Semaphore 동시성 제어 비교
- THREAD_COUNT = 1000 요청
- TPS 측정
- Count 증가 정확성 검증

```text
TPS = (총 요청 수 × 1000) / 총 소요 시간(ms)
```

#### 처음 코드에서 발견된 문제점들 🚨

**❌ 1. Busy Waiting 사용**

```java
while (!executorService.isTerminated()) {}
```

- 문제점: CPU 100% 사용 / 정확한 시간 측정 왜곡 / 비효율적 대기
- 수정: `CountDownLatch.await()` 사용

**❌ 2. ExecutorService를 필드로 재사용**

```java
private final ExecutorService executorService = ...
```

- 문제점: 첫 테스트에서 shutdown() → 다음 테스트에서 재사용 불가 → 테스트 실패/왜곡
- 수정: 테스트마다 새 Executor 생성 또는 `@BeforeEach`에서 초기화

**❌ 3. CountDownLatch 재사용**

```java
private final CountDownLatch countDownLatch = ...
```

- 문제점: 첫 테스트에서 0이 됨 → 두 번째 테스트는 대기 없이 통과 → TPS 왜곡
- 수정: 테스트마다 새 Latch 생성 (`@BeforeEach` 또는 테스트 내부 생성)

**❌ 4. countDown() 누락**

semaphore 테스트에서:

```java
countDownLatch.countDown();
```

없었음 → 영원히 대기하거나, latch가 이미 0이면 즉시 통과

**❌ 5. 잘못된 Assertion**

```java
Assertions.assertEquals(THREAD_COUNT, mutexService.getCount());
```

semaphore 테스트에서도 mutex 검사 → 명백한 테스트 버그

**❌ 6. InterruptedException 처리 문제**

```java
catch (InterruptedException e) {
    throw new RuntimeException(e);
}
```

- 문제점: 인터럽트 상태 손실 / 정적 분석 경고 / 동시성 코드에서 위험
- 올바른 처리:

```java
Thread.currentThread().interrupt();
```

#### 개선된 테스트 구조

**✅ 핵심 개선 포인트**

- Executor는 테스트마다 새로 생성
- Latch는 테스트마다 새로 생성
- 인터럽트 복원
- assert 대상 정확히 구분
- busy waiting 제거

**✅ 더 정확한 동시성 테스트 구조 (Start Latch + End Latch)**

```java
CountDownLatch startLatch = new CountDownLatch(1);
CountDownLatch endLatch = new CountDownLatch(THREAD_COUNT);
```

동작 구조:

```text
1. 모든 스레드 대기
2. startLatch.countDown()
3. 모든 스레드 동시 출발
4. endLatch.await()
5. 시간 측정 종료
```

👉 이 방식이 진짜 동시성 테스트

#### TPS 실험에서 주의할 점 ⚠

**1. ThreadPool 크기**

```java
Runtime.getRuntime().availableProcessors() * 2
```

스레드 1000개 생성은 비효율적

**2. 너무 가벼운 작업은 차이가 안 보임**

```java
count++;
```

이건 너무 빠름 → Lock 오버헤드 거의 드러나지 않음. 차이를 보고 싶다면 임계 구역 내부에 `Thread.sleep(1);` 추가 → Mutex는 거의 순차, Semaphore는 permit 수만큼 병렬

**3. 이 실험은 Lock 성능 테스트가 아니다**

```text
ThreadPool + Lock + 스케줄링 포함 전체 시간
```

정밀 Lock 벤치마크는 JMH 필요

#### Mutex vs Semaphore 실험 관찰 포인트

**🔐 Mutex**: 한 번에 1개 스레드만 접근 / 강한 직렬화 / TPS 낮음 / 안정적

**🚦 Semaphore**: permit 수만큼 병렬 / TPS 높음 / 임계구역이 길수록 차이 크게 발생

#### 코드 레벨 주의 사항

**🔴 acquire 성공 후에만 release**

잘못된 코드:

```java
try {
    semaphore.acquire();
} finally {
    semaphore.release(); // acquire 실패해도 실행 가능
}
```

→ permit 증가 버그 가능

**🔴 count는 thread-safe 해야 함**

```java
private int count;
```

Semaphore가 보호하긴 하지만 더 안전하게는 `AtomicInteger`

#### 테스트 설계에서 배운 점 💡

- ✔ 동시성 테스트는 시작 시점 통일이 중요
- ✔ Executor 재사용은 위험
- ✔ Latch 재사용은 절대 금지
- ✔ 인터럽트는 반드시 복원
- ✔ TPS 계산은 실제 작업 시간만 포함해야 함
- ✔ 테스트는 "실험 목적"을 분명히 해야 함

#### 현재 수준 평가

| 항목 | 상태 |
| --- | --- |
| Lock 이해 | 👍 |
| Semaphore 이해 | 👍 |
| CountDownLatch 활용 | 👍 |
| TPS 계산 이해 | 👍 |
| 테스트 설계 완성도 | 중상급 |
| 정밀 벤치마크 | 아직 |

#### 다음 단계로 확장 가능

- JMH 기반 벤치마크
- ReentrantLock vs synchronized 비교
- Semaphore permit 1 vs 5 vs 10 비교
- Deadlock 재현 실험
- CPU 코어 수 변화에 따른 TPS 변화
- AQS 내부 동작 구조 분석

#### 🔥 최종 정리 한 문장

> 동시성 테스트는 단순히 스레드를 많이 돌리는 것이 아니라, 시작 시점 통제, 대기 방식, 인터럽트 처리, 자원 초기화까지 모두 고려해야 정확한 결과가 나온다.

### [개념] Mutex & Semaphore 완전 정복

#### 1. 동시성 제어의 본질

멀티스레드 환경에서 발생하는 문제: Race Condition / 데이터 손상 / 비정상 값 / 순서 꼬임

👉 이를 막기 위해 사용하는 것이 **동기화 도구** — 대표가 🔐 Mutex, 🚦 Semaphore

#### 2. 뮤텍스 (Mutex)

**🔐 정의**

> 한 번에 **단 하나의 스레드만** 임계 구역에 접근 가능 (Mutual + Exclusion, 상호 배제)

**🧠 핵심 개념**

- 1개만 허용
- 소유권(Ownership) 존재
- 락을 획득한 스레드만 해제 가능

**📦 Java 구현**

```java
private final Lock lock = new ReentrantLock();

public void increment() {
    lock.lock();
    try {
        sharedCount++;
    } finally {
        lock.unlock();
    }
}
```

**🎯 언제 쓰는가?**: 공유 변수 수정 / 재고 차감 / 전역 상태 변경 / 단일 자원 보호

**⚠️ 문제점**: 데드락 위험 / 성능 저하 / 잘못 해제하면 영구 락

**🔎 특징 요약**

| 항목 | Mutex |
| --- | --- |
| 동시 허용 수 | 1 |
| 소유권 | 있음 |
| 목적 | 상호 배제 |
| 대표 예 | ReentrantLock |

#### 3. 세마포어 (Semaphore)

**🚦 정의**

> 동시에 N개의 스레드 접근 허용 (내부적으로 카운터 존재, permit 기반 제어)

**🧠 핵심 개념**

- N개 허용 가능
- 소유권 개념 없음
- release는 다른 스레드도 가능

**📦 Java 구현**

```java
private final Semaphore semaphore = new Semaphore(3);

public void accessResource() {
    try {
        semaphore.acquire();
        // 자원 사용
    } finally {
        semaphore.release();
    }
}
```

**🎯 언제 쓰는가?**: DB Connection Pool 제한 / 외부 API Rate Limit / 스레드 동시 실행 제한 / 특정 리소스 병렬 제한

**⚠️ 문제점**: release 누락 시 자원 고갈 / 소유권 없어서 오용 가능

**🔎 특징 요약**

| 항목 | Semaphore |
| --- | --- |
| 동시 허용 수 | N |
| 소유권 | 없음 |
| 목적 | 동시 접근 제한 |
| 대표 예 | Semaphore |

#### 4. 뮤텍스 vs 세마포어 핵심 비교

| 구분 | Mutex | Semaphore |
| --- | --- | --- |
| 동시 접근 | 1개 | N개 |
| 소유권 | 있음 | 없음 |
| 해제 권한 | 획득자만 가능 | 누구나 가능 |
| 용도 | 임계 구역 보호 | 리소스 수 제한 |
| 내부 구조 | Binary Lock | Counter |

#### 5. 그림으로 이해하기

**🔐 Mutex (화장실 1칸)**

```text
[🚻]
한 사람만 사용 가능
```

- 열쇠 1개
- 들어간 사람이 나와야 다음 사람 입장

**🚦 Semaphore (주차장 3칸)**

```text
[🚗][🚗][🚗]
3대까지 가능
```

- 빈 자리 개수만큼 입장 가능
- 나가면 자리 증가

#### 6. 실무 관점 차이

**🎯 Mutex는 "데이터 보호"**: 계좌 잔액 수정 / 공유 변수 증가 / 싱글톤 상태 변경

**🎯 Semaphore는 "자원 수 제한"**: 동시에 API 10개만 호출 / 동시에 DB 20개 커넥션만 사용 / 스레드 5개만 실행

#### 7. 면접에서 이렇게 말하면 좋음

> 뮤텍스는 상호 배제를 위해 한 번에 하나의 스레드만 허용하는 락이고, 세마포어는 동시에 여러 개의 스레드를 허용하는 카운터 기반 동기화 도구입니다. 데이터 보호에는 뮤텍스, 리소스 개수 제한에는 세마포어를 사용합니다.

#### 8. 핵심 한 줄 정리

- 🔐 Mutex = 1개
- 🚦 Semaphore = N개
- Mutex는 보호
- Semaphore는 제한

#### 9. 읽기/쓰기 락 — 같은 객체의 락을 써도 "모든 경로"가 잡아야 한다

**🧠 Java의 락은 객체에 붙어 있다**

- `synchronized(obj)`는 `obj`가 가진 모니터 락 하나를 잡는다. 읽기용·쓰기용 구분이 없다.
- 읽기와 쓰기를 **모두 같은 객체의 락**으로 감싸면 따로 생각하지 않아도 안전하다. 대신 읽기끼리도 한 줄로 서므로 성능은 Mutex와 같다.
- 락이 객체라는 것은 편의일 뿐, C에서 `pthread_mutex_t` 하나를 모두가 공유하는 것과 같은 구조다.

**❌ 한쪽만 락을 잡으면 Java에서도 깨진다**

```java
public synchronized void add()  { count++; }   // 쓰기: 락 O
public int get()                { return count; } // 읽기: 락 X → 락을 잡은 쪽도 보호받지 못함
```

- 락 없는 쪽은 임계구역에 그냥 들어온다. 읽은 값으로 다시 쓰는 코드(`count -= 1`)라면 갱신이 유실된다.
- Java는 **가시성** 문제가 더해진다. `synchronized`/`volatile` 없이 읽으면 다른 스레드가 쓴 값이 보이지 않을 수 있다.
- 읽기는 `this`, 쓰기는 `lockObj`처럼 **서로 다른 객체의 락**을 잡아도 서로를 막지 못한다.

**✅ 읽기가 많다면 `ReentrantReadWriteLock`**

```java
private final ReadWriteLock rw = new ReentrantReadWriteLock();
private int count;

public int get() {                 // 읽기: 여러 스레드 동시 진입 가능
    rw.readLock().lock();
    try { return count; }
    finally { rw.readLock().unlock(); }
}

public void add() {                // 쓰기: 단독 진입 (읽기도 모두 대기)
    rw.writeLock().lock();
    try { count++; }
    finally { rw.writeLock().unlock(); }
}
```

| 동작 | `readLock` | `writeLock` |
| --- | --- | --- |
| 다른 스레드의 읽기 락과 | **동시 허용** | 대기 |
| 다른 스레드의 쓰기 락과 | 대기 | 대기 |

**⚠️ 주의**

- 값을 **바꾸는** 코드는 이름이 `get`/`read`여도 `writeLock`을 잡아야 한다. `readLock` 아래에서 수정하면 읽기 스레드끼리 동시에 수정해 다시 레이스가 된다.
- **읽기 락 → 쓰기 락 승격(upgrade)은 불가**하다. 읽기 락을 쥔 채 `writeLock().lock()`을 호출하면 데드락이다. 반대로 쓰기 락 → 읽기 락 **강등(downgrade)** 은 허용된다.
- 읽기가 많고 임계구역이 길 때 이득이 크다. `count++`처럼 짧은 구간은 락 관리 비용 때문에 오히려 `synchronized`보다 느릴 수 있다.
- 변수 하나의 단순 증감이면 `AtomicInteger`/`LongAdder`가 가장 가볍다.

**🔗 C와 대응**

| C (pthread) | Java |
| --- | --- |
| `pthread_mutex_t` | `synchronized`, `ReentrantLock` |
| `pthread_rwlock_t` (`rdlock`/`wrlock`) | `ReentrantReadWriteLock` (`readLock()`/`writeLock()`) |
| `atomic_fetch_add` | `AtomicInteger`, `LongAdder` |
| — | `StampedLock` (낙관적 읽기) |

C에서 같은 문제를 다룬 글: [동시성·스레드 실습 §1-4](개발%20%28CS%29/언어/C언어/실습/[C]%20동시성·스레드%20실습%20—%20mutex%20락%20범위·데드락·조건변수와%20메시지%20큐·이체%20감시%20스레드.md)

## 🔗 참고

- [GitHub - sweetpark/lab](https://github.com/sweetpark/lab.git)

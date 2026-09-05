---
title: "☕ Java Deep Dive"
tags: [학습, 개발-CS, 언어, JAVA, 개발, 멀티스레딩, 동시성]
created: 2026-09-05
modified: 2026-09-05
---

# ☕ Java Deep Dive

> [!NOTE]
> 자바 멀티스레딩 & 동시성 완전 정복. 단순 문법 암기가 아닌 "동시성 문제가 왜 생겼고 → 자바는 어떻게 진화했으며 → 실무에서는 무엇을 써야 하는가"를 하나의 흐름으로 이해한다.

## 📌 개념

### 1️⃣ 프로세스와 스레드 (Why Thread?)

#### 프로세스 vs 스레드

- **프로세스**: OS 자원 단위 (메모리 독립)
- **스레드**: 프로세스 내부 실행 단위 (메모리 공유)

📌 **멀티스레드의 본질**

> "자원을 공유하면서 동시에 실행한다"
> → 성능 ↑
> → **동시성 문제 필연 발생**

---

### 2️⃣ 스레드 생성과 실행 책임 분리

#### Runnable vs Thread

자바에서 가장 중요한 원칙:

> "일(Runnable)과 일꾼(Thread)을 분리하라"

```java
public class HelloRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName());
    }
}

public static void main(String[] args) {
    Thread t = new Thread(new HelloRunnable());
    t.start(); // run() 직접 호출 ❌
}
```

- `run()` → 일반 메서드 호출
- `start()` → **새 스택 생성 + 병렬 실행**

📌 **실무 결론**

> Thread 상속 ❌
> Runnable / Callable 사용 ⭕

---

### 3️⃣ 스레드 생명주기와 상태 전이

#### Thread 상태 (중요)

| 상태 | 의미 |
| --- | --- |
| NEW | 생성 |
| RUNNABLE | 실행 가능 |
| BLOCKED | 락 대기 |
| WAITING | 조건 대기 |
| TIMED_WAITING | 시간 대기 |
| TERMINATED | 종료 |

#### 핵심 구분

- **BLOCKED**: synchronized 락 기다림 (락 반납 ❌)
- **WAITING**: wait(), join() (락 반납 ⭕)

📌 면접 포인트

> wait()는 락을 반납하지만, BLOCKED는 반납하지 않는다.

---

### 4️⃣ 실행 순서 제어 – join()

```java
thread.start();
thread.join(); // 종료까지 대기
```

왜 필요할까?

- 비동기 결과 필요
- 작업 순서 보장

📌 join 없으면 **결과 출력 전에 main 종료 가능**

---

### 5️⃣ 메모리 가시성 문제 (volatile)

#### 문제

CPU 캐시로 인해:

- 한 스레드의 변경값을
- 다른 스레드가 **못 보는 현상**

```java
volatile boolean running = true;
```

volatile 의미:

> "이 변수는 항상 메인 메모리에서 읽고 써라"

📌 주의

- volatile ❌ 원자성 보장
- volatile ⭕ 가시성만 보장

---

### 6️⃣ 상호 배제 – synchronized

```java
public synchronized void withdraw(int amount) {
    if (balance >= amount) {
        balance -= amount;
    }
}
```

의미:

- 임계 영역
- 한 번에 한 스레드

문제:

- 락 범위 큼
- 성능 저하
- 유연성 부족

---

### 7️⃣ 잘못된 해결 – Busy Waiting ❌

```java
while(queue.isEmpty()) {
    Thread.sleep(100);
}
```

❌ 문제점

- CPU 낭비
- 응답 지연
- 정확한 시점 알 수 없음

📌 교훈

> "자면서 확인하지 말고, 깨워달라고 요청하라"

---

### 8️⃣ 1세대 협력 – wait / notify

```java
synchronized(lock) {
    while(condition) {
        lock.wait(); // 락 반납
    }
    lock.notifyAll();
}
```

#### 한계

- wait set 하나
- notifyAll → **모두 깨움**
- 생산자/소비자 구분 불가

---

### 9️⃣ 2세대 협력 – Lock & Condition

```java
Lock lock = new ReentrantLock();
Condition producer = lock.newCondition();
Condition consumer = lock.newCondition();
```

장점:

- 대기 공간 분리
- 정확한 대상만 signal

```java
producer.await();
consumer.signal();
```

📌 핵심 문장

> Condition을 썼는데 signalAll을 쓴다? → 설계 실패

---

### 🔟 CAS와 Atomic (락 없는 동기화)

```java
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();
```

- CPU 하드웨어 CAS
- 실패 시 재시도
- 락 없음

📌 사용처

- 카운터
- 통계
- 단순 상태 값

---

### 1️⃣1️⃣ 동시성 컬렉션 (재발명 금지)

| 자료구조 | 사용 금지 | 사용 권장 |
| --- | --- | --- |
| Map | HashMap | ConcurrentHashMap |
| List | ArrayList | CopyOnWriteArrayList |
| Queue | LinkedList | BlockingQueue |

📌 **BlockingQueue**

> wait / notify / Condition의 최종 진화형

---

### 1️⃣2️⃣ 왜 스레드 풀인가?

#### 문제

```java
new Thread(task); // 요청마다 생성 ❌
```

- 생성 비용 큼
- OOM 위험

#### 해결

> 미리 생성 + 재사용

---

### 1️⃣3️⃣ ThreadPoolExecutor 동작 원리 (중요)

#### 처리 순서

1. core 스레드 생성
2. 큐 적재
3. 큐 초과 → max 스레드 생성
4. max 초과 → 거절

📌 **LinkedBlockingQueue(무한)**

→ maxPoolSize **절대 안 씀**

→ 실무 최악 실수

---

### 1️⃣4️⃣ 스레드 풀 전략

#### 고정 풀

- 안정적
- 큐 무한 → 지연 위험

#### 캐시 풀

- 빠름
- 스레드 무한 → 장애 위험

#### 실무 추천 (커스텀)

```java
new ThreadPoolExecutor(
    100, 200, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(1000),
    new ThreadPoolExecutor.CallerRunsPolicy()
);
```

> 일반 → 긴급 → 거절

---

### 1️⃣5️⃣ 거절 정책 (Backpressure)

| 정책 | 설명 |
| --- | --- |
| AbortPolicy | 예외 |
| DiscardPolicy | 조용히 버림 |
| CallerRunsPolicy | 요청자가 직접 실행 |

📌 **CallerRunsPolicy = 자연스러운 트래픽 제어**

---

### 1️⃣6️⃣ Executor 우아한 종료 (Graceful Shutdown)

```java
es.shutdown();
if(!es.awaitTermination(10, SECONDS)) {
    es.shutdownNow();
}
```

- shutdown(): 신규 차단
- awaitTermination(): 대기
- shutdownNow(): 인터럽트

📌 **close() (Java 19+)**

> shutdown + 무한 대기 → 필요시 shutdownNow

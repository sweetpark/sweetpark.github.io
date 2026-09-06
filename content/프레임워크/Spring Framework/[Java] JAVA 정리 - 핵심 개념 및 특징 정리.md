---
title: "JAVA 정리"
tags: [학습, 개발-CS, CS-기초, Spring-Framework, 개발, Java, 컬렉션, 동시성, 스트림, 람다]
modified: 2026-09-05
---

# JAVA 정리

> [!NOTE]
> 김영한 Java 중급 1·2편, 고급 1·2·3편의 핵심을 한 문서로 요약한 노트. 객체 설계·컬렉션·동시성·I/O·네트워크·함수형(람다/스트림)까지 "왜 필요했는지 → 어떻게 쓰는지 → 어디서 조심할지" 흐름으로 정리한다.

## 🚀 Java 중급 1편 핵심 요약 총정리

## 1. Object 클래스: 모든 객체의 뿌리

- **개념:** 자바의 모든 클래스는 최상위 부모인 `Object`를 자동으로 상속받습니다.
- **왜 사용하는가?:** 공통 기능을 제공하고, 모든 객체를 참조할 수 있는 **다형성**의 정점을 제공합니다.
- **핵심 메서드:**
    - `toString()`: 객체의 상태를 문자열로 표현 (디버깅 필수).
    - `equals()`: **동일성(`==`, 주소값)**이 아닌 **동동성(논리적 같음)** 비교를 위해 반드시 오버라이딩 필요.
    - `hashCode()`: `equals`를 재정의했다면 해시 기반 컬렉션을 위해 반드시 함께 재정의.

---

## 2. 불변 객체 (Immutable Object): 안전한 공유

- **개념:** 객체 생성 후 내부의 상태(필드)를 변경할 수 없는 객체.
- **왜 사용하는가?:** 여러 변수가 하나의 객체를 공유할 때 발생하는 **사이드 이펙트(Side Effect)**를 원천 차단합니다.
- **핵심 설계:**
    - 필드를 `final`로 선언하고 Setter를 만들지 않음.
    - 값 변경이 필요하면 기존 객체를 수정하는 대신, **변경된 값을 가진 새로운 객체를 생성하여 반환**.

---

## 3. String 클래스: 문자열의 모든 것

- **특징:** 자바의 `String`은 대표적인 **불변 객체**입니다.
- **String Pool:** 리터럴로 생성된 문자열은 힙 영역의 전용 공간에 저장되어 메모리를 절약합니다.
- **성능 최적화:**
    - 단순 문자열 연결은 컴파일러가 최적화해 주지만, **반복문 내 연결**은 반드시 `StringBuilder`를 사용해야 합니다.
    - `StringBuilder`는 가변(Mutable)이므로 내부 버퍼를 직접 수정하여 성능이 뛰어납니다.

---

## 4. 래퍼 클래스 & Enum: 타입 안전성

- **Wrapper Class:** `int` 같은 기본형을 `Integer` 같은 객체로 감싸는 것. `null` 표현이 가능하고 제네릭에서 필수입니다. (**오토 박싱/언박싱** 지원)
- **Enum (열거형):** 관련 있는 상수를 모아 정의한 특수한 클래스.
    - **장점:** 허용되지 않는 값이 들어오는 것을 컴파일 시점에 막아주는 **타입 안전성** 제공.
    - **활용:** 단순 상수를 넘어 필드와 메서드를 추가해 비즈니스 로직을 내포할 수 있음.

---

## 5. 날짜와 시간 (java.time): 표준 API

- **개념:** Java 8부터 도입된 `LocalDate`, `LocalDateTime` 등.
- **왜 사용하는가?:** 기존 `Date`, `Calendar`의 결함(가변성, 복잡한 월 계산 등)을 해결하기 위해 도입.
- **핵심 특징:**
    - **불변(Immutable):** 모든 계산 메서드는 새로운 객체를 반환함.
    - **명확성:** `Period`(날짜 차이), `Duration`(시간 차이) 등으로 구분이 명확함.

---

## 6. 중첩 & 익명 클래스: 캡슐화의 극치

- **정적 중첩 클래스:** 외부 클래스와 밀접하지만 인스턴스 간 공유가 없을 때 사용.
- **내부 클래스:** 외부 인스턴스의 멤버에 접근해야 할 때 사용.
- **익명 클래스:** 이름 없이 즉석에서 인터페이스/클래스를 구현. 일회성 로직에 쓰이며, 자바 8부터는 **람다(Lambda)**로 대체 가능.

---

## 7. 예외 처리 (Exception): 프로그램의 방어막

- **예외 계층:** `Throwable` → `Error`(시스템 장애) & `Exception`(애플리케이션 예외).
- **체크 예외 vs 언체크 예외:**
    - **Checked:** 컴파일러가 처리를 강제함. 외부에 의존하는 로직에 사용.
    - **Unchecked (RuntimeException):** 개발자의 실수로 발생하는 예외. 처리가 강제되지 않음.
- **Try-With-Resources:** `AutoCloseable`을 구현한 자원을 자동으로 닫아줌 (메모리 누수 방지).

---

### 💡 학습 후기 (노션용 한마디)

> "자바 중급 1편은 단순히 문법을 배우는 과정이 아니라, **객체 지향 설계의 핵심인 '불변성'과 '타입 안전성'**을 어떻게 실무 코드로 녹여내는지 배우는 과정이었다."
> 

---

## 🚀 Java 중급 2편: 컬렉션 프레임워크 마스터 (최종 정리본)

> 자료구조를 “쓸 줄 아는 단계”에서
> 
> 
> “언제 · 왜 · 무엇을 선택해야 하는지 설명할 수 있는 단계”로 가기 위한 정리
> 

---

## 1. 제네릭 (Generic)

### 🔑 핵심 목적

- **컴파일 타임 타입 안정성**
- **형변환 제거**
- **코드 재사용성 증가**

```java
List<String> list = new ArrayList<>();
// list.add(10); // 컴파일 에러 (안전)

```

### 🔸 와일드카드 (`?`) – PECS 원칙

> PECS: Producer Extends, Consumer Super
> 

| 표현 | 의미 | 사용 목적 |
| --- | --- | --- |
| `<? extends T>` | T 또는 자식 | **읽기 전용** |
| `<? super T>` | T 또는 부모 | **쓰기 전용** |

```java
void read(List<? extends Number> list) { } // get OK
void write(List<? super Integer> list) { } // add OK

```

### ⚠️ 타입 이레이저 (Type Erasure)

- 제네릭 정보는 **컴파일 타임에만 존재**
- 런타임에는 모두 `Object`
- 그래서 `new T()` 불가능, `instanceof List<String>` 불가능

---

## 2. List 계열

### ArrayList vs LinkedList

| 항목 | ArrayList | LinkedList |
| --- | --- | --- |
| 내부 구조 | 배열 | 이중 연결 리스트 |
| 조회(get) | ⭐ O(1) | ❌ O(n) |
| 중간 삽입/삭제 | ❌ O(n) | ⭐ O(1) |
| 실무 사용 | ⭐⭐⭐⭐⭐ | 거의 안 씀 |

📌 **결론**

> 대부분의 경우 ArrayList가 정답
> 
> 
> LinkedList는 이론용에 가깝다
> 

---

## 3. Set & Hash 구조

### Set 공통 특징

- 중복 ❌
- 순서 ❌ (구현체에 따라 예외 있음)

### hashCode + equals 핵심 원리

```java
1. hashCode() → 같은 버킷
2. equals() → 진짜 같은 객체인지 확인

```

👉 둘 중 하나라도 잘못 구현하면 **Set / Map 동작이 깨짐**

### Set 구현체 비교

| 구현체 | 특징 |
| --- | --- |
| HashSet | 가장 빠름 (O(1)) |
| LinkedHashSet | 입력 순서 유지 |
| TreeSet | 정렬 유지 (O(log n)) |

---

## 4. Map (중요 ⭐⭐⭐⭐⭐)

### Map = Set + Value

- Key = Set 구조
- Value는 덤

### Map 구현체 선택 기준

| 상황 | 추천 |
| --- | --- |
| 성능 최우선 | HashMap |
| 입력 순서 필요 | LinkedHashMap |
| 정렬 필요 | TreeMap |

### ⚠️ Map Key 주의사항

> Key 객체는 반드시
> 
- `hashCode()`
- `equals()`
    
    를 **논리적으로 일관되게** 구현해야 함
    

---

## 5. Stack & Queue & Deque

### ❌ Stack 클래스 쓰지 마세요

- 내부가 `Vector` (구시대 유물)
- 동기화 과도 → 성능 나쁨

### ✅ ArrayDeque 하나로 해결

| 용도 | 메서드 |
| --- | --- |
| Stack | `push()`, `pop()` |
| Queue | `offer()`, `poll()` |
| Deque | `offerFirst`, `offerLast` |

```java
Deque<Integer> dq = new ArrayDeque<>();

```

📌 **실무 결론**

> Stack / Queue / Deque → ArrayDeque
> 

---

## 6. 순회 (Iterable & Iterator) ⭐ 추가 중요

### Iterator의 진짜 의미

> 자료구조 내부를 몰라도 순회 가능하게 만드는 표준 인터페이스
> 

```java
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    System.out.println(it.next());
}

```

### for-each의 정체

```java
for (int x : list) { }
// ↓ 내부적으로 Iterator 사용

```

### ⚠️ Fail-Fast Iterator

- 순회 중 컬렉션 구조 변경 시 `ConcurrentModificationException`
- **Iterator.remove()만 허용**

---

## 7. 정렬 (Comparable & Comparator)

### Comparable (자기 자신 기준)

```java
class Student implements Comparable<Student> {
    public int compareTo(Student o) {
        return this.score - o.score;
    }
}

```

### Comparator (외부 기준)

```java
Comparator<Student> comp =
    Comparator.comparing(Student::getScore)
              .thenComparing(Student::getName);

```

---

## 🛠 실무 핵심: 다중 조건 정렬 (람다 버전)

```java
students.sort(
    Comparator.comparing(Student::getScore).reversed()
              .thenComparing(Student::getName)
);

```

📌 **면접 포인트**

- `if` 비교보다 **Comparator 체이닝**이 훨씬 가독성 + 안정성 높음

---

## 8. Collections 유틸리티 클래스 ⭐ 추가

```java
Collections.sort(list);
Collections.reverse(list);
Collections.shuffle(list);
Collections.max(list);
Collections.min(list);

```

⚠️ **Collections ≠ Collection**

- `Collection` : 인터페이스
- `Collections` : 유틸 클래스

---

## 9. Enum 전용 컬렉션 ⭐ 실무 꿀팁

### EnumSet

- 내부가 비트 연산
- HashSet보다 **훨씬 빠름**

```java
EnumSet<Day> days = EnumSet.of(MON, TUE);

```

### EnumMap

- Key가 Enum일 때 최적

```java
EnumMap<Day, String> map = new EnumMap<>(Day.class);

```

---

## 10. 불변 컬렉션 (Java 9+) ⭐ 추가

```java
List.of(1,2,3);
Set.of("A","B");
Map.of("a",1,"b",2);

```

- 수정 시 `UnsupportedOperationException`
- 방어적 복사 대체 가능

---

## 🎯 마무리 요약 (진짜 중요)

> 컬렉션을 잘 안다는 것은
> 
> 
> **자료구조를 외운다는 뜻이 아니라**
> 
- ✔ 데이터 특성에 맞는 선택
- ✔ 성능/순서/중복 판단
- ✔ 내부 원리(hash, iterator, 정렬)를 설명 가능

이라는 뜻이다.

---

## ☕ Java 고급 1편: 멀티스레딩 & 동시성 완전 정복

> 학습 목표
> 
> 
> 단순 문법 암기가 아닌,
> 
> **“동시성 문제가 왜 생겼고 → 자바는 어떻게 진화했으며 → 실무에서는 무엇을 써야 하는가”**
> 
> 를 하나의 흐름으로 이해한다.
> 

---

## 1. 프로세스와 스레드 (Why Thread?)

### 프로세스 vs 스레드

- **프로세스**: OS 자원 단위 (메모리 독립)
- **스레드**: 프로세스 내부 실행 단위 (메모리 공유)

📌 **멀티스레드의 본질**

> “자원을 공유하면서 동시에 실행한다”
> 
> 
> → 성능 ↑
> 
> → **동시성 문제 필연 발생**
> 

---

## 2. 스레드 생성과 실행 책임 분리

### Runnable vs Thread

자바에서 가장 중요한 원칙:

> “일(Runnable)과 일꾼(Thread)을 분리하라”
> 

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
> 
> 
> Runnable / Callable 사용 ⭕
> 

---

## 3. 스레드 생명주기와 상태 전이

### Thread 상태 (중요)

| 상태 | 의미 |
| --- | --- |
| NEW | 생성 |
| RUNNABLE | 실행 가능 |
| BLOCKED | 락 대기 |
| WAITING | 조건 대기 |
| TIMED_WAITING | 시간 대기 |
| TERMINATED | 종료 |

### 핵심 구분

- **BLOCKED**: synchronized 락 기다림 (락 반납 ❌)
- **WAITING**: wait(), join() (락 반납 ⭕

📌 면접 포인트

> wait()는 락을 반납하지만, BLOCKED는 반납하지 않는다.
> 

---

## 4. 실행 순서 제어 – join()

```java
thread.start();
thread.join(); // 종료까지 대기

```

왜 필요할까?

- 비동기 결과 필요
- 작업 순서 보장

📌 join 없으면 **결과 출력 전에 main 종료 가능**

---

## 5. 메모리 가시성 문제 (volatile)

### 문제

CPU 캐시로 인해:

- 한 스레드의 변경값을
- 다른 스레드가 **못 보는 현상**

```java
volatile boolean running = true;

```

volatile 의미:

> “이 변수는 항상 메인 메모리에서 읽고 써라”
> 

📌 주의

- volatile ❌ 원자성 보장
- volatile ⭕ 가시성만 보장

---

## 6. 상호 배제 – synchronized

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

## 7. 잘못된 해결 – Busy Waiting ❌

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

> “자면서 확인하지 말고, 깨워달라고 요청하라”
> 

---

## 8. 1세대 협력 – wait / notify

```java
synchronized(lock) {
    while(condition) {
        lock.wait(); // 락 반납
    }
    lock.notifyAll();
}

```

### 한계

- wait set 하나
- notifyAll → **모두 깨움**
- 생산자/소비자 구분 불가

---

## 9. 2세대 협력 – Lock & Condition

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
> 

---

## 🔟 CAS와 Atomic (락 없는 동기화)

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

## 1.1. 동시성 컬렉션 (재발명 금지)

| 자료구조 | 사용 금지 | 사용 권장 |
| --- | --- | --- |
| Map | HashMap | ConcurrentHashMap |
| List | ArrayList | CopyOnWriteArrayList |
| Queue | LinkedList | BlockingQueue |

📌 **BlockingQueue**

> wait / notify / Condition의 최종 진화형
> 

---

## 1.2. 왜 스레드 풀인가?

### 문제

```java
new Thread(task); // 요청마다 생성 ❌

```

- 생성 비용 큼
- OOM 위험

### 해결

> 미리 생성 + 재사용
> 

---

## 1.3. ThreadPoolExecutor 동작 원리 (중요)

### 처리 순서

1. core 스레드 생성
2. 큐 적재
3. 큐 초과 → max 스레드 생성
4. max 초과 → 거절

📌 **LinkedBlockingQueue(무한)**

→ maxPoolSize **절대 안 씀**

→ 실무 최악 실수

---

## 1.4. 스레드 풀 전략

### 고정 풀

- 안정적
- 큐 무한 → 지연 위험

### 캐시 풀

- 빠름
- 스레드 무한 → 장애 위험

### 실무 추천 (커스텀)

```java
new ThreadPoolExecutor(
    100, 200, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(1000),
    new ThreadPoolExecutor.CallerRunsPolicy()
);

```

> 일반 → 긴급 → 거절
> 

---

## 1.5. 거절 정책 (Backpressure)

| 정책 | 설명 |
| --- | --- |
| AbortPolicy | 예외 |
| DiscardPolicy | 조용히 버림 |
| CallerRunsPolicy | 요청자가 직접 실행 |

📌 **CallerRunsPolicy = 자연스러운 트래픽 제어**

---

## 1.6. Executor 우아한 종료 (Graceful Shutdown)

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
> 

---

## ☕ Java 고급 2편: 자바 백엔드 개발자 필수 지식 (파일 I/O · 네트워크 · HTTP 서버)

> 💡 문서 개요
> 
> 
> 이 문서는 단순 문법 암기가 아닌
> 
> - *“왜 이 기술이 탄생했는가?”**에 대한 문제 해결의 흐름을 정리한 노트입니다.
> 
> 스레드 → 동시성 → I/O → 네트워크 → 웹 서버(WAS) 구현까지
> 
> **자바 백엔드 개발의 핵심 원리**를 하나의 맥락으로 이해하는 것을 목표로 합니다.
> 

---

## 📌 Part 1. 멀티스레드와 동시성 (Thread & Concurrency)

### 1. 스레드 기초 (Thread vs Runnable)

> 💡 핵심 개념
> 
> - `Runnable` : 작업 내용 (해야 할 일)
> - `Thread` : 작업자 (일을 하는 놈)

```java
Runnable task = () -> System.out.println("작업 시작");
Thread thread = new Thread(task);
thread.start(); // 반드시 start()

```

- `run()` → 단순 메서드 호출
- `start()` → **새 Stack 생성 + 병렬 실행**

> ⚠️ 포인트
> 
> 
> 스레드와 작업을 분리해야
> 
> → 스레드 풀, Executor 프레임워크로 확장 가능
> 

---

### 2. 동시성 문제 해결 (Synchronized & Volatile)

> ⚠️ 문제
> 
> 
> 여러 스레드가 하나의 자원에 동시에 접근 → Race Condition 발생
> 

### 🔹 volatile (가시성)

- CPU 캐시 ❌
- 메인 메모리(RAM) ⭕
- 값 변경을 **다른 스레드가 즉시 인지**

> ⚠️ 원자성은 보장하지 않음
> 

### 🔹 synchronized (원자성)

- 한 번에 하나의 스레드만 접근
- **임계 영역(Critical Section)** 보호

```java
public synchronized void withdraw(int amount) {
    if (balance >= amount) balance -= amount;
}

```

---

### 3. 스레드 협력의 진화 (Wait & Notify)

> ❌ Busy Waiting은 CPU 낭비
> 
> 
> → “자면서 확인” ❌
> 
> → “깨워달라고 요청” ⭕
> 

### 1단계: wait / notify

- Object 기본 메서드
- `notifyAll()` → 관련 없는 스레드까지 깨움 (비효율)

### 2단계: Lock / Condition (실무 권장)

> 💡 핵심은 ‘대기실 분리’
> 

```java
Lock lock = new ReentrantLock();
Condition producerCond = lock.newCondition();
Condition consumerCond = lock.newCondition();

```

- 생산자 / 소비자 대기 공간 분리
- 필요한 대상만 `signal()`

---

### 4. 스레드 풀 (ThreadPoolExecutor)

> ⚠️ 스레드 생성은 매우 비쌈
> 
> 
> → **미리 만들고 재사용**
> 

### 💡 실무 핵심 전략

- `Executors.newFixedThreadPool()` ❌
- `ThreadPoolExecutor` 직접 생성 ⭕
- **큐 사이즈 제한 필수** (OOM 방지)

```java
ExecutorService es = new ThreadPoolExecutor(
    10, 20, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100),
    new ThreadPoolExecutor.CallerRunsPolicy()
);

```

> 💡 CallerRunsPolicy
> 
> - 큐가 꽉 차면
> - 요청한 스레드가 직접 처리
> - 자연스러운 Backpressure 발생

---

## 📌 Part 2. 입출력과 성능 최적화 (I/O)

### 1. 버퍼링 (Buffered I/O)

> 💡 디스크 접근(System Call)은 매우 느리다
> 
> - 1바이트씩 ❌
> - 버퍼 단위 ⭕

```java
try (BufferedInputStream bis =
     new BufferedInputStream(new FileInputStream("data.dat"))) {
    bis.read();
}

```

- *기본 스트림 + 보조 스트림(체인 구조)**가 정석

---

### 2. 문자 인코딩 (Charset)

> 💡 컴퓨터는 byte만 이해한다
> 
> 
> → 문자 처리는 인코딩 규칙이 필요
> 

```java
Reader reader =
    new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8);

```

> ⚠️ 한글 깨짐의 99% 원인
> 
> 
> → `InputStreamReader`에서 인코딩 미지정
> 

---

### 3. 자원 정리 (try-with-resources)

> ⚠️ close() 안 하면
> 
> 
> → 파일 핸들 / 소켓 고갈
> 
> → 서버 다운
> 

```java
try (InputStream in = ...) {
    // 자동 close
}

```

---

### 4. File vs Files (java.io vs java.nio)

| 구분 | File | Files |
| --- | --- | --- |
| 세대 | 구형 | Java 7+ |
| 특징 | 기능 제한 | 실무용 유틸 |
| 추천 | ❌ | ⭕ |

> 💡 실무 기본은 Files + Path
> 

---

### 🔽 (토글) Blocking I/O의 한계

- read/write는 Blocking
- I/O 대기 동안 스레드 멈춤
- 동시 요청 증가 → 스레드 폭증
- 이 한계를 해결하기 위해 NIO / Netty / WebFlux 등장

---

## 📌 Part 3. 네트워크와 웹 서버 구현 (Network & WAS)

### 1. 소켓 통신

- **ServerSocket** : 문지기 (`accept()` → Blocking)
- **Socket** : 연결된 통로

> ⚠️ 요청 하나당 스레드 하나 필요
> 
> 
> → **Thread Pool 필수**
> 

---

### 2. 리플렉션 (Reflection)

> 💡 실행 중(Runtime)에 클래스 구조를 분석하고,메서드를 이름으로 호출하는 기술
> 

```java
Class<?> clazz = controller.getClass();
Method method = clazz.getMethod("site1");
method.invoke(controller);

```

> 💡 Spring이 개발자 코드를 실행할 수 있는 핵심 원리
> 

---

### 3. 애노테이션 (Annotation)

> 💡 런타임에 읽을 수 있는 메타데이터
> 

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)

```

- 리플렉션 + 애노테이션
    
    = **프레임워크의 자동화**
    

---

### 4. 미니 WAS 아키텍처

| 구성 요소 | 역할 | Spring 매칭 |
| --- | --- | --- |
| HttpServer | 포트 오픈 | Tomcat |
| HandlerMapping | URL → 메서드 | HandlerMapping |
| Dispatcher | 동적 실행 | DispatcherServlet |
| Controller | 비즈니스 로직 | @Controller |

---

### 5. Dispatcher 성능 최적화

> ⚠️ 초기 방식
> 
> - 요청마다 전체 탐색 → **O(N)**

> 💡 개선 방식
> 
> 1. 서버 시작 시 스캔
> 2. `Map<URL, Method>` 캐싱
> 3. 요청 시 **O(1)** 조회

---

### 6. DI의 본질 (구성과 사용의 분리)

```java
MemberController controller =
    new MemberController(memberRepository);

```

- 컨트롤러는 구현체를 모름
- 조립은 외부에서 수행

> 💡 이 과정을 자동화한 것이 Spring DI Container
> 

---

## 🌱 마무리

> 💡 이 문서의 핵심 메시지
> 
> 
> 프레임워크는 문제를 대신 해결해주지만,
> 
> **이해한 개발자만이 올바른 선택을 할 수 있다.**
> 

✔ 성능 이슈 분석

✔ 서버 장애 대응

✔ 아키텍처 판단

👉 **프레임워크를 쓰는 사람이 아니라, 이해하고 지배하는 사람**

---

## ☕ Java 고급 3편: 함수형 프로그래밍 & 스트림 마스터 (람다, 스트림)

> 문서 개요
> 
> 
> 자바 8의 핵심 변화인 **람다(Lambda)**, **함수형 인터페이스**, **스트림(Stream)**, **Optional**, **디폴트 메서드**, **병렬 스트림**을 “왜 필요했는지 → 어떻게 쓰는지 → 어디서 조심해야 하는지” 흐름으로 정리한다.
> 

---

## Part 1. 람다와 함수형 프로그래밍 (Lambda)

### 1) 람다의 탄생 (Why?)

- 자바는 원래 “동작(코드)”을 전달하려면 **익명 클래스**를 써야 해서 코드가 길고 지저분했다.
- 람다는 **메서드(동작)를 값처럼 전달**하기 위한 문법:
    
    `파라미터 -> 바디` 형태로 “동작”만 남긴다.
    
- 람다의 본질: **함수형 인터페이스(추상 메서드 1개)** 구현을 간단히 쓰는 문법 설탕(syntax sugar)

✅ 예시

```java
// 익명 클래스
new Thread(new Runnable() {
    @Override public void run() { System.out.println("Hello"); }
}).start();

// 람다
new Thread(() -> System.out.println("Hello")).start();

```

---

### 2) 함수형 인터페이스 핵심

- 람다는 반드시 **추상 메서드가 1개인 인터페이스**에만 대입 가능
- 실무에서는 표준 함수형 인터페이스를 거의 씀

### ✅ 표준 함수형 인터페이스 4대장

| 인터페이스 | 메서드 | 의미 | 예시 |
| --- | --- | --- | --- |
| Supplier<T> | `get()` | 값 “공급” | `() -> "hi"` |
| Consumer<T> | `accept(T)` | 값 “소비”(리턴 없음) | `x -> println(x)` |
| Function<T,R> | `apply(T)` | 변환 | `s -> Integer.parseInt(s)` |
| Predicate<T> | `test(T)` | 조건 | `n -> n > 10` |

---

### 3) 변수 캡처링 (Variable Capturing)

- 람다 내부에서 바깥 지역 변수를 쓰면 그 변수는 **final 또는 effectively final**이어야 한다.
- 이유(핵심 감각): 람다 인스턴스는 더 오래 살아남을 수 있는데, 지역 변수는 원래 “잠깐” 쓰고 끝나는 값이라 **값이 바뀌면 의미가 꼬일 수 있어** 안전장치가 걸려 있다.

---

### 4) 메서드 참조 (Method Reference)

람다에서 “그냥 어떤 메서드 호출만 전달”하는 경우라면 더 줄일 수 있다.

메서드 참조는 **람다를 더 간결하게 쓰는 문법**이다.

### ✅ 메서드 참조 4가지 유형(중요)

- **정적 메서드 참조**: `클래스명::메서드`
- **특정 객체의 인스턴스 메서드 참조**: `객체::메서드`
- **생성자 참조**: `클래스명::new`
- **임의 객체의 인스턴스 메서드 참조**: `클래스명::인스턴스메서드`(첫 번째 인자를 호출 대상으로 사용)

---

## Part 2. 스트림 API (Stream)

### 1) 스트림이란? (선언형 처리)

- 컬렉션을 반복문으로 “어떻게(for/if)” 처리하는 대신,
- “무엇을(filter/map/collect)” 할지 **선언형으로 파이프라인 구성**하는 API

✅ 기본 패턴

```java
List<Integer> result =
    list.stream()
        .filter(x -> x > 10)     // 중간 연산
        .map(x -> x * 2)         // 중간 연산
        .collect(Collectors.toList()); // 최종 연산

```

---

### 2) 지연 연산(Lazy Evaluation) – 스트림의 핵심 메커니즘

- `filter`, `map` 같은 **중간 연산은 “설계도”만 쌓음**
- `collect`, `forEach` 같은 **최종 연산이 호출되는 순간** 한 번에 실행

> ✅ 실무 감각: “중간 연산을 몇 개 붙여도 최종 연산 전까지는 실제로 안 돈다.”
> 

---

### 3) 많이 쓰는 연산 세트

- **필터링/변환**: `filter`, `map`
- **평탄화**: `flatMap`
- **정렬/중복제거**: `sorted`, `distinct`
- **매칭/탐색**: `anyMatch`, `allMatch`, `findFirst`
- **집계**: `count`, `reduce`, `collect`

---

### 4) 성능 팁 (실무에서 체감 큼)

- 기본형 숫자는 `Stream<Integer>` 대신 **`IntStream` / `LongStream`** 사용 (오토박싱 비용 ↓)
- 스트림은 “깔끔한 코드”가 장점이지만,
    - *핫패스(초고성능)**에서는 루프가 더 빠를 때도 있음 → 성능 이슈 있으면 측정 후 결정

---

## Part 3. Optional (Null Safety)

### 1) Optional의 목적

- `null`을 직접 다루는 대신, “값이 있을 수도/없을 수도”를 타입으로 표현해서
- NPE를 줄이고, 처리 흐름을 명확히 한다.

---

### 2) orElse vs orElseGet (빠지면 위험한 포인트)

이 부분은 지금 정리본에 들어가 있어서 아주 좋고, **꼭 강조**하면 더 탄탄해집니다.

- `orElse(T other)`는 **Optional에 값이 있어도** 인자로 전달한 표현식이 먼저 평가될 수 있다(즉시 평가, eager)
- `orElseGet(Supplier)`는 **값이 없을 때만** Supplier를 실행한다(지연 평가, lazy)

✅ 결론

- “대체값 생성 비용이 크다” → **orElseGet** 우선 고려

---

### 3) Optional 실무 규칙(권장)

- Optional을 **필드로 들고 있는 것**은 보통 비추천(직렬화/프레임워크 호환성 이슈)
- 메서드 **리턴 타입**에서 “없음”을 표현하는 용도로 많이 사용
- `Optional.get()` 직접 호출은 되도록 피하고, `orElseThrow`, `map`, `ifPresent` 등으로 흐름을 만든다

---

## Part 4. 디폴트 메서드 (Default Method)

### 1) 왜 나왔나? (하위 호환성)

- 인터페이스에 메서드를 추가하면, 기존 구현 클래스들이 전부 컴파일 에러가 난다.
- 이 **하위 호환성 문제를 해결**하기 위해 “인터페이스에 구현부를 둘 수 있게” 만든 기능이 디폴트 메서드다.

✅ 요약

- `default`로 기본 구현 제공 → 기존 구현체가 “바로 안 깨짐”

---

### 2) 주의사항 (이게 빠지면 반쪽)

- 디폴트 메서드는 “하위 호환”을 위한 최소한의 도구
    
    남발하면 인터페이스의 “계약(Contract)” 역할이 흐려진다
    
- **다중 상속 충돌 문제**:
    
    여러 인터페이스에 동일 시그니처 default가 있으면 구현 클래스에서 충돌을 반드시 해결해야 한다
    

---

## Part 5. 병렬 스트림 (Parallel Stream)

### 1) 동작 원리 (ForkJoin 공용 풀)

- `parallel()`은 내부적으로 **Fork/Join 공용 풀(commonPool)**을 사용해 병렬 연산을 수행한다.
- 코드에서 `parallel()` 한 줄만 추가해도 여러 워커 스레드가 분산 처리한다.

✅ 예시 감각

```java
int sum = IntStream.rangeClosed(1, 8)
    .parallel()
    .map(HeavyJob::heavyTask)
    .reduce(0, Integer::sum);

```

(공용 풀의 워커들이 동시에 처리)

---

### 2) 실무에서 “병렬 스트림 = 만능”이 아닌 이유

노션 정리본에 이미 “I/O 섞이면 느려질 수 있다”가 들어가 있었는데, 여기에 **판단 기준을 한 줄 더** 얹으면 완성됩니다.

- **CPU Bound(순수 연산)**: 병렬 스트림 효과가 잘 난다 (예: 대규모 계산)
- **I/O Bound(DB/HTTP 호출)**: 공용 풀/외부 대기 때문에 역효과 가능
    
    → 이 경우는 보통 **Executor(스레드풀) + 비동기 설계**가 더 예측 가능
    

---

## ✅ 최종 체크: 보강하면 좋은 포인트

- **메서드 참조 4가지 유형**을 표로 고정해두면, 면접/실무에서 바로 꺼내쓰기 좋음
- **Optional의 orElse vs orElseGet** 차이는 “즉시 평가 vs 지연 평가”로 못 박아야 함
- **디폴트 메서드**는 하위호환성 + 충돌 문제까지 같이 써야 완결
- **병렬 스트림**은 ForkJoin 공용 풀 기반이라는 한 줄이 들어가야 설계 판단이 쉬워짐

---

## 관련 문서

- [(학습/개발 (CS)/언어/JAVA) 🚀 Java 중급 2편: 컬렉션 프레임워크 마스터](../../개발%20(CS)/언어/JAVA/[Java]%20Java%20중급%202편_%20컬렉션%20프레임워크%20마스터%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트의 "Java 중급 2편" 요약이 원본으로 삼은 컬렉션 프레임워크 상세 노트
- [(학습/개발 (CS)/언어/JAVA) ☕ Java Deep Dive](../../개발%20(CS)/언어/JAVA/[Java]%20Java%20Deep%20Dive%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트의 "Java 고급 1편" 요약이 원본으로 삼은 멀티스레딩/동시성 상세 노트
- [(학습/개발 (CS)/언어/JAVA) ☕ Java Backend Core](../../개발%20(CS)/언어/JAVA/[Java]%20Java%20Backend%20Core%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트의 "Java 고급 2편" 요약이 원본으로 삼은 I/O·네트워크·미니 WAS 상세 노트
- [(학습/개발 (CS)/언어/JAVA) ☕ [Modern Java] 자바 함수형 프로그래밍 & 스트림 마스터](../../개발%20(CS)/언어/JAVA/[Java]%20Modern%20Java%20자바%20함수형%20프로그래밍%20&%20스트림%20마스%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트의 "Java 고급 3편" 요약이 원본으로 삼은 람다/스트림/Optional 상세 노트
- [(학습/프레임워크/Spring Framework) SPRING MVC 구조 #1 (Dispatcher Servlet, handler mapping)](SPRING%20MVC%20구조%20%231%20(Dispatcher%20Servlet,%20handler%20mapping).md) — 이 노트의 "미니 WAS 아키텍처(HandlerMapping→Dispatcher→Controller)" 실습을 실제 Spring의 DispatcherServlet 구조로 확장해서 보는 노트
- [(학습/프레임워크/Spring Framework) Spring Bean (+ Bean Factory)](Spring%20Bean%20(+%20Bean%20Factory).md) — 이 노트의 "DI의 본질(구성과 사용의 분리)" 수작업 예제를 실제 Spring의 BeanFactory/DI 컨테이너 구현으로 이어서 보는 노트

---

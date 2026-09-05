---
title: "☕ Java Backend Core"
tags: [학습, 개발-CS, 언어, JAVA, 개발, 동시성, IO, 네트워크, WAS]
created: 2026-09-05
modified: 2026-09-05
---

# ☕ Java Backend Core

> [!NOTE]
> 자바 백엔드 개발자 필수 지식 총정리. 단순 문법 암기가 아닌 "왜 이 기술이 탄생했는가?"의 흐름으로, 스레드 → 동시성 → I/O → 네트워크 → WAS 구현까지 하나의 맥락으로 이해한다.

## 📌 개념

### Part 1. 멀티스레드와 동시성 (Thread & Concurrency)

#### 1️⃣ 스레드 기초 (Thread vs Runnable)

> [!TIP]
> - `Runnable` : 작업 내용 (해야 할 일)
> - `Thread` : 작업자 (일을 하는 놈)

```java
Runnable task = () -> System.out.println("작업 시작");
Thread thread = new Thread(task);
thread.start(); // 반드시 start()
```

- `run()` → 단순 메서드 호출
- `start()` → **새 Stack 생성 + 병렬 실행**

> [!WARNING]
> 스레드와 작업을 분리해야 스레드 풀, Executor 프레임워크로 확장 가능

#### 2️⃣ 동시성 문제 해결 (Synchronized & Volatile)

> [!WARNING]
> 여러 스레드가 하나의 자원에 동시에 접근 → Race Condition 발생

**🔹 volatile (가시성)**

- CPU 캐시 ❌
- 메인 메모리(RAM) ⭕
- 값 변경을 **다른 스레드가 즉시 인지**

> [!WARNING]
> 원자성은 보장하지 않음

**🔹 synchronized (원자성)**

- 한 번에 하나의 스레드만 접근
- **임계 영역(Critical Section)** 보호

```java
public synchronized void withdraw(int amount) {
    if (balance >= amount) balance -= amount;
}
```

#### 3️⃣ 스레드 협력의 진화 (Wait & Notify)

> [!CAUTION]
> Busy Waiting은 CPU 낭비
> → "자면서 확인" ❌
> → "깨워달라고 요청" ⭕

**1단계: wait / notify**

- Object 기본 메서드
- `notifyAll()` → 관련 없는 스레드까지 깨움 (비효율)

**2단계: Lock / Condition (실무 권장)**

> [!TIP]
> 핵심은 '대기실 분리'

```java
Lock lock = new ReentrantLock();
Condition producerCond = lock.newCondition();
Condition consumerCond = lock.newCondition();
```

- 생산자 / 소비자 대기 공간 분리
- 필요한 대상만 `signal()`

#### 4️⃣ 스레드 풀 (ThreadPoolExecutor)

> [!WARNING]
> 스레드 생성은 매우 비쌈 → **미리 만들고 재사용**

**💡 실무 핵심 전략**

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

> [!TIP]
> CallerRunsPolicy
> - 큐가 꽉 차면
> - 요청한 스레드가 직접 처리
> - 자연스러운 Backpressure 발생

### Part 2. 입출력과 성능 최적화 (I/O)

#### 1️⃣ 버퍼링 (Buffered I/O)

> [!TIP]
> 디스크 접근(System Call)은 매우 느리다
> - 1바이트씩 ❌
> - 버퍼 단위 ⭕

```java
try (BufferedInputStream bis =
     new BufferedInputStream(new FileInputStream("data.dat"))) {
    bis.read();
}
```

- **기본 스트림 + 보조 스트림(체인 구조)**가 정석

#### 2️⃣ 문자 인코딩 (Charset)

> [!TIP]
> 컴퓨터는 byte만 이해한다 → 문자 처리는 인코딩 규칙이 필요

```java
Reader reader =
    new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8);
```

> [!WARNING]
> 한글 깨짐의 99% 원인 → `InputStreamReader`에서 인코딩 미지정

#### 3️⃣ 자원 정리 (try-with-resources)

> [!WARNING]
> close() 안 하면 → 파일 핸들 / 소켓 고갈 → 서버 다운

```java
try (InputStream in = ...) {
    // 자동 close
}
```

#### 4️⃣ File vs Files (java.io vs java.nio)

| 구분 | File | Files |
| --- | --- | --- |
| 세대 | 구형 | Java 7+ |
| 특징 | 기능 제한 | 실무용 유틸 |
| 추천 | ❌ | ⭕ |

> [!TIP]
> 실무 기본은 Files + Path

#### 🔽 (토글) Blocking I/O의 한계

- read/write는 Blocking
- I/O 대기 동안 스레드 멈춤
- 동시 요청 증가 → 스레드 폭증
- 이 한계를 해결하기 위해 NIO / Netty / WebFlux 등장

### Part 3. 네트워크와 웹 서버 구현 (Network & WAS)

#### 1️⃣ 소켓 통신

- **ServerSocket** : 문지기 (`accept()` → Blocking)
- **Socket** : 연결된 통로

> [!WARNING]
> 요청 하나당 스레드 하나 필요 → **Thread Pool 필수**

#### 2️⃣ 리플렉션 (Reflection)

> [!TIP]
> 실행 중(Runtime)에 클래스 구조를 분석하고, 메서드를 이름으로 호출하는 기술

```java
Class<?> clazz = controller.getClass();
Method method = clazz.getMethod("site1");
method.invoke(controller);
```

> [!TIP]
> Spring이 개발자 코드를 실행할 수 있는 핵심 원리

#### 3️⃣ 애노테이션 (Annotation)

> [!TIP]
> 런타임에 읽을 수 있는 메타데이터

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
```

- 리플렉션 + 애노테이션 = **프레임워크의 자동화**

#### 4️⃣ 미니 WAS 아키텍처

| 구성 요소 | 역할 | Spring 매칭 |
| --- | --- | --- |
| HttpServer | 포트 오픈 | Tomcat |
| HandlerMapping | URL → 메서드 | HandlerMapping |
| Dispatcher | 동적 실행 | DispatcherServlet |
| Controller | 비즈니스 로직 | @Controller |

#### 5️⃣ Dispatcher 성능 최적화

> [!WARNING]
> 초기 방식: 요청마다 전체 탐색 → **O(N)**

> [!TIP]
> 개선 방식
> 1. 서버 시작 시 스캔
> 2. `Map<URL, Method>` 캐싱
> 3. 요청 시 **O(1)** 조회

#### 6️⃣ DI의 본질 (구성과 사용의 분리)

```java
MemberController controller =
    new MemberController(memberRepository);
```

- 컨트롤러는 구현체를 모름
- 조립은 외부에서 수행

> [!TIP]
> 이 과정을 자동화한 것이 Spring DI Container

### 🌱 마무리

> [!TIP]
> 프레임워크는 문제를 대신 해결해주지만, **이해한 개발자만이 올바른 선택을 할 수 있다.**

- ✔ 성능 이슈 분석
- ✔ 서버 장애 대응
- ✔ 아키텍처 판단

👉 **프레임워크를 쓰는 사람이 아니라, 이해하고 지배하는 사람**

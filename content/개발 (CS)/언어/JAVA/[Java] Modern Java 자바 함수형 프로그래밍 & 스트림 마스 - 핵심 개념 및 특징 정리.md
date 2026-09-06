---
title: "☕ [Modern Java] 자바 함수형 프로그래밍 & 스트림 마스터"
tags: [학습, 개발-CS, 언어, JAVA, 개발, 함수형, 스트림, 람다, Optional]
created: 2026-09-05
modified: 2026-09-05
---

# ☕ [Modern Java] 자바 함수형 프로그래밍 & 스트림 마스터

> [!NOTE]
> 자바 8의 핵심 변화인 람다(Lambda), 함수형 인터페이스, 스트림(Stream), Optional, 디폴트 메서드, 병렬 스트림을 "왜 필요했는지 → 어떻게 쓰는지 → 어디서 조심해야 하는지" 흐름으로 정리한다.

## 📌 개념

### Part 1. 람다와 함수형 프로그래밍 (Lambda)

#### 1) 람다의 탄생 (Why?)

- 자바는 원래 "동작(코드)"을 전달하려면 **익명 클래스**를 써야 해서 코드가 길고 지저분했다.
- 람다는 **메서드(동작)를 값처럼 전달**하기 위한 문법: `파라미터 -> 바디` 형태로 "동작"만 남긴다.
- 람다의 본질: **함수형 인터페이스(추상 메서드 1개)** 구현을 간단히 쓰는 문법 설탕(syntax sugar)

```java
// 익명 클래스
new Thread(new Runnable() {
    @Override public void run() { System.out.println("Hello"); }
}).start();

// 람다
new Thread(() -> System.out.println("Hello")).start();
```

#### 2) 함수형 인터페이스 핵심

- 람다는 반드시 **추상 메서드가 1개인 인터페이스**에만 대입 가능
- 실무에서는 표준 함수형 인터페이스를 거의 씀

**✅ 표준 함수형 인터페이스 4대장**

| 인터페이스 | 메서드 | 의미 | 예시 |
| --- | --- | --- | --- |
| Supplier<T> | `get()` | 값 "공급" | `() -> "hi"` |
| Consumer<T> | `accept(T)` | 값 "소비"(리턴 없음) | `x -> println(x)` |
| Function<T,R> | `apply(T)` | 변환 | `s -> Integer.parseInt(s)` |
| Predicate<T> | `test(T)` | 조건 | `n -> n > 10` |

#### 3) 변수 캡처링 (Variable Capturing)

- 람다 내부에서 바깥 지역 변수를 쓰면 그 변수는 **final 또는 effectively final**이어야 한다.
- 이유(핵심 감각): 람다 인스턴스는 더 오래 살아남을 수 있는데, 지역 변수는 원래 "잠깐" 쓰고 끝나는 값이라 **값이 바뀌면 의미가 꼬일 수 있어** 안전장치가 걸려 있다.

#### 4) 메서드 참조 (Method Reference)

- 람다에서 "그냥 어떤 메서드 호출만 전달"하는 경우라면 더 줄일 수 있다.
- 메서드 참조는 **람다를 더 간결하게 쓰는 문법**이다.

**✅ 메서드 참조 4가지 유형(중요)**

- **정적 메서드 참조**: `클래스명::메서드`
- **특정 객체의 인스턴스 메서드 참조**: `객체::메서드`
- **생성자 참조**: `클래스명::new`
- **임의 객체의 인스턴스 메서드 참조**: `클래스명::인스턴스메서드`(첫 번째 인자를 호출 대상으로 사용)

### Part 2. 스트림 API (Stream)

#### 1) 스트림이란? (선언형 처리)

- 컬렉션을 반복문으로 "어떻게(for/if)" 처리하는 대신,
- "무엇을(filter/map/collect)" 할지 **선언형으로 파이프라인 구성**하는 API

```java
List<Integer> result =
    list.stream()
        .filter(x -> x > 10)     // 중간 연산
        .map(x -> x * 2)         // 중간 연산
        .collect(Collectors.toList()); // 최종 연산
```

#### 2) 지연 연산(Lazy Evaluation) – 스트림의 핵심 메커니즘

- `filter`, `map` 같은 **중간 연산은 "설계도"만 쌓음**
- `collect`, `forEach` 같은 **최종 연산이 호출되는 순간** 한 번에 실행

> [!TIP]
> 실무 감각: "중간 연산을 몇 개 붙여도 최종 연산 전까지는 실제로 안 돈다."

#### 3) 많이 쓰는 연산 세트

- **필터링/변환**: `filter`, `map`
- **평탄화**: `flatMap`
- **정렬/중복제거**: `sorted`, `distinct`
- **매칭/탐색**: `anyMatch`, `allMatch`, `findFirst`
- **집계**: `count`, `reduce`, `collect`

#### 4) 성능 팁 (실무에서 체감 큼)

- 기본형 숫자는 `Stream<Integer>` 대신 **`IntStream` / `LongStream`** 사용 (오토박싱 비용 ↓)
- 스트림은 "깔끔한 코드"가 장점이지만, **핫패스(초고성능)**에서는 루프가 더 빠를 때도 있음 → 성능 이슈 있으면 측정 후 결정

### Part 3. Optional (Null Safety)

#### 1) Optional의 목적

- `null`을 직접 다루는 대신, "값이 있을 수도/없을 수도"를 타입으로 표현해서
- NPE를 줄이고, 처리 흐름을 명확히 한다.

#### 2) orElse vs orElseGet (빠지면 위험한 포인트)

- `orElse(T other)`는 **Optional에 값이 있어도** 인자로 전달한 표현식이 먼저 평가될 수 있다(즉시 평가, eager)
- `orElseGet(Supplier)`는 **값이 없을 때만** Supplier를 실행한다(지연 평가, lazy)

> [!TIP]
> "대체값 생성 비용이 크다" → **orElseGet** 우선 고려

#### 3) Optional 실무 규칙(권장)

- Optional을 **필드로 들고 있는 것**은 보통 비추천(직렬화/프레임워크 호환성 이슈)
- 메서드 **리턴 타입**에서 "없음"을 표현하는 용도로 많이 사용
- `Optional.get()` 직접 호출은 되도록 피하고, `orElseThrow`, `map`, `ifPresent` 등으로 흐름을 만든다

### Part 4. 디폴트 메서드 (Default Method)

#### 1) 왜 나왔나? (하위 호환성)

- 인터페이스에 메서드를 추가하면, 기존 구현 클래스들이 전부 컴파일 에러가 난다.
- 이 **하위 호환성 문제를 해결**하기 위해 "인터페이스에 구현부를 둘 수 있게" 만든 기능이 디폴트 메서드다.
- `default`로 기본 구현 제공 → 기존 구현체가 "바로 안 깨짐"

#### 2) 주의사항 (이게 빠지면 반쪽)

- 디폴트 메서드는 "하위 호환"을 위한 최소한의 도구. 남발하면 인터페이스의 "계약(Contract)" 역할이 흐려진다
- **다중 상속 충돌 문제**: 여러 인터페이스에 동일 시그니처 default가 있으면 구현 클래스에서 충돌을 반드시 해결해야 한다

### Part 5. 병렬 스트림 (Parallel Stream)

#### 1) 동작 원리 (ForkJoin 공용 풀)

- `parallel()`은 내부적으로 **Fork/Join 공용 풀(commonPool)**을 사용해 병렬 연산을 수행한다.
- 코드에서 `parallel()` 한 줄만 추가해도 여러 워커 스레드가 분산 처리한다.

```java
int sum = IntStream.rangeClosed(1, 8)
    .parallel()
    .map(HeavyJob::heavyTask)
    .reduce(0, Integer::sum);
```

#### 2) 실무에서 "병렬 스트림 = 만능"이 아닌 이유

- **CPU Bound(순수 연산)**: 병렬 스트림 효과가 잘 난다 (예: 대규모 계산)
- **I/O Bound(DB/HTTP 호출)**: 공용 풀/외부 대기 때문에 역효과 가능 → 이 경우는 보통 **Executor(스레드풀) + 비동기 설계**가 더 예측 가능

## 관련 문서

- [(학습/프레임워크/Spring Framework) JAVA 정리](../../../프레임워크/Spring%20Framework/[Java]%20JAVA%20정리%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 람다/스트림/Optional 노트를 Java 고급 3편 요약으로 압축해 담은 통합 정리 노트

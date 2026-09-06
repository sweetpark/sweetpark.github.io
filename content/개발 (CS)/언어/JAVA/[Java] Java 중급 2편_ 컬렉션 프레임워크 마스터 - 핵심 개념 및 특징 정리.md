---
title: "🚀 Java 중급 2편: 컬렉션 프레임워크 마스터"
tags: [학습, 개발-CS, 언어, JAVA, 개발, 컬렉션, 제네릭, 자료구조]
created: 2026-09-05
modified: 2026-09-05
---

# 🚀 Java 중급 2편: 컬렉션 프레임워크 마스터

> [!NOTE]
> 자료구조를 "쓸 줄 아는 단계"에서 "언제·왜·무엇을 선택해야 하는지 설명할 수 있는 단계"로 가기 위한 정리 — 제네릭, List/Set/Map, Stack/Queue/Deque, 순회, 정렬, Enum 컬렉션, 불변 컬렉션.

## 📌 개념

### 1. 제네릭 (Generic)

**🔑 핵심 목적**

- **컴파일 타임 타입 안정성**
- **형변환 제거**
- **코드 재사용성 증가**

```java
List<String> list = new ArrayList<>();
// list.add(10); // 컴파일 에러 (안전)
```

**🔸 와일드카드 (`?`) – PECS 원칙**

> PECS: Producer Extends, Consumer Super

| 표현 | 의미 | 사용 목적 |
| --- | --- | --- |
| `<? extends T>` | T 또는 자식 | **읽기 전용** |
| `<? super T>` | T 또는 부모 | **쓰기 전용** |

```java
void read(List<? extends Number> list) { } // get OK
void write(List<? super Integer> list) { } // add OK
```

**⚠️ 타입 이레이저 (Type Erasure)**

- 제네릭 정보는 **컴파일 타임에만 존재**
- 런타임에는 모두 `Object`
- 그래서 `new T()` 불가능, `instanceof List<String>` 불가능

### 2. List 계열

**ArrayList vs LinkedList**

| 항목 | ArrayList | LinkedList |
| --- | --- | --- |
| 내부 구조 | 배열 | 이중 연결 리스트 |
| 조회(get) | ⭐ O(1) | ❌ O(n) |
| 중간 삽입/삭제 | ❌ O(n) | ⭐ O(1) |
| 실무 사용 | ⭐⭐⭐⭐⭐ | 거의 안 씀 |

> [!TIP]
> 대부분의 경우 ArrayList가 정답. LinkedList는 이론용에 가깝다.

### 3. Set & Hash 구조

**Set 공통 특징**

- 중복 ❌
- 순서 ❌ (구현체에 따라 예외 있음)

**hashCode + equals 핵심 원리**

```java
1. hashCode() → 같은 버킷
2. equals() → 진짜 같은 객체인지 확인
```

👉 둘 중 하나라도 잘못 구현하면 **Set / Map 동작이 깨짐**

**Set 구현체 비교**

| 구현체 | 특징 |
| --- | --- |
| HashSet | 가장 빠름 (O(1)) |
| LinkedHashSet | 입력 순서 유지 |
| TreeSet | 정렬 유지 (O(log n)) |

### 4. Map (중요 ⭐⭐⭐⭐⭐)

**Map = Set + Value**

- Key = Set 구조
- Value는 덤

**Map 구현체 선택 기준**

| 상황 | 추천 |
| --- | --- |
| 성능 최우선 | HashMap |
| 입력 순서 필요 | LinkedHashMap |
| 정렬 필요 | TreeMap |

**⚠️ Map Key 주의사항**

> Key 객체는 반드시 `hashCode()`, `equals()`를 **논리적으로 일관되게** 구현해야 함

### 5. Stack & Queue & Deque

**❌ Stack 클래스 쓰지 마세요**

- 내부가 `Vector` (구시대 유물)
- 동기화 과도 → 성능 나쁨

**✅ ArrayDeque 하나로 해결**

| 용도 | 메서드 |
| --- | --- |
| Stack | `push()`, `pop()` |
| Queue | `offer()`, `poll()` |
| Deque | `offerFirst`, `offerLast` |

```java
Deque<Integer> dq = new ArrayDeque<>();
```

> [!TIP]
> Stack / Queue / Deque → ArrayDeque

### 6. 순회 (Iterable & Iterator) ⭐ 추가 중요

**Iterator의 진짜 의미**

> 자료구조 내부를 몰라도 순회 가능하게 만드는 표준 인터페이스

```java
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    System.out.println(it.next());
}
```

**for-each의 정체**

```java
for (int x : list) { }
// ↓ 내부적으로 Iterator 사용
```

**⚠️ Fail-Fast Iterator**

- 순회 중 컬렉션 구조 변경 시 `ConcurrentModificationException`
- **Iterator.remove()만 허용**

### 7. 정렬 (Comparable & Comparator)

**Comparable (자기 자신 기준)**

```java
class Student implements Comparable<Student> {
    public int compareTo(Student o) {
        return this.score - o.score;
    }
}
```

**Comparator (외부 기준)**

```java
Comparator<Student> comp =
    Comparator.comparing(Student::getScore)
              .thenComparing(Student::getName);
```

**🛠 실무 핵심: 다중 조건 정렬 (람다 버전)**

```java
students.sort(
    Comparator.comparing(Student::getScore).reversed()
              .thenComparing(Student::getName)
);
```

> [!TIP]
> 면접 포인트: `if` 비교보다 **Comparator 체이닝**이 훨씬 가독성 + 안정성 높음

### 8. Collections 유틸리티 클래스 ⭐ 추가

```java
Collections.sort(list);
Collections.reverse(list);
Collections.shuffle(list);
Collections.max(list);
Collections.min(list);
```

**⚠️ Collections ≠ Collection**

- `Collection` : 인터페이스
- `Collections` : 유틸 클래스

### 9. Enum 전용 컬렉션 ⭐ 실무 꿀팁

**EnumSet**

- 내부가 비트 연산
- HashSet보다 **훨씬 빠름**

```java
EnumSet<Day> days = EnumSet.of(MON, TUE);
```

**EnumMap**

- Key가 Enum일 때 최적

```java
EnumMap<Day, String> map = new EnumMap<>(Day.class);
```

### 10. 불변 컬렉션 (Java 9+) ⭐ 추가

```java
List.of(1,2,3);
Set.of("A","B");
Map.of("a",1,"b",2);
```

- 수정 시 `UnsupportedOperationException`
- 방어적 복사 대체 가능

### 🎯 마무리 요약 (진짜 중요)

컬렉션을 잘 안다는 것은 **자료구조를 외운다는 뜻이 아니라**

- ✔ 데이터 특성에 맞는 선택
- ✔ 성능/순서/중복 판단
- ✔ 내부 원리(hash, iterator, 정렬)를 설명 가능

이라는 뜻이다.

## 관련 문서

- [(학습/프레임워크/Spring Framework) JAVA 정리](../../../프레임워크/Spring%20Framework/[Java]%20JAVA%20정리%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 컬렉션 프레임워크 노트를 Java 중급 2편 요약으로 압축해 담은 통합 정리 노트

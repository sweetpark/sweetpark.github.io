---
title: "람다 + 스트림 (비교정렬, filter, toArray())"
tags: [학습, 코딩테스트, 코테템플릿, 알고리즘, 스트림, 람다]
created: 2026-04-25
modified: 2026-09-05
---

# 람다 + 스트림 (비교정렬, filter, toArray())

> [!NOTE]
> 개요
> 자바 스트림·람다를 코딩테스트에서 쓰기 위한 4대 주제 정리: **① 정렬(Comparable/Comparator) ② toArray() ③ flatMap 평탄화 ④ filter/Predicate**.

## 📌 개념

### 1. `compare` 활용과 오름차순/내림차순
정렬을 구현하는 방법은 두 가지 — **클래스에 기본 정렬 기준을 심는 `Comparable`**과 **그때그때 기준을 부여하는 `Comparator`**.

**A. 클래스 내부에서 `Comparable` 오버라이드**
객체가 스스로의 '기본 정렬'을 정한다. `compareTo`를 오버라이드.
- 오름차순: `this - other` (작은 것이 앞)
- 내림차순: `other - this` (큰 것이 앞)
- 직접 빼기는 정수 오버플로우 위험 → `Integer.compare()`가 안전.

```java
class Song implements Comparable<Song> {
    int playCount;

    @Override
    public int compareTo(Song other) {
        // [오름차순] Integer.compare(this.playCount, other.playCount);
        // [내림차순] 남의 것에서 내 것을 뺌 (큰 수 -> 작은 수)
        return Integer.compare(other.playCount, this.playCount);
    }
}
```

**B. 스트림에서 `Comparator` 사용**
기본 정렬이 없거나 다른 기준으로 정렬하고 싶을 때.
- 오름차순: `.sorted(Comparator.comparing(Song::getPlayCount))`
- 내림차순: `.reversed()` 붙이기
- 다중 조건: `.thenComparing()`

```java
List<Song> songs = // ...
songs.stream()
     // 1. 재생수 내림차순
     .sorted(Comparator.comparing(Song::getPlayCount).reversed()
     // 2. 재생수가 같다면 인덱스 오름차순
     .thenComparing(Song::getIndex))
     .collect(Collectors.toList());
```

### 2. `toArray()` 완벽 가이드
스트림 끝에서 요소를 배열로 반환. 객체 배열과 원시 타입 배열의 사용법이 다르다.

**A. 객체 배열 (`String[]`, `Integer[]`)** — 생성자 참조(`클래스명[]::new`)를 넘긴다.

```java
List<String> list = Arrays.asList("A", "B", "C");
// Stream<String> -> String[]
String[] strArray = list.stream().toArray(String[]::new);
```

**B. 원시 타입 배열 (`int[]`, `long[]`, `double[]`)** — `Stream<Integer>`에서 바로 `.toArray()`하면 `Object[]`/`Integer[]`가 나온다. 순수 `int[]`는 **반드시 `mapToInt()`로 `IntStream` 변환 후 `.toArray()`**.

```java
List<Integer> intList = Arrays.asList(1, 2, 3);

// 에러! Object[]를 반환하므로 int[]에 담을 수 없음
// int[] wrongArr = intList.stream().toArray();

// 정답! mapToInt로 IntStream 변환 후 toArray() (파라미터 불필요)
int[] rightArr = intList.stream()
                        .mapToInt(Integer::intValue) // 혹은 i -> i
                        .toArray();
```

### 3. `flatMap` 심층 분석 (평탄화)
**`flatMap` = Flatten(평탄화) + Map(변환)**. 중첩 구조를 한 겹 벗겨 하나로 합친다.
- 비유: `map`은 상자들의 포장지만 바꾼다(여전히 '상자들'). `flatMap`은 상자를 모두 뜯어 '과일'만 하나의 바구니에 쏟는다.

```java
List<List<String>> nestedList = Arrays.asList(
    Arrays.asList("A", "B"),
    Arrays.asList("C", "D")
);

// 1. map: Stream<List<String>> (리스트 안에 리스트 유지)
nestedList.stream()
          .map(list -> list);
          // 결과: [["A", "B"], ["C", "D"]]

// 2. flatMap: Stream<String> (알맹이만 하나로 합침)
nestedList.stream()
          .flatMap(list -> list.stream()); // 내부 리스트를 스트림으로 만들어 평탄화
          // 결과: ["A", "B", "C", "D"]
```

장르별 Top 2 곡 리스트 여러 개를 하나의 결과 배열로 합칠 때처럼, 중첩 컬렉션을 펴야 할 때 유용.

### 4. `filter`와 `Predicate`
`filter`는 조건에 맞는 요소만 걸러내며, 조건식으로 `Predicate`(참/거짓 반환 함수형 인터페이스)를 받는다.

**A. 람다식 인라인 (가장 일반적)**

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

numbers.stream()
       .filter(n -> n % 2 == 0)          // 짝수 판별
       .forEach(System.out::println);    // 2, 4
```

**B. `Predicate` 변수 선언 (재사용·조합)**
조건이 복잡하거나 여러 곳에서 재사용할 때. `and()`, `or()`, `negate()`로 조합.

```java
Predicate<Song> isPopular = song -> song.playCount > 1000;
Predicate<Song> isClassic = song -> song.genre.equals("classic");

List<Song> result = songs.stream()
    // 조건 조합: "재생수 1000 초과 AND 클래식 장르"
    .filter(isPopular.and(isClassic))
    // "재생수가 1000 이하인 곡" → .filter(isPopular.negate())
    .collect(Collectors.toList());
```

명시적 선언 방식은 코드가 영어 문장처럼 읽혀 가독성이 크게 올라간다.

---
## 🔗 참고
- [(Algorithm) 자료구조 - 핵심 개념 및 특징 정리]([Algorithm]%20자료구조%20-%20핵심%20개념%20및%20특징%20정리.md) — HashMap 정렬(Comparator), Stream 변환 참고
- [(Algorithm) 시간복잡도 - 핵심 개념 및 특징 정리]([Algorithm]%20시간복잡도%20-%20핵심%20개념%20및%20특징%20정리.md) — 정렬/스트림 연산 복잡도

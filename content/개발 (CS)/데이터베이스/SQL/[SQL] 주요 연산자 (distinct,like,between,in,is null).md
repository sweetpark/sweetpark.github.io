---
title: "[SQL] 주요 연산자 (distinct,like,between,in,is null)"
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] 주요 연산자 (distinct,like,between,in,is null)

1. DISTINCT  
2. LIKE  
3. BETWEEN  
4. IN  
5. IS NULL / IS NOT NULL

## DISTINCT

*   중복된 값을 제거하고 고유한 값만 반환
*   **왜 필요한가**: 관계형 테이블은 같은 값을 가진 행이 여러 개 존재할 수 있다(예: 같은 이름의 회원이 여러 명). "값의 종류가 몇 가지인지" 또는 "중복 없이 목록만" 필요할 때, 애플리케이션 코드에서 중복 제거하는 대신 DB에 위임하면 네트워크로 전달되는 데이터 양도 줄고 코드도 간결해진다.

```sql
SELECT DISTINCT name FROM test;
```

예시 테이블 `test`:

| name | age | address | money |
| --- | --- | --- | --- |
| kim | 25 | 서울 | 15000 |
| park | 32 | 부산 | 22000 |
| na | 28 | 대구 | 18000 |
| park | 19 | 인천 | 9000 |
| lee | NULL | 서울 | 12000 |
| na | NULL | 광주 | 20000 |

실행 결과 (중복 제거된 name):

| name |
| --- |
| kim |
| park |
| na |
| lee |

## LIKE

*   패턴 일치를 찾아서 반환
    *   p% : p로 시작
    *   %p : p로 끝나는 문자
    *   n__%: n?? 로 시작하는 문자

| % | 0 개 이상 일치(정확한 길이 모름) |
| --- | --- |
| _ | 1 개 |
| __ | 2개 |
| _% | 1개 이상의 문자 (정확한 길이 모름) |

*   **왜 인덱스가 잘 안 먹히는가**: `LIKE '%p'`처럼 패턴 앞부분에 `%`가 오면 DB는 문자열을 앞에서부터 비교하는 인덱스(B-Tree)를 활용할 수 없어 테이블 전체를 스캔하게 된다. 반대로 `LIKE 'p%'`처럼 접두어가 고정된 경우에는 인덱스 탐색이 가능하다.

```sql
-- p로 시작하는 이름 조회
SELECT name FROM test WHERE name LIKE 'p%';
```

실행 결과 ('p'로 시작하는 name, 위 예시 테이블 기준):

| name |
| --- |
| park |
| park |

실행 결과: 'p'로 시작하는 이름을 가진 행만 조회되며, 조건에 맞지 않는 kim, na, lee 등은 제외된다.

## BETWEEN

*   두 값 사이에 해당하는 값 조회
*   **왜 필요한가**: `BETWEEN x AND y`는 `col >= x AND col <= y`의 축약형이며, 경계값(x, y) 자체를 포함하는 양 끝 포함(inclusive) 연산이다. 두 개의 비교 연산자를 조합하는 것보다 범위 조건임이 한눈에 드러나 가독성이 좋고, 날짜/숫자 범위 조회에서 자주 쓰인다.

```sql
SELECT name, age, address, money FROM test where age BETWEEN 10 AND 20 ORDER BY age DESC;
```

## IN

*   특정 값들 중에 하나와 일치하는지 조회
*   **왜 필요한가**: `name = 'park' OR name = 'na'`처럼 OR을 여러 번 나열하는 것과 동일한 결과지만, IN은 값 목록을 한눈에 보여줘 가독성이 좋고 값 개수가 많아져도 쿼리가 지저분해지지 않는다.

```sql
SELECT name, age, address, money FROM test where name IN ('park', 'na');
```

실행 결과 (name이 'park' 또는 'na'인 행):

| name | age | address | money |
| --- | --- | --- | --- |
| park | 32 | 부산 | 22000 |
| na | 28 | 대구 | 18000 |
| park | 19 | 인천 | 9000 |
| na | NULL | 광주 | 20000 |

## IS NULL / IS NOT NULL

*   NULL 여부에 따른 조회
*   **왜 `= NULL`이 아니라 `IS NULL`을 쓰는가**: NULL은 "값이 없음/알 수 없음"을 뜻하며 SQL의 3치 논리(TRUE/FALSE/UNKNOWN)에서 어떤 값과 비교해도 결과가 UNKNOWN이 된다. 즉 `age = NULL`은 항상 UNKNOWN으로 평가되어 결코 행을 반환하지 않는다. `IS NULL`/`IS NOT NULL`은 NULL 여부 자체를 검사하는 전용 연산자라 이 문제를 피할 수 있다.

```sql
SELECT DISTINCT name FROM test WHERE age IS NULL;

SELECT DISTINCT name FROM test WHERE age IS NOT NULL;
```

실행 결과 (age가 NULL인 name):

| name |
| --- |
| lee |
| na |

실행 결과 (age가 NULL이 아닌 name):

| name |
| --- |
| kim |
| park |
| na |

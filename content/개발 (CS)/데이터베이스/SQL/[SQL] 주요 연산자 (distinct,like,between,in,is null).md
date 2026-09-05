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

```sql
SELECT name, age, address, money FROM test where age BETWEEN 10 AND 20 ORDER BY age DESC;
```

## IN

*   특정 값들 중에 하나와 일치하는지 조회

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

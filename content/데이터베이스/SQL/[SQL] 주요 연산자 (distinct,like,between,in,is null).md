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

![](https://blog.kakaocdn.net/dna/QmZ3F/btsKdREsyQ1/AAAAAAAAAAAAAAAAAAAAAGGWJ1zMe_7x8g6bB26naNnsdmzgxBPmHki9i1wKqZiY/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=y%2BOZOQyglaUEV4NZ4AGJxRGXjWQ%3D)

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

![](https://blog.kakaocdn.net/dna/IVF8x/btsKdS4qf1p/AAAAAAAAAAAAAAAAAAAAAEk22qyBu416bsqTfmABSfepfJN7kbX2rwgDQyro3SCl/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=Bcp1Z2Z5Lc4sPms7acfzU1jhsRk%3D)

![](https://blog.kakaocdn.net/dna/I9eC0/btsKcgZJoIi/AAAAAAAAAAAAAAAAAAAAAKbCph4Jg0CkdA9YPQ1thxCftEiobLT_xFRVm52n9clp/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=qqUdYfCzahjBuKANtSjc7WHPODw%3D)

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

![](https://blog.kakaocdn.net/dna/XIY8a/btsKezi1EwZ/AAAAAAAAAAAAAAAAAAAAAKDCDq5qM5oMCQkokpv44bUKrQoG-E8-1mVW4p7a_59v/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=7N%2BHkqJks%2F4pZoKEjvaiISOyqHs%3D)

## IS NULL / IS NOT NULL

*   NULL 여부에 따른 조회

```sql
SELECT DISTINCT name FROM test WHERE age IS NULL;

SELECT DISTINCT name FROM test WHERE age IS NOT NULL;
```

![](https://blog.kakaocdn.net/dna/cUkCg3/btsKepAUAKJ/AAAAAAAAAAAAAAAAAAAAAKTJ65B19Y68ftgscKscW-aLwbZDJs8kVTNQ7ONAUf8c/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=qcO%2BxXY6%2Bc914KfO4GXLISgDGo8%3D)

> 원문: https://gradualprecision.tistory.com/130

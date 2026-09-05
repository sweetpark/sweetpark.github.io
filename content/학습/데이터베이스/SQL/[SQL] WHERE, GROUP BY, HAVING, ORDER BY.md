---
title: [SQL] WHERE, GROUP BY, HAVING, ORDER BY
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] WHERE, GROUP BY, HAVING, ORDER BY

1. WHERE 절  
2. GROUP BY 절  
3. HAVING 절  
4. ORDER BY 절  
4. 예제 종합

## WHERE 절

*   데이터를 그룹화 하기전에, 조건에 맞는 행을 필터링
*   select, update, delete 문에서 주로 사용
*   **집계함수 ( SUM, COUNT, AVG ) 와 함께 직접 사용 불가능 (그룹화 필요)  
    **

```sql
-- 나이가 20살 이상 조회 --
select * from member WHERE age > 20;
```

## GROUP BY 절

*   특정 열(column)의 값을 기준으로 그룹화 진행
*   **집계함수 (SUM, COUNT, AVG) 함께 사용 가능**
*   **집계함수로 설정된 열(column), 그룹화 된 column외의 직접 조회는 불가능하다**
*   **단, ANY_VALUE() / 서브쿼리 등을 사용하여 우회가 가능하긴하다** 

```sql
-- group by 쿼리 --
select age, MAX(money) From member GROUP BY age;

-- 부적절한 쿼리 --
-- name은 그룹화, 집계함수가 아닌 열이어서 같이 조회 불가능 --
select name, age, MAX(money) From member GROUP BY age;

-- 우회방법 --
select ANY_VALUE(name), age, MAX(MONEY) from test GROUP BY age;
```

![](https://blog.kakaocdn.net/dna/pSY61/btsKec9nSGb/AAAAAAAAAAAAAAAAAAAAAN7O4RLisH6oqmRnb5Ll9WRs4wPEJIQmEFCAz-GXp5dC/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=SqPSUHUCvcdP63FphDBvRQR7quo%3D)

## HAVING 절

*   GROUP BY 절 이후에, **그룹화된 결과에 조건**을 사용할 때 사용
*   집계함수와 같이 사용됨

```sql
-- having 절 --
select age, MAX(MONEY) from test group by age having MAX(MONEY) > 2000;
```

![](https://blog.kakaocdn.net/dna/bj4cFF/btsKdNvsjwI/AAAAAAAAAAAAAAAAAAAAABAt-nwGfloVu73_-8X974p68iEVARo-n3DpefCOGs9u/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=4c50YfWhIHtWi98UjR9jOkfKyuA%3D)

## ORDER BY 절

*   ORDER BY 절의 경우 **구문 맨마지막에 위치**
*   **오름차순(ASC), 내림차순(DESC) 정렬 가능**
*   **오름차순은 생략가능 (default값)**

```sql
-- 내림차순
select * from test order by name desc;

-- 오름차순
select * from test order by name;
```

## 예제 종합

*   주소가 수원인, 10대 그룹의 최대 돈 소유량 조회

```sql
SELECT age, MAX(MONEY) FROM test  WHERE address='suwon' GROUP BY age HAVING MAX(MONEY) > 1000 ORDER BY age DESC;
```

![](https://blog.kakaocdn.net/dna/ShpDi/btsKeyLap2c/AAAAAAAAAAAAAAAAAAAAAK12Wwn5AId3UwePWpdLxv6VRDtgl-YipCPYugdtrVqV/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=XwQoXMF1xHnO12xMYYTFtNrrhjE%3D)

> 원문: https://gradualprecision.tistory.com/129

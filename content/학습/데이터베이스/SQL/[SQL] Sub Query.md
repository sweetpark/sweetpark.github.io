---
title: [SQL] Sub Query
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] Sub Query

1. 서브쿼리?  
2. 서브쿼리 문법  
3. 예제

## 서브쿼리?

*   하나의 SQL 쿼리 내에서 다른 쿼리를 포함하는 구조
*   SELECT , UPDATE, DELTE 문에서 사용될 수 있다
*   조건문에서 주로 사용됨
*   서브쿼리는 **단일행 / 다중행 서브쿼리**가 있다
    *   단일행 : 하나의 값을 반환
    *   다중행 : 여러 값을 반환

## 서브쿼리 문법

*   SELECT 서브쿼리

```sql
SELECT [column1] FROM [table1] WHERE column1 = (SELECT [column2] FROM [table2] WHERE [조건]);
```

*   INSERT 서브쿼리

```sql
INSERT INTO [table1] [(column1)] SELECT [column2] FROM [table2] WHERE [조건];
```

*   UPDATE 서브쿼리

```sql
UPDATE [table1] SET [column1] = (SELECT [column2] FROM [table2] WHERE [조건]) WHERE [조건]
```

*   DELETE 서브쿼리

```sql
DELETE FROM [table1] WHERE [column1] = (SELECT [column2] FROM [table2] WHERE [조건]);
```

## 예제

*   SELECT 서브쿼리
    *   단일행 : "where sub_id =  (서브쿼리)", 여기서 서브쿼리 결과값이 한개만 나와야함
    *   다중행 : "where sub_id IN (서브쿼리)", 여기서 서브쿼리 결과값이 다중으로 나와도 됨

```sql
-- 단일행
SELECT * FROM ex_table1 WHERE sub_id = (SELECT id FROM ex_table2 WHERE sub_name IN('group1'));
-- 다중행
SELECT * FROM ex_table1 WHERE sub_id IN (SELECT id FROM ex_table2 WHERE sub_name IN('group1', 'group2'));
```

![](https://blog.kakaocdn.net/dna/cHPRj2/btsKfeeoK2P/AAAAAAAAAAAAAAAAAAAAAJSG8uymjoTBGle-Q5cuor0OWOyrV3TL_BQiFIPesbu8/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=%2BNSbwUW9rDj%2BNOlINCIOYD4mjoQ%3D)

*   INSERT 서브쿼리

```sql
-- 단일행
INSERT INTO insert_test (name) SELECT name FROM ex_table1 WHERE sub_id = (SELECT id FROM ex_table2 WHERE sub_name='group3');

-- 다중행
INSERT INTO insert_test (name) SELECT name FROM ex_table1 WHERE sub_id IN (SELECT id FROM ex_table2 WHERE sub_name IN('group1', 'group2'));

select * from insert_test;
```

![](https://blog.kakaocdn.net/dna/cVXyLW/btsKefSWsnO/AAAAAAAAAAAAAAAAAAAAAAmieD5eT1bi0mRaiwLXFUfqYu-BcHrO5XvMLx5ZpXjM/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=859xCswNrSAZ%2FYlrhz9rzGcBRgc%3D)

*   UPDATE 서브쿼리

```sql
UPDATE ex_table1 SET sub_id = (SELECT id FROM ex_table2 WHERE sub_name = 'group3') WHERE name='testA';
```

![](https://blog.kakaocdn.net/dna/9vpxB/btsKdSKr8r2/AAAAAAAAAAAAAAAAAAAAAL-2D4r4kH3c3yFdACLjBElI3PdhOfICxLSF20QcEK0s/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=QjPRoTSHjRYbh4vV3E6Hv6cdyx8%3D)

*   DELETE 서브쿼리

```sql
DELETE FROM ex_table1 WHERE sub_id = (SELECT id FROM ex_table2 WHERE sub_name = 'group3');
```

![](https://blog.kakaocdn.net/dna/b71alf/btsKduiV9z9/AAAAAAAAAAAAAAAAAAAAAPKDHGvxqXisWoSJnBXPsboGRky_QuOmxW_SSDWMxBg_/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=Mz1j%2Fmb2F8Zwz4boZm8EzsKZ7t0%3D)

> 원문: https://gradualprecision.tistory.com/132

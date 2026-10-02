---
title: "[SQL] Sub Query"
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
*   **왜 JOIN 대신 쓰기도 하는가**: 서브쿼리는 "이 값이 존재하는지/조건을 만족하는지"를 논리적으로 표현하기 쉬워 가독성이 좋을 때가 많다. 다만 SELECT 절이나 WHERE 절에 들어간 서브쿼리는 (옵티마이저가 최적화하지 못하면) 바깥 쿼리의 각 행마다 반복 실행될 수 있어 JOIN보다 느릴 수 있다. 결과 자체가 같다면 실행계획을 비교해 JOIN으로 바꾸는 것이 성능상 유리한 경우가 많다.
*   SELECT , UPDATE, DELTE 문에서 사용될 수 있다
*   조건문에서 주로 사용됨
*   서브쿼리는 **단일행 / 다중행 서브쿼리**가 있다
    *   단일행 : 하나의 값을 반환
    *   다중행 : 여러 값을 반환
*   **왜 구분이 중요한가**: `=`, `>`, `<` 같은 비교 연산자는 정확히 하나의 값과 비교해야 하므로, 서브쿼리가 실행 시점에 2개 이상의 행을 반환하면 "single-row subquery returns more than one row" 같은 런타임 오류가 난다. 반대로 `IN`, `ANY`, `ALL`은 여러 값을 받아들이도록 설계된 연산자라 다중행 서브쿼리와 함께 쓴다. 즉 연산자 선택은 서브쿼리가 몇 개의 값을 반환할지에 달려 있다.

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

예시 테이블:

`ex_table2` (id, sub_name)

| id | sub_name |
| --- | --- |
| 1 | group1 |
| 2 | group2 |
| 3 | group3 |

`ex_table1` (sub_id, name)

| sub_id | name |
| --- | --- |
| 1 | testA |
| 1 | testB |
| 2 | testC |
| 3 | testD |

실행 결과 (다중행 서브쿼리, sub_name이 'group1' 또는 'group2'인 id는 1, 2이므로 sub_id가 1 또는 2인 행 반환):

| sub_id | name |
| --- | --- |
| 1 | testA |
| 1 | testB |
| 2 | testC |

*   INSERT 서브쿼리

```sql
-- 단일행
INSERT INTO insert_test (name) SELECT name FROM ex_table1 WHERE sub_id = (SELECT id FROM ex_table2 WHERE sub_name='group3');

-- 다중행
INSERT INTO insert_test (name) SELECT name FROM ex_table1 WHERE sub_id IN (SELECT id FROM ex_table2 WHERE sub_name IN('group1', 'group2'));

select * from insert_test;
```

실행 결과 (`insert_test` 최종 데이터, 단일행 삽입으로 group3에 해당하는 testD가 먼저 들어가고, 다중행 삽입으로 group1/group2에 해당하는 testA·testB·testC가 이어서 들어감):

| name |
| --- |
| testD |
| testA |
| testB |
| testC |

*   UPDATE 서브쿼리

```sql
UPDATE ex_table1 SET sub_id = (SELECT id FROM ex_table2 WHERE sub_name = 'group3') WHERE name='testA';
```

실행 결과 (`ex_table1`, group3의 id인 3으로 testA의 sub_id가 변경됨):

| sub_id | name |
| --- | --- |
| 3 | testA |
| 1 | testB |
| 2 | testC |
| 3 | testD |

*   DELETE 서브쿼리

```sql
DELETE FROM ex_table1 WHERE sub_id = (SELECT id FROM ex_table2 WHERE sub_name = 'group3');
```

실행 결과 (`ex_table1`, group3의 id인 3에 해당하는 sub_id=3 행(testD)이 삭제되고 남은 데이터):

| sub_id | name |
| --- | --- |
| 1 | testA |
| 1 | testB |
| 2 | testC |

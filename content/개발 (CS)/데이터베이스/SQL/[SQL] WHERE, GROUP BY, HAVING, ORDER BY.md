---
title: "[SQL] WHERE, GROUP BY, HAVING, ORDER BY"
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

예시 테이블 `test`:

| name | age | address | money |
| --- | --- | --- | --- |
| kim | 15 | suwon | 1500 |
| park | 15 | suwon | 3000 |
| lee | 22 | seoul | 5000 |
| na | 19 | busan | 1800 |
| choi | 19 | suwon | 1500 |

실행 결과 (age로 그룹화):

| name | age | MAX(money) |
| --- | --- | --- |
| kim | 15 | 3000 |
| lee | 22 | 5000 |
| na | 19 | 1800 |

## HAVING 절

*   GROUP BY 절 이후에, **그룹화된 결과에 조건**을 사용할 때 사용
*   집계함수와 같이 사용됨

```sql
-- having 절 --
select age, MAX(MONEY) from test group by age having MAX(MONEY) > 2000;
```

실행 결과 (그룹화 후 MAX(money) > 2000인 그룹만, 위 예시 테이블 기준 age=19 그룹은 최대값이 1800이라 제외):

| age | MAX(money) |
| --- | --- |
| 15 | 3000 |
| 22 | 5000 |

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

실행 결과 (address가 'suwon'인 행만 대상으로 age별 그룹화 후 age 내림차순 정렬, 위 예시 테이블 기준):

| age | MAX(money) |
| --- | --- |
| 19 | 1500 |
| 15 | 3000 |

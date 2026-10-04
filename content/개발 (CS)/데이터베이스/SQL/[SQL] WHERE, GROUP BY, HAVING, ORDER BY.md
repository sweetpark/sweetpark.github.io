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
*   **왜 안 되는가**: SQL의 논리적 실행 순서상 WHERE는 FROM 직후, 즉 그룹화(GROUP BY)와 집계 연산이 일어나기 *전에* 각 행 단위로 평가된다. 그 시점에는 아직 "그룹"이라는 개념 자체가 존재하지 않으므로 그룹 단위 집계값을 참조할 수 없다. 그룹화된 결과에 조건을 걸고 싶다면 HAVING을 써야 한다.

```sql
-- 나이가 20살 이상 조회 --
select * from member WHERE age > 20;
```

## GROUP BY 절

*   특정 열(column)의 값을 기준으로 그룹화 진행
*   **집계함수 (SUM, COUNT, AVG) 함께 사용 가능**
*   **집계함수로 설정된 열(column), 그룹화 된 column외의 직접 조회는 불가능하다**
*   **단, ANY_VALUE() / 서브쿼리 등을 사용하여 우회가 가능하긴하다** 
*   **왜 안 되는가**: GROUP BY는 여러 행을 하나의 그룹(하나의 결과 행)으로 압축한다. 그룹화 기준 컬럼이 아닌 다른 컬럼은 그룹 안에서 여러 값이 섞여 있을 수 있어, DB 입장에서는 "그 그룹을 대표하는 값 하나"를 결정할 근거가 없다. 그래서 표준 SQL은 GROUP BY 컬럼이거나 집계함수로 감싼 컬럼만 SELECT에 허용한다. (MySQL은 `ONLY_FULL_GROUP_BY`가 꺼져 있으면 예외적으로 허용하고 그룹 내 임의의 값을 반환하는데, 이는 표준을 벗어난 MySQL만의 완화된 동작이다.)

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
*   **왜 WHERE와 별도로 존재하는가**: SQL의 논리적 실행 순서는 `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY`다. WHERE는 그룹화 이전 개별 행을 걸러내고, HAVING은 그룹화·집계가 끝난 *이후의 그룹*을 걸러낸다. "그룹별 최대값이 2000을 넘는 그룹만" 같은 조건은 그룹이 만들어지기 전에는 평가할 수 없으므로 WHERE로는 표현이 불가능하고 HAVING이 필요하다.

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
*   **왜 맨 마지막에 위치하는가**: 정렬은 최종적으로 반환될 결과 집합(SELECT로 뽑아낸 컬럼, GROUP BY/HAVING까지 거친 결과)에 대해 적용되는 게 자연스럽기 때문이다. WHERE/GROUP BY/HAVING으로 대상 행과 그룹을 먼저 확정한 뒤에야 "무엇을 기준으로 어떤 순서로 보여줄지"를 정할 수 있다.

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

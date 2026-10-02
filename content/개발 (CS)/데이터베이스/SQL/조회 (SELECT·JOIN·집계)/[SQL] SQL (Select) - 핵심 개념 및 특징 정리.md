---
title: "SQL (Select)"
tags: [학습, 개발-CS, 데이터베이스, 개발, SQL, GroupBy, Oracle]
modified: 2026-09-05
---

# SQL (Select)

## 오전수업

### 문장으로 정의

1. 키워드를 생각
2. 키워드로 문장완성

### select 절이란?

- 키워드
    - DML
    - 튜플
- 문장
    - select절이란? DML언어로서 튜플을 조회하는 명령어이다 (조건과 원하는 컬럼값을 선택할 수 있다)

> [!NOTE]
> select : 컬럼선택 (4)
> 
> from : 대상 테이블 (1)
> 
> where : 튜플선정 조건 (2)
> 
> group by : (3)
> 
> order by :정렬 (5)

```jsx
//1. 3학년의 이름을 모두 출력
select name from m where 학년=3;

//2. 3학년은 모두 몇명?
select count(*) from m where 학년=3;

//3. 학년별 인원수는?

```

### 함수

> [!NOTE]
> 함수란?
> 
> - 특정기능을 수행하여 결과를 리턴
> - 입력값을 통한 특정기능을 수행하여 결과를 제공

- 집계함수
    - 튜플의 개수를 집계하는 함수
- 

### 오전과제

> [!TIP] 스키마 및 DB 엔진 참고
> 아래 예제는 `hm08`이라는 학생 테이블을 대상으로 한다(CREATE TABLE 문은 제공되지 않았으나, 사용된 컬럼으로 미루어 `num`은 학번(앞자리가 학년을 의미), `name`은 이름, `age`는 나이, `grade`는 학년으로 구성된 테이블로 추정된다). 이 노트는 태그에 명시된 대로 Oracle 실습 환경 기준이다.

> [!NOTE]
> 3학년을 모두 출력하시오
> 
> select *
> 
> from hm08
> 
> where substr(num, 1,1) ='3'
> 
> group by (x)
> 
> order by (x)

> [!NOTE]
> 모든 학생의 연령을 출력하되, 이름과 나이의 첫 글자만 출력하시오.
> 
> 나이의 뒤에는 0을 붙여 출력해주세요.
> 
> select name, concat(substr(age,1,1), '0') as age
> 
> from hm08
> 
> where age >10
> 
> group by (x)
> 
> order by (x)
> 
> 답)  select name,concat(substr(age,1,1),'0') as age from hm08 where age > 10;

> [!NOTE]
> 40대만 출력하시오.
> 
> 40대란 40세이상 49이하
> 
> select *
> 
> from hm08
> 
> where age between 40 and 49;
> 
> 답) select * from hm08 where age between 40 and 49;

### Group by 수업

> [!NOTE]
> 1. 2학년은 모두 몇명입니까?
>     1. 해결 방법 : 2학년 튜플만 선택하여 카운팅
>     2. select * from hm08 where substr(num,1,1) ='2';
> 2. 2학년의 최고나이는?
>     1. 해결방법 : 2학년 튜플만 선택한 후 최고점을 찾는다.
>     2. select max(age) from hm08 where substr(num,1,1)='2';
>     3. **집계함수는  결과튜플이 1개이다.. (매우중요)**
> 3. 2학년에서 최고나이 사람은 누구입니까?
>     1. 해결방법 : 쿼리문 하나로는 해결불가..
>     2.  select name from hm08 where age = (select max(age) as age from hm08 where substr(num,1,1) = '2');
>     3. 중요팁은.. 해결한 결과가 아니라.. 집계함수, 그룹은 결과값을 하나로 취급한다..(매우 중요)
> 4. 1학년과 2학년은 각각 몇명입니까?
>     1. 해결방법 : 1학년 튜플과 2학년 튜플만 선택한 후 grade 기준으로 묶어서 카운팅
>     2. select grade, count(*) from hm08 where grade='1' or grade='2' group by grade order by grade asc;
> 5. 학년별 인원수는?
>     1. 해결방법 : 모든 튜플을 grade기준으로 묶어서 카운팅
>     2. select grade, count(*) from hm08 group by grade order by grade asc;
> 6. 학년별 인원수를 구하시오. 이때 인원수가 2명 이상인 학년만 출력
>     1. select grade, count(*)
>     2. from hm08
>     3. group by grade
>     4. having count(*) ≥2
> 7. 학년별 평균 나이를 출력하시오
>     1. select grade, avg(age)
>     2. from hm08
>     3. group by grade
> 8. 학년별 평균나이를 출력하되, 평균나이가 30세 이상인 학년과 평균나이출력
>     1. select grade, avg(age)
>     2. from hm08
>     3. group by grade
>     4. having avg(age)≥30
> 9. 학년별 평균나이, 가장많은 나이, 나이의 합계, 학년을 출력하세요
>     1. select avg(age), max(age), sum(age), grade
>     2. from hm08
>     3. group by grade

> [!TIP] 왜 "집계함수는 결과튜플이 1개"인가
> COUNT/MAX/AVG 같은 집계함수는 여러 행을 하나의 값으로 압축(reduce)하는 연산이다. 그래서 집계값과 개별 행의 다른 컬럼(예: 위 3번 문제의 `name`)을 같은 SELECT에서 함께 조회할 수 없다. "2학년 중 최고 나이인 사람의 이름"을 구하려면 한 번의 쿼리로는 안 되고, 먼저 서브쿼리로 최고 나이(집계값 1개)를 구한 뒤 그 값과 일치하는 행을 다시 조회하는 2단계가 필요한 이유가 여기에 있다. 또한 6, 8번처럼 그룹화 이후의 집계값(`count(*)`, `avg(age)`)에 조건을 걸 때 `WHERE`가 아닌 `HAVING`을 쓰는 이유도 같은 맥락으로, 그룹이 만들어지기 전에는 아직 집계값 자체가 존재하지 않기 때문이다.

> [!NOTE]
> group by?
> 
> - group by를 정리하는 키워드는 그룹과 집계이다.
> - 그룹을 하나로 묶어서 집계하여 하나의 결과값으로 분석
> - 집계함수의 경우 튜플이 한개만 존재

- 공부방법
    - 먼저 select 각 절의 의미를 이해
    - 두번째, select 절의 실행순서를 이해 ( from → where → group by → having → select → order by)
    - 세번째, 함수가 필요한지 판단 (함수를 공부할때는 함수의 기능, x값, y값을 분석한 후 함수를 쿼리에 적용)

---
title: "Select, where, group, order by"
tags: [학습, 개발-CS, 데이터베이스, 개발, SQL, JOIN, Oracle]
modified: 2026-09-05
---

# Select, where, group, order by

## 오전수업

> [!NOTE]
> select 컬럼선택 → 서브쿼리 (== 스칼라 서브쿼리)
> 
> from 대상테이블 → 서브쿼리 (== 인라인뷰 서브쿼리)
> 
> where 튜플 조건 → 서브쿼리
> 
> group by 컬럼 그룹 → 서브쿼리
> 
> order by 컬럼 정렬

- 서브쿼리를 where / select 컬럼에 쓰면 튜플조회만큼 select쿼리가 조회된다 (성능에 좋지 못함 → join 사용)

- JOIN의 종류

> [!NOTE]
> Full Join
> 
> - 모두다 조인 (N*M)
> - 현업에서는 사용하면 안됨 (너무많은 튜플이 조회될수있음)
> 
> Inner Join
> 
> - 동등 이너 조인 (같은 정보를 기준으로 묶은 조인)
> - 비동등 이너 조인 (다른정보를 기준으로 묶은 조인)
> 
> ```jsx
> //inner join 방법1
> select * from buser, exam 
> where buser.id = exam.id
> 
> //inner join 방법2
> select * from buser b
> inner join exam e
> on b.id = e.id
> ```
> 
> Outer Join
> 
> (이너조인 결과값에 조인에 참여하지 않은 튜플의 정보까지 표현
> 
> 참여하지 않은 튜플의 값은 null로 채워짐 )
> 
> - full : 왼쪽 오른쪽 기준으로 빈값은 null로 채우고 전부 표현
> - left : 테이블 왼쪽기준으로 왼쪽 튜플은 전부 나오고 나머지 컬럼의 값은 null
> - right : left 반대
> 
> ```jsx
> //outer join(left)
> select * from buser
> left outer join exam
> on buser.id = exam.id
> 
> //outer join (right)
> select * from buser
> right outer join exam
> on buser.id = exam.id
> 
> //full outer join
> select * from buser
> full outer join exam
> on buser.id = exam.id
> ```

## 오전과제

```jsx
/*

SQL> create table buser(
  2  id varchar2(4),
  3  name varchar2(5));

테이블이 생성되었습니다.

SQL>
SQL>
SQL> insert into buser values ('a', 'kim');

1 개의 행이 만들어졌습니다.

SQL> insert into buser values ('b', 'lee');

1 개의 행이 만들어졌습니다.

SQL> insert into buser values ('c', 'choi');

1 개의 행이 만들어졌습니다.

SQL>
SQL> create table exam(
  2  id varchar2(4),
  3  name varchar2(4),
  4  point number(3));

테이블이 생성되었습니다.

SQL>
SQL> insert into exam values ('a', 'java', 98);

1 개의 행이 만들어졌습니다.

SQL> insert into exam values ('b', 'java', 88);

1 개의 행이 만들어졌습니다.

SQL> insert into exam values ('b', 'db', 78);

1 개의 행이 만들어졌습니다.

SQL> insert into exam values ('d', 'java', 78);

*/

// 모든 학생들의 이름, 과목, 점수를 출력하시오
select buser.name,exam.name, exam.point
from buser
left outer join exam
on exam.id = buser.id;

// 자바 시험을 본 학생의 이름, 과목, 점수를 출력하시오
select buser.name, exam.name, exam.point
from buser,exam
where buser.id = exam.id and exam.name = 'java';

// 시험을 한 번도 치루지 않은 학생의 이름과 아이디를 출력하시오
select buser.name, buser.id
from buser
left outer join exam
on buser.id = exam.id
where exam.name is null;

// 시험점수는 있지만, 학생의 정보가 없는 정보를 출력하시오
select buser.name ,exam.id, exam.name, exam.point
from buser
right outer join exam
on buser.id = exam.id
where buser.name is null;

// lee라는 학생의 시험 결과를 출력하시오. (이름, 과목, 점수)
select buser.name, exam.name,  exam.point
from buser
inner join exam
on exam.id = buser.id
where buser.name = 'lee';
```

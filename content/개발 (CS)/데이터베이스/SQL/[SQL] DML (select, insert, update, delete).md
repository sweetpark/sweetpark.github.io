---
title: "[SQL] DML (select, insert, update, delete)"
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] DML (select, insert, update, delete)

1. 데이터 관리(CRUD)  
2. Select  
3. Insert  
4. Update  
5. Delete

## 데이터 관리

*   CRUD 방식을 이용하여 데이터를 관리하게 된다
    *   Create : 생성
    *   Read : 읽기
    *   Update : 수정
    *   Delete : 삭제
*   해당 데이터를 관리하기 위해 사용되는 SQL은 DML 이라고 불리며, 데이터를 관리하게 된다

DML 이란?  
  
- Data Manipulation Language : 데이터 조작 언어  
- DB의 데이터를 생성/ 조회 / 갱신 / 삭제 하는 언어를 의미함

## SELECT

*   데이터를 조회하는 역할
*   CRUD 중에 "Read"에 해당하는 부분

[문법]  
  
Select [컬럼],[컬럼2]... from [테이블명];  
  
*참고) [컬럼]을 대신해서 "*"으로 사용할경우, 모든 컬럼을 의미  
ex) select * from member;

예시 테이블 `member` (id, money):

| id | money |
| --- | --- |
| 1 | 1000 |
| 2 | 2000 |
| 3 | 1500 |

실행 결과: 위와 같이 `member` 테이블의 모든 컬럼과 행이 조회됨.

## INSERT

*   데이터 추가 (행 추가)
*   CRUD 중에 "Create"에 해당

[문법]  
  
Insert Into [테이블명]( [필드이름1], [필드이름2], ...) Values ( [데이터값1], [데이터값2],...)  
  
*참고) 필드이름의 경우 생략될 수 있다 ( 순서대로 Values가 적용됨 )  
insert into member values(1, 1000);

실행 결과 (`member` 테이블에 (id=1, money=1000) 행이 새로 추가됨):

| id | money |
| --- | --- |
| 2 | 2000 |
| 3 | 1500 |
| 1 | 1000 |

## UPDATE

*   데이터 수정
*   CRUD 중에 "Update"에 해당

[문법]  
  
Update [ 테이블명 ] set [열] = [변경할값] where [조건]  
  
*참고) 조건이 없는 경우, 테이블에 있는 전체 열을 전부 수정

ex) update member set money = 5000 where id = 1;

실행 결과 (id가 1인 행의 money만 변경됨):

| id | money |
| --- | --- |
| 1 | 5000 |
| 2 | 2000 |
| 3 | 1500 |

## DELETE

*   데이터 삭제
*   CRUD 중에 "Delete"에 해당

[문법]  
  
delete from [테이블명] where [조건]  
  
*참고) where 조건절이 없을 경우, 해당 테이블 모든 데이터 삭제

ex) delete from member where id = 1;

실행 결과 (id가 1인 행이 삭제되고 남은 데이터):

| id | money |
| --- | --- |
| 2 | 2000 |
| 3 | 1500 |

> 원문: https://gradualprecision.tistory.com/121

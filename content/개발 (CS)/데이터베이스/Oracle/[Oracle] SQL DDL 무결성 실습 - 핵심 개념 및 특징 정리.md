---
title: "SQL DDL 무결성 실습"
tags: [학습, 개발-CS, 데이터베이스, 개발, DDL, DML, DCL, 무결성, Oracle]
modified: 2026-09-05
---

# SQL DDL 무결성 실습

> [!NOTE]
> 재고관리(자동차 정비) 미니 프로젝트 과제 중 DDL/제약조건/무결성 검증 실습만 정리한 노트.
> 팀 프로젝트 발표 대본 등 활동 관련 서술은 원본 노트(대외활동/휴먼아카데미)에 남겨두었다.

> [!TIP] DB 엔진
> `ORA-00001`, `ORA-02291` 등 오류 코드와 `varchar2`, `sequence`, `sysdate` 사용으로 미루어 Oracle SQL*Plus 환경이다.

## 오전과제 — 테이블 생성 및 무결성 테스트

```jsx
create table car(
   car_id number(3) primary key,
   car_type varchar2(100),
   enroll_date timestamp default sysdate
   );

  insert into car values (3, '대형차', default);
  insert into car values (2, '소형차', default);
  insert into car values (1, '중형차', default);
  insert into car values (1, '중형차', default);
  /*
  개체무결성
  insert into car values (1, '중형차', default)
*
1행에 오류:
ORA-00001: 무결성 제약 조건(SYSTEM.SYS_C0011203)에 위배됩니다
  */
  insert into car values (1, '안녕하세요 나는 50자가 넘습니다.안녕하세요 나는 50자가 넘습니다.안녕하세요 나는 50자가 넘습니다.안녕하세요 나는 50자가 넘습니다.안녕하세요 나는 50자가 넘습니다. 감사합니다.', default);
  /*
  도메인 무결성
  1행에 오류:
ORA-12899: "SYSTEM"."CAR"."CAR_TYPE" 열에 대한 값이 너무 큼(실제: 172, 최대값:
100)
*/


 create table customer(
    customer_id number(3) primary key,
    name varchar2(20) not null,
    enroll_date timestamp default sysdate,
    point number(9) default 100
  );

  insert into customer values (2, 'hong', default, default);
  insert into customer values (1, 'park', default, default);
  select * from customer;
  /*
  CUSTOMER_ID NAME
----------- --------------------
ENROLL_DATE
---------------------------------------------------------------------------
     POINT
----------
          1 park
25/01/07 12:36:26.000000
       100
       */

  insert into customer values (1, 'kim' , default, default);
  /*
  개체 무결성
  1행에 오류:
ORA-00001: 무결성 제약 조건(SYSTEM.SYS_C0011205)에 위배됩니다
  */

  insert into customer values (2, '' , default, default);
  /*
  도메인 무결성
  1행에 오류:
ORA-01400: NULL을 ("SYSTEM"."CUSTOMER"."NAME") 안에 삽입할 수 없습니다
  */

  create table repair(
     repair_id number(3) primary key,
     car_id number(3),
     repair_date timestamp default sysdate,
     message varchar2(100),
     money number(9),
     foreign key (car_id) references car(car_id)
   );

  insert into repair values (1, 1,default, 'repair car', 1000);
  // 개체무결성
  insert into repair values (1, 1,default, 'repair car', 1000);
  // 참조무결성
  insert into repair values (2, 10,default, 'repair car', 1000);
  //도메인무결성
  insert into repair values (2, 10,default, '일부로오류를내겠습니다일부로오류를내겠습니다일부로오류를내겠습니다일부로오류를내겠습니다일부로오류를내겠습니다일부로오류를내겠습니다일부로오류를내겠습니다일부로오류를내겠습니다일부로오류를내겠습니다일부로오류를내겠습니다...', 1000);


 create table enroll(
    enroll_id number(3) primary key,
    customer_id number(3),
    car_id number(3),
    foreign key (customer_id) references customer(customer_id),
    foreign key (car_id) references car(car_id)
 );

 insert into enroll values(1, 1, 1);
 //개체무결성
 insert into enroll values (1,1,1);
 /*
 1행에 오류:
ORA-00001: 무결성 제약 조건(SYSTEM.SYS_C0011208)에 위배됩니다
 */
 insert into enroll values (2, 1,1);
 insert into enroll values (3, 2, 1);
 //참조무결성
 insert into enroll values (5, 2,4);
 /*
 1행에 오류:
ORA-02291: 무결성 제약조건(SYSTEM.SYS_C0011210)이 위배되었습니다- 부모 키가
없습니다
*/

insert into enroll values (6, 5,1);
 /*
 *
1행에 오류:
ORA-02291: 무결성 제약조건(SYSTEM.SYS_C0011209)이 위배되었습니다- 부모 키가
없습니다
*/


 insert into enroll values (1000, 1,1);

```

## 오후수업 — DDL / DML / DCL 및 Select 절 순서

- DDL
    - 데이터 정의어
    - create / alter/ drop
- DML
    - 데이터 조작어
    - insert / select / update /delete
- DCL
    - 데이터 제어어
    - commit / rollback

### Select

- select 절

    ```jsx
    select from where [group by (having) /order by]
    // selelct 컬럼선택 (4)
    // from 대상테이블 (1)
    // where 튜플선정조건 (2)
    // group by (having) (3)
    // order by 정렬(컬럼기준) (5)
    ```

- 나이의 40미만의 사람의 정보를 출력하되, 나이 30세미만의 경우 해당없음으로 출력하라
    - 나이 30세 미만의 경우 → select 절의 조건문 (컬럼선택영역) → case 문 or …

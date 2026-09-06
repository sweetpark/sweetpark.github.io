---
title: "데이터베이스 정규화"
tags: [학습, 개발-CS, 데이터베이스, 개발, 정규화, ERD, Oracle]
modified: 2026-09-05
---

# 데이터베이스 정규화

Oracle 실습 수업에서 정리한 노트로, 정규화를 하는 이유(무결성 보장, 이상현상 방지)와 요구사항→ERD→테이블 설계 흐름을 정리하고, 관리자·리뷰·상품·회원 테이블로 구성된 미니 프로젝트로 개체/도메인 무결성 위반 사례를 직접 검증한다.

> [!TIP] DB 엔진
> 아래 SQL은 Oracle 문법 기준이다 (`varchar2`, `number`). MySQL/PostgreSQL에서는 각각 `VARCHAR`, `VARCHAR`+`NUMERIC` 등으로 타입 표기가 다르다.

## 오전수업

- 관계형 데이터베이스
    - 관계 : 개체와 개체의 관계
    - 데이터베이스 : 데이터 저장 (튜플단위)
- 개체와 개체 관계를 하는 이유?
    - 개체들간의 관계를 정의해서 릴레이션을 구성하여 정규화를 구성하기위해서
- 정규화를 하는이유?
    - DB의 무결성을 보장하기위해
    - 무결성 → 데이터 중복 방지 (이상현상 방지 → 삽입/삭제/갱신이상)
- 요구사항 → ERD → 테이블 유추 → 테이블 구성
- 테이블 구성
    - 컬럼명
    - 속성
    - 제약조건
        - 제약조건 : 키, unique, not null, check 를 사용하여 속성값에 제약을줌

### 미니프로젝트 진행

- 개발동기

- 관리자 테이블

```sql
create table Admin(
    A_id number(3) primary key,
    A_password varchar2(48) not null,
    A_name varchar2(10) not null,
    A_addr varchar2(100) not null,
    A_phone varchar2(13) not null
 );
    
```

- 등록 및 수정

```sql
create table Review_manage(
    RM_id number(3) primary key,
	  R_id number(3),
	  U_id varchar2(12),
	  P_id number(6),
	  constraint Review_FK foreign key (R_id) references Review(R_id),
	  constraint User1_FK foreign key (U_id) references User1(U_id),
	  constraint Product_FK foreign key (P_id) references Product(P_id)
);

```

```sql
//Reviwe 내용

// Admin 기본 데이터
insert into Admin values ('1', '1111' , 'seoul', 'admin_name1', '010-1111-2222');
insert into Admin values ('2', '2222' , 'suwon', 'admin_name2', '010-1212-2222');
insert into Admin values ('3', '3333' , 'busan', 'admin_name3', '010-2222-3333');
insert into Admin values ('4', '4444' , 'gangwon', 'admin_name4', '010-3333-4444');

 //Product 데이터 
insert into Product values(1, '손 세정제', '화장품', 20);
insert into Product values(2, '핸드크림', '화장품', 15);
insert into Product values(3, '마요네즈', '식품', 30);
insert into Product values(4, '캠핑 의자', '취미물품', 3);

// User1
insert into User1 values ('test1', '1111', 25, '01011112222', 'seoul',  '남자');
insert into User1 values ('test2', '2222', 35, '01011113333', 'suwon',  '여자');
insert into User1 values ('test3', '3333', 21, '01044442222', 'seoul',  '여자');
insert into User1 values ('test4', '4444', 23, '01033332222', 'busan',  '남자');

//Review
insert into review value('001', '정말 맛있어요', '1', 'test1');
 insert into review value('002', '제품이 튼튼해요', '2', 'test2');
 insert into review value('003', '엥 이건 좀 별로;;', '3', 'test3');
 insert into review value('004', '개꿀 맛도리 존맛탱구리', '4', 'test4');

//Enroll
insert into Enroll value('1', '1', '1'); 
insert into Enroll value('2', '2', '2'); 
insert into Enroll value('3', '3', '3');
insert into Enroll value('4', '4', '4');

```

```sql
//개체 무결성 체크
SQL> insert into Admin values ('', '1234','name', 'seoul', '010-2222-3333');
insert into Admin values ('', '1234','name', 'seoul', '010-2222-3333')
                          *
1행에 오류:
ORA-01400: NULL을 ("SYSTEM"."ADMIN"."A_ID") 안에 삽입할 수 없습니다

//도메인 무결성 체크
SQL> insert into Admin values ('', '1234','name', 'seoul', '010-2222-3333');
insert into Admin values ('', '1234','name', 'seoul', '010-2222-3333')
                          *
1행에 오류:
ORA-01400: NULL을 ("SYSTEM"."ADMIN"."A_ID") 안에 삽입할 수 없습니다

SQL> insert into Admin values (10, '','name', 'seoul', '010-2222-3333');
insert into Admin values (10, '','name', 'seoul', '010-2222-3333')
                              *
1행에 오류:
ORA-01400: NULL을 ("SYSTEM"."ADMIN"."A_PASSWORD") 안에 삽입할 수 없습니다

SQL> insert into Admin values (11, '1234','', 'seoul', '010-2222-3333');
insert into Admin values (11, '1234','', 'seoul', '010-2222-3333')
                                     *
1행에 오류:
ORA-01400: NULL을 ("SYSTEM"."ADMIN"."A_NAME") 안에 삽입할 수 없습니다

SQL> insert into Admin values (12, '1234','name', '', '010-2222-3333');
insert into Admin values (12, '1234','name', '', '010-2222-3333')
                                             *
1행에 오류:
ORA-01400: NULL을 ("SYSTEM"."ADMIN"."A_ADDR") 안에 삽입할 수 없습니다

SQL> insert into Admin values (13, '1234','name', 'seoul', '');
insert into Admin values (13, '1234','name', 'seoul', '')
                                                      *
1행에 오류:
ORA-01400: NULL을 ("SYSTEM"."ADMIN"."A_PHONE") 안에 삽입할 수 없습니다

SQL> insert into Admin values (13, '1234','name', 'seoul', '010-2222-33334');
insert into Admin values (13, '1234','name', 'seoul', '010-2222-33334')
                                                      *
1행에 오류:
ORA-12899: "SYSTEM"."ADMIN"."A_PHONE" 열에 대한 값이 너무 큼(실제: 14, 최대값:
13)

// 참조무결성
```

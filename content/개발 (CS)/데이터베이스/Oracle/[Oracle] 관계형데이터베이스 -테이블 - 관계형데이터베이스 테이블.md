---
title: "관계형데이터베이스 -테이블"
tags: [학습, 개발-CS, 데이터베이스, 개발, Oracle, 관계형DB, 무결성]
modified: 2026-09-05
---

> [!WARNING]
> 원본에 학습용 로컬 Oracle 계정의 평문 비밀번호가 포함되어 있어 마스킹 처리함.

# 관계형데이터베이스 -테이블

Oracle 첫 수업 노트로, 관계형 데이터베이스의 기본 용어(행/열/릴레이션/속성)와 제약조건(unique, not null, default, check)을 곁들인 `member` 테이블 생성 예제, 그리고 계좌관리·물품관리 테이블을 직접 설계하는 과제를 정리했다.

> [!TIP] DB 엔진
> 아래 SQL은 Oracle 문법 기준이다 (`varchar2`, `number`, `sequence ... nextval`, `timestamp default sysdate`). MySQL은 `VARCHAR`/`AUTO_INCREMENT`/`DEFAULT CURRENT_TIMESTAMP`로 표기가 다르다.

### 수업진행

1. oracle : 자료받기
    
    > [!NOTE]
> 1. 기본설치
>     2. SQL Plus (로그인 : system / <PASSWORD>)
    
2. 이론수업

### 수업내용

- 관계형 데이터베이스
    - 데이터베이스는 저장하는 공간 (CRUD를 사용)
- ORACLE 사용
    - 용어
        - 행 (row, tuple)
        - 열
        - 릴레이션 (table)
        - 속성 (데이터타입) : 속성명이 가질 수 있는 값
        - 속성명 (각각의 열)
    - sql 작성
        - 릴레이션 구성 (테이블 디자인)
        
        | id | name | pass | addr | age |
        | --- | --- | --- | --- | --- |
        | a | lee | 1234 | 경기 | 10 |
        | b | kim | 1111 | 서울 | 23 |
        
        ```sql
        create table member(
        	id varchar2 (10) unique, // id라는 속성명은 문자라는 속성을 가지고 중복이 불가능하다는 제약조건을가지고 있다
        	name varchar2 (8) not null,
        	pass varchar2 (10) default '1111',
        	addr varchar2(10),
        	age number(2) check (age between 0 and 60),
        	indate timestamp default sysdate
        	);
        ```
        
    - 생각의 흐름
        - 릴레이션 → 행(튜플, row) → 컬럼 (속성명 → 속성 → 제약조건)

# 과제

---

- 과제1
    - 계좌관리 테이블 생성

```sql
create table account (
 account_number number(10) unique,
 name varchar2(6),
 pass varchar2(4),
 money number(30) default 100,
 indate timestamp default sysdate
 );
 
 
 create sequence account_seq
   increment by 1
   start with 0
   minvalue 0
   ;
 
 insert into account values(account_seq.nextval, 'a' , '1234', default, default);
```

- 과제2
    - utf-8 방식에서는 한글을 2바이트씩 잡아먹는다

```sql
create table goods(
goods_number varchar2(5) unique,
name varchar2(8),
count number(3) check (count between 0 and 100),
manager varchar2(10),
indate timestamp,
store varchar2(5) check ( store In('창고1', '창고2', '창고3') )
);

insert into goods values ('HM001', '펜',10, '홍길동', default, '창고1');

```

# 과제제출

2조 과제제출.show

---

# 오늘의 목적

1. 릴레이션 (테이블) → row(행) → column(열)  → 속성 → 속성값 → 제약조건

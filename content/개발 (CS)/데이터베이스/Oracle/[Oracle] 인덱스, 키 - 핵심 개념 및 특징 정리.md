---
title: "인덱스, 키"
tags: [학습, 개발-CS, 데이터베이스, 개발, 인덱스, 키, 무결성, Oracle]
modified: 2026-09-05
---

# 인덱스, 키

Oracle 실습 수업에서 정리한 인덱스·키·정규화 개념 노트다. 인덱스의 장단점과 기본키/외래키의 역할, 무결성 위반 사례를 다루고, 뒤이어 회원-자동차·맛집-댓글-메뉴 예제로 외래키 제약과 정규화를 직접 실습한다. 핵심은 "인덱스는 조회를 빠르게 하지만 남용하면 오히려 느려진다"는 것과, "기본키/외래키 조합이 개체 무결성·참조 무결성을 보장한다"는 두 가지다.

> [!TIP] DB 엔진
> 아래 예제는 Oracle SQL*Plus 기준이다. `varchar2`, `number`, `sysdate`, `sequence ... nextval` 은 모두 Oracle 전용 문법으로, MySQL은 `VARCHAR`/`AUTO_INCREMENT`/`NOW()`를, PostgreSQL은 `VARCHAR`/`SERIAL`/`NOW()`를 사용하는 등 표기가 다르다.

> [!NOTE]
> 릴레이션 ( 테이블 )
> 
> - 행
>     - 실제 데이터
> - 열 (테이블 구성)
>     - 속성명
>     - 속성
>     - 제약조건

## 인덱스

- 사용법
    - 속성에 지정
        - (2개의 속성을 묶어서 하나의 속성값으로 지정 가능)
        - Ex) id, name, addr, age ⇒ id + name 을 묶어서 하나의 속성값으로 가능
    - **일반적으로 테이블 1개당 1개의 인덱스 정도만 사용**
    - 일반적으로 unique한 속성에 인덱스를 지정한다 (중복이 되면 안되므로)
- 장점
    - 검색의 속도가 빠름
- 단점
    - 인덱스가 너무 많으면 속도가 느려짐

## 키

- 정의
    - 속성에 의미를 부여
- 키의 종류
    - 기본키
        - unique한 특징 + index를 만든다
        - (unique : 하나의 튜플을 유일하게 선정하는 기준)
    - 외래키
        - 다른 테이블의 기본키를 참조하는 키 (기본키의 값을 참조)

> [!NOTE]
> Q) 인덱스를 걸었을때, DB는 인덱스를 먼저 확인하고 조회하는건가? / 아니면 인덱스 걸려있는 테이블에 찾는가?
> 
> A) b-tree 알고리즘에 따라서 데이터가 저장되므로 확인이 필요
> 
> → 구글링 결과 ) 인덱스의 경우 b-tree구조로 되어있어, 해당 인덱스를 찾아 원하는 테이블에 경로가 설정됨
> ( 인덱스가 없다면, 모든 테이블을 돌면서 데이터 확인 )

> [!NOTE]
> 복합 기본키 (여러개의 컬럼으로 기본키 설정)
> 
> ```sql
> create table member_tmp(
> id varchar2(10),
> name varchar2(10),
> pass varchar2(10),
> constraint tb_id_name_group_pk primary key (id, name)
> );
> ```

## 정규화

- 목적) 데이터 중복을 최소화하기 위한 테이블 분리

## 실습

- 회원별 자동차 소유 데이터베이스 구축
    - 회원은 아이디와, 이름과, 주소를 저장
- 정규화) 소유한 자동차는 별도로 테이블을 만들어서 중복 최소화
    - 자동차는 id와 carnum, no로 구성

```sql
//<회원> - 부모 릴레이션
create table member1( 
id varchar2(4) primary key, 
name varchar2(10), 
addr varchar2(10)
);

//<자동차> - 자식 릴레이션
create table car ( 
no int primary key,
id varchar2(4),
carnum varchar2(4),
foreign key(id) references member1(id)
);
```

> [!NOTE]
> 테스트)
> 
> ```sql
> SQL> insert into car values (1, 'b', '4455') ;
> insert into car values (1, 'b', '4455')
> *
> 1행에 오류:
> ORA-00001: 무결성 제약 조건(SYSTEM.SYS_C0011074)에 위배됩니다
> //기본키 문제
> 
> SQL>
> SQL> insert into car values (2, 'b', '4455') ;
> insert into car values (2, 'b', '4455')
> *
> 1행에 오류:
> ORA-02291: 무결성 제약조건(SYSTEM.SYS_C0011075)이 위배되었습니다- 부모 키가
> 없습니다
> //외래키 문제
> 
> ```

> [!NOTE]
> 문제)
> 
> 1. 자식릴레이션보다 부모릴레이션을 먼저 만들어야하나? o
> 2. 부모릴레이션을 삭제하려면, 외래키가 걸려있는 자식릴레이션을 삭제해야한다? o
> 3. 외래키가 참조하는 속성은 반드시 유니크 해야한다? o
> 4. 유니크 제약조건을 추가한다면 외래키를 설정할 수 있나? o (다만, 설계적 관점에서 잘 설정해야한다)

## 문제

> [!NOTE]
> 무결성이란 데이터가 처리되는 과정에서 손상되지 않고, 완전성, 정확성, 일관성을 유지하는 것.
> 
> 무결성 종류에는 도메인 무결성, 개체 무결성, 참조 무결성이 있다.
> 
> 도메인 무결성은 속성과 관련, 개체 무결성은 기본키와 관련, 참조무결성은 외래키와 관련이 있다.
> 
> 다음 쿼리를 실행하면서, 어떤 무결성을 위배했는지 분석하고 정리하세요.
> 
> 공부하는 방법은 바로 쿼리를 실행하지 말고, 손코딩으로 먼저분석하여 답을 작성하고 쿼리를 실행시켜서 확인하는 것입니다. 꼭 순서를 지키세요
> 
> ```sql
> 1. select * from member1;
> 2. insert into member1 values('b','kimsoo','seoul'); 
> // 성공
> 3. insert into member1 values ('b', 'choi', 'suwon'); 
> // 개체 무결성 위배 ( 기본키 데이터 중복 오류 )
> 4. insert into member1 values('c', 'leechoisu', 'seoul' );
> // 성공
> 5. insert into member1 values ('d', 'park', 82070);
> // 도메인 무결성 위배 ( 데이터 타입 오류 )
> // 오라클 성공) 자동 캐스팅을 진행
> 6. insert into member1 values ('e', 'park', 'suwon');
> // 성공
> 7. insert into car values (3, 'e', '1111');
> // 성공
> 8. insert into car values (4, 'f', '2222');
> // 참조 무결성 위배 (존재하지 않는 부모 참조값)
> 9. insert into car values (5, 'b', '3333');
> // 성공
> 10. insert into car values (5, '3', '4444');
> // 개체 무결성 위배 (기본키 데이터 중복 오류)
> 11. insert into car values (7, 'a', '55나1234');
> //  도메인 무결성 위배 (속성 크기 (4) 오류 )
> ```

## 오후 수업

### 과제)

1. 맛집테이블

속성명 : id ,맛집이름, 주소, 내용, 등록일

⇒ id 값은 자동증가 sequence 사용

⇒ 맛집 10개 등록

| 칼럼명 | 칼럼ID | 타입 및 길이 | PK | FK | 제약조건 | 기본값 |
| --- | --- | --- | --- | --- | --- | --- |
| 맛집번호 | id | number(3) | Y |  |  |  |
| 맛집이름 | name | varchar2(20) |  |  |  |  |
| 맛집주소 | addr | varchar2(20) |  |  |  |  |
| 맛집문구 | message | varchar2(100) |  |  |  |  |
| 맛집추가시점 | indate | timesamp |  |  |  | sysdate |

```sql
create table shop(
id number(3) primary key,
name varchar2(20),
addr varchar2(20),
message varchar2(100),
indate timestamp default sysdate
);

create sequence shop_seq
increment by 1
start with 1
maxvalue 100
;

insert into shop values (shop_seq.nextval, '대박전', 'seoul', '우리는 전을 팔아요', default);
insert into shop values (shop_seq.nextval, '맛난 국수', 'suwon', '후루룩', default);
insert into shop values (shop_seq.nextval, '역전우동', 'busan', '우동 좋아요', default);
insert into shop values (shop_seq.nextval, '보글보글찌개', 'busan', '부글부글', default);
insert into shop values (shop_seq.nextval, '김치찌개집', 'gangwon', '김치찌개맛나', default);
insert into shop values (shop_seq.nextval, '돼지고기집', 'kimjae', 'good', default);
insert into shop values (shop_seq.nextval, '시장집', 'seoul', '시장골목', default);
insert into shop values (shop_seq.nextval, '골목집', 'suwon', '골골', default);
insert into shop values (shop_seq.nextval, '들판집', 'seoul', '들들', default);
insert into shop values (shop_seq.nextval, '바다집', 'busan', '시원한 바다', default);

```

- sequence

```sql
create sequence shop_seq
increment by 1
start with 1
maxvalue 100
;

insert into 테이블 (컬럼) values (shop_seq.nextval);
```

1. 댓글 테이블

속성명 : ,  작성자, 댓글, 작성일, 맛집id

⇒ 맛집id 는 외래키 (댓글 여러개 가능하니)

⇒ 맛집 5개에 대한 댓글 입력

| 칼럼명 | 칼럼ID | 타입 및 길이 | PK | FK | 제약조건 | 기본값 |
| --- | --- | --- | --- | --- | --- | --- |
| 댓글번호 | id | number(3) | Y |  |  |  |
| 댓글이름 | name | varchar2(20) |  |  |  |  |
| 댓글 | message | varchar2(100) |  |  |  |  |
| 댓글추가시점 | indate | timestamp |  |  |  | sysdate |
| 맛집번호 | shop_id | number(3) |  | Y |  |  |

```sql
create table cmt(
id number(3) primary key,
name varchar2(20),
message varchar2(100),
indate timestamp default sysdate,
shop_id number(3),
foreign key(shop_id) references shop(id)
);

 create sequence cmt_seq
  increment by 1
  start with 1
  maxvalue 100
  ;

insert into cmt values (cmt_seq.nextval, 'park', '너무 맛있어요', default, 1);
insert into cmt values (cmt_seq.nextval, 'hong', '너무 맛있어요', default, 2);
insert into cmt values (cmt_seq.nextval, 'kim', '너무 맛있어요', default, 3);
insert into cmt values (cmt_seq.nextval, 'hong', '너무 맛있어요!!', default, 4);
insert into cmt values (cmt_seq.nextval, 'na', '별로예요', default, 5);

```

1. 메뉴 테이블

속성명 : num, 메뉴명, 맛집id

⇒ 맛집id는 외래키

⇒ 메뉴 여러개 가능 

```sql
/*
create table menu(
id number(3) primary key,
name varchar(20) not null,
shop_id number(3),
foreign key(shop_id) references shop(id)
);

create sequence menu_seq
  increment by 1
  start with 1
  maxvalue 100
  ;
  
insert into menu values (menu_seq.nextval, '김치전', 1);
insert into menu values (menu_seq.nextval, '감자전', 1);
insert into menu values (menu_seq.nextval, '김치찌개', 2);
insert into menu values (menu_seq.nextval, '된장찌개', 2);
insert into menu values (menu_seq.nextval, '삼겹살', 3);
insert into menu values (menu_seq.nextval, '항정살', 3);
insert into menu values (menu_seq.nextval, '멸치국수', 4);
insert into menu values (menu_seq.nextval, '고기국수', 4);
insert into menu values (menu_seq.nextval, '초코 케익', 5);
insert into menu values (menu_seq.nextval, '딸기 케익', 5);

SQL> select * from menu;

       NUM NAME                         ID
---------- -------------------- ----------
         1 김치전                        1
         2 감자전                        1
         3 김치찌개                      2
         4 된장찌개                      2
         5 삼겹살                        3
         6 항정살                        3
         7 멸치국수                      4
         8 고기국수                      4
         9 초코 케익                     5
        10 딸기 케익                     5
        */

```

## 메뉴-상점연결테이블

| 칼럼명 | 칼럼ID | 타입 및 길이 | PK | FK | 제약조건 | 기본값 |
| --- | --- | --- | --- | --- | --- | --- |
| 번호 | id | number(3) | Y |  |  |  |
| 맛집번호 | name | number(3) |  | Y |  |  |
| 메뉴번호 | addr | number(3) |  | Y |  |  |

## 메뉴

| 칼럼명 | 칼럼ID | 타입 및 길이 | PK | FK | 제약조건 | 기본값 |
| --- | --- | --- | --- | --- | --- | --- |
| 메뉴번호 | id | number(3) | Y |  |  |  |
| 메뉴명 | name | varchar2(20) |  |  | not null |  |

```sql
create table menu_con(
num number(3) primary key,
shop_id number(3),
menu_id number(3),
foreign key(shop_id) references shop(id),
foreign key(menu_id) references menu(id)
);

create table menu(
id number(3) primary key,
name varchar(20) not null
);

create sequence menu_new_seq
increment by 1
start with 1
maxvalue 100
;

create sequence menu_con_seq
increment by 1
start with 1
maxvalue 100
;

insert into menu values(menu_new_seq.nextval, '감자전');
insert into menu values(menu_new_seq.nextval, '김치전');
insert into menu values(menu_new_seq.nextval, '된장찌개');
insert into menu values(menu_new_seq.nextval, '김치찌개');
insert into menu values(menu_new_seq.nextval, '삼겹살');
insert into menu values(menu_new_seq.nextval, '항정살');
insert into menu values(menu_new_seq.nextval, '멸치국수');
insert into menu values(menu_new_seq.nextval, '고기국수');
insert into menu values(menu_new_seq.nextval, '초코 케익');
insert into menu values(menu_new_seq.nextval, '딸기 케익');

insert into menu_con values (menu_con_seq.nextval, 1, 1);
insert into menu_con values (menu_con_seq.nextval, 1, 2);
insert into menu_con values (menu_con_seq.nextval, 2, 7);
insert into menu_con values (menu_con_seq.nextval, 2, 8);
insert into menu_con values (menu_con_seq.nextval, 3, 7);
insert into menu_con values (menu_con_seq.nextval, 3, 8);
insert into menu_con values (menu_con_seq.nextval, 4, 3);
insert into menu_con values (menu_con_seq.nextval, 4, 4);
insert into menu_con values (menu_con_seq.nextval, 5, 3);
insert into menu_con values (menu_con_seq.nextval, 5, 4);
insert into menu_con values (menu_con_seq.nextval, 6, 5);
insert into menu_con values (menu_con_seq.nextval, 6, 6);
insert into menu_con values (menu_con_seq.nextval, 7, 1);
insert into menu_con values (menu_con_seq.nextval, 8, 9);
insert into menu_con values (menu_con_seq.nextval, 9, 10);
insert into menu_con values (menu_con_seq.nextval, 10, 5);
```

---

# 결과예시

### 메뉴

| id(PK) | 메뉴명 |
| --- | --- |
| 1 | 김치전 |
| 2 | 감자전 |
| 3 | 된장찌개 |
| 4 | 김치찌개 |
| … | … |
| 10 | 딸기 케익 |

### 메뉴-상점 연결

| id(PK) | 메뉴id(FK) | 상점id(FK) |
| --- | --- | --- |
| 1 | 1 | 1 |
| 2 | 1 | 2 |
| 3 | 2 | 7 |
| 4 | 2 | 8 |
| … | … | … |
| 16 | 10 | 5 |

### 상점

| id(PK) | 상점이름 | 주소 | 메시지 | 생성일자 |
| --- | --- | --- | --- | --- |
| 1 | 대박전 | seoul | 우리는 전을 팔아요 | default |
| 2 | 맛난국수 | suwon | 후루룩 | default |
| 3 | 역전우동 | busan | 우동 좋아요 | default |
| 4 | 보글보글찌개 | busan | 부글부글 | default |
| … | … | … | … | … |
| 10 | 바다집 | busan | 시원한 바다 | default |

### 댓글

| id(PK) | 작성자 | 댓글 | 작성일 | 상점 |
| --- | --- | --- | --- | --- |
| 1 | park | 너무 맛있어요 | default | 1 |
| 2 | hong | 너무 맛있어요 | default | 2 |
| 3 | kim | 너무 맛있어요 | default | 3 |
| 4 | hong | 너무 맛있어요!! | default | 4 |
| 5 | na | 별로예요 | default | 5 |

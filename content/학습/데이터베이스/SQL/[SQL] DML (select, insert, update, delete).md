---
title: [SQL] DML (select, insert, update, delete)
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

![](https://blog.kakaocdn.net/dna/EZcSH/btsKbUHYWmW/AAAAAAAAAAAAAAAAAAAAAKHObIc86N7EU1rwZbtyCS7LV8atzrI1B5RFaoRSkbF8/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=ErLoRrqOPxP2xub7wshQHqZ5k7w%3D)

## INSERT

*   데이터 추가 (행 추가)
*   CRUD 중에 "Create"에 해당

[문법]  
  
Insert Into [테이블명]( [필드이름1], [필드이름2], ...) Values ( [데이터값1], [데이터값2],...)  
  
*참고) 필드이름의 경우 생략될 수 있다 ( 순서대로 Values가 적용됨 )  
insert into member values(1, 1000);

![](https://blog.kakaocdn.net/dna/c0QRWL/btsKcWrowtN/AAAAAAAAAAAAAAAAAAAAALLoYB9CCIHubCwMjVN_ixv9wL_uSkmL9oWdzRFLL9i6/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=eSyEhCpc73G0CSyuRzLOTRFKcEw%3D)

## UPDATE

*   데이터 수정
*   CRUD 중에 "Update"에 해당

[문법]  
  
Update [ 테이블명 ] set [열] = [변경할값] where [조건]  
  
*참고) 조건이 없는 경우, 테이블에 있는 전체 열을 전부 수정

![](https://blog.kakaocdn.net/dna/oTzLK/btsKcZnYGbY/AAAAAAAAAAAAAAAAAAAAAErIESo1QGzRgITHFntinq1KoJqP-IKyO33NMiE31oJZ/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=UKSapidDT%2FN4mGEyz%2FOzV%2FRndSs%3D)

## DELETE

*   데이터 삭제
*   CRUD 중에 "Delete"에 해당

[문법]  
  
delete from [테이블명] where [조건]  
  
*참고) where 조건절이 없을 경우, 해당 테이블 모든 데이터 삭제

![](https://blog.kakaocdn.net/dna/daxk2u/btsKb6akP0m/AAAAAAAAAAAAAAAAAAAAABcT9ALcK4wEmvEJj1cxG3S82NwkkV-LA_zwcFfMfIjv/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=7r2FHXRUWn45tyfL85MvE3BIQ7o%3D)

> 원문: https://gradualprecision.tistory.com/121

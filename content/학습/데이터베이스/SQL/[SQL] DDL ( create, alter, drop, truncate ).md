---
title: [SQL] DDL ( create, alter, drop, truncate )
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] DDL ( create, alter, drop, truncate )

1. DDL 이란?  
2. create  
3. drop  
4. truncate  
5. alter

## DDL 이란?

*   Data Definition Language
*   데이터베이스를 정의하는 언어
*   데이터를 생성, 수정 ,삭제 하는 등의 데이터 전체 골격 결정
*   create, alter, drop, truncate

## CREATE

*   **객체를 새로 생성할 때 사용하는 명령어**
*   **객체** 종류 : 데이터베이스, 테이블, 인덱스, 뷰, 프로시져, 트리거 등

[문법]  
  
CREATE [객체종류] [객체이름] (속성 및 제약 조건)

![](https://blog.kakaocdn.net/dna/bhDw2v/btsKa1VNzpE/AAAAAAAAAAAAAAAAAAAAABnsE6nBmIsnRZBM1ycTz_n6HaBYWODy8IstXjfm3iWv/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=S88oWd9j6B1od5yilXR%2BrnXzpgU%3D)

## DROP

*   **delete는 내용 값을 삭제하는 것이고, Drop은 객체를 삭제하는 것**
*   객체 종류 : 데이터베이스, 테이블, 뷰, 인덱스, 프로시저, 함수, 트리거, 스키마, 사용자, 시퀀스 삭제 가능
*   delete의 경우 Rollback이 가능하지만, drop의 경우 Rollback 이 불가능하다
*   **CASCADE 옵션 사용 ( 해당 옵션을 사용하면, 삭제되는 객체와 종속되어있는 객체들도 함께 삭제된다 )**

[문법]  
  
Drop [객체종류] [객체이름];

![](https://blog.kakaocdn.net/dna/lnsAu/btsKbLxR9BI/AAAAAAAAAAAAAAAAAAAAAN51j6TpuAAeduzqOcxbkdd_rgU5xJCyQDrdZgIvUG0T/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=JYBg1641UEd%2BjOeAuafelmBRUk8%3D)

## TRUNCATE

*   테이블에 있는 데이터 전부 삭제
*   **ROLLBACK 불가능**
*   **delete는 where절이 사용 가능하며, 한줄한줄 삭제하는 반면 truncate는 한번에 삭제함 (속도 빠름)**

![](https://blog.kakaocdn.net/dna/xo2d9/btsKbAciPRs/AAAAAAAAAAAAAAAAAAAAAFJb57ZMzSkX6bxP5JChEUtnaPYZopmDafjI7HFhFtvM/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=BJAd4n2Q805NYbZhNoRAUXvEKSE%3D)

## ALTER

*   테이블의 속성 및 열(column)에 관하여 수정 하는 작업
*   컬럼 추가/삭제, 테이블 이름 변경, 기본키 추가, 인덱스 추가/삭제/수정, 컬럼 데이터타입 변경 등

[문법]  
  
ALTER TABLE [테이블명] [동작]

![](https://blog.kakaocdn.net/dna/UrBjS/btsKb4jELkZ/AAAAAAAAAAAAAAAAAAAAAHTgfXNztjTCwmhBttGa11J8iANMxJsILY6ATTmMgnlz/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=gQiobHk58Sb6LG2zioPSVpoL0A8%3D)

> 원문: https://gradualprecision.tistory.com/122

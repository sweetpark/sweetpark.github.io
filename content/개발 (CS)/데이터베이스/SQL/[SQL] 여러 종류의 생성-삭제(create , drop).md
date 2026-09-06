---
title: "[SQL] 여러 종류의 생성/삭제(create , drop)"
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] 여러 종류의 생성/삭제(create , drop)

1. 데이터베이스 생성/ 삭제  
2. 테이블 생성/ 삭제  
3. 뷰 생성/ 삭제  
4. 인덱스 생성/ 삭제  
5. 사용자 생성/ 삭제

## 데이터베이스 생성/삭제

*   데이터베이스 생성/삭제

```sql
-- 생성
Create DATABASE my_database;

-- 삭제
Drop DATABASE my_database;
```

## 테이블 생성 /삭제

```sql
-- 생성
Create TABLE ex_table(
    id INT PRIMARY KEY,
    name VARCHAR(100)
);

-- 삭제
Drop TABLE ex_table;
```

## 뷰 생성/삭제

*   VIEW 는 테이블의 데이터를 조회해서, 그 데이터의 대한 view를 만듬
*   **왜 필요한가**: VIEW는 데이터를 실제로 복제해 저장하는 게 아니라, 정의해 둔 SELECT 쿼리를 매번 재실행해 보여주는 "가상 테이블"이다. 자주 쓰는 복잡한 JOIN/조건을 뷰로 감싸두면 이후에는 단순 SELECT처럼 재사용할 수 있고, 특정 컬럼/행만 노출시켜 원본 테이블의 민감한 컬럼을 가리는 접근 제어 용도로도 쓸 수 있다. 그래서 `DROP VIEW`는 뷰 정의만 삭제할 뿐 원본 테이블(`ex_table`)의 데이터에는 영향을 주지 않는다.

```sql
-- 생성
Create VIEW ex_view AS SELECT id, name FROM ex_table WHERE id > 10;

-- 삭제
DROP VIEW ex_view;
```

## 인덱스 생성/삭제

*   인덱스를 지정하기 위해선, 테이블의 특정 column을 지정해야함 ( 열(column)을 기준으로 인덱스 색인)
*   **왜 필요한가**: 인덱스가 없으면 특정 값을 찾을 때 테이블 전체를 처음부터 끝까지 훑는 풀 스캔이 발생한다. 인덱스는 지정한 열 값을 B-Tree 같은 정렬된 구조로 별도 보관해, 그 값으로 찾을 때는 트리를 타고 내려가는 것만으로 훨씬 빠르게 위치를 찾을 수 있게 해준다. 다만 인덱스는 공짜가 아니라서, INSERT/UPDATE/DELETE 시마다 인덱스 구조도 함께 갱신해야 하므로 쓰기 성능은 오히려 느려질 수 있다(그래서 조회가 잦고 쓰기가 적은 열에 거는 것이 일반적이다).

```sql
-- 생성
Create INDEX idx_ex ON ex_table (name);

-- 삭제
Drop INDEX idx_ex ON ex_table;
```

## 사용자 생성/ 삭제

*   **왜 `'test'@'localhost'`처럼 호스트를 함께 지정하는가 (MySQL 기준)**: MySQL 계정은 "사용자명 + 접속 출발지(호스트)"를 합쳐 하나의 계정으로 취급한다. 같은 사용자명이라도 `'test'@'localhost'`(로컬 접속만 허용)와 `'test'@'%'`(모든 IP 허용)는 서로 다른 별개의 계정이다. 이렇게 나누는 이유는 최소 권한 원칙에 따라 "이 계정은 어디서 접속해도 되는지"까지 제한해, 자격증명이 유출되더라도 허용된 호스트 밖에서는 로그인 자체가 불가능하게 만들기 위함이다. Oracle/PostgreSQL은 이런 호스트 바인딩 없이 사용자 계정과 별도의 네트워크 접근 제어(TNS/`pg_hba.conf`)로 관리한다.

```sql
-- 생성
Create USER 'test'@'localhost' IDENTIFIED BY 'password';

-- 삭제
Drop USER 'test'@'localhost';
```

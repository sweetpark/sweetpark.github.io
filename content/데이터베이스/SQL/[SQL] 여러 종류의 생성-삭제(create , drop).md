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

```sql
-- 생성
Create VIEW ex_view AS SELECT id, name FROM ex_table WHERE id > 10;

-- 삭제
DROP VIEW ex_view;
```

## 인덱스 생성/삭제

*   인덱스를 지정하기 위해선, 테이블의 특정 column을 지정해야함 ( 열(column)을 기준으로 인덱스 색인)

```sql
-- 생성
Create INDEX idx_ex ON ex_table (name);

-- 삭제
Drop INDEX idx_ex ON ex_table;
```

## 사용자 생성/ 삭제

```sql
-- 생성
Create USER 'test'@'localhost' IDENTIFIED BY 'password';

-- 삭제
Drop USER 'test'@'localhost';
```

> 원문: https://gradualprecision.tistory.com/123

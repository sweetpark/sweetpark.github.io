---
title: "JDBC 목차"
tags: [학습, 목차]
created: 2026-10-16
modified: 2026-10-16
---

**위치**: [학습](학습%20목록.md) › [개발 (CS)](개발%20%28CS%29/개발%20%28CS%29%20목록.md) › [데이터베이스](개발%20%28CS%29/데이터베이스/데이터베이스%20목록.md) › JDBC  
**규모**: 포스팅 9개

## JDBC 기초 (순서대로)

> JDBC 구조부터 순수 JDBC로 CRUD·트랜잭션을 직접 다뤄 보는 순서.

| 포스팅 | 설명 |
|---|---|
| [(JDBC#1) JDBC의 기본 설명 및 구조 이해하기](개발%20%28CS%29/데이터베이스/JDBC/[JDBC1]%20JDBC의%20기본%20설명%20및%20구조%20이해하기.md) |  |
| [(JDBC #2) 순수 JDBC 이해하기](개발%20%28CS%29/데이터베이스/JDBC/[JDBC%202]%20순수%20JDBC%20이해하기.md) |  |
| [(JDBC #3) 순수 JDBC와 트랜잭션 이해하기](개발%20%28CS%29/데이터베이스/JDBC/[JDBC%203]%20순수%20JDBC와%20트랜잭션%20이해하기.md) |  |

## 트랜잭션 관리 (Spring)

> PlatformTransactionManager, TransactionTemplate, @Transactional로 트랜잭션을 추상화하는 과정.

| 포스팅 | 설명 |
|---|---|
| [(JDBC #4) PlatformTransactionManager을 통한 트랜잭션 관리](개발%20%28CS%29/데이터베이스/JDBC/[JDBC%204]%20PlatformTransactionManager을%20통한%20트랜잭션%20관리.md) |  |
| [(JDBC #5) Transaction Template을  활용한 간단한 트랜잭션 적용](개발%20%28CS%29/데이터베이스/JDBC/[JDBC%205]%20Transaction%20Template을%20%20활용한%20간단한%20트랜잭션%20적용.md) |  |
| [(@Transactional) 스프링이 제공해주는 트랜잭션 이해하기](개발%20%28CS%29/데이터베이스/JDBC/[@Transactional]%20스프링이%20제공해주는%20트랜잭션%20이해하기.md) |  |

## 커넥션 풀·편의 도구

> 커넥션 풀과 DataSource, JdbcTemplate으로 반복 코드를 줄이는 방법.

| 포스팅 | 설명 |
|---|---|
| [(DataSource) Connection Pool의 이해와 DataSource](개발%20%28CS%29/데이터베이스/JDBC/[DataSource]%20Connection%20Pool의%20이해와%20DataSource.md) |  |
| [(JDBC #6) JDBC Template을 활용한 JDBC 편리하게 이용하기](개발%20%28CS%29/데이터베이스/JDBC/[JDBC%206]%20JDBC%20Template을%20활용한%20JDBC%20편리하게%20이용하기.md) |  |
| [DB 접근 기술 (JDBC Template & MyBatis)](개발%20%28CS%29/데이터베이스/JDBC/[SQL]%20DB%20접근%20기술%20%28JDBC%20Template%20&%20MyBatis%29%20-%20핵심%20개념%20및%20특징%20정리.md) | 스프링에서 DB에 접근하는 두 기술(JDBC Template, MyBatis)의 장단점과 데이터베이스 연동 테스트(임베디드 H2) 방법을 정리한다. |

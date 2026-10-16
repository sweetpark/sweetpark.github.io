---
title: "MyBatis 목차"
tags: [학습, 목차]
created: 2026-10-16
modified: 2026-10-16
---

**위치**: [학습](학습%20목록.md) › [개발 (CS)](개발%20%28CS%29/개발%20%28CS%29%20목록.md) › [데이터베이스](개발%20%28CS%29/데이터베이스/데이터베이스%20목록.md) › MyBatis  
**규모**: 포스팅 6개

## 기본·성능

> MyBatis 기본 개념과 대용량 처리 시 동적 SQL 성능 최적화.

| 포스팅 | 설명 |
|---|---|
| [DataBase](개발%20%28CS%29/데이터베이스/MyBatis/[MyBatis]%20DataBase%20-%20핵심%20개념%20및%20특징%20정리.md) | DBeaver 접속 이슈, MyBatis DB 연결 설정, SQL 작성 방법 정리. |
| [(MyBatis) 대용량 트랜잭션 매핑과 동적 SQL 성능 최적화 패턴](개발%20%28CS%29/데이터베이스/MyBatis/[MyBatis]%20대용량%20트랜잭션%20매핑과%20동적%20SQL%20성능%20최적화%20패턴.md) | Netty 소켓 게이트웨이나 금융 결제 시스템처럼 초당 수천 건의 트랜잭션이 발생하는 환경에서, MyBatis XML 동적 쿼리의 성능 왜곡 함정을 회피하고 ExecutorType.BATCH를… |

## 동적 SQL 정적분석 (SAX·DOM·AST)

> MyBatis XML을 파싱해 동적 SQL을 정적으로 분석하는 도구 설계.

| 포스팅 | 설명 |
|---|---|
| [MyBatis 동적 SQL 정적분석 - Include 캐싱과 choose 분기 처리](개발%20%28CS%29/데이터베이스/MyBatis/[MyBatis]%20MyBatis%20동적%20SQL%20정적분석%20-%20핵심%20개념%20및%20특징%20정리.md) | MyBatis SQL 정적 분석 툴("Mybatis + AI (쿼리 분석 Tool)" 미니프로젝트)에서 내린 두 가지 기술 결정: <include refid> 태그를 OOM 없이 빠르게 해석하… |
| [SAX vs DOM Parser](개발%20%28CS%29/데이터베이스/MyBatis/[MyBatis]%20SAX%20vs%20DOM%20Parser%20-%20핵심%20개념%20및%20특징%20정리.md) | MyBatis 동적 쿼리(<if>, <where>, <choose> 등)를 정적 분석할 때 SAX 대신 DOM 파서를 선택한 이유와, JSqlParser 통과용 가짜 SQL(Dummy SQL)… |
| [(MyBatis) W3C DOM 기반 MyBatis 동적 쿼리 정적 분석과 AST 가짜 SQL 생성기 설계](개발%20%28CS%29/데이터베이스/MyBatis/[MyBatis]%20W3C%20DOM%20기반%20MyBatis%20동적%20쿼리%20정적%20분석과%20AST%20가짜%20SQL%20생성기%20설계.md) |  |
| [Rule Test](개발%20%28CS%29/데이터베이스/MyBatis/[MyBatis]%20Rule%20Test%20-%20핵심%20개념%20및%20특징%20정리.md) | MyBatis Quality Gate |

---
title: "[게임서버프로그래밍#2] RDBMS와 NoSQL"
tags: [개발 서적 리뷰, 게임서버 프로그래머 책]
created: 2026-09-05
modified: 2026-09-05
---

# [게임서버프로그래밍#2] RDBMS와 NoSQL

```text
RDBMS (Table)                    NoSQL (Document/Collection)

+----+--------+-----+            {
| id | name   | lv  |              "_id": 1,
+----+--------+-----+              "name": "hero",
| 1  | hero   | 10  |              "lv": 10,
| 2  | mage   | 7   |              "inventory": ["sword", "shield"]
+----+--------+-----+            }
고정된 스키마, 행/열 구조          컬렉션마다 스키마가 달라도 됨
JOIN으로 관계 표현                 문서 하나에 중첩 데이터 포함 가능
```

이 글에서는 데이터베이스의 두 가지 큰 흐름인 RDBMS와 NoSQL의 개념과 차이를 설명한다.  
각각이 중시하는 원칙(ACID, BASE), 구조상의 차이, 분산처리(샤딩)까지 예시와 함께 살펴본다.

* * *

## _데이터베이스의 기본 개념_

데이터를 효율적으로 저장하고, 변경하고, 조회하기 위해 사용하는 시스템을 데이터베이스(Database)라고 한다.  
데이터베이스는 크게 **RDBMS**(Relational Database Management System)와 **NoSQL**(Not Only SQL) 두 종류로 구분할 수 있다.

* * *

## _RDBMS란 무엇인가_

### 정의

*   관계형 데이터베이스로, 데이터를 테이블(table) 형태로 저장한다.
*   행(Row)과 열(Column)로 구성된 구조를 갖는다.
*   **SQL(Structured Query Language)**로 데이터를 조회하거나 조작한다.

### 특징

*   데이터 간의 관계를 명확하게 표현할 수 있다.
*   복잡한 쿼리와 트랜잭션을 강력하게 지원한다.
*   데이터 일관성과 무결성을 매우 중요시한다.

### 대표 제품

*   MySQL, PostgreSQL, Oracle DB, MS SQL Server 등

* * *

## _NoSQL이란 무엇인가_

### 1. 정의

*   전통적인 테이블 기반 구조를 따르지 않는 데이터베이스를 통칭한다.
*   주로 대규모 분산 시스템을 위한 목적으로 설계되었다.
*   **Tree 구조**나 **Key-Value 구조**, **Document 형태(JSON, BSON)** 등 다양한 저장 방식을 가진다.

### 2. 특징

*   데이터 가용성을 중시한다.
*   컬렉션마다 서로 다른 스키마를 가질 수 있다.
*   수평 확장이 매우 용이하다.
*   게임 서버나 로그 저장용 데이터베이스로 자주 사용된다.

### 3. 대표 제품

*   MongoDB, Couchbase, Cassandra, Riak 등

* * *

## _ACID vs BASE_

### 1. RDBMS - ACID 원칙

*   **원자성(Atomicity):** 트랜잭션은 모두 완료되거나 전혀 수행되지 않는다.
*   **정합성(Consistency):** 트랜잭션 수행 전후에 데이터 무결성이 유지된다.
*   **독립성(Isolation):** 동시에 수행되는 트랜잭션은 서로 간섭하지 않는다.
*   **지속성(Durability):** 트랜잭션이 완료되면 데이터는 영구히 저장된다.

### 2. NoSQL - BASE 원칙

*   **Basically Available:** 시스템은 항상 응답하지만, 응답이 실패일 수도 있다.
*   **Soft state:** 시스템 상태는 시간이 지나면서 변경될 수 있다.
*   **Eventual consistency:** 일정 시간이 지나면 결국 데이터 일관성이 유지된다.

[요약]  
RDBMS는 일관성을 최우선시하고,  
NoSQL은 가용성과 확장성을 최우선시한다.

* * *

## RDBMS vs NoSQL 구조 비교

| 항목 | RDBMS | NoSQL |
| --- | --- | --- |
| 인스턴스 개념 | DB 인스턴스 | DB 인스턴스 |
| 데이터 구조 | 테이블(Table) | 컬렉션(Collection) |
| 데이터 저장 단위 | 레코드(Record) | 문서(Document) |
| 저장 형식 | 정형 데이터(표 형태) | 비정형 데이터(JSON 등) |

*  NoSQL 관련 추가 정보 *  
  
1. NoSQL에서는 데이터를 BSON(Binary JSON) 형태로 저장하는 경우가 많다.  
2. MongoDB는 내부에 MMAP / WiredTiger 등의 엔진을 선택하여 사용할 수 있다.  
3. 인덱스 생성 비용이 RDBMS보다 상대적으로 크다.  
4. NoSQL에서는 Upsert가 기본적인 Insert 방식처럼 사용되기도 한다.  
(Upsert() : 데이터가 없으면 insert, 데이터가 있으면 update하는 복합 명령)

* * *

## _데이터베이스 분산처리 (샤딩)_

### 1. 샤딩(Sharding)이란?

*   하나의 큰 데이터베이스를 여러 조각으로 나누어 저장하는 기술이다.
*   **수평 확장**(Scale-Out)이 가능해져 데이터 증가에 유연하게 대응할 수 있다.

### 2. 샤드 키(Shard Key)

*   데이터를 어떤 기준으로 나눌지 결정하는 키이다.
*   샤드 키는 **변경이 불가능**하다.
*   일반적으로 고유한 ID(Primary Key)를 샤드 키로 지정하여 각 서버가 독립적으로 데이터를 관리할 수 있게 한다.

**주의할 점:**

*   샤드 키를 잘못 설정하면 데이터 쏠림(Hot Spot) 문제가 발생할 수 있다.

---
title: "[JDBC#1] JDBC의 기본 설명 및 구조 이해하기"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [JDBC#1] JDBC의 기본 설명 및 구조 이해하기

## _JDBC 란?_

자바에서 데이터베이스에 접속할 수 있도록 하는 자바 API를 의미함.  
JDBC는 데이터베이스에서 자료를 쿼리하거나 업데이트하는 방법을 제공한다

* * *

## _JDBC 이해_

요청 흐름

```text
[Client (APP, WEB)] --요청--> [Application Server] --쿼리--> [DB] --결과--> [Application Server] --응답--> [Client]
```

*   클라이언트 (APP, WEB)의 요청이 들어오면, Application Server에서 요청을 분석하고 필요한 데이터를 DB를 통해 가지고 오게된다

DB 커넥션 과정

```text
1. 커넥션 연결   [Application] ---------> [DB]
2. SQL 전달     [Application] --SQL----> [DB]
3. 결과 응답     [Application] <--Result-- [DB]
```

*   Application은 필요한 데이터가 있을 때, 3가지 절차를 지나게 된다
    1.  커넥션 연결 : DB 와 연결을 하기위해 커넥션 설정을 한다
    2.  SQL 전달 : DB에 쿼리를 하기 위해서, SQL을 전달하게 된다
    3.  결과 응답 : SQL 결과를 응답을 통해, Application Server에 전달하게 된다  
          
        

DB 커넥션 세부 과정

```text
[Application]
      │  (통일된 JDBC 인터페이스 사용)
      ▼
[JDBC 표준 인터페이스: Connection / Statement / ResultSet]
      │
      ├─ MySQL JDBC Driver   ──> MySQL
      ├─ Oracle JDBC Driver  ──> Oracle
      └─ H2 JDBC Driver      ──> H2
```

*   **JDBC == 인터페이스**  
    *   DB의 경우, 여러 회사(Mysql, Oracle, H2 ...)들에 따라 접근하는 방식 및  결과 포멧들이 다르게 되어있다.
        *   **JDBC) 각각의 DB에 맞춰 개발하게 되면, 동일한 기능인데 사용법이 다르게 되는 불편함이 생긴다. 따라서, 서로다른 방식들을 통일 시키고자, JAVA에서 JDBC(인터페이스) 를 이용하여 통일화를 이룸**
    *   해당 JDBC로 포맷을 맞추고, Spring은 해당 DB에 맞춰서 드라이버를 연결하여 통신을 하게 된다.

* * *

## _JDBC 주로 사용되는 파라미터_

java.sql.Connection : 커넥션 연결  
java.sql.statement : SQL을 담은 내용 (prepareStatement로서 파라미터를 담는걸로 사용)  
java.sql.ResultSet : SQL 결과 내용

> 원문: https://gradualprecision.tistory.com/154

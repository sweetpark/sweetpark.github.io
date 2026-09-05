---
title: "[JDBC #3] 순수 JDBC와 트랜잭션 이해하기"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [JDBC #3] 순수 JDBC와 트랜잭션 이해하기

1. 트랜잭션 ACID  
2. 트랜잭션 격리 수준  
3. DB 세션 이해하기  
4. 순수 JDBC 트랜잭션 사용기

## 트랜잭션 ACID

*   원자성 (Atomicity)
    *   트랜잭션 내에서 실행한 작업들은 모두 성공하거나 모두 실패
*   일관성 (Consistency)
    *   일관성 있는 데이터베이스 상태 유지 (무결성 제약 조건을 항상 만족)
*   격리성 (Isolation)
    *   동시에 실행되는 트랜잭션들이 서로에게 영향을 미치지 않아야함
*   지속성 (Durability)
    *   트랜잭션을 성공적으로 끝내면 그결과가 항상 기록되어야함

* * *

## 트랜잭션 격리 수준

*   READ UNCOMMITED (커밋되지 않은 읽기)
*   READ COMMITTED (커밋된 읽기)
*   REPEATABLE READ (반복 가능한 읽기)
*   SERIALIZABLE (직렬화 가능)

일반적으로, READ COMMITED(커밋된 읽기)가 기본적으로 사용된다

* * *

## DB 세션

1. DB 세션 이란?

- DB 세션은 클라이언트(애플리케이션 또는 사용자)가 데이터베이스에 접속하여 명령(SQL)을 실행하고 응답을 받을 수 있는 하나의 작업 흐름이다.  
- 보통 하나의 커넥션이 하나의 세션과 매핑된다.  
- SQL 실행, 트랜잭션 처리, 임시 테이블 등은 세션을 통해 관리된다.

2. DB 세션 구성 요소

| 구성 요소 | 설명 |
| --- | --- |
| 커넥션(Connection) | 클라이언트와 DB 사이의 연결. 세션은 커넥션이 존재할 때 유지된다. |
| 사용자 정보 | 로그인한 사용자 계정 정보, 권한 |
| 트랜잭션 상태 | 현재 진행 중인 트랜잭션이 있다면 그 상태 유지 |
| 세션 변수 | 사용자 설정 정보, 언어 설정 등 |

3.세션은 언제 생성되고 언제 종료되나?

*   **생성**: 클라이언트가 DB에 로그인하거나 커넥션을 맺는 순간
*   **유지**: 커넥션이 살아 있는 동안 세션도 유지됨
*   **종료**: 커넥션이 close() 되거나 타임아웃이 발생하면 세션도 종료됨

4. 예시

```text
[Client A] --connect--> [Connection A] --> [Session A]  (자신만의 트랜잭션 상태 유지)
[Client B] --connect--> [Connection B] --> [Session B]  (자신만의 트랜잭션 상태 유지)

DB 서버
 ├─ Session A: 커넥션 A와 매핑, 독립적인 트랜잭션 상태 보유
 └─ Session B: 커넥션 B와 매핑, 독립적인 트랜잭션 상태 보유
```
서로 다른 클라이언트가 각각 커넥션을 맺으면 DB 내부적으로도 각 커넥션에 대응하는 별도의 세션이 생성되어, 세션 A와 세션 B는 서로의 트랜잭션 상태에 영향을 주지 않는다.

*   데이터베이스는 내부적으로 커넥션 요청에따른 세션을 유지하게 된다.
*   일반적으로 조회의 경우, 트랜잭션이 필요 없을수 있지만 "수정/삭제/생성"에 있어서는 유지되어야하기에 세션A와 세션B가 작업적으로 독립적이어야 한다

* * *

## 순수 JDBC 트랜잭션 사용기

```text
AutoCommit = true (기본값)
INSERT ... -> 즉시 commit
UPDATE ... -> 즉시 commit
DELETE ... -> 즉시 commit
(각 SQL 구문이 하나의 독립된 트랜잭션으로 처리됨)
```

DB와 연결을 도와주는 인터페이스의 경우, 특별한 설정이 없다면 AutoCommit이 활성화 되어있다.  
(* 트랜잭션 과정은 ACID의 규칙에 따라 모든 과정이 끝난 후에 처리되어야하므로 AutoCommit은 false로 두어야한다.)

```text
con.setAutoCommit(false);
  DELETE ... ─┐
  INSERT ... ─┼─> (커밋 전까지 임시 반영, 다른 세션에서는 보이지 않음)
  con.commit(); ─┘ -> 여기서 한 번에 확정 반영 (실패 시 con.rollback())
```

```java
public void txSaveAfterDelete(Map<String, Object> params) throws Exception{
    Connection con = DBConnectionUtil.getConnection();
    con.setAutoCommit(false);
    try{
        Member oldMember =  memberRepository.findByName(params.get("oldName").toString()).orElseThrow(
                () ->  new RuntimeException("no find member")
        );

        Member uptMember = new Member();
        uptMember.setName(params.get("name").toString());
        uptMember.setAge(Integer.parseInt(params.get("age").toString()));
        uptMember.setAddr(params.get("addr").toString());

        // 1. delete 후 save()
        txMemberRepository.txDelete(con,oldMember.getName());
        txMemberRepository.txSave(con, uptMember);
        con.commit();
    }catch(Exception e){
        con.rollback();
        throw new RuntimeException("[TRANSACTION] 실패로 인한 rollback");
    }finally {
        con.setAutoCommit(true);
        if (con != null) con.close();
    }
}
```

*   설명
    *   try ~ catch를 활용한 commit(), rollback() 수행
    *   DB 세션 락을 자연스럽게 사용 (다른 세션이 사용하지 못함 - 대기상태)
*   단점
    *   코드가 복잡하다 (서비스 계층이 복잡해진다)
    *   **Connection의 경우, Repository층에서 닫을 경우 세션이 달라지는 일이 발생하므로 꼭 트랜잭션이 행해지는 구간에서 Connection 리소스를 해제해야함.**
    *   AutoCommit모드를 수동으로 관리해야하는 불편함이 존재

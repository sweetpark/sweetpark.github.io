---
title: "[SQL] DCL (grant, revoke), TCL"
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] DCL (grant, revoke), TCL

1. DCL 이란?  
2. GRANT  
3. REVOKE  
4. TCl

## DCL 이란?

*   사용자 권한 관련하여, 부여 및 회수하는 역할
*   GRANT, REVOKE를 이용하여 사용자 권한을 관리한다
*   **왜 필요한가**: 모든 사용자가 모든 테이블에 무제한 접근 가능하면 실수(혹은 악의적 접근)로 데이터가 훼손될 위험이 커진다. DCL은 "누가 어떤 객체에 어떤 연산을 할 수 있는지"를 DB 레벨에서 강제해, 애플리케이션 코드의 버그와 별개로 최소 권한 원칙(least privilege)을 지키게 한다.

## GRANT

*   권한 부여
    *   권한 대상 : {user_name | PUBLIC | role_name}
        *   user_name : 사용자
        *   PUBLIC : 모든 사용자 적용
        *   role_name :  역할명
    *   객체 대상: 데이터베이스, 테이블, 뷰. 스키마, 함수 등
    *   WITH GRANT OPTION : 해당 부여된 권한을 다른 사람에게도 권한을 줄 수 있는 권한 설정

[문법]  
  
Grant [부여하려는 권한 유형] ON [객체 대상(범위)] TO [권한대상] [WITH GRANT OPTION]
```sql
GRANT SELECT, INSERT, DELETE ON TEST_DB TO USERA WITH GRANT OPTION;
```

## REVOKE

*   권한 회수
    *   권한 대상 : {user_name | PUBLIC | role_name}
        *   user_name : 사용자
        *   PUBLIC : 모든 사용자 적용
        *   role_name :  역할명
    *   객체 대상 : 데이터베이스, 테이블, 뷰. 스키마, 함수 등

[문법]  
  
REVOKE [회수하려는 권한 유형] ON [객체 대상 (범위)] FROM [권한대상];
```sql
REVOKE SELECT, INSERT ON my_table from userA;
```

## TCL

*   트랜잭션의 제어를 담당하는 SQL언어
*   commit, rollback, savepoint, set transaction 을 사용
*   **왜 필요한가**: 하나의 비즈니스 작업(예: 계좌이체)은 여러 DML 문으로 구성되는데, 일부만 반영되면 데이터가 불일치 상태(원자성 위반)에 빠진다. TCL은 "여러 연산을 하나의 단위로 묶어, 전부 성공(COMMIT)하거나 전부 취소(ROLLBACK)"하게 만들어 데이터 일관성을 보장한다.

> [!TIP] 인용부호 주의
> 아래 예시는 문자열 값에 큰따옴표(`"..."`)를 쓰고 있는데, 표준 SQL과 Oracle/PostgreSQL에서 큰따옴표는 식별자(테이블·컬럼명)를 감싸는 용도이고 문자열 리터럴은 작은따옴표(`'...'`)를 써야 한다. MySQL은 `ANSI_QUOTES` 모드가 아닐 때만 큰따옴표를 문자열로 허용하므로, 재현성을 위해서는 작은따옴표로 통일하는 것이 안전하다.

#### TCL 4가지 예시

*   COMMIT
    *   모든 작업이 완료되어 COMMIT을 해주어 DB에 적용

```sql
Delete From my_table where username = "test";
COMMIT;
```

*   ROLLBACK
    *   이전 COMMIT 시기로 ROLLBACK

```sql
Delete From my_table where username="test";
ROLLBACK;
```

*   SAVEPOINT
    *   지점을 지정하여, 해당 commit 시점으로 되돌아감

```sql
Insert Into my_table (username, age) Values("test1", 100);
SAVEPOINT sp1;

Insert Into my_table (username, age) Values("test2" ,200);
ROLLBACK TO sp1;
COMMIT;
```

*   SET TRANSACTION
    *   총 4단계로 격리 수준이 나눠짐
        *   Read Uncommitted : 트랜잭션이 완료되지 않은 데이터 읽기
        *   Read committed : 트랜잭션이 완료된 데이터 읽기
        *   Repeatable read : 트랜잭션 동안 동일한 쿼리의 결과가 항상 동일
        *   Serializable : 가장 엄격한 격리 수준
    *   **왜 격리 수준이 여러 단계로 나뉘는가**: 격리 수준이 엄격할수록(Serializable에 가까울수록) 동시성 문제(dirty read, non-repeatable read, phantom read)는 줄지만 잠금 범위가 넓어져 동시 처리 성능이 떨어진다. 반대로 완화하면 성능은 좋아지지만 다른 트랜잭션이 커밋 전 데이터를 보거나(dirty read) 같은 쿼리 결과가 중간에 바뀌는 문제가 생길 수 있다. 즉 일관성과 동시성 사이의 트레이드오프를 애플리케이션 요구사항에 맞춰 선택하는 것이다. (구체적 기본 격리 수준은 MySQL은 Repeatable Read, Oracle/PostgreSQL은 Read Committed로 서로 다르다.)

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
Update my_tale set username = "testUser" where username="test";
COMMIT;
```

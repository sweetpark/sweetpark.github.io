---
title: [SQL] DCL (grant, revoke), TCL
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

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
Update my_tale set username = "testUser" where username="test";
COMMIT;
```

> 원문: https://gradualprecision.tistory.com/124

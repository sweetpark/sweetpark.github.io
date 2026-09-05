---
title: [SQL] VIEW
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] VIEW

1. view 란?  
2. view 사용 이유  
3. view 사용법

## VIEW 란?

*   데이터베이스에 존재하는 가상의 테이블을 말함
*   테이블의 정보를 **보여주는 역할만** 한다. **(view 정의 변경 불가능, 원본 테이블 삭제시 같이 삭제)**
*   **view를 통한 갱신을 할경우, 복잡한 제약이 있음 (왠만하면 원본테이블에서 수정)**
*   데이터를 따로 저장하지 않고, view가 바라보고 있는 테이블의 정보를 보여주는 역할
*   **기존 테이블의 정보가 수정되면, view 도 같이 반영됨**

## VIEW 사용 이유

*   테이블의 내용중에 보여주고 싶은 데이터만 보여주기 위해 사용 **(접근제어 활용)**
*   실제 데이터를 포함하지 않으므로, 저장공간을 효율적으로 사용 가능
*   **view 테이블을 복잡한 쿼리로 표현할경우, 나중에 조회시 편리하게 조회 가능**

## VIEW 사용법

```sql
CREATE TABLE User(
    id INT PRIMARY KEY,
    username VARCHAR(100),
    detail_id INT
);

CREATE TABLE DetailUser(
    detail_id INT PRIMARY KEY,
    address VARCHAR(100)
);

Insert Into User (id, username, detail_id) Values (1, 'test', 100),(2, 'SQL', 200);
Insert Into DetailUser (detail_id, address) Values (100,'seoul'), (200, 'busan');

CREATE VIEW ViewTest
AS SELECT User.id, User.username, DetailUser.address
FROM User
JOIN DetailUser ON User.detail_id = DetailUser.detail_id;

Select * From ViewTest;

-- [ 출력 결과 ] --
-- 1 / test / seoul
-- 2 / SQL / busan
```

> 원문: https://gradualprecision.tistory.com/127

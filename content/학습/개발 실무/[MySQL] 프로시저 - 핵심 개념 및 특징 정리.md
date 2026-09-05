---
title: 프로시저
tags: [학습, 개발실무, 저장소-&-데이터베이스]
created: 2026-02-04
modified: 2026-09-05
---

# 프로시저

> [!NOTE]
> MySQL 저장 프로시저(Stored Procedure)의 생성 문법, 동적 SQL(PREPARE/EXECUTE), IF 조건 처리 요약.
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 1. 프로시저 문법

```sql
-- 동일한 이름의 프로시저는 생성 불가 → 먼저 제거
DROP PROCEDURE IF EXISTS [DB명].[프로시저이름];

DELIMITER $$
CREATE PROCEDURE [DB명].[프로시저 이름](
    -- 파라미터
    IN iNUM INT
)
BEGIN
    -- 변수 선언
    DECLARE [변수명] [변수타입];
    DECLARE cur_date DATE;
    -- ...

    -- 쿼리문
    SELECT iNUM;
    -- ...

    -- 복잡한 쿼리문의 경우 (문자열로 SQL을 만들고 실행)
    SET @[쿼리 문자열 변수명] = CONCAT('ALTER TABLE .... WHERE id = ', iNUM);

    -- 쿼리를 담을 변수명(ex: stmt)
    PREPARE stmt FROM @[쿼리 문자열 변수명];
    -- 쿼리 실행
    EXECUTE stmt;
    -- 준비된 문장의 메모리 해제
    DEALLOCATE PREPARE stmt;
END $$
DELIMITER ;
```

> [!NOTE]
> `DELIMITER`는 프로시저 본문 내부의 `;`를 문장 종결자로 오해하지 않도록 구분자를 임시로 `$$` 등으로 바꾸는 것이며, 생성 후 다시 `;`로 되돌린다.

> [!IMPORTANT]
> DBeaver의 경우 프로시저를 만드는 폴더(Procedures)가 따로 있음. 일반 SQL 실행 창에서 만들면 적용이 안 될 수 있다.

### 2. 프로시저 IF문

```sql
BEGIN
    SELECT COUNT(*) INTO @[변수명]
    FROM [테이블명];

    IF @[변수명] = 0 THEN
        [실제 수행할 내용]
    END IF;
END $$
```

### 3. 프로시저 요약

```sql
-- 변수 선언 (2가지 방법)
-- [선언] [변수명] [변수타입]
DECLARE test TEXT;   -- 1) 지역 변수
SET @test = '';      -- 2) 세션 변수

-- 복잡한 쿼리문 (준비 - 실행 - 메모리 해제)
PREPARE  [변수명] FROM @[문자열];
EXECUTE  [변수명];
DEALLOCATE PREPARE [변수명];

-- 조건
IF [조건] THEN
    [body]
END IF;
```

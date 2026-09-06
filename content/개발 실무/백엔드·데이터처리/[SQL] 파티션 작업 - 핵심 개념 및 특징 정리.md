---
title: "파티션 작업"
tags: [학습, 개발실무, 저장소-&-데이터베이스]
created: 2026-02-04
modified: 2026-09-05
---

# 파티션 작업

> [!NOTE]
> 큰 테이블을 논리적 단위로 나누는 파티셔닝의 문법(생성·추가·삭제·재배치)과 종류(Range/List/Hash/Key) 정리.
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 1. 파티션 문법

```sql
-- 기존 테이블에 파티션을 만들 경우 (RANGE 외에도 다른 방식 존재)
ALTER TABLE [테이블] PARTITION BY RANGE ([숫자 or DATETIME]) (
    PARTITION [파티션명] VALUES LESS THAN (나눌 기준 값),
    PARTITION [파티션명] VALUES LESS THAN (나눌 기준 값),
    PARTITION [파티션명] VALUES LESS THAN (나눌 기준 값)
);

-- 기존 파티션이 있는 경우 파티션 추가
ALTER TABLE [테이블] ADD PARTITION (
    PARTITION [파티션명] VALUES LESS THAN (나눌 기준 값)
);

-- 파티션 확인
SELECT PARTITION_NAME
FROM   information_schema.PARTITIONS
WHERE  PARTITION_NAME LIKE '[파티션명]';

-- 파티션 삭제 (+ 데이터도 함께 삭제)
ALTER TABLE [테이블] DROP PARTITION [파티션명];

-- 파티션 재배치 (범위가 중복될 경우)
ALTER TABLE [테이블] REORGANIZE PARTITION [중복되는 파티션] INTO (
    PARTITION [새로운 파티션1] VALUES LESS THAN (3022),
    PARTITION [새로운 파티션2] VALUES LESS THAN MAXVALUE
);
```

### 2. 파티션 종류

1. **Range 파티션**
    - 범위 기반(숫자, 날짜)으로 나누어 파티셔닝
    - 파티션 프루닝이 이루어져야 파티션 효과를 볼 수 있음

    > [!NOTE]
    > 파티션 프루닝(Partition Pruning): 조회 조건에 해당하는 파티션만 스캔하고 나머지는 건너뛰어 성능을 높이는 최적화.

2. **List 파티션**
    - 원하는 값 목록으로 파티션을 지정
    - 값이 고정적이어서 지정한 값들이 있는 경우에 유용(enum 같은 케이스)
    - 문자열 기준으로도 가능
3. **해시(Hash) 파티션**
    - 별다른 기준이 없고 테이블이 너무 커서 분리하고 싶을 때 사용
    - 파티션 추가 시 모든 파티션의 데이터 재배치가 일어남
    - 파티션 분할/병합/삭제 지원 안 함
4. **키(Key) 파티션**
    - 해시와 유사하지만 데이터 타입을 키로 다룰 수 있다는 것이 장점

### 3. 실전 적용 — 문자열 날짜 컬럼 + Generated Column으로 파티셔닝

MySQL `PARTITION BY RANGE`는 파티션 기준 컬럼이 **정수형(또는 정수로 캐스팅되는 표현식)** 이어야 한다. 그런데 운영 테이블의 날짜 컬럼이 `VARCHAR(14)`(예: `'20250210235959'`)로 저장돼 있는 경우가 흔한데, 이 상태로는 파티션 기준 컬럼으로 쓸 수 없다(문자열 자체로는 파티셔닝 불가 — 반드시 정수 캐스팅이 필요).

**해결**: Generated Column으로 정수형 파생 컬럼을 만들고, 그 컬럼을 파티션 키로 쓴다.

```sql
-- STORED: 값을 실제로 저장(디스크 사용, 조회 빠름) / VIRTUAL: 조회 시마다 계산(디스크 절약)
ALTER TABLE my_table
  ADD COLUMN date_num BIGINT GENERATED ALWAYS AS (CAST(date_col AS UNSIGNED)) STORED;

ALTER TABLE my_table PARTITION BY RANGE (date_num) (
    PARTITION p_old    VALUES LESS THAN (20241000000000),
    PARTITION p_202410 VALUES LESS THAN (20241100000000),
    PARTITION p_202411 VALUES LESS THAN (20241200000000)
    -- ... 월별로 계속 추가
);
```

- 원본 문자열 컬럼(`date_col`)은 그대로 유지하고, 조회 조건도 파티션 키(`date_num`)를 향하도록 바꿔야 **파티션 프루닝**이 실제로 동작한다(원본 문자열 컬럼으로 조회하면 파티션을 안 타고 전체 스캔한다).
- 인덱스 생성 여부는 삽입/조회 빈도로 판단한다 — 짧은 주기로 매우 자주 INSERT되는 로그성 테이블이라면, 조회보다 삽입 비중이 훨씬 커서 인덱스를 안 만드는 편이 더 이로울 수 있다(파티션 자체가 이미 스캔 범위를 줄여주므로).

**자동 파티션 순환(월별 생성/오래된 것 삭제) — 이벤트 스케줄러 + 프로시저**

운영 중 매달 새 파티션을 만들고, 보관 기간이 지난 오래된 파티션은 지워야 한다면 프로시저 하나로 자동화할 수 있다.

```sql
DELIMITER $$
CREATE PROCEDURE partition_manage()
BEGIN
    DECLARE cur_date DATE;
    DECLARE keep_from INT;        -- 보관 시작 기준 YYYYMM(숫자)
    DECLARE next_month CHAR(6);
    DECLARE next_bound BIGINT;
    DECLARE partitions_to_drop TEXT;

    SET cur_date   = CURDATE();
    SET keep_from  = CAST(DATE_FORMAT(DATE_SUB(cur_date, INTERVAL 2 MONTH), '%Y%m') AS UNSIGNED);
    SET next_month = DATE_FORMAT(DATE_ADD(cur_date, INTERVAL 1 MONTH), '%Y%m');
    SET next_bound = CAST(CONCAT(DATE_FORMAT(DATE_ADD(cur_date, INTERVAL 2 MONTH), '%Y%m'), '00000000') AS UNSIGNED);

    -- 보관 기간 지난 파티션 삭제
    SELECT GROUP_CONCAT(PARTITION_NAME) INTO partitions_to_drop
      FROM information_schema.PARTITIONS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'my_table'
       AND PARTITION_NAME LIKE 'p_%'
       AND CAST(SUBSTRING(PARTITION_NAME, LENGTH('p_') + 1) AS UNSIGNED) < keep_from;

    IF partitions_to_drop IS NOT NULL THEN
        SET @stmt = CONCAT('ALTER TABLE my_table DROP PARTITION ', partitions_to_drop);
        PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;

    -- 다음 달 파티션 미리 생성
    SET @stmt = CONCAT('ALTER TABLE my_table ADD PARTITION (PARTITION p_', next_month,
                        ' VALUES LESS THAN (', next_bound, '))');
    PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
END $$
DELIMITER ;
```

이벤트 스케줄러로 매달 자동 실행되도록 등록한다.

```sql
SET GLOBAL event_scheduler = ON;

ALTER EVENT partition_event
  ON SCHEDULE EVERY 1 MONTH
  STARTS '2025-03-01 00:00:00'
  ON COMPLETION NOT PRESERVE ENABLE
  COMMENT '1달마다 파티션 자동 순환'
  DO CALL partition_manage();
```

> MySQL 8에서는 이벤트 본문에 `BEGIN...END` 블록 없이 단일 `CALL` 문만 두는 형태가 필요할 수 있다(버전별 문법 차이 확인).

### 파티션 도입 효과(실측)

문자열 날짜 컬럼에 `BETWEEN` 조건을 걸던 대용량 로그성 테이블에서, "쿼리 분리 + 불필요한 JOIN 제거 + 월별 파티셔닝"을 함께 적용해 Full Table Scan을 파티션 단위 스캔으로 좁힌 사례가 있다 — 파티션을 타면서 저장되므로 테이블 전체가 아니라 해당 파티션만 스캔 대상이 되어(全 스캔 범위 자체가 줄어듦), 조회 시간이 눈에 띄게 단축됐다.

## 관련 문서

- [(MySQL) 이벤트처리 - 핵심 개념 및 특징 정리](./[MySQL]%20이벤트처리%20-%20핵심%20개념%20및%20특징%20정리.md) — 자동 파티션 순환(월별 생성/삭제)에 쓰인 CREATE EVENT 스케줄러 문법 상세
- [(MySQL) 프로시저 - 핵심 개념 및 특징 정리](./[MySQL]%20프로시저%20-%20핵심%20개념%20및%20특징%20정리.md) — 파티션 자동 관리 프로시저(`partition_manage`)에 쓰인 DECLARE/PREPARE-EXECUTE 문법 상세

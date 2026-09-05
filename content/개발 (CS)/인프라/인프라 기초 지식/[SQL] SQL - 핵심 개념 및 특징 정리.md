---
title: "SQL"
tags: [학습, 개발-CS, 인프라, 인프라-기초-지식, 개발, 인프라기초]
modified: 2026-09-05
---

# SQL

> [!NOTE]
> SQL 기초 문법 정리. 필드 조회(SELECT), 조건식(WHERE), 정렬(ORDER BY), JOIN, 집합 연산(UNION), 서브쿼리, CRUD 구문.

> [!NOTE]
> 원문의 스마트 따옴표·연산자 오타(`≤`, `NOT IS NULL`, `MINUSM INSESET` 등)를 표준 SQL로 교정함(사실 확인 권장).

## 💻 예시

### 필드 조회 (SELECT)

```sql
-- 단일/여러 필드 조회
SELECT 필드이름 FROM 테이블;
SELECT 필드이름1, 필드이름2 FROM 테이블;

-- 모든 필드 조회
SELECT * FROM 테이블;

-- 중복 제거 조회
SELECT DISTINCT 필드이름 FROM 테이블;

-- 조건식 적용
SELECT * FROM 테이블 WHERE 필드이름 = 0;

-- 여러 조건식
SELECT *
FROM 테이블
WHERE 필드이름1 = 0
  AND 필드이름2 = 0
  OR  필드이름3 = 0;
```

### 조건식의 종류

```sql
WHERE 필드이름 BETWEEN 0 AND 100;
WHERE 필드이름 NOT BETWEEN 0 AND 100;

WHERE 필드이름 IN (0, 10, 100);
WHERE 필드이름 NOT IN (0, 10, 100);

WHERE 필드이름 IS NULL;
WHERE 필드이름 IS NOT NULL;

WHERE 필드이름 LIKE '홍__';      -- '_' : 한 글자 매칭
WHERE 필드이름 NOT LIKE '홍__';
WHERE 필드이름 LIKE '홍%';       -- '%' : 0글자 이상 매칭
WHERE 필드이름 NOT LIKE '홍%';
```

### 정렬 (ORDER BY)

```sql
-- 특정 필드 기준 정렬
SELECT 필드이름 FROM 테이블 ORDER BY 필드이름;

-- 정렬 기준이 여러 개
SELECT 필드이름
FROM 테이블
ORDER BY 필드이름1, 필드이름2 DESC, 필드이름3 ASC;
```

### JOIN

```sql
-- 내부 조인
SELECT 테이블1.필드이름
FROM 테이블1, 테이블2
WHERE 테이블1.필드이름 = 테이블2.필드이름;

-- 별칭으로 간소화
SELECT A.필드이름
FROM 테이블1 A, 테이블2 B
WHERE A.필드이름 = B.필드이름;

-- 외부 조인 (Oracle (+) 문법)
SELECT A.필드이름
FROM 테이블1 A, 테이블2 B
WHERE A.필드이름 = B.필드이름(+);
```

> [!NOTE]
> 위 예시는 원문 그대로 암시적 조인(`FROM A, B`) 형태다. 실무에서는 `JOIN ... ON` 명시적 조인 사용을 권장한다.

### 집합 연산 (UNION)

```sql
SELECT 필드이름 FROM 테이블1
UNION            -- 또는 UNION ALL, MINUS, INTERSECT
SELECT 필드이름 FROM 테이블2;
```

### 서브쿼리

```sql
-- 서브쿼리 결과가 하나
SELECT 필드이름1
FROM 테이블
WHERE 테이블.필드이름 <= (
    SELECT 필드이름2
    FROM 테이블
    WHERE 조건문
);

-- 서브쿼리(중첩) 결과가 여러 개 (IN 외에 ANY, ALL, EXISTS 사용 가능)
SELECT 필드이름1
FROM 테이블
WHERE 테이블.필드이름2 IN (
    SELECT 필드이름2
    FROM 테이블
    WHERE 조건문
);
```

### CRUD

```sql
-- CREATE
INSERT INTO 테이블 (필드이름1, 필드이름2)
VALUES (값1, 값2);

-- UPDATE
UPDATE 테이블
SET 필드이름1 = 값1, 필드이름2 = 값2
WHERE 조건문;

-- DELETE
DELETE FROM 테이블
WHERE 조건문;
```

---
title: SQL 쿼리 튜닝 방법
tags: [학습, 개발실무, 저장소-&-데이터베이스]
created: 2026-02-04
modified: 2026-09-05
---

# SQL 쿼리 튜닝 방법

> [!NOTE]
> 인덱스를 잘 타도록 쿼리를 작성하는 대표 튜닝 기법 모음(좌변 연산 회피, OR→UNION ALL, 서브쿼리, 윈도우 함수, 와일드카드 위치 등).
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 좌변을 연산하지 않는다 (원본 데이터 정제 작업 피하기)

**[문제]**

- 인덱스는 원본 컬럼 값을 기준으로 생성되므로, 좌변에 함수를 씌워 정제하면 인덱스를 제대로 타지 못할 수 있다(비-SARGable).

```sql
SELECT * FROM member WHERE YEAR(regist_day) = 2025;
```

**[해결책]**

- 원본 데이터를 정제하지 않고 우변을 범위로 표현한다.

```sql
SELECT * FROM member WHERE regist_day BETWEEN '2025-01-01' AND '2025-12-31';
```

### OR 연산 대신 UNION ALL 사용

**[문제]**

- OR 연산은 인덱스를 잘 활용하지 못할 수 있다.
    - 인덱스는 단일 값의 빠른 검색에 최적화되어 있음.
    - OR 연산 시 인덱스를 각 조건마다 작업하고 병합해야 함 → 경우에 따라 풀스캔, 인덱스 병합 비용 발생.

```sql
SELECT * FROM member WHERE name = 'park' OR name = 'kim';
```

**[해결책]**

- `UNION ALL`을 사용하면 각 조건이 독립적으로 인덱스를 활용하고, 병합을 UNION으로 처리해 효율적이다(`UNION ALL`은 중복 제거를 하지 않아 더 빠름).

```sql
SELECT * FROM member WHERE name = 'park'
UNION ALL
SELECT * FROM member WHERE name = 'kim';
```

### 서브쿼리로 필요한 데이터만 추출 (+ 필요한 컬럼만 조회)

- 인라인 뷰(FROM 절 서브쿼리)와 JOIN을 이용해 필요한 행만 출력한다.

```sql
SELECT m.name, m.id, m.money
FROM   member m
INNER JOIN (
    SELECT id, MAX(money) AS max_money
    FROM   money_log
    GROUP BY id
) o ON o.id = m.id AND m.money = o.max_money;
```

> [!NOTE]
> **서브쿼리 주의점**
> - 상관 서브쿼리: 외부 쿼리의 행 값을 참조하므로 행 단위로 반복 실행된다(성능 주의).
>   ```sql
>   SELECT t1.col1,
>          (SELECT t2.col2 FROM another_table t2 WHERE t2.id = t1.id) AS col2_sub
>   FROM main_table t1;
>   ```
> - 비상관 서브쿼리: 외부 행과 무관하여 한 번(또는 매우 적게)만 실행된다.
>   ```sql
>   SELECT col1,
>          (SELECT MAX(col2) FROM another_table) AS max_val
>   FROM main_table;
>   ```

### 분석 함수(윈도우 함수) 활용

**[문제]**

- 집계 함수를 쓰려면 데이터를 사전에 그룹화해야 하고, 그러면 원본 행이 그룹 단위로 접힌다.

```sql
SELECT name, COUNT(*) AS cnt FROM member GROUP BY name;
```

> [!NOTE]
> [결과] — 그룹 단위로 행이 접힘
> ```
> testName   4
> testName2  2
> testName3  2
> testName4  2
> ```

**[해결책]**

- `COUNT(*) OVER (PARTITION BY 컬럼)` 윈도우 함수를 쓰면 **행을 접지 않고** 그룹별 집계 값을 각 원본 행에 붙일 수 있다.
- 분석 함수 특징: 행의 집계(그룹 접힘)가 일어나지 않는다.

```sql
SELECT name, COUNT(*) OVER (PARTITION BY name) AS cnt FROM member;
```

> [!NOTE]
> [결과] — 원본 행 수는 유지되고 각 행에 그룹 집계 값이 붙음
> ```
> testName   4
> testName   4
> testName   4
> testName   4
> testName2  2
> testName2  2
> testName3  2
> testName3  2
> testName4  2
> testName4  2
> ```

### 와일드카드는 끝에 작성

**[문제]**

- 와일드카드(`%`)가 앞에 오면 인덱스가 있어도 풀스캔에 가까운 조회를 하게 될 수 있다.

```sql
SELECT * FROM member WHERE name LIKE '%Test';
```

**[해결책]**

- 와일드카드를 뒤에 두면 시작 문자열을 기준으로 인덱스를 활용할 수 있다.

```sql
SELECT * FROM member WHERE name LIKE 'Test%';
```

### 페이징 목록 조회와 COUNT를 분리한다

**[문제]**

- 페이징 처리를 위한 전체 건수(`totCnt`)를 조회 쿼리 내부에 서브쿼리로 넣으면, 그 서브쿼리가 **목록의 매 행마다 반복 실행**되어 매우 느려질 수 있다.

```sql
-- 느림 — totCnt 서브쿼리가 매 행 실행됨
SELECT a.*, (SELECT COUNT(*) FROM ... WHERE ...) AS totCnt
  FROM ...
```

**[해결책]**

- "목록 조회용 SQL"과 "totCnt(페이징용) SQL"을 완전히 분리된 두 개의 쿼리로 나눈다. 실측 사례에서 응답 시간이 약 60% 단축됐다(5초 → 2초, EXPLAIN상 `Using join buffer` 반복 실행 제거).

```sql
-- ① 목록 조회 전용
SELECT a.col1, a.col2, ... FROM ... WHERE ... ORDER BY ... LIMIT ?, ?;

-- ② totCnt 전용 (동일 WHERE 조건, 페이징 없이 건수만)
SELECT COUNT(*) AS totCnt FROM (
    SELECT a.pk FROM ... WHERE ...   -- 동일 필터 조건
) t;
```

- 두 쿼리는 완전히 독립적으로 실행되므로, 전체 목록 대상 행 수와 무관하게 각 쿼리의 실행 계획이 일정하게 유지된다.

### 계산값을 저장하고 활용하기

> [!TIP]
> - 자주 사용되는 복잡한 계산은 별도의 계산 결과 테이블을 두어 매번 계산하지 않도록 한다.
> - 데이터 변경에 따라 계산 결과를 주기적으로(배치 또는 일정 주기) 갱신한다.

## 🔗 참고

- [(SQL) 인덱스 설계와 쿼리 재구성 패턴 - 핵심 개념 및 특징 정리](../데이터베이스/SQL/[SQL]%20인덱스%20설계와%20쿼리%20재구성%20패턴%20-%20핵심%20개념%20및%20특징%20정리.md) — leftmost-prefix, 집계 후 JOIN, EXPLAIN 등 더 깊은 인덱스 설계 패턴은 이쪽에 분리 정리

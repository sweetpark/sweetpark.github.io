---
title: 인덱스 설계와 쿼리 재구성 패턴
tags: [학습, 데이터베이스, SQL, 인덱스, 성능]
modified: 2026-09-05
---

# 인덱스 설계와 쿼리 재구성 패턴

> [!NOTE]
> EXPLAIN으로 병목을 읽는 법, 복합 인덱스의 leftmost-prefix 규칙, "집계 후 JOIN"으로 조인 비용을 줄이는 재구성 패턴, 세션 변수 대신 윈도우 함수를 쓰는 이유를 정리. 기본적인 SARGable 튜닝 기법은 [(SQL) SQL 쿼리 튜닝 방법 - 핵심 개념 및 특징 정리](../../개발%20실무/[SQL]%20SQL%20쿼리%20튜닝%20방법%20-%20핵심%20개념%20및%20특징%20정리.md)에 정리되어 있고, 이 노트는 인덱스 설계·쿼리 구조 재작성에 초점을 맞춘다.

---

## 1. EXPLAIN 핵심 요약

| 컬럼 | 의미 |
|---|---|
| `type` | 테이블 접근 방식(성능 핵심 지표) — `system > const > eq_ref > ref > range > index > ALL`(최악) 순 |
| `possible_keys` / `key` | 후보 인덱스 / 실제 선택된 인덱스. `possible_keys`는 있는데 `key`가 NULL이면 후보는 있었으나 옵티마이저가 풀스캔이 낫다고 판단한 것 |
| `Extra` | `Using filesort`(별도 정렬 발생), `Using temporary`(임시 테이블), `Using index`(커버링 인덱스, 좋음) |

**위험한 조합**: `Using temporary` + `Using filesort`가 함께 나오면 GROUP BY로 임시 테이블을 만들고 그 안에서 다시 정렬하는 것 — 가장 나쁜 조합이며 인덱스 설계 재검토가 필요하다는 신호다.

**읽는 순서**: id가 큰 행(가장 안쪽 서브쿼리)부터 읽는다 — EXPLAIN은 바깥→안쪽 순서로 나열하지만 실제 실행은 안쪽→바깥이기 때문이다.

---

## 2. Leftmost-Prefix 규칙 — 복합 PK/인덱스의 선두 컬럼이 조회 조건과 안 맞으면 무용지물

InnoDB의 B-Tree 인덱스(PK 포함)는 **선두 컬럼 순서대로 물리 정렬**된다. 조회 조건이 선두 컬럼을 포함하지 않으면, 옵티마이저는 "어느 블록에서 스캔을 시작해야 하는지" 특정할 수 없어 풀스캔을 택한다.

```text
예) PK = (A, B, C, D)
    WHERE B BETWEEN ? AND ?   ← A 조건이 없음

A가 선두 컬럼이므로, "A=x인 행들의 B 값"이 인덱스 전체에 산재한다.
→ Leftmost Prefix 위반 → Full Table Scan
```

**해결**: 실제 조회 패턴(조건 컬럼 + 정렬 컬럼)을 선두부터 정확히 포함하는 **별도 보조 인덱스**를 만든다. 조건이 있을 때/없을 때로 조회 패턴이 갈리면(예: 부가 필터가 optional인 동적 쿼리), 패턴별로 인덱스를 각각 만들고 각 패턴에서 EXPLAIN으로 실제 선택되는지 검증한다.

```sql
-- 부가조건 없이 조회할 때: 범위조건 컬럼을 선두에
CREATE INDEX idx_a ON TABLE_X (조회조건컬럼, 그룹컬럼, 부가조건컬럼);

-- 부가조건이 자주 붙을 때: 등치조건(부가조건)을 선두에
CREATE INDEX idx_b ON TABLE_X (부가조건컬럼, 조회조건컬럼, 그룹컬럼);
```

> MyBatis 동적 SQL(`<if>`)로 조회 조건이 화면 입력에 따라 붙었다 빠졌다 하는 쿼리는, **패턴마다 다른 인덱스가 선택**되므로 패턴 수만큼 인덱스 후보를 준비하고 각각 검증해야 한다.

**커버링 인덱스**: 조건 컬럼뿐 아니라 SELECT하는 컬럼까지 인덱스에 포함시키면, 테이블 랜덤 I/O 없이 인덱스만으로 결과를 완성(Index Only Scan)할 수 있다. 단, 인덱스 크기가 커지므로 디스크 공간·INSERT 부하 증가를 감안해야 한다.

---

## 3. 집계 후 JOIN — 조인 비용을 접근 횟수 단위로 줄이기

원본 행에 JOIN을 먼저 걸고 나중에 GROUP BY로 접는 구조는, **원본 행 수 × JOIN 테이블 수**만큼 조인 접근이 발생한다.

```text
Before: 원본 N건 × JOIN 3회 = 3N회 접근
        FROM 큰테이블 JOIN A JOIN B JOIN C GROUP BY ...

After:  집계 결과 M건(M ≪ N) × JOIN 3회 = 3M회 접근
        FROM (SELECT ... FROM 큰테이블 GROUP BY ...) 집계결과
        JOIN A JOIN B JOIN C
```

집계(GROUP BY)를 먼저 끝내 결과 건수를 확 줄인 뒤, 그 소수의 결과에만 JOIN을 거는 순서로 바꾸면 조인 접근 횟수가 원본 행 수가 아니라 집계 결과 건수에 비례하게 된다. 실측 사례에서 십수~수십 배의 접근 횟수 감소가 나타난다.

**부가 주의 — 코드 테이블 JOIN 시 rows 뻥튀기 위험**: 코드/속성 테이블을 조인할 때 조인 조건이 그 테이블의 PK를 완전히 지정하지 않으면(예: 다중 속성 컬럼 중 일부만 조건을 줌) 한 코드에 여러 행이 매칭되어 **집계 결과가 배로 뻥튀기**될 수 있다. 조인 조건에 그 테이블의 PK 컬럼을 전부 명시해서 반드시 1:1 매칭이 되도록 방어한다.

---

## 4. 세션 변수(`@rownum`) 대신 윈도우 함수

번호를 매기는 관용구로 세션 변수를 쓰는 경우가 있다.

```sql
-- 위험 — 세션(커넥션) 변수 방식
SELECT @rownum := @rownum + 1 AS ROW, ...
FROM (...) t, (SELECT @rownum := 0) init
```

문제점:
- 커넥션 풀 재사용 시 이전 세션의 값이 잔류할 위험
- 암시적 크로스 조인으로 코드 의도가 불명확
- 옵티마이저의 실행 순서에 따라 초기화 시점이 보장되지 않음

**대안**: `ROW_NUMBER() OVER (ORDER BY ...)` 윈도우 함수(MariaDB 10.2+/MySQL 8+ 지원)로 교체하면 세션 의존성이 완전히 사라지고, 암시적 크로스 조인(초기화용 서브쿼리)도 자연히 제거된다.

---

## 5. GROUP BY와 파생 컬럼(alias) 참조 주의

```sql
-- 비표준 확장 문법 — GROUP BY에서 SELECT의 alias를 그대로 참조
SELECT CASE WHEN ... THEN ... END AS TERM_V, ...
  FROM T
 GROUP BY TERM_V        -- alias 참조

-- 표준적인 형태 — GROUP BY에도 동일 표현식을 그대로 기술
 GROUP BY CASE WHEN ... THEN ... END
```

alias 참조는 일부 DB(MySQL/MariaDB)의 비표준 확장이라 이식성이 떨어지고, `ORDER BY`가 파생 이전 원본 컬럼을 참조하면(예: 월별로 묶었는데 `ORDER BY 원본날짜컬럼`) **그룹 내에서 어떤 값이 뽑힐지 정의되지 않은 동작**이 된다. GROUP BY/ORDER BY 모두 파생된 결과(TERM_V 등) 기준으로 통일해야 한다.

---

## 6. LIMIT 없는 동적 쿼리 — 방어적 기본값

MyBatis `<if>`로 LIMIT 파라미터가 optional이면, 파라미터가 안 들어왔을 때 전체 결과가 그대로 반환될 위험이 있다. `<choose>/<otherwise>`로 기본 상한(LIMIT 0, N)을 강제하면 이 위험을 없앨 수 있다.

```xml
<choose>
    <when test="stRow != null and iRows != null and iRows > 0">
        LIMIT #{stRow}, #{iRows}
    </when>
    <otherwise>
        LIMIT 0, 500
    </otherwise>
</choose>
```

---

## 7. 온라인 DDL — 운영 중 인덱스 생성

대용량 테이블에서 `CREATE INDEX`는 테이블 잠금이나 I/O 급증을 유발할 수 있다. 트래픽이 낮은 시간대에 온라인 DDL 옵션을 붙여 실행한다.

```sql
CREATE INDEX idx_x ON TABLE_X (컬럼) ALGORITHM=INPLACE, LOCK=NONE;
```

---

## 8. 요약 체크리스트

```text
[ ] EXPLAIN에서 type=ALL/Using temporary+filesort가 보이는가?
[ ] WHERE 조건 컬럼이 PK/인덱스의 leftmost 컬럼과 일치하는가? (동적 조건이면 패턴별 인덱스 검토)
[ ] 집계(GROUP BY) 이전에 JOIN이 걸려 원본 행 수만큼 조인 접근이 발생하지 않는가? → 집계 먼저, JOIN 나중
[ ] 코드/속성 테이블 JOIN 조건이 그 테이블 PK를 완전히 지정하는가? (rows 뻥튀기 방지)
[ ] @rownum 세션 변수를 쓰고 있는가? → ROW_NUMBER() OVER()로 교체
[ ] GROUP BY가 alias를 참조하는가? → 표현식을 그대로 기술
[ ] LIMIT이 옵션인데 기본 상한이 없는가? → <choose> 기본값 강제
[ ] 운영 중 인덱스를 추가하는가? → ALGORITHM=INPLACE, LOCK=NONE + 저트래픽 시간대
```

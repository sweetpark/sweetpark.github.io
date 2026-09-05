---
title: "MySQL 5.7→8.0 마이그레이션 함정 체크리스트"
tags: [학습, 개발-CS, 데이터베이스, MySQL, 마이그레이션]
modified: 2026-09-05
---

# MySQL 5.7→8.0 마이그레이션 함정 체크리스트

> [!NOTE]
> MySQL 5.7 기반으로 작성된 레거시 프로젝트를 8.0(또는 MariaDB 최신 버전)으로 올릴 때 실제로 걸렸던 SQL 구문 오류 유형과 원인·해결책을 정리한 체크리스트. 실무(레거시 프로젝트 DB 버전업)에서 추출·일반화.

---

## 왜 필요한가

클라우드 벤더가 특정 구버전 MySQL 지원을 중단하는 경우(신규 인스턴스 생성 불가 등) 강제로 버전을 올려야 하는 상황이 생긴다. 버전이 오르면 SQL 파서의 엄격도와 기본 `sql_mode`가 달라져, 5.7에서 아무 문제 없이 돌던 쿼리가 8.0/최신 MariaDB에서 **500 에러**를 내는 경우가 다수 발생한다. 아래는 실제로 걸렸던 유형별 정리다.

---

## 1. 컬럼명 모호(ambiguous) 오류

**증상**
```text
java.sql.SQLIntegrityConstraintViolationException: Column 'xxx' in where clause is ambiguous
```

**원인**: INNER JOIN한 두 테이블에 동일한 이름의 컬럼이 존재하는데, WHERE 절에서 테이블 별칭 없이 컬럼명만 썼을 때 발생한다. 구버전에서는 관대하게 넘어가던 것이 신버전 파서에서 엄격하게 걸린다.

**해결**: WHERE 조건의 모든 컬럼에 반드시 테이블 별칭을 명시한다.

```sql
-- Bad
WHERE dong = #{dong}
-- Good
WHERE m.dong = #{dong}
```

---

## 2. DATETIME 값 범위 초과

**증상**
```text
java.sql.SQLException: Incorrect DATETIME value: '20250123999999'
```

**원인**: 날짜 범위 검색에서 "하루의 끝"을 표현하려고 시분초 자리에 관용적으로 `999999`를 붙이는 패턴이 있는데, DATETIME 최댓값은 `235959`(23시59분59초)이지 `999999`가 아니다. 구버전은 이런 값을 느슨하게 파싱했지만 신버전은 엄격하게 거부한다.

**해결**: 하루의 끝을 나타낼 때는 반드시 `235959`를 사용한다.

```java
// Bad
dateTo += "999999";
// Good
dateTo += "235959";
```

(또는 DB 함수로 명시적 캐스팅/범위 처리를 해도 된다.)

---

## 3. `ONLY_FULL_GROUP_BY` 위반

**증상**
```text
Expression #1 of SELECT list is not in GROUP BY clause and contains nonaggregated column 'xxx'
which is not functionally dependent on columns in GROUP BY clause;
this is incompatible with sql_mode=only_full_group_by
```

**원인**: 신버전은 기본 `sql_mode`에 `ONLY_FULL_GROUP_BY`가 포함되어, GROUP BY로 묶은 컬럼이 아니면서 집계 함수도 아닌 컬럼을 SELECT에 넣으면 오류를 낸다. 구버전에서는 이런 쿼리가 "묶이지 않은 첫 행의 값"을 임의로 반환하며 통과했다.

**해결 옵션**:
1. **쿼리를 표준에 맞게 고친다**(권장) — SELECT하는 모든 비집계 컬럼을 GROUP BY에 포함시키거나, 집계 함수(MAX/MIN 등)로 감싼다.
2. **급한 경우 세션/전역 `sql_mode`에서 `ONLY_FULL_GROUP_BY`를 제거**한다(임시 우회, 근본 해결 아님 — 다른 신버전 배포 환경에서 다시 걸릴 수 있으므로 가능하면 1번을 택한다).

```sql
SELECT @@sql_mode;
SET @@sql_mode = REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', '');       -- 세션
SET GLOBAL sql_mode = REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', '');  -- 전역
```

---

## 4. 드라이버/클라이언트 연결 이슈

- **Public Key Retrieval 오류**: 신버전 기본 인증 플러그인이 바뀌면서 발생. 접속 URL에 `useSSL=false&allowPublicKeyRetrieval=true` 옵션을 추가하거나, DB 클라이언트 도구에서 Host 방식 대신 URL 직접 입력 방식으로 접속하면 우회되는 경우가 있다(클라이언트 툴의 인증 처리 경로 차이로 추정).
- **버전 간 데이터 이관**: MariaDB↔MySQL 등 벤더가 다른 버전 간 데이터 이관은 전용 마이그레이션 툴(SQLyog 등)을 쓰는 편이 안전하다.

---

## 5. 마이그레이션 전 점검 체크리스트

```text
[ ] JOIN 하는 테이블 간 동일 컬럼명이 있는가? → WHERE/ON 절 전체에 테이블 별칭 강제 점검
[ ] 날짜 범위 검색에서 '999999' 관용 패턴을 쓰고 있는가? → '235959'로 전수 치환
[ ] GROUP BY 쿼리에서 비집계·비그룹 컬럼을 SELECT하고 있는가? → ONLY_FULL_GROUP_BY 대비 쿼리 재작성
[ ] 신버전에서 전체 화면을 QA 환경(신버전 DB)에 붙여 페이지별 회귀 테스트를 했는가?
[ ] 클라이언트 도구(DBeaver 등) 접속 설정도 신버전 인증 방식에 맞게 갱신했는가?
```

> 버전업은 "SQL 표준을 더 엄격하게 지키도록 강제당하는 이벤트"로 보는 편이 정확하다 — 위 함정들은 전부 "구버전이 관대하게 봐주던 비표준 패턴"이 신버전에서 정확히 걸린 것이다.

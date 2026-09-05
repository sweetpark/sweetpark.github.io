---
title: "SQL 문법 (UNION)"
tags: [학습, 개발실무, 저장소-&-데이터베이스]
created: 2026-02-04
modified: 2026-09-05
---

# SQL 문법 (UNION)

> [!NOTE]
> 여러 SELECT 결과를 세로로 합치는 집합 연산자 UNION / UNION ALL의 개념과 사용 조건.
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

- **UNION**: 여러 쿼리 결과를 하나로 합침. 중복 값을 **제거**하고 보여줌.
    - 중복 제거를 위한 정렬·비교 과정 때문에 `UNION ALL`보다 속도가 느림.
- **UNION ALL**: UNION과 동일하나 중복을 제거하지 않음(그만큼 더 빠름).

### 사용 조건

- 각 SELECT의 **컬럼 개수**가 동일해야 함.
- 컬럼별 **데이터 타입**이 호환되어야 함.
- 컬럼명(별칭)이 다르면 결과 컬럼명은 첫 번째 SELECT 기준으로 정해지므로, 필요하면 `AS`로 맞춰준다.

## 💻 예시

```sql
SELECT A AS one, B AS two
FROM   TABLE_A
UNION  -- (또는 UNION ALL)
SELECT C AS one, D AS two
FROM   TABLE_B
;
```


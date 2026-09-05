---
title: "MySQL UPDATE SET절 순차평가 함정"
tags: [학습, 개발-CS, 데이터베이스, SQL, MySQL]
modified: 2026-09-05
---

# MySQL UPDATE SET절 순차평가 함정

> [!NOTE]
> MySQL의 `UPDATE ... SET` 절은 왼쪽에서 오른쪽 순서로 **순차 평가**된다 — 뒤에 나오는 컬럼의 `CASE WHEN` 조건이 앞에서 이미 바뀐 값을 참조하면 항상 어긋난 결과가 나온다. 실무에서 추출·일반화.

## 문제 패턴

"변경 여부를 판단해서 변경일시를 갱신"하는 흔한 패턴에서, 판단 조건(`CASE WHEN`)을 값이 바뀐 컬럼보다 **뒤에** 두면 항상 "변경 없음"으로 판정된다.

```sql
-- 문제 — USE_TYPE을 먼저 대입한 뒤, 그 뒤에서 "값이 바뀌었는지" 비교
UPDATE MY_TABLE
   SET USE_TYPE = #{newUseType},
       UPDATED_AT = CASE WHEN USE_TYPE != #{newUseType}   -- 이미 새 값으로 바뀐 뒤라 항상 거짓
                         THEN NOW() ELSE UPDATED_AT END
 WHERE ID = #{id}
```

MySQL은 SET절을 위에서 아래로 순차 평가하므로, `UPDATED_AT`을 계산하는 시점에는 `USE_TYPE`이 **이미 새 값으로 바뀐 상태**다. 따라서 `USE_TYPE != #{newUseType}` 비교는 새 값과 새 값을 비교하는 셈이 되어 항상 거짓이 되고, "값이 바뀌었을 때만 갱신"하려던 컬럼(`UPDATED_AT`)이 의도한 대로 절대 갱신되지 않는다.

## 해결

**변경 여부를 판단하는 CASE WHEN을, 그 판단 대상 컬럼을 대입하는 문장보다 앞에 둔다.**

```sql
-- 해결 — 판단(CASE WHEN)을 대입보다 먼저 배치, 변경 전 값 기준으로 비교
UPDATE MY_TABLE
   SET UPDATED_AT = CASE WHEN USE_TYPE != #{newUseType}   -- 아직 변경 전 값과 비교
                         THEN NOW() ELSE UPDATED_AT END,
       USE_TYPE   = #{newUseType}
 WHERE ID = #{id}
```

## 일반화

- MySQL(및 대부분의 RDBMS)의 `UPDATE SET`은 **한 문장 안에서 왼쪽부터 순차 평가**된다는 사실을 기본 전제로 두어야 한다.
- "A 컬럼의 변경 여부에 따라 B 컬럼(감사 컬럼: 변경일시, 변경자 등)을 조건부로 갱신"하는 패턴을 쓸 때는, **판단 로직이 참조하는 컬럼이 그 문장 안에서 아직 변경되지 않은 시점에 있는지** 항상 SET절 작성 순서를 확인한다.
- 리뷰 시 체크포인트: SET절에 `CASE WHEN 컬럼X ...`가 있다면, 같은 문장에서 `컬럼X = ...` 대입이 그 CASE WHEN보다 **뒤에** 있는지 확인한다.

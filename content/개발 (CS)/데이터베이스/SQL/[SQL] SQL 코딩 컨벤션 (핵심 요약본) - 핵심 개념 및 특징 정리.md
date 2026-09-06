---
title: "**SQL 코딩 컨벤션 (핵심 요약본)**"
tags: [학습, 개발-CS, 데이터베이스, SQL, 컨벤션]
modified: 2026-09-05
---

# **SQL 코딩 컨벤션 (핵심 요약본)**

> [!NOTE]
> 별칭 규칙, 포매팅, 안티패턴, MyBatis 동적 SQL, 성능 관련 핵심 SQL 코딩 컨벤션 요약.

이 문서는 우리 팀의 SQL 코드 스타일을 통일하여 **가독성, 일관성, 유지보수성**을 극대화하고, **성능 최적화**와 **효율적인 쿼리 작성**을 위한 핵심 가이드입니다.

**기본 원칙:**

1. **정확성 (Accuracy):** 모든 데이터, 특히 금액은 정확하게 표현되고 계산되어야 합니다.
2. **명확성 (Clarity):** 코드는 누가 읽어도 그 의도를 명확하게 파악할 수 있어야 합니다.
3. **안정성 (Stability):** 예측 가능하고 일관된 방식으로 동작하는 쿼리를 작성하여 잠재적 오류를 원천 차단합니다.

---

## 📌 가이드 내용

### **1. 이름 규칙 (Naming Convention)**

### **1.1. 테이블 별칭 (Alias)**

의미 없는 `a`, `b`, `c` 같은 별칭은 코드 해석을 어렵게 만드는 주범입니다.

- **규칙:** 테이블명의 약어를 사용합니다.
- **형식:** 언더스코어(`_`)로 구분된 각 부분의 첫 글자를 조합합니다. (예: `TB_SI_MBS` → `tsm`)
- **예시:**
    - `TBAD_CODE` → `tac` (TB + AD + CODE)
    - `TBSI_MBS` → `tsm` (TB + SI + MBS)
    - `TBTR_EMAIL_DAILY` → `tted` (TB + TR + EMAIL + DAILY)
- **핵심:** `a`, `b`, `c` 와 같이 의미 없는 별칭을 절대 사용하지 않습니다.

```sql
-- Good
SELECT tsm.mid
, ttm.goods_amt
FROM TBSI_MBS tsm
INNER JOIN TBTR_MSTR ttm ON tsm.mid = ttm.mid;

-- Bad
SELECT a.mid, b.goods_amt
FROM TBSI_MBS a, TBTR_MSTR b -- 의미 없는 별칭과 암시적 JOIN
WHERE a.mid = b.mid;

```

> ※ 별칭 규칙이 적용되는 경우 팀에서 정한 약어 목록 또는 업무별 테이블 약어 표준을 준수
>

### **1.2. 서브쿼리(인라인 뷰) 별칭**

서브쿼리 결과셋에 부여하는 별칭 규칙입니다.

### **1.2.1. 기본 형식**

- **형식:** `기본테이블별칭` + `_` + `역할접미사`
- **역할 접미사:**

| **접미사** | **의미** | **사용 예** |
| --- | --- | --- |
| `_agg` | 집계 (SUM, COUNT, MAX 등) | `ttm_agg` |
| `_grp` | 그룹핑 | `tsm_grp` |
| `_lst` | 목록/리스트 | `ttm_lst` |
| `_dtl` | 상세 | `ttm_dtl` |
| `_tmp` | 임시/중간결과 | `ttm_tmp` |

```sql
-- Good: 집계 서브쿼리
SELECT tsm.MID
, ttm_agg.LAST_TRX_DT
, ttm_agg.TRX_CNT
FROM TBSI_MBS tsm
INNER JOIN (
    SELECT MID
    , MAX(APP_DT) AS LAST_TRX_DT
    , COUNT(*) AS TRX_CNT
    FROM TBTR_MSTR
    GROUP BY MID
) ttm_agg ON tsm.MID = ttm_agg.MID

-- Bad: 의미 없는 별칭
SELECT tsm.MID
, sub.LAST_TRX_DT
FROM TBSI_MBS tsm
INNER JOIN (
    SELECT MID, MAX(APP_DT) AS LAST_TRX_DT
    FROM TBTR_MSTR
    GROUP BY MID
) sub ON tsm.MID = sub.MID -- 'sub'는 역할을 알 수 없음

```

### **1.2.2. 중첩 서브쿼리**

- **형식:** 역할접미사 + 숫자 (바깥쪽부터 1, 2, 3 순번)
- **규칙:** 같은 역할이면 숫자로 구분

```sql
-- Good: 2단계 중첩 서브쿼리
SELECT tsm.MID
, ttm_agg1.TOTAL_AMT
FROM TBSI_MBS tsm
INNER JOIN (
    SELECT MID
    , SUM(GOODS_AMT) AS TOTAL_AMT
    FROM (
        SELECT MID
        , GOODS_AMT
        FROM TBTR_MSTR
        WHERE TRX_ST_CD = '0'
    ) ttm_lst2
    GROUP BY MID
) ttm_agg1 ON tsm.MID = ttm_agg1.MID

```

### **1.2.3. WITH 절 (CTE)**

- **형식:** `snake_case`로 역할을 명확히 표현
- CTE 내부에서 테이블 참조 시 기본 별칭 규칙 적용

```sql
-- Good: WITH 절 사용
WITH merchant_summary AS (
    SELECT tsm.MID
    , COUNT(*) AS TRX_CNT
    FROM TBTR_MSTR ttm
    GROUP BY ttm.MID
),
daily_stats AS (
    SELECT ttm.APP_DT
    , SUM(ttm.GOODS_AMT) AS DAILY_AMT
    FROM TBTR_MSTR ttm
    GROUP BY ttm.APP_DT
)
SELECT ms.MID
, ms.TRX_CNT
, ds.DAILY_AMT
FROM merchant_summary ms
INNER JOIN daily_stats ds ON ms.APP_DT = ds.APP_DT

```

---

### **2. 코드 형식 (Formatting)**

잘 정돈된 코드는 로직의 흐름을 쉽게 따라갈 수 있게 합니다.

#### **2.1. 키워드 대소문자**

- **규칙:** `SELECT`, `FROM`, `WHERE` 등 SQL 예약어는 모두 **대문자**로, 테이블, 컬럼 등 식별자는 모두 소**문자**로 작성합니다.

```sql
-- Good
SELECT user_id, user_name
  FROM users
 WHERE use_flg = 'Y';

-- Bad
select user_id, user_name from users where use_flg = 'Y'; -- 전부 소문자
Select USER_ID, USER_NAME From USERS Where USE_FLG = 'Y'; -- 혼용

```

#### **2.2. 들여쓰기 및 줄 바꿈**

정돈된 코드는 버그를 줄입니다.

- **키워드:** `SELECT`, `FROM`, `WHERE` 등 SQL 예약어는 **대문자**로 작성합니다.
- **들여쓰기:** **스페이스 4칸**을 사용합니다.
- **줄 바꿈:** `SELECT`, `FROM`, `WHERE`, `GROUP BY` 등 주요 절은 새로운 줄에서 시작합니다.
- **선행 쉼표:** 컬럼 목록을 나열할 때는 각 컬럼 앞에 쉼표(`,`)를 붙여 수직 정렬합니다.

```sql
-- Good
SELECT tsm.MID
, tsm.CO_NM
, ttm.GOODS_AMT
FROM TBSI_MBS tsm
INNER JOIN TBTR_MSTR ttm ON tsm.MID = ttm.MID
WHERE tsm.USE_FLG = 'Y'
AND ttm.APP_DT >= '20240101';

```

---

### **3. 쿼리 스타일: 이것만은 반드시 피하세요!**

#### **3.1. `SELECT *` 절대 금지**

- **규칙:** 필요한 컬럼만 명시적으로 지정합니다.
- **이유:** 불필요한 부하를 줄이고, 테이블 구조 변경 시 발생할 수 있는 애플리케이션 오류를 원천 차단합니다.

#### **3.2. 암시적 JOIN 금지**

- **규칙:** `FROM A, B WHERE A.id = B.id` 와 같은 옛날 방식 대신, `INNER JOIN`, `LEFT OUTER JOIN`을 명시적으로 사용합니다.
- **이유:** 테이블 간의 관계를 명확히 하고, `JOIN` 조건 누락으로 인한 시스템 장애(카티션 곱)를 방지합니다.

#### **3.3. MyBatis 동적 SQL 안정성 확보(권장)**

- **규칙:** `<if>` 태그로 조건이 변하는 `UPDATE`나 `WHERE` 절에는 반드시 `<set>`과 `<where>` 태그를 사용합니다.
- **이유:** 불필요한 콤마(`,`)나 `AND`가 붙어 발생하는 SQL 구문 오류를 자동으로 방지해 줍니다.

```sql
-- Good
<update id="updateMember">
UPDATE TBSI_MBS tsm
    <set>
        <if test="coNm != null">, tsm.CO_NM = #{coNm}</if>
        <if test="useFlg != null">, tsm.USE_FLG = #{useFlg}</if>
    </set>
WHERE tsm.MID = #{mid}
</update>

-- Bad: coNm이 null이면 SET 다음에 바로 콤마(,)가 와서 SQL 오류 발생
<update id="updateMember">
UPDATE TBSI_MBS tsm
SET <if test="coNm != null">, tsm.CO_NM = #{coNm}</if>
           <if test="useFlg != null">, tsm.USE_FLG = #{useFlg}</if>
WHERE tsm.MID = #{mid}
</update>

```

#### **3.4. 부등호 사용**

- **규칙:** XML 기반의 Mapper에서 부등호(`<`, `>`)를 사용할 때는 반드시 **`<![CDATA[ ... ]]>`** 섹션으로 감싸야 합니다.
- **CDATA가 필요한 연산자:** `<`, `>`, `<=`, `>=`
- **왜?** XML 파서는 `<`와 `>`를 태그의 시작과 끝으로 인식하기 때문에, `CDATA`로 감싸지 않으면 파싱 오류가 발생합니다.

---

### **4. 주석 (Comments)**

미래의 나를 위한 기록입니다.

- **규칙:** 모든 쿼리에는 **XML 주석**과 **SQL 주석**을 모두 작성합니다.
- **형식:**
    - **XML 주석 (`<!-- -->`):** 쿼리의 목적과 비즈니스 로직을 설명합니다.
    - **SQL 주석 (`/* */`):** `/* Mapper명.메서드명 */` 형식으로 작성하여 DB 로그 추적을 돕습니다.

```xml
<!-- Good: 두 종류의 주석을 모두 사용-->
<!-- 가맹점의 최근 거래내역 조회-->
<select id="selectRecentTransaction" resultType="map">
    /* MerchantMapper.selectRecentTransaction */
    SELECT ...
</select>

```

---

### **5. 성능: 핵심 안티패턴**

#### **5.1. 스칼라 서브쿼리(Scalar Subquery) 사용 금지**

- **규칙:** `SELECT` 절이나 `WHERE` 절 안에 또 다른 `SELECT` 문을 넣지 않습니다.
- **이유:** 조회되는 **모든 행마다** 서브쿼리가 반복 실행되어 심각한 성능 저하를 유발합니다. 반드시 `JOIN`으로 해결하세요.

```sql
-- Bad: 행마다 서브쿼리가 실행됨
SELECT tsm.MID
, (SELECT MAX(APP_DT) FROM TBTR_MSTR WHERE MID = tsm.MID) AS LAST_TRX_DT
FROM TBSI_MBS tsm;

-- Good: JOIN으로 한 번에 처리
SELECT tsm.MID
, MAX(ttm.APP_DT) AS LAST_TRX_DT
FROM TBSI_MBS tsm
LEFT JOIN TBTR_MSTR ttm ON tsm.MID = ttm.MID
GROUP BY tsm.MID;

```

#### **5.2. `EXPLAIN` 생활화**

- **규칙:** 복잡하거나 중요한 쿼리는 반드시 `EXPLAIN`으로 실행 계획을 확인합니다.
- **확인 사항:** `type`이 `ALL`(Full Scan)이거나 `Extra`에 `Using filesort`가 표시되면 인덱스 사용 여부를 점검해야 합니다.

---

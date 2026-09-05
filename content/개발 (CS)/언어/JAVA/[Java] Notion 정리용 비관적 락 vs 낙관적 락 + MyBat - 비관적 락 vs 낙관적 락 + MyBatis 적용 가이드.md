---
title: "📝 [Notion 정리용] 비관적 락 vs 낙관적 락 + MyBatis 적용 가이드"
tags: [학습, 개발-CS, 언어, JAVA, 개발, DB락, 동시성, MyBatis]
created: 2026-09-05
modified: 2026-09-05
---

# 📝 비관적 락 vs 낙관적 락 + MyBatis 적용 가이드

> [!NOTE]
> 멀티 서버/트랜잭션 환경의 동시성 제어 — 비관적 락과 낙관적 락의 개념·MyBatis 구현·재시도 로직·선택 기준.

## 📌 개념

### 1️⃣ 왜 DB 락이 필요한가?

멀티 서버 / 멀티 트랜잭션 환경에서는 다음 문제가 발생할 수 있다.

- 재고 중복 차감
- 포인트 이중 사용
- 계좌 잔액 오염
- 마지막 수정 덮어쓰기 (Lost Update)

Java Lock은 단일 JVM에서만 유효

👉 운영 환경에서는 **DB 레벨 제어 필요**

### 2️⃣ 비관적 락 (Pessimistic Lock)

#### 🔒 개념

> "충돌은 반드시 발생한다"라고 가정. 읽는 순간부터 락을 건다.

#### SQL

```sql
SELECT * FROM product
WHERE id = 1
FOR UPDATE;
```

- 해당 row에 Exclusive Lock
- 트랜잭션 종료까지 유지

#### MyBatis 적용

```xml
<select id="selectForUpdate" resultType="Product">
    SELECT *
    FROM product
    WHERE id = #{id}
    FOR UPDATE
</select>
```

#### Service 레벨 (중요)

```java
@Transactional
public void decreaseStock(Long productId, int quantity) {

    Product product = productMapper.selectForUpdate(productId);

    if (product.getStock() < quantity) {
        throw new IllegalStateException("재고 부족");
    }

    productMapper.updateStock(productId, quantity);
}
```

#### ⚠️ 반드시 기억할 것

- @Transactional 필수
- 트랜잭션 범위가 길면 성능 저하
- 데드락 가능성 존재

### 3️⃣ 낙관적 락 (Optimistic Lock)

#### 🟢 개념

> "충돌은 거의 없다"라고 가정. DB에 물리적 락을 걸지 않는다. 대신 version 값을 비교한다.

#### 테이블 구조

```sql
id | stock | version
```

### 4️⃣ MyBatis에서 낙관적 락 구현 방법 ⭐ (핵심)

MyBatis는 JPA처럼 @Version 자동 처리 기능이 없다.

👉 직접 구현해야 한다.

#### 4.1 SELECT 시 version 조회

```xml
<select id="selectById" resultType="Product">
    SELECT id, stock, version
    FROM product
    WHERE id = #{id}
</select>
```

#### 4.2 UPDATE 시 version 비교

```xml
<update id="updateWithVersion">
    UPDATE product
    SET stock = #{stock},
        version = version + 1
    WHERE id = #{id}
      AND version = #{version}
</update>
```

👉 핵심: WHERE 절에 version 포함

#### 4.3 Service 레벨 구현 (실무 패턴)

```java
@Transactional
public void decreaseStock(Long productId, int quantity) {

    Product product = productMapper.selectById(productId);

    if (product.getStock() < quantity) {
        throw new IllegalStateException("재고 부족");
    }

    int updatedRows = productMapper.updateWithVersion(
            productId,
            product.getStock() - quantity,
            product.getVersion()
    );

    if (updatedRows == 0) {
        throw new IllegalStateException("동시성 충돌 발생");
    }
}
```

#### 4.4 왜 updatedRows를 확인해야 하는가?

```text
충돌 발생 → version 값이 달라짐
→ UPDATE 영향 row = 0
→ 실패 감지 가능
```

이 체크를 안 하면 👉 낙관적 락이 무의미해진다.

### 5️⃣ 재시도 로직 (실무에서 거의 필수)

```java
public void decreaseWithRetry(Long productId, int quantity) {

    int retry = 3;

    while (retry-- > 0) {
        try {
            decreaseStock(productId, quantity);
            return;
        } catch (IllegalStateException e) {
            if (!e.getMessage().contains("동시성")) {
                throw e;
            }
        }
    }

    throw new IllegalStateException("재시도 실패");
}
```

### 6️⃣ 비관적 vs 낙관적 비교

| 구분 | 비관적 락 | 낙관적 락 |
| --- | --- | --- |
| 락 시점 | SELECT 시 | UPDATE 시 |
| DB 물리적 락 | 있음 | 없음 |
| 성능 | 낮음 | 높음 |
| 데드락 | 가능 | 없음 |
| 재시도 | 필요 없음 | 필요 |

### 7️⃣ 실무 선택 기준

**🔥 재고 차감 / 금융** 👉 비관적 락

- 절대 틀리면 안 됨
- 강한 정합성 필요

**📝 게시글 수정 / 일반 CRUD** 👉 낙관적 락

- 충돌 확률 낮음
- 성능 중요

### 8️⃣ MyBatis 환경에서 자주 하는 실수

- ❌ version 컬럼 안 만듦
- ❌ WHERE 절에 version 안 넣음
- ❌ update row count 체크 안 함
- ❌ 재시도 로직 없음
- ❌ 트랜잭션 범위 과도

### 9️⃣ 구조적으로 이해하기

```text
비관적 락 = 먼저 잠그고 시작
낙관적 락 = 나중에 비교하고 판단
```

### 🔟 면접용 정리 멘트

> MyBatis에서는 낙관적 락을 자동 지원하지 않기 때문에 version 컬럼을 두고 UPDATE 시 version을 비교하는 방식으로 구현합니다. UPDATE 결과 row count가 0이면 충돌로 판단하고 재시도 로직을 설계합니다.

### 🎯 최종 핵심 요약

- MyBatis는 낙관적 락 수동 구현
- UPDATE 시 version 비교 필수
- 영향 row 수 확인 필수
- 재시도 로직 설계 중요
- 강한 정합성 = 비관적
- 고성능 = 낙관적

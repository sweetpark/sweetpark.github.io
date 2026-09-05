---
title: "비관적 락 & 낙관적 락 TPS 차이"
tags: [학습, 개발-CS, 언어, JAVA, 개발, DB락, 동시성, TPS, 성능]
created: 2026-09-05
modified: 2026-09-05
---

# 비관적 락 & 낙관적 락 TPS 차이

> [!NOTE]
> 비관적 락 vs 낙관적 락의 개념·구조와 실제 TPS 측정 실험(동일 row 고경쟁 write) 결과·해석. 실험 코드와 예상 경향까지 정리.

## 📌 개념

### [1편] 개념과 구조

#### 1️⃣ 동시성 제어는 왜 필요한가

동시에 여러 요청이 같은 데이터를 수정하면 다음 문제가 발생한다.

- Lost Update
- 재고 중복 차감
- 포인트 이중 사용
- 데이터 정합성 붕괴

이를 해결하는 대표 전략:

```text
비관적 락 (Pessimistic Lock)
낙관적 락 (Optimistic Lock)
```

#### 2️⃣ 비관적 락 (Pessimistic Lock)

- **개념**: "충돌이 발생할 것이다"라고 가정하고, 먼저 잠근다.
- **동작 시점**: `SELECT ... FOR UPDATE` — 조회 시점에 Row Lock 획득
- **특징**: 읽는 순간 잠금 / 다른 트랜잭션 대기 / 재시도 없음 / 데드락 가능

```sql
SELECT * FROM product
WHERE id = #{id}
FOR UPDATE;
```

- **장점**: 강한 정합성, 예측 가능한 동작, 고경쟁 write 환경에 안정적
- **단점**: 블로킹 발생, 대기 시간 존재, 데드락 가능성

#### 3️⃣ 낙관적 락 (Optimistic Lock)

- **개념**: "충돌이 거의 없을 것이다"라고 가정하고, 충돌 시 감지한다.
- **동작 시점**: UPDATE 시 version 비교

```sql
UPDATE product
SET quantity = quantity - 1,
    version = version + 1
WHERE id = #{id}
  AND version = #{version}
```

- **특징**: 읽을 때 락 없음 / 충돌 시 row count = 0 / 재시도 필요 / 데드락 없음
- **장점**: 락 대기 없음, read-heavy 환경에서 빠름
- **단점**: 충돌 시 retry 필요, retry storm 가능, 고경쟁 환경에 취약

### [2편] 실험 결과와 Retry + Backoff 적용 후 해석

#### 4️⃣ Retry + Backoff 전략 적용 코드

```java
public void decreaseWithRetry(Long id){

    int maxRetry = 5;

    for (int attempt = 0; attempt < maxRetry; attempt++) {
        try {
            txService.decreaseOnce(id);
            return;
        } catch (OptimisticLockingFailureException e) {

            if (attempt == maxRetry - 1) {
                throw new RuntimeException("재시도 초과");
            }

            try {
                Thread.sleep(10L + (attempt + 1));
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
```

#### 5️⃣ 실험 결과

```text
(낙관적)
time : 2496 ms
TPS  : 400

(비관적)
time : 1099 ms
TPS  : 909
```

#### 6️⃣ 왜 Backoff를 넣었는데도 낙관적 락이 느린가?

**🔥 1. Retry 자체가 DB 호출을 증가시킨다**

낙관적 락은:

```text
SELECT → UPDATE 실패
SELECT → UPDATE 실패
SELECT → UPDATE 성공
```

성공 1회를 위해 DB를 여러 번 왕복합니다. Backoff는 충돌을 줄이지만 DB 호출 횟수를 줄이지는 못합니다.

**🔥 2. totalTime은 retry 누적 시간까지 포함된다**

비관적 락: `한 번 lock → 순차 처리`

낙관적 락: `실패 + 대기 + 재시도 + 다시 실패`

> totalTime이 길어지는 건 자연스러운 결과

#### 7️⃣ 중요한 함정 — TPS 계산 방식

이번 TPS 계산은: `(전체 요청 수 × 1000) / totalTime`

하지만 낙관적 락은 일부 요청 실패, retry 초과 발생. 성공 기준 TPS로 계산하면 차이는 더 벌어질 수 있습니다.

#### 8️⃣ 핵심 해석

이번 테스트 환경은 `동일 row / 1000 동시 write / 고경쟁` — 낙관적 락이 가장 불리한 조건입니다.

> 이 환경에서는 줄 세워서 처리하는 비관적 락이 오히려 효율적

#### 9️⃣ 그럼 Backoff는 의미 없나?

아닙니다. Backoff는 Retry storm 완화 / DB 부하 감소 / 충돌률 감소에 도움이 됩니다.

> 하지만 고경쟁 동일 row write 상황에서는 근본적인 해결책이 될 수 없습니다.

#### 🔟 최종 결론

| 상황 | 더 적합한 전략 |
| --- | --- |
| 동일 row 고경쟁 write | 비관적 락 |
| 낮은 충돌 환경 | 낙관적 락 |
| read-heavy | 낙관적 락 |
| 강한 정합성 | 비관적 락 |

#### 🎯 한 문장 요약

> 낙관적 락은 충돌이 적을 때 빠른 전략이고, 비관적 락은 충돌이 많을 때 안정적인 전략이다.

### [부록] TPS 성능 비교 실험 코드

#### 실험 목적

- 동일한 재고 차감 로직
- 동시 요청 1000개 발생
- 처리 시간 및 TPS 비교

```text
TPS = (총 처리 건수) / (총 소요 시간)
```

#### 실험 환경 가정

- Spring Boot
- MyBatis
- MySQL / MariaDB
- HikariCP
- 스레드 100개 동시 실행

#### 공통 테이블 구조

```sql
CREATE TABLE product (
    id BIGINT PRIMARY KEY,
    stock INT,
    version INT
);
```

초기 데이터:

```sql
INSERT INTO product VALUES (1, 100000, 0);
```

#### 비관적 락 구현

Mapper:

```xml
<select id="selectForUpdate" resultType="Product">
    SELECT * FROM product
    WHERE id = #{id}
    FOR UPDATE
</select>

<update id="updateStock">
    UPDATE product
    SET stock = stock - 1
    WHERE id = #{id}
</update>
```

Service:

```java
@Transactional
public void decreaseStockPessimistic(Long id) {
    Product product = productMapper.selectForUpdate(id);

    if (product.getStock() <= 0) {
        throw new RuntimeException("재고 부족");
    }

    productMapper.updateStock(id);
}
```

#### 낙관적 락 구현

Mapper:

```xml
<select id="selectById" resultType="Product">
    SELECT * FROM product
    WHERE id = #{id}
</select>

<update id="updateWithVersion">
    UPDATE product
    SET stock = stock - 1,
        version = version + 1
    WHERE id = #{id}
      AND version = #{version}
</update>
```

Service:

```java
@Transactional
public void decreaseStockOptimistic(Long id) {

    Product product = productMapper.selectById(id);

    if (product.getStock() <= 0) {
        throw new RuntimeException("재고 부족");
    }

    int updated = productMapper.updateWithVersion(
            id,
            product.getVersion()
    );

    if (updated == 0) {
        throw new RuntimeException("충돌 발생");
    }
}
```

#### TPS 측정 테스트 코드

```java
@Test
void tpsComparisonTest() throws InterruptedException {

    int threadCount = 1000;
    ExecutorService executor = Executors.newFixedThreadPool(100);
    CountDownLatch latch = new CountDownLatch(threadCount);

    long start = System.currentTimeMillis();

    for (int i = 0; i < threadCount; i++) {
        executor.submit(() -> {
            try {
                productService.decreaseStockPessimistic(1L);
                // 또는 decreaseStockOptimistic(1L);
            } catch (Exception ignored) {
            } finally {
                latch.countDown();
            }
        });
    }

    latch.await();

    long end = System.currentTimeMillis();

    long totalTime = end - start;
    double tps = (threadCount * 1000.0) / totalTime;

    System.out.println("총 소요 시간(ms): " + totalTime);
    System.out.println("TPS: " + tps);
}
```

#### 예상 결과 (일반적인 경향)

| 구분 | 비관적 락 | 낙관적 락 |
| --- | --- | --- |
| 평균 처리 시간 | 김 | 짧음 |
| TPS | 낮음 | 높음 |
| 대기 시간 | 많음 | 거의 없음 |
| 충돌 발생 | 없음 | 있음 |
| 재시도 비용 | 없음 | 있음 |

#### 왜 이런 차이가 나는가?

**🔴 비관적 락**

```text
Thread1 → Lock
Thread2 → 대기
Thread3 → 대기
...
```

→ 순차 처리에 가까움 → TPS 감소

**🟢 낙관적 락**

```text
Thread1 → UPDATE 시도
Thread2 → UPDATE 시도
Thread3 → UPDATE 시도
```

→ 병렬 처리 → 충돌 시 일부 실패 → TPS 증가

#### 실험 시 주의할 점

- 반드시 DB를 로컬이 아닌 실제 환경에서 테스트
- Connection Pool 사이즈 조정
- 트랜잭션 격리 수준 확인 (READ COMMITTED 권장)
- 재시도 로직 포함 여부에 따라 결과 달라짐

#### 고급 실험 확장

**🔥 1. 충돌률 측정**

```java
AtomicInteger failCount = new AtomicInteger();
```

→ 낙관적 락 충돌 횟수 측정

**🔥 2. JMeter 부하 테스트**

- 1000 TPS 시뮬레이션
- 실제 API 엔드포인트 대상으로 실험

**🔥 3. TPS + 평균 응답 시간 같이 기록**

```text
평균 응답 시간 = 총 응답 시간 / 요청 수
```

#### 최종 정리

```text
비관적 락 = 안전하지만 느림
낙관적 락 = 빠르지만 충돌 처리 필요
```

#### 실무 결론

- 재고 수량이 적고 경쟁이 치열하면 → 비관적
- 트래픽이 높고 충돌 확률이 낮으면 → 낙관적
- 초고트래픽 환경 → Redis 분산 락 + DB 낙관적 혼합

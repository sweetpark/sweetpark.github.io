---
title: "[JAVA 기술면접] MySQL 쿼리 튜닝 — EXPLAIN 해석과 튜닝 기준"
description: "MySQL EXPLAIN 해석 기준과 쿼리 튜닝이 이뤄지는 방식을 Java 기술면접 질문에 맞춰 정리했습니다."
tags: [기술면접, JAVA 관련 기술면접, MySQL, EXPLAIN, 쿼리 튜닝, 인덱스, 실행 계획]
created: 2026-10-19
modified: 2026-10-19
---

# [JAVA 기술면접] MySQL 쿼리 튜닝 — EXPLAIN 해석과 튜닝 기준

> [!NOTE]
> 질문: **MySQL은 `EXPLAIN`으로 분석하는데, 어떤 기준으로 튜닝하고, 왜 그것을 기준으로 보며, 어떤 방식으로 튜닝이 이루어지는가?**
> 한 줄 요약: **쿼리 시간은 대부분 "읽는 행(페이지) 수"에 비례한다.** 그래서 EXPLAIN에서 *얼마나 많은 행을 읽고(rows), 인덱스를 어떻게 타며(type, key), 불필요한 추가 작업이 있는지(Extra)* 를 보고, 읽는 양을 줄이는 방향으로 인덱스·쿼리를 고친다.

---

## 1. 왜 EXPLAIN을 기준으로 보는가

- MySQL 옵티마이저는 **비용 기반(Cost-Based)** 으로 실행 계획을 세운다. 통계(행 수, 인덱스 카디널리티)를 보고 가장 싸다고 판단한 계획을 고른다. EXPLAIN은 그 **선택 결과**를 보여준다.
- DB 쿼리 비용의 대부분은 **디스크/버퍼 풀에서 페이지를 읽는 I/O**다. 읽는 행이 적을수록 I/O·CPU·락 시간이 줄어든다.
- 결과 건수가 10건이어도 100만 행을 훑고 버리면 느리다. 그래서 **"반환 행"이 아니라 "검사한 행"** 을 줄이는 것이 튜닝의 목표다.
- 실행해보지 않고도 계획을 알 수 있어 운영 쿼리를 안전하게 점검할 수 있다. (단, `rows`는 **추정치**다.)

```sql
EXPLAIN SELECT ...;                 -- 예상 실행 계획
EXPLAIN FORMAT=TREE SELECT ...;     -- 트리 형태 (8.0)
EXPLAIN ANALYZE SELECT ...;         -- 실제 실행 후 실제 행 수/시간 비교 (8.0.18+)
```
> `EXPLAIN ANALYZE`는 쿼리를 **실제로 실행**하므로 느린 쿼리·DML 주의.

---

## 2. EXPLAIN 컬럼과 보는 순서

| 컬럼 | 의미 | 튜닝 시 보는 법 |
| --- | --- | --- |
| `id` | SELECT 번호 | 서브쿼리/UNION 구조. 같은 id는 조인, 큰 id가 먼저 실행 |
| `select_type` | 쿼리 종류 | `SIMPLE`, `PRIMARY`, `SUBQUERY`, `DERIVED`(파생 테이블), `UNION` |
| `table` | 대상 테이블 | 조인 순서(위에서 아래로가 대체로 드라이빙→드리븐) |
| **`type`** | **접근 방식** | **가장 먼저 본다.** `ALL`(풀 스캔)이면 의심 |
| `possible_keys` | 후보 인덱스 | 비어 있으면 쓸 인덱스가 없음 |
| **`key`** | **실제 사용 인덱스** | `NULL`이면 인덱스 미사용 |
| **`key_len`** | 사용한 인덱스 길이(바이트) | 복합 인덱스의 **몇 번째 컬럼까지 썼는지** 판단 |
| `ref` | 인덱스와 비교한 값 | `const`, 다른 테이블 컬럼 등 |
| **`rows`** | 검사 예상 행 수 | **조인이면 곱해서** 총 작업량을 어림 |
| `filtered` | 조건 통과 비율(%) | 낮으면 읽고 버리는 행이 많다 |
| **`Extra`** | 추가 정보 | `Using filesort`, `Using temporary` 등 경고 신호 |

### type (접근 방식) — 좋은 순서
```
system > const > eq_ref > ref > fulltext > ref_or_null > index_merge > range > index > ALL
```
| type | 의미 |
| --- | --- |
| `const` / `system` | PK·유니크 인덱스로 **1행** 조회 (최상) |
| `eq_ref` | 조인에서 PK/유니크로 **상대 테이블 행당 1건** 매칭 |
| `ref` | 비유니크 인덱스 동등 비교(여러 행 가능) |
| `range` | 인덱스 **범위 스캔**(`BETWEEN`, `<`, `>`, `IN`, `LIKE 'a%'`) |
| `index` | 인덱스 **전체** 스캔 (테이블보다 작을 뿐 풀 스캔의 일종) |
| **`ALL`** | **테이블 풀 스캔** (대용량이면 위험) |

### Extra — 자주 보는 값
| 값 | 의미 | 판단 |
| --- | --- | --- |
| `Using index` | **커버링 인덱스**: 인덱스만으로 결과 해결(테이블 접근 없음) | 좋음 |
| `Using index condition` | 인덱스 컨디션 푸시다운(ICP): 스토리지 엔진 단에서 조건 필터 | 좋음 |
| `Using where` | 서버 단에서 추가 필터링 | 중립 (rows가 크면 주의) |
| `Using filesort` | 인덱스로 정렬 못 해 **별도 정렬 수행** | 대량이면 개선 대상 |
| `Using temporary` | **임시 테이블** 사용 (GROUP BY, DISTINCT, UNION 등) | 대량이면 개선 대상 |
| `Using join buffer (hash join / Block Nested Loop)` | **조인 컬럼에 인덱스 없음** | 조인 인덱스 추가 검토 |
| `Select tables optimized away` | `MIN/MAX` 등을 인덱스로 즉시 해결 | 좋음 |

### 읽는 순서 요령
```
1) type이 ALL/index 인가?            → 인덱스 설계/조건 확인
2) key가 NULL이거나 기대와 다른가?     → 인덱스 미사용 원인(함수, 형변환, 선행 와일드카드 등)
3) rows × (조인이면 곱) 가 너무 큰가?   → 읽는 양 자체가 문제
4) filtered가 낮은가?                 → 읽고 버리는 비율이 큼 → 더 선택적인 인덱스
5) Extra에 filesort / temporary / join buffer 가 있는가? → 정렬·그룹·조인 인덱스 개선
```

---

## 3. 튜닝 기준 한눈에

| 기준 | 목표 |
| --- | --- |
| **검사 행 수(rows)** | 반환 행에 가깝게 (읽고 버리는 양 최소화) |
| **접근 방식(type)** | `ALL` → `ref/range` 이상, 가능하면 `const/eq_ref` |
| **인덱스 사용(key, key_len)** | 의도한 인덱스를, 복합 인덱스는 **필요한 컬럼까지** 사용 |
| **추가 작업(Extra)** | filesort/temporary/join buffer 제거 (인덱스 순서 활용) |
| **조인 순서** | 작은(필터링된) 결과가 **드라이빙 테이블**, 드리븐 조인 컬럼은 **인덱스** |
| **전송량** | 필요한 컬럼만(`SELECT *` 지양), `LIMIT` |

---

## 4. 어떻게 튜닝하는가 (기법)

### 4.1 인덱스 설계 (가장 효과적)
- **B+Tree 인덱스**는 정렬된 구조라 동등/범위/정렬에 유리하다. 풀 스캔 O(N)을 O(log N)으로 줄인다.
- **복합 인덱스 컬럼 순서**: **동등(=) 조건 컬럼 → 범위 조건 컬럼 → 정렬 컬럼** 순. 범위 조건 뒤의 컬럼은 인덱스 탐색에 쓰이지 못한다. 카디널리티(고유값 비율)가 높은 컬럼을 앞에 두는 경향이 있지만, **쿼리 패턴이 우선**이다.
- **선두 컬럼 규칙(Leftmost Prefix)**: `(a, b, c)` 인덱스는 `a`, `a,b`, `a,b,c` 조건에는 쓰이지만 `b`만, `c`만으로는 쓰이지 않는다.
- **커버링 인덱스**: SELECT·WHERE·ORDER BY에 쓰이는 컬럼을 모두 인덱스에 담아 테이블 접근(랜덤 I/O)을 제거한다.
- InnoDB는 **클러스터링 인덱스(PK 순서로 데이터 저장)** 이고, 세컨더리 인덱스는 PK 값을 들고 있어 **인덱스 → PK → 테이블** 순으로 조회(추가 랜덤 I/O). PK는 짧고 단조 증가가 유리하다.

### 4.2 인덱스를 못 타게 만드는 쿼리 고치기
| 나쁜 예 | 문제 | 개선 |
| --- | --- | --- |
| `WHERE DATE(created_at) = '2026-10-19'` | 컬럼에 함수 적용 → 인덱스 무력화 | `created_at >= '2026-10-19' AND created_at < '2026-10-20'` |
| `WHERE phone = 01012345678` (컬럼은 VARCHAR) | 암묵적 형변환 → 인덱스 무력화 | 타입 일치: `phone = '01012345678'` |
| `WHERE name LIKE '%kim'` | 선행 와일드카드 → 범위 탐색 불가 | `LIKE 'kim%'`, 필요 시 전문 검색(FULLTEXT)·검색엔진 |
| `WHERE price * 1.1 > 1000` | 컬럼 연산 | `price > 1000 / 1.1` |
| `WHERE a = 1 OR b = 2` | OR는 인덱스 병합/풀 스캔 유발 | 각각 인덱스 + `UNION ALL` |
| `WHERE col != 'x'`, `NOT IN` | 대부분 범위가 넓음 | 조건 재설계 |
| 서로 다른 문자셋/콜레이션 조인 | 조인 컬럼 인덱스 무력화 | 문자셋 통일 |

> MySQL 8.0.13+ 는 **함수 기반 인덱스(Functional Index)** 로 `DATE(created_at)` 같은 표현식에도 인덱스를 만들 수 있다.

### 4.3 정렬·그룹·페이징
- **ORDER BY**: 정렬 컬럼이 인덱스 순서와 일치하면 `filesort`가 사라진다. `WHERE` 동등 컬럼 + `ORDER BY` 컬럼을 같은 복합 인덱스로 설계.
- **GROUP BY / DISTINCT**: 인덱스 순서를 활용하면 `Using temporary` 제거.
- **OFFSET 페이징 문제**: `LIMIT 100000, 20`은 앞 10만 건을 읽고 버린다.
```sql
-- 개선 1) 커서(Keyset) 페이징: 마지막으로 본 키 이후부터
SELECT * FROM post WHERE id < :lastId ORDER BY id DESC LIMIT 20;

-- 개선 2) 지연 조인(Deferred Join): 인덱스로 PK만 먼저 추려 본 테이블 조인
SELECT p.* FROM post p
JOIN (SELECT id FROM post ORDER BY created_at DESC LIMIT 100000, 20) t ON p.id = t.id;
```
- `COUNT(*)`가 큰 테이블에서 느리면 근사치·캐시·집계 테이블 고려.

### 4.4 조인
- 조인 컬럼(드리븐 테이블 쪽)에 **인덱스**를 둔다. (없으면 `Using join buffer`)
- **작은 결과가 드라이빙 테이블**이 되도록 필터를 먼저 적용. 옵티마이저가 잘못 고르면 `STRAIGHT_JOIN`이나 힌트로 보정.
- 서브쿼리 → 조인/`EXISTS`로 재작성하면 나아지는 경우가 있다. (8.0은 세미조인 최적화가 많이 개선됨)
- 불필요한 조인·컬럼 제거, 결과 건수를 줄인 뒤 조인.
- MySQL 8.0.18+은 인덱스 없는 동등 조인에 **Hash Join**을 사용하지만, 인덱스 조인보다는 보통 느리다.

### 4.5 그 외
| 방법 | 설명 |
| --- | --- |
| `SELECT *` 제거 | 필요한 컬럼만 → 커버링 인덱스 가능, 전송량↓ |
| 통계 갱신 | `ANALYZE TABLE`로 통계 최신화(옵티마이저 오판 방지), 필요 시 히스토그램 |
| 힌트 | `USE INDEX`, `FORCE INDEX`, `IGNORE INDEX`. 최후 수단(데이터 분포가 바뀌면 오히려 독) |
| 쓰기 비용 고려 | 인덱스는 INSERT/UPDATE/DELETE 비용과 저장 공간을 늘린다 → 필요한 것만, 중복·미사용 인덱스 정리 (`sys.schema_unused_indexes`) |
| 배치/벌크 | 건건 쿼리 대신 `IN`/배치 INSERT, JPA N+1 제거 |
| 구조 개선 | 반정규화, 파티셔닝, 아카이빙, 읽기 복제, 캐시(Redis) |
| 락 관점 | 인덱스 없는 UPDATE/DELETE는 많은 행(갭 포함)을 잠가 경합·데드락 유발 → WHERE 인덱스 필수 |

---

## 5. 튜닝 작업 흐름

```
1) 대상 선정   : 슬로우 쿼리 로그(long_query_time), performance_schema / sys 스키마,
                 pt-query-digest, APM → "총 소요 시간"이 큰 쿼리 우선 (한 번이 느린 것 + 자주 호출되는 것)
2) 실행 계획   : EXPLAIN (필요 시 EXPLAIN ANALYZE) 로 type/key/rows/Extra 확인
3) 원인 분석   : 인덱스 부재? 형변환/함수? 조인 순서? 정렬/임시 테이블? 통계 부정확?
4) 개선 적용   : 쿼리 재작성 또는 인덱스 추가 (운영은 Online DDL / 피크 시간 회피 / 스테이징 검증)
5) 검증        : 개선 전후 EXPLAIN, 실제 응답 시간, rows examined 비교
                 + 다른 쿼리에 부작용 없는지(옵티마이저가 다른 인덱스를 고르는지), 쓰기 성능 영향
6) 모니터링    : 데이터가 늘어도 유지되는지 지속 관찰
```

### 예시: 개선 전/후
```sql
-- 주문 테이블에서 특정 회원의 최근 주문 20건
SELECT * FROM orders
WHERE member_id = 100 AND status = 'PAID'
ORDER BY created_at DESC
LIMIT 20;
```
| | 개선 전 | 개선 후 |
| --- | --- | --- |
| 인덱스 | `idx_member(member_id)`만 존재 | `idx_member_status_created(member_id, status, created_at)` |
| type / key | `ref` / idx_member | `ref` / idx_member_status_created |
| rows | 회원의 주문 전체(예: 5,000) | 20 근처 |
| Extra | `Using where; Using filesort` | `Backward index scan` 등 정렬 제거 |
| 이유 | member_id로 읽은 뒤 status 필터 + 정렬 | `=` 컬럼 → 정렬 컬럼 순서로 인덱스가 이미 정렬된 상태 |

---

## 6. 꼬리 질문 대비

| 질문 | 답변 요지 |
| --- | --- |
| EXPLAIN의 `rows`는 정확한가? | 통계 기반 **추정치**다. 실제와 크게 다르면 `ANALYZE TABLE`, 히스토그램, `EXPLAIN ANALYZE`로 실제 값을 비교한다. |
| 인덱스를 많이 만들면 좋은가? | 아니다. 쓰기 성능 저하, 저장 공간 증가, 옵티마이저 선택 혼란. 조회 패턴에 맞는 최소한의 인덱스를 둔다. |
| 카디널리티가 낮은 컬럼(성별 등)에 인덱스는? | 단독으로는 효과가 작다(많은 행을 읽음). 복합 인덱스의 일부로 쓰거나 다른 선택적인 조건과 함께 쓴다. |
| 인덱스가 있는데 안 타는 이유? | 컬럼 가공/함수, 형변환, 선행 `%`, 선두 컬럼 누락, 옵티마이저가 풀 스캔이 더 싸다고 판단(조회 비율이 큰 경우, 약 20~30% 이상 등 상황 의존), 통계 부정확. |
| `type = index`와 `ALL`의 차이? | `index`는 인덱스 전체 스캔(인덱스가 더 작아 빠를 수 있음), `ALL`은 테이블 전체. 둘 다 전체를 읽는다는 점에서 대용량에선 위험. |
| `Using filesort`는 파일에 정렬한다는 뜻인가? | 이름과 달리 반드시 디스크를 쓰는 것은 아니다. 인덱스로 정렬을 못 해 **별도 정렬 알고리즘**을 쓴다는 뜻이며, 메모리(sort buffer)를 넘으면 디스크를 쓴다. |
| 클러스터링 vs 세컨더리 인덱스? | 클러스터링(PK)은 리프 노드에 **행 데이터**가 있다. 세컨더리는 리프에 **PK 값**이 있어 조회 후 PK로 한 번 더 찾는다(커버링 인덱스면 생략). |
| 복합 인덱스 `(a,b)`가 있으면 `a` 단독 인덱스는? | 중복이라 보통 불필요(선두 규칙). 단 `b`만 조건이면 다른 인덱스가 필요하다. |
| 조인에서 인덱스가 필요한 쪽은? | **드리븐(나중에 읽는) 테이블의 조인 컬럼.** 드라이빙 테이블 행마다 드리븐을 인덱스로 찾기 때문이다 (Nested Loop). |
| Hash Join은 언제? | 8.0.18+, 조인 컬럼에 인덱스가 없는 동등 조인에서 사용. 메모리(join buffer) 의존이고 인덱스 조인이 가능하면 그쪽이 낫다. |
| 슬로우 쿼리를 어떻게 찾나? | `slow_query_log`, `long_query_time`, `log_queries_not_using_indexes`, `performance_schema`, `pt-query-digest`, APM. |
| 운영 중 인덱스 추가는 안전한가? | InnoDB Online DDL이 대부분 가능하지만 락·복제 지연·디스크 사용 위험이 있어 off-peak, 대형 테이블은 `pt-online-schema-change`/`gh-ost` 같은 도구를 쓴다. |
| 쿼리 캐시는? | MySQL 8.0에서 **제거**되었다. 캐시는 애플리케이션/Redis 계층에서 한다. |
| 애플리케이션(JPA) 쪽 튜닝은? | N+1(fetch join, batch size), 필요한 컬럼만 DTO 조회, 페이징 전략, 쿼리 로그(`show_sql`/p6spy)로 실제 SQL 확인, 대량 처리는 벌크/배치. |

## 한 줄 요약
- **기준**: 검사 행 수(`rows`), 접근 방식(`type`), 사용 인덱스(`key`/`key_len`), 불필요한 작업(`Extra`: filesort, temporary, join buffer).
- **이유**: 쿼리 비용 ≈ 읽는 페이지 수이며, EXPLAIN은 옵티마이저가 읽으려는 양과 방법을 보여준다.
- **방법**: 인덱스 설계(복합 인덱스 순서, 커버링) + 인덱스를 타는 형태로 쿼리 재작성 + 조인/정렬/페이징 개선 → 전후 EXPLAIN으로 검증.

## 관련 문서
- [DB Connection Pool — 사용 이유와 적정 크기](기술면접/WEB/[JAVA%20기술면접]%20DB%20Connection%20Pool%20—%20사용%20이유와%20적정%20크기.md)
- [멀티 DB 트랜잭션 — 분산 트랜잭션·XA·Saga](기술면접/WEB/[JAVA%20기술면접]%20멀티%20DB%20트랜잭션%20—%20분산%20트랜잭션·XA·Saga.md)
- [Spring·Web 빈출 질문](기술면접/WEB/[JAVA%20기술면접]%20Spring·Web%20빈출%20질문.md) (JPA N+1, OSIV)
- [성능튜닝](기술면접/WEB/[JAVA%20기술면접]%20%20성능튜닝.md)

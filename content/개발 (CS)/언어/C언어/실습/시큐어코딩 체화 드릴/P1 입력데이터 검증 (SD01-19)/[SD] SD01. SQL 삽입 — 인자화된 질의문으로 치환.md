---
title: "SD01. SQL 삽입 — 인자화된 질의문으로 치환"
description: "시큐어코딩 SD01 SQL 삽입 (CWE-89): 취약한 코드를 인자화된 질의문 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-11-11
---

# SD01. SQL 삽입 — 인자화된 질의문으로 치환

> [!TIP]
> - 이론: [Part 1-1. 삽입 계열 — 1. SQL 삽입](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#1-sql-삽입-cwe-89) (`CWE-89`)
> - 실습: [P046_sd01_sqli](https://github.com/sweetpark/c-playgound/tree/main/drill/P046_sd01_sqli) — `make P046` 로 채점

---

## 📌 한눈에 보기

| 항목 | 내용 |
|---|---|
| 취약점 | SQL 삽입 (`CWE-89`) |
| 치환 규칙 | **인자화된 질의문으로 치환** |
| 공격 예 | `x' OR '1'='1` → **로그인 성공(인덱스 0)** |
| 원인 | `where` 문자열이 `...password='x' OR '1'='1'` 가 되어 뒤 조건이 항상 참 |
| 실습 문제 | [P046](https://github.com/sweetpark/c-playgound/tree/main/drill/P046_sd01_sqli) |

---

## 1. 이론 요약

| 항목 | 내용 |
|---|---|
| **신뢰 경계** | 사용자 입력(id·password) → 검증 없이 → SQL 질의문의 구조 |
| **공격 시나리오** | `user_id` 에 `name' OR 'a'='a'--` 를 주면 WHERE 절이 항상 참이 되어 인증을 통과하고 테이블 전체가 조회된다. |
| **치환 규칙** | · 문자열 이어붙이기(`sprintf`+`SQLExecDirect`) → 인자화된 질의문(parameterized statement).<br>· 부득이하면 예약어·특수문자 금지 + 길이 상한 3종 필터. |
| **주의** | 쿼리는 문자열이 아니라 "구조"다. 외부 입력이 질의의 구조를 바꿀 수 있으면 그것이 곧 SQL 삽입이다. |
| **자세한 설명** | [Part 1-1. 삽입 계열 — 1. SQL 삽입](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#1-sql-삽입-cwe-89) (Bad/Good 전체 코드, 보충) |

```diff
- snprintf(where, sizeof(where), "username='%s' AND password='%s'", userId, password);
- return mock_db_login(where);                      /* 조립 후 검사 없음 */
+ if (!is_safe_sql_literal(userId, MAX_USER_ID_LENGTH))     return -1;
+ if (!is_safe_sql_literal(password, MAX_PASSWORD_LENGTH))  return -1;
+ snprintf(where, sizeof(where), "username='%s' AND password='%s'", userId, password);
+ return mock_db_login(where);                      /* 검증된 값만 조립 */
```

---

## 2. 재현 — 신뢰 경계와 공격 입력

**신뢰 경계** : 검증 없이 흘러가는 곳

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `userId` | 외부(로그인 폼) | `where` 절 문자열 조립 |
| `password` | 외부(로그인 폼) | `where` 절 문자열 조립 |

**공격 입력표**

| 입력(`password`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `pw123!` (정상) | 로그인 성공(인덱스 0) | 정상 동작 |
| `x' OR '1'='1` | **로그인 성공(인덱스 0)** | `where` 문자열이 `...password='x' OR '1'='1'` 가 되어 뒤 조건이 항상 참 |
| `wrong` | 로그인 실패(-1) | 정상 동작(오답 처리) |

---

## 3. 주의해야 할 점

1. **Good에서 `strcasestr` 블랙리스트만 걸고 문자 종류는 검사 안 함**
	- `' O R '1'='1`(공백 삽입)처럼 우회 여지가 생긴다.
	- **화이트리스트(영숫자만 허용)** 가 우선이고 예약어 검사는 이중 방어일 뿐
1. **길이 검사를 조립 **후** `where` 버퍼에 대해서 함**
	- 그때는 이미 조립된 뒤라 늦다.
	- `userId`/`password` **원본 값**의 길이를 조립 전에 검사
1. **Good에서 공격 입력을 막다가 정상 입력(`pw123!`)까지 거부**
	- 영숫자만 허용하면서 `!` 를 빼먹지 않았는지 확인
		- 요구사항에 맞게 허용 문자 집합을 다시 정의
1. **`test_bad_is_vulnerable` 을 그냥 지워버림**
	- Bad가 진짜 취약한지 증명하는 시험을 지우면 이 드릴의 핵심(대조군)이 사라진다

---

## 4. 변형 (부록)

같은 치환 규칙을 다른 소재로 다시 치는 문제들이다. 저장소에는 변형 A 만 문제로 있다.

### 변형 B — 상품 카테고리 검색

`category` 문자열로 `mock_db_search(where)` 를 호출(신규 mock 함수, `category='%s'` 형태).
카테고리에 `' OR '1'='1` 을 넣으면 전체 상품이 노출되는지 확인

### 변형 C — 주문 조회

`orderId`, `customerId` 두 값으로 `mock_db_login` 과 동일한 두 칸 WHERE 절을 조립.
단 `orderId` 는 숫자만 허용(길이 제한 대신 `isdigit` 전수 검사)으로 필터 로직을 바꿔본다

---

## 5. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P046` 로 채점 (Bad 가 실제로 뚫린다는 시험 + Good 이 막는다는 시험)
	- Bad 는 `solution.c` 에 이미 들어 있고 Good 만 채운다. 풀고 난 뒤의 해설은 폴더의 `NOTE.md`

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P046 `sqli` | [§1](#1-이론-요약) 이론 요약, [§3](#3-주의해야-할-점) | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P046_sd01_sqli) |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [Part 1-1. 삽입(Injection) 계열](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md)
- [다음: SD02. 자원 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD02.%20자원%20삽입%20—%20화이트리스트%20범위%20검사로%20치환.md)

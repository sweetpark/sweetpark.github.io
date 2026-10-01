---
title: "SD46. 정수를 문자로 변환 — 용도에 맞는 타입 선언으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD46. 정수를 문자로 변환 — 용도에 맞는 타입 선언으로 치환

> **원본 항목**: [Part 5. 코드 오류 — 4. 정수를 문자로 변환](../../시큐어코딩가이드/[시큐어코딩]%20Part%205.%20코드%20오류.md#4-정수를-문자로-변환-cwe-398) `CWE-398`
> **repo 폴더**: `sd46_int2char/` (`make D=sd46_int2char T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> [SD18]([SD]%20SD18.%20의도하지%20않은%20부호%20확장%20—%20원본%20타입으로%20직접%20검사하도록%20치환.md)과 같은 계열의 문제(구현정의 잘림)지만 크래시가 아니라 **"값이 조용히 손상된다"**는 데 초점을 둔다. ASan/UBSan은 이 잘림 자체를 잡아주지 않는다 — 타입 설계로만 막을 수 있다.

---

## 0. 이 드릴로 체화할 것

```diff
- typedef struct { char offsets_bad[MAX_LINES]; } doc_bad_t;   /* 오프셋을 char 배열에 */
- doc->offsets_bad[line] = (char)offset;                        /* 255 초과 시 잘림 */
+ typedef struct { int  offsets_good[MAX_LINES]; } doc_good_t;  /* 용도에 맞는 int 배열 */
+ doc->offsets_good[line] = offset;
```

`char`는 "문자 하나"를 담을 때만 쓴다. 오프셋·카운터·길이처럼 "숫자"를 담아야 한다면, 그 숫자가 실제로 가질 수 있는 범위를 담을 수 있는 타입(`int` 등)을 선언해야 한다.

---

## 1. 취약 시나리오 — 변형 A: 문서 줄 오프셋 저장

> [!QUOTE] 요구사항서 (발췌)
> 문서의 각 줄이 시작하는 바이트 오프셋을 저장한다.
> - 오프셋은 파일 크기에 따라 255를 훨씬 넘을 수 있다.
> - 저장한 오프셋은 나중에 그대로 정확히 읽혀야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `offset`(4바이트 정수 오프셋) | 문서 파싱 결과 | 1바이트 `char` 배열 원소에 대입되는 지점 |

### 공격 입력표

| 입력(`offset`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `1000`(255 초과) | **`232`로 저장됨**(`1000 % 256`) | `char`는 1바이트라 상위 비트가 그냥 잘려나간다 |
| `100`(255 이하) | `100`(정상) | 저장 가능한 범위 안이라 우연히 문제가 안 드러난다 |
| `1000`(Good) | `1000`(정확) | `int` 배열이라 애초에 잘릴 여지가 없다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 문서 줄 오프셋 저장 | 위 내용 |
| **B (2회차)** | **네트워크 패킷 카운터로 변형** | `char packet_count`처럼 8비트로 패킷 수를 세다가 256개째부터 `0`으로 돌아가 카운터가 리셋되는 시나리오로 바꿔본다(실무에서 자주 나오는 변형) |
| **C (3회차)** | **`short`로 한 단계만 키워서 "고친 척"하기** | `char`를 `short`(보통 2바이트, 최대 32767)로만 바꾼 버전을 만들어, 값이 `100000`처럼 더 커지면 여전히 잘린다는 걸 확인한다 — "타입을 조금 키우는 것"과 "용도에 맞는 타입을 쓰는 것"은 다르다 |

---

## 2. 제출물

```text
sd46_int2char/src/int2char.h
sd46_int2char/src/int2char.c
sd46_int2char/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <string.h>
#include "int2char.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_truncates(void)
{
    doc_bad_t doc;
    memset(&doc, 0, sizeof(doc));
    int big_offset = 1000;   /* char 범위(255)를 훨씬 초과 */

    store_offset_bad(&doc, 0, big_offset);
    int got = load_offset_bad(&doc, 0);

    T_TRUE(got != big_offset,
        "Bad는 char 배열에 저장하면서 1000이 잘려 원래 값과 달라져야 한다(취약점 재현)");
    T_TRUE(got == (big_offset % 256),
        "Bad에서 손실된 값은 하위 8비트(모듈로 256)만 남아야 한다");
}

static void test_bad_normal_small_value(void)
{
    doc_bad_t doc;
    memset(&doc, 0, sizeof(doc));
    store_offset_bad(&doc, 0, 100);
    T_TRUE(load_offset_bad(&doc, 0) == 100, "255 이하 값은 Bad에서도 그대로 보존돼야 한다");
}

static void test_good_preserves_value(void)
{
    doc_good_t doc;
    memset(&doc, 0, sizeof(doc));
    int big_offset = 1000;

    store_offset_good(&doc, 0, big_offset);
    int got = load_offset_good(&doc, 0);

    T_TRUE(got == big_offset, "Good은 int 배열에 저장하므로 값이 그대로 보존돼야 한다");
}

int main(void)
{
    test_bad_truncates();
    test_bad_normal_small_value();
    test_good_preserves_value();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] 왜 ASan/UBSan이 이 잘림을 안 잡아주는가
> `int`를 `char`에 대입하는 것은 표준이 명시적으로 허용하는 **구현정의(implementation-defined)** 동작이지, 정의되지 않은 동작(UB)이 아니다. UBSan은 "정의되지 않은 동작"만 감시하므로 이 잘림은 통과시킨다. [SD18]([SD]%20SD18.%20의도하지%20않은%20부호%20확장%20—%20원본%20타입으로%20직접%20검사하도록%20치환.md)에서 확인한 것과 정확히 같은 이유다 — **타입 선택은 새니타이저가 대신해줄 수 없는, 설계자의 책임**이다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_truncates` 통과(정확한 모듈로 256 값까지 확인) | 35 | ☐ |
| `test_good_preserves_value` 통과 | 35 | ☐ |
| `test_bad_normal_small_value` 통과(범위 안에서는 문제없음을 확인) | 20 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 저장 전에 `if (offset > 255) offset = 255;`로 값을 깎아서 "고쳤다"고 생각 | 값을 조작해서 저장하면 원래 오프셋이 영구히 손실된다. 요구사항은 "오프셋이 그대로 읽혀야 한다"이지 "잘려도 괜찮다"가 아니다. 저장소 타입 자체를 바꾸는 것이 유일한 근본 해결책이다 |
| `signed char`와 `unsigned char`의 차이를 신경 안 씀 | 플랫폼에 따라 평범한 `char`가 부호 있는지 없는지가 다르다(구현정의). 이 드릴의 `load_offset_bad`가 `(unsigned char)`로 캐스팅한 이유가 바로 이 차이를 일관되게 다루기 위해서다 |
| "255 이하 값만 쓰니까 안전하다"고 지금 상태만 보고 판단 | 지금은 255 이하만 들어와도, 문서가 커지거나 입력 소스가 바뀌면 언제든 초과 값이 들어올 수 있다. 타입은 "지금 들어오는 값"이 아니라 "논리적으로 가질 수 있는 값의 범위"에 맞춰 선언해야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `int2char.h` / `int2char.c`
> ```c
> #ifndef INT2CHAR_H
> #define INT2CHAR_H
> #define MAX_LINES 4
> typedef struct { char offsets_bad[MAX_LINES]; } doc_bad_t;
> typedef struct { int  offsets_good[MAX_LINES]; } doc_good_t;
> void store_offset_bad(doc_bad_t *doc, int line, int offset);
> int  load_offset_bad(doc_bad_t *doc, int line);
> void store_offset_good(doc_good_t *doc, int line, int offset);
> int  load_offset_good(doc_good_t *doc, int line);
> #endif
> ```
> ```c
> #include "int2char.h"
>
> void store_offset_bad(doc_bad_t *doc, int line, int offset)
> {
>     doc->offsets_bad[line] = (char)offset;      /* 255 초과 시 잘림 */
> }
>
> int load_offset_bad(doc_bad_t *doc, int line)
> {
>     return (int)(unsigned char)doc->offsets_bad[line];
> }
>
> void store_offset_good(doc_good_t *doc, int line, int offset)
> {
>     doc->offsets_good[line] = offset;            /* 용도에 맞는 타입이라 잘림 없음 */
> }
>
> int load_offset_good(doc_good_t *doc, int line)
> {
>     return doc->offsets_good[line];
> }
> ```
>
> **눈여겨볼 점**: `store_offset_bad`와 `store_offset_good`의 대입문(`doc->offsets_X[line] = ...`) 자체는 문법적으로 거의 똑같다. 차이는 오직 **구조체 정의에서 배열의 원소 타입**(`char` vs `int`) 하나다. 이 항목 전체가 "코드 로직"이 아니라 "선언"의 문제라는 걸 보여준다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (문서 줄 오프셋) |  |  |  |
| 2 |  | B (패킷 카운터) |  |  |  |
| 3 |  | C (short로 절반만 고치기) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD45. 부호→무부호 변환 오류]([SD]%20SD45.%20부호%20정수를%20무부호%20정수로%20타입%20변환%20오류%20—%20안전한%20에러값으로%20치환.md)
- [다음: SD47. 스택 변수 주소 리턴]([SD]%20SD47.%20스택%20변수%20주소%20리턴%20—%20힙%20할당%20반환으로%20치환.md)

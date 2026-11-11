---
title: "D3. 자원 잡는 함수 — goto CLEANUP·create·destroy"
description: "goto CLEANUP, create, destroy 쌍으로 실패 경로의 자원 누수를 막는 방법을 체화하는 D3 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-11-11
---

# D3. 자원 잡는 함수 — goto CLEANUP·create·destroy

> **쓰는 템플릿**: [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md) 5-2 · 5-3 절

> [!TIP]
> - 이론: 아래 §1 표의 **코드 골격 노트** 해당 절 (링크만 걸고 핵심만 요약했다)
> - 실습: [P041_d3_cfg](https://github.com/sweetpark/c-playgound/tree/main/drill/P041_d3_cfg) — `make P041` 로 채점 (요구사항 전문은 폴더의 `problem.md`)

---

## 📌 한눈에 보기

| 항목 | 내용 |
|---|---|
| 체화할 것 | 자원을 잡는 함수: goto CLEANUP · create / destroy |
| 변형 A | 설정 파일 로더 |
| 변형 B | 세션 컨텍스트 생성기 |
| 변형 C | 두 파일 병합기 |
| 실습 문제 | [P041](https://github.com/sweetpark/c-playgound/tree/main/drill/P041_d3_cfg) (변형 A) |

---

## 1. 이론은 여기 — 코드 골격 노트

| 핵심 요약 | 노트 (절로 바로 이동) |
|---|---|
| 자원을 잡는 함수의 골격: `ret = RET_FAIL` 로 시작 · 포인터 전부 `NULL` · 가드 · 실패하면 `goto CLEANUP` · 성공은 맨 끝 한 줄 · 해제는 **잡은 역순**으로 한 곳 | [골격 1 · §5-2 자원을 잡는 함수 (누수 방어판)](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md#5-2-자원을-잡는-함수-누수-방어판) |
| 해제 매크로: `free` 후 `NULL` 대입으로 이중 `free` 를 막는다 | [골격 1 · §4-1 해제 매크로 — 두 번 free 를 막는다](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md#4-1-해제-매크로--두-번-free-를-막는다) |
| 할당 실패도 반드시 검사. 원인이 인자가 아니라 메모리이므로 `RET_NO_MEM` 으로 구분 (`CHK_ALLOC*`) | [골격 1 · §4-3 할당 실패도 반드시 검사](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md#4-3-할당-실패도-반드시-검사) |
| 자원을 **만들어서 돌려주는** 함수 (create / destroy 와 소유권) | [골격 1 · §5-3 자원을 **만들어서 돌려주는** 함수](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md#5-3-자원을-만들어서-돌려주는-함수) |
| 에러코드는 덮어쓰지 않고 그대로 올린다 | [골격 1 · §1-3 호출부에서 쓰는 모양](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md#1-3-호출부에서-쓰는-모양) |

---

## 2. 이 드릴이 노리는 모양

```c
int f(const in_t *in, out_t *out)
{
    int   ret = RET_FAIL;        /* ① 실패가 기본값. 성공은 맨 끝에서만 덮어쓴다 */
    char *buf = NULL;            /* ② 포인터는 전부 NULL, fd 는 -1 로 선언 */
    FILE *fp  = NULL;
    int   fd  = -1;

    CHK_PTR(in);                 /* ③ 자원 잡기 전 → 즉시 return (goto 아님) */
    CHK_PTR(out);
    memset(out, 0x00, sizeof(*out));

    buf = calloc(1, N);
    CHK_ALLOC_GOTO(buf, ret, CLEANUP);  /* ④ 첫 자원을 잡은 뒤부터는 전부 goto (할당 실패는 NO_MEM) */

    ret = RET_OK;                /* ⑤ 끝까지 왔을 때만 성공 */
CLEANUP:
    SAFE_FCLOSE(fp);             /* ⑥ 잡은 역순 */
    SAFE_FREE(buf);
    SAFE_CLOSE(fd);
    if (ret != RET_OK) memset(out, 0x00, sizeof(*out));   /* ⑦ 실패면 출력을 비운다 */
    return ret;
}
```

**①②⑤⑥이 한 세트다.** 하나만 빠져도 누수 아니면 double free 가 된다.

### 소유권 규칙 — create / destroy

| 상황 | 누가 해제하나 |
| :--- | :--- |
| `_create()` 가 `RET_OK` | **호출부**가 `_destroy()` 해야 한다 |
| `_create()` 가 실패 | **내부에서 전부 정리하고** `*out_obj = NULL` 로 둔다. 호출부는 아무것도 안 한다 |
| `_destroy(NULL)` | **합법이어야 한다.** 아무 일도 안 하고 리턴 |
| `_destroy()` 를 두 번 | 호출부가 포인터를 NULL 로 만들게 **`_destroy(obj_t **)`** 로 받는 것도 방법 |

---

## 3. 주의해야 할 점

1. **`p = realloc(p, n)`**
	- realloc 실패 시 **원본 포인터를 잃어버린다** → 확정 누수. `tmp` 로 받고 성공했을 때만 대입
1. **`CLEANUP` 앞에서 `return ret;` 을 추가로 함**
	- 그 경로만 해제를 건너뛴다. **출구는 하나**
1. **해제 순서를 잡은 순서대로**
	- 버퍼를 먼저 free 하고 그 버퍼를 쓰는 `fclose` 후처리를 하면 use-after-free
1. **`_destroy()` 안에서 멤버만 free 하고 객체 자체를 안 함**
	- 객체 크기만큼 매번 샌다
1. **성공했는데 `ret` 을 안 바꿈**
	- `RET_FAIL` 로 시작했으니 **정상인데 실패로 리턴**된다. 제일 흔한 자책골
1. **`goto CLEANUP` 이 변수 선언을 건너뜀**
	- `-Wjump-misses-init` / C++ 에서는 컴파일 에러.
	- **선언은 전부 함수 맨 위**
1. **(B) `CLEANUP` 이 mutex 를 `init` 도 안 한 채 `destroy` 함**
	- 정의되지 않은 동작.
	- `sess_destroy` 가 "init 됐는지"를 알 수 있게 mutex 를 **포인터로 두고 NULL 로 구분**한다
1. **(B) 이름 배열은 해제하고 안쪽 문자열은 안 함**
	- 이름 개수만큼 샌다.
	- **안쪽 → 바깥** 순서로 해제한다
1. **(C) 쓰기 파일을 `SAFE_FCLOSE` 로 닫음**
	- 디스크 가득 참 같은 쓰기 오류가 `fclose` 에서 드러나는데 **성공으로 보고**한다.
	- `SAFE_FCLOSE_RET`
1. **(C) 실패 경로에서 `dst` 를 안 지움**
	- 반쯤 쓴 파일이 남아 다음 실행이 그걸 읽는다
1. **(C) `fd` 를 `0` 으로 초기화**
	- `0` 은 표준입력이다. `SAFE_CLOSE` 가 stdin 을 닫아 버린다.
	- **`-1`** 로 초기화한다

---

## 4. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P041` 로 채점, 풀고 난 뒤의 해설은 폴더의 `NOTE.md`
	- 타입·상수가 든 헤더는 문제 폴더에 이미 있고 `solution.c` 의 함수 본문만 채운다

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P041 `cfg` (변형 A) | [§1](#1-이론은-여기--코드-골격-노트) 골격 노트, [§3](#3-주의해야-할-점) | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P041_d3_cfg) |

---

## 부록. 변형 B / C 요구사항

저장소에는 아직 문제로 옮기지 않았다.

### 변형 B — 세션 컨텍스트 생성기

객체 안에 **동적 자원 3개**(버퍼 / 문자열 배열 / mutex)를 잡는다.
중간에 실패하면 **잡은 것만 역순으로** 해제하는 것이 핵심이다.

**함수**

| 함수 | 요구사항 |
| :--- | :--- |
| `int sess_create(const sess_cfg_t *cfg, sess_t **out)` | 세션을 만든다.<br>**실패하면 `*out` 은 NULL**, 내부에서 전부 정리한다. |
| `void sess_destroy(sess_t *s)` | NULL 안전.<br>mutex 를 먼저 `destroy` 한 뒤 나머지를 해제한다. |
| `const char *sess_name(const sess_t *s, uint8_t i)` | `i` 번째 이름.<br>범위 밖이면 NULL |
| `uint32_t sess_buf_size(const sess_t *s)` | 버퍼 크기 |
| `int sess_lock(sess_t *s)` / `int sess_unlock(sess_t *s)` | mutex 잠금 / 해제 |

**입력 `sess_cfg_t`**

| 필드 | 타입 | 필수 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `buf_size` | `uint32_t` | O | 1 ~ 65536 | 버퍼 크기 |
| `name_cnt` | `uint8_t` | O | 0 ~ 16 | 이름 개수 |
| `names` | `const char *[16]` | O | `name_cnt` 개는 NULL 이 아니어야 한다 | **깊은 복사**한다 |

**규칙**

1. 할당 순서는 `객체 → 버퍼 → 이름 배열(+각 문자열) → mutex` 이다.
2. 어느 단계에서 실패해도 **그때까지 잡은 것만** 해제한다.
3. 이름은 `strdup` 으로 복사한다 (원본을 바꿔도 세션은 안 변한다).
4. `name_cnt == 0` 이면 이름 배열을 할당하지 않는다.

**에러 코드 규칙 (B)**

| 상황 | 리턴코드 |
| :--- | :--- |
| `cfg` / `out` 이 NULL, `buf_size` 범위 밖, `name_cnt > 16`, 이름이 NULL | `RET_INVALID_ARG` |
| 할당 실패 | `RET_NO_MEM` |
| `pthread_mutex_init` 실패 | `RET_FAIL` |

### 변형 C — 두 파일 병합기

`fd` 2개 + `FILE*` 1개 + 버퍼 1개, **자원 4종**이 섞인다.
`fd` 는 `-1`, `FILE*` 와 포인터는 `NULL` 로 초기화해야 `SAFE_*` 가 안전하다는 것을 손으로 익힌다.

**함수**: `int merge_files(const char *a, const char *b, const char *dst, size_t *out_bytes);`

**규칙**

1. `a` 를 읽고, 이어서 `b` 를 읽어서 `dst` 에 **이어 쓴다** (4096바이트 버퍼로 반복).
2. `a` / `b` 는 `open(O_RDONLY)`, `dst` 는 `fopen("w")` 로 연다.
3. 성공하면 `*out_bytes` 에 쓴 바이트 수를 넣는다.
   **실패하면 `*out_bytes = 0`** 이다.
4. **실패하면 `dst` 파일을 지운다** (반쯤 쓴 파일이 남지 않는다).
5. `dst` 는 쓰기 파일이므로 **`fclose` 실패도** 결과에 반영한다 (`SAFE_FCLOSE_RET`).
6. `dst` 가 `a` 또는 `b` 와 **같은 경로**면 거절한다.

**에러 코드 규칙 (C)**

| 상황 | 리턴코드 | 로그 |
| :--- | :--- | :--- |
| 인자가 NULL, `dst` 가 `a` / `b` 와 같은 경로 | `RET_INVALID_ARG` | 가드가 남긴다 |
| 파일을 열 수 없음, 읽기·쓰기·`fclose` 실패 | `RET_IO_ERROR` | O (`LOG_ERRNO`) |
| 버퍼 할당 실패 | `RET_NO_MEM` | O |

---

## 관련 노트

- [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md)
- [[C] 불투명 포인터(Opaque Pointer) — 헤더는 선언만, 구현은 숨기기](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20불투명%20포인터%28Opaque%20Pointer%29%20—%20헤더는%20선언만,%20구현은%20숨기기.md)
- [[C] 공개 래퍼(Wrapper)와 내부 코어(Core) 분리 패턴](개발%20%28CS%29/언어/C언어/설계%20패턴·코드%20관례/[C]%20공개%20래퍼%28Wrapper%29와%20내부%20코어%28Core%29%20분리%20패턴%20—%20언더스코어%28__%29%20관행과%20C%20표준%20예약어.md)
- [[C] 개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md)
- [다음: D4. Pack / Unpack](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D4.%20Pack·Unpack%20—%20비트필드·엔디안·왕복시험.md)

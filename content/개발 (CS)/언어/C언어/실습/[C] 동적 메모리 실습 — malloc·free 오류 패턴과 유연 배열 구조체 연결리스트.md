---
title: "(C) 동적 메모리 실습 — malloc·free 오류 패턴과 유연 배열 구조체 연결리스트"
description: "malloc과 free의 오류 패턴(double free, free 후 참조, 해제 누락, 크기 계산 오류)을 정리하고 유연 배열 구조체 연결리스트를 구현했습니다."
tags: 
created: 2026-10-13
modified: 2026-11-11
---

# 동적 메모리 — 크기·초기화·해제·정리 패턴

---

## 📌 한눈에 보기 — 주의해야 할 점

| # | 주의 | 왜 | 처방 | 상세 |
|---|---|---|---|---|
| 1 | 크기는 `sizeof(*p)` | `sizeof(p)` 는 포인터 크기 (8) | `p = malloc(sizeof(*p))` | [§2](#2-할당-크기) |
| 2 | 크기 인자는 `size_t`, 곱하기 전에 검사 | `int` 음수 → 거대한 값, `n * size` 래핑 | `n > SIZE_MAX / size` 먼저 | [§2](#2-할당-크기) |
| 3 | `malloc` 은 **초기화하지 않는다** | 이전 값이 남아 있음 | `calloc` / `memset` | [§2](#2-할당-크기) |
| 4 | 해제 책임자는 **할당한 쪽 하나** | 검증 함수가 또 `free` → double free | `free` 후 `NULL` 대입 | [§3](#3-해제-오류) |
| 5 | `free(p)` 뒤에 `p->...` 금지 | 해제된 메모리를 읽음 | 해제 **전에** `next` 저장 | [§3](#3-해제-오류) |
| 6 | 에러 경로에서 `free` 누락 | 경로마다 정리 코드가 흩어짐 | `NULL` 로 시작 + `goto CLEANUP` | [§4](#4-에러-경로-자원-정리) |
| 7 | `realloc` 결과를 원래 포인터에 바로 대입 금지 | 실패(`NULL`)하면 원본을 잃음 | 임시 변수 → 검사 → 대입 | [§5](#5-realloc) |
| 8 | `realloc` 은 **주소를 바꾼다** | 호출자 포인터가 옛 주소를 가짐 | 이중 포인터 또는 반환값으로 전달 | [§5](#5-realloc) |
| 9 | 유연 배열 구조체는 **헤더 + 데이터** | `sizeof` 에 데이터가 빠져 있음 | 대입 대신 `memcpy`, 값 전달 대신 포인터 | [§6](#6-유연-배열-멤버) |

---

## 1. 메모리 오류는 이 네 가지

| 유형 | 증상 | 예 |
|---|---|---|
| 크기를 잘못 잡는다 | 힙 오버플로 | `malloc(sizeof(tmb))` (포인터 크기) |
| 초기화를 안 한다 | 쓰레기값을 읽음 | `malloc` 직후 `prt_mem` |
| 해제를 잘못한다 | double free, 해제 후 참조 | `free(p); p->next` |
| 해제를 안 한다 | 누수 | 에러 경로의 `return` |

---

## 2. 할당 크기

### 2-1. sizeof 관용구

```diff
- struct tm *tmb = malloc(sizeof(tmb));      /* 포인터 크기 8바이트 → 쓰는 순간 힙 오버플로 */
+ struct tm *tmb = malloc(sizeof(*tmb));     /* 가리키는 타입의 크기. 타입이 바뀌어도 따라간다 */
```

> [!NOTE] 요약
> - `widget *p = malloc(sizeof(gadget))` 는 `void *` 가 암묵 변환되어 **경고 없이** 통과한다
> - 해법은 타입을 한 곳에서 맞추는 장치
>   - `sizeof(*p)` : 매크로 없이 쓸 수 있고 변수 타입을 따라간다
>   - 타입 매크로 `MALLOC(type)` : 서로 다른 타입을 쓰면 컴파일러가 경고한다
> - 둘 다 `(number) * sizeof(type)` 의 **곱셈 오버플로는 못 막는다**

→ 연습: [P010 conn_reset](https://github.com/sweetpark/c-playgound/tree/main/drill/P010_conn_reset), [P036 safe_macros](https://github.com/sweetpark/c-playgound/tree/main/drill/P036_safe_macros)

### 2-2. 0, 음수, 곱셈 오버플로

| 입력 | 문제 | 처방 |
|---|---|---|
| `malloc(0)` | 결과가 **구현 정의** (`NULL` 일 수도, 유일한 포인터일 수도) | 역참조하지 않는다. "NULL 이면 실패" 판정은 0바이트 요청에서 틀릴 수 있다 |
| `int` 음수 크기 | `size_t` 로 변환되며 거대한 값 | 크기 인자는 `size_t` 로 받고 범위 검사 |
| `n * sizeof(T)` | 곱셈이 래핑되면 **작은 버퍼**가 할당됨 | `n > SIZE_MAX / sizeof(T)` 를 호출 전에 확인 |
| `calloc(n, size)` | 많은 구현이 오버플로 시 `NULL` 이지만 **표준이 보장하지 않음** | 직접 곱하는 코드라면 위 검사를 먼저 |

### 2-3. 초기화되지 않은 메모리

- `malloc` 은 이전에 쓰이다 해제된 값이 **그대로** 남아 있다
- 테스트에서는 우연히 0 이라 통과하고 운영에서만 깨지기 쉽다
- 대응
	- `calloc` 또는 `memset`
	- **읽는 크기는 할당 크기 이내**
	- 비밀번호·키를 담았던 버퍼는 해제 전에 지운다

```diff
- buf = malloc(32);  strcpy(buf, "Hello");  prt_mem(buf, 50);   /* 나머지는 쓰레기, 게다가 32바이트를 넘겨 읽음 */
+ buf = calloc(1, 32);  strcpy(buf, "Hello");  prt_mem(buf, 32);
```

→ 연습: [P007 int_array](https://github.com/sweetpark/c-playgound/tree/main/drill/P007_int_array)

---

## 3. 해제 오류

### 3-1. double free — 해제 책임자는 한 곳

```diff
  int verify_size(char *list, size_t size) {
      if (size < MIN_SIZE_ALLOWED) {
-         free(list);                  /* 검증 함수가 해제하고 */
          return -1;
      }
  }
  void process_list(size_t n) {
      char *list = malloc(n);
      if (verify_size(list, n) == -1) {
          free(list);                  /* 호출한 쪽이 또 해제 → double free */
          return;
      }
  }
```

- **할당한 쪽만 해제**한다. 검증 함수는 판단만 한다
- 같은 모듈·같은 추상화 수준에서 할당하고 해제 (그래야 누가 언제 해제했는지 안다)
- `free` 후 `NULL` 대입 + `free(NULL)` 은 안전하다

> [!TIP] 해제 후 `NULL` 대입이 필요한 때
> - 같은 포인터가 **나중에 또 쓰일 수 있을 때** (예: 비트마스크 두 개가 모두 켜진 메시지에서 `free` 가 두 번 불리는 경우)
> - 지역 포인터가 `free` 직후 곧바로 스코프를 벗어나면 생략해도 된다

```c
#define FREE(ptr) do { if ((ptr) != NULL) { free(ptr); (ptr) = NULL; } } while (0)
```

- 왜 `do { } while (0)` 인가
	- `{ }` 블록으로만 정의하면 `if (c) FREE(p); else ...` 에서 `;` 가 `if` 를 끝내 `else` 가 짝을 잃는다
	- → 연습: [P036 safe_macros](https://github.com/sweetpark/c-playgound/tree/main/drill/P036_safe_macros)

### 3-2. 해제 후 참조 — 운영 장애의 단골

```diff
- for (p = head; p != NULL; p = p->next) free(p);       /* free(p) 이후 p->next 를 읽는다 */
+ struct node *next;
+ for (p = head; p != NULL; p = next) {
+     next = p->next;                                   /* 해제 전에 저장 */
+     free(p);
+ }
```

> [!WARNING] 왜 위험한가
> - 해제된 메모리에 **이전 값이 우연히 남아 있어서 테스트가 통과**한다
> - 실제 운영 장애로 이어진 사례가 있다 (연결리스트 해제 함수가 `free(p)` 뒤에 `p->next` 를 읽어 프로세스 블록이 재기동)

→ 연습: [P008 list_free](https://github.com/sweetpark/c-playgound/tree/main/drill/P008_list_free)

---

## 4. 에러 경로 자원 정리

- 에러가 날 때마다 `free` · `fclose` 를 직접 쓰면 **경로가 늘수록 하나를 빼먹는다**
- 해법: 자원 포인터를 `NULL` 로 시작하고 **정리 구간 한 곳**으로 모은다

```c
int do_something(void) {
    FILE *fin1 = NULL, *fin2 = NULL;
    object_t *obj = NULL;
    int ret_val = NOERR;

    obj = malloc(sizeof(*obj));
    if (obj == NULL)  { ret_val = errno; goto CLEAN; }
    fin1 = fopen("some_file", "r");
    if (fin1 == NULL) { ret_val = errno; goto CLEAN; }
    fin2 = fopen("some_other_file", "r");
    if (fin2 == NULL) { ret_val = errno; goto CLEAN; }
    /* ... */
CLEAN:
    if (fin2) fclose(fin2);
    if (fin1) fclose(fin1);
    free(obj);
    return ret_val;
}
```

| 규칙 | 이유 |
|---|---|
| 포인터를 `NULL` 로 시작 | 어디서 실패해도 `CLEAN` 에서 안전하게 해제 |
| 정리는 **획득의 역순** | 의존 관계 보존 |
| `errno` 는 **실패 직후 바로 저장** | 사이의 `printf`·`fclose`·`free` 가 바꿀 수 있다 |
| `goto` 는 정리 지점으로의 점프에만 | 흐름을 읽기 쉽게 |

→ 연습: [P009 rec_create](https://github.com/sweetpark/c-playgound/tree/main/drill/P009_rec_create) (N 번째 `malloc` 을 일부러 실패시켜 누수를 잡는다)

---

## 5. realloc

> [!NOTE] 요약
> - **문제**: 모자라면 늘리는 `append` 에서 `realloc` 실패 시 원본 소실, 이어 붙일 위치 오류
> - **원인**: `realloc` 은 주소를 바꿀 수 있고, 반환값을 원래 포인터에 바로 대입하면 `NULL` 일 때 누수
> - **처방**: 이중 포인터 `Array **` 로 받고, 임시 변수 `tmp` 로 검사한 뒤 대입

```diff
- list = realloc(list, new_size);               /* 실패(NULL) 하면 원본 주소를 잃어 누수 */
+ Array *tmp = realloc(list, new_size);
+ if (tmp == NULL) return -1;                    /* list 는 그대로 유효 */
+ list = tmp;
+ *plist = list;                                 /* 호출자 포인터 갱신 (이중 포인터) */
```

- 같이 놓치기 쉬운 것
	- 이어 붙일 위치는 **할당 크기(size)가 아니라 현재 문자열 길이(len)**
	- 초기 상태는 **빈 문자열** (`str_chr[0] = '\0'`)
	- 길이 루프 조건은 `count < size && str_chr[count] != '\0'` (`||` 로 쓰면 널을 만나도 안 멈춘다)

→ 연습: [P012 sbuf_append](https://github.com/sweetpark/c-playgound/tree/main/drill/P012_sbuf_append)

---

## 6. 유연 배열 멤버

```
malloc(sizeof(구조체) + sizeof(int) * 4)

 ┌──────────────┬────────┬────────┬────────┬────────┐
 │ num (8바이트)  │ data[0] │ data[1] │ data[2] │ data[3] │
 └──────────────┴────────┴────────┴────────┴────────┘
   └ sizeof 에 포함 ┘└────────── 할당할 때 따로 붙인다 ──────────┘
```

```c
struct flex_array_struct { size_t num; int data[]; };    /* 크기 없는 마지막 멤버 */
fas = malloc(sizeof(struct flex_array_struct) + sizeof(int) * 4);
```

| 하면 안 되는 것 | 이유 | 처방 |
|---|---|---|
| `*b = *a` 로 복사 | `sizeof` 에 잡히는 **헤더만** 복사됨 | `memcpy(b, a, sizeof(*a) + sizeof(int) * a->num)` (대상에도 같은 크기 할당) |
| 스택 변수로 선언 | 구조체가 8바이트뿐이라 `data[i]` 가 스택을 오염 | 반드시 `malloc` 등으로 크기를 계산해 할당 |
| 값으로 전달 | 복사본에 `data[]` 가 없음 | `const struct flex_array_struct *p` 로 포인터 전달 |

→ 연습: [P011 blob_clone](https://github.com/sweetpark/c-playgound/tree/main/drill/P011_blob_clone)

---

## 7. 연결리스트

```
 msg_list_t ──head──▶ [next|len|data] ─▶ [next|len|data] ─▶ [next|len|data] ─▶ NULL
      └─────tail────────────────────────────────────────────────▲
```

| 처음 코드 | 문제 | 고친 코드 |
|---|---|---|
| `malloc(sizeof(node) * sizeof(char) * len)` | 과도한 할당, 유연 배열 크기 계산이 틀림 | `sizeof(node) + len + 1` |
| 새 노드의 `next` 미초기화 | 쓰레기 포인터가 리스트에 연결됨 | `next = NULL` |
| `strlen(src)` 와 `len` 을 섞어 사용 | 길이 불일치 | `memcpy(len)` + 널 종료로 통일 |
| `pre_node` 초기화 없이 사용 | 첫·마지막 삭제 처리 오류 | `pre_node = NULL` 로 시작해 경우 분기 |
| `free_list` 없음 | 누수 | 노드 + list 전체 해제 |
| 더미 head + 끝까지 순회해 삽입 | 삽입이 O(n) | list 구조체의 `tail` 사용 → **O(1)** |

- 삭제할 때
	- 첫 노드 삭제 → `head` 갱신
	- 마지막 노드 삭제 → `tail` 도 갱신
	- `index <= 0 || index > count` 검사

→ 연습: [P008 list_free](https://github.com/sweetpark/c-playgound/tree/main/drill/P008_list_free)

---

## 8. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P007` 처럼 번호만으로 채점
	- 풀고 난 뒤의 해설은 각 폴더의 `NOTE.md`

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P007 `int_array` | [§2](#2-할당-크기) 초기화·곱셈 오버플로·`malloc(0)`, 해제 후 `NULL` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P007_int_array) |
| P008 `list_free` | [§3](#3-해제-오류) 해제 후 참조, [§7](#7-연결리스트) 삭제 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P008_list_free) |
| P009 `rec_create` | [§4](#4-에러-경로-자원-정리) early return 누수, `goto` 정리 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P009_rec_create) |
| P010 `conn_reset` | [§2](#2-할당-크기) `sizeof(*p)` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P010_conn_reset) |
| P011 `blob_clone` | [§6](#6-유연-배열-멤버) 헤더 + 데이터 복사 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P011_blob_clone) |
| P012 `sbuf_append` | [§5](#5-realloc) 이중 포인터·임시 변수 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P012_sbuf_append) |
| P036 `safe_macros` | [§3](#3-해제-오류) `FREE`, [§2](#2-할당-크기) `XNEW` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P036_safe_macros) |

- 원본 강의 코드
	- [`c_basic/lecture/mem/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/mem) (9-01 ~ 9-11)
	- [`c_basic/mem/mem_ex.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/mem/mem_ex.c), [`linkedlist.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/mem/linkedlist.c)

---
title: "(C) 문자열 함수 실습 — strncpy·strncat 직접 구현과 오버플로 함정"
description: "C 문자열 실습에서 만난 널 문자, const, signed/unsigned char, off-by-one 오류를 정리하고 strncpy와 strncat을 직접 구현했습니다."
tags: 
created: 2026-10-13
modified: 2026-11-11
---

# 문자열 — 널 종료·경계·복사 함수의 보장과 비보장

---

## 📌 한눈에 보기 — 주의해야 할 점

| # | 주의 | 왜 | 처방 | 상세 |
|---|---|---|---|---|
| 1 | 크기는 **글자 수 + 1** | 널 문자 자리 | `len + 1 > size` 로 검사 | [§4](#4-경계-계산-규칙) |
| 2 | **쓰기 전에** 검사 | 쓴 뒤엔 이미 덮어씀 | 실패하면 대상 불변 | [§4](#4-경계-계산-규칙) |
| 3 | `strncpy` ≠ 안전한 `strcpy` | 꽉 차면 널 안 붙임 | 마지막 칸 `'\0'` 직접, 또는 `snprintf` | [§3](#3-복사연결-함수가-실제로-보장하는-것) |
| 4 | `snprintf` 반환값 확인 | "쓰려던 길이"를 돌려줌 | `n < 0` 또는 `n >= size` 이면 잘림 | [§3](#3-복사연결-함수가-실제로-보장하는-것) |
| 5 | 함수 안 `sizeof(인자)` 금지 | 인자 배열은 포인터 (8바이트) | 크기를 인자로 따로 받기 | [§2-4](#2-4-배열과-포인터-sizeof) |
| 6 | `size_t` 끼리 빼지 않기 | `0 - 1` 은 거대한 값 | 먼저 0 거절, 큰 값 − 작은 값만 | [§4](#4-경계-계산-규칙) |
| 7 | 루프 조건에 **변하는 값** 금지 | `strlen(dst)` 가 쓰는 중에 변함 | 루프 전에 한 번 구해 변수에 | [§4](#4-경계-계산-규칙) |
| 8 | 리터럴·`const` 입력 수정 금지 | 읽기 전용 영역 (SIGSEGV) | 복사해서 자르기, `strtok_r` | [§2-2](#2-2-리터럴은-읽기-전용이다), [§6](#6-입력-읽기와-외부-값) |
| 9 | `NULL` ≠ `""`, 입력은 외부 값 | 길이를 내가 정하지 않음 | 진입부 검사, 상한 + EOF | [§5](#5-null과-빈-문자열), [§6](#6-입력-읽기와-외부-값) |

---

## 1. 사고는 이 셋 중 하나

C에는 문자열 타입이 없다. **문자 배열 + 약속(끝에 `'\0'`)** 이 전부이고, 지킬 책임은 코드 작성자에게 있다.

| 유형 | 증상 | 예 |
|---|---|---|
| 끝을 못 찾는다 | `'\0'` 이 없어 버퍼 밖을 읽음 | `strncpy` 후 `printf("%s")` |
| 끝을 넘어 쓴다 | 결과가 대상보다 커서 옆 메모리를 덮음 | `strcpy(buf24, input)` |
| 끝이 한 칸 틀린다 | 널 문자 자리(+1) 누락 | `dest[n] = '\0'` (off-by-one) |

---

## 2. C 문자열의 정체

### 2-1. 널 종료 바이트 배열

```
char a[16] = "12345";

 index : 0  1  2  3  4  5   6 … 15
 value : 1  2  3  4  5  \0  ?  …  ?
                        ▲
         strlen(a) == 5 │   sizeof(a) == 16
```

> [!NOTE] 요약
> - `"Hello"` = `H e l l o \0` → **6바이트**
> - **배열 크기 = 글자 수 + 1**
> - `strlen` 은 첫 `'\0'` 까지 센다 (널 문자는 제외)

### 2-2. 리터럴은 읽기 전용이다

```diff
- char *p = "Hello";
- p[0] = 'h';              /* 정의되지 않은 동작 (보통 SIGSEGV) */
+ char buf[] = "Hello";    /* 배열로 복사 */
+ buf[0] = 'h';
```

> [!TIP] 입력 문자열을 받는 함수는
> - `const char *` 로 받는다
> - 원본에 `'\0'` 을 써서 자르지 않는다
> - 위치(길이)만 구해 **출력 버퍼에 복사** → [P005 get_dirname](https://github.com/sweetpark/c-playgound/tree/main/drill/P005_get_dirname)

### 2-3. char / signed char / unsigned char 는 서로 다른 세 타입

| 용도 | 쓰는 타입 |
|---|---|
| 문자열 | `char *` (통일) |
| 바이트 데이터 | `unsigned char *` + `size_t` 길이 |
| 섞어 넘기면 | `-Wpointer-sign` 경고 |

### 2-4. 배열과 포인터, `sizeof`

| 위치 | `char buf[32]` 의 `sizeof(buf)` | 이유 |
|---|---|---|
| 선언된 스코프 안 | **32** | 배열 그 자체 |
| `void f(char buf[32])` 안 | **8** (64비트) | 인자 `buf` 는 사실 `char *` |
| `char *p = buf;` 의 `sizeof(p)` | **8** | 포인터 크기 |

```diff
- void fill(char *dst)        { memset(dst, 0, sizeof(dst)); }   /* 8바이트만 지워짐 */
+ void fill(char *dst, size_t n) { memset(dst, 0, n); }          /* 크기는 인자로 */
```

| 구하려는 것 | 식 |
|---|---|
| 원소 개수 | `sizeof(a) / sizeof(a[0])` |
| 바이트 수 (`memset`·`memcpy` 의 세 번째 인자) | `sizeof(a)` |

→ 연습: [P002 sizeof_macros](https://github.com/sweetpark/c-playgound/tree/main/drill/P002_sizeof_macros)

---

## 3. 복사·연결 함수가 실제로 보장하는 것

| 함수                       | 널 종료                     | 잘림 알림               | 비고                                  |
| ------------------------ | ------------------------ | ------------------- | ----------------------------------- |
| `strcpy`, `strcat`       | 원본이 끝나면 O                | 없음                  | 대상 크기를 모른다 → 오버플로                   |
| `strncpy(d, s, n)`       | **`strlen(s) >= n` 이면 X** | 없음                  | 짧으면 나머지를 `\0` 으로 `n` 까지 채운다(비용)     |
| `strncat(d, s, n)`       | 항상 O                     | 없음                  | `n` 은 대상 크기가 **아니라** 붙일 최대 글자 수     |
| `snprintf(d, size, ...)` | `size > 0` 이면 항상 O       | 반환값으로 알 수 있음        | 반환값 = "잘리지 않았다면 쓰였을 길이"             |
| `strlcpy` (비표준)          | 항상 O                     | 반환값 = `strlen(src)` | BSD 계열, glibc 는 2.38부터              |
| `memcpy(d, s, n)`        | 해당 없음                    | 없음                  | 겹치면 UB(`memmove`), 널 문자는 `n` 에 직접 포함 |

참고: [`strncpy`](https://man7.org/linux/man-pages/man3/strncpy.3.html) · [`strcat` / `strncat`](https://man7.org/linux/man-pages/man3/strcat.3.html) · [`snprintf`](https://man7.org/linux/man-pages/man3/printf.3.html) · [`strlcpy` 비교표](https://man7.org/linux/man-pages/man7/string_copying.7.html)

> [!WARNING] `strncpy` 는 "안전한 `strcpy`" 가 아니다
> - 원래 목적은 **고정 폭 필드 채우기** (예: 옛 디렉터리 항목)
> - 원본이 `n` 이상이면 **널 문자를 안 붙인다**
>
> ```diff
> - strncpy(a, src, sizeof(a));              /* src 가 16자 이상이면 널 없음 */
> + strncpy(a, src, sizeof(a) - 1);
> + a[sizeof(a) - 1] = '\0';                 /* 널 종료를 직접 */
> + /* 또는 */ snprintf(a, sizeof(a), "%s", src);
> ```
>
> → 연습: [P001 safe_copy](https://github.com/sweetpark/c-playgound/tree/main/drill/P001_safe_copy)

> [!TIP] `snprintf` 는 반환값으로 잘림을 판정한다
> ```c
> int n = snprintf(out, size, "%s/%s", dir, file);
> if (n < 0 || (size_t)n >= size) { /* 잘림 → 실패 처리 */ }
> ```
> - 무시하면 잘린 이름으로 파일을 만든다 → [P003 build_path](https://github.com/sweetpark/c-playgound/tree/main/drill/P003_build_path)
> - 이어 붙일 때는 반환값을 위치로 누적하지 말고 **매번 남은 크기**를 넘긴다 → [P037 join_strs](https://github.com/sweetpark/c-playgound/tree/main/drill/P037_join_strs)

---

## 4. 경계 계산 규칙

**① 크기 = 글자 수 + 1**
```diff
- if (len > size)      return -1;     /* 딱 맞는 길이에서 1바이트 넘침 */
+ if (len + 1 > size)  return -1;     /* 널 문자 자리까지 */
```

**② 쓰기 전에 검사한다**: 실패할 거라면 대상은 건드리지 않는다
```diff
- memset(dst, 0, dstsize);            /* 지운 뒤에 검사하면 실패해도 dst 가 망가짐 */
- if (dstsize < slen + 1) return -1;
+ if (dstsize < slen + 1) return -1;  /* 검사 먼저 */
+ memset(dst, 0, dstsize);
```

**③ `size_t` 끼리 빼지 않는다**
```diff
- memcpy(dst, src, size - 1);          /* size == 0 이면 size - 1 이 거대한 값 */
+ if (size == 0) return -1;            /* 먼저 0 을 거절 */
+ memcpy(dst, src, size - 1);
```

**④ 루프 조건에 변하는 값을 넣지 않는다**
```diff
- for (i = 0; i < strlen(src) + 1; i++) dst[i + strlen(dst)] = src[i];
+ size_t dlen = strlen(dst), slen = strlen(src);      /* 루프 전에 한 번 */
+ for (i = 0; i <= slen; i++) dst[dlen + i] = src[i];
```
- 첫 글자를 쓰는 순간 `strlen(dst)` 가 바뀌어 **한 칸씩 건너뛰며** 써진다 (O(n²) 는 덤)
- → 연습: [P004 str_append](https://github.com/sweetpark/c-playgound/tree/main/drill/P004_str_append)

**⑤ 널 문자까지 복사한다**: `i <= len` 또는 `memcpy(dst, src, len + 1)`

**⑥ `dst` 가 널로 끝난다고 믿지 않는다**
- 이미 쌓인 버퍼에 이어 붙일 때
- [`strnlen(dst, size)`](https://man7.org/linux/man-pages/man3/strnlen.3.html) 로 범위 안에 `'\0'` 이 있는지 먼저 확인

---

## 5. NULL과 빈 문자열

| 값 | 의미 | 보통의 처리 |
|---|---|---|
| `NULL` | 값 없음 | 함수 진입부에서 거절 (인자 오류) |
| `""` | 길이 0 인 **유효한** 문자열 | 정상 입력으로 처리·시험 |

```diff
- char last = s[strlen(s) - 1];          /* "" 이면 s[-1] 을 읽는다 */
+ size_t n = strlen(s);
+ char last = (n > 0) ? s[n - 1] : '\0';
```

→ 연습: [P003 build_path](https://github.com/sweetpark/c-playgound/tree/main/drill/P003_build_path)

---

## 6. 입력 읽기와 외부 값

| 상황 | ❌ 하면 | ✅ 처방 | 연습 |
|---|---|---|---|
| 한 줄 읽기 루프 | 상한 없이 `*p++ = ch`, 마지막 `*p++ = 0` 도 범위 초과 | **길이 상한 + EOF** 를 둘 다, 넘친 줄은 읽어서 버림 | [P006](https://github.com/sweetpark/c-playgound/tree/main/drill/P006_read_line) |
| [`fgetc`](https://man7.org/linux/man-pages/man3/getc.3.html) 반환값 | `char` 에 담으면 `0xFF` 가 `EOF(-1)` 와 같아져 줄이 끊김 | **`int`** 로 받는다 | [P006](https://github.com/sweetpark/c-playgound/tree/main/drill/P006_read_line) |
| 개행 제거 | `buf[strlen(buf)-1] = 0` → 긴 줄은 멀쩡한 글자 삭제, 빈 줄은 `buf[-1]` | 개행이 **있는지 먼저** 확인 | [P017](https://github.com/sweetpark/c-playgound/tree/main/drill/P017_chomp) |
| 환경변수 · 인자 · 설정 · 네트워크 | 고정 버퍼에 `strcpy` (길이는 외부가 정함) | 길이 확인 후 복사, 안 들어가면 오류 | [P020](https://github.com/sweetpark/c-playgound/tree/main/drill/P020_env_copy) |
| [`getenv`](https://man7.org/linux/man-pages/man3/getenv.3.html) 결과 | 직접 수정 | 읽기 전용, 필요하면 복사 | [P020](https://github.com/sweetpark/c-playgound/tree/main/drill/P020_env_copy) |
| `key = value` 한 줄 | 원본에 널을 써서 자름 | 위치(포인터 범위)로 보고 복사 | [P021](https://github.com/sweetpark/c-playgound/tree/main/drill/P021_parse_kv) |
| 쪼개기 [`strtok`](https://man7.org/linux/man-pages/man3/strtok.3.html) | 원본을 바꾸고 내부 정적 상태를 공유 | 사본 + `strtok_r` | [P028](https://github.com/sweetpark/c-playgound/tree/main/drill/P028_split_words) |

---

## 7. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P001` 처럼 번호만으로 채점
	- 풀고 난 뒤의 해설은 각 폴더의 `NOTE.md`

| 문제                   | 다루는 이론                               | 링크                                                                                |
| -------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| P001 `safe_copy`     | [§3](#3-복사연결-함수가-실제로-보장하는-것) `strncpy` 널 종료, [§4](#4-경계-계산-규칙) | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P001_safe_copy)     |
| P002 `sizeof_macros` | [§2-4](#2-4-배열과-포인터-sizeof) 배열과 포인터의 `sizeof` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P002_sizeof_macros) |
| P003 `build_path`    | [§3](#3-복사연결-함수가-실제로-보장하는-것) `snprintf` 반환값, [§5](#5-null과-빈-문자열) NULL vs 빈 문자열 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P003_build_path)    |
| P004 `str_append`    | [§4](#4-경계-계산-규칙) 루프 안 `strlen`, 널 종료 누락 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P004_str_append)    |
| P005 `get_dirname`   | [§2-2](#2-2-리터럴은-읽기-전용이다) 리터럴·`const` 입력 불변 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P005_get_dirname)   |
| P006 `read_line`     | [§6](#6-입력-읽기와-외부-값) 길이 상한·EOF·`int` 반환값 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P006_read_line)     |
| P017 `chomp`         | [§6](#6-입력-읽기와-외부-값) 개행 제거 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P017_chomp)         |
| P020 `env_copy`      | [§6](#6-입력-읽기와-외부-값) 외부 값 복사 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P020_env_copy)      |
| P021 `parse_kv`      | [§2-2](#2-2-리터럴은-읽기-전용이다) · [§6](#6-입력-읽기와-외부-값) 위치 기반 파싱, 경계 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P021_parse_kv)      |
| P028 `split_words`   | [§6](#6-입력-읽기와-외부-값) `strtok_r` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P028_split_words)   |
| P037 `join_strs`     | [§3](#3-복사연결-함수가-실제로-보장하는-것) `snprintf` 반환값 누적 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P037_join_strs)     |

- 원본 강의 코드
	- [`c_basic/lecture/str/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/str) (8-01 ~ 8-05)
	- [`c_basic/str/str_ex.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/str/str_ex.c)

---

## 9. 원본 강의 실습 대응표

| 실습 | 문제 | 이 글의 절 |
|---|---|---|
| 8-01 | `strncpy` 후 널 문자 없음 | [§3](#3-복사연결-함수가-실제로-보장하는-것), [§4](#4-경계-계산-규칙) |
| 8-02 | `strlen` 에 `signed char*` 전달 | [§2-3](#2-3-char--signed-char--unsigned-char-는-서로-다른-세-타입) |
| 8-03 | 문자열 리터럴 수정 | [§2-2](#2-2-리터럴은-읽기-전용이다) |
| 8-04 | `get_dirname` 이 원본을 그대로 반환 | [§2-2](#2-2-리터럴은-읽기-전용이다) · [P005](https://github.com/sweetpark/c-playgound/tree/main/drill/P005_get_dirname) |
| 8-05-a | 복사 루프 종료 시 1바이트 초과 (off-by-one) | [§4](#4-경계-계산-규칙) |
| 8-05-b | `getchar` 루프에 경계 검사 없음 | [§6](#6-입력-읽기와-외부-값) |

---

## 10. 직접 구현해 본 것 (`my_strncpy` · `my_strncat` · `make_filename`)

- **`my_strncat` 의 첫 구현이 `"dsts"` 로 끝난 이유**
	- `dst[i + strlen(dst)]` : 첫 글자를 쓰는 순간 `strlen(dst)` 가 3 → 4 로 변해 한 칸씩 건너뛰며 써진다
	- 길이는 루프 전에 한 번 → [§4](#4-경계-계산-규칙) · [P004](https://github.com/sweetpark/c-playgound/tree/main/drill/P004_str_append)
- **고친 점 5가지**
	- 크기 검사에 `+ 1` (널 문자 자리)
	- `i <= slen` 으로 널 문자까지 복사
	- `strlen` 을 루프 조건에 쓰지 않기
	- 검사 **후에** `memset` (실패할 거라면 `dst` 불변)
	- 읽기만 하는 인자는 `const char *`
- **`make_filename` : `base_YYYYMMDDhhmm[index]` 를 중복 없이 만들기**
	- `fprintf` → **`snprintf`** (문자열 버퍼에 쓰는 함수)
	- 크기 검사는 쓰기 **전**, `snprintf` 반환값으로 (`n < 0` 또는 `n >= size`)
	- `"rw"` 는 유효한 모드가 아니다 (`r w a r+ w+ a+` + `b`, `x`)
	- 존재 확인 후 열기(`access` → `fopen`)는 TOCTOU → **`"wx"`** 로 원자적 생성
	- `errno != EEXIST` 이면 즉시 종료 (권한 없음 같은 오류를 무한 재시도하지 않기)
	- `fp` 는 `do` 블록 **밖**에서 선언해야 `while (fp == NULL)` 에서 보인다
	- 파일명의 `[` `]` 는 쉘 글로빙 문자 → 실무에서는 `_%d` 가 다루기 편하다
	- → [P016 create_new](https://github.com/sweetpark/c-playgound/tree/main/drill/P016_create_new) · [P003 build_path](https://github.com/sweetpark/c-playgound/tree/main/drill/P003_build_path)

---

## 11. 보너스 — 디버깅과 man 페이지

- **gdb 를 쓰려면 `-g` 가 필요하다**
	- `gcc -g -O0 -Wall -Wextra -o test test.c` → `gdb ./test`
	- `-g` : 디버그 심볼(소스 줄 번호·변수 이름) 포함 (gdb 필수)
	- `-O0` : 최적화 끔 (변수가 사라지거나 줄 순서가 바뀌는 것 방지)
- **자주 쓰는 gdb 명령**

| 명령 | 뜻 |
|---|---|
| `break main` | 중단점 (`break 파일:줄번호` 도 가능) |
| `run` | 실행 (인자: `run arg1 arg2`) |
| `next` / `step` | 한 줄 실행 / 함수 안으로 진입 |
| `print dst` · `display dst` | 변수 출력 / 스텝마다 자동 출력 |
| `x/16xb dst` | 메모리를 바이트 단위 16진수로 보기 |
| `bt` | 호출 스택 |

- **`strlen(dst)` 가 변하는 순간 잡기** : `break my_strncat` → `display dst` → `display strlen(dst)` → `next` 반복
- **vim 에서 man 페이지 보기**
	- 단어 위에서 `Shift+K` = `man <단어>` (섹션 1: 쉘 명령어가 먼저 나온다)
	- 숫자를 앞에 붙이면 그 섹션: **`2K`** (시스템 콜) · **`3K`** (C 라이브러리 함수)
	- 예: `man 2 stat`, `man 3 fopen`

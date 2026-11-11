---
title: "(C) 에러 처리·API 설계 실습 — strtol my_atoi·snprintf_m·sum_file·conformant 배열"
description: "C 에러 처리(errno 한계, atoi 대신 strtol)와 API 설계 실습에서 만난 오류를 정리하고 my_atoi, snprintf_m, sum_file을 구현했습니다."
tags: 
created: 2026-10-14
modified: 2026-11-11
---

# 에러 처리·API 설계 — 반환값 규약, strtol, 가변 인자, 배열 인자

> [!TIP]
> - errno 규칙은 별도 글: [errno 사용 규칙](개발%20%28CS%29/언어/C언어/실습/[C]%20errno%20사용%20규칙%20—%20초기화·저장·검사·설정%20패턴.md)
> - 종합 표·체크리스트: [종합본](개발%20%28CS%29/언어/C언어/실습/[C]%20종합본%20—%20안전한%20C%20코딩%20체크리스트와%20방어%20매크로.md)
> - 원본 소스: [`err/my_atoi.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/err/my_atoi.c) · [`err/snprintf.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/err/snprintf.c) · [`err/sum.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/err/sum.c) · [`api/conformant.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/api/conformant.c) · [`lecture/err/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/err) · [`lecture/api/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/api)

---

## 📌 한눈에 보기 — 주의해야 할 점

| # | 주의 | 왜 | 처방 | 상세 |
|---|---|---|---|---|
| 1 | **에러는 반환값, 값은 인자** | `sprintf` 가 쓴 길이와 에러(-1)를 한 값에 담음 (in-band) | `snprintf_m(buf, len, &count, ...)` 형태 | [§1](#1-에러-처리-기본) |
| 2 | `atoi` 금지 | `abc` 도 범위 초과도 모른다 | `strtol` + `endptr` + `errno` | [§1](#1-에러-처리-기본), [§2](#2-my_atoi) |
| 3 | `strtol` 결과를 `int` 로 줄이기 전에 범위 검사 | 캐스팅이 값을 잘라 범위 초과를 놓침 | `INT_MAX` / `INT_MIN` 비교 후 캐스팅 | [§2](#2-my_atoi) |
| 4 | 합산은 **더하기 전에** 한계 검사 | signed 오버플로는 이미 UB | `total > LONG_MAX - num` | [§4](#4-sum_file) |
| 5 | 실패하면 출력 인자 **불변** | 쓰레기 값이 호출자에게 흘러감 | 로컬에 모았다 성공 때만 대입 | [§4](#4-sum_file) |
| 6 | 읽기 루프 종료 이유 구분 | EOF 인지 오류인지 모름 | `ferror` / `feof` | [§4](#4-sum_file), [§5](#5-api-설계) |
| 7 | 받는 쪽 버퍼는 **크기를 인자로** | 크기를 모르면 검사 불가 | `dst_size`, 널 문자 1바이트 포함 | [§5](#5-api-설계) |
| 8 | 배열 인자는 크기를 **앞에** 선언 | 배열 매개변수는 사실 포인터 | `void f(size_t n, char p[n])` | [§5](#5-api-설계), [§6](#6-conformant-배열-함수) |
| 9 | `EAGAIN` 은 **대기 후** 재시도 | 바로 재시도하면 횟수만 소진 | `poll` / `select`, partial write 누적 | [§5](#5-api-설계) |

---

## 1. 에러 처리 기본

### 13-01 · errno 는 믿을 수 없는 지점이 있다

- `printf` 여러 번 뒤 `errno != 0` 으로 출력 오류를 판단하면 안 된다
	- 성공한 호출도 `errno` 를 바꾼다
	- 어느 호출의 값인지 알 수 없다
- 스트림 오류는 **`ferror(stdout)`**
	- 에러 표시자는 한 번 설정되면 `clearerr()` 전까지 남는다 (`errno` 는 덮어써지지만 표시자는 안 덮어써진다)
	- 다시 쓰려면 `clearerr()`
- 자세한 규칙 → [errno 사용 규칙](개발%20%28CS%29/언어/C언어/실습/[C]%20errno%20사용%20규칙%20—%20초기화·저장·검사·설정%20패턴.md)

### 13-02 · in-band 에러 지시자를 피한다

```diff
- count += sprintf(buf + count, "%02x ", hex_num[i]);    /* 반환값 = 쓴 길이 + 에러(-1) */
+ errno_t e = snprintf_m(buf + count, len - count, &n, "%02x ", hex_num[i]);   /* 에러는 반환값, 길이는 인자 */
```

- `sprintf` 는 한 값으로 **쓴 길이와 에러를 같이** 알린다
	- 오류(-1)를 `count` 에 더하면 다음 위치가 `buf - 1` → 앞쪽 메모리를 덮는다
- `sprintf` 는 크기를 모른다 → `buf`(128바이트)를 넘겨도 못 막는다
- 처방: **에러는 반환값, 쓴 길이는 인자** → [§3](#3-snprintf_m)

### 13-03 · 종료 방법

| 방법 | 자원 정리 | `atexit` | stdio 버퍼 |
|---|---|---|---|
| `return`(main) / `exit()` | O | 실행 | 비움 |
| `_Exit()` | X (열린 파일은 OS가 닫음) | 실행 안 함 | 구현 의존 (glibc 2.17 에서 **비우지 않음**) |
| `abort()` | X | 실행 안 함 | 구현 의존 (glibc 2.17 **비움**, 2.27 이후는 비우지 않는 것으로 알려짐) |

- `fprintf` 뒤 `abort()` 로 끝내는 코드는 버퍼가 파일에 써지는지가 구현에 달려 있다 → **결과에 기대면 안 된다**
	- 측정 (glibc 2.17): `abort()` **13바이트**, `_Exit()` **0바이트** → 구현마다 다르다
- `abort()` 는 `SIGABRT` 로 죽으므로 `atexit` 가 안 돌고 코어 덤프로 기록된다
	- 치명적 오류가 아니라면 `exit(EXIT_FAILURE)`
- 코드의 `close(f)` 는 `FILE *` 에 `close` 를 쓴 오류 → `fclose`

### 13-05 · 13-06 · atoi 대신 strtol

- `atoi` 는 `abc` 도 범위 초과도 에러로 알리지 않는다
- `strtol` / `strtoul` 은 `endptr` (변환이 끝난 위치) 와 `errno` (`ERANGE`) 로 구분한다
- 확인할 것
	- `endptr == str` → 숫자 없음
	- `*endptr != '\0'` → `12abc` 같은 뒤쪽 쓰레기
	- 호출 **전에** `errno = 0` (이전 `ERANGE` 가 남아 오판)

→ 연습: [P013 my_atoi](https://github.com/sweetpark/c-playgound/tree/main/drill/P013_my_atoi), [P015 parse_port](https://github.com/sweetpark/c-playgound/tree/main/drill/P015_parse_port)

---

## 2. my_atoi

### 처음 코드의 문제

| 처음 코드 | 문제 | 고친 코드 |
|---|---|---|
| `} ret_t` | 세미콜론 누락 | `} ret_t;` |
| `strtol(str, end, 10)` | 끝 위치를 받으려면 `end` 의 **주소** | `&end` |
| NULL 검사가 `*out = ...` 뒤 | NULL 이면 검사 전에 크래시 | 맨 앞으로 이동 |
| `errno = ERANGE` | 대입이라 항상 참, `errno` 덮어씀 | `errno == ERANGE` |
| `*out > LONG_MAX` | `int` 를 `long` 한계와 비교 → 항상 거짓 | `long val` 로 받아 `INT_MAX` / `INT_MIN` |
| `(int)strtol(...)` | 캐스팅이 값을 잘라 범위 초과를 놓침 | 검사 후 마지막에 캐스팅 |
| `end == str` 만 검사 | `12ab` 가 성공 처리됨 | `*end != '\0'` 이면 `INVALID_CHAR` |
| `char *str` | 읽기만 하는 인자 | `const char *str` |

```c
int my_atoi(const char *str, int *out){
    char *end = NULL;
    long val = 0;

    if(str == NULL || out == NULL){ return INVALID_PARAM; }

    errno = 0;
    val = strtol(str, &end, 10);

    if(end == str || *end != '\0'){ return INVALID_CHAR; }
    if(errno == ERANGE){ return (val == LONG_MAX) ? OVERFLOW : UNDERFLOW; }
    if(val > INT_MAX){ return OVERFLOW; }
    if(val < INT_MIN){ return UNDERFLOW; }

    *out = (int)val;            /* 성공했을 때만 out 을 갱신 */
    return OK;
}
```

| 입력 | 반환 |
|---|---|
| `123`, `-45`, `  7`, `0`, `2147483647`, `-2147483648` | OK |
| `2147483648`, 매우 큰 수 | OVERFLOW |
| `-2147483649`, 매우 작은 수 | UNDERFLOW |
| `abc`, 빈 문자열, `12ab`, `12 ` | INVALID_CHAR |
| `str` / `out` 이 NULL | INVALID_PARAM |

> [!NOTE] enum 의 `typedef` 는 필수가 아니다
> - 상수만 필요하면 `enum { OK = 1, ... };` 로 충분
> - 반환 타입으로 쓰려면 `typedef enum {...} ret_t;`
> - 변수 타입이 enum 일 때만 `switch` 에서 상수 누락 경고(`-Wswitch`)를 받는다

---

## 3. snprintf_m

- 요구사항: `errno_t snprintf_m(char *buf, size_t buf_len, size_t *count, const char *fmt, ...)`
	- **반환값 = 에러 값**, 쓴 글자 수는 `count` 로

### 처음 코드의 문제

| 처음 코드 | 문제 | 처방 |
|---|---|---|
| `count` 를 "가변 인자 개수" 로 사용 | 주석의 `count` 는 **버퍼에 쓴 글자 수** | `size_t *count` |
| `va_start(param, count)` | 마지막 **고정** 인자는 `fmt` | `va_start(param, fmt)` |
| `char **temp = NULL; temp[i] = ...` | NULL 역참조 | 아예 모을 필요 없음 |
| `snprintf(buf, buf_len, fmt, fmt_param)` | `va_list` 는 **`vsnprintf`** | `vsnprintf(buf, buf_len, fmt, param)` |
| 자체 `enum errno_t` (`OK=1`) | `errno_t` 는 성공 0 / errno 값이라는 규약 | `typedef int errno_t;` |
| 인자 검증·잘림 처리 없음 | 잘림을 모름 | `EINVAL`, `ERANGE`, `EIO` |

```c
errno_t snprintf_m(char *buf, size_t buf_len, size_t *count, const char *fmt, ...)
    __attribute__((format(printf, 4, 5)));      /* 호출 쪽 포맷/인자 불일치를 컴파일러가 검사 */

    va_start(param, fmt);                       /* 마지막 고정 매개변수는 fmt */
    ret_val = vsnprintf(buf, buf_len, fmt, param);
    va_end(param);

    if(ret_val < 0){ buf[0] = '\0'; return EIO; }
    if((size_t)ret_val >= buf_len){ *count = buf_len - 1; return ERANGE; }   /* 잘림 */
    *count = (size_t)ret_val;
    return 0;
```

- 시작할 때 `buf[0] = '\0'`, `*count = 0` → 실패해도 항상 유효한 빈 문자열
- `vsnprintf` 는 버퍼가 모자라도 **"쓰려던 길이"** 를 돌려준다 → `ret >= buf_len` 이 잘림 신호

| 입력 | 반환 | `buf` / `count` |
|---|---|---|
| `"%s-%d"`, `"ab"`, 42 | 0 | `ab-42` / 5 |
| 15글자, 버퍼 16 | 0 | 15글자 / 15 |
| 16글자, 버퍼 16 | `ERANGE` | 앞 15글자 / 15 |
| `buf_len` 이 1 | `ERANGE` | `""` / 0 |
| `buf` / `count` / `fmt` 가 NULL, `buf_len` 0 | `EINVAL` | - |

→ 연습: [P037 join_strs](https://github.com/sweetpark/c-playgound/tree/main/drill/P037_join_strs)

---

## 4. sum_file

- 요구사항
	- 파일의 각 줄에 10진수 정수 하나
	- 반환값은 **에러 코드로만**, 합계는 `sum` 인자, 에러가 난 줄은 `err_line` 인자
	- 합계가 `long` 범위를 넘으면 `SUM_ERANGE`
	- 에러 시 `sum` 불변, **어떤 경우에도 파일을 닫고** 반환, 함수 안에서 `printf`·`exit`·`abort` 금지

### 처음 구현의 실제 동작

| 입력 | 기대 | 실제 |
|---|---|---|
| `10, abc, 30` | `SUM_EINVAL`, 2번째 줄 | **40** (abc 를 0 으로 무시) |
| `10, 12abc, 30` | `SUM_EINVAL` | **52** |
| `4000000000, 1` | 4000000001 | **-294967295** (`int` 로 잘림) |
| `LONG_MAX, 1` | `SUM_ERANGE` | 0 (오버플로, 에러 없음) |
| 에러 줄번호 | 파일의 줄 | `__LINE__` (소스코드 줄) |
| `sum` 이 NULL | `SUM_EPARAM` | 크래시 |

### 고친 구조

```c
while(fgets(buf, sizeof(buf), fp) != NULL){
    line_no++;
    len = strlen(buf);
    if (len > 0 && buf[len - 1] != '\n' && !feof(fp)){ ret = SUM_EINVAL; goto CLEANUP; }  /* 줄이 버퍼보다 김 */

    errno = 0;
    num = strtol(buf, &end, 10);
    if (end == buf){ ret = SUM_EINVAL; goto CLEANUP; }                        /* 숫자 없음, 빈 줄 */
    if (*end == '\r'){ end++; }                                              /* CRLF */
    if (*end != '\n' && *end != '\0'){ ret = SUM_EINVAL; goto CLEANUP; }     /* 뒤에 문자 */
    if (errno == ERANGE){ ret = SUM_ERANGE; goto CLEANUP; }                  /* 한 줄이 long 범위 밖 */

    if ((num > 0 && total > LONG_MAX - num) || (num < 0 && total < LONG_MIN - num)){
        ret = SUM_ERANGE; goto CLEANUP;                                      /* 더하기 전에 검사 */
    }
    total += num;
}
if (ferror(fp)){ line_no++; ret = SUM_EREAD; goto CLEANUP; }                /* EOF 가 아닌 읽기 오류 */

*_sum = total;                  /* 성공했을 때만 sum 갱신 */
CLEANUP:
    fclose(fp);
    if (ret != SUM_OK){ *_err_line = line_no; }
    return ret;
```

- 더한 뒤에 검사하면 이미 UB → 더하기 **전에** 한계로 검사
- 합계는 로컬 `total` 에 모으고 성공했을 때만 `*_sum` 에 대입 → 에러 경로에서 `sum` 불변
- 디렉토리를 열면 `fopen` 은 성공하지만 `fgets` 가 실패 → `ferror` 로 `SUM_EREAD`
- `sum_strerror` 의 `switch` 는 숫자가 아니라 `case SUM_OK:` 처럼 enum 상수
- 테스트 결과
	- CRLF, 음수, 끝에 개행 없는 줄, 빈 파일, 1100자 줄, 디렉토리 모두 기대대로
	- 성공·실패 경로를 섞어 1600번 호출한 뒤에도 열린 fd 수 그대로

→ 연습: [P034 sum_file](https://github.com/sweetpark/c-playgound/tree/main/drill/P034_sum_file)

---

## 5. API 설계

### 14-01 · 인자 검사와 읽기 종료

- 함수는 진입부에서 인자를 **선제적으로** 검사
	- `setfile` 에 NULL 이 와도, `usefile` 을 `setfile` 전에 불러도
- `fgets` 가 `NULL` 을 돌려주는 이유 = EOF **또는** 읽기 오류
	- 루프 뒤에 `ferror(fp)` / `feof(fp)` 로 구분

### 14-02 · 크기 없는 복사 함수

```diff
- int copy(char *dst, const char *src){ ... *dst = '\0'; }          /* 크기를 모르고, return 도 없다 (UB) */
- dstend = dst + dst_size;  ... *dst = '\0';                         /* dst[dst_size] 에 씀: 1바이트 넘침 */
+ dstend = dst + dst_size - 1;                                      /* 널 문자 자리를 남긴다 */
```

- 받는 쪽 버퍼는 크기를 같이 받아야 오버플로를 검사할 수 있다
- 교육자료의 "수정안" 도 같은 결함 → 16칸 배열에 `dst_size = 10` 으로 복사하니 `big[10]` 이 `0`
	- **자료의 코드도 경계값(꽉 찬 입력)으로 직접 확인**한다
- 크기는 **바이트가 아니라 원소 개수** (`char` 는 같지만 `int` 배열에서 차이)
- `strncpy` / `strncat` 의 `n` 은 복사할 최대 길이이지 버퍼 크기가 아니다
	- → 크기를 따로 받는 `improved_strncpy(dest, destcount, src, srccount, n)` 형태

### 14-03 · conformant 배열 파라미터

```c
void my_memset(size_t n, char p[n], char v);   /* 크기를 배열보다 먼저 선언 */
```

- 크기를 **표현식으로 선언**하는 C99 문법
	- 크기 매개변수가 배열 매개변수보다 **앞에**
	- 뒤에 두려면 `void f(size_t n; char p[n], size_t n)` (forward declaration) → **GNU 확장**
- 컴파일러가 크기를 강제하지는 않는다
	- 배열 매개변수는 포인터 → `sizeof(p)` 는 **포인터 크기**(8)
	- 그래서 `NULL` 검사와 크기 비교는 여전히 필요

→ 연습: [P033 array_params](https://github.com/sweetpark/c-playgound/tree/main/drill/P033_array_params)

### 14-04 · non-blocking 재시도

```diff
  rc = write(fd, pbuf + write_len, len - write_len);
  if (rc < 0) {
-     if (errno == EWOULDBLOCK || errno == EAGAIN || errno == EINTR) { retry_cnt++; continue; }  /* 바로 재시도 */
+     if (errno == EINTR) continue;
+     if (errno == EAGAIN || errno == EWOULDBLOCK) { poll(&pfd, 1, timeout); continue; }          /* 쓸 수 있을 때까지 대기 */
  }
  write_len += rc;      /* 일부만 써질 수 있다 (partial write) */
```

- 대기 없이 곧바로 재시도하면 **재시도 횟수만 소진**되고 실패한다
- 네트워크 지연으로 정상 전송 중인데 못 받은 것처럼 보일 수 있다
- `write_len` 을 누적해 `len` 이 될 때까지 반복

→ 연습: [P035 write_all](https://github.com/sweetpark/c-playgound/tree/main/drill/P035_write_all)

---

## 6. conformant 배열 함수

```c
char* improved_strncpy(size_t destcount, char dest[destcount], size_t srccount, const char src[srccount], size_t n);
char* improved_strncat(size_t destcount, char dest[destcount], size_t srccount, const char src[srccount], size_t n);
```

### 규약

- `n` : `src` 에서 복사(추가)할 **최대 글자 수** (널 문자 제외), `srccount` 를 넘어 읽지 않는다
- 항상 널 종료. `dest` 에 `복사 길이 + 널 문자` 가 안 들어가면 실패
- 실패하면 `NULL` + `errno`
	- `EINVAL`: NULL 인자, 크기 0, 영역 겹침, `strncat` 의 `dest` 비널종료
	- `ERANGE`: 공간 부족
	- **`dest` 는 변경하지 않는다**, 함수 안에서 메시지 출력 금지

### 처음 코드의 문제

| 처음 코드 | 문제 | 고친 코드 |
|---|---|---|
| `n` 을 쓰지 않음 | `-Wunused-parameter`, 복사 개수가 `n` 이 아님 | `n` 과 `srccount` 중 작은 값, 널 앞까지 (`strnlen`) |
| `strncpy` 사용 | 원본이 `n` 이상이면 널 종료 안 됨 | `memcpy` 후 `dest[len] = '\0'` |
| `destcount < srccount` | 널 문자 자리와 `n` 을 고려하지 않음 | `len >= destcount` 이면 `ERANGE` |
| `destcount - strlen(dest) < srccount` | `strncat` 이 붙이는 **널 문자 1바이트** 누락 | `len >= destcount - dlen` |
| `strlen(dest)` | `dest` 가 널 종료가 아니면 범위 밖을 읽음 | `memchr(dest, '\0', destcount)` 로 먼저 확인 |
| `destcount - strlen(dest)` | `size_t` 뺄셈 언더플로 | `memchr` 통과 후라 `dlen < destcount` 보장 |
| `printf` 로 에러 메시지 | 라이브러리 함수는 출력하지 않는다 | `NULL` + `errno` |
| `dest` / `src` 겹침 검사 없음 | `memcpy` 는 겹치면 UB | 겹치면 `EINVAL` |

```c
static size_t copy_len(size_t srccount, const char src[srccount], size_t n){
    size_t limit = (n < srccount) ? n : srccount;
    return strnlen(src, limit);                  /* 널 문자를 만나면 거기서 멈춤 */
}
```

| 호출 | 결과 |
|---|---|
| 8칸에 `1234567` 복사 | 성공 (널 문자 포함 딱 맞음) |
| 8칸에 `12345678` 복사 | `NULL`, `ERANGE`, `dest` 불변 |
| `n=3` 으로 `hello world` | `hel` |
| 널 문자 없는 `src` (`srccount=3`) | `abc` 에서 멈춤 |
| `foo`(8칸)에 `1234` 추가 / `12345` 추가 | `foo1234` (딱 맞음) / `NULL`, `ERANGE` |
| 널 종료 없는 `dest` 에 추가 | `NULL`, `EINVAL` |

- 경계 밖 쓰기는 버퍼 뒤에 감시용 바이트(canary)를 두고 변하지 않는지로 확인

→ 연습: [P004 str_append](https://github.com/sweetpark/c-playgound/tree/main/drill/P004_str_append)

---

## 📝 미구현 과제 — TBCD 변환 API (교육자료 14-6)

- IMSI · MSISDN 번호를 저장하는 **TBCD(Telephony BCD)** 와 숫자 문자열 서로 변환
- 1바이트에 숫자 2개: **앞 자리가 하위 4비트, 뒷 자리가 상위 4비트**, 홀수 자리면 마지막 상위 4비트를 `0xF`
	- 예: `"12345"` → `0x21 0x43 0xF5`

```c
int digits_to_tbcd(size_t tbcd_size, unsigned char tbcd[tbcd_size], size_t *tbcd_len, const char *digits);
int tbcd_to_digits(size_t str_size, char str[str_size], size_t tbcd_len, const unsigned char tbcd[tbcd_len]);
/* 성공 0, 실패는 원인별로 구분되는 음수 */
```

| 요구 | 확인할 점 |
|---|---|
| conformant 배열, 크기는 **원소 개수** | 크기 인자를 배열보다 앞에 |
| 인자 검증은 callee 안에서 전부 | NULL, 크기 0, 빈 문자열, 숫자가 아닌 문자 |
| 안 들어가면 **잘라 쓰지 말고 에러** | `tbcd_to_digits` 는 널 문자까지 (자릿수 + 1) |
| TBCD 데이터 검증 | `0xA`~`0xE` 에러, `0xF` 는 **마지막 바이트의 상위 4비트에서만** |
| 에러 시 출력·`tbcd_len` 불변 | 검증을 모두 끝낸 **뒤에** 쓴다 (검증 → 쓰기 순서) |
| 짝수·홀수 자릿수 **왕복 변환** 시험 | 에러마다 다른 음수 |

---

## 7. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P013` 처럼 번호만으로 채점
	- 풀고 난 뒤의 해설은 각 폴더의 `NOTE.md`

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P013 `my_atoi` | [§2](#2-my_atoi) `strtol`, `errno = 0`, 범위 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P013_my_atoi) |
| P015 `parse_port` | [§1](#1-에러-처리-기본) `strtoul` 의 음수 래핑 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P015_parse_port) |
| P033 `array_params` | [§5](#5-api-설계) conformant 배열 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P033_array_params) |
| P034 `sum_file` | [§4](#4-sum_file) 종료 이유, 오버플로, 출력 불변 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P034_sum_file) |
| P035 `write_all` | [§5](#5-api-설계) 14-04 `EAGAIN` · partial write | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P035_write_all) |
| P037 `join_strs` | [§3](#3-snprintf_m) `snprintf` 반환값 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P037_join_strs) |

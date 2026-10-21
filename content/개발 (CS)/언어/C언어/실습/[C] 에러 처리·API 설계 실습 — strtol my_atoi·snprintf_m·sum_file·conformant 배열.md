---
title: "(C) 에러 처리·API 설계 실습 — strtol my_atoi·snprintf_m·sum_file·conformant 배열"
description: "C 에러 처리(errno 한계, atoi 대신 strtol)와 API 설계 실습에서 만난 오류를 정리하고 my_atoi, snprintf_m, sum_file을 구현했습니다."
tags: 
created: 2026-10-14
modified: 2026-10-15
---

# 에러 처리·API 설계 실습 — strtol my_atoi·snprintf_m·sum_file·conformant 배열

> [!NOTE]
> C 기초 강의의 에러 처리(13-01 ~ 13-06)와 API 설계(14-01 ~ 14-04) 실습에서 만난 오류 패턴을 정리하고, **`my_atoi`**, **`snprintf_m`**, **`sum_file`**, **conformant 배열 파라미터를 쓰는 `improved_strncpy/strncat`**을 직접 구현하며 겪은 버그를 기록한다.
>
> 환경은 Docker Desktop의 Linux 컨테이너(`c_app_part1`), `gcc -Wall -Wextra`.

> [!IMPORTANT]
> 코드는 컨테이너에서 컴파일·실행해 확인했고, 설명은 AI(Claude)와 함께 코드 리뷰하며 정리했다.

> [!TIP]
> **📂 원본 소스 (GitHub)**
> - `strtol` 기반 atoi: [`err/my_atoi.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/err/my_atoi.c)
> - 가변 인자 `snprintf_m`: [`err/snprintf.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/err/snprintf.c)
> - 줄 단위 합계 `sum_file`: [`err/sum.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/err/sum.c)
> - conformant 배열 `improved_strncpy/strncat`: [`api/conformant.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/api/conformant.c)
> - 강의 코드 13-01 ~ 13-06: [`lecture/err/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/err), 14-01 ~ 14-04: [`lecture/api/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/api)
> - 빌드: `make -C c_basic` ([README](https://github.com/sweetpark/c-playgound/blob/main/c_basic/README.md)). `main`이 없는 파일은 `build/*.o`로 컴파일만 한다.

> [!TIP]
> **📂 환경**
> - 접속: `docker exec -it c_app_part1 /bin/bash`
> - 컨테이너의 gcc가 오래돼서(4.8) `-Wvla-parameter` 같은 최신 경고 옵션은 쓸 수 없다.
> - 이 노트의 규칙은 [종합본](개발%20%28CS%29/언어/C언어/실습/[C]%20종합본%20—%20안전한%20C%20코딩%20체크리스트와%20방어%20매크로.md)의 표와 체크리스트에도 반영돼 있다.

## 📌 한눈에 보기

| 실습 | 문제 | 처방 |
|---|---|---|
| 13-01 | `printf` 여러 번 뒤에 `errno`로 출력 오류 판단 | 성공한 호출도 `errno`를 바꿀 수 있다 → 스트림 오류는 `ferror(stdout)` |
| 13-02 | `sprintf` 반환값(쓴 길이)을 누적해 위치로 사용, 오류·오버플로 검사 없음 | **in-band 에러 지시자를 피한다** → 에러는 반환값, 값은 인자로. `snprintf` 사용 |
| 13-03 | `abort()`로 종료 → `atexit`·정리 미실행, 파일 버퍼가 써질지는 **구현에 따라 다름** | 종료는 `return`/`exit`, `fclose`는 `FILE *`에 |
| 13-05 | `atoi`는 에러를 알려주지 않음 | `strtol` + `endptr` + `errno` |
| 13-06 | `strtoul` 전에 `errno`를 0으로 안 만듦 | 호출 직전 `errno = 0`, 호출 직후 바로 검사 |
| 14-01 | 인자(`FILE *`) 검사 없음, 읽기 루프가 끝난 이유를 구분 안 함 | 진입부에서 NULL 검사, 끝난 뒤 `ferror` / `feof` 구분 |
| 14-02 | 복사 함수에 대상 크기가 없고 반환값도 없음 | `dst_size` 인자 + off-by-one 주의 |
| 14-03 | 배열 인자의 크기를 알려 줄 방법이 없음 | **conformant 배열 파라미터**(크기를 앞에 선언) |
| 14-04 | non-blocking `write`가 `EAGAIN`일 때 대기 없이 재시도 | 재시도 사이에 시간을 주거나 `select`/`poll`로 대기 |

---

## 1. 에러 처리 — 13-01 ~ 13-06

### errno는 믿을 수 없는 지점이 있다 (13-01)

> [!NOTE] 요약
> - **문제**: `printf` 여러 번 뒤 `errno != 0`으로 출력 오류를 판단 (13-01)
> - **원인**: 성공한 호출도 `errno`를 바꾸고, 어느 호출의 값인지 알 수 없음
> - **처방**: 스트림 오류는 `ferror(stdout)`, 쓰기 전 `errno = 0` + 호출 직후에만 읽기. 다시 쓰려면 `clearerr()`

> [!INFO]- 상세 보기
> ```c
> errno = 0;
> printf("This\n");  printf("is\n");  printf("a\n");  printf("test.\n");
> if (errno != 0) { ... }          // 어느 호출이 실패했는지, 정말 printf 때문인지 알 수 없다
> ```
>
> - `errno`는 **실패했을 때만 의미가 있고**, 성공한 라이브러리 호출도 값을 바꿀 수 있다. 호출 사이에 끼면 신뢰할 수 없다.
> - 표준 출력 스트림의 오류는 `ferror(stdout)`으로 한 번에 확인한다. 스트림의 **에러 표시자**는 한 번 설정되면 `clearerr()`를 부르기 전까지 남아 있어서, 중간 호출이 실패했어도 마지막에 한 번 검사하면 잡힌다.
>   (`errno`는 이후 호출이 덮어쓰지만 에러 표시자는 덮어써지지 않는다.) 같은 스트림을 다시 쓰려면 `clearerr()`로 초기화한다.
> - `errno`는 자동으로 0이 되지 않는다. 쓰기 전에 직접 `errno = 0`을 넣고, 호출 **직후**에만 읽는다.

### in-band 에러 지시자를 피한다 (13-02)

> [!NOTE] 요약
> - **문제**: `count += sprintf(...)`에서 오류 `-1`이 위치에 더해져 앞쪽 메모리를 덮음 (13-02)
> - **원인**: `sprintf`는 한 값으로 쓴 길이와 에러를 같이 알리고, 버퍼 크기를 모름
> - **처방**: 에러는 반환값, 쓴 길이는 인자로 돌려주는 함수 (§3 `snprintf_m`)

> [!INFO]- 상세 보기
> ```c
> count += sprintf(buf + count, "%02x ", hex_num[i]);   // 반환값이 "쓴 길이"이자 "에러(-1)"
> ```
>
> - `sprintf`는 한 값으로 **쓴 길이와 에러를 같이** 알린다(in-band). 오류(-1)를 `count`에 더하면 다음 위치가 `buf - 1`이 되어 앞쪽 메모리를 덮는다.
> - 또 `sprintf`는 크기를 모르므로 `buf`(128바이트)를 넘겨도 막을 수 없다.
> - 처방: 에러는 **반환값**으로, 쓴 길이는 **인자**로 돌려주는 함수를 만든다 → 아래 [실습 2의 `snprintf_m`](#3-실습-2--snprintf_m--in-band-에러-제거).

### 종료 방법 (13-03)

> [!NOTE] 요약
> - **문제**: `abort()`로 종료하면 정리가 안 되고 버퍼가 써질지가 구현에 달림 (13-03)
> - **원인**: `abort`/`_Exit`는 `atexit`를 건너뜀. `close(f)`는 `FILE *`에 쓴 오류
> - **처방**: 종료는 `return`/`exit`, `FILE *`에는 `fclose`

> [!INFO]- 상세 보기
> | 방법 | 자원 정리 | `atexit` | stdio 버퍼 |
> |---|---|---|---|
> | `return`(main) / `exit()` | O | 실행 | 비움 |
> | `_Exit()` | X (열린 파일은 OS가 닫음) | 실행 안 함 | 구현 의존 (glibc 2.17에서 **비우지 않음**) |
> | `abort()` | X (열린 파일은 OS가 닫음) | 실행 안 함 | 구현 의존 (glibc 2.17에서 **비움**, 2.27 이후는 비우지 않는 것으로 알려짐) |
>
> - 13-03은 `fprintf` 뒤에 `abort()`로 끝내는 코드다. 버퍼가 파일에 쓰이는지는 구현에 달려 있어서(glibc 2.17 실측: `abort()` 13바이트, `_Exit()` 0바이트) **어느 쪽이든 결과에 기대면 안 된다**. 측정 상세는 [환경변수·시그널 실습](개발%20%28CS%29/언어/C언어/실습/[C]%20환경변수·시그널%20실습%20—%20getenv%20복사·atexit와%20sigaction·pselect%20시그널%20카운터.md)의 atexit 항목.
> - `abort()`는 `SIGABRT`로 프로세스를 죽이므로 `atexit` 핸들러가 실행되지 않고 비정상 종료(코어 덤프)로 기록된다. 원인을 남기고 싶은 치명적 오류가 아니라면 `exit(EXIT_FAILURE)`로 끝낸다.
> - 코드 뒤쪽의 `close(f)`는 `FILE *`에 `close`를 쓴 오류다(`fclose`여야 한다).

### atoi 대신 strtol (13-05, 13-06)

> [!NOTE] 요약
> - **문제**: `atoi`가 `abc`·범위 초과를 알려 주지 않음 (13-05, 13-06)
> - **원인**: 에러 정보가 반환값에 없음
> - **처방**: `strtol`/`strtoul` + `endptr` + `errno == ERANGE`, 호출 직전 `errno = 0`

> [!INFO]- 상세 보기
> - `atoi`는 `abc`도, 범위 초과도 에러로 알려주지 않는다(0이나 정의되지 않은 값).
> - `strtol`/`strtoul`은 `endptr`(변환이 끝난 위치)와 `errno`(`ERANGE`)로 구분할 수 있다.
> - 13-06의 `strtoul(c_str, &endptr, 0)`은 `endptr == c_str`(숫자 없음)과 `ERANGE`를 확인한다. 다만 호출 **전에 `errno = 0`**을 넣어야 이전 실패가 남아서 오판하지 않는다. 또 `endptr`이 문자열 끝이 아니면(`12abc`) 그것도 오류다.

---

## 2. 실습 1 — `my_atoi` (예외를 반환하는 atoi)

### 처음 코드의 문제

> [!INFO]- 처음 코드의 문제와 고친 `my_atoi`
> ```c
> } ret_t                                 // ① 세미콜론 없음 → 컴파일 에러
> int my_atoi(char *str, int *out){
> 	char *end = NULL;
> 	errno = 0;
> 	*out = (int)strtol(str, end, 10);   // ② &end 가 아니라 end (NULL 에 쓰려 함), *out 먼저 쓰고
> 	if(str == NULL || out == NULL){...} // ③ NULL 검사가 사용 뒤에 있음
> 	else if(errno = ERANGE && *out > LONG_MAX) // ④ = (대입), ⑤ int 를 LONG_MAX 와 비교 → 항상 거짓
> ```
>
> | 처음 코드 | 문제 | 고친 코드 |
> |---|---|---|
> | `} ret_t` | 세미콜론 누락 | `} ret_t;` |
> | `strtol(str, end, 10)` | 끝 위치를 받으려면 `end`의 **주소** | `&end` |
> | NULL 검사가 `*out = ...` 뒤 | NULL이면 검사 전에 크래시 | 맨 앞으로 이동 |
> | `errno = ERANGE` | 대입이라 항상 참, `errno` 덮어씀 | `errno == ERANGE` |
> | `*out > LONG_MAX` | `int`를 `long` 한계와 비교 → 항상 거짓 | `long val`로 받아 `ERANGE`와 `INT_MAX`/`INT_MIN`으로 판단 |
> | `(int)strtol(...)` | 캐스팅이 값을 잘라 범위 초과를 놓침 | 검사 후 마지막에 캐스팅 |
> | `end == str`만 검사 | `12ab`가 성공 처리됨 | `*end != '\0'`이면 `INVALID_CHAR` |
> | `char *str` | 읽기만 하는 인자 | `const char *str` |
>
> ```c
> int my_atoi(const char *str, int *out){
> 	char *end = NULL;
> 	long val = 0;
>
> 	if(str == NULL || out == NULL){ return INVALID_PARAM; }
>
> 	errno = 0;
> 	val = strtol(str, &end, 10);
>
> 	if(end == str || *end != '\0'){ return INVALID_CHAR; }
> 	if(errno == ERANGE){ return (val == LONG_MAX) ? OVERFLOW : UNDERFLOW; }
> 	if(val > INT_MAX){ return OVERFLOW; }
> 	if(val < INT_MIN){ return UNDERFLOW; }
>
> 	*out = (int)val;            // 성공했을 때만 out 을 갱신
> 	return OK;
> }
> ```
>
> | 입력 | 반환 |
> |---|---|
> | `123`, `-45`, `  7`, `0`, `2147483647`, `-2147483648` | OK |
> | `2147483648`, 매우 큰 수 | OVERFLOW |
> | `-2147483649`, 매우 작은 수 | UNDERFLOW |
> | `abc`, 빈 문자열, `12ab`, `12 ` | INVALID_CHAR |
> | `str`/`out`이 NULL | INVALID_PARAM |
>
> > [!NOTE]
> > **enum의 `typedef`는 필수가 아니다.** 상수만 필요하면 `enum { OK = 1, ... };`로 충분하다. 반환 타입으로 쓰려면 `typedef enum {...} ret_t;`와 `ret_t my_atoi(...)`로 쓴다.
> >
> > C에서 enum은 정수 타입이라 `int`와 섞여 쓰이지만, 변수 타입이 enum일 때만 `switch`에서 상수 누락 경고(`-Wswitch`)를 받는다.

---

## 3. 실습 2 — `snprintf_m` (in-band 에러 제거)

> [!INFO]- 요구사항과 처음 코드의 문제
> 요구사항: `errno_t snprintf_m(char *buf, size_t buf_len, size_t *count, const char *fmt, ...)`. 반환값은 에러 값, 쓴 글자 수는 `count`로 전달한다.

### 처음 코드의 문제

> [!INFO]- `snprintf_m` 처음 코드의 문제 표와 구현
> | 처음 코드 | 문제 | 처방 |
> |---|---|---|
> | `count`를 "가변 인자 개수"로 사용 | 주석의 `count`는 **버퍼에 쓴 글자 수** | `size_t *count` (값을 돌려주려면 포인터) |
> | `va_start(param, count)` | 마지막 **고정** 인자는 `fmt` | `va_start(param, fmt)` |
> | `char **temp = NULL; temp[i] = ...` | NULL 역참조 | 아예 모을 필요 없음 |
> | `va_arg(temp[i], char *)` | 첫 인자는 `va_list`, 결과를 받아야 함 | `vsnprintf(buf, buf_len, fmt, param)` |
> | `char *fmt_param;` 미초기화 후 `strcat` | 엉뚱한 주소에 쓰기 | 삭제 |
> | `snprintf(buf, buf_len, fmt, fmt_param)` | `va_list`는 `snprintf`가 아니라 **`vsnprintf`** | `vsnprintf` |
> | `sum_all`의 닫는 `}`가 주석 안 | 컴파일 에러 | 삭제 |
> | 자체 `enum errno_t` (`OK=1`) | `errno_t`는 성공 0 / errno 값이라는 규약 | `typedef int errno_t;` |
> | 인자 검증·잘림 처리 없음 | 잘림을 모름 | `EINVAL`, `ERANGE`, `EIO` |
>
> ```c
> errno_t snprintf_m(char *buf, size_t buf_len, size_t *count, const char *fmt, ...)
> 	__attribute__((format(printf, 4, 5)));         // 호출 쪽의 포맷/인자 불일치를 컴파일러가 검사
>
> 	va_start(param, fmt);                          // 마지막 고정 매개변수는 fmt
> 	ret_val = vsnprintf(buf, buf_len, fmt, param);
> 	va_end(param);
>
> 	if(ret_val < 0){ buf[0] = '\0'; return EIO; }
> 	if((size_t)ret_val >= buf_len){ *count = buf_len - 1; return ERANGE; }   // 잘림
> 	*count = (size_t)ret_val;
> 	return 0;
> ```
>
> - 시작할 때 `buf[0] = '\0'`, `*count = 0`으로 만들어 실패해도 항상 유효한 빈 문자열이 되게 한다.
> - `snprintf`/`vsnprintf`는 버퍼가 모자라도 **"쓰려던 길이"**를 돌려주므로, `ret >= buf_len`이 잘림 신호다.
>
> | 입력 | 반환 | `buf` / `count` |
> |---|---|---|
> | `"%s-%d"`, `"ab"`, 42 | 0 | `ab-42` / 5 |
> | 15글자, 버퍼 16 | 0 | 15글자 / 15 |
> | 16글자, 버퍼 16 | `ERANGE` | 앞 15글자 / 15 |
> | `buf_len`이 1 | `ERANGE` | `""` / 0 |
> | `buf`/`count`/`fmt`가 NULL, `buf_len` 0 | `EINVAL` | - |

---

## 4. 실습 3 — `sum_file` (줄 단위 합계와 에러 코드)

요구사항: 파일의 각 줄에 10진수 정수가 하나씩 있다. 반환값은 **에러 코드로만** 쓰고, 합계는 `sum` 인자로, 에러가 난 줄은 `err_line`으로 전달한다. 변환은 `strtol`, 합계가 `long` 범위를 넘으면 `SUM_ERANGE`.

EOF와 읽기 오류는 `ferror()`로 구분하고, **에러 시 `sum`을 바꾸지 않으며 어떤 경우에도 파일을 닫고** 반환한다. 함수 안에서 메시지 출력·`exit()`·`abort()` 금지.

### 처음 구현의 실제 동작

> [!NOTE] 요약
> - **문제**: `sum_file`이 `10, abc, 30`을 40으로, `4000000000`을 음수로 처리
> - **원인**: `atoi`류 사용, `int` 잘림, 오버플로, `__LINE__`을 에러 줄로 사용
> - **처방**: `strtol` + 끝 문자 검사, 더하기 **전** 한계 검사, 로컬 `total`에 모았다 성공 때만 `*sum` 갱신, 파일 줄번호, `ferror`로 읽기 오류 구분
> - **결과**: CRLF·음수·빈 파일·1100자 줄·디렉토리 포함 테스트 통과

> [!INFO]- 상세 보기
> | 입력 | 기대 | 실제 |
> |---|---|---|
> | `10, abc, 30` | `SUM_EINVAL`, 2번째 줄 | **40** (abc를 0으로 무시) |
> | `10, 12abc, 30` | `SUM_EINVAL` | **52** |
> | `4000000000, 1` | 4000000001 | **-294967295** (`int`로 잘림) |
> | `LONG_MAX, 1` | `SUM_ERANGE` | 0 (오버플로, 에러 없음) |
> | 에러 줄번호 | 파일의 줄 | `__LINE__` (소스코드 줄) |
> | `sum`이 NULL | `SUM_EPARAM` | 크래시 |

### 고친 구조

> [!INFO]- 코드 보기
> ```c
> if (_path == NULL || _sum == NULL || _err_line == NULL){ return SUM_EPARAM; }
> *_err_line = 0;
> fp = fopen(_path, "r");  if (fp == NULL){ return SUM_EOPEN; }
>
> while(fgets(buf, sizeof(buf), fp) != NULL){
> 	line_no++;
> 	len = strlen(buf);
> 	if (len > 0 && buf[len - 1] != '\n' && !feof(fp)){ ret = SUM_EINVAL; goto CLEANUP; }  // 줄이 버퍼보다 김
>
> 	errno = 0;
> 	num = strtol(buf, &end, 10);
> 	if (end == buf){ ret = SUM_EINVAL; goto CLEANUP; }                        // 숫자 없음, 빈 줄
> 	if (*end == '\r'){ end++; }                                              // CRLF
> 	if (*end != '\n' && *end != '\0'){ ret = SUM_EINVAL; goto CLEANUP; }     // 뒤에 문자
> 	if (errno == ERANGE){ ret = SUM_ERANGE; goto CLEANUP; }                  // 한 줄이 long 범위 밖
>
> 	if ((num > 0 && total > LONG_MAX - num) || (num < 0 && total < LONG_MIN - num)){
> 		ret = SUM_ERANGE; goto CLEANUP;                                      // 더하기 **전에** 검사
> 	}
> 	total += num;
> }
> if (ferror(fp)){ line_no++; ret = SUM_EREAD; goto CLEANUP; }                // EOF 가 아닌 읽기 오류
>
> *_sum = total;                  // 성공했을 때만 sum 갱신
> CLEANUP:
> 	fclose(fp);
> 	if (ret != SUM_OK){ *_err_line = line_no; }
> 	return ret;
> ```
>
> - **더한 뒤에 검사하면 이미 미정의 동작**이다. 더하기 전에 `total > LONG_MAX - num`처럼 한계로 검사한다.
> - 합계는 함수 안의 로컬 `total`에 모으고, 성공했을 때만 `*_sum`에 대입한다. 그래서 에러 경로에서 `sum`이 바뀌지 않는다.
> - 디렉토리를 열면 `fopen`은 성공하지만 `fgets`가 실패하므로 `ferror`로 `SUM_EREAD`가 된다.
> - `sum_strerror`의 `switch`는 숫자(0~5)가 아니라 `case SUM_OK:`처럼 enum 상수를 쓴다.
>
> 테스트: 위 표의 모든 케이스가 기대대로 나왔고(CRLF, 음수, 끝에 개행 없는 줄, 빈 파일, 1100자 줄, 디렉토리 포함), 성공·실패 경로를 섞어 1600번 호출한 뒤에도 열린 fd 수가 그대로였다.

---

## 5. API 설계 — 14-01 ~ 14-04

### 인자 검사와 읽기 종료 (14-01)

> [!NOTE] 요약
> - **문제**: `myFile`이 NULL이어도 검사 없이 `fgets` (14-01)
> - **원인**: 진입부 검사 없음, 루프가 끝난 이유(EOF/오류)를 구분하지 않음
> - **처방**: 진입부에서 선제 검사, 루프 뒤 `ferror`/`feof`로 구분

> [!INFO]- 상세 보기
> ```c
> static FILE *myFile = NULL;
> void usefile(void){
> 	while (fgets(buf, MAX_BUF_SIZE, myFile)) { printf("%s", buf); }   // myFile 이 NULL 이어도 검사 없음
> }
> ```
>
> - 함수는 진입부에서 인자를 **선제적으로** 검사한다 (`setfile`에 NULL이 와도, `usefile`을 `setfile` 전에 불러도).
> - `fgets`가 `NULL`을 돌려주는 이유는 EOF이거나 읽기 오류다. 루프 뒤에 `ferror(fp)`와 `feof(fp)`로 구분한다.

### 크기 없는 복사 함수 (14-02)

> [!NOTE] 요약
> - **문제**: `copy(dst, src)`에 대상 크기와 `return`이 없고, 크기를 받는 버전도 1바이트 넘침 (14-02)
> - **원인**: `dstend = dst + dst_size` 후 `*dst = '\0'`이 `dst[dst_size]`에 씀 (교육자료 수정안도 같음)
> - **처방**: `dstend = dst + dst_size - 1`, 크기는 원소 개수로, 꽉 찬 입력 경계값으로 확인

> [!INFO]- 상세 보기
> ```c
> int copy(char *dst, const char *src){ ... *dst = '\0'; }   // int 함수인데 return 이 없다 (UB), dst 크기를 모른다
> ```
>
> - 문자열은 포인터만 넘겨도 되지만, **받는 쪽 버퍼는 크기를 같이** 받아야 오버플로를 검사할 수 있다.
> - 크기를 받는 14-02-1도 **1바이트 넘친다**: `dstend = dst + dst_size`까지 복사한 뒤 `*dst = '\0'`을 쓰면 `dst[dst_size]`에 쓴다. 7칸 버퍼에 긴 문자열을 넣으면 `dst[7]`이 널이 되는 것을 확인했다.
>   `dstend = dst + dst_size - 1`이어야 한다.
> - 교육자료(14-2)의 "수정안"도 **같은 결함**을 갖고 있다 (`dstend = dst + dst_size`). 16칸 배열을 `'X'`로 채우고 `dst_size = 10`으로 긴 문자열을 복사해 `big[10]`을 찍으니 `0`이었다.
>   즉 크기 10 밖에 널 문자를 썼다. 자료의 코드도 그대로 믿지 말고 **경계값(꽉 찬 입력)** 으로 직접 확인한다.
> - 교육자료는 크기를 **바이트가 아니라 원소 개수**로 넘기라고 권한다 (`char`는 같지만 `int` 배열에서 차이가 난다).
>   `strncpy`/`strncat`의 `n`은 **복사할 최대 길이**이지 `dest`/`src`의 버퍼 크기가 아니므로, 크기를 따로 받는 `improved_strncpy(dest, destcount, src, srccount, n)` 같은 형태가 필요하다.

### conformant 배열 파라미터 (14-03)

> [!NOTE] 요약
> - **문제**: 배열 인자의 크기를 전달할 방법이 없음 (14-03)
> - **원인**: 배열 매개변수는 포인터라 `sizeof(p)`가 포인터 크기
> - **처방**: `void f(size_t n, char p[n])`처럼 크기를 **앞에** 선언 (뒤에 두면 GNU 확장). NULL·크기 검사는 별도로

> [!INFO]- 상세 보기
> ```c
> void my_memset(size_t n, char p[n], char v);   // 크기를 배열보다 먼저 선언
> ```
>
> - 포인터로 넘기지만, 배열의 크기를 **표현식으로 선언**하는 C99 문법이다. 크기 매개변수가 배열 매개변수보다 **앞에** 있어야 한다.
> - 뒤에 두려면 `void f(size_t n; char p[n], size_t n)`처럼 먼저 선언(forward declaration)해야 하는데, 이는 **GNU 확장**이다.
> - 컴파일러가 실제 크기를 강제하지는 않는다. 매개변수의 배열은 포인터이므로 `sizeof(p)`는 배열 크기가 아니라 **포인터 크기**(8)다. 그래서 `NULL` 검사와 크기 비교는 여전히 필요하다.

### non-blocking 재시도 (14-04)

> [!NOTE] 요약
> - **문제**: `EAGAIN`에서 대기 없이 곧바로 재시도해 횟수만 소진 (14-04)
> - **원인**: 지금은 쓸 수 없다는 신호를 즉시 재시도로 처리
> - **처방**: 재시도 사이에 시간을 주거나 `select`/`poll`로 대기, `write_len`을 누적해 partial write 처리

> [!INFO]- 상세 보기
> ```c
> rc = write(fd, pbuf + write_len, len - write_len);
> if (rc < 0) {
> 	if (errno == EWOULDBLOCK || errno == EAGAIN || errno == EINTR) { retry_cnt++; continue; }   // 바로 다시 시도
> 	...
> }
> write_len += rc;      // 일부만 써질 수 있다 (partial write)
> ```
>
> - non-blocking 소켓의 `write`는 보낼 수 없으면 `EAGAIN`/`EWOULDBLOCK`을 돌려준다. 대기 없이 곧바로 다시 시도하면 **재시도 횟수만 소진**되고 실패한다.
> - 네트워크 지연 때문에 정상적으로 보내지는 중인데 못 받은 것처럼 보일 수 있으므로, 재시도 사이에 **시간을 주거나**(`select`/`poll`로 쓰기 가능을 기다림) 한다.
> - `write`는 일부만 쓸 수 있으므로 `write_len`을 누적해 `len`이 될 때까지 반복한다.

---

## 6. 실습 4 — conformant 배열로 만든 `improved_strncpy/strncat`

크기를 앞에 선언한 conformant 파라미터로 `strncpy`/`strncat`을 안전하게 만든 함수.

```c
char* improved_strncpy(size_t destcount, char dest[destcount], size_t srccount, const char src[srccount], size_t n);
char* improved_strncat(size_t destcount, char dest[destcount], size_t srccount, const char src[srccount], size_t n);
```

### 규약 (요구사항 문서가 없어 직접 정함)

> [!INFO]- 규약
> - `n` : `src`에서 복사(추가)할 **최대 글자 수**(널 문자 제외). `srccount`를 넘어 읽지 않는다.
> - 항상 널 종료. `dest`에 `복사 길이 + 널 문자`가 들어가지 않으면 실패.
> - 실패하면 `NULL` + `errno` (`EINVAL`: NULL 인자·크기 0·영역 겹침·`strncat`의 `dest` 비널종료, `ERANGE`: 공간 부족). **`dest`는 변경하지 않는다.** 함수 안에서 메시지를 출력하지 않는다.

### 처음 코드의 문제

> [!NOTE] 요약
> - **문제**: `improved_strncpy/strncat`이 `n`을 안 쓰고, `strncpy` 사용, 널 문자 자리 누락, `size_t` 뺄셈
> - **원인**: `dest`가 널 종료되지 않았거나 영역이 겹칠 때 검사 없음
> - **처방**: `memchr`로 `dest` 확인, `memcpy` 후 `dest[len] = '\0'`, `len >= destcount - dlen` 검사, 겹치면 `EINVAL`, 에러는 `NULL`+`errno`
> - **결과**: 8칸에 `1234567`은 성공, `12345678`은 `ERANGE`(dest 불변)

> [!INFO]- 상세 보기
> | 처음 코드 | 문제 | 고친 코드 |
> |---|---|---|
> | `n`을 쓰지 않음 (`strncpy(dest, src, srccount)`) | `-Wunused-parameter`, 복사 개수가 `n`이 아님 | `n`과 `srccount` 중 작은 값까지, 널 문자 앞까지 (`strnlen`) |
> | `strncpy` 사용 | 원본이 `n` 이상이면 널 종료 안 됨, `n > destcount`면 넘침 | `memcpy` 후 `dest[len] = '\0'` |
> | `destcount < srccount` | 널 문자 자리와 `n`을 고려하지 않음 | `len >= destcount`이면 `ERANGE` |
> | `destcount - strlen(dest) < srccount` | `strncat`이 붙이는 **널 문자 1바이트**를 빼먹음 | `len >= destcount - dlen` |
> | `strlen(dest)` | `dest`가 널 종료되지 않았다면 범위를 넘어 읽음 | `memchr(dest, '\0', destcount)`로 먼저 확인 |
> | `destcount - strlen(dest)` | `size_t` 뺄셈 언더플로 | 위 `memchr` 통과 후라 `dlen < destcount` 보장 |
> | `imporoved_strncat` | 함수 이름 오타 | `improved_strncat` |
> | `printf`로 에러 메시지 | 라이브러리 함수는 출력하지 않는다 | `NULL` + `errno` |
> | `dest`/`src` 겹침 검사 없음 | `memcpy`는 겹치면 미정의 동작 | 영역 겹침이면 `EINVAL` |
>
> ```c
> static size_t copy_len(size_t srccount, const char src[srccount], size_t n){
> 	size_t limit = (n < srccount) ? n : srccount;
> 	return strnlen(src, limit);                  // 널 문자를 만나면 거기서 멈춤
> }
> ```
>
> | 호출 | 결과 |
> |---|---|
> | 8칸에 `1234567` 복사 | 성공 (널 문자 포함 딱 맞음) |
> | 8칸에 `12345678` 복사 | `NULL`, `ERANGE`, `dest` 불변 |
> | `n=3`으로 `hello world` | `hel` |
> | 널 문자 없는 `src` (`srccount=3`) | `abc`에서 멈춤 |
> | `foo`(8칸)에 `1234` 추가 | `foo1234` (딱 맞음) |
> | `foo`(8칸)에 `12345` 추가 | `NULL`, `ERANGE` (널 자리 1칸 부족) |
> | 널 종료 없는 `dest`에 추가 | `NULL`, `EINVAL` |
>
> > [!NOTE]
> > 경계 밖 쓰기는 버퍼 뒤에 감시용 바이트(canary)를 두고 변하지 않는지로 확인했다.

---

## 📝 교육자료 추가 과제 (14-6) — TBCD 변환 API, 아직 구현하지 않음

> [!INFO]- 요구사항과 확인할 점 (TBCD)
> IMSI·MSISDN 같은 번호를 저장하는 **TBCD(Telephony BCD)** 형식과 숫자 문자열을 서로 바꾸는 API다. 구현·검증은 아직 하지 않았고, 요구사항과 확인할 점만 정리한다.
>
> - 1바이트에 숫자 2개. **앞 자리 숫자가 하위 4비트, 뒷 자리 숫자가 상위 4비트**이고, 자릿수가 홀수면 마지막 바이트의 상위 4비트를 `0xF`로 채운다.
> - 예: `"12345"` → `0x21 0x43 0xF5` (`1,2` → `0x21`, `3,4` → `0x43`, `5` + 채움 `F` → `0xF5`).
>
> ```c
> int digits_to_tbcd(size_t tbcd_size, unsigned char tbcd[tbcd_size], size_t *tbcd_len, const char *digits);
> int tbcd_to_digits(size_t str_size, char str[str_size], size_t tbcd_len, const unsigned char tbcd[tbcd_len]);
> // 성공 0, 실패는 원인별로 구분되는 음수
> ```
>
> | 요구 | 확인할 점 |
> |---|---|
> | 배열 인자는 **conformant 배열 파라미터**, 크기는 **원소 개수**로 전달 | 크기 인자를 배열보다 **앞에** 선언 (§5 14-03) |
> | 인자 검증은 **callee 안에서 전부** | `NULL` 포인터, 크기 0인 배열, 빈 문자열, 숫자(`0`~`9`)가 아닌 문자 |
> | 결과가 출력 배열에 안 들어가면 **잘라 쓰지 말고 에러** | `tbcd_to_digits`는 **널 문자까지** 들어가야 한다 (자릿수 + 1) |
> | TBCD 데이터 검증 | `0xA`~`0xE` 값은 에러, `0xF`는 **마지막 바이트의 상위 4비트에서만** 허용 (그 밖의 위치의 `0xF`는 에러) |
> | 에러 시 **출력 배열과 `tbcd_len`을 바꾸지 않는다** | 검증을 모두 끝낸 **뒤에** 쓴다 (`enc_dec`의 "검증 → 쓰기" 순서와 같은 원칙, [바이트 순서 노트 §3](개발%20%28CS%29/언어/C언어/실습/[C]%20바이트%20순서·메시지%20헤더·컴파일러%20경고%20실습%20—%20htonll·enc_dec와%20size_t·switch%20함정.md)) |
> | `main`에서 짝수·홀수 자릿수의 **왕복 변환**과 에러 케이스별 반환값 확인 | 에러마다 서로 다른 음수를 돌려주어야 시험으로 구분할 수 있다 |

---

## ✅ 정리 — 에러 처리·API 점검 체크리스트

> [!INFO]- 체크리스트 펼치기
> - [ ] 에러는 **반환값**으로, 값은 **인자**로 돌려주는가 (in-band 지시자 금지)
> - [ ] `errno`는 호출 **직전에 0**, 호출 **직후에만** 읽는가
> - [ ] 문자열→숫자는 `strtol`/`strtoul` + `endptr`(끝 문자) + `ERANGE`로 검사하는가 (`atoi` 금지)
> - [ ] `strtol`의 결과를 `int`로 줄일 때 범위(`INT_MAX`/`INT_MIN`)를 검사한 뒤 캐스팅하는가
> - [ ] 합산·곱셈은 **하기 전에** 한계를 검사하는가 (`total > LONG_MAX - num`)
> - [ ] 반환 타입이 `int`/enum인 함수가 모든 경로에서 `return`하는가
> - [ ] 실패했을 때 출력 인자(`*out`, `*sum`)를 바꾸지 않았는가
> - [ ] 라이브러리 성격의 함수 안에서 메시지 출력·`exit()`·`abort()`를 하지 않는가
> - [ ] 종료는 `return`/`exit`로 하는가 (`_Exit`·`abort`는 `atexit`를 건너뛰고, stdio 버퍼를 비우는지는 구현마다 다름)
> - [ ] 읽기 루프가 끝난 뒤 `ferror`와 `feof`로 이유를 구분하는가
> - [ ] 받는 쪽 버퍼 크기를 인자로 받고, **널 문자 1바이트**까지 계산했는가 (`dstend = dst + dst_size - 1`)
> - [ ] 가변 인자 함수는 `va_start`의 마지막 고정 인자가 맞고, `vsnprintf`로 넘기고, 모든 경로에서 `va_end`하는가
> - [ ] `va_list`를 받는 포맷 함수에 `__attribute__((format(printf, …)))`를 붙였는가
> - [ ] 배열 인자는 `size_t n, char p[n]`처럼 **크기를 앞에** 선언했고, 그래도 NULL·크기 검사를 하는가
> - [ ] non-blocking I/O의 재시도 사이에 대기를 두고, partial write를 누적 처리하는가

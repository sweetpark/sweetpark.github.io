---
title: "(C) 문자열 함수 실습 — strncpy·strncat 직접 구현과 오버플로 함정"
description: "C 문자열 실습에서 만난 널 문자, const, signed/unsigned char, off-by-one 오류를 정리하고 strncpy와 strncat을 직접 구현했습니다."
tags: 
created: 2026-10-13
modified: 2026-10-15
---

# 문자열 함수 실습 — strncpy·strncat 직접 구현과 오버플로 함정

> [!IMPORTANT]
> 코드는 컨테이너에서 컴파일·실행해 확인했고, 설명은 AI(Claude)와 함께 코드 리뷰하며 정리했다.

> [!TIP]
> **📂 원본 소스 (GitHub)**
> - 직접 구현: [`str/str_ex.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/str/str_ex.c) — `my_strncpy`, `my_strncat`, `make_filename`
> - 강의 코드 8-01 ~ 8-05: [`lecture/str/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/str)
> - 빌드: `make -C c_basic` ([README](https://github.com/sweetpark/c-playgound/blob/main/c_basic/README.md))

## 📌 한눈에 보기

| 실습 | 문제 | 핵심 원인 | 처방 |
|---|---|---|---|
| 8-01 | `strncpy` 후 널 문자 없음 | `strncpy`는 원본이 `n` 이상이면 `\0`을 붙이지 않음 | `snprintf` 또는 마지막에 `\0` 직접 대입 |
| 8-02 | `strlen`에 `signed char*` 전달 | `char*`와 `signed/unsigned char*`는 다른 타입 | 문자열은 `char*`로 통일 |
| 8-03 | 문자열 리터럴 수정 | 리터럴은 읽기 전용 영역 | `const char*`로 받고, 수정이 필요하면 배열로 복사 |
| 8-04 | `get_dirname`이 원본을 그대로 반환 | `const` 문자열을 잘라 쓸 수 없음 | 출력 버퍼에 복사해서 자르기 |
| 8-05-a | 복사 루프 종료 시 1바이트 초과 | off-by-one (`dest[i]='\0'`) | 널 문자 자리까지 크기에 포함 |
| 8-05-b | `getchar` 루프에 경계 검사 없음 | 입력 길이 무제한 | 버퍼 끝 검사 또는 `fgets` |

---

## 1. 널 문자와 const — 8-01, 8-03

### strncpy는 널 문자를 보장하지 않는다 (8-01)

> [!NOTE] 요약
> - **문제**: `strncpy` 뒤 문자열에 `\0`이 없음 (8-01)
> - **원인**: 원본이 `n` 이상이면 `strncpy`는 널 문자를 붙이지 않음
> - **처방**: `snprintf(a, sizeof(a), "%s", src)` 또는 마지막 칸에 `\0` 직접 대입, `src` NULL 검사
> - **결과**: 항상 널 종료 + 잘림 안전

> [!INFO]- 상세 보기
> ```c
> void func(const char *src)
> {
> 	char a[16];
> 	strncpy(a, src, sizeof(a));   // src가 16자 이상이면 a는 '\0'으로 끝나지 않는다
> 	printf("a=%s\n", a);
> }
> ```
>
> - `strncpy(dst, src, n)`은 `src`가 `n`보다 짧으면 나머지를 `\0`으로 채우지만, **`n` 이상이면 널 문자를 붙이지 않는다**.
> - `src`가 NULL인지, `a`보다 긴지 먼저 확인해야 한다.
>
> ```c
> if (src == NULL) return;
> snprintf(a, sizeof(a), "%s", src);   // 항상 널 종료 + 잘림 안전
>
> /* strncpy를 쓴다면 */
> strncpy(a, src, sizeof(a) - 1);
> a[sizeof(a) - 1] = '\0';
> ```

### 리터럴은 상수다 (8-03)

> [!NOTE] 요약
> - **문제**: 리터럴을 수정하면 SIGSEGV (8-03)
> - **원인**: 리터럴은 읽기 전용 영역이고, 배열 크기는 글자 수 + 1
> - **처방**: `const char *`로 받고, 수정이 필요하면 `char buf[] = "..."`로 복사
> - **결과**: 읽기 전용 위반 없음

> [!INFO]- 상세 보기
> ```c
> const char *c = "Hello";
> printf("%s\n", c);
> // c[0] = 'h';   // 리터럴은 읽기 전용 영역 → 쓰면 정의되지 않은 동작(보통 SIGSEGV)
> ```
>
> - `char *` 또는 `const char *`로 가리킨 리터럴은 **변경 불가**로 취급한다.
> - 바꿔야 하면 배열에 복사한다: `char buf[] = "Hello"; buf[0] = 'h';`
> - 문자열의 끝에는 항상 `'\0'`이 필요하다. 배열 크기는 **글자 수 + 1**이다.

---

## 2. signed/unsigned char — 8-02

> [!NOTE] 요약
> - **문제**: `strlen`에 `signed/unsigned char*`를 넘기면 `-Wpointer-sign` 경고 (8-02)
> - **원인**: `char`, `signed char`, `unsigned char`는 서로 다른 세 타입
> - **처방**: 문자열은 `char*`로 통일, 바이트 데이터는 `unsigned char*` + 길이(`size_t`)
> - **결과**: 경고 제거

> [!INFO]- 상세 보기
> ```c
> char cstr[] = "char string";
> signed char scstr[] = "signed char string";
> unsigned char ucstr[] = "unsigned char string";
>
> len = strlen(cstr);
> len = strlen(scstr);    // -Wpointer-sign 경고
> len = strlen(ucstr);    // -Wpointer-sign 경고
> ```
>
> `strlen`의 인자는 `const char *`다. `char`, `signed char`, `unsigned char`는 **서로 다른 세 타입**이라 포인터를 넘길 때 부호 경고가 난다.
>
> 문자열 함수에는 `char *`를 쓰고, 바이트 데이터가 필요하면 `unsigned char *`와 길이(`size_t`)를 따로 관리한다.

---

## 3. const 문자열을 자를 수 없다 — 8-04

> [!NOTE] 요약
> - **문제**: `get_dirname`이 아무것도 못 자르고 원본을 반환 (8-04)
> - **원인**: `const`/리터럴 문자열에는 `\0`을 쓸 수 없음
> - **처방**: 출력 버퍼에 `memcpy`로 복사한 뒤 `out[len] = '\0'` (`len + 1 > outsize`면 실패)
> - **결과**: `/home/dir` → `/home` (루트 바로 아래는 `"/"` 분기를 따로 둠)

> [!INFO]- 상세 보기
> ```c
> const char *get_dirname(const char *pathname) {
> 	char *slash = strrchr(pathname, '/');
> 	/* if (slash) *slash = '\0';   ← pathname이 리터럴이면 쓰기 불가 */
> 	return pathname;               // 아무것도 못 자르고 원본을 반환
> }
> ```
>
> `/home/dir`에서 마지막 `/` 앞까지만 얻고 싶다면, 원본을 건드리지 말고 **출력 버퍼에 복사**한다.
>
> ```c
> int get_dirname(const char *path, char *out, size_t outsize)
> {
> 	const char *slash = strrchr(path, '/');
> 	size_t len;
>
> 	if (slash == NULL) return -1;
> 	len = (size_t)(slash - path);
> 	if (len + 1 > outsize) return -1;   // 널 문자 자리까지 확인
>
> 	memcpy(out, path, len);
> 	out[len] = '\0';
> 	return 0;
> }
> ```
>
> `/home/dir` → `/home`. (루트 바로 아래 `/x`는 빈 문자열이 되므로 `"/"`로 처리하는 분기를 따로 두면 완성도가 올라간다.)

---

## 4. off-by-one와 무제한 입력 — 8-05

### 8-05-a: 복사 루프가 1바이트를 넘긴다

> [!NOTE] 요약
> - **문제**: 복사 루프 종료 시 `dest[i]='\0'`가 1바이트 초과 (off-by-one)
> - **원인**: `n`개를 다 복사한 뒤 `dest[n]`에 널 문자를 씀
> - **처방**: `dest`를 `n+1`로 만들거나 루프를 `i < n - 1`로
> - **결과**: `size_t`는 `%zu`로 출력

> [!INFO]- 상세 보기
> ```c
> void copy(size_t n, char *src, char *dest) {
> 	size_t i;
> 	for (i = 0; src[i] && (i < n); ++i) {
> 		dest[i] = src[i];
> 	}
> 	dest[i] = '\0';        // i가 n(=10)이면 dest[10] → 범위 초과
> }
>
> char src[10] = "0123456789";   // 널 문자 없이 딱 10바이트 (C에서 허용)
> char dest[10];
> copy(10, src, dest);
> ```
>
> - `i < n`으로 `n`개를 다 복사한 뒤 `dest[n]`에 널 문자를 쓰므로 **`dest`가 `n+1` 이상**이어야 한다.
> - 해법은 둘 중 하나다: `dest`를 `n+1`로 만들거나, 루프를 `i < n - 1`로 돌려 마지막 칸을 널 문자용으로 남긴다.
> - 덤으로 `size_t`는 `%d`가 아니라 `%zu`로 출력한다.

### 8-05-b: 입력 길이를 검사하지 않는다

> [!NOTE] 요약
> - **문제**: `getchar` 루프에 길이 상한이 없어 버퍼 초과
> - **원인**: 입력 길이 무제한 + 마지막 `*p++ = 0`도 범위 초과 가능
> - **처방**: `p < buf + sizeof(buf) - 1` 조건 추가 또는 `fgets`
> - **결과**: 입력이 길면 남은 글자는 입력 버퍼에 남음

> [!INFO]- 상세 보기
> ```c
> char buf[BUFFERSIZE];          // 10
> char *p = buf;
> while ((ch = getchar()) != '\n' && ch != EOF) {
> 	*p++ = (char)ch;           // 10자를 넘겨도 계속 씀
> }
> *p++ = 0;                      // 이것도 범위 초과 가능
> ```
>
> ```c
> while (p < buf + sizeof(buf) - 1 &&
>        (ch = getchar()) != '\n' && ch != EOF) {
> 	*p++ = (char)ch;
> }
> *p = '\0';
> ```
>
> 또는 `fgets(buf, sizeof(buf), stdin)`을 쓰고 개행을 제거한다. 입력이 버퍼보다 길면 남은 글자가 입력 버퍼에 남는다는 점도 기억해 둔다.

---

## 5. 직접 구현 — my_strncpy / my_strncat

### 가장 흔한 실수: 루프 안의 strlen(dst)

> [!NOTE] 요약
> - **문제**: `strcat` 직접 구현 결과가 `"dsts"`로 끝남
> - **원인**: 루프 안의 `strlen(dst)`가 첫 글자를 쓰는 순간 3→4로 변함
> - **처방**: 길이를 루프 전에 한 번만 구해 변수에 저장
> - **결과**: `dst[3]`, `dst[5]`, `dst[6]`… 한 칸씩 건너뛰며 써짐

> [!INFO]- 상세 보기
> 처음 짠 `strcat` 구현은 이랬다.
>
> ```c
> for (i = 0; i < strlen(src) + 1; i++) {
> 	dst[i + strlen(dst)] = src[i];   // dst가 바뀌면 strlen(dst)도 바뀐다!
> }
> ```
>
> `dst="dst"`, `src="src"`일 때:
>
> | i | strlen(dst) | 쓰는 위치 | 결과 |
> |---|---|---|---|
> | 0 | 3 | `dst[3]='s'` | `"dsts"` |
> | 1 | 4 | `dst[5]='r'` | `dst[4]`는 `\0`이라 여전히 `"dsts"` |
> | 2 | 4 | `dst[6]='c'` | 여전히 `"dsts"` |
> | 3 | 4 | `dst[7]='\0'` | 여전히 `"dsts"` |
>
> 첫 글자를 쓰는 순간 **`strlen(dst)`가 3에서 4로 변해** 다음 글자가 한 칸씩 건너뛴 위치에 써진다. 원인은 간단하다 — **길이를 루프 전에 한 번만 구해 변수에 저장**하면 된다.

### 고친 구현

> [!NOTE] 요약
> - **문제**: `my_strncat`/`my_strncpy`의 크기 검사·널 문자 처리 오류
> - **원인**: 널 문자 자리(+1) 누락, 검사 후 쓰기 순서, `strlen`을 루프 조건에 사용
> - **처방**: `dstsize < dlen + slen + 1` 검사, `i <= slen`으로 `\0`까지 복사, 검사 통과 후 `memset`
> - **결과**: gdb의 `display strlen(dst)`로 변하는 순간 확인 가능

> [!INFO]- 상세 보기
> ```c
> int my_strncat(char *dst, size_t dstsize, const char *src) {
> 	size_t dlen = strlen(dst);
> 	size_t slen = strlen(src);
>
> 	/* 널 문자까지 들어가야 하므로 dlen + slen + 1 <= dstsize */
> 	if (dstsize < dlen + slen + 1) {
> 		printf("Error overflow\n");
> 		return -1;
> 	}
>
> 	for (size_t i = 0; i <= slen; i++) {   /* '\0'까지 복사 */
> 		dst[dlen + i] = src[i];
> 	}
> 	return 1;
> }
>
> int my_strncpy(char *dst, size_t dstsize, const char *src) {
> 	size_t slen = strlen(src);
>
> 	if (dstsize < slen + 1) {              /* slen이 아니라 slen + 1 */
> 		printf("Error overflow\n");
> 		return -1;
> 	}
> 	memset(dst, 0, dstsize);
>
> 	for (size_t i = 0; i <= slen; i++) {
> 		dst[i] = src[i];
> 	}
> 	return 1;
> }
> ```
>
> 고친 점을 정리하면 다음과 같다.
>
> 1. **크기 검사에 `+ 1`**: 널 문자 자리를 빼먹으면 딱 맞는 길이에서 1바이트가 넘친다. `strlen(dst) + strlen(src) - 1`처럼 `size_t` 끼리 빼면 언더플로 위험도 있다.
> 2. **`i <= slen`으로 널 문자까지 복사**: 별도의 `'\0'` 처리 분기가 필요 없다.
> 3. **`strlen`을 루프 조건에 쓰지 않기**: 매번 호출하면 O(n²)이고 위 버그의 원인이 된다.
> 4. **검사 후에 `memset`**: 실패할 거라면 `dst`를 건드리지 않는 편이 안전하다.
> 5. **읽기만 하는 인자는 `const char *`**.
>
> 디버깅은 `gcc -g -O0`으로 빌드한 뒤 gdb에서 `break my_strncat` → `display dst` → `display strlen(dst)` → `next`를 반복하면 `strlen(dst)`가 변하는 순간이 그대로 보인다.

---

## 6. 파일명 생성 — snprintf + time + "wx"

> [!NOTE] 요약
> - **문제**: `base_YYYYMMDDhhmm[index]` 이름을 중복 없이 만들어야 함
> - **원인**: `fprintf` 오용, 쓴 뒤 크기 검사, `"rw"` 모드, `fp` 스코프, TOCTOU
> - **처방**: `snprintf`로 쓰기 전 검사, `fopen("wx")`로 존재 확인과 생성을 원자적으로, `errno != EEXIST`면 즉시 종료
> - **결과**: 있으면 index를 올려 재시도, 그 외 오류는 바로 실패

> [!INFO]- 상세 보기
> `base_name_YYYYMMDDhhmm[index]` 형태의 이름을 만들고, **이미 있으면 index를 올려가며 새 파일을 생성**하는 함수다.
>
> ```c
> int make_filename(const char *base_name, char *filename, size_t size) {
> 	char ts[16];
> 	time_t now = time(NULL);
> 	strftime(ts, sizeof(ts), "%Y%m%d%H%M", localtime(&now));
>
> 	int index = 0;
> 	FILE *fp = NULL;                       // do 블록 밖에서 선언
>
> 	do {
> 		int n = snprintf(filename, size, "%s_%s[%d]", base_name, ts, index);
> 		if (n < 0 || (size_t)n >= size) {  // 이름 만들 때 바로 크기 검사
> 			printf("Error overflow name\n");
> 			return -1;
> 		}
>
> 		fp = fopen(filename, "wx");        // 있으면 NULL, 없으면 생성
> 		if (fp == NULL && errno != EEXIST) {
> 			perror("fopen");               // 권한/경로 문제는 재시도해도 소용없음
> 			return -1;
> 		}
> 		index++;
> 	} while (fp == NULL);                  // 이미 존재(EEXIST)하면 index+1로 재시도
>
> 	fclose(fp);
> 	return 0;
> }
> ```
>
> 처음 짠 코드에서 고친 점들이다.
>
> - **`fprintf` → `snprintf`**: `fprintf`는 `FILE*`에 쓰는 함수다. 문자열 버퍼에는 `snprintf`.
> - **크기 검사는 쓰기 전에**: 이름을 쓴 뒤에 검사하면 이미 오버플로가 난 뒤다. `snprintf` 반환값(잘리지 않았다면 쓰였을 길이)으로 검사한다.
> - **`"rw"`는 유효한 모드가 아니다**: 유효한 모드는 `r w a r+ w+ a+` (+ `b`, `x`).
> - **`"wx"`로 존재 확인과 생성을 한 번에**: `access()`/`stat()`으로 확인한 뒤 `fopen()`하면 그 사이에 파일이 바뀔 수 있다(TOCTOU). `"wx"`(C11)는 이미 있으면 실패하고 없으면 **원자적으로 생성**한다.
> - **`errno != EEXIST`면 즉시 종료**: 권한 없음 같은 이유로 실패하는데도 무한히 도는 것을 막는다.
> - **`fp`는 `do` 블록 밖에서 선언**해야 `while (fp == NULL)`에서 보인다.
>
> > [!TIP]
> > 파일명에 `[`·`]`는 Windows에서는 허용되지만 쉘에서 글로빙 문자로 해석된다. 실무에서는 `_%d` 정도가 다루기 편하다.

---

## 💡 실습 환경 팁 — gdb 디버깅과 man 페이지

### gdb를 쓰려면 gcc에 `-g` 옵션이 필요하다

> [!INFO]- 상세 보기 (-g 옵션, gdb 명령)
> `-g` 없이 빌드하면 실행 파일에 **디버그 심볼(소스 줄 번호, 변수 이름)** 이 들어가지 않아, gdb에서 `break 함수명`이나 `print 변수`를 해도 소스와 연결되지 않는다.
>
> ```bash
> gcc -g -O0 -Wall -Wextra -o test test.c
> gdb ./test
> ```
>
> | 옵션 | 의미 |
> |---|---|
> | `-g` | 디버그 심볼 포함 (**gdb 사용에 필수**) |
> | `-O0` | 최적화 끄기 — 변수가 최적화로 사라지거나 줄 순서가 바뀌는 것을 방지 |
> | `-Wall -Wextra` | 경고 활성화 |
>
> 자주 쓰는 gdb 명령은 다음과 같다.
>
> ```
> break main        # 중단점 (break 파일:줄번호 도 가능)
> run               # 실행 (인자: run arg1 arg2)
> next / step       # 한 줄 실행 / 함수 안으로 진입
> print dst         # 변수 출력
> display dst       # 스텝마다 자동 출력
> x/16xb dst        # 메모리를 바이트 단위 16진수로 보기
> bt                # 호출 스택
> ```

### vim에서 man 페이지 보기 — `숫자 + Shift+K`

> [!INFO]- 상세 보기 (K, 2K, 3K)
> vim에서 단어 위에 커서를 두고 **`Shift+K`** 를 누르면 `man <단어>`가 열린다. 이때 **앞에 숫자를 붙여 `숫자 + Shift+K`** 를 누르면 그 숫자의 섹션 man 페이지가 열린다.
>
> | 키 | 실행되는 명령 | 보이는 것 |
> |---|---|---|
> | `K` | `man stat` | 섹션 1 — 쉘 명령어 |
> | `2K` | `man 2 stat` | 섹션 2 — 시스템 콜 (C 함수) |
> | `3K` | `man 3 fopen` | 섹션 3 — C 라이브러리 함수 |
>
> 그냥 `K`만 누르면 같은 이름의 쉘 명령어(`stat`, `rename`)가 먼저 나오므로, **C 함수의 설명을 보려면 숫자를 붙인다**.

---

## 📝 교육자료 추가 과제 (8-7) — 아직 구현하지 않음

> [!INFO]- 요구사항과 확인할 점 (parse_kv, read_line)
> 교육자료 뒤쪽에 실었는데 이 노트의 실습에는 없던 과제다. 구현·검증은 아직 하지 않았고, **요구사항과 확인할 점만** 정리해 둔다.
>
> **`parse_kv`** — `"  log_level = debug  "`를 `key="log_level"`, `val="debug"`로 나눈다.
>
> ```c
> int parse_kv(const char *line, char *key, size_t key_size, char *val, size_t val_size);
> // 0 성공 / -1 인자 오류(NULL, 크기 0) / -2 '=' 없음 / -3 key가 빈 문자열 / -4 key 버퍼 부족 / -5 val 버퍼 부족
> ```
>
> | 요구 | 확인할 점 |
> |---|---|
> | 첫 번째 `=`로 분리 | `value` 안에 `=`가 더 있어도 그대로 값의 일부 |
> | key·value 앞뒤 공백(space, tab) 제거 | 앞과 뒤를 따로 처리, 전부 공백이면 빈 문자열 → key면 `-3` |
> | **`line`을 수정하지 않는다** (리터럴이 올 수 있음) | `strchr`가 돌려준 포인터로 `*p = '\0'`을 쓰는 것도 수정이다 → 위치(인덱스)만 구하고 `memcpy`로 복사한 뒤 끝에 `'\0'` ([8-04](#3-const-문자열을-자를-수-없다--8-04)와 같은 문제) |
> | 버퍼에 다 안 들어가면 **잘라 저장하지 말고 에러** | 길이가 `size - 1`이면 들어가고 `size`이면 `-4`/`-5`. 두 경계를 모두 시험 |
> | 인자 오류 외의 에러에서는 `key`, `val`을 `""`로 | 에러 경로마다 빠뜨리기 쉬우니 한 곳에서 초기화 |
>
> **`read_line`** — `getchar()`로 한 줄을 읽는다.
>
> ```c
> int read_line(char *buf, size_t size);
> // 0 정상 / 1 줄이 잘림 / -1 읽은 문자 없이 EOF
> ```
>
> - 개행은 저장하지 않고, 입력이 `size - 1`보다 길면 **나머지는 읽어서 버리되**(다음 줄에 섞이지 않게) 반환값 `1`로 알린다. `buf`는 어떤 경우에도 널 종료.
> - `getchar()`의 결과는 `int`로 받아 `EOF`와 비교한다 (§4의 8-05-b). 마지막 줄에 개행이 없어도 문자를 읽었다면 정상으로 처리해야 한다.
> - `main`은 EOF까지 한 줄씩 읽어 `parse_kv`에 넘기고, **잘린 줄은 분석하지 않고 에러로 출력**한다. key 버퍼 16·value 버퍼 32로 두고 길이 15/16(key), 31/32(value)를 모두 시험한다.

---

## ✅ 정리 — 문자열 코드 점검 체크리스트

> [!INFO]- 체크리스트 펼치기
> - [ ] 대상 버퍼 크기 = **글자 수 + 1(널 문자)** 로 계산했는가
> - [ ] 쓰기 **전에** 크기를 검사했는가 (쓰고 나서 검사하면 늦다)
> - [ ] `strncpy`를 쓴 뒤 널 문자를 직접 보장했는가 (또는 `snprintf`)
> - [ ] 루프 조건·인덱스에 **변하는 값**(`strlen(dst)`)을 넣지 않았는가
> - [ ] `size_t` 끼리 뺄셈을 하지 않았는가 (언더플로)
> - [ ] 리터럴을 수정하지 않는가 (필요하면 배열로 복사)
> - [ ] 입력 루프(`getchar`, `fgets`)에 **길이 상한**이 있는가
> - [ ] 읽기 전용 인자에 `const`를 붙였는가

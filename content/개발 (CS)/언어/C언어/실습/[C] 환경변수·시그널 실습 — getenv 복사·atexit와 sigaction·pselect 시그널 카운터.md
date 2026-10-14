---
title: "(C) 환경변수·시그널 실습 — getenv 복사·atexit와 sigaction·pselect 시그널 카운터"
tags: 
created: 2026-10-14
modified: 2026-10-14
---

# 환경변수·시그널 실습 — getenv 복사·atexit와 sigaction·pselect 시그널 카운터

> [!NOTE]
> C 기초 강의의 환경변수(11-01 ~ 11-03)와 시그널(12-01 ~ 12-04) 실습에서 만난 오류 패턴을 정리하고, 이를 바탕으로 **로그 기록기**(`env_ex.c`), **PATH 탐색기**(`env_ex2.c`), **시그널 카운터 두 개**(`sig_ex.c`, `sig_ex2.c`)를 직접 만들며 겪은 버그를 기록한다. 환경은 Docker Desktop의 Linux 컨테이너(`c_app_part1`), `gcc -Wall -Wextra`.

> [!IMPORTANT]
> 코드는 컨테이너에서 컴파일·실행해 확인했고, 설명은 AI(Claude)와 함께 코드 리뷰하며 정리했다.

> [!TIP]
> **📂 원본 소스 (GitHub)**
> - 로그 기록기: [`env/env_ex.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/env/env_ex.c)
> - PATH 탐색기: [`env/env_ex2_v1.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/env/env_ex2_v1.c)(초안) · [`env/env_ex2_v2.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/env/env_ex2_v2.c)
> - 1초 카운터: [`sig/sig_ex.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/sig/sig_ex.c) · [`sig/sig_ex_v2.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/sig/sig_ex_v2.c)
> - 시그널 카운터: [`sig/sig_ex2.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/sig/sig_ex2.c) · [`sig/sig_ex2_v2.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/sig/sig_ex2_v2.c) (설정 예시 [`12-07.conf`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/sig/sample/12-07.conf))
> - 강의 코드 11-01 ~ 11-03: [`lecture/env/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/env), 12-01 ~ 12-04: [`lecture/sig/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/sig)
> - 빌드: `make -C c_basic` ([README](https://github.com/sweetpark/c-playgound/blob/main/c_basic/README.md))

> [!TIP]
> **📂 환경**
> - 접속: `docker exec -it c_app_part1 /bin/bash`
> - 시그널 보내기: `kill -HUP <PID>` (예: `kill -HUP 1501`), 종류는 `HUP`, `USR1`, `USR2`, `INT`, `TERM`
> - 컨테이너의 gcc가 오래돼서(4.8) `-Wvla-parameter` 같은 최신 경고 옵션은 쓸 수 없다.

## 📌 한눈에 보기

| 실습 | 문제 | 처방 |
|---|---|---|
| 11-01 | `getenv("PATH")`를 `char path[32]`에 `strcpy` → 환경변수 길이는 외부 값이라 넘침 | 길이 검사 후 `snprintf`/`strncpy` + 널 종료, 또는 `strlen+1`만큼 `malloc` |
| 11-02 | `getenv` 반환 문자열을 직접 바꾸려 함 | 반환값은 읽기 전용으로 취급, **복사해서** 수정 |
| 11-03 | `atexit` 등록 후 `_Exit`로 종료 → 핸들러가 실행되지 않음 | 종료 경로는 `return`/`exit`, 핸들러는 **등록의 역순**으로 실행 |
| 12-01 | 시그널 시점에 따라 일부가 무시됨(중복 시그널) | `sigaction` + 시그널 마스크 |
| 12-02 | `signal()`은 시스템마다 동작이 다름(UNIX는 유지, Windows는 1회 후 기본값) | 이식성이 필요하면 `sigaction` |
| 12-03 | 핸들러 안에서 `fputs`/`free` 호출 → 락 때문에 교착 가능 | 핸들러는 **flag 설정만** |
| 12-04 | 핸들러가 `strcpy`로 전역 버퍼를 건드림 → 해제 후·쓰는 도중 접근 | flag만 세우고 처리는 main에서 |

---

## 1. 환경변수 — 11-01 ~ 11-03

### 길이가 정해지지 않은 외부 값 (11-01)

```c
enum {PATH_MAX = 32};
char path[PATH_MAX];
strcpy(path, getenv("PATH"));     // PATH 길이가 32를 넘으면 스택 오버플로
```

- 환경변수는 **프로그램 밖에서 들어오는 값**이다. 길이도 내용도 믿을 수 없다.
- 고정 배열에 담으려면 길이를 검사하고, `strncpy`를 쓰면 마지막에 널 문자를 직접 넣는다. 길이를 모르면 `malloc(strlen(env) + 1)`로 크기를 구해서 복사한다.
- `getenv`는 변수가 없으면 `NULL`을 돌려준다. `NULL` 검사가 먼저다.

### 반환 문자열은 수정하지 않는다 (11-02)

- `getenv`가 돌려주는 포인터는 환경 영역을 가리키므로 수정하면 안 된다. 바꿔야 하면 **복사본**을 만들어서 바꾼다.
- 강의 코드의 `trstr`(문자 치환)도 `strncpy(buf, c_str, 1024)`로 복사한 뒤 `buf`를 바꿨다. 다만 `strncpy`가 널 문자를 보장하지 않고, 결과 `buf`를 호출한 쪽에 돌려주지도 않아서 **바꾼 결과가 사라진다**.

### atexit (11-03)

```c
atexit(exit1);
atexit(exit2);
if (argc != 1) { _Exit(1); }      // 핸들러가 실행되지 않는다
return 0;                          // exit2 → exit1 순으로 실행 (LIFO)
```

- `atexit`로 등록한 함수는 `return`(main)이나 `exit()`로 끝날 때 **등록의 반대 순서**로 실행된다.
- `_Exit()`, `abort()`는 핸들러도 `stdio` 버퍼 비우기도 하지 않는다. 자원 정리가 필요한 프로그램은 이 둘로 끝내지 않는다.

---

## 2. 실습 1 — 로그 기록기 `env_ex.c`

요구사항: `LOG_PATH` 환경변수로 로그 파일을 정하고(없으면 `default.log`), 입력받은 줄을 기록한다. `q`/`quit`으로 종료하고, 종료 시 `atexit`로 등록한 `clean_up()`에서 `Program terminated normally`를 쓰고 파일을 닫는다.

### 처음 겪은 segfault

```c
fd = open(buf, O_CREAT | O_EXCL, 0644);   // 접근 모드가 없어서 O_RDONLY(0)로 열림
fp = fdopen(fd, "w");                      // 읽기 전용 fd 에 "w" → 실패, NULL (errno = EINVAL)
...
fwrite(message, 1, strlen(message), fp);   // fp 가 NULL → segfault (core 파일 생성)
```

- `open`은 `O_RDONLY`, `O_WRONLY`, `O_RDWR` 중 하나가 반드시 필요하다. 없으면 읽기 전용으로 열린다.
- `fdopen`이 NULL을 돌려줬는데 검사하지 않아서 한참 뒤인 `fwrite`에서 터졌다.

### 고친 점

| 처음 코드 | 문제 | 고친 코드 |
|---|---|---|
| `O_CREAT \| O_EXCL` | 접근 모드 없음 → `fdopen` 실패, 파일이 있으면 `open` 실패 | `O_WRONLY \| O_CREAT \| O_APPEND` (다시 실행해도 이어 씀) |
| `fdopen` 반환값 미검사 | NULL로 `fwrite` → segfault | NULL이면 `perror`, **`close(fd)`**, 종료 |
| `strcmp(message, "quit")` | `fgets`는 개행을 포함해서 `"quit\n"`이라 영원히 불일치 | `message[strcspn(message, "\r\n")] = '\0'` |
| `fgets` 반환값 미검사 | Ctrl+D(EOF)에서 무한 루프 | `NULL`이면 `break` |
| 종료 시 `fclose` 없음 | 버퍼가 안 비워지고 종료 문구도 없음 | `atexit(clean_up)` + 전역(static) `g_fp`, `g_buf` |
| `LOG_PATH`가 없으면 즉시 종료 | 요구사항은 `default.log` | 없으면 `default.log` |
| 쓰이지 않는 `CLEANUP:` 라벨 | 경고 | 제거 |

```c
static FILE *g_fp  = NULL;
static char *g_buf = NULL;

static void clean_up(void){
	if(g_fp != NULL){
		fprintf(g_fp, "Program terminated normally\n");
		if(fclose(g_fp) != 0){ perror("fclose"); }   // 쓰기 오류는 fclose 에서 드러난다
		g_fp = NULL;
	}
	free(g_buf);
	g_buf = NULL;
}
```

> [!NOTE]
> `fwrite`를 `fprintf(fp, "%s\n", message)`로 바꿨다. 텍스트 한 줄에 개행을 붙여 쓰기엔 `fprintf`가 한 번에 끝난다. `fprintf(fp, message)`처럼 입력을 포맷 자리에 넣으면 사용자가 `%s`, `%n`을 입력했을 때 위험하니 반드시 `"%s\n"`로 쓴다. (바이트 덩어리를 그대로 쓸 때만 `fwrite`)

---

## 3. 실습 2 — PATH 탐색기 `env_ex2.c`

요구사항: `which`와 비슷하게 PATH의 디렉토리를 순서대로 검색해 실행 가능한 파일의 전체 경로를 출력한다. `-a`면 일치하는 모든 경로를 출력하고, 종료 코드는 찾음 0 / 못 찾음 1 / 인자 오류·PATH 없음 2다. **`getenv` 문자열 수정 금지**, 길이는 모두 동적 할당, **빈 항목은 현재 디렉토리**, `atexit` 핸들러로 해제와 "검색한 디렉토리 개수" 출력.

### 처음 코드의 문제

```c
char **path_list = NULL;
path_list[0] = strtok(path, ":");      // NULL[0] 에 쓰기 → segfault
```

| 처음 코드 | 문제 | 처방 |
|---|---|---|
| `path_list`를 NULL로 둔 채 사용 | 배열을 할당하지 않음 | 항목 수를 센 뒤 `malloc` |
| `getenv` 결과에 `strtok` | 원본 환경 문자열을 수정 (요구사항 위반) | `strdup` 복사본에서 쪼갬 |
| `strtok`로 `a::b` 분리 | **연속된 구분자를 건너뛰어 빈 항목이 사라짐** → `"."` 처리 불가 | `strchr`로 직접 쪼개거나 `strsep` |
| `:` 개수 `n`만큼만 `malloc` | 항목 수는 `n + 1`이라 마지막 항목 누락, `:`가 없으면 `malloc(0)`에 쓰기 | `n = ':' 개수 + 1` |
| 고정 10개 반복 | PATH 길이 가정 | 쪼갠 개수만큼 반복 |

### 고친 구조

```c
static char  *g_path_copy = NULL;   // strdup 한 PATH (원본은 읽기만)
static char **g_dirs      = NULL;   // g_path_copy 안을 가리키는 포인터 배열
static size_t g_searched  = 0;      // 실제로 검색한 디렉토리 개수

// ':' 마다 '\0'으로 끊고, 빈 항목은 "." 로
g_dirs[i] = (*p == '\0') ? "." : p;
```

- `g_dirs`는 문자열이 아니라 **포인터 n개**를 담는 배열이다 (`malloc(sizeof(*g_dirs) * n)`). 디렉토리 이름은 `g_path_copy` 안에 그대로 있고 `g_dirs[i]`가 거기를 가리킨다. 해제는 `free(g_dirs)`, `free(g_path_copy)` 두 번이면 끝난다.
- 경로는 `dir + '/' + command + '\0'`만큼 길이를 계산해서 `malloc`한다.
- `access(full, X_OK)`만으로는 **디렉토리도 통과**하므로 `stat` + `S_ISREG`로 일반 파일인지 확인한다.
- 핸들러는 `atexit(free_all)` → `atexit(report_searched)` 순으로 등록한다. 실행은 반대라서 **개수 출력 후 해제**가 된다.
- 인자는 `cmd -a`, `-a cmd` 모두 받는다. 오류는 종료 코드 2.

### 확인 결과

| 실행 | 결과 | 종료 코드 |
|---|---|---|
| `ls` | `/usr/bin/ls` (4개 검색) | 0 |
| `-a ls` | `/usr/bin/ls`, `/bin/ls` (6개) | 0 |
| 없는 명령어 | 출력 없음 | 1 |
| 인자 없음 / 모르는 옵션 / 명령어 2개 | usage | 2 |
| `PATH` 없음 | `PATH is not set` | 2 |
| `PATH="/nonexistent::/usr/bin:"` | 빈 항목 2개가 `.`로 처리되어 `./env_ex2`가 두 번 | 0 |

> [!WARNING]
> `exit` 핸들러는 `return`/`exit`로 끝날 때만 실행된다. 어떤 경로로 종료돼도 실행하라는 요구사항을 지키려면 `_Exit()`, `abort()`를 쓰지 않는다.

---

## 4. 시그널 — 12-01 ~ 12-04

### 시점에 따라 무시된다 (12-01)

```c
void handler(int signum) {
	if (signum == SIGUSR1) { sig1 = 1; }
	else if (sig1)         { sig2 = 1; }       // SIGUSR1 이 먼저 처리돼 있어야만 SIGUSR2 를 인정
}
```

- 의도는 `SIGUSR1 → SIGUSR2` 순서인데, 핸들러 실행 중에 같은 종류가 또 오거나 두 시그널이 가깝게 오면 일부가 사라진다. (같은 번호의 시그널은 대기 중이면 **한 번으로 합쳐진다**.)
- `sigaction`으로 핸들러를 설치하고, `sa_mask`와 `sigprocmask`로 처리 중에 끼어들 시그널을 막는다.

### signal()의 이식성 (12-02)

- UNIX 계열은 한 번 등록하면 계속 유지되지만, 일부 구현(Windows 등)은 한 번 처리한 뒤 **기본 동작으로 되돌아간다**. 같은 코드가 환경에 따라 다르게 동작하므로 이식성이 낮다. `sigaction`은 동작이 정의돼 있다.
- 강의 코드는 main 루프에서 `raise(SIGUSR1)`로 자기 자신에게 시그널을 보내 핸들러가 몇 번 호출되는지 확인한다. 핸들러가 계속 등록돼 있다는 가정이 성립해야 동작하는 코드다.

### 핸들러 안에서 하면 안 되는 것 (12-03, 12-04)

```c
void handler(int signum) {
	log_message();      // fputs(info, stderr) → stdio 락을 쓴다
	free(info);         // main 이 같은 포인터를 쓰는 도중에 해제될 수 있다
	info = NULL;
}
```

- 핸들러는 프로그램의 어느 지점에서나 끼어든다. main이 `fputs`나 `malloc` 안에서 락을 잡고 있을 때 핸들러가 같은 락이 필요한 함수를 부르면 **교착(deadlock)**이 난다.
- `printf`, `fputs`, `malloc`, `free`, `strcpy` 같은 함수는 **async-signal-safe가 아니다**. 핸들러는 `volatile sig_atomic_t` flag만 세우고, 실제 처리는 main 루프에서 한다.
- 12-04처럼 핸들러가 전역 버퍼에 `strcpy`하면, `free` 이후에 시그널이 오는 경우 **해제된 메모리에 쓴다**. main이 `strcpy`하는 도중에 오면 두 쓰기가 섞인다.

```c
static volatile sig_atomic_t g_stop = 0;
static void stop_hdlr(int signo){ (void)signo; g_stop = 1; }   // 이게 전부
```

---

## 5. 실습 3 — 1초 카운터 `sig_ex.c`

요구사항: 무한 루프에서 count를 올리고 1초 뒤 파일에 저장한다. `SIGINT`는 무시(메시지만), `SIGTERM`에만 종료한다.

### v1의 문제

| 처음 코드 | 문제 | 처방 |
|---|---|---|
| `while(g_stop_sig){ count++; }` | 1초 대기 없이 도는 busy loop (CPU 100%), 초당 수억 번 증가 | 1초 대기 후 증가 |
| `int count` | busy loop에서는 금방 signed 오버플로(미정의 동작) | `unsigned long` |
| 종료할 때만 파일에 씀 | `SIGKILL`·크래시 시 값이 사라짐 | 1초마다 저장 |
| `if(fd == 0)` | `open` 실패는 `-1`. 실패를 못 잡고 `fdopen(-1)`이 실패 (`O_EXCL`로 파일이 이미 있으면) | `if(fd < 0)` + `perror` |
| 핸들러 안 `printf` | async-signal-safe 아님 | `write(STDOUT_FILENO, ...)` |
| `signal()` | 이식성 | `sigaction` |
| `fdopen` 실패 시 `close(fd)` 없음 | fd 누수 | `close(fd)` |

> [!NOTE]
> 파일이 있으면 새로 만들고 싶을 때는 `O_TRUNC`를 쓴다 (`O_WRONLY | O_CREAT | O_TRUNC`, `fopen`의 `"w"`와 같다). `O_EXCL`은 반대로 **있으면 실패**한다. 단, `O_TRUNC`는 기존 내용을 바로 지우므로 중요한 파일은 임시 파일 + `rename`이 안전하다.

### v2의 핵심 — sleep이 시그널에 깨어나는 문제

`sleep`/`nanosleep`은 시그널이 오면 **일찍 깨어난다**. `SIGINT`를 무시하고 싶어도 대기가 1초보다 짧아지면 카운터가 빨라진다. `nanosleep`이 돌려주는 **남은 시간**으로 다시 자면 된다.

```c
static int wait_one_sec(void){
	struct timespec req = { 1, 0 }, rem = { 0, 0 };
	while(nanosleep(&req, &rem) != 0){
		if(errno != EINTR) return -1;
		if(g_stop) return 0;           // SIGTERM 이면 대기를 중단
		req = rem;                     // SIGINT 등은 남은 시간만큼 다시 대기
	}
	return 0;
}
```

- `sigaction`은 `SA_RESTART`를 쓰지 않아서 대기가 시그널에 깨어나고, 핸들러는 flag만 세운다.
- 쓰기는 `fseek(fp, 0, SEEK_SET)` → `fprintf` → `fflush`로 같은 파일에 **최신 값을 덮어쓴다** (값이 커지기만 해서 자릿수가 줄지 않으므로 truncate가 필요 없다).
- 종료 시 `fclose` 반환값까지 확인한다.

확인: `SIGINT`를 두 번 보내도 프로세스는 살아 있고 대기 시간이 줄지 않았다 (5.3초 시점에 `count.txt`가 5). `SIGTERM`은 마지막 값을 저장하고 종료 코드 0으로 끝났다.

---

## 6. 실습 4 — 시그널로 운영되는 카운터 `sig_ex2.c`

요구사항: 1초마다 카운터를 `interval`씩 증가. `SIGHUP`은 설정파일(`12-07.conf`)에서 interval을 다시 읽고, `SIGUSR1`은 카운터·interval·시그널별 처리 횟수를 출력, `SIGUSR2`는 카운터를 0으로, `SIGTERM`은 최종값을 출력하고 종료, `SIGINT`는 무시한다.
**주의:** `sigaction`과 시그널 마스크 사용, 핸들러는 flag만, sleep 중 시그널이 오면 **바로 처리하되 카운터는 1초에 한 번만**, 설정파일이 없거나 값이 잘못되면 **에러 메시지를 출력하고 기존 interval 유지**.

### 첫 구현의 문제

| 처음 코드 | 문제 | 처방 |
|---|---|---|
| `char *g_buffer[MAX_SIZE]` | 문자 버퍼가 아니라 **포인터 배열** → `fgets`, `atoi`에 incompatible pointer | `char g_buffer[MAX_SIZE]` |
| 시작할 때 `open("12-07.conf", O_WRONLY\|O_CREAT\|O_TRUNC)` | **설정파일을 빈 파일로 만들어 버림**. 쓰기 전용 fd에 `fdopen(fd, "r")`도 항상 실패 | SIGHUP이 올 때마다 `fopen(path, "r")`로 읽기 |
| 파일을 열어 둔 채 `fgets` 1회 | 두 번째 HUP부터 EOF | 매번 새로 열고 닫음 |
| `if / else if` 사슬 | 동시에 온 시그널은 한 번에 하나만 처리 | 각각 독립된 `if`, flag는 **처리 직전에 먼저 0으로** |
| `while(!s_TERM_f)` 안의 `else if(s_TERM_f)` | 도달할 수 없는 코드 → 종료 시 최종값 출력 안 됨 | 루프 밖에서 `final counter` 출력 |
| `atoi(g_buffer)` | `abc`는 0, 0이나 음수 interval이면 카운터 정지 | `strtol` + 끝 문자 + `val > 0` 검증, 실패 시 **기존 값 유지** |
| 핸들러 인자 `signo` 미사용 | `-Wextra` 경고 | `(void)signo;` |
| `close`, `sleep` 선언 없음 | `unistd.h` 누락 | `#include <unistd.h>` |

```c
// 설정 읽기: 실패하면 -1, 호출한 쪽이 기존 interval 을 유지
val = strtol(g_buffer, &end, 10);
if(end == g_buffer || (*end != '\n' && *end != '\0') || errno == ERANGE || val <= 0 || val > INT_MAX){
	fprintf(stderr, "%s: invalid interval\n", path);
	return -1;
}
```

### v2 — 마스크와 pselect로 "즉시 반응, 증가는 1초에 한 번"

문제: `sleep(1)`을 쓰면 시그널이 깨우는 순간 곧바로 `current_cnt += interval`이 실행되어 **시그널마다 카운터가 올라간다**. 또 flag를 확인한 뒤 `sleep`에 들어가기 **직전에** 온 시그널은 1초 뒤에야 처리된다.

해결: 다섯 시그널을 `sigprocmask`로 **평소에는 막아 두고**, 대기하는 동안에만 `pselect`로 푼다. `pselect`는 "마스크 해제 + 대기 시작"을 한 번에 하므로 그 사이에 오는 시그널을 놓치지 않는다. 다음 증가 시각은 `CLOCK_MONOTONIC` 절대 시각(`next`)으로 관리한다.

```c
sigprocmask(SIG_BLOCK, &block_mask, &orig_mask);     // 평소엔 시그널 block

while(1){
	/* flag 처리 (block 구간이라 안전하게 읽고 지울 수 있다) */
	...
	if(s_TERM_f){ tCnt++; break; }

	rc = wait_until(&next, &orig_mask);   // pselect(…, &remain, orig_mask)
	if(rc == 1){                          // 시각에 도달했을 때만 증가
		current_cnt += interval;
		next.tv_sec += 1;
	}
	// rc == 0 이면 시그널로 깨어남: next 는 그대로, flag 만 처리하고 남은 시간만 다시 대기
}
```

| 시험 | 결과 |
|---|---|
| `USR1`을 0.05초 간격으로 5번 | 지연 없이 즉시 출력, current는 0 유지 |
| 약 1.9초 시점의 `USR1` | current 1 (틱 1번 경과) |
| `INT` 10번 | `skip` 10번, 이후 카운터는 정상 (빨라지지 않음) |
| `HUP(5)`·`USR2`·`USR1` 동시 | 모두 처리, 이후 틱마다 +5 |
| `SIGTERM` | 약 14ms 만에 종료, `final counter` 출력 |

> [!NOTE]
> 한꺼번에 온 시그널은 **코드에 쓴 `if` 순서**대로 처리된다 (HUP → USR1 → USR2 → INT). 그래서 USR2와 USR1이 같이 오면 USR1은 리셋 전 값을 출력한다.

---

## ✅ 정리 — 환경변수·시그널 점검 체크리스트

- [ ] 환경변수는 외부 값으로 보고 `NULL`·길이를 검사한 뒤 쓰는가 (`getenv` → 복사)
- [ ] `getenv` 반환 문자열을 직접 수정하지 않는가 (`strdup` 복사본에서 수정)
- [ ] `strtok`을 빈 항목이 의미 있는 문자열에 쓰지 않았는가 (`a::b` → `strchr`/`strsep`)
- [ ] 항목 수 = 구분자 수 **+ 1**로 계산했는가
- [ ] `open`에 접근 모드(`O_RDONLY`/`O_WRONLY`/`O_RDWR`)를 줬고 `open`은 `< 0`, `fdopen`은 `NULL`을 검사했는가
- [ ] `fgets` 뒤에 개행을 제거했고, 반환값 `NULL`(EOF)로 루프를 끝내는가
- [ ] `atexit` 핸들러가 필요한 전역을 참조하고, 종료를 `return`/`exit`로 하는가 (`_Exit`, `abort`는 핸들러 미실행)
- [ ] `signal()` 대신 `sigaction`을 쓰는가
- [ ] 핸들러는 `volatile sig_atomic_t` flag만 세우는가 (`printf`·`malloc`·`free` 금지)
- [ ] 시그널 flag를 `if` 각각으로 처리하고, 처리 직전에 지우는가
- [ ] `sleep` 중 시그널로 깨어나는 경우를 고려했는가 (`nanosleep` 남은 시간, 절대 시각 + `pselect`)
- [ ] 평소에는 시그널을 막고 대기 구간에서만 푸는가 (`sigprocmask` + `pselect`)
- [ ] 설정 값은 `strtol`로 검증하고, 실패하면 에러를 출력하되 기존 값을 유지하는가

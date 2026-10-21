---
title: "D7. 데몬 — 시그널·poll·워커큐·graceful shutdown"
description: "시그널, poll, 워커 큐, graceful shutdown을 갖춘 데몬을 만드는 D7 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D7. 데몬 — 시그널 · poll · 워커큐 · graceful shutdown

> **쓰는 템플릿**: [4. 데몬 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%204.%20데몬%20골격%20—%20순수%20POSIX%20main%20초기화·시그널·스레드·폴링루프.md)
>
> **목표 시간**: 1회차 100분 / 2회차 60분 / **3회차 40분**
>
> **D3(자원) 을 통과한 다음에.**
> 데몬은 "자원 잡는 함수"가 프로세스 크기로 커진 것뿐이다.

> [!NOTE] 이 드릴의 문서 구성 (D0~D9 공통)
> ① **요구사항서** — 무엇을 만드나, 표로 확정한다.
> ② **pseudo code 템플릿** — 보고 치는 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 이게 통과하면 끝이다.
> ④ 자주 하는 실수
> ⑤ 모범답안 — 맨 뒤에 접어 둔다.
>
> D7 의 테스트는 **두 층**이다.
> 큐는 **C 단위 시험**(`test_jobq.c`), 데몬 전체는 **셸 시나리오 시험**(`run.sh`)이다.
> 변형 A/B/C 는 같은 모양을 다른 소재로 다시 치는 것이고, 각 변형마다 ①②③이 준비되어 있다.

---

## 0. 이 드릴로 체화할 것

| 반사 | 규칙 |
| :--- | :--- |
| 시그널 핸들러 | **깃발만 든다.** `volatile sig_atomic_t g_running = 0;` 대입 하나가 전부 |
| 시그널 등록 | `signal()` 금지, **`sigaction()`** 사용 |
| `SA_RESTART` | **끈다.** `poll` 이 `EINTR` 로 깨어나야 종료 깃발을 본다 |
| `main` cleanup | **계단식 라벨**(`ERR_THREAD:` → `ERR_SOCK:` → `ERR_CFG:`), 잡은 역순 |
| 종료 | 큐를 **비우고** 워커를 `join` 한 뒤 자원 해제. 타임아웃 상한을 둔다 |
| `SIGPIPE` | **무시(`SIG_IGN`)**. 안 하면 상대가 끊는 순간 프로세스가 죽는다 |

> [!DANGER] 핸들러 안에서 `printf` / `malloc` / 락 금지
> 비동기 시그널 안전(async-signal-safe) 함수가 아니면 **교착이나 힙 손상**이 난다.
> 안전한 건 사실상 `write()`, `_exit()`, 그리고 `volatile sig_atomic_t` 대입뿐이라고 생각하면 된다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** UDP 메시지 데몬 | ① 요구사항서<br>② pseudo code **전체** | 1. 큐를 먼저 만들고 `test_jobq` 를 통과시킨다.<br>2. 데몬을 만들고 `run.sh` 시나리오를 통과시킨다. |
| **2회차** | **B** TCP 데몬 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. 번호만 보고 쓴다.<br>2. `run.sh B` 를 통과시킨다. |
| **3회차** | **C** 타임아웃 감시 추가 | ① 요구사항서만 | 1. 시나리오를 **먼저 읽는다.**<br>2. 백지에서 친다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — UDP 메시지 데몬

> [!QUOTE] 요구사항서 (발췌)
> D4 의 메시지 포맷을 받아 처리하는 상주 프로세스를 만든다.
> - 기동 시 설정 파일(D3 의 `cfg_t`)에서 `listen_port`, `worker_num`(1~64), `log_level` 을 읽는다.
> - UDP 소켓 하나를 열고 `poll()` 로 수신을 기다린다.
>   **바쁜 대기(busy loop) 금지.**
> - 수신 메시지를 `msg_unpack()` 으로 파싱해 **워커 큐**에 넣는다.
>   파싱 실패는 **폐기 + WRN**, 프로세스는 계속 산다.
> - 워커 N개가 큐에서 꺼내 처리하고 응답을 송신한다.
> - `SIGINT` / `SIGTERM`: **graceful shutdown** — 새 수신을 멈추고, **큐에 남은 것까지 처리**한 뒤 종료.
>   단 **최대 5초**.
> - `SIGHUP`: 설정 **재적재**(로그 레벨만 반영, 포트 변경은 무시).
> - 종료 코드: 정상 0, 설정 오류 1, 소켓 오류 2, 스레드 오류 3.
> - 어떤 경로로 종료하든 **누수 0**.

### 미션

1. `main()` 을 **계단식 라벨**로 작성 (초기화 역순 해제).
2. `sigaction` 으로 `SIGINT`/`SIGTERM`/`SIGHUP` 등록 + `SIGPIPE` 무시.
3. 스레드 안전 큐 (`pthread_mutex_t` + `pthread_cond_t`), **종료 시 `broadcast`**.
4. `poll()` 타임아웃 200ms — 소켓에 아무것도 안 와도 **종료 깃발을 확인**할 수 있게.
5. 종료 대기에 **상한 5초** (`clock_gettime` + `pthread_cond_timedwait`).

**설정 파일 (D3 의 `cfg_t`)**

| 키 | 범위 | 비고 |
| :--- | :--- | :--- |
| `listen_port` | 1 ~ 65535 | |
| `worker_num` | 1 ~ 64 | |
| `log_level` | `ERR` / `WRN` / `INF` / `DBG` | `SIGHUP` 으로 **재적재** 대상 |

**로그 계약 — 시험이 이 문자열을 `grep` 한다**

| 시점 | 레벨 | 형식 |
| :--- | :--- | :--- |
| 기동 완료 | INF | `started: port=<n> worker=<n>` |
| 파싱 성공 후 **큐에 넣었을 때** | INF | `recv session=<id>` |
| 워커가 **처리를 끝냈을 때** | INF | `done session=<id>` |
| 파싱 실패로 폐기 | WRN | `drop: <사유>` |
| 설정 재적재 | INF | `config reloaded` |
| 종료 시작 | INF | `shutting down...` |

**종료 코드**

| 코드 | 의미 |
| :--- | :--- |
| 0 | 정상 종료 |
| 1 | 설정 오류 (파일 없음 포함) — **소켓·스레드를 만들기 전에** 종료 |
| 2 | 소켓 오류 (포트 사용 중 등) — **스레드를 만들기 전에** 종료 |
| 3 | 스레드·큐 오류 |

**작업 큐 `jobq_t` (D7 의 핵심 부품)**

| 함수 | 요구사항 |
| :--- | :--- |
| `int jobq_create(size_t cap, jobq_t **out)` | `cap == 0` 또는 `out` NULL → `RET_INVALID_ARG`.<br>**실패하면 `*out = NULL`.** |
| `int jobq_push(jobq_t *q, const job_t *job)` | 닫힌 큐 → `RET_NOT_SUPPORTED`, **가득 참 → `RET_TOO_SMALL`** (버린다, 막지 않는다) |
| `int jobq_pop(jobq_t *q, job_t *out)` | 비어 있으면 **대기**한다 (`cond_wait` + `while`).<br>**닫혔고 비었으면 `RET_NOT_FOUND`.**<br>닫혔어도 **남은 것은 꺼낼 수 있다** (drain). |
| `void jobq_close(jobq_t *q)` | 더 이상 받지 않는다.<br>**대기 중인 스레드를 전부 깨운다** (`broadcast`).<br>NULL 안전. |
| `void jobq_destroy(jobq_t *q)` | NULL 안전. |

`job_t` 는 `uint32_t session_id`, `uint8_t type`, `uint16_t len`, `uint8_t data[1400]` 와 송신자 주소(`struct sockaddr_in from`)를 가진다.

**추가 규칙 (A)**

1. `main()` 은 초기화 단계마다 **계단식 라벨**을 하나씩 둔다 (`ERR_THREAD` → `ERR_QUEUE` → `ERR_SOCK` → `ERR_CFG`).
2. 스레드 인자는 **힙에 복사**해서 넘기고 스레드가 해제한다.
3. `pthread_create` 가 실패하면 **만든 것(`made`)만** 되돌린다.
4. 종료 대기에는 **상한 5초**를 둔다.
5. 파싱 실패는 **폐기 + WRN**, 프로세스는 계속 산다.

### 1-B. 변형 B — TCP 데몬

A 의 UDP 소켓 대신 **TCP `listen` / `accept`** 를 쓴다.
클라이언트마다 **상태**(수신 버퍼)가 있고, `poll` 배열을 **동적으로** 관리한다.

**규칙**

1. 연결 위에서 D4 메시지가 **스트림**으로 이어진다.
   수신 버퍼가 12바이트 이상 쌓이면 `PayloadLen` 으로 전체 길이(`12 + PayloadLen + 2`)를 구하고, 그만큼 모였을 때 `msg_unpack` 한다.
2. 한 번의 `recv` 에 **메시지가 반만** 와도, **두 개가 붙어서** 와도 정상 처리한다.
3. 클라이언트 상태 `conn_t` 는 `{ int fd; uint8_t buf[2048]; size_t len; }` 이다.
4. `poll` 배열은 **연결이 늘면 `realloc`, 끊기면 줄인다** (실패해도 원본을 잃지 않는다).
5. 동시 연결 상한은 **1024**.
   넘으면 `accept` 후 **즉시 `close` + WRN**.
6. 상대가 끊으면(`recv == 0`) 그 연결의 **상태를 해제하고 fd 를 닫는다.**
7. 파싱 실패(체크섬 등)는 **연결을 닫고 WRN `drop: <사유>`**, 프로세스는 산다.
8. 로그 계약·종료 코드·`jobq` 는 A 와 같다.
   `recv` / `done` 로그는 **메시지 하나당 한 줄**이다.

### 1-C. 변형 C — 타임아웃 감시 추가

A 에 **check-in / check-out 슬롯**과 **감시 스레드**를 더한다.
응답이 나가지 않은 요청을 **만료 처리**한다.

**설정 키 추가**: `expire_sec` (1 ~ 60, 기본 5)

**규칙**

1. 워커는 처리를 시작할 때 **check-in** (`session_id`, 만료 시각 = 지금 + `expire_sec`) 을 한다.
2. 처리를 끝내고 응답을 보내면 **check-out** 한다.
3. 감시 스레드는 **1초마다** (`pthread_cond_timedwait`) 슬롯을 훑어서, 만료 시각이 지난 슬롯을 **WRN `expired session=<id>`** 로 남기고 비운다.
4. `type == 9` 인 메시지는 **"무응답 요청"** 이다.
   워커는 **응답을 보내지 않고, `done` 로그도 남기지 않고, check-out 도 하지 않는다** (시험용으로 응답 없는 요청을 만든다).
5. 슬롯은 **1024개 고정 배열**이다.
   가득 차면 check-in 이 `RET_TOO_SMALL` 이고, 요청은 **처리하되 감시는 하지 않고** WRN 을 남긴다.
6. 종료 시 감시 스레드도 **깨워서 `join`** 한다.
   남은 슬롯은 버리고, 만료 로그는 필요 없다.
7. 슬롯 접근은 **하나의 뮤텍스**로 보호한다 (감시 스레드와 워커가 같은 락).
8. 로그 계약에 `expired session=<id>` (WRN) 가 추가된다.
   종료 코드와 `jobq` 는 A 와 같다.

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 `d7_daemon/src/*.h` / `*.c` 에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안의 해당 단계만 본다.

### 2-A. Level 1 (1회차, 전부 본다)

```c
/* jobq.h / jobq.c */
/* [ ] 1. job_t, jobq_t { buf, cap, head, tail, num, closed, lock, not_empty } */
/* [ ] 2. jobq_create(cap, out)
 *        가드 (cap == 0 → INVALID_ARG) / *out = NULL
 *        객체 → buf → mutex init → cond init  (실패하면 잡은 것만 역순)
 *        소유권 이전 */
/* [ ] 3. jobq_push
 *        lock → closed 면 NOT_SUPPORTED, 가득이면 TOO_SMALL
 *        아니면 buf[tail] = *job, tail = (tail + 1) % cap, num++, cond_signal
 *        unlock  (모든 경로에서 unlock 은 한 곳) */
/* [ ] 4. jobq_pop
 *        lock → while (num == 0 && !closed) cond_wait          ← while 로 감싼다
 *        num > 0 이면 꺼냄 (head 전진)
 *        아니면 (closed && empty) NOT_FOUND
 *        unlock */
/* [ ] 5. jobq_close: lock → closed = true → cond_broadcast → unlock   ← signal 이 아니다 */
/* [ ] 6. jobq_destroy: NULL 안전, cond / mutex destroy → buf → 객체 */

/* main.c */
/* [ ] 1. 전역 깃발: static volatile sig_atomic_t g_running = 1, g_reload = 0 */
/* [ ] 2. on_signal: SIGINT / SIGTERM → g_running = 0,  SIGHUP → g_reload = 1   (대입만) */
/* [ ] 3. signal_setup
 *        sigaction 으로 세 개 등록, sa_flags = 0 (SA_RESTART 끈다)
 *        SIGPIPE 는 SIG_IGN */
/* [ ] 4. main — 계단식 라벨
 *        변수: ret / exit_code / cfg / sock(-1) / q / tids / made / port / worker_num
 *        1단계 설정:  cfg_create 실패 → exit 1, goto OUT
 *                     signal_setup 실패 → exit 1, goto ERR_CFG
 *        2단계 소켓:  udp_open 실패 → exit 2, goto ERR_CFG
 *        3단계 큐:    jobq_create 실패 → exit 3, goto ERR_SOCK
 *        4단계 워커:  tids = calloc → 실패 exit 3, goto ERR_QUEUE
 *                     for i < worker_num: 인자를 힙에 만들고 pthread_create
 *                       실패하면 인자 free, exit 3, goto ERR_THREAD   (made 개수만 되돌린다)
 *                       made++
 *        "started: port=.. worker=.." 로그
 *        서비스 루프: while (g_running)
 *                       poll(..., 200ms)
 *                       n < 0 이면 EINTR 는 continue, 아니면 break
 *                       g_reload 면 로그 레벨만 재적재, "config reloaded"
 *                       n == 0 이면 continue (타임아웃)
 *                       POLLIN 이면 recv_one
 *        "shutting down..." 로그, exit_code = 0
 *        ERR_THREAD: jobq_close → made 개 join → tids free
 *        ERR_QUEUE : jobq_destroy
 *        ERR_SOCK  : SAFE_CLOSE(sock)
 *        ERR_CFG   : cfg_destroy
 *        OUT       : 로그, return exit_code */
/* [ ] 5. recv_one(sock, q)
 *        recvfrom → msg_unpack → 실패면 WRN "drop: ..." 후 return (죽지 않는다)
 *        job_t 를 채워 jobq_push → TOO_SMALL 이면 WRN (버린다)
 *        성공하면 INF "recv session=<id>" */
/* [ ] 6. worker_main(arg)
 *        인자를 지역으로 옮기고 free(arg)
 *        while (jobq_pop(q, &job) == RET_OK)
 *            처리 → 응답 송신 → INF "done session=<id>"
 *        return NULL */
/* [ ] 7. 종료 대기에 5초 상한 (wait_workers: clock_gettime + pthread_cond_timedwait) */
```

### 2-B. Level 2 (2회차, 번호와 제목만 본다)

```c
/* main.c / net.c (TCP) */
/* [ ] 1. tcp_listen(port, &sock)             — SO_REUSEADDR, non-blocking */
/* [ ] 2. conn_t 와 conn 테이블 / pollfd 배열 (동적, 상한 1024) */
/* [ ] 3. accept 처리: 가득이면 즉시 close + WRN, 아니면 배열에 추가 (realloc 은 tmp) */
/* [ ] 4. conn_readable: recv → 버퍼에 이어 붙임 → 12바이트 이상이면 전체 길이 계산 → 모였으면 msg_unpack → push → 버퍼 앞으로 당김 (반복) */
/* [ ] 5. 끊김 / 오류 처리: 상태 해제, fd close, 배열에서 제거 */
/* [ ] 6. 종료: 모든 연결 close, 나머지는 A 와 같다 */
```

### 2-C. Level 3 (3회차, 백지)

```c
/* 아무것도 안 본다.
 * §1-C 요구사항서와 §3 시나리오만 보고 만든다.
 *
 * 막히면 세 가지만 찾아본다.
 *   - 슬롯 테이블을 한 뮤텍스로 보호하는 법
 *   - pthread_cond_timedwait 로 "1초마다 깨기 + 종료 때 즉시 깨기" 를 함께 하는 법
 *   - 감시 스레드를 join 한 뒤에 슬롯 테이블을 해제하는 순서 */
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 로 SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 데몬이 멈추면 `gdb -p <pid>` → `thread apply all bt` 로 **어느 스레드가 어디서 기다리는지** 본다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
d7_daemon/src/jobq.h  jobq.c            작업 큐 (변형 A, B, C 공통)
d7_daemon/src/main.c  net.c  ...        데몬
d7_daemon/test/test_jobq.c              큐 단위 시험 (C)
d7_daemon/test/run.sh                   데몬 시나리오 시험 (셸)
```

> [!IMPORTANT] 시험의 형태 (D1~D9 공통)
> **정상** 한 가지, **경계** 여러 가지, **NULL / 실패** 경로를 확인한다.
> D7 에서는 **큐는 C 단위 시험**으로, **데몬은 시나리오**로 나누어 확인한다.
>
> 큐가 틀린 채로 데몬 시나리오를 돌리면 어디가 틀렸는지 알 수 없다.
> **`test_jobq` 가 PASS 가 된 뒤에** `run.sh` 를 돌린다.

### 3-0. 공통 매크로

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "common.h"
#include "log.h"

log_level_t g_log_level = LOG_LV_ERR;

static int g_fail = 0;

#define T_EQ_INT(_got, _exp)                                            \
    do {                                                                \
        long long _g = (long long)(_got), _e = (long long)(_exp);       \
        if (_g != _e) { g_fail++;                                       \
            printf("  X %s:%d  got=%lld exp=%lld\n",                    \
                   __func__, __LINE__, _g, _e); }                       \
    } while (0)
```

### 3-A. 큐 단위 시험 — `test_jobq.c`

```c
#include <pthread.h>
#include <sched.h>
#include <stdatomic.h>
#include <time.h>
#include "jobq.h"

static void nap_ms(long ms)
{
    struct timespec ts = { ms / 1000, (ms % 1000) * 1000000L };
    nanosleep(&ts, NULL);
}

static void test_fifo(void)
{
    jobq_t *q = NULL;
    job_t   j;
    int     i = 0;

    T_EQ_INT(jobq_create(4, &q), RET_OK);
    for (i = 0; i < 4; i++) {
        memset(&j, 0x00, sizeof(j));  j.session_id = (uint32_t)i;
        T_EQ_INT(jobq_push(q, &j), RET_OK);
    }
    memset(&j, 0x00, sizeof(j));  j.session_id = 99;
    T_EQ_INT(jobq_push(q, &j), RET_TOO_SMALL);            /* 가득 참: 한 칸 넘김 */

    for (i = 0; i < 4; i++) {
        T_EQ_INT(jobq_pop(q, &j), RET_OK);
        T_EQ_INT(j.session_id, i);                        /* 먼저 넣은 것이 먼저 나온다 */
    }

    jobq_close(q);
    T_EQ_INT(jobq_push(q, &j), RET_NOT_SUPPORTED);        /* 닫힌 큐 */
    T_EQ_INT(jobq_pop(q, &j), RET_NOT_FOUND);             /* 닫혔고 비었다 */
    jobq_destroy(q);
}

static void test_drain_and_wrap(void)
{
    jobq_t *q = NULL;
    job_t   j;
    int     round = 0, i = 0;

    T_EQ_INT(jobq_create(3, &q), RET_OK);
    for (round = 0; round < 100; round++) {               /* head / tail 가 몇 바퀴 돈다 */
        for (i = 0; i < 3; i++) {
            memset(&j, 0x00, sizeof(j));  j.session_id = (uint32_t)(round * 3 + i);
            T_EQ_INT(jobq_push(q, &j), RET_OK);
        }
        for (i = 0; i < 3; i++) {
            T_EQ_INT(jobq_pop(q, &j), RET_OK);
            T_EQ_INT(j.session_id, round * 3 + i);
        }
    }

    for (i = 0; i < 3; i++) { j.session_id = (uint32_t)i; jobq_push(q, &j); }
    jobq_close(q);
    for (i = 0; i < 3; i++) T_EQ_INT(jobq_pop(q, &j), RET_OK);   /* ★ 닫혀도 남은 건 꺼낸다 */
    T_EQ_INT(jobq_pop(q, &j), RET_NOT_FOUND);
    jobq_destroy(q);
}

static void test_null(void)
{
    jobq_t *q = NULL;
    job_t   j;

    memset(&j, 0x00, sizeof(j));
    T_EQ_INT(jobq_create(0, &q), RET_INVALID_ARG);
    T_EQ_INT(q == NULL, 1);                               /* ★ 실패하면 NULL */
    T_EQ_INT(jobq_create(4, NULL), RET_INVALID_ARG);
    T_EQ_INT(jobq_push(NULL, &j), RET_INVALID_ARG);
    T_EQ_INT(jobq_pop(NULL, &j), RET_INVALID_ARG);
    jobq_close(NULL);                                     /* 죽지 않으면 통과 */
    jobq_destroy(NULL);
}

/* ── 스레드 시험 ─────────────────────────────────────────────────── */
static atomic_long g_sum;
static atomic_int  g_exited;

static void *consumer(void *arg)
{
    jobq_t *q = (jobq_t *)arg;
    job_t   j;

    while (jobq_pop(q, &j) == RET_OK) atomic_fetch_add(&g_sum, (long)j.session_id);
    atomic_fetch_add(&g_exited, 1);
    return NULL;
}

static void *producer(void *arg)
{
    jobq_t *q = (jobq_t *)arg;
    job_t   j;
    int     i = 0;

    memset(&j, 0x00, sizeof(j));
    for (i = 1; i <= 5000; i++) {
        j.session_id = (uint32_t)i;
        while (jobq_push(q, &j) == RET_TOO_SMALL) sched_yield();   /* 가득 차면 잠깐 양보 */
    }
    return NULL;
}

static void test_threads(void)
{
    jobq_t   *q = NULL;
    pthread_t c[4], p[2];
    int       i = 0;

    atomic_store(&g_sum, 0);
    T_EQ_INT(jobq_create(16, &q), RET_OK);
    for (i = 0; i < 4; i++) pthread_create(&c[i], NULL, consumer, q);
    for (i = 0; i < 2; i++) pthread_create(&p[i], NULL, producer, q);
    for (i = 0; i < 2; i++) pthread_join(p[i], NULL);
    jobq_close(q);                                        /* 생산이 끝난 뒤에 닫는다 */
    for (i = 0; i < 4; i++) pthread_join(c[i], NULL);
    T_EQ_INT(atomic_load(&g_sum), 2L * (5000L * 5001L / 2L));   /* ★ 유실도 중복도 없다 */
    jobq_destroy(q);
}

static void test_close_wakes_all(void)
{
    jobq_t   *q = NULL;
    pthread_t c[4];
    int       i = 0, waited = 0;

    atomic_store(&g_exited, 0);
    T_EQ_INT(jobq_create(4, &q), RET_OK);
    for (i = 0; i < 4; i++) pthread_create(&c[i], NULL, consumer, q);   /* 전부 빈 큐에서 대기 */
    nap_ms(100);
    T_EQ_INT(atomic_load(&g_exited), 0);

    jobq_close(q);
    for (waited = 0; waited < 2000 && atomic_load(&g_exited) < 4; waited += 10) nap_ms(10);
    T_EQ_INT(atomic_load(&g_exited), 4);                  /* ★ broadcast 가 아니면 1개만 깬다 */
    if (atomic_load(&g_exited) < 4) { printf("  X hang: skip join\n"); g_fail++; return; }

    for (i = 0; i < 4; i++) pthread_join(c[i], NULL);
    jobq_destroy(q);
}

int main(void)
{
    test_fifo();
    test_drain_and_wrap();
    test_null();
    test_threads();
    test_close_wakes_all();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B. 데몬 시나리오 시험 — `run.sh`

시나리오는 **같은 스크립트**가 변형별로 다르게 돌린다 (`A` / `B` / `C`).
메시지는 D4 의 **기대 바이트 벡터**를 그대로 쓴다.

| 이름 | 바이트 | 뜻 |
| :--- | :--- | :--- |
| `VALID` | `22 85 00 00 01 02 03 04 0A 0B 0C 90 C2 D9` | `type=2`, `session=0x01020304`, 정상 |
| `NOREPLY` | `29 00 00 00 01 02 03 04 0A 0B 0C 00 BC EE` | `type=9` (변형 C 의 무응답 요청) |

```bash
#!/usr/bin/env bash
# d7_daemon/test/run.sh — 데몬 시나리오 시험
# 사용법:  bash d7_daemon/test/run.sh <데몬 실행파일> [A|B|C]
#   예)    bash d7_daemon/test/run.sh build/d7_daemon_daemon A
# 필요한 것: bash (/dev/udp, /dev/tcp), python3 (포트를 미리 잡아 두는 용도)

BIN="$1"; VAR="${2:-A}"
PORT="${PORT:-19000}"
W="$(mktemp -d)"
trap 'kill $(jobs -p) 2>/dev/null; rm -rf "$W"' EXIT

VALID='\x22\x85\x00\x00\x01\x02\x03\x04\x0a\x0b\x0c\x90\xc2\xd9'
NOREPLY='\x29\x00\x00\x00\x01\x02\x03\x04\x0a\x0b\x0c\x00\xbc\xee'

pass=0; fail=0
check() { local m="$1"; shift; if "$@"; then echo "  ok  $m"; pass=$((pass+1)); else echo "  X   $m"; fail=$((fail+1)); fi; }
eq()    { [ "$1" = "$2" ]; }
count() { grep -c "$1" "$W/log" || true; }
no_asan() { ! grep -qE 'AddressSanitizer|LeakSanitizer|runtime error' "$W/log"; }

mkcfg() {   # mkcfg <worker> <log_level> [expire_sec]
    printf 'listen_port=%s\nworker_num=%s\nlog_level=%s\nexpire_sec=%s\n' \
           "$PORT" "${1:-4}" "${2:-INF}" "${3:-5}" > "$W/d.cfg"
}
send() {    # send <printf 형식>   : A 는 UDP, B 는 TCP 한 번 연결
    if [ "$VAR" = B ]; then
        { exec 3<>/dev/tcp/127.0.0.1/$PORT; printf "$1" >&3; exec 3>&-; } 2>/dev/null
    else
        printf "$1" > /dev/udp/127.0.0.1/$PORT 2>/dev/null
    fi
}
start() { "$BIN" "$W/d.cfg" 2> "$W/log" & PID=$!; sleep 0.5; }
wait_exit() {   # wait_exit <최대 초>  → RC (종료 코드, 못 끝나면 "timeout")
    local i
    for ((i = 0; i < $1 * 10; i++)); do kill -0 $PID 2>/dev/null || break; sleep 0.1; done
    if kill -0 $PID 2>/dev/null; then RC=timeout; kill -9 $PID; wait $PID 2>/dev/null
    else wait $PID; RC=$?; fi
}
occupy() {      # 같은 포트를 미리 잡아 둔다
    local kind=DGRAM; [ "$VAR" = B ] && kind=STREAM
    python3 -c "import socket,sys,time; s=socket.socket(socket.AF_INET, socket.SOCK_$kind); s.bind(('127.0.0.1', int(sys.argv[1]))); [s.listen(1) for _ in [0] if '$kind' == 'STREAM']; time.sleep(30)" "$PORT" &
    BLOCK=$!; sleep 0.5
}

echo "[$VAR] 1. 정상 기동 → SIGINT"
mkcfg; start; t0=$SECONDS; kill -INT $PID; wait_exit 5
check "exit 0" eq "$RC" 0
check "5초 이내" test $((SECONDS - t0)) -le 5
check "ASan 리포트 없음" no_asan

echo "[$VAR] 2. 설정 파일 없이 기동"
"$BIN" "$W/none.cfg" 2> "$W/log" & PID=$!; wait_exit 3
check "exit 1" eq "$RC" 1
check "스레드를 만들기 전에 종료 (started 없음)" eq "$(count 'started:')" 0
check "ASan 리포트 없음" no_asan

echo "[$VAR] 3. 이미 쓰는 포트로 기동"
occupy; mkcfg; "$BIN" "$W/d.cfg" 2> "$W/log" & PID=$!; wait_exit 3
check "exit 2" eq "$RC" 2
check "스레드를 만들기 전에 종료 (started 없음)" eq "$(count 'started:')" 0
check "ASan 리포트 없음" no_asan
kill $BLOCK 2>/dev/null; wait $BLOCK 2>/dev/null

echo "[$VAR] 4. 부하 중 SIGTERM"
mkcfg; start
( for i in $(seq 1 2000); do send "$VALID"; done ) & LOAD=$!
sleep 0.5; kill -TERM $PID; wait_exit 5; wait $LOAD 2>/dev/null
R=$(count 'recv session'); D=$(count 'done session')
check "exit 0" eq "$RC" 0
check "처리한 것이 1건 이상" test "$R" -ge 1
check "recv == done (큐에 남은 것까지 처리, 유실 0): $R / $D" eq "$R" "$D"
check "ASan 리포트 없음" no_asan

echo "[$VAR] 5. 쓰레기 패킷 100개"
mkcfg; start
for i in $(seq 1 100); do send "$(head -c 20 /dev/urandom | od -An -v -tx1 | sed 's/ /\\x/g' | tr -d '\n')"; done
sleep 0.5
check "프로세스 생존" kill -0 $PID
check "WRN 로그가 남음" test "$(count 'WRN')" -ge 1
send "$VALID"; sleep 0.5
check "이후 정상 메시지는 처리됨" test "$(count 'done session')" -ge 1
kill -TERM $PID; wait_exit 5
check "exit 0" eq "$RC" 0

echo "[$VAR] 6. SIGHUP — 로그 레벨만 바뀐다"
mkcfg 4 INF; start
send "$VALID"; sleep 0.4; before=$(count 'recv session')
mkcfg 4 ERR
kill -HUP $PID; sleep 0.5
send "$VALID"; sleep 0.4
check "HUP 후에는 INF 로그가 안 나옴" eq "$(count 'recv session')" "$before"
check "프로세스 생존 (무중단)" kill -0 $PID
kill -TERM $PID; wait_exit 5
check "exit 0" eq "$RC" 0

echo "[$VAR] 7. kill -9 (비교용)"
mkcfg; start; kill -9 $PID; wait $PID 2>/dev/null; RC=$?
check "137 (정리 못 하는 게 정상)" eq "$RC" 137

if [ "$VAR" = B ]; then
    echo "[B] B-a. 메시지가 반만 온다 → 나머지가 오면 처리"
    mkcfg; start
    { exec 3<>/dev/tcp/127.0.0.1/$PORT
      printf '\x22\x85\x00\x00\x01'  >&3; sleep 0.3
      printf '\x02\x03\x04\x0a\x0b\x0c\x90\xc2\xd9' >&3; sleep 0.4; exec 3>&-; } 2>/dev/null
    check "반 + 반 → done 1건" eq "$(count 'done session')" 1

    echo "[B] B-b. 두 클라이언트가 섞여서 보낸다"
    { exec 3<>/dev/tcp/127.0.0.1/$PORT; exec 4<>/dev/tcp/127.0.0.1/$PORT
      printf '\x22\x85\x00\x00\x01\x02\x03'  >&3; sleep 0.2
      printf "$VALID" >&4; sleep 0.2
      printf '\x04\x0a\x0b\x0c\x90\xc2\xd9' >&3; sleep 0.4; exec 3>&- 4>&-; } 2>/dev/null
    check "각자 한 건씩 → done 이 3건 (앞의 1건 포함)" eq "$(count 'done session')" 3

    echo "[B] B-c. 연결 · 끊김 300번 → fd 가 새지 않는다"
    for i in $(seq 1 300); do { exec 3<>/dev/tcp/127.0.0.1/$PORT; exec 3>&-; } 2>/dev/null; done
    sleep 0.5
    check "프로세스 생존" kill -0 $PID
    check "열린 fd 20개 이하: $(ls /proc/$PID/fd 2>/dev/null | wc -l)" test "$(ls /proc/$PID/fd 2>/dev/null | wc -l)" -le 20

    echo "[B] B-d. 메시지 도중 끊기"
    { exec 3<>/dev/tcp/127.0.0.1/$PORT; printf '\x22\x85\x00' >&3; exec 3>&-; } 2>/dev/null
    sleep 0.4
    check "프로세스 생존" kill -0 $PID
    kill -TERM $PID; wait_exit 5
    check "exit 0" eq "$RC" 0
    check "ASan 리포트 없음" no_asan
fi

if [ "$VAR" = C ]; then
    echo "[C] C-a. 무응답 요청은 expire_sec 뒤에 만료된다"
    mkcfg 4 INF 1; start
    send "$NOREPLY"; send "$VALID"; sleep 2.6
    check "expired 1건 (NOREPLY 만)" eq "$(count 'expired session')" 1
    check "정상 요청은 만료되지 않음 (done 1건 이상)" test "$(count 'done session')" -ge 1

    echo "[C] C-b. 무응답 요청 100개"
    for i in $(seq 1 100); do send "$NOREPLY"; done
    sleep 3
    check "만료 수 == recv - done (무응답은 done 이 없다)" eq "$(count 'expired session')" "$(( $(count 'recv session') - $(count 'done session') ))"
    kill -TERM $PID; wait_exit 5
    check "exit 0" eq "$RC" 0

    echo "[C] C-c. 대기 중인 슬롯이 있어도 종료는 5초 안에 된다"
    mkcfg 4 INF 30; start
    send "$NOREPLY"; sleep 0.3
    t0=$SECONDS; kill -TERM $PID; wait_exit 5
    check "exit 0" eq "$RC" 0
    check "5초 이내" test $((SECONDS - t0)) -le 5
    check "ASan 리포트 없음 (슬롯 · 감시 스레드 정리)" no_asan
fi

echo "pass=$pass fail=$fail"
if [ "$fail" -eq 0 ]; then echo PASS; else echo "FAIL $fail"; exit 1; fi
```

> [!WARNING] 이 스크립트도 **먼저 깨뜨려 본다**
> 시나리오는 **데몬이 틀렸을 때 `X` 가 나와야** 의미가 있다.
> 아래처럼 일부러 틀리게 만들고 `X` 가 나오는지 확인한다.
>
> | 일부러 틀리게 | 기대하는 `X` |
> | :--- | :--- |
> | `jobq_close` 를 `cond_signal` 로 바꾼다 | 시나리오 1, 4 (종료 `timeout`) 와 `test_close_wakes_all` |
> | `sa_flags = SA_RESTART` | 시나리오 1 (조용한 시간대에 종료가 밀림) |
> | `poll` 타임아웃을 `-1` 로 | 시나리오 1 |
> | 설정 실패 경로에서 `goto ERR_CFG` 를 빼먹음 | 시나리오 2 의 ASan 누수 |
> | 파싱 실패에서 `exit()` | 시나리오 5 (프로세스 생존) |

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [README 의 공통 Makefile](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 을 `~/cdrill/Makefile` 로 쓴다.
`-pthread` 가 이미 들어 있다.

```bash
# ① 큐 단위 시험 (먼저)
make D=d7_daemon V=jobq SRC="d7_daemon/src/jobq.c d7_daemon/test/test_jobq.c"

# ② 데몬 빌드 → 시나리오 시험
make D=d7_daemon V=daemon SRC="$(ls d7_daemon/src/*.c)" build/d7_daemon_daemon
bash d7_daemon/test/run.sh build/d7_daemon_daemon A      # 변형 A (UDP)
bash d7_daemon/test/run.sh build/d7_daemon_daemon B      # 변형 B (TCP)
bash d7_daemon/test/run.sh build/d7_daemon_daemon C      # 변형 C (타임아웃 감시)
```

* ①의 마지막 줄이 **`PASS`**, ②의 마지막 줄이 **`PASS`** 이면 통과다.
* `run.sh` 는 ASan 이 켜진 데몬의 stderr 를 읽으므로 **누수는 `X` 로 나온다.**
* 포트가 겹치면 `PORT=19100 bash d7_daemon/test/run.sh ...` 처럼 바꾼다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> # ① 큐 단위 시험
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g \
>     -Icommon -Id7_daemon/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d7_daemon/src/jobq.c d7_daemon/test/test_jobq.c \
>     -pthread -o build/d7_daemon_jobq
> ./build/d7_daemon_jobq
>
> # ② 데몬
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g \
>     -Icommon -Id7_daemon/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d7_daemon/src/*.c -pthread -o build/d7_daemon_daemon
> bash d7_daemon/test/run.sh build/d7_daemon_daemon A
> ```

---

## 4. 자주 하는 실수

| 실수 | 증상 |
| :--- | :--- |
| 핸들러에서 `LOG_INF` 호출 | 락을 잡다가 **교착**. 재현이 잘 안 돼 더 무섭다 |
| `int g_running` (volatile 없음) | 최적화로 **루프 밖에서 캐시**되어 종료 깃발을 영원히 못 본다 |
| `jobq_close()` 없이 `pthread_join` | 워커가 `cond_wait` 에서 안 깨서 **영원히 멈춘다** |
| `poll` 타임아웃 `-1` | 트래픽 없으면 `Ctrl+C` 가 안 먹는다 |
| 스레드 인자를 **스택 변수 주소**로 전달 | 루프가 돌면 값이 바뀐다. 힙에 복사하거나 `intptr_t` 로 값 전달 |
| `pthread_create` 실패 시 앞서 만든 스레드 방치 | 프로세스가 안 끝난다. **`made` 개수만큼 되돌린다** |
| 종료 시 `exit(0)` 로 즉시 탈출 | 정리 코드가 통째로 안 돈다. **라벨로 내려가게** |
| (B) 한 번의 `recv` 가 메시지 한 개라고 가정 | 반만 오거나 두 개가 붙어 오면 **파싱이 틀어진다.**<br>버퍼에 쌓고 **전체 길이가 모였을 때만** 파싱한다 |
| (B) 끊긴 연결의 상태를 해제하지 않음 | 연결·끊김을 반복하면 **fd 와 메모리가 샌다** (시험 B-c 가 잡는다) |
| (B) `poll` 배열을 `p = realloc(p, ...)` 로 확장 | 실패하면 원본을 잃는다.<br>`tmp` 로 받는다 |
| (C) 감시 스레드가 락 없이 슬롯을 읽음 | 워커의 check-out 과 겹쳐 **살아 있는 요청을 만료**시킨다 |
| (C) 감시 스레드를 `sleep(1)` 로 돌림 | 종료 때 최대 1초 지연 + 깨울 수 없다.<br>`cond_timedwait` 로 만들어 **종료 때 `broadcast`** |
| (C) 종료 시 감시 스레드를 `join` 하지 않음 | 해제된 슬롯 테이블을 감시 스레드가 읽는다 (use-after-free) |

---

## 5. 모범답안 (변형 A)

> [!success]- 시그널 — 깃발만 든다
> ```c
> static volatile sig_atomic_t g_running  = 1;   /* 0 이 되면 종료 */
> static volatile sig_atomic_t g_reload   = 0;   /* SIGHUP */
>
> static void on_signal(int signo)
> {
>     switch (signo) {
>     case SIGINT:
>     case SIGTERM: g_running = 0; break;        /* ★ 대입 하나. 로그도 금지 */
>     case SIGHUP:  g_reload  = 1; break;
>     default: break;
>     }
> }
>
> static int signal_setup(void)
> {
>     struct sigaction sa;
>
>     memset(&sa, 0x00, sizeof(sa));
>     sa.sa_handler = on_signal;
>     sigemptyset(&sa.sa_mask);
>     sa.sa_flags = 0;                 /* ★ SA_RESTART 를 켜지 않는다 */
>
>     if (sigaction(SIGINT,  &sa, NULL) < 0) return RET_FAIL;
>     if (sigaction(SIGTERM, &sa, NULL) < 0) return RET_FAIL;
>     if (sigaction(SIGHUP,  &sa, NULL) < 0) return RET_FAIL;
>
>     /* 상대가 끊었을 때 프로세스가 죽지 않도록 */
>     signal(SIGPIPE, SIG_IGN);
>     return RET_OK;
> }
> ```
>
> `SA_RESTART` 를 켜면 `poll()` 이 시그널에 깨지 않고 **자동 재시작**된다.
> 그러면 `g_running == 0` 을 **아무도 보지 않게** 되어, 타임아웃이 올 때까지 종료가 밀린다.

> [!success]- 스레드 안전 큐 — 종료 때 반드시 broadcast
> ```c
> struct jobq_s {                            /* 불투명: 헤더에는 typedef struct jobq_s jobq_t; 만 둔다 */
>     job_t          *buf;
>     size_t          cap, head, tail, num;
>     bool            closed;                 /* ★ 더 이상 안 받는다 */
>     pthread_mutex_t lock;
>     pthread_cond_t  not_empty;
>     int             done_num;               /* wait_workers (아래 폴드) 가 쓴다 */
>     pthread_cond_t  all_done;
> };
>
> int jobq_push(jobq_t *q, const job_t *job)
> {
>     int ret = RET_OK;
>
>     CHK_PTR(q); CHK_PTR(job);
>
>     pthread_mutex_lock(&q->lock);
>     if (q->closed)            ret = RET_NOT_SUPPORTED;
>     else if (q->num == q->cap) ret = RET_TOO_SMALL;      /* 백프레셔: 버린다 */
>     else {
>         q->buf[q->tail] = *job;
>         q->tail = (q->tail + 1) % q->cap;
>         q->num++;
>         pthread_cond_signal(&q->not_empty);
>     }
>     pthread_mutex_unlock(&q->lock);
>     return ret;
> }
>
> /* 큐가 닫히고 비면 RET_NOT_FOUND 를 돌려 워커를 끝낸다 */
> int jobq_pop(jobq_t *q, job_t *out)
> {
>     int ret = RET_OK;
>
>     CHK_PTR(q); CHK_PTR(out);
>
>     pthread_mutex_lock(&q->lock);
>     while (q->num == 0 && !q->closed) {
>         pthread_cond_wait(&q->not_empty, &q->lock);      /* ★ while 로 감싼다 */
>     }
>     if (q->num > 0) {
>         *out = q->buf[q->head];
>         q->head = (q->head + 1) % q->cap;
>         q->num--;
>     } else {
>         ret = RET_NOT_FOUND;                             /* closed && empty */
>     }
>     pthread_mutex_unlock(&q->lock);
>     return ret;
> }
>
> void jobq_close(jobq_t *q)
> {
>     if (q == NULL) return;
>     pthread_mutex_lock(&q->lock);
>     q->closed = true;
>     pthread_cond_broadcast(&q->not_empty);   /* ★ signal 아님. 전원 깨운다 */
>     pthread_mutex_unlock(&q->lock);
> }
>
> int jobq_create(size_t cap, jobq_t **out)
> {
>     int     ret = RET_FAIL;
>     jobq_t *q   = NULL;
>     int     lock_ok = 0, ne_ok = 0;
>
>     CHK_PTR(out);
>     *out = NULL;
>     if (cap == 0) { LOG_ERR("cap is 0"); return RET_INVALID_ARG; }
>
>     q = calloc(1, sizeof(*q));
>     CHK_ALLOC_GOTO(q, ret, CLEANUP);
>     q->buf = calloc(cap, sizeof(*q->buf));
>     CHK_ALLOC_GOTO(q->buf, ret, CLEANUP);
>     q->cap = cap;
>
>     CHK_COND_GOTO(pthread_mutex_init(&q->lock, NULL) == 0, RET_FAIL, ret, CLEANUP);
>     lock_ok = 1;
>     CHK_COND_GOTO(pthread_cond_init(&q->not_empty, NULL) == 0, RET_FAIL, ret, CLEANUP);
>     ne_ok = 1;
>     CHK_COND_GOTO(pthread_cond_init(&q->all_done, NULL) == 0, RET_FAIL, ret, CLEANUP);
>
>     *out = q;  q = NULL;                    /* 소유권 이전 */
>     ret  = RET_OK;
>
> CLEANUP:
>     if (q != NULL) {                        /* 실패 경로: init 한 것만 destroy */
>         if (ne_ok)   pthread_cond_destroy(&q->not_empty);
>         if (lock_ok) pthread_mutex_destroy(&q->lock);
>         SAFE_FREE(q->buf);
>         free(q);
>     }
>     return ret;
> }
>
> void jobq_destroy(jobq_t *q)
> {
>     if (q == NULL) return;
>     pthread_cond_destroy(&q->all_done);
>     pthread_cond_destroy(&q->not_empty);
>     pthread_mutex_destroy(&q->lock);
>     SAFE_FREE(q->buf);
>     free(q);
> }
>
> /* jobq.h */
> /*   #include <netinet/in.h>  <pthread.h>  <stdbool.h>  <stddef.h>  <stdint.h>
>  *   typedef struct { uint32_t session_id; uint8_t type; uint16_t len; uint8_t data[1400];
>  *                    struct sockaddr_in from; } job_t;
>  *   typedef struct jobq_s jobq_t;  + 위 다섯 함수 선언 */
> ```
>
> `pthread_cond_wait` 을 **`if` 가 아니라 `while`** 로 감싸는 이유: 가짜 깨어남(spurious wakeup) 때문이다.
> `close` 에서 `signal` 을 쓰면 **한 스레드만 깨고 나머지는 영원히 대기**한다.
> 반드시 `broadcast`.

> [!success]- `main()` — 계단식 라벨
> ```c
> int main(int argc, char *argv[])
> {
>     int        ret      = RET_FAIL;
>     int        exit_code = 1;
>     cfg_t     *cfg      = NULL;
>     int        sock     = -1;
>     jobq_t    *q        = NULL;
>     pthread_t *tids     = NULL;
>     int        made     = 0;            /* 실제로 만들어진 스레드 수 */
>     int        port = 0, worker_num = 0, i = 0;
>
>     if (argc < 2) { fprintf(stderr, "usage: %s <cfg>\n", argv[0]); return 1; }
>
>     /* ── 1단계: 설정 ───────────────────────────── */
>     ret = cfg_create(argv[1], &cfg);
>     if (ret != RET_OK) { LOG_ERR("cfg: %s", ret_str(ret)); exit_code = 1; goto OUT; }
>     cfg_get_int(cfg, "listen_port", &port);
>     cfg_get_int(cfg, "worker_num",  &worker_num);
>
>     if (signal_setup() != RET_OK) { exit_code = 1; goto ERR_CFG; }
>
>     /* ── 2단계: 소켓 ───────────────────────────── */
>     ret = udp_open(port, &sock);
>     if (ret != RET_OK) { LOG_ERR("sock: %s", ret_str(ret)); exit_code = 2; goto ERR_CFG; }
>
>     /* ── 3단계: 큐 ─────────────────────────────── */
>     ret = jobq_create(1024, &q);
>     if (ret != RET_OK) { exit_code = 3; goto ERR_SOCK; }
>
>     /* ── 4단계: 워커 ───────────────────────────── */
>     tids = calloc((size_t)worker_num, sizeof(*tids));
>     if (tids == NULL) { exit_code = 3; goto ERR_QUEUE; }
>
>     for (i = 0; i < worker_num; i++) {
>         worker_arg_t *wa = calloc(1, sizeof(*wa));       /* 스레드가 free */
>         if (wa == NULL) { exit_code = 3; goto ERR_THREAD; }
>         wa->q = q; wa->sock = sock; wa->idx = i;
>
>         if (pthread_create(&tids[i], NULL, worker_main, wa) != 0) {
>             free(wa);
>             LOG_ERR("pthread_create %d failed", i);
>             exit_code = 3;
>             goto ERR_THREAD;                             /* ★ 만든 것만 되돌린다 */
>         }
>         made++;
>     }
>
>     LOG_INF("started: port=%d worker=%d", port, worker_num);
>
>     /* ── 서비스 루프 ───────────────────────────── */
>     while (g_running) {
>         struct pollfd pfd = { .fd = sock, .events = POLLIN, .revents = 0 };
>         int           n   = poll(&pfd, 1, 200);          /* 200ms 마다 깃발 확인 */
>
>         if (n < 0) {
>             if (errno == EINTR) continue;                /* 시그널로 깨어난 것 */
>             LOG_ERR("poll: %s", strerror(errno));
>             break;
>         }
>         if (g_reload) {                                  /* SIGHUP */
>             g_reload = 0;
>             log_level_reload(cfg);
>             LOG_INF("config reloaded");
>         }
>         if (n == 0) continue;                            /* 타임아웃: 정상 */
>
>         if (pfd.revents & POLLIN) recv_one(sock, q);     /* 실패해도 계속 산다 */
>     }
>
>     LOG_INF("shutting down...");
>     exit_code = 0;
>
> ERR_THREAD:                                              /* 잡은 역순 */
>     jobq_close(q);                                       /* ① 남은 작업까지 처리 */
>     for (i = 0; i < made; i++) pthread_join(tids[i], NULL);
>     SAFE_FREE(tids);
> ERR_QUEUE:
>     jobq_destroy(q);
> ERR_SOCK:
>     SAFE_CLOSE(sock);
> ERR_CFG:
>     cfg_destroy(cfg);
> OUT:
>     LOG_INF("bye (exit=%d)", exit_code);
>     return exit_code;
> }
> ```
>
> **눈여겨볼 점 4가지**
> 1. **라벨이 초기화 단계마다 하나씩.** 3단계에서 실패하면 `ERR_SOCK` 로 뛰어 2·1단계만 되돌린다.
> 2. `made` 를 센다.
>    5번째 스레드 생성이 실패하면 **만들어진 4개만** join 한다.
> 3. `jobq_close()` 를 join **전에** 부른다.
>    안 부르면 워커가 `cond_wait` 에서 영원히 안 깬다 — **전형적인 종료 행(hang)**.
> 4. `poll` 타임아웃 200ms 는 **깃발 확인 주기**다.
>    `-1`(무한)로 두면 조용한 시간대에 종료가 안 된다.

> [!success]- 종료 대기 상한 5초 — 안 끝나면 포기한다
> ```c
> /* join 을 무한히 기다리지 않으려면 워커가 "나 끝났다"를 카운트로 알린다 */
> static int wait_workers(jobq_t *q, int expect, int timeout_sec)
> {
>     struct timespec ts;
>     int             ret = RET_OK;
>
>     clock_gettime(CLOCK_REALTIME, &ts);
>     ts.tv_sec += timeout_sec;
>
>     pthread_mutex_lock(&q->lock);
>     while (q->done_num < expect) {
>         if (pthread_cond_timedwait(&q->all_done, &q->lock, &ts) == ETIMEDOUT) {
>             LOG_WRN("shutdown timeout: %d/%d done", q->done_num, expect);
>             ret = RET_TIMEOUT;      /* 남은 작업은 포기하고 진행 */
>             break;
>         }
>     }
>     pthread_mutex_unlock(&q->lock);
>     return ret;
> }
> ```

---

## 관련 노트

- [4. 데몬 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%204.%20데몬%20골격%20—%20순수%20POSIX%20main%20초기화·시그널·스레드·폴링루프.md)
- [[C] select() — 여러 입력과 타임아웃 함께 기다리기](개발%20%28CS%29/언어/C언어/네트워크·시스템%20IO/[C]%20select%28%29%20—%20여러%20입력과%20타임아웃%20함께%20기다리기.md)
- [[C] epoll — fd가 많아질 때의 대안](개발%20%28CS%29/언어/C언어/네트워크·시스템%20IO/[C]%20epoll%20—%20fd가%20많아질%20때의%20대안.md)
- [[C] pthread_create에 구조체 포인터 넘기기](개발%20%28CS%29/언어/C언어/동시성·스레드/[C]%20pthread_create에%20구조체%20포인터%20넘기기%20—%20void%20포인터와%20이중포인터%20정리.md)
- [[C] 정수를 void 포인터 인자에 실어 보내기 — intptr_t 캐스팅 관용구](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20정수를%20void%20포인터%20인자에%20실어%20보내기%20—%20intptr_t%20캐스팅%20관용구.md)
- [[C] 배열 기반 원형 큐(Ring Buffer)](개발%20%28CS%29/언어/C언어/동시성·스레드/[C]%20배열%20기반%20원형%20큐%28Ring%20Buffer%29%20—%20front·back%20인덱스로%20만드는%20큐.md)
- [[C] 비동기 요청-응답의 타임아웃 감시](개발%20%28CS%29/언어/C언어/동시성·스레드/[C]%20비동기%20요청-응답의%20타임아웃%20감시%20—%20Check-in과%20Check-out%20타이머%20패턴.md) — 변형 C
- [다음: D8. 3GPP 한 조각](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D8.%203GPP%20—%20IE%20표%20한%20장을%20끝까지.md)

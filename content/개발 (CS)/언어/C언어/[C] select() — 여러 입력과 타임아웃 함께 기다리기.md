---
title: "select() — 여러 입력과 타임아웃 함께 기다리기"
tags: [학습, 개발-CS, 언어, C언어, select, 파일디스크립터, 시그널]
created: 2026-09-16
modified: 2026-09-16
---

# select() — 여러 입력과 타임아웃 함께 기다리기

> [!NOTE]
> 여러 fd를 동시에 감시하면서 상한 시간을 둘 수 있는 `select()`의 시그니처, fd_set 매크로, 반환값, 그리고 "블로킹 입력 대기 중 종료 플래그를 못 보는 문제"를 푸는 실전 패턴을 정리한다.

## 0. 배경

여러 입출력 소스(파일, 소켓, 파이프, 표준입력 등)를 동시에 다뤄야 하는데, 그중 하나를 `read()`/`fgets()`처럼 무한정 블로킹하는 함수로 기다리면 나머지는 그동안 아예 처리할 수 없다. 특히 아래 상황에서 문제가 된다.

- 스레드가 입력을 무한정 기다리는 동안, 다른 스레드나 시그널 핸들러가 "이제 종료해"라는 플래그를 바꿔도 그 스레드는 확인할 방법이 없다 — 코드 실행 자체가 블로킹 함수 안에 멈춰 있기 때문.
- 소켓 여러 개를 동시에 감시해야 하는데 하나씩 순서대로 `read()`를 부르면, 먼저 확인한 소켓에 데이터가 없을 때 뒤의 소켓은 영영 확인을 못 한다.

`select()`는 "여러 fd 중 아무거나 준비되면 알려줘, 근데 최대 이 시간까지만 기다릴게"라고 커널에 물어보는 시스템 콜이다. 무작정 기다리는 대신 **"기다리되 상한 시간을 두는"** 패턴을 만들 수 있다.

## 1. 함수 시그니처

```c
#include <sys/select.h>

int select(int nfds, fd_set *readfds, fd_set *writefds, fd_set *exceptfds, struct timeval *timeout);
```

| 파라미터        | 의미                                                            |
| ----------- | ------------------------------------------------------------- |
| `nfds`      | 감시 대상 fd 중 가장 큰 번호 + 1. 커널이 몇 번 fd까지 비트를 검사할지 판단하는 기준         |
| `readfds`   | "읽어도 블로킹되지 않는 상태가 되면 알려줘" 할 fd 집합                             |
| `writefds`  | "써도 블로킹되지 않는 상태가 되면 알려줘" 할 fd 집합                              |
| `exceptfds` | "예외적인 상태가 생기면 알려줘" 할 fd 집합                                    |
| `timeout`   | 최대 대기 시간. `NULL`이면 무한 대기(블로킹과 동일), `{0,0}`이면 즉시 확인만 하고 리턴(폴링) |

세 fd 집합 중 관심 없는 건 `NULL`을 넘기면 된다.

## 2. fd_set을 다루는 매크로

`fd_set`은 fd 번호를 비트로 표현한 집합이라 직접 비트 연산을 하지 않고 아래 매크로로 다룬다.

| 매크로 | 동작 |
| --- | --- |
| `FD_ZERO(&set)` | 집합을 완전히 비움 |
| `FD_SET(fd, &set)` | 집합에 fd 추가 |
| `FD_CLR(fd, &set)` | 집합에서 fd 제거 |
| `FD_ISSET(fd, &set)` | select 호출 후, 이 fd가 준비된 목록에 들어있는지 확인 |

**주의**: `select()`가 리턴하면 넘겼던 집합 자체가 "준비된 fd만 남은 집합"으로 덮어써진다. 그래서 반복 호출할 때는 매번 `FD_ZERO` + `FD_SET`으로 새로 채워야 한다 — 한 번 쓰고 버리는 값이라고 생각하면 된다.

## 3. 반환값

| 반환값 | 의미 |
| --- | --- |
| `> 0` | 준비된 fd 개수 (어떤 fd인지는 `FD_ISSET`으로 확인) |
| `0` | `timeout` 시간 동안 아무 fd도 준비되지 않음 |
| `-1` | 에러거나, 대기 도중 시그널이 잡혀서 중단됨(`errno == EINTR`) |

`-1`이 중요한 포인트인데, 리눅스에서 `select()`는 **대기 중에 시그널이 하나라도 잡히면 재시작 없이 무조건 -1을 반환**한다(`read()`와 달리 `SA_RESTART` 설정과 무관하게 동작). 그래서 "블로킹 중인 스레드를 시그널로 확실하게 깨우고 싶을 때" `select()`가 `read()`/`fgets()`보다 신뢰도가 높다.

## 4. read / write / exception, 세 종류를 감시하는 이유

세 집합은 서로 다른 "준비 상태"를 의미한다.

| 집합 | "준비됐다"의 의미 | 예시 |
| --- | --- | --- |
| `readfds` | 그 fd에서 읽으면 블로킹 없이 뭔가 읽힌다(또는 EOF/연결 종료) | 표준입력에 줄이 들어옴, 소켓에 데이터 도착, 리스닝 소켓에 새 연결 대기 중 |
| `writefds` | 그 fd에 쓰면 블로킹 없이 바로 써진다(버퍼에 여유 있음) | 논블로킹 소켓의 `connect()`가 완료됨, 가득 찼던 파이프 버퍼가 비워짐 |
| `exceptfds` | 예외적인 상태 | TCP의 OOB(out-of-band) 데이터 도착 등 — 실무에서는 잘 안 쓰임 |

대부분의 코드는 `readfds`만 쓰고 나머지 둘은 `NULL`을 넘긴다. `writefds`는 논블로킹 소켓으로 `connect()`를 걸어놓고 "연결이 끝났는지"를 확인할 때 자주 쓰인다.

```c
/* 논블로킹 connect가 끝났는지 확인하는 전형적인 패턴 */
fd_set wfds;
struct timeval tv = {3, 0};   /* 3초 안에 연결 안 되면 포기 */

FD_ZERO(&wfds);
FD_SET(sock_fd, &wfds);

int ret = select(sock_fd + 1, NULL, &wfds, NULL, &tv);
if (ret > 0 && FD_ISSET(sock_fd, &wfds))
{
    /* 연결 완료 (또는 실패 — getsockopt(SO_ERROR)로 성공/실패를 구분해야 함) */
}
```

## 5. 표준입력 말고 어떤 fd를 감시할 수 있나

`select()`는 표준입력에 국한되지 않고, **정수로 표현되는 fd라면 종류 상관없이 함께 감시할 수 있다.**

- 표준입력/출력/에러 (`STDIN_FILENO`, `STDOUT_FILENO`, `STDERR_FILENO`)
- 소켓 (`socket()`, `accept()`로 얻은 fd) — 서버가 "리스닝 소켓 + 접속된 클라이언트 소켓 여러 개"를 한 번에 감시할 때 전형적으로 쓰는 패턴
- 파이프(`pipe()`), 네임드 파이프(FIFO)
- 일반 파일 — 다만 리눅스에서 디스크 파일은 거의 항상 "즉시 준비됨"으로 취급되어 select로 타이밍을 조절하는 의미가 약함
- 터미널 장치 파일

**여러 fd를 동시에 감시하는 예시** (표준입력 + 소켓 하나):
```c
fd_set rfds;
int maxfd;

FD_ZERO(&rfds);
FD_SET(STDIN_FILENO, &rfds);
FD_SET(sock_fd, &rfds);
maxfd = (STDIN_FILENO > sock_fd) ? STDIN_FILENO : sock_fd;

int ret = select(maxfd + 1, &rfds, NULL, NULL, &tv);
if (ret > 0)
{
    if (FD_ISSET(STDIN_FILENO, &rfds))
    {
        /* 키보드 입력 처리 */
    }
    if (FD_ISSET(sock_fd, &rfds))
    {
        /* 소켓 데이터 처리 */
    }
}
```
`nfds`는 감시하는 fd들 중 **가장 큰 번호 + 1**을 넘겨야 한다 — fd를 하나만 감시할 때보다 여러 개를 감시할 때 이 부분에서 실수가 잦다.

## 6. 실전 예제 — 블로킹 입력 대기 중 종료 플래그를 못 보는 문제

인터랙티브 CLI 스레드가 아래처럼 짜여 있으면, 다른 스레드나 시그널 핸들러가 종료 플래그를 0으로 바꿔도 이 스레드는 알 방법이 없다.

```c
while (running)
{
    printf("> ");
    fflush(stdout);

    if (fgets(line, sizeof(line), stdin) == NULL)   /* 여기서 무한정 블로킹 */
    {
        break;
    }
    /* 명령 처리 */
}
```
`fgets`가 입력을 기다리는 동안 이 스레드의 실행 흐름은 그 함수 안에 멈춰 있어서, `running`이 바뀌어도 다음 `fgets` 호출 전까지는 확인할 기회가 없다.

`select()`로 "짧은 타임아웃 동안만 기다렸다가, 없으면 플래그부터 다시 확인"하는 구조로 바꾸면 해결된다.

```c
static int wait_for_input(int timeout_ms)
{
    fd_set rfds;
    struct timeval tv;

    FD_ZERO(&rfds);
    FD_SET(STDIN_FILENO, &rfds);
    tv.tv_sec = timeout_ms / 1000;
    tv.tv_usec = (timeout_ms % 1000) * 1000;   /* ms → us 변환 */

    return select(STDIN_FILENO + 1, &rfds, NULL, NULL, &tv);
}

while (running)
{
    int sel;

    printf("> ");
    fflush(stdout);

    do
    {
        sel = wait_for_input(200);        /* 최대 200ms만 대기 */
    } while (sel == 0 && running);        /* 타임아웃이었고 아직 안 꺼졌으면 다시 대기 */

    if (!running)
    {
        break;                            /* 대기 중 종료 신호가 옴 */
    }
    if (sel < 0)
    {
        continue;                         /* select 자체가 다른 시그널로 깨진 경우 — 재시도 */
    }

    if (fgets(line, sizeof(line), stdin) == NULL)   /* 데이터가 있다고 확인된 뒤라 블로킹 없이 안전하게 리턴 */
    {
        break;
    }
    /* 명령 처리 */
}
```

핵심은 "무한 대기"를 "최대 200ms 대기 + 재확인"으로 바꿨다는 것. 입력이 없는 동안은 최대 200ms마다 `running`을 다시 검사하고, 데이터가 실제로 도착했을 때만 `fgets`를 부르기 때문에 `fgets` 자체가 블로킹될 일이 없다.

## 7. select의 한계

- 감시 가능한 fd 최대 개수가 `FD_SETSIZE`(보통 1024)로 제한됨
- fd 개수가 많아지면 매번 전체 집합을 커널에 복사하고 스캔해야 해서 fd 수에 비례해 비용이 커짐(O(n))
- fd 수가 아주 많은 서버(수천 개 이상 커넥션)에서는 `poll()`, 더 나아가 리눅스의 `epoll()`을 쓰는 게 일반적. 다만 fd 몇 개 수준(표준입력 하나, 소켓 몇 개)을 다룰 땐 `select()`만으로 충분하고 이식성도 제일 좋다.

## 관련 문서

- [extern과 static — 링키지와 다중 파일 공유]([C]%20extern과%20static%20—%20링키지와%20다중%20파일%20공유.md)
- [epoll — fd가 많아질 때의 대안]([C]%20epoll%20—%20fd가%20많아질%20때의%20대안.md)

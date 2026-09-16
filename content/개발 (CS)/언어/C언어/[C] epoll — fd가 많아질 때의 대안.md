---
title: "epoll — fd가 많아질 때의 대안"
tags: [학습, 개발-CS, 언어, C언어, epoll, poll, select, 파일디스크립터]
created: 2026-09-16
modified: 2026-09-16
---

# epoll — fd가 많아질 때의 대안

> [!NOTE]
> `select()`의 fd 개수 제한·O(n) 스캔 비용을 poll()과 epoll()이 각각 어떻게 해결하는지, level-triggered/edge-triggered 차이, 세 API 비교를 정리한다.

## 0. 배경

[select() — 여러 입력과 타임아웃 함께 기다리기]([C]%20select()%20—%20여러%20입력과%20타임아웃%20함께%20기다리기.md)에서 본 것처럼 `select()`는 "여러 fd 중 준비된 게 있는지, 최대 얼마까지만 기다리며" 확인하는 도구다. 근데 감시할 fd가 몇 개 안 될 땐 문제없지만, **fd가 수백~수천 개** 규모로 늘어나면 두 가지가 발목을 잡는다.

1. `fd_set`은 `FD_SETSIZE`(보통 1024)로 감시 가능한 fd 수가 제한됨
2. `select()`를 부를 때마다 **등록된 fd 전체**를 커널이 순회하며 준비 상태를 확인함 — 등록된 게 1000개고 그중 1개만 준비됐어도 1000개를 다 훑어야 함(fd 개수에 비례하는 비용, O(n))

`poll()`과 `epoll()`은 이 문제를 각각 다른 방식으로 풀어준다. `poll()`은 1번(개수 제한)만 풀고, `epoll()`은 1번과 2번을 둘 다 푼다.

## 1. poll() — select의 API를 개선한 버전

```c
#include <poll.h>

struct pollfd {
    int   fd;        /* 감시할 fd */
    short events;     /* 뭘 감시할지 (요청) */
    short revents;    /* 실제로 뭐가 일어났는지 (결과, 커널이 채움) */
};

int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

`select()`와 다른 점:

- **fd_set 비트마스크 대신 `struct pollfd` 배열**을 쓴다. 배열 크기만큼 fd를 감시할 수 있어서 `FD_SETSIZE` 같은 상한이 없다.
- **"요청"(`events`)과 "결과"(`revents`)가 분리된 필드**다. select는 같은 `fd_set`을 입력으로도 쓰고 출력(덮어쓰기)으로도 써서 매 호출 전 `FD_ZERO`+`FD_SET`으로 다시 채워야 했는데, poll은 `events`가 호출 후에도 그대로 남아있어서 **감시 목록이 안 바뀌면 매번 다시 구성할 필요가 없다.**
- `timeout`이 `struct timeval`이 아니라 **밀리초 단위 `int`** 하나다.

```c
struct pollfd fds[1];
fds[0].fd = STDIN_FILENO;
fds[0].events = POLLIN;      /* "읽을 데이터 생기면 알려줘" */

int ret = poll(fds, 1, 200);  /* 최대 200ms 대기 */
if (ret > 0 && (fds[0].revents & POLLIN))
{
    /* 입력 처리 */
}
```

**하지만** poll도 select처럼 **커널이 매 호출마다 배열 전체를 순회**한다는 점은 그대로다. fd 개수 제한과 API 불편함(비트마스크 조작)만 없앴을 뿐, "fd가 많아질수록 매 호출 비용이 커지는" 근본 문제는 안 풀렸다.

## 2. epoll — 구조 자체가 다른 접근

`epoll`은 리눅스 전용 API로, "매번 전체를 다시 알려주고 다시 훑는" 대신 **커널에 관심 목록을 한 번 등록해두고, 상태가 바뀔 때마다 커널이 알아서 갱신**하는 방식이다.

```c
#include <sys/epoll.h>

int epoll_create1(int flags);
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
```

| 함수 | 역할 |
| --- | --- |
| `epoll_create1(0)` | epoll 인스턴스 하나 생성, 그 자체도 fd로 반환됨 |
| `epoll_ctl(epfd, op, fd, &ev)` | 감시 목록에 fd 추가(`EPOLL_CTL_ADD`)/수정(`EPOLL_CTL_MOD`)/제거(`EPOLL_CTL_DEL`) — **최초 한 번만 하면 됨** |
| `epoll_wait(epfd, events, maxevents, timeout_ms)` | 등록된 것 중 **준비된 것만** 돌려받음 |

```c
struct epoll_event ev, events[10];
int epfd = epoll_create1(0);

ev.events = EPOLLIN;
ev.data.fd = STDIN_FILENO;
epoll_ctl(epfd, EPOLL_CTL_ADD, STDIN_FILENO, &ev);   /* 등록은 여기서 끝 */

/* ... 이후 루프에서는 매번 이것만 반복 ... */
int n = epoll_wait(epfd, events, 10, 200);   /* 최대 200ms 대기 */
for (int i = 0; i < n; i++)
{
    if (events[i].data.fd == STDIN_FILENO)
    {
        /* 입력 처리 */
    }
}
```

**왜 더 빠른가**: 커널은 각 fd가 준비될 때 콜백으로 "준비 리스트"에 그 fd를 올려놓는다. `epoll_wait()`은 이 준비 리스트만 보면 되니까, 등록된 fd가 1000개든 10000개든 상관없이 **실제로 준비된 fd 수에만 비례하는 비용**으로 끝난다. 그리고 select/poll처럼 "어떤 fd가 준비됐는지" 호출자가 순회하며 찾을 필요도 없다 — `events` 배열에 준비된 것만 바로 담겨 나온다.

### Level-triggered vs Edge-triggered

`epoll_ctl`로 등록할 때 `ev.events`에 `EPOLLET`를 추가하면 동작 방식이 바뀐다.

- **Level-triggered (기본값, select/poll과 동일한 방식)**: 버퍼에 안 읽은 데이터가 남아있는 한 계속 "준비됨"으로 알려준다. 매번 다 읽지 않아도 안전하다.
- **Edge-triggered (`EPOLLET`)**: "안 준비됨 → 준비됨"으로 **상태가 바뀌는 순간 딱 한 번만** 알려준다. 그 알림 때 데이터를 (논블로킹으로) 다 읽어치우지 않으면, 버퍼에 데이터가 남아있어도 다시 알려주지 않는다 — 초보자가 자주 빠지는 함정이라 보통 "논블로킹 fd + `EAGAIN` 받을 때까지 반복 읽기"를 세트로 써야 한다.

처음 접한다면 level-triggered(기본값)로 충분하고, 이해가 쌓인 뒤에 성능이 정말 필요할 때 edge-triggered를 검토하면 된다.

## 3. select / poll / epoll 한눈에 비교

| | select | poll | epoll |
| --- | --- | --- | --- |
| fd 표현 방식 | `fd_set` 비트마스크 | `struct pollfd` 배열 | 커널 내부 등록 테이블 |
| 최대 fd 수 | `FD_SETSIZE`(보통 1024) | 제한 없음(배열 크기만큼) | 제한 없음 |
| 매 호출 전 재등록 | 필요 (fd_set이 결과로 덮어써짐) | 불필요 (`events`는 유지, `revents`만 채워짐) | 불필요 (최초 1회 `epoll_ctl`) |
| 커널 스캔 비용 | 등록된 fd 전체 O(n) | 등록된 fd 전체 O(n) | 준비된 fd 수에 비례 |
| "어떤 fd가 준비됐나" 찾는 비용 | 호출자가 `FD_ISSET` 순회 O(n) | 호출자가 `revents` 순회 O(n) | 결과 배열에 준비된 것만 담김 |
| 타임아웃 단위 | `struct timeval` (초 + 마이크로초) | `int` (밀리초) | `int` (밀리초) |
| 이식성 | POSIX 표준, 가장 널리 지원 | POSIX 표준 | 리눅스 전용 |

## 4. 언제 뭘 쓸까

- **fd가 적음(수십 개 이하), 이식성 중요** → `select()`. 코드도 제일 간단하고 유닉스 계열 어디서나 동작한다.
- **fd가 많을 수 있는데 리눅스에만 안 묶여도 됨** → `poll()`. `FD_SETSIZE` 제한 없이 select와 비슷한 방식으로 쓸 수 있다.
- **fd가 수백~수천 개로 많고 리눅스 환경 고정** → `epoll()`. 대량 커넥션을 받는 서버(예: 다수의 클라이언트 소켓을 동시에 처리)에서 사실상 표준으로 쓰인다.

## 관련 문서

- [select() — 여러 입력과 타임아웃 함께 기다리기]([C]%20select()%20—%20여러%20입력과%20타임아웃%20함께%20기다리기.md)

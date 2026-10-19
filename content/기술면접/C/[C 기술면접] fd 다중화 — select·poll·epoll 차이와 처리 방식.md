---
title: "[C 기술면접] fd 다중화 — select·poll·epoll 차이와 처리 방식"
tags: [기술면접, C 기술면접, file descriptor, select, poll, epoll, 논블로킹, I/O 다중화, 리액터]
created: 2026-10-19
modified: 2026-10-19
---

# [C 기술면접] fd 다중화 — select·poll·epoll 차이와 처리 방식

> [!NOTE]
> 질문 9: **file descriptor(fd)를 이용해 처리하는 방식에는 무엇이 있는가? (select, poll, epoll의 차이)**
> 핵심은 "한 스레드가 **여러 fd 중 준비된 것만** 골라서 처리한다(I/O 다중화)"는 개념이다. `select → poll → epoll` 순으로 **확장성(fd 수가 많을 때의 비용)** 이 개선된다. 락(동기화)이 아니라 **I/O 대기 도구**라는 점도 구분한다.

---

## 1. fd 처리 방식의 큰 그림

| 방식 | 동작 | 장단점 | 쓰임 |
| --- | --- | --- | --- |
| **블로킹 I/O + 연결당 프로세스/스레드** | `read()`가 데이터 올 때까지 잠듦, 연결마다 실행 흐름 1개 | 코드 단순 / 연결 수만큼 스레드(메모리·문맥 전환 비용), C10K 한계 | 연결 수 적은 서버, 단순 도구 |
| **논블로킹 I/O + 폴링(busy loop)** | `O_NONBLOCK`으로 `EAGAIN` 즉시 반환, 루프로 계속 시도 | 블로킹은 피하지만 CPU 낭비 | 거의 쓰지 않음 |
| **I/O 다중화 (select / poll / epoll)** | 여러 fd를 한 번에 등록하고 "준비된 것"만 통지받음 | 적은 스레드로 많은 연결 처리 / 이벤트 루프 설계 필요 | **대부분의 서버(리액터 패턴)** |
| **시그널 기반 I/O (SIGIO, `O_ASYNC`)** | fd가 준비되면 시그널 | 시그널 제약(안전 함수만 호출 가능), 복잡 | 드묾 |
| **비동기 I/O (POSIX AIO, `io_uring`)** | 요청을 제출하고 **완료**를 통지(프로액터) | 파일 I/O까지 비동기화, 시스템 콜 감소 / 복잡, 커널 버전 의존 | 고성능 스토리지/네트워크 |
| **이벤트 fd로 통합** | `timerfd`, `signalfd`, `eventfd`를 fd로 만들어 같은 다중화 루프에 등록 | 소켓·타이머·시그널·스레드 신호를 한 루프에서 처리 | epoll 기반 데몬 |

- **리액터(Reactor)**: "준비됨"을 통지받고 *내가* read/write 수행 (select/poll/epoll). **프로액터(Proactor)**: 작업을 맡기고 *완료*를 통지받음 (IOCP, io_uring).
- 일반 파일은 항상 "준비됨"으로 간주되어 select/poll/epoll로 의미가 없다(epoll은 일반 파일 등록 시 `EPERM`). 소켓·파이프·tty·eventfd 등에 쓴다.

---

## 2. select · poll · epoll 비교 (핵심)

| 항목 | **select** | **poll** | **epoll** |
| --- | --- | --- | --- |
| fd 표현 | `fd_set` 비트마스크 | `struct pollfd` 배열 | 커널 내부 관심 목록(red-black tree) + 준비 목록(ready list) |
| **최대 fd 수** | `FD_SETSIZE`(보통 **1024**) 제한 | 제한 없음(배열 크기, `RLIMIT_NOFILE`) | 제한 없음 |
| 호출마다 fd 목록 전달 | **매번** 전체 `fd_set` 재설정 (결과로 덮어써짐) | 매번 배열 전달(`events`는 유지, `revents`만 채워짐) | **최초 1회** `epoll_ctl` 등록, 이후 `epoll_wait`만 호출 |
| 커널 처리 비용 | 등록된 fd 전체 순회 **O(n)** | 전체 순회 **O(n)** | 준비된 이벤트 수에 비례 **O(ready)** |
| 사용자 측 비용 | 모든 fd를 `FD_ISSET`로 확인 **O(n)** | `revents` 순회 **O(n)** | 반환된 준비된 이벤트만 처리 |
| 유저↔커널 복사 | 호출마다 n개 복사 | 호출마다 n개 복사 | 등록 시 1회, 대기 시 준비된 것만 |
| 타임아웃 | `struct timeval`(초+마이크로초), 리눅스에서 호출 후 값이 변경될 수 있음 | `int` 밀리초 | `int` 밀리초 |
| 첫 인자 | `nfds` = **최대 fd + 1** | 배열 크기 | epoll fd |
| 트리거 방식 | Level-triggered | Level-triggered | **Level(기본) / Edge(`EPOLLET`)** |
| 이식성 | POSIX, 가장 널리 지원 | POSIX | **Linux 전용** (BSD는 `kqueue`, Windows는 IOCP) |
| 적합한 상황 | fd 수십 개 이하, 이식성 중요 | fd 많지만 활성 비율 높음/이식성 | **fd 수천~수만, 활성 fd는 일부** (대규모 서버) |

### 왜 epoll이 확장성이 좋은가
- select/poll은 **매 호출마다** 전체 fd 목록을 커널에 넘기고 커널이 모두 훑는다 → 연결 10만 개면 호출마다 10만 개 처리.
- epoll은 **관심 목록을 커널에 상주**시키고, 네트워크 스택이 데이터 도착 시 해당 fd를 **준비 목록에 추가**한다. `epoll_wait`는 준비 목록만 반환 → 활성 fd가 적을수록 유리(전체 연결이 아닌 **활성 연결 수**에 비례).
- 단, 대부분의 fd가 항상 활성이면 차이는 줄어든다. fd가 적으면 select/poll이 더 단순하고 충분하다.

### Level-triggered vs Edge-triggered
| | LT (기본) | ET (`EPOLLET`) |
| --- | --- | --- |
| 통지 시점 | 읽을 데이터가 **남아 있는 동안 계속** 통지 | **상태가 바뀌는 순간 한 번만** 통지 |
| 요구사항 | 일부만 읽어도 다음 `epoll_wait`에서 다시 통지 | **논블로킹 fd**로, `EAGAIN`이 나올 때까지 **끝까지 읽어야** 함 (남기면 영영 통지 안 옴) |
| 장단점 | 안전하고 select/poll과 동일한 사고방식 | 시스템 콜 수 감소 / 실수하면 데이터 정체 |

---

## 3. 사용 예시

### select
```c
fd_set rfds;
FD_ZERO(&rfds);
FD_SET(listen_fd, &rfds);
FD_SET(client_fd, &rfds);
int maxfd = (listen_fd > client_fd ? listen_fd : client_fd);
struct timeval tv = { .tv_sec = 1, .tv_usec = 0 };

int n = select(maxfd + 1, &rfds, NULL, NULL, &tv);   /* 호출 후 rfds는 '준비된 것만' 남음 → 매번 다시 설정해야 함 */
if (n > 0) {
    if (FD_ISSET(listen_fd, &rfds)) { /* accept */ }
    if (FD_ISSET(client_fd, &rfds)) { /* read */ }
}
```

### poll
```c
struct pollfd fds[2] = {
    { .fd = listen_fd, .events = POLLIN },
    { .fd = client_fd, .events = POLLIN },
};
int n = poll(fds, 2, 1000 /* ms */);
for (int i = 0; n > 0 && i < 2; i++)
    if (fds[i].revents & POLLIN) { /* 처리 */ }
```

### epoll
```c
int ep = epoll_create1(0);

struct epoll_event ev = { .events = EPOLLIN, .data.fd = listen_fd };
epoll_ctl(ep, EPOLL_CTL_ADD, listen_fd, &ev);          /* 한 번만 등록 */

struct epoll_event events[64];
for (;;) {
    int n = epoll_wait(ep, events, 64, 1000 /* ms, -1=무기한 */);
    for (int i = 0; i < n; i++) {                       /* 준비된 것만 돌아온다 */
        int fd = events[i].data.fd;
        if (fd == listen_fd) {
            int c = accept(listen_fd, NULL, NULL);
            /* c 를 논블로킹으로 설정 후 EPOLL_CTL_ADD */
        } else if (events[i].events & EPOLLIN) {
            /* read(fd, ...) ; 0 이면 상대 종료 → EPOLL_CTL_DEL + close */
        }
    }
}
```
- 소켓은 **논블로킹**으로 두고, `accept`/`read`에서 `EAGAIN`/`EWOULDBLOCK`은 에러가 아니라 "나중에"로 처리한다.
- `read` 반환 `0`은 상대가 연결을 닫았다는 뜻(EOF), `-1`은 `errno`를 확인.

→ 자세한 설명: [select() — 여러 입력과 타임아웃 함께 기다리기](개발%20%28CS%29/언어/C언어/네트워크·시스템%20IO/[C]%20select%28%29%20—%20여러%20입력과%20타임아웃%20함께%20기다리기.md), [epoll — fd가 많아질 때의 대안](개발%20%28CS%29/언어/C언어/네트워크·시스템%20IO/[C]%20epoll%20—%20fd가%20많아질%20때의%20대안.md), [Socket 통신](개발%20%28CS%29/언어/C언어/네트워크·시스템%20IO/[TCP_IP]%20Socket%20통신%20-%20핵심%20개념%20및%20특징%20정리.md)

---

## 4. 멀티스레드와 결합하는 서버 모델
| 모델 | 설명 |
| --- | --- |
| 단일 스레드 이벤트 루프 | epoll 하나로 모든 연결 처리. 핸들러가 블로킹되면 전체가 멈추므로 **핸들러는 짧고 논블로킹**이어야 함 (Redis, Node.js) |
| **이벤트 루프 + 워커 스레드 풀** | 루프는 I/O 통지만, 무거운 작업은 큐로 워커에 위임 후 결과를 `eventfd`로 알림 |
| 스레드당 epoll (SO_REUSEPORT) | 코어별로 listen 소켓/epoll을 두어 락 경합 제거 (nginx 워커) |
| 연결당 스레드 | 단순하지만 대규모 연결에는 부적합 |

주의:
- 여러 스레드가 같은 fd를 `epoll_wait`하면 같은 이벤트가 중복 통지될 수 있다 → `EPOLLONESHOT`(처리 후 재무장) 또는 `EPOLLEXCLUSIVE`(thundering herd 완화).
- 스레드 신호용으로 `eventfd`/self-pipe를 epoll에 등록하면 소켓 이벤트와 같은 루프에서 기다릴 수 있다.

---

## 5. 꼬리 질문
| 질문 | 답변 요지 |
| --- | --- |
| select의 `nfds`가 왜 최대 fd + 1인가? | 커널이 `0..nfds-1` 범위만 검사하므로. fd가 크면 검사 범위가 커져 비효율. |
| select 호출 후 `fd_set`을 다시 설정해야 하는 이유? | 결과가 같은 `fd_set`에 덮어써져서(준비된 fd만 남음) 원래 관심 목록이 사라진다. |
| fd가 1024개를 넘으면? | select는 `FD_SETSIZE` 초과 시 정의되지 않은 동작. poll/epoll 사용. |
| epoll이 항상 poll보다 빠른가? | fd가 적거나 대부분이 활성일 때는 차이가 작고, `epoll_ctl` 시스템 콜 비용 때문에 poll이 나을 수도 있다. 큰 차이는 "많은 연결 중 일부만 활성"일 때다. |
| 블로킹/논블로킹, 동기/비동기의 차이? | 블로킹/논블로킹: 호출이 **즉시 반환**되는가. 동기/비동기: 결과를 **호출자가 직접 확인**하는가, 완료를 통지받는가. select/epoll은 **논블로킹 + 동기(I/O 다중화)** 로 분류한다. |
| `EPOLLRDHUP`, `EPOLLERR`, `EPOLLHUP`? | 상대 반쪽 종료 / 에러 / 연결 끊김. 항상 `EPOLLERR`/`EPOLLHUP`는 자동 포함되므로 처리 분기를 둔다. |
| 소켓 버퍼가 가득 차 write가 막히면? | 논블로킹 소켓에서 `EAGAIN` → 나머지 데이터를 유저 공간 송신 버퍼에 보관하고 `EPOLLOUT`을 등록해 쓰기 가능 시 이어서 전송. |
| select/epoll과 세마포어의 차이? | 세마포어는 **동기화**(접근 개수 제한/신호), select/epoll은 **I/O 준비 감시**. 락이 아니다. 둘이 만나는 곳이 `eventfd`. ([세마포어와 동시성 제어](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20세마포어와%20동시성%20제어.md) 5절) |
| C10K 문제란? | 동시 1만 연결을 스레드/프로세스 per-connection으로 처리하면 비용이 폭증하는 문제. 이벤트 기반(epoll)이 해법. |

## 한 줄 요약
- **select**: 이식성 좋고 단순, **1024 제한 + O(n) + 매번 재설정**. **poll**: 제한 없음, 여전히 **O(n)**. **epoll**: 관심 목록을 **커널에 등록**하고 **준비된 것만 반환**(O(ready)), **LT/ET**, **Linux 전용**.
- 대규모 연결 + 활성 일부 → epoll, 소규모/이식성 → select·poll. 소켓은 **논블로킹 + `EAGAIN` 처리**와 한 세트.

## 관련 문서
- [동기화 — Lock 종류와 세마포어 vs 뮤텍스](기술면접/C/[C%20기술면접]%20동기화%20—%20Lock%20종류와%20세마포어%20vs%20뮤텍스.md)
- [IPC와 공유메모리](기술면접/C/[C%20기술면접]%20IPC와%20공유메모리%20—%20종류·구현·동기화.md)

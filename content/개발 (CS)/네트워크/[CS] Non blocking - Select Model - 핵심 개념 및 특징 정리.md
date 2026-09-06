---
title: "Non blocking / Select Model"
tags: [학습, 개발-CS, 네트워크, 소켓, C]
modified: 2026-09-05
---

# Non blocking / Select Model

> [!NOTE]
> PortScan 프로젝트에서 사용한 Non-blocking 소켓 설정과 `select()` 멀티플렉싱 모델(FD_SET/FD_ISSET) 학습 정리.

## ⚙️ 구현

### 1. Non-blocking
- `ioctlsocket(소켓 파일디스크립터, FIONBIO, &n);`
    - `n` ⇒ nonblocking(=1) / blocking(=0)
    - `u_long n=1` // non blocking

### 2. select
멀티플렉싱 파일디스크립터 생성.

**select 사전 설정**
- `fd_set 읽기모드, 쓰기모드, 예외모드;`
- `FD_ZERO` // 기존 커널 안 배열에 들어가있는 값 초기화 작업
    - `FD_ZERO(&읽기모드);`
    - `FD_ZERO(&쓰기모드);`
    - `FD_ZERO(&예외모드);`
- `FD_SET` // 커널 안 배열에 값 입력 (배열에 넣을 만큼 SET 설정)
    - `FD_SET((u_int)sock_array[k], &read_fds);`
    - `FD_SET((u_int)sock_array[k], &write_fds);`
    - `FD_SET((u_int)sock_array[k], &error_fds);`
- timeout 설정
    - `struct timeval timeout;`
    - `timeout.tv_sec = (초)`
    - `timeout.tv_usec = (mili 초)`

**select 호출**
설정했던 커널 안의 배열 값을 확인:
```c
int ready_fds = select(fd 읽을 개수, &read_fds, &write_fds, &error_fds, &timeout);
```

**FD_ISSET** — 커널 안 배열에 들어있는 값 확인
```c
if (FD_ISSET(sock_array[e], &read_fds) || FD_ISSET(sock_array[e], &write_fds) || FD_ISSET(sock_array[e], &error_fds))
```

> [!WARNING]
> ISSUE 상황
> - `FD_SETSIZE` 값은 64개임
> - 64개를 넘어가면 반복문을 다시 돌려야 함
> - 넘어갈 때와 가기 전에 숫자가 맞지 않으면 무한 루프에 빠짐(주의)
> - → `nsocs = MIN(FD_SETSIZE, PORTS - i);` 이런 식으로 값을 설정하여 문제없이 반복문 진행 필요함

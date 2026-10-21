---
title: "[C 기술면접] IPC와 공유메모리 — 종류·구현·동기화"
description: "IPC 설명과 종류, 구현, 공유메모리가 무엇이고 어떻게 구현·동기화하는지를 C 기술면접 질문에 맞춰 정리했습니다."
tags: [기술면접, C 기술면접, IPC, 공유메모리, 파이프, 메시지 큐, 소켓, mmap, 리눅스]
created: 2026-10-19
modified: 2026-10-19
---

# [C 기술면접] IPC와 공유메모리 — 종류·구현·동기화

> [!NOTE]
> 질문 1(IPC 설명·종류·구현)과 질문 4(공유메모리가 무엇이고 어떻게 구현하는가)를 묶었다. 핵심은 **"프로세스는 주소 공간이 격리돼 있어서, 커널이 제공하는 통로를 거쳐야 데이터를 주고받을 수 있다"** 는 것과, **공유메모리는 가장 빠르지만 동기화를 직접 해야 한다**는 것이다.

---

## Q1. IPC(Inter-Process Communication)란?

### 한 줄 답변
서로 다른 프로세스가 데이터를 주고받거나 실행 순서를 맞추기 위한 **커널 제공 통신·동기화 메커니즘**이다.

### 왜 필요한가
- 프로세스마다 **독립된 가상 주소 공간**을 가져서, 한 프로세스가 다른 프로세스의 변수를 직접 읽을 수 없다(메모리 보호).
- 그래서 커널이 중간에서 통로를 열어 줘야 한다. (스레드는 주소 공간을 공유하므로 IPC가 필요 없고 동기화만 필요하다.)
- 프로세스를 나누는 이유: 장애 격리(한쪽이 죽어도 다른 쪽은 생존), 권한 분리, 모듈 독립 배포, 멀티코어 활용.

### IPC 종류 비교

| 종류 | 방향/형태 | 특징 | 대표 API | 적합한 용도 |
| --- | --- | --- | --- | --- |
| **익명 파이프(pipe)** | 단방향 바이트 스트림 | 부모-자식(공통 조상) 관계에서만, 커널 버퍼(기본 64KB), 읽기/쓰기 블로킹 | `pipe()`, `read/write` | 셸 파이프라인(`a \| b`), 부모-자식 간 간단한 통신 |
| **명명 파이프(FIFO)** | 단방향 바이트 스트림 | 파일 시스템에 이름이 있어 **관계없는 프로세스**도 사용 | `mkfifo()`, `open` | 단순한 프로세스 간 스트림 |
| **메시지 큐** | 메시지 단위(경계 보존) | 타입별 수신 가능, 커널이 큐 유지 | System V: `msgget/msgsnd/msgrcv/msgctl`, POSIX: `mq_open/mq_send/mq_receive` | 비동기 메시지 전달, 우선순위 처리 |
| **공유메모리** | 메모리 직접 공유 | **가장 빠름**(복사·시스템 콜 없음), 동기화는 직접 | System V: `shmget/shmat`, POSIX: `shm_open + mmap` | 대용량·고빈도 데이터 공유 |
| **세마포어** | 동기화 도구 | 데이터 전달이 아니라 접근 순서/개수 제어 | `semget/semop`, `sem_open/sem_wait/sem_post` | 공유메모리 보호, 자원 제한 |
| **소켓(Unix domain / TCP)** | 양방향 스트림/데이터그램 | 같은 호스트(UDS)와 **다른 호스트(TCP/UDP)** 모두 가능 | `socket/bind/listen/accept/connect` | 서버-클라이언트, 네트워크 분산 |
| **시그널** | 비동기 알림 | 데이터는 거의 못 실음(번호만), 신호 종류 제한 | `kill`, `sigaction` | 종료·재로드 통지 |
| **파일 / mmap 파일** | 파일 기반 | 영속적, 느림 | `open`, `mmap` | 설정·영속 데이터 공유 |
| **eventfd 등** | 카운터/이벤트 fd | `epoll`과 함께 사용 가능 | `eventfd` | 이벤트 루프에서 신호 전달 |

### 선택 기준
```
같은 호스트 · 대용량 · 최고 성능           → 공유메모리 + 동기화(세마포어/뮤텍스)
메시지 경계가 중요하고 비동기 전달          → 메시지 큐
단순한 부모-자식 스트림                    → 파이프
다른 호스트로 확장 가능성, 양방향 요청/응답   → 소켓(Unix domain socket은 같은 호스트에서 TCP보다 빠름)
단순 통지                                  → 시그널(데이터가 필요하면 다른 방식)
```

### 구현 예시 1) 파이프 (부모 → 자식)
```c
#include <unistd.h>
#include <stdio.h>
#include <string.h>
#include <sys/wait.h>

int main(void) {
    int fd[2];                          /* fd[0]=읽기, fd[1]=쓰기 */
    if (pipe(fd) == -1) { perror("pipe"); return 1; }

    pid_t pid = fork();
    if (pid == 0) {                     /* 자식: 읽기 */
        close(fd[1]);                   /* 안 쓰는 쪽은 반드시 닫는다 */
        char buf[64];
        ssize_t n = read(fd[0], buf, sizeof(buf) - 1);
        if (n > 0) { buf[n] = '\0'; printf("child got: %s\n", buf); }
        close(fd[0]);
        _exit(0);
    }
    close(fd[0]);                       /* 부모: 쓰기 */
    const char *msg = "hello";
    write(fd[1], msg, strlen(msg));
    close(fd[1]);                       /* 닫아야 자식의 read가 EOF를 받는다 */
    waitpid(pid, NULL, 0);              /* 좀비 방지 */
    return 0;
}
```
- 안 쓰는 끝을 닫지 않으면 `read`가 EOF를 못 받아 영원히 블로킹될 수 있다(자주 하는 실수).

### 구현 예시 2) System V 메시지 큐
```c
struct msgbuf_t { long mtype; char mtext[128]; };

key_t key = ftok("/tmp/app", 'A');                 /* 두 프로세스가 같은 key 사용 */
int qid = msgget(key, IPC_CREAT | 0666);

/* 송신 */
struct msgbuf_t m = { .mtype = 1 };
strcpy(m.mtext, "hello");
msgsnd(qid, &m, sizeof(m.mtext), 0);

/* 수신: mtype==1인 메시지만 */
msgrcv(qid, &m, sizeof(m.mtext), 1, 0);

/* 삭제 (안 지우면 커널에 남는다: ipcs / ipcrm 으로 확인) */
msgctl(qid, IPC_RMID, NULL);
```
→ 자세한 API: [메시지 큐 API](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20메시지%20큐%20API%20%28msgget·msgsnd·msgrcv·msgctl%29.md)

### 구현 예시 3) Unix domain socket 서버 (요지)
```c
int s = socket(AF_UNIX, SOCK_STREAM, 0);
struct sockaddr_un a = { .sun_family = AF_UNIX };
strncpy(a.sun_path, "/tmp/app.sock", sizeof(a.sun_path) - 1);
unlink(a.sun_path);
bind(s, (struct sockaddr*)&a, sizeof(a));
listen(s, 16);
int c = accept(s, NULL, NULL);       /* 이후 read/write */
```

### 꼬리 질문
| 질문 | 답변 요지 |
| --- | --- |
| IPC 자원이 프로세스 종료 후에도 남나? | System V IPC(메시지 큐·세마포어·공유메모리)는 **명시적으로 삭제하지 않으면 커널에 남는다.** `ipcs`로 확인하고 `ipcrm`/`*ctl(IPC_RMID)`로 정리. 파이프·소켓 fd는 프로세스 종료 시 닫힌다. |
| System V vs POSIX IPC? | System V: 오래된 표준, key 기반(`ftok`), API가 복잡. POSIX: 이름 기반(`/name`), 파일 디스크립터 스타일에 가깝고 API가 단순. 신규 개발은 POSIX 선호, 레거시는 System V가 많다. |
| 파이프 vs 소켓? | 파이프는 단방향·같은 호스트·관계 필요(익명). 소켓은 양방향, 관계없는 프로세스·원격 호스트도 가능. |
| 메시지 큐 vs 파이프? | 메시지 큐는 **메시지 경계**가 보존되고 타입/우선순위 선택 수신이 가능. 파이프는 경계 없는 바이트 스트림. |
| IPC로 대량 데이터 전달 시 성능이 병목이면? | 파이프/메시지 큐/소켓은 **커널 복사 2회**(유저→커널→유저)와 시스템 콜 비용이 있다. 공유메모리는 복사 없이 같은 물리 페이지를 공유한다. |
| IPC와 스레드 간 통신 차이? | 스레드는 같은 주소 공간이라 전역 변수·힙을 직접 공유(빠르지만 경쟁 조건 위험). 프로세스는 격리가 장점이지만 IPC 비용이 든다. ([IPC와 스레드 메모리 공유 비교](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20IPC와%20스레드%20메모리%20공유%20비교.md)) |

---

## Q4. 공유메모리란? 어떻게 구현하나?

### 한 줄 답변
서로 다른 프로세스의 가상 주소 공간에 **같은 물리 메모리 페이지를 매핑**해, 복사 없이 같은 데이터를 읽고 쓰게 하는 IPC다.

### 구조
```
프로세스 A 가상 주소 0x7f00... ─┐
                                ├──→ 같은 물리 메모리(공유 세그먼트)
프로세스 B 가상 주소 0x7e90... ─┘     (가상 주소는 서로 달라도 됨)
```
- **장점**: 가장 빠르다(데이터 복사·시스템 콜 없음).
- **단점**: 커널이 **동기화를 해 주지 않는다.** 경쟁 조건, 일관성, 프로세스 사망 시 락 해제 문제를 직접 해결해야 한다.

### 구현 방법 A) System V 공유메모리
```c
#include <sys/ipc.h>
#include <sys/shm.h>

struct shared { int count; char buf[256]; };

key_t key = ftok("/tmp/app", 'S');
int shmid = shmget(key, sizeof(struct shared), IPC_CREAT | 0666);   /* 생성/열기 */
struct shared *p = shmat(shmid, NULL, 0);                            /* 내 주소 공간에 붙이기 */
if (p == (void *)-1) { perror("shmat"); }

p->count++;                       /* 직접 읽고 쓰기 (동기화 필요!) */

shmdt(p);                         /* 떼어내기 */
shmctl(shmid, IPC_RMID, NULL);    /* 삭제 예약: 마지막 detach 후 제거 (한 곳에서만 호출) */
```

### 구현 방법 B) POSIX 공유메모리 + mmap (권장)
```c
#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>

int fd = shm_open("/my_shm", O_CREAT | O_RDWR, 0666);    /* /dev/shm/my_shm */
ftruncate(fd, sizeof(struct shared));                    /* 크기 지정(필수) */
struct shared *p = mmap(NULL, sizeof(*p), PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
close(fd);                                               /* 매핑 후 fd는 닫아도 됨 */

/* ... 사용 ... */

munmap(p, sizeof(*p));
shm_unlink("/my_shm");                                   /* 이름 제거 (마지막에 한 번) */
```
- 링크 시 `-lrt`가 필요한 환경이 있다(glibc 2.34 이전).
- `MAP_SHARED`여야 다른 프로세스와 변경이 공유된다. `MAP_PRIVATE`는 copy-on-write로 공유되지 않는다.
- 부모-자식 간이면 `MAP_SHARED | MAP_ANONYMOUS`로 `fork` 전에 매핑해도 된다.

### 반드시 알아야 할 동기화
공유메모리 단독으로는 **race condition**이 생긴다(`count++`도 읽기→더하기→쓰기).

| 방법 | 설명 |
| --- | --- |
| **프로세스 공유 뮤텍스** | `pthread_mutex_t`를 공유메모리 안에 두고 `PTHREAD_PROCESS_SHARED` 지정. 소유자 사망 대비 `PTHREAD_MUTEX_ROBUST` |
| **세마포어** | System V(`semop`, `SEM_UNDO`로 사망 시 복구) 또는 POSIX(`sem_t` pshared) |
| **원자 연산** | 카운터·플래그는 `__atomic_*`/C11 atomic으로 락 없이 |
| **락-프리 링 버퍼** | 단일 생산자/단일 소비자(SPSC)라면 인덱스만 원자적으로 갱신 |

```c
struct shared {
    pthread_mutex_t lock;        /* 값으로 포함 (포인터 X) */
    int count;
};
/* 생성자만 1번 초기화 */
pthread_mutexattr_t a;
pthread_mutexattr_init(&a);
pthread_mutexattr_setpshared(&a, PTHREAD_PROCESS_SHARED);
pthread_mutexattr_setrobust(&a, PTHREAD_MUTEX_ROBUST);
pthread_mutex_init(&p->lock, &a);
```

### 공유메모리 설계 시 함정
| 함정 | 설명과 대응 |
| --- | --- |
| **포인터를 저장하면 안 됨** | 가상 주소가 프로세스마다 다르다. 구조체 안에서는 **오프셋/인덱스**를 쓴다. |
| 구조체 레이아웃 불일치 | 패딩·정렬이 모든 프로세스에서 같아야 한다(같은 헤더, 같은 컴파일 옵션). 가변 길이 타입(`long`, `size_t`) 주의, 고정폭 타입(`uint32_t`) 권장 |
| 락 보유 중 프로세스 사망 | 영원히 대기 → robust mutex(`EOWNERDEAD`) 또는 `SEM_UNDO` |
| 초기화 경쟁 | 누가 먼저 생성/초기화하는지 정해야 한다(생성자 1개, 또는 `O_EXCL` 로 생성 성공한 쪽이 초기화) |
| 자원 누수 | `shm_unlink`/`IPC_RMID` 누락 시 `/dev/shm` 또는 `ipcs`에 잔존 |
| 읽기만 해도 위험 | 여러 필드를 읽는 도중 쓰기가 일어나면 torn read → 락 또는 시퀀스 번호(seqlock) |
| 캐시 일관성/메모리 순서 | 원자 연산·메모리 배리어 없이 플래그로만 동기화하면 재배치로 깨질 수 있다 |

### 꼬리 질문
| 질문 | 답변 요지 |
| --- | --- |
| 공유메모리가 왜 가장 빠른가? | 데이터 복사와 시스템 콜이 없다. 초기 매핑 이후에는 일반 메모리 접근과 같다. |
| `mmap`과 공유메모리의 관계? | 공유메모리는 `mmap(MAP_SHARED)`로 구현된다. 파일을 매핑하면 파일 기반 공유(영속), `shm_open` 객체를 매핑하면 메모리 기반 공유. |
| System V 공유메모리 삭제 시점? | `IPC_RMID`는 "삭제 예약"이다. attach된 프로세스가 모두 detach해야 실제로 제거된다. |
| 공유메모리 + 세마포어 대신 메시지 큐를 쓰는 경우? | 동기화와 경계가 필요한 소량 메시지는 큐가 간단하다. 대용량·고빈도는 공유메모리. |
| 스레드의 전역 변수와 뭐가 다른가? | 스레드는 같은 주소 공간이라 포인터를 그대로 공유할 수 있다. 프로세스 간 공유메모리는 가상 주소가 달라 포인터를 못 쓴다. |

## 관련 문서
- [공유메모리 한눈에 보기(허브)](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20공유메모리%20한눈에%20보기%20—%20가상%20주소%20공간·mmap·세그먼트·락%20허브.md)
- [공유메모리 동시성 — 락 선택과 프로세스 간 함정](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20공유메모리%20동시성%20—%20락%20선택과%20프로세스%20간%20함정.md)
- [System V IPC 개념](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20System%20V%20IPC%20개념%20%28메시지%20큐·세마포어·공유메모리%29.md)
- [동기화 — Lock 종류와 세마포어 vs 뮤텍스](기술면접/C/[C%20기술면접]%20동기화%20—%20Lock%20종류와%20세마포어%20vs%20뮤텍스.md)

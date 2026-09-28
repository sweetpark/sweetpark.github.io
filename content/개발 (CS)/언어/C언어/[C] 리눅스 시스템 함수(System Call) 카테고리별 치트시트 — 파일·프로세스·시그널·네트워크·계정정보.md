---
title: "리눅스 시스템 함수(System Call) 카테고리별 치트시트 — 파일·프로세스·시그널·네트워크·계정정보"
tags: [학습, 개발-CS, 언어, C언어, 시스템콜, POSIX, 리눅스, 시스템프로그래밍]
created: 2026-09-28
modified: 2026-09-28
---

# 리눅스 시스템 함수(System Call) 카테고리별 치트시트 — 파일·프로세스·시그널·네트워크·계정정보

> [!NOTE]
> "시스템 함수"는 두 가지를 가리킬 수 있다. `stdlib.h`의 `system()`(쉘을 띄워 명령어 한 줄 실행)과, 커널 기능을 직접 호출하는 **시스템 콜(system call)** 함수들. 실무 시스템/서버 프로그래밍에서 실제로 쓰는 건 대부분 후자다. 카테고리별로 자주 쓰는 것만 모으고, 이미 깊게 다룬 항목은 해당 노트로 링크한다.

## 0. `system()` — 쉘 명령어 실행 (지양 대상)

```c
#include <stdlib.h>
system("ls -la");    /* Linux: /bin/sh 를 띄워 명령어 실행 */
system("pause");     /* Windows: cmd.exe */
```

내부적으로 `fork` + `exec` + 쉘 파싱을 거치므로 오버헤드가 크고, **사용자 입력을 그대로 문자열에 이어붙여 넘기면 명령어 삽입(Command Injection)** 으로 이어진다. 간단한 스크립트·프로토타입 외에는 프로덕션 코드에서 지양하고, 아래 카테고리의 시스템 콜을 직접 쓰는 게 표준이다.

## 1. 파일 I/O — 파일 디스크립터 기반

`fopen`/`fread`(표준 C 라이브러리, 사용자 공간 버퍼링)와 달리, 커널이 관리하는 **파일 디스크립터(fd)** 를 직접 다룬다.

| 함수 | 헤더 | 설명 |
| --- | --- | --- |
| `open()` | `<fcntl.h>` | 파일 열기/생성, `O_RDONLY`/`O_NONBLOCK` 등 플래그 |
| `close()` | `<unistd.h>` | fd 닫기 |
| `read()` / `write()` | `<unistd.h>` | 데이터 읽기/쓰기, 반환값 = 실제 처리 바이트 수 |
| `lseek()` | `<unistd.h>` | 읽기/쓰기 오프셋 이동 |
| `fcntl()` | `<fcntl.h>` | fd 플래그 조회·변경(`O_NONBLOCK` 런타임 설정 등) |
| `dup()` / `dup2()` | `<unistd.h>` | fd 복제·리다이렉션(파이프와 자주 짝지어 씀) |
| `stat()` / `fstat()` / `lstat()` | `<sys/stat.h>` | 파일 크기·권한·타입 등 메타데이터 조회 |
| `access()` | `<unistd.h>` | 파일 존재·권한 여부만 확인 |
| `ioctl()` | `<sys/ioctl.h>` | 디바이스/드라이버 특수 제어 |

`read`/`write`가 요청한 크기보다 적게 처리하고 리턴하는 **short read/write**는 정상 케이스이므로 루프로 감싸 채워야 한다는 점, `EAGAIN`/`EWOULDBLOCK`을 에러로 오판하면 안 된다는 점은 [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)의 A2·A3에서 다룬다.

## 2. 프로세스 제어

| 함수 | 헤더 | 설명 |
| --- | --- | --- |
| `fork()` | `<unistd.h>` | 현재 프로세스를 그대로 복제해 자식 프로세스 생성 |
| `exec` 계열(`execvp`, `execl` 등) | `<unistd.h>` | 현재 프로세스 메모리를 새 프로그램으로 덮어써서 실행 |
| `wait()` / `waitpid()` | `<sys/wait.h>` | 자식 종료를 대기하고 종료 코드 수거(안 하면 좀비 프로세스) |
| `exit()` / `_exit()` | `<stdlib.h>` / `<unistd.h>` | 정상 종료(`atexit` 핸들러 실행) / 즉시 종료(정리 없음) |
| `getpid()` / `getppid()` | `<unistd.h>` | 현재 PID / 부모 PID 조회 |
| `setsid()` | `<unistd.h>` | 새 세션의 리더가 되어 제어 터미널과 분리(데몬화 1단계) |

`fork`+`exec`+`waitpid` 조합과 데몬화(포크·`setsid`·표준 입출력 재배치) 전체 흐름은 [4. 데몬 골격 — 순수 POSIX main 초기화·시그널·스레드·폴링루프](c코드%20템플릿/4.%20데몬%20골격%20—%20순수%20POSIX%20main%20초기화·시그널·스레드·폴링루프.md)에 실전 코드로 정리돼 있다.

## 3. 메모리 제어

| 함수 | 헤더 | 설명 |
| --- | --- | --- |
| `mmap()` | `<sys/mman.h>` | 파일을 메모리에 매핑하거나 대용량 익명 메모리 할당 |
| `munmap()` | `<sys/mman.h>` | 매핑 해제 |
| `mprotect()` | `<sys/mman.h>` | 매핑된 영역의 읽기/쓰기/실행 권한 변경 |
| `brk()` / `sbrk()` | `<unistd.h>` | 힙 영역 크기 조절 — `malloc`이 내부적으로 쓰는 저수준 함수 |

일반 `malloc`보다 정렬·페이지 경계가 중요한 상황은 [메모리 정렬(Memory Alignment)과 aligned_alloc]([C]%20메모리%20정렬(Memory%20Alignment)과%20aligned_alloc%20—%20CPU%20워드%20경계와%20안전한%20할당%20래퍼.md)에서 다룬다.

## 4. 시그널 제어

| 함수 | 헤더 | 설명 |
| --- | --- | --- |
| `sigaction()` | `<signal.h>` | 시그널 핸들러 등록 — 플랫폼 의존적인 `signal()` 대신 항상 이걸 쓴다 |
| `kill()` | `<signal.h>` | 특정 프로세스에 시그널 전송(이름과 달리 종료 전용이 아니다) |
| `raise()` | `<signal.h>` | 자기 자신에게 시그널 전송 |
| `alarm()` | `<unistd.h>` | 지정한 초 뒤 `SIGALRM` 발생 |
| `sigprocmask()` | `<signal.h>` | 특정 시그널을 일시적으로 블록/해제 |

핸들러 안에서는 `malloc`/`free`/`printf` 등을 부르면 안 되고(async-signal-safe 함수만 허용), 플래그 하나만 `volatile sig_atomic_t`로 건드린 뒤 메인 루프가 그걸 주기적으로 확인하는 패턴이 표준이다 — [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)의 A4, 실제 `sigaction` 등록 코드는 [4. 데몬 골격](c코드%20템플릿/4.%20데몬%20골격%20—%20순수%20POSIX%20main%20초기화·시그널·스레드·폴링루프.md) 참고.

## 5. 네트워크 및 IPC

| 함수 | 헤더 | 설명 |
| --- | --- | --- |
| `pipe()` | `<unistd.h>` | 부모-자식 간 단방향 통로 생성 |
| `mkfifo()` | `<sys/stat.h>` | 이름 있는 파이프(FIFO) — 관계없는 프로세스 간 통신 |
| `socket()` | `<sys/socket.h>` | 통신 엔드포인트 생성 |
| `bind()` / `listen()` / `accept()` | `<sys/socket.h>` | 서버 측 주소 바인딩·연결 대기·수락 |
| `connect()` | `<sys/socket.h>` | 클라이언트 측 접속 |
| `send()` / `recv()` | `<sys/socket.h>` | 소켓 데이터 송수신 |
| `select()` / `poll()` / `epoll_*()` | `<sys/select.h>` 등 | 여러 fd를 동시에 감시 |

소켓 통신 기본기는 [(TCP_IP) Socket 통신 - 핵심 개념 및 특징 정리]([TCP_IP]%20Socket%20통신%20-%20핵심%20개념%20및%20특징%20정리.md), fd가 몇 개일 때 무엇을 쓸지는 [select()]([C]%20select()%20—%20여러%20입력과%20타임아웃%20함께%20기다리기.md)·[epoll]([C]%20epoll%20—%20fd가%20많아질%20때의%20대안.md)에서 비교한다.

## 6. 시간 및 지연

| 함수 | 헤더 | 설명 |
| --- | --- | --- |
| `sleep()` / `usleep()` / `nanosleep()` | `<unistd.h>` / `<time.h>` | 초/마이크로초/나노초 단위 대기 |
| `clock_gettime()` | `<time.h>` | 나노초 단위 정밀한 시스템/CPU 시간 측정 |
| `gettimeofday()` | `<sys/time.h>` | 마이크로초 단위 현재 시각(레거시, `clock_gettime` 권장) |
| `timerfd_create()` | `<sys/timerfd.h>` | 타이머를 fd로 다뤄 `epoll`과 함께 감시 |

요청 처리 경로에 raw `sleep()`을 넣으면 종료 신호를 즉시 못 알아챈다는 점(A8), 시각 값을 다룰 때의 오버플로 함정은 [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)와 [64비트 time_t와 32비트 int 변환]([C]%2064비트%20time_t와%2032비트%20int%20변환%20—%202038년%20문제와%20Coverity%20정적%20분석%20대응.md)에서 다룬다. 타임아웃을 "등록→취소→만료" 라이프사이클로 관리하는 패턴은 [비동기 요청-응답의 타임아웃 감시]([C]%20비동기%20요청-응답의%20타임아웃%20감시%20—%20Check-in과%20Check-out%20타이머%20패턴.md) 참고.

## 7. 사용자·계정·시스템 정보

### 7-1. `getlogin()` vs `getlogin_r()` — `_r` 접미사의 의미

POSIX 함수 이름 끝의 **`_r`은 Reentrant(재진입 가능, 스레드 안전)** 를 뜻한다.

```c
char *getlogin(void);                      /* 구버전 — 내부 정적 버퍼 주소를 반환 */
int   getlogin_r(char *buf, size_t bufsize); /* 신버전 — caller가 버퍼를 준비 */
```

`getlogin()`은 라이브러리 내부의 `static` 버퍼를 반환하기 때문에, 여러 스레드가 동시에 호출하면 서로의 결과를 덮어쓴다(thread-unsafe). `getlogin_r()`은 [동적 할당 소유권]([C]%20동적%20할당%20소유권%20—%20caller%20free%20vs%20callee%20create·destroy%20쌍.md)에서 정리한 **"패턴 1: caller가 버퍼를 준비하고 callee는 채우기만 한다"** 그대로다 — 각 스레드가 자기 버퍼를 넘기므로 안전하다.

```c
#include <unistd.h>
#include <limits.h>

char username[LOGIN_NAME_MAX];              /* caller가 스택에 버퍼 할당 */
if (getlogin_r(username, sizeof(username)) == 0) {
    printf("로그인 사용자: %s\n", username);
} else {
    perror("getlogin_r 실패");
}
```

> [!WARNING]
> `getlogin_r()`은 프로세스에 연결된 **제어 터미널(TTY)** 기준으로 사용자명을 찾는다. 데몬·`cron` 작업·터미널이 없는 환경에서는 `ENOTTY`로 실패한다. 그래서 실무에서는 터미널 여부와 무관하게 항상 동작하는 `getpwuid_r(geteuid(), ...)`를 함께 쓰는 경우가 많다.

### 7-2. 계정·시스템 정보 함수 모음

| 함수 | 헤더 | 설명 |
| --- | --- | --- |
| `getuid()` / `geteuid()` | `<unistd.h>` | 실제/유효 사용자 ID(UID) 조회 |
| `getgid()` / `getegid()` | `<unistd.h>` | 실제/유효 그룹 ID(GID) 조회 |
| `getpwuid_r()` | `<pwd.h>` | UID로 사용자 상세 정보(홈 디렉터리, 기본 쉘 등) 조회 — thread-safe, 터미널 불필요 |
| `gethostname()` | `<unistd.h>` | 현재 호스트의 네트워크 이름 조회 |
| `uname()` | `<sys/utsname.h>` | OS 이름·커널 버전·아키텍처 조회 |
| `getenv()` / `setenv()` / `unsetenv()` | `<stdlib.h>` | 환경 변수 읽기/설정/삭제 |

## 8. 에러 처리 — 시스템 콜과 항상 붙어 다니는 것들

| 함수 | 헤더 | 설명 |
| --- | --- | --- |
| `errno` | `<errno.h>` | 마지막 실패의 에러 코드(스레드별 값). 실패 즉시 확인해야 함 |
| `perror()` | `<stdio.h>` | `"prefix: " + strerror(errno)` 를 stderr에 출력 |
| `strerror()` / `strerror_r()` | `<string.h>` | 에러 코드를 문자열로 변환(단일/스레드 안전 버전) |

시스템 콜은 실패 시 대부분 `-1`을 반환하고 `errno`를 세팅하는데, **성공한 다음 호출도 `errno`를 바꿀 수 있어 한 줄만 미뤄도 엉뚱한 값을 읽게 된다** — 자세한 원칙은 [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)의 A2 참고.

## 9. Windows 네이티브 대응 (참고)

위 목록은 POSIX(Linux/macOS) 기준이다. Windows 전용 환경에서는 Win32 API가 대응한다.

| POSIX | Windows |
| --- | --- |
| `fork` + `exec` | `CreateProcess()` |
| `open`/`read`/`write`/`close` | `CreateFile()`/`ReadFile()`/`WriteFile()`/`CloseHandle()` |
| `sleep()` | `Sleep()` |
| `getlogin_r()` | `GetUserName()` |
| `uname()` | `GetVersionEx()` / `GetNativeSystemInfo()` |

## 관련 문서

- [동적 할당 소유권 — caller free vs callee create·destroy 쌍]([C]%20동적%20할당%20소유권%20—%20caller%20free%20vs%20callee%20create·destroy%20쌍.md) — `getlogin_r()`이 따르는 "caller가 버퍼를 준비하는" 패턴의 근거
- [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md) — 반환값 체크, `EAGAIN`, 시그널 플래그 타입 등 시스템 콜을 쓸 때 지켜야 할 관례
- [select() — 여러 입력과 타임아웃 함께 기다리기]([C]%20select()%20—%20여러%20입력과%20타임아웃%20함께%20기다리기.md)
- [epoll — fd가 많아질 때의 대안]([C]%20epoll%20—%20fd가%20많아질%20때의%20대안.md)
- [(TCP_IP) Socket 통신 - 핵심 개념 및 특징 정리]([TCP_IP]%20Socket%20통신%20-%20핵심%20개념%20및%20특징%20정리.md)
- [4. 데몬 골격 — 순수 POSIX main 초기화·시그널·스레드·폴링루프](c코드%20템플릿/4.%20데몬%20골격%20—%20순수%20POSIX%20main%20초기화·시그널·스레드·폴링루프.md)

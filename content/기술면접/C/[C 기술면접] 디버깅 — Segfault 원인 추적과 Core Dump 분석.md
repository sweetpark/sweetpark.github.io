---
title: "[C 기술면접] 디버깅 — Segfault 원인 추적과 Core Dump 분석"
tags: [기술면접, C 기술면접, segfault, SIGSEGV, core dump, gdb, AddressSanitizer, valgrind, 디버깅]
created: 2026-10-19
modified: 2026-10-19
---

# [C 기술면접] 디버깅 — Segfault 원인 추적과 Core Dump 분석

> [!NOTE]
> 질문 8: **Segmentation fault가 났을 때 어떻게 디버깅하는가? (추가로 core dump 보는 방법)**
> 핵심 흐름은 **① 어디서 죽었나(호출 스택) → ② 왜 죽었나(잘못된 주소·값) → ③ 근본 원인은 어디서 만들어졌나(그 전의 메모리 오염) → ④ 재발 방지(도구·테스트)** 이다. 크래시 지점은 *증상*이고, 원인은 훨씬 앞에 있는 경우가 많다.

---

## 1. Segmentation Fault란
- 프로세스가 **접근 권한이 없거나 매핑되지 않은 메모리**에 접근하려 하면 MMU가 예외를 발생시키고, 커널이 프로세스에 **`SIGSEGV`(11)** 를 보낸다. 기본 동작은 종료 + core dump 생성(설정된 경우).
- `SIGBUS`(정렬 위반, 매핑된 파일 범위 밖), `SIGABRT`(`abort()`/`assert`/glibc의 힙 손상 감지)와 구분한다.

### 주요 원인
| 원인 | 예 |
| --- | --- |
| **NULL 포인터 역참조** | `p = NULL; *p = 1;` / `malloc` 실패 미확인 |
| **초기화 안 된(wild) 포인터** | `int *p; *p = 1;` |
| **댕글링 포인터 / use-after-free** | `free(p)` 후 사용, 해제된 지역 변수 주소 반환 |
| **버퍼 오버플로우 / 배열 범위 초과** | `char buf[8]; strcpy(buf, long_string);` → 스택/힙 오염, 리턴 주소 파괴 |
| **이중 해제(double free)** / 잘못된 `free` | 힙 메타데이터 손상 → 이후 `malloc/free`에서 크래시 |
| **스택 오버플로우** | 무한/깊은 재귀, 큰 지역 배열(`char big[10MB]`) |
| **읽기 전용 메모리에 쓰기** | `char *s = "abc"; s[0] = 'x';` (문자열 리터럴은 `.rodata`) |
| **잘못된 포인터 캐스팅/정렬** | 구조체/함수 포인터 오용, 잘못된 `printf` 포맷(`%s`에 정수) |
| **함수 포인터가 NULL/쓰레기** | 콜백 미등록 호출 |
| **멀티스레드 경쟁** | 한 스레드가 해제한 객체를 다른 스레드가 사용 |

---

## 2. 디버깅 절차 (면접용 답변 골격)

```
1) 재현 확인 · 환경 파악       : 입력/시점/빈도, 항상 같은 위치인가? (같은 위치 → 직접 원인, 매번 다른 위치 → 메모리 오염 의심)
2) 디버그 빌드                 : -g -O0 로 빌드 (최적화 켜면 변수/라인 정보가 어긋남)
3) 어디서 죽었나               : gdb 로 실행하거나 core dump 로 bt (백트레이스)
4) 무슨 값 때문인가            : 죽은 프레임의 포인터/인덱스/길이 출력 (NULL? 0xdeadbeef? 해제된 주소?)
5) 어디서 잘못 만들어졌나       : AddressSanitizer / Valgrind 로 최초 오염 지점 확인
6) 수정 + 재발 방지            : 경계 검사, NULL 검사, 소유권 정리, 테스트·ASan CI
```

### (1) gdb로 직접 실행
```bash
gcc -g -O0 -Wall -Wextra -o app app.c
gdb ./app
(gdb) run <args>          # 크래시하면 그 자리에서 멈춤
(gdb) bt                  # 호출 스택
(gdb) frame 1             # 의심 프레임으로 이동
(gdb) info locals         # 지역 변수
(gdb) print ptr           # 값 확인 (0x0 인가?)
(gdb) print *ptr          # 역참조 (죽을 수 있음)
(gdb) print arr[i]        # 인덱스 범위 확인
(gdb) x/16xb buf          # 메모리 덤프
(gdb) list                # 해당 소스 줄 주변
(gdb) watch var           # 값이 바뀌는 순간 멈춤 (메모리 오염 추적)
```
- **`watch`** 가 오염 추적에 강력하다: 오염되는 변수에 걸어 두면 누가 바꿨는지 그 순간 잡힌다.
- `break` + `run`을 반복해 크래시 직전을 좁히거나, `catch signal SIGSEGV`로 시그널 지점에서 멈출 수 있다.

### (2) AddressSanitizer (ASan) — 가장 빠르게 원인을 알려 줌
```bash
gcc -g -O1 -fsanitize=address -fno-omit-frame-pointer -o app app.c
./app
```
- 힙/스택/전역 **버퍼 오버플로우, use-after-free, double free, 스택 사용 후 반환(use-after-return 옵션)** 을 **발생 즉시** 스택트레이스와 함께 보고한다. (할당 위치/해제 위치까지 출력)
- 속도 약 2배 저하, 메모리 증가 → 디버그/CI 빌드에 상시 사용 권장.
- 멀티스레드 경쟁은 `-fsanitize=thread`(TSan), 정의되지 않은 동작은 `-fsanitize=undefined`(UBSan). ASan과 TSan은 **동시에 못 쓴다.**

### (3) Valgrind (memcheck)
```bash
valgrind --leak-check=full --track-origins=yes ./app
```
- 재컴파일 없이 가능(디버그 심볼 있으면 더 좋음). `Invalid read/write of size N`, 미초기화 값 사용, 누수를 보고한다. 매우 느리다.

### (4) 시스템 로그로 단서 찾기 — `dmesg`
```
app[1234]: segfault at 0 ip 000055d1c3a0113d sp 00007ffc... error 6 in app[55d1c3a01000+1000]
```
| 필드 | 의미 |
| --- | --- |
| `at 0` | 접근하려 한 주소 → `0`이면 NULL 역참조 |
| `ip` | 크래시한 명령 주소. `addr2line -e app -f <ip - 로드베이스>` 로 소스 줄 확인 |
| `error 6` | 비트: bit0=0 매핑 없음/1 권한 위반, bit1=1 쓰기, bit2=1 유저 모드. **4**=유저 읽기(매핑 없음), **6**=유저 쓰기(매핑 없음), **7**=유저 쓰기(권한 위반: 읽기 전용에 쓰기 등) |
| `in app[...]` | 어느 바이너리/라이브러리에서 죽었는가(라이브러리 안이면 호출자가 잘못된 인자를 넘겼을 가능성) |

### (5) 도구 보강
| 도구 | 용도 |
| --- | --- |
| `addr2line`, `objdump -d -S`, `nm` | 주소→소스 줄/함수, 어셈블리 확인 |
| `ltrace`, `strace` | 라이브러리/시스템 콜 추적 |
| `-Wall -Wextra -Werror`, 정적 분석(`clang-tidy`, `cppcheck`, Coverity) | 컴파일 단계에서 NULL 가능성, 미초기화, 범위 초과 등을 사전 탐지 |
| `-fstack-protector`, `_FORTIFY_SOURCE=2` | 스택 스매싱/버퍼 함수 오용 완화 |
| glibc `MALLOC_CHECK_=3`, `MALLOC_PERTURB_` | 힙 손상 조기 탐지, 해제 메모리 쓰레기 채우기 |
| `ulimit -s` / 재귀 깊이 확인 | 스택 오버플로우 의심 시 |

---

## 3. Core Dump 보는 방법

> core dump는 크래시 **순간의 메모리·레지스터 스냅샷**이다. 재현이 어려운 운영 장애에서 사후에 호출 스택과 변수 값을 그대로 볼 수 있다.

### 3.1 생성되도록 설정
```bash
ulimit -c                    # 0 이면 비활성
ulimit -c unlimited          # 현재 셸(및 자식)에서 활성화
cat /proc/sys/kernel/core_pattern     # 저장 위치/방식 확인
```
| `core_pattern` 값 | 의미 |
| --- | --- |
| `core` / `core.%p` | 크래시한 프로세스의 **현재 작업 디렉터리**에 파일 생성 (`%p`=PID) |
| `\|/usr/lib/systemd/systemd-coredump ...` | **systemd-coredump**가 수집 → `coredumpctl`로 조회 |
- 서비스(systemd 유닛)는 셸의 `ulimit`을 상속하지 않는다 → 유닛에 `LimitCORE=infinity`.
- 컨테이너는 `core_pattern`이 **호스트 설정**을 따르므로 컨테이너 안에서 파일이 안 보일 수 있다.
- 코드로 설정: `setrlimit(RLIMIT_CORE, ...)`.
- 실행 중인 프로세스의 스냅샷만 뜨고 싶다면 `gcore <PID>`(죽이지 않고 core 생성).

### 3.2 분석
```bash
# 전통적인 core 파일
gdb ./app core.1234

# systemd-coredump 환경
coredumpctl list
coredumpctl gdb <PID 또는 실행파일명>
coredumpctl dump <PID> -o /tmp/app.core
```
gdb에서 가장 먼저:
```
(gdb) bt                        # 크래시 시점 호출 스택  ← 가장 먼저
(gdb) bt full                   # + 각 프레임 지역 변수
(gdb) frame N / info locals / print ptr
(gdb) info registers            # 레지스터 (fault 주소 확인)
(gdb) thread apply all bt       # 멀티스레드: 모든 스레드의 스택
(gdb) info threads
(gdb) x/20xw $sp                # 스택 메모리 덤프
(gdb) p $_siginfo._sifields._sigfault.si_addr    # 접근하려던 주소(SIGSEGV)
```
**최소 예시**
```
(gdb) bt
#0  strcpy_internal () from libc.so.6
#1  copy_name (dst=0x0, src=0x7ffe... "hello") at main.c:12
#2  main () at main.c:20
(gdb) frame 1
(gdb) print dst
$1 = 0x0          ← NULL 포인터 역참조가 원인
```

### 3.3 core 분석이 실패하는 흔한 이유
| 증상 | 원인 | 대응 |
| --- | --- | --- |
| `bt`가 `?? ()`만 출력 | `-g` 없음 / `strip`된 바이너리 | 디버그 심볼 포함 빌드 보관(`-g`), 배포용은 `objcopy --only-keep-debug`로 심볼 분리 보관 |
| 스택/변수가 엉뚱함 | **core 생성 당시와 다른 바이너리·라이브러리 버전** | 크래시 당시와 동일한 빌드 아티팩트 보관(Build-ID로 매칭: `file core`, `readelf -n`) |
| 변수가 `<optimized out>` | `-O2` 이상 최적화 | `-O0`로 재현 빌드, 또는 `-Og -g` |
| core 파일이 없음 | `ulimit -c 0`, `core_pattern` 파이프, 디스크 권한/용량, 컨테이너 | 3.1 점검 |
| 스택이 깨져 `bt` 불가 | 스택 오염(버퍼 오버플로우) | 레지스터/원시 스택 `x/xg $sp` 수동 분석, ASan으로 재현 |
| 멀티스레드인데 죽은 스레드를 모름 | 시그널 받은 스레드 ≠ 문제 스레드 | `thread apply all bt`, 락/공유 객체 접근 스레드 확인 |

### 3.4 멈춘(hang) 프로세스 분석
```bash
gdb -p <PID>        # 실행 중 프로세스에 attach
(gdb) thread apply all bt     # 데드락 의심: 모든 스레드가 어디서 대기 중인가
```

→ 자세한 설명: [Core Dump 확인 방법 — 활성화·수집·gdb 분석](개발%20%28CS%29/언어/C언어/트러블슈팅/[트러블슈팅]%203.%20Core%20Dump%20확인%20방법%20—%20활성화·수집·gdb%20분석.md), [비정상 종료 시그널 종류](개발%20%28CS%29/언어/C언어/트러블슈팅/[트러블슈팅]%201.%20비정상%20종료%20시그널%20종류%20—%20SIGSEGV·SIGABRT·SIGBUS·SIGILL·SIGFPE%20개관.md), [시그널별 원인 분석](개발%20%28CS%29/언어/C언어/트러블슈팅/[트러블슈팅]%202.%20시그널별%20원인%20분석%20—%20각%20시그널이%20실제로%20왜%20발생하는가.md), [dmesg·siginfo_t·ASan·예방 도구](개발%20%28CS%29/언어/C언어/트러블슈팅/[트러블슈팅]%204.%20추가로%20알아야%20할%20것들%20—%20dmesg·siginfo_t·ASan·예방%20도구.md)

---

## 4. 시그널 핸들러로 백트레이스 남기기 (운영 환경 보강)
core dump가 불가한 환경에서는 `SIGSEGV` 핸들러에서 백트레이스를 로그로 남기고 종료하기도 한다.
```c
#include <execinfo.h>
#include <signal.h>
#include <unistd.h>

static void on_segv(int sig, siginfo_t *si, void *ctx) {
    void *bt[64];
    int n = backtrace(bt, 64);
    backtrace_symbols_fd(bt, n, STDERR_FILENO);   /* async-signal-safe 에 가까운 fd 출력 */
    _exit(128 + sig);
}
/* sigaction(SIGSEGV, &(struct sigaction){ .sa_sigaction = on_segv, .sa_flags = SA_SIGINFO }, NULL); */
```
- 핸들러 안에서는 **async-signal-safe 함수만** 써야 한다(`printf`, `malloc` 금지). `backtrace`도 엄밀히는 안전하지 않으므로 보조 수단으로만 쓰고, 가능하면 core dump를 우선한다. 링크 시 `-rdynamic`을 주면 함수 이름이 나온다.
- 스택 오버플로우일 때는 핸들러를 실행할 스택이 없으므로 `sigaltstack`을 설정해야 한다.

---

## 5. 꼬리 질문
| 질문 | 답변 요지 |
| --- | --- |
| 크래시 위치가 매번 다르면? | 메모리 오염(오버플로우, use-after-free, 경쟁)이 먼저 일어나고 나중에 다른 곳에서 터지는 패턴. 크래시 지점이 아니라 **오염 시점**을 찾아야 한다 → ASan, `watch`, Valgrind. |
| 릴리스에서만 죽고 디버그 빌드에선 안 죽는다면? | 최적화 차이, 미초기화 변수, UB, 타이밍(경쟁). 릴리스 빌드에 `-g`를 넣어(`-O2 -g`) core를 분석하거나, ASan/UBSan/TSan으로 재현한다. |
| NULL 역참조는 왜 항상 segfault인가? | 가상 주소 0 부근 페이지는 보통 매핑하지 않기 때문이다. 하지만 큰 오프셋(`ptr->field` 의 offset이 크면)이나 임베디드에서는 다를 수 있다. |
| segfault와 abort의 차이? | segfault: 잘못된 메모리 접근(MMU 예외). abort: 프로그램/라이브러리가 스스로 `abort()` 호출(assert 실패, glibc가 `double free` 등 힙 손상 감지). |
| 스택 오버플로우는 어떻게 구분? | 백트레이스가 같은 함수 반복(무한 재귀) 또는 `dmesg`의 `sp`가 스택 한계 근처, 큰 지역 배열. `ulimit -s`로 확인. |
| 해제 후 포인터를 NULL로 하면? | use-after-free가 즉시 NULL 역참조로 드러나 디버깅이 쉬워지고, `free(NULL)`은 안전해 이중 해제도 완화된다. |
| core dump 크기가 너무 커서 문제면? | `ulimit -c`로 제한, `coredump_filter`로 덤프할 메모리 종류 제한, `systemd-coredump`의 크기/보관 설정, 압축. |
| 운영 서버에서 gdb attach가 부담이면? | 짧게 `gcore`로 스냅샷만 뜨고 오프라인으로 분석한다. attach는 프로세스를 멈추므로 주의. |

## 한 줄 요약
**`-g -O0` 빌드 → gdb/core의 `bt`로 위치 확인 → 포인터·인덱스 값 확인 → ASan/Valgrind로 최초 오염 지점 추적 → 경계/NULL 검사·소유권 정리로 수정.** core는 `ulimit -c`·`core_pattern`·`coredumpctl`·`gdb ./app core` 순서로 확인하고, 심볼과 동일 빌드 보관이 핵심이다.

## 관련 문서
- [설계와 메모리 기본 — 전역변수·3중 포인터](기술면접/C/[C%20기술면접]%20설계와%20메모리%20기본%20—%20절차지향%20vs%20객체지향·전역변수·3중%20포인터.md)
- [추가 빈출 질문 모음](기술면접/C/[C%20기술면접]%20추가%20빈출%20질문%20모음.md)

---
title: "(C) 동시성·스레드 실습 — mutex 락 범위·데드락·조건변수와 메시지 큐·이체 감시 스레드"
description: "C 동시성 실습에서 만난 mutex 락 범위, 데드락, 조건변수 오류 패턴을 정리하고 스레드 안전한 메시지 큐와 이체 감시 스레드를 구현했습니다."
tags: 
created: 2026-10-15
modified: 2026-11-11
---

# 동시성·스레드 — 락 범위·데드락·조건변수·메시지 큐·이체 감시 스레드

> [!IMPORTANT]
> 컨테이너 gcc 가 4.8.5 로 오래돼 **ThreadSanitizer 를 쓰지 못했다**. 그래서 레이스는 "같은 프로그램을 수백~수천 번 반복 실행해 결과가 어긋나는지"로 확인했고, 락을 일부러 뺀 **변이 버전**이 실제로 실패하는지도 함께 봤다.

> [!TIP]
> - 원본 소스
>   - 강의 코드 15-01 ~ 15-15: [`lecture/conc/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/conc)
>   - 메시지 큐(15-00): [`conc/msgq/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/conc/msgq)
>   - 이체·감시 종합 과제: [`conc/con_ex.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/conc/con_ex.c)
> - 폴더 이름이 `con` 이 아니라 `conc` 인 이유: `con` 은 Windows 예약 장치 이름이라 git 이 파일을 열지 못한다
> - `15-04` 는 입력 파일이 없고, `15-03` · `15-15` 는 컴파일되지 않는 상태라 `make lecture` 에서 제외

---

## 📌 한눈에 보기 — 주의해야 할 점

| # | 주의 | 왜 | 처방 | 상세 |
|---|---|---|---|---|
| 1 | 같은 변수는 **모든 경로**(읽기 포함)가 같은 락 | 락 없는 쪽은 임계구역에 그냥 들어옴 | 접근하는 모든 곳에서 같은 락 | [§1](#1-락의-기본-규칙) |
| 2 | **잡은 함수가 푼다** | 이중 `unlock` 은 NORMAL 뮤텍스가 조용히 통과시킴 | 소유권 = 잡은 함수, `rc` 에 담고 한 곳에서 해제 | [§1](#1-락의-기본-규칙) |
| 3 | 락 범위는 **논리적 한 단위**만큼 | 너무 넓으면 느리고 너무 좁으면 서로 다른 입력 기준 | 확인→변경, 토글→읽기를 한 번에 | [§1](#1-락의-기본-규칙) |
| 4 | 개발 중엔 **`ERRORCHECK`** 뮤텍스 | NORMAL 은 잘못된 `unlock` 을 안 알려 줌 | `lock`/`unlock` 반환값 검사 | [§2](#2-뮤텍스-종류와-에러-검사) |
| 5 | `join` / `detach` **중 하나만**, `destroy` 는 `join` 뒤 | 스레드가 쓰는 중인 뮤텍스를 없앰 | 뮤텍스 수명 > 모든 스레드 | [§2](#2-뮤텍스-종류와-에러-검사), [§3](#3-스레드-생명주기) |
| 6 | 스레드 인자는 **스레드가 끝날 때까지 살아 있는 것** | 지역변수 주소는 함수가 끝나면 덮임 | 힙 복사 + 스레드가 `free` | [§3](#3-스레드-생명주기) |
| 7 | 스레드 안전하지 않은 함수 금지 | `strtok` 은 내부 정적 상태 공유 | `_r` 버전 | [§4](#4-스레드-안전하지-않은-함수) |
| 8 | 조건변수는 **`while` + `broadcast`** | 깨어난 스레드가 차례가 아닐 수 있다 | 조건 재검사, 종료 신호는 `broadcast` | [§5](#5-조건변수) |
| 9 | 락은 **같은 순서**로 잡는다 | 반대 순서면 순환 대기 → 데드락 | id 오름차순, 자기 자신 금지 | [§6](#6-락-획득-순서와-데드락) |
| 10 | 시그널은 **전용 스레드 + `sigwait`** | 핸들러에서 락을 잡으면 자기 자신과 데드락 | `pthread_sigmask` 를 스레드 생성 **전에** | [§7](#7-메시지-큐), [§3](#3-스레드-생명주기) |

---

## 1. 락의 기본 규칙

### 15-01 · 같은 변수는 같은 락으로

- `debit()` 만 락을 잡고 `credit()` 은 안 잡음 → 한쪽이라도 락이 없으면 **락을 쓴 의미가 없다**
- 같이 잡은 문제

| 문제 | 설명 | 처방 |
|---|---|---|
| `int` 와 `unsigned` 혼용 | `UINT_MAX - balance` 는 `int` 한계(`INT_MAX`) 와 달라 `int` 가 먼저 오버플로 | 잔액 타입을 `unsigned int` 로 통일 |
| `srand()` 를 스레드에서 호출 | 전역 상태라 스레드 안전하지 않음 | 스레드마다 다른 seed 로 `rand_r()` 만 |
| 모든 스레드가 같은 `time(NULL)` seed | 같은 시간만큼 잠든다 | seed 에 스레드 번호를 섞는다 |
| 락이 여러 return 경로에 흩어짐 | 한 경로에서 `unlock` 을 빼먹기 쉽다 | `rc` 에 결과를 담고 `unlock` 은 한 곳에서 |

- 검증: 락 안에서 성공 횟수를 센 뒤 `초기값 + 입금 성공 − 출금 성공 == 최종 잔액`
- 결과: 락 제거 변형 **5000회 중 6회** 어긋남, 수정본 0회
- 최종 잔액이 매번 같지는 않다 (debit 이 몰리면 `balance is low` 실패)
	- 이건 레이스가 아니라 스케줄링 차이

### 15-02 · 잡은 함수가 푼다

```diff
  int verify_balance(...) {
      if (balance < amount) {
-         pthread_mutex_unlock(&lock);     /* 호출된 함수가 풀고 */
          return -1;
      }
  }
  int debit(...) {
      pthread_mutex_lock(&lock);
      if (verify_balance(...) < 0) { pthread_mutex_unlock(&lock); return -1; }   /* 호출한 함수도 풂 */
  }
```

- `lock` 1번에 `unlock` 2번
	- NORMAL 뮤텍스는 에러로 알려 주지 않는다
	- 대신 내부 상태가 어긋나 마지막 `destroy` 가 **`EBUSY(16)`**
	- 더 위험한 경우: 첫 `unlock` 직후 다른 스레드가 락을 잡았다면 두 번째 `unlock` 이 **그 스레드의 락을 풀어** 임계구역에 두 스레드가 동시에
- 결과: **3000회 모두** `destroy` 가 `EBUSY` → 수정 후 3000회 통과

> [!WARNING] 처음 생각한 수정이 틀린 사례
> - "`return` 을 `unlock` 실패 `if` 안에 두면 된다" → `unlock` 이 **성공했을 때** `return -1` 을 건너뛰고 `return 0` → **잔액 부족 출금을 허용**
> - 실제로 출금 20번이 전부 성공하고 잔액이 0 까지 내려갔다
> - 원래 `return -1` 위치는 맞았고, 문제는 `verify_balance` 안의 `unlock` → **지운다**

→ 연습: [P024 counter_lock](https://github.com/sweetpark/c-playgound/tree/main/drill/P024_counter_lock)

### 15-04 · 15-05 · 15-06 · 락 범위

| 실습 | 범위 | 문제 | 처방 |
|---|---|---|---|
| 15-04 | 너무 넓음 | 파일 I/O 전체를 락 안에 → 다른 스레드가 I/O 끝까지 대기 | 공유 변수(`g_accessCnt`)를 건드리는 구간만 |
| 15-05 | 어긋남 | `return flag;` **뒤에** `unlock` → 락이 안 풀림. `toggle_flag()` 에는 락 없음 | 값을 지역변수에 담고 `unlock` 한 뒤 `return` |
| 15-06 | 너무 좁음 | `set_values` → `get_sum` → `get_product` 가 **한 묶음**인데 각각 잠금 → 다른 스레드가 끼어 합과 곱이 서로 다른 입력 기준 | 호출하는 쪽에서 한 번에 잠금 |

- 15-05 : "토글 → 값 읽기"를 따로 잠그면 그 사이 다른 스레드가 또 토글 → **내가 바꾼 결과가 아닌 값**이 출력
- 15-06 검증: 각 스레드가 찍은 `(x+A)(x+B)` 와 `x^2 + Sx + P` 가 `S = A+B`, `P = A*B` 인지 확인
	- 락 끈 버전 **3000회 중 455회(약 15%)** 어긋남, 수정본 0회

> [!TIP] 락 범위를 넓히면 안쪽 함수들의 락은 **빼야** 한다
> - 기본 뮤텍스는 같은 스레드가 다시 `lock` 하면 데드락
> - 대안 `RECURSIVE`(같은 스레드의 중복 `lock` 허용)는 "같은 락을 두 번 잡는 구조"를 숨기므로 **꼭 필요할 때만**
> - 안쪽 함수가 "락을 잡은 채 호출해야 한다"는 건 주석이나 `static` 으로 남긴다
> - 교육자료(15-06) 수정안은 `RECURSIVE` 방식이고, `get_sum` / `get_product` 실패 시 **`unlock` 없이 `return -1`** 하는 경로가 남아 있다 → [§6](#6-락-획득-순서와-데드락)처럼 정리 코드로

### 읽는 쪽도 락을 잡아야 한다 — 그리고 읽기가 많다면 rwlock

| 상황 | 문제 |
|---|---|
| 쓰기만 락, 읽기는 락 없음 | 읽기가 쓰는 도중의 **중간 상태/찢어진 값**을 볼 수 있고, 읽은 값으로 쓰면 갱신이 유실 |
| 읽기·쓰기 모두 같은 mutex | 안전하지만 **읽기끼리도 한 줄로 서야** 해서 읽기 비중이 크면 느림 |
| 읽기·쓰기 모두 같은 **rwlock** | 안전하고 읽기끼리는 **동시에** 들어갈 수 있어 빠름 |

- `critical -= 1` 은 한 줄이지만 **load → sub → store** 세 단계
- "성능을 위해 읽기의 락을 뺀다"는 틀렸다 → 빼지 말고 **읽기 전용(공유) 락**을 쓴다

| 동작 | 읽기 락 `rdlock` | 쓰기 락 `wrlock` |
|---|---|---|
| 다른 스레드의 읽기 락과 | **동시 허용** | 대기 |
| 다른 스레드의 쓰기 락과 | 대기 | 대기 |

> [!WARNING] 이름이 `read` 여도 값을 수정(`-= 1`)하는 코드는 **쓰기** → `wrlock`

> [!TIP] rwlock 이 항상 빠른 건 아니다
> - 읽기가 많고 임계구역이 길 때 이득. `+= 1` 처럼 짧으면 관리 비용 때문에 mutex 보다 느릴 수 있다
> - 리더가 계속 들어오면 writer 가 굶는 **writer starvation** (구현마다 정책이 다름, glibc 는 `pthread_rwlockattr_setkind_np`)
> - 변수 **하나**의 단순 증감은 원자적 연산(`atomic_fetch_add`)이 가장 가볍다. 여러 값의 일관성은 mutex/rwlock

---

## 2. 뮤텍스 종류와 에러 검사

### 15-07 · 종류별 동작 (컨테이너 glibc 관찰)

| 상황 | `NORMAL` (기본) | `ERRORCHECK` | `RECURSIVE` |
|---|---|---|---|
| 안 잠긴 뮤텍스를 `unlock` | **0(성공)**: 조용히 | `EPERM(1)` | `EPERM(1)` |
| 다른 스레드가 잡은 뮤텍스를 `unlock` | **0(성공)**: 남의 락을 풀어 버림 | `EPERM(1)` | `EPERM(1)` |
| 같은 스레드가 `lock` 두 번 | 데드락 | `EDEADLK(35)` | 성공 (횟수만큼 `unlock`) |
| 이상한 `unlock` 뒤 `destroy` | `EBUSY(16)` | 정상 | 정상 |

> [!WARNING] 위 "NORMAL 은 조용히 성공"은 이 환경(glibc)에서 관찰한 것이지 표준이 보장하는 동작이 아니다
>
> | 종류 | 같은 스레드가 다시 `lock` | 남의 락/안 잠긴 락을 `unlock` |
> |---|---|---|
> | `NORMAL` | 데드락 (감지 안 함) | **정의되지 않은 동작** |
> | `ERRORCHECK` | 에러 반환 | 에러 반환 |
> | `RECURSIVE` | 성공 (횟수만큼 `unlock` 해야 풀림) | 에러 반환 |
> | `DEFAULT` (`PTHREAD_MUTEX_INITIALIZER`) | 정의되지 않은 동작 | 정의되지 않은 동작 |
>
> - `DEFAULT` 는 구현이 다른 종류로 매핑해도 되고 보통 NORMAL → 교육자료는 **`ERRORCHECK` 또는 `RECURSIVE` 를 명시**하라고 권고
> - 이체 과제(15-17)도 `ERRORCHECK` 를 요구 ([§8](#8-종합-과제--계좌-이체--감시-스레드))

- 개발 중엔 `ERRORCHECK` + `lock`/`unlock` 반환값 검사 → 15-02 같은 실수가 바로 `EPERM`
- **종류**와 **개수**는 다른 이야기
	- 종류(NORMAL/ERRORCHECK/RECURSIVE)는 잘못 썼을 때의 반응만 정한다
	- 뮤텍스를 여러 개 두는 이유는 **보호할 데이터가 여러 개**라서 (계좌마다 하나)
	- 하나만 쓰면 안전하지만 관련 없는 작업까지 서로 기다린다

### 15-08 · destroy 시점

- `pthread_mutex_destroy` 는 **더 이상 쓰는 스레드가 없을 때**(모든 스레드를 `join` 한 뒤)
- 스레드 함수 안에서 `destroy` 하면 아직 `lock` 을 기다리는 스레드가 있는 뮤텍스를 없앤다
- `destroy` 반환값은 `!= 0` 으로 검사 (errno 가 아니라 **에러 번호 자체**) → `strerror`
- 사내 장애 사례(교육자료 15-08): 뮤텍스를 **채널(세션) 생성·삭제마다 `init`/`destroy`** → 삭제 직후에도 다른 스레드가 같은 공유 변수 접근
	- **뮤텍스의 수명은 그것을 쓰는 모든 스레드보다 길어야 한다**

---

## 3. 스레드 생명주기

### 15-03 · 15-13 · join 과 detach

| 상황 | 결과 |
|---|---|
| `join` 누락 (15-03) | `main` 이 끝나며 `sleep` 중인 스레드가 같이 죽음 → 출력 0줄 (join 있으면 5줄) |
| `detach` 후 `join` (15-13) | `pthread_join failed` (종료코드 1) |
| `join` 도 `detach` 도 안 함 | 스택은 회수되지만 **스레드 ID 와 종료 상태**가 남음 |

- `detach` : 끝나면 자원이 자동 회수되는 대신 **끝나기를 기다릴 수 없다** (공통 자원 정리가 필요하면 부적합)
- 표준: 이미 `join`/`detach` 된 스레드를 다시 하면 **정의되지 않은 동작**
- 컨테이너(glibc 2.17) 관찰

| 호출 | 결과 |
|---|---|
| 이미 `detach` 된 스레드(실행 중)를 `join` | `EINVAL(22)` |
| 이미 `detach` 된 스레드(실행 중)를 다시 `detach` | `EINVAL(22)` |
| 이미 `detach` 되고 **끝난** 스레드를 다시 `detach` | `EINVAL(22)` (`pthread_t` 가 dangling: 우연히 에러로 끝난 것) |

- 교육자료는 "리눅스 gcc 에서 두 번째 `detach` 는 성공"이라 했지만 이 환경에선 재현되지 않았다 → **반환값에 기대지 말고** 한쪽만 선택

### 15-10 · 지역변수 주소를 넘기지 않는다

```diff
- int val = i;  pthread_create(&t, NULL, f, &val);   /* create_thread 가 반환되면 val 의 스택 자리를 다음 호출이 덮는다 */
+ int *p = malloc(sizeof(*p));  *p = i;
+ if (pthread_create(&t, NULL, f, p) != 0) free(p);  /* 생성 성공이면 스레드가 free, 실패면 만든 쪽이 free */
```

- 기대한 `Result: 1 2 3 4 5` 대신 **`1` 이 빠지고 `0` 이 출력**
- 호출한 쪽이 `join` 할 때까지 살아 있는 **배열**을 넘겨도 된다
- 핵심은 **소유권**: 성공하면 스레드가, 실패하면 만든 쪽이 해제

→ 연습: [P027 run_squares](https://github.com/sweetpark/c-playgound/tree/main/drill/P027_run_squares)

### 15-14 · 시그널을 스레드에 보낼 때

- `pthread_kill(thread, SIGTERM)` 인데 핸들러가 없으면 기본 동작(프로세스 종료)이 **프로세스 전체**에 적용 → 종료 코드 143
- 시그널의 처분(핸들러)은 **프로세스 단위**, 마스크(`pthread_sigmask`)는 **스레드 단위**
- 정상 종료: `pthread_cancel`, 또는 **flag + 핸들러** 등록 후 `join`
- 핸들러 안에서는 `volatile sig_atomic_t` flag 만 ([환경변수·시그널](개발%20%28CS%29/언어/C언어/실습/[C]%20환경변수·시그널%20실습%20—%20getenv%20복사·atexit와%20sigaction·pselect%20시그널%20카운터.md))
- 시그널 처리를 **전용 스레드 하나**에 맡기는 방법(`sigwait`)은 [§7](#7-메시지-큐)

### 15-15 · 비동기 취소와 락

| 방법 | 설명 |
|---|---|
| deferred 취소(기본값) + `pthread_testcancel()` | 취소 지점(`sleep`, `pthread_cond_wait` 등)에서만 취소 → 락 중간에 안 끊김. 단 루프에 취소 지점이 없으면 안 먹음 |
| `pthread_cleanup_push(unlock, &lock)` | 취소돼도 cleanup 이 락을 푼다 |
| **flag 로 종료 (권장)** | 취소 대신 종료 flag, 스레드가 스스로 빠져나온다 ([§8](#8-종합-과제--계좌-이체--감시-스레드)) |

- `PTHREAD_CANCEL_ASYNCHRONOUS` + 락 : 어느 줄에서나 취소되어 `unlock` 이 안 실행 → **100회 중 44회** main 이 락에서 정지
- deferred 로 돌려도 `lock`/`unlock` 만 도는 루프에 `pthread_testcancel()` 이 없으면 5초 안에 `join` 이 끝나지 않았다
- `pthread_mutex_lock`/`unlock` 자체는 취소 지점이 아니다

> [!WARNING] 강의 15-15 코드는 괄호가 어긋나 그대로는 컴파일되지 않는다
> `PTHREAD_MUTEX_INITIALIZER` 로 초기화한 뮤텍스를 `pthread_mutex_init` 으로 다시 초기화하는 것도 정의되지 않은 동작 → 한 가지 방법만

---

## 4. 스레드 안전하지 않은 함수

- 15-09: `strtok` 을 여러 스레드에서 호출 → 합계가 틀림 (**2000회 중 1회**, `strtok_r` 은 0회)
	- `strtok` 은 "어디까지 잘랐는지"를 **내부 정적 변수**에 저장 → 서로의 위치를 덮어쓴다
- 같은 이유로 스레드에서 쓰면 안 되는 함수: `strtok`, `rand`/`srand`, `localtime`, `strerror`(→ `strerror_r`) … 대체는 대개 `_r`
- `stderr` 도 thread safe 하지 않다고 강의에서 설명 → 정확히는
	- glibc stdio 는 `FILE` 마다 락이 있어 **호출 한 번**은 안전
	- 문제는 **여러 번 나눠 쓰면 다른 스레드의 출력과 섞인다**는 것 → 한 줄은 `fprintf` 한 번으로

→ 연습: [P028 split_words](https://github.com/sweetpark/c-playgound/tree/main/drill/P028_split_words)

---

## 5. 조건변수

- 15-12: 각 스레드가 자기 단계(0, 1, 2…) 차례가 올 때까지 기다렸다가 순서대로 처리

| 규칙 | 이유 |
|---|---|
| 조건 검사는 **`while`** | 깨어났을 때 조건이 이미 바뀌었을 수 있고, 이유 없이 깨어나는 **spurious wakeup** 도 있다 |
| `signal` 대신 **`broadcast`** | `signal` 은 대기자 중 **임의의 하나**만 깨운다. 차례가 아닌 스레드가 깨어 다시 잠들면 정작 차례인 스레드는 못 깸 |
| `cond_wait` 는 반드시 **mutex 를 잡은 상태**에서 | 조건 검사와 대기 시작 사이에 신호를 놓치지 않으려고 |
| 에러 경로에서도 `unlock` | `cond_wait`/`cond_signal` 실패 시 락을 쥔 채 return 하면 다른 스레드가 멈춘다 |

- 결과: `signal` 버전 **300회 중 1회 정지**(5초 제한), `broadcast` 0회
	- 확률은 낮지만 "가끔 멈추는" 전형

| 성질 | 요구 | 지키는 방법 |
|---|---|---|
| **safety** | 신호가 이미 지나간 뒤에 기다리면 **영원히 블록** | `cond_wait` **호출 전에** 조건 검사 (`while` 의 첫 검사) |
| **liveness** | 깨어난 스레드가 조건을 만족한다는 보장이 없다 | `cond_wait` 에서 **돌아온 뒤에도** 조건 재검사 |

- `pthread_cond_signal` 은 다음 **둘 다** 만족할 때만 안전, 아니면 `broadcast`
	1. 대기 중인 모든 스레드가 신호 하나에 깨어나 **똑같은 일**을 한다
	2. 신호 하나에 **한 스레드만** 깨어나야 한다
- 또는 스레드마다 **별도의 조건변수**를 쓰면 `signal` 도 안전
- 조건변수는 단독이 아니라 **조건(공유 변수) + 뮤텍스 + 조건변수** 세트

> [!WARNING] 신호를 보낸 뒤에는 방금 넘긴 객체를 건드리지 않는다
> - 사내 장애 사례(교육자료): 큐에 메시지를 넣고 `signal` 한 뒤 그 메시지를 참조하다가, 그 사이 소비자가 꺼내 `free` 한 객체를 읽음
> - 큐에 넣는 순간 **소유권은 소비자에게** 넘어간다 → 로그가 필요하면 **넣기 전에** 찍거나 값을 지역변수에 복사

→ 연습: [P026 bounded_queue](https://github.com/sweetpark/c-playgound/tree/main/drill/P026_bounded_queue)

---

## 6. 락 획득 순서와 데드락

### 데드락이 생기는 4가지 조건

| 조건 | 뜻 | 이 문제에서 |
|---|---|---|
| 상호 배제 | 한 번에 한 스레드만 자원을 쓴다 | 계좌 뮤텍스 |
| 점유하며 대기 | 자원을 쥔 채 다른 자원을 기다린다 | `from` 락을 쥔 채 `to` 락을 기다림 |
| 비선점 | 쥔 자원을 남이 강제로 뺏을 수 없다 | 뮤텍스는 못 뺏음 |
| 순환 대기 | 서로가 서로의 자원을 기다리는 고리 | 1→2 이체와 2→1 이체 |

- **네 가지가 동시에 성립해야** 데드락 → 하나만 깨도 막는다
- 앞의 셋은 락을 쓰는 이상 거의 못 피한다 → **가장 간단한 처방 = 순환 대기를 없애기** (항상 미리 정한 순서로 잡기)

### 원인과 처방

```diff
- lock(from);  lock(to);                 /* 1→2 와 2→1 이 서로의 첫 락을 쥔 채 상대 락을 기다림 */
+ first = (from->id < to->id) ? from : to;     /* 항상 id 가 작은 쪽을 먼저 */
+ second = (first == from) ? to : from;
+ lock(first);  lock(second);
```

- 원본은 20회 중 **2회** 정지 (첫 락과 둘째 락 사이가 짧아 대부분 한 스레드가 먼저 끝까지 감)
- 첫 락 직후에 `sleep(1)` 을 넣으면 **항상** 정지
- 수정본은 시간차를 줘도 `1 -> 2 ok`, `2 -> 1 ok`, 최종 잔액 `995000 / 2005000` (계좌1: 100만 − 1만 + 5천, 계좌2: 200만 + 1만 − 5천)

> [!NOTE] "해제는 역순으로 안 하면 데드락"이라는 메모는 부정확
> - 데드락의 원인은 **획득** 순서가 스레드마다 다른 것. 해제 순서는 무관
> - 해제를 역순으로 하는 건 **관례** (스택처럼 읽기 쉽고 정리 코드를 짜기 쉬움)
> - 실천은 둘: ① **같은 순서로 잡는다** ② **자기 자신에게 이체하지 않는다** (같은 락 두 번 = 데드락)

### 에러 경로에서의 락 누락

- `from` 락을 잡은 뒤 `to` 락 획득이 실패하면 `goto end` 로 빠지는데 `from` 락을 안 풂
- 락을 둘 이상 잡는 함수는 **어느 단계에서 실패해도 지금까지 잡은 락을 모두 푸는** 정리 코드 필요
	- `goto CLEANUP` 에서 **잡은 순서의 역순**으로 ([동적 메모리](개발%20%28CS%29/언어/C언어/실습/[C]%20동적%20메모리%20실습%20—%20malloc·free%20오류%20패턴과%20유연%20배열%20구조체%20연결리스트.md))

→ 연습: [P025 transfer](https://github.com/sweetpark/c-playgound/tree/main/drill/P025_transfer)

---

## 7. 메시지 큐

### 구조

- `msg_q_t` = 고정 크기(5) 원형 버퍼 + **뮤텍스 1개 + 조건변수 2개(`not_empty` / `not_full`) + `closed` 플래그**
- 유연 배열 `pbuf[]` 는 구조체의 **마지막 멤버** (뒤에 `pthread_mutex_t` 등을 두면 `flexible array member not at end of struct` 에러)

### 원본은 스레드 안전하지 않다

- `front` / `rear` / `cur_cnt` 를 여러 스레드가 동시에 갱신
- consumer 5개, producer 대기 0ms 로 300회 → **5회(1.7%)** 크래시 3 · abort 1 · 행 1
- 두 consumer 가 같은 칸을 동시에 `deq` → 같은 포인터를 둘 다 `free` (**double free**), 두 `enq` 가 같은 칸을 덮으면 데이터 유실

### 수정: 대기는 조건변수로, 종료는 `close_q` 로

| 바꾼 것 | 이유 |
|---|---|
| `msleep(1000)` 폴링 → `cond_wait` | 최대 1초 지연과 CPU 낭비 제거 |
| 센티널 `'Q'` → `close_q` | 큐가 가득 차면 센티널 `enq` 가 10번 재시도 후 포기해 consumer 가 안 끝났다 |
| `closed` 여도 **남은 데이터는 꺼낸 뒤** `CLOSED` 반환 (drain) | 이미 들어간 메시지를 버리지 않으려고 |
| `is_empty_q` / `is_full_q` 는 "스냅샷" 용도 | 확인 후 동작은 그 사이 상태가 바뀐다. `enq`/`deq` 는 이 함수를 부르지 않고 락 안에서 직접 검사 |
| `msleep` 수정 | `tv_nsec = msec * 1000` 은 마이크로초 단위였다 → `tv_sec = msec/1000`, `tv_nsec = (msec%1000) * 1000000` |
| 스레드 생성 실패 처리 | 이미 만든 스레드가 대기 중 → `close_q` 후 만든 것만 `join` |
| `consumer_thr` 의 `return NULL` | 반환형 `void *` 인데 값 없이 `return;` |

- 검증: `recv` 가 정확히 50줄, 문자 a~y 각각 정확히 2번, 모든 스레드가 start/stop 출력, 종료 코드 0 → 수정본 **2100회 0회 실패**

### SIGINT 로 종료하기 — `sigwait` 전용 스레드

- **핸들러에서 `close_q()` 를 직접 부르면 안 된다**
	- `pthread_mutex_lock` · `cond_broadcast` 는 async-signal-safe 가 아님
	- 락을 쥔 스레드(예: `enq` 중인 producer)에 시그널이 오면 핸들러가 같은 락을 다시 잡으려다 **자기 자신과 데드락**
- 그래서 시그널을 받는 **전용 스레드**가 `sigwait` 로 기다리다 일반 문맥에서 `close_q()`

| 주의 | 이유 |
|---|---|
| `pthread_sigmask` 는 **스레드를 만들기 전에** | 스레드는 만들 때의 마스크를 상속. 늦으면 먼저 만든 스레드가 SIGINT 를 그대로 받아 프로세스 종료 |
| `sigwait` 에 넣은 시그널은 **전부 막혀 있어야** | 집합에만 넣고 막지 않으면 보냈을 때 기본 동작(종료)이 먼저 |
| `sigwait` 반환값 | errno 가 아니라 에러 번호 자체. `sig` 는 `0` 으로 초기화하고 `rc != 0` 검사 |
| 정상 종료 때 `SIGUSR1` + `join` | 안 하면 시그널 스레드가 `sigwait` 에서 영원히 대기 |
| 시그널 스레드 생성 실패 | SIGINT 를 이미 막았으므로 Ctrl-C 가 안 먹음 → consumer 를 만들지 않고 `close_q` 후 종료 |
| `destroy_q` 보다 **먼저** 시그널 스레드 `join` | 시그널 스레드가 `g_msgq` 를 쓰고 있을 수 있다 |
| 핸들러(`signal`/`sigaction`)는 등록하지 않는다 | `sigwait` 방식에서는 필요 없다 |

> [!WARNING] 직접 겪은 버그
> 시그널 스레드도 `created++` 로 세어서 `created == consumer_cnt` 가 **항상 거짓**이 됐고(producer 미실행), `join` 루프가 `thr[consumer_cnt]` 를 만든 적 없이 `join` → **스레드를 종류별로 따로 센다** (consumer 수 / `sig_created`)

- producer 가 `CLOSED` 를 받으면(시그널 종료) `enq fail` 없이 조용히 빠져나가게 함
- 아직 안 한 것: 현재 producer 는 고정 횟수(2회)만 돌고 끝난다. "SIGINT 가 올 때까지 계속"으로 바꾸려면 producer 를 무한 루프 + `closed` 확인으로

→ 연습: [P026 bounded_queue](https://github.com/sweetpark/c-playgound/tree/main/drill/P026_bounded_queue), [P023 wait_signal](https://github.com/sweetpark/c-playgound/tree/main/drill/P023_wait_signal)

---

## 8. 종합 과제 — 계좌 이체 + 감시 스레드

### 요구사항

- 계좌 10개, 잔액 1000, 계좌마다 자기를 보호하는 mutex
- 이체 스레드 4개: 출금·입금 계좌와 금액을 임의로 골라 반복 이체. 잔액 부족이면 이체하지 않고 **실패 횟수만** 증가
- 감시 스레드 1개: 1초마다 전체 합계가 초기 합계(10000)와 같은지 확인·출력
- main: 10초 뒤 종료 flag, 모두 끝나면 **스레드별** 성공/실패 횟수와 최종 합계 출력

### 교육자료(15-17) 요구와 `con_ex.c` 대조

| 요구 | 반영 | 비고 |
|---|---|---|
| 확인·출금·입금을 **하나의 atomic 연산**으로 | ✅ | `transfer_once` 한 구간 (출금 함수 + 입금 함수 차례 호출 금지) |
| 두 락을 계좌 번호 오름차순, 출금=입금도 처리 | ✅ | |
| 감시 스레드는 섞이지 않은 합계, 락 쥔 채 `printf` 금지 | ✅ | 전체 락 → 합계 → 해제 → 출력 |
| mutex 를 `PTHREAD_MUTEX_ERRORCHECK` 로 | ✅ | `pthread_mutexattr_settype` 로 10개 init (초기엔 기본 종류 → 대조 후 반영) |
| 모든 pthread 함수 반환값 검사 | ✅ | `lock` · `init` · `create` · `join` |
| 스레드 인자·통계는 수명이 충분한 storage | ✅ | `main` 의 지역 배열을 넘기되 모든 스레드를 `join` 한 뒤 끝남 |
| 스레드별 seed `rand_r` | ✅ | |
| 종료는 `cancel`/`kill` 이 아니라 flag, flag 경쟁 없음 | ✅ | `__atomic_*` |
| 모든 스레드 `join` 후 `destroy` | ✅ | |
| 여러 번 반복 실행해 합계 불일치 0, 데드락 없이 종료 | ✅ | 짧은 실행 반복 + 변이 테스트 |

- ERRORCHECK 적용 후에도 결과 동일 (2초 실행 5회 모두 합계 10000)
	- 락 순서·해제 짝이 맞아 `EPERM`/`EDEADLK` 가 한 번도 안 나왔다

### 처음 작성한 코드의 문제

| 문제 | 설명 |
|---|---|
| 락을 한 번도 안 잡음 | 이체와 감시 모두 락 없이 `balance` 읽고 씀 |
| 이체가 한 계좌에 고정 | `accounts[0] → accounts[1]` 고정, 랜덤 선택 없음 |
| 합계를 안 초기화 | 감시 스레드의 `sum` 이 매 주기 누적 |
| 성공/실패가 전역 하나 | "스레드별 횟수"를 낼 수 없음 |
| 스레드 생성 로직이 꼬임 | `i == 4` 일 때 이체 스레드를 만든 뒤 `thr[4]` 를 감시 스레드로 덮어씀, 생성 실패한 것도 `join` |
| 종료 flag 가 일반 `int` | 최적화로 레지스터에 캐싱되면 루프를 못 빠져나올 수 있음 |
| 컴파일 에러 여러 개 | `typedef _account{`, 구조체 안 초기화, 정의 전 매크로 사용, 오타 |

### 설계

| 항목 | 결정 | 이유 |
|---|---|---|
| 락 단위 | 계좌마다 mutex 1개 | 서로 다른 계좌끼리 이체는 동시에 |
| 이체 | 두 락을 **번호가 작은 순서**로 | 반대 순서면 데드락 ([§6](#6-락-획득-순서와-데드락)) |
| 출금 = 입금 | 다시 뽑는다 | 같은 락 두 번 = 데드락 |
| 감시 | **전체 10개 락을 0→9 순서로 모두 잡고** 합계 | 락 없이 하나씩 읽으면 이체 도중의 돈(출금됐고 입금은 아직)이 빠져 합계가 틀림 |
| 통계 | 스레드별 구조체 | 각자 자기 것만 쓰므로 락 불필요, main 은 `join` 후 읽음 |
| 종료 flag | `__atomic_load_n` / `__atomic_store_n` | 최적화에도 안전. 감시 스레드는 0.1초씩 쪼개 flag 확인 |
| 난수 | 스레드별 seed + `rand_r` | `rand()` 는 전역 상태 |
| 출력 | 락 밖에서 | 락 쥔 채 I/O 금지 |

- 10초 실행: 합계 10000 유지

### 변이 테스트 — 락을 뺀 버전이 실제로 실패하는가

| 변형 | 결과 |
|---|---|
| 이체 락 제거 | 5회 모두 최종 합계가 틀림 (28474, 30973, 43093, 70840 …) |
| 락 순서를 이체 방향대로 (순서 고정 제거) | 5회 모두 데드락 (15초 안에 안 끝남) |
| 감시 스레드가 락 없이 합계 계산 | 10초 실행에서 10회 중 1회 불일치 (2초 실행은 검사가 2번뿐이라 못 잡음) |

> [!TIP]
> "락 없이도 한 번은 통과"한 것은 아무것도 증명하지 못한다. 변이 버전이 **반드시 실패하는 검증**인지 먼저 확인해야 수정본이 통과한 것이 의미를 갖는다.

---

## 9. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P024` 처럼 번호만으로 채점 (동시성 문제는 교착 시 60초 뒤 `FAIL (timeout/deadlock)`)
	- 풀고 난 뒤의 해설은 각 폴더의 `NOTE.md`

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P024 `counter_lock` | [§1](#1-락의-기본-규칙) 모든 경로 같은 락, [§2](#2-뮤텍스-종류와-에러-검사) `ERRORCHECK` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P024_counter_lock) |
| P025 `transfer` | [§6](#6-락-획득-순서와-데드락) 획득 순서 고정 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P025_transfer) |
| P026 `bounded_queue` | [§5](#5-조건변수) `while` + `broadcast`, [§7](#7-메시지-큐) `close` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P026_bounded_queue) |
| P027 `run_squares` | [§3](#3-스레드-생명주기) 인자 수명, `join` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P027_run_squares) |
| P028 `split_words` | [§4](#4-스레드-안전하지-않은-함수) `strtok_r` | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P028_split_words) |
| P023 `wait_signal` | [§7](#7-메시지-큐) 시그널은 막고 기다리기 | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P023_wait_signal) |

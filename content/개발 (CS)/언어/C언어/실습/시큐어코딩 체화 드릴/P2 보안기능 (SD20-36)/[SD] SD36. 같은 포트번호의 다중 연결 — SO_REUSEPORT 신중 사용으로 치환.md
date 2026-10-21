---
title: "SD36. 같은 포트번호의 다중 연결 — SO_REUSEPORT 신중 사용으로 치환"
description: "시큐어코딩 SD36 같은 포트번호의 다중 연결 (CWE-605): 취약한 코드를 SO_REUSEPORT 신중 사용 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD36. 같은 포트번호의 다중 연결 — SO_REUSEPORT 신중 사용으로 치환

> **원본 항목**: [Part 2-4. 네트워크 계열 — 17. 같은 포트번호의 다중 연결](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-4.%20네트워크%20계열.md#17-같은-포트번호의-다중-연결-cwe-605) `CWE-605`
> **repo 폴더**: `sd36_reuseport/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> Part 2-4(네트워크 계열)의 유일한 항목이자 **목(mock) 없이 실제 커널 소켓 동작으로 완전히 재현**되는 드릴이다 — `SO_REUSEPORT` 를 켠 소켓이 정말로 같은 포트에 "끼어들 수 있는지" 직접 확인한다.

> [!NOTE] 이 드릴의 문서 구성 (SD01~SD58 공통)
> ① **요구사항서** — 어떤 코드가 뚫려 있고, 무엇을 만드나.
> ② **pseudo code 템플릿** — Bad 와 Good 의 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 공격은 막히고 정상은 통과해야 끝이다.
> ④ 자주 하는 실수
> ⑤ 모범답안 — 맨 뒤에 접어 둔다.
>
> 변형 A/B/C 는 **같은 치환 규칙을 다른 소재로 다시 치는 것**이다.

---

## 0. 이 드릴로 체화할 것

```diff
- setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, &on, sizeof on);
- addr.sin_addr.s_addr = htonl(INADDR_ANY);          /* 모든 인터페이스, 습관적으로 켠 옵션 */
+ /* SO_REUSEPORT 를 켜지 않는다 — 부하 분산이 실제 필요할 때만 */
+ inet_pton(AF_INET, "10.0.0.7", &addr.sin_addr);    /* 서비스할 인터페이스로 범위 축소 */
```

`SO_REUSEPORT` 자체는 취약점이 아니라 멀티 프로세스 서버의 정식 부하분산 기능이다.
문제는 "습관적으로 켜놓고 이유를 잊는 것" — 켜는 순간 그 포트의 신뢰 경계가 방화벽이 아니라 **UID**로 바뀐다는 사실을 모르면, 같은 UID로 도는 다른 코드가 조용히 연결을 나눠 받아도 알아챌 방법이 없다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 내부 서비스 포트 바인딩 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** UDP 소켓으로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** `USE_PORT_SHARDING` 매크로로 조건부 허용 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 내부 서비스 포트 바인딩

내부 API 서버를 특정 포트에 바인딩한다.
- 이 포트는 이 서비스 프로세스만 점유해야 한다.
- 같은 포트에 다른 프로세스가 끼어드는 것이 감지되지 않고 허용되어서는 안 된다.

**함수**

```c
int bind_socket_bad(int port);
int bind_socket_good(int port, const char *bind_ip);
```

#### 신뢰 경계

| 구분 | 내용 |
| :--- | :--- |
| 경계 이전 | `bind()` 를 호출하는 프로세스 — 커널은 소켓 옵션만 보고 허용 여부를 판단한다 |
| 경계 | `SO_REUSEPORT` 옵션 + `INADDR_ANY` 바인딩 |
| 경계 이후 | **UID 검증 없이** 같은 포트를 공유하게 되는 다른 프로세스 — 커널은 "같은 실효 UID인가"만 확인하고 그 이상은 관여하지 않는다 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 같은 포트에 두 번째 소켓을 `SO_REUSEPORT` 로 바인딩 | **성공** (두 소켓이 포트를 공유) | 커널이 연결을 두 소켓에 분배 — 같은 UID의 다른 코드가 트래픽 일부를 조용히 받아간다.<br>정상 서버는 계속 응답하므로 탈취가 겉으로 드러나지 않는다 |
| 같은 상황(Good) | **실패** (`EADDRINUSE`) | `SO_REUSEPORT` 를 켜지 않았으므로 커널이 두 번째 바인딩을 거부한다 |

### 1-B. 변형 B — UDP 소켓으로 변형

`SOCK_STREAM` 대신 `SOCK_DGRAM` 으로 바꿔 같은 실험을 반복한다.
원본 가이드의 보충표에 따르면 "TCP는 리스닝 중이면 bind 자체가 막히지만, UDP는 이 제한이 원래도 약하다" — TCP와 UDP에서 결과가 실제로 같게 나오는지, `SO_REUSEPORT` 유무가 어느 쪽에서 더 결정적인지 직접 로그로 비교한다

### 1-C. 변형 C — `USE_PORT_SHARDING` 매크로로 조건부 허용

가이드 Good 예시처럼 `#ifdef USE_PORT_SHARDING` 로 감싸 "부하 분산이 실제로 필요할 때만" 컴파일 타임에 켜지도록 만든다.
매크로가 꺼져 있으면 두 번째 바인딩 시도 자체가 코드상 불가능하다는 걸 구조로 증명한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `bind_socket_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int bind_socket_bad(int port)
{
    /* 1. fd = socket(AF_INET, SOCK_STREAM, 0)
     * 2. setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, &on, sizeof(on))   ← 습관적으로 켠 옵션
     * 3. addr = { AF_INET, htonl(INADDR_ANY), htons(port) }           ← 모든 인터페이스
     * 4. bind 실패 → close(fd), return -1
     * 5. return fd */
}

int bind_socket_good(int port, const char *bind_ip)
{
    /* [ ] 1. fd = socket(AF_INET, SOCK_STREAM, 0)
     *        fd < 0 이면 → return -1 */

    /* [ ] 2. SO_REUSEPORT 를 **켜지 않는다**
     *        (부하 분산이 실제로 필요할 때만 켠다) */

    /* [ ] 3. addr 을 0 으로 채우고 family, port 설정
     *        inet_pton(AF_INET, bind_ip, &addr.sin_addr)   ← 서비스할 인터페이스로 범위 축소 */

    /* [ ] 4. bind 실패 → close(fd), return -1 */

    /* [ ] 5. return fd   (호출자가 close) */
}
```

### 2-B. `bind_socket_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int bind_socket_good(int port, const char *bind_ip)
{
    /* [ ] 1. fd = socket(AF_INET, SOCK_STREAM, 0) */

    /* [ ] 2. SO_REUSEPORT 를 **켜지 않는다** */

    /* [ ] 3. addr 을 0 으로 채우고 family, port 설정 */

    /* [ ] 4. bind 실패 → close(fd), return -1 */

    /* [ ] 5. return fd   (호출자가 close) */
}
```

### 2-C. `bind_socket_good` — Level 3 (3회차, 백지)

```c
int bind_socket_good(int port, const char *bind_ip)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `inet_pton` 의 헤더 (`<arpa/inet.h>`)
     *   - 실패 경로마다 `close(fd)`
     */
}
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 를 연다.
>    SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 로직이 막히면 **§3 테스트의 기대값**을 먼저 읽는다.
>    공격 입력표(§1)와 테스트가 답이다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
sd36_reuseport/src/port_bind.h
sd36_reuseport/src/port_bind.c
sd36_reuseport/test/test.c
```

> [!IMPORTANT] 시험 구조는 고정이다 (SD01~SD58 공통)
> 1. **Bad 가 실제로 뚫린다.**
>    이 시험이 실패하면 Bad 를 잘못 옮겨 적은 것이다.
> 2. **Bad 도 정상 입력은 처리한다.**
> 3. **Good 이 같은 공격을 막는다.**
> 4. **Good 이 정상 입력까지 막지 않는다.** (과잉 차단 없음)

### 3-A. 변형 A 시험 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <unistd.h>
#include "port_bind.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static int pick_port(void)
{
    return 20000 + (int)(getpid() % 5000);
}

static void test_bad_is_vulnerable(void)
{
    int port = pick_port();
    int fd1 = bind_socket_bad(port);
    int fd2 = bind_socket_bad(port);   /* 같은 UID로 도는 "다른 코드"를 흉내 */

    T_TRUE(fd1 >= 0, "첫 번째 바인딩은 성공해야 한다");
    T_TRUE(fd2 >= 0,
        "Bad는 SO_REUSEPORT 때문에 같은 포트에 두 번째 소켓도 바인딩되어야 한다(가로채기 가능 = 취약점 재현)");

    if (fd1 >= 0) close(fd1);
    if (fd2 >= 0) close(fd2);
}

static void test_good_blocks_second_bind(void)
{
    int port = pick_port() + 1;
    int fd1 = bind_socket_good(port, "127.0.0.1");
    int fd2 = bind_socket_good(port, "127.0.0.1");   /* 같은 코드가 실수로 두 번 뜬 상황 */

    T_TRUE(fd1 >= 0, "첫 번째 바인딩은 성공해야 한다");
    T_TRUE(fd2 == -1,
        "Good은 SO_REUSEPORT가 없으므로 같은 포트의 두 번째 바인딩이 실패해야 한다(EADDRINUSE)");

    if (fd1 >= 0) close(fd1);
    if (fd2 >= 0) close(fd2);
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_second_bind();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!WARNING] `SO_REUSEPORT` 는 리눅스 3.9+ 전용
> macOS·BSD는 `SO_REUSEPORT` 의 의미가 다르다(부하 분산이 아니라 단순 재사용 허용).
> 이 드릴은 WSL2(리눅스 커널) 기준으로 설계했다.
> 또한 `port_bind.c` 에서 `SO_REUSEPORT` 를 쓰려면 `#define _DEFAULT_SOURCE` 를 include 이전에 선언해야 한다 — 없으면 `-std=c11 -pedantic` 조합에서 `SO_REUSEPORT` 가 선언되지 않았다는 에러가 난다([SD06](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD06.%20디렉터리%20경로%20조작%20—%20절대경로%20정규화%20검증으로%20치환.md)에서 다룬 것과 같은 glibc feature-test macro 이슈).

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — UDP 소켓으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `SOCK_DGRAM` (UDP) | 같은 포트에 끼어들 수 있다 | 두 번째 bind 가 실패 |
| 첫 bind | 성공 | 성공 |

**변형 C — `USE_PORT_SHARDING` 매크로로 조건부 허용**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `USE_PORT_SHARDING` 정의 시에만 REUSEPORT | 항상 켜져 있다 | 매크로가 없으면 꺼짐 |
| 매크로 정의 + 두 번째 bind | 성공 | 성공 (의도된 분산) |

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [템플릿 체화 드릴 README](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 와 **같은 파일**이다.
recipe 줄은 **반드시 탭**으로 들여쓴다.

> [!example]- 공통 Makefile (gcc)
> ```makefile
> # ~/cdrill/Makefile  (템플릿 체화 드릴과 같은 파일)
> # 사용법:  make D=sd01_sqli V=main SRC="common/mock_db.c sd01_sqli/src/sql_auth.c sd01_sqli/test/test.c"
> CC       := gcc
> CFLAGS   := -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST -Icommon -I$(D)/src
> SAN      := -fsanitize=address,undefined -fno-omit-frame-pointer
> LDLIBS   ?= -pthread
>
> D        ?= d1_pure
> V        ?= main
> SRC      ?= $(D)/src/$(V).c $(D)/test/test_$(V).c
> BIN      := build/$(D)_$(V)
>
> all: run
>
> build:
> 	@mkdir -p build
>
> $(BIN): build $(SRC)
> 	$(CC) $(CFLAGS) $(SAN) $(SRC) $(LDLIBS) -o $(BIN)
>
> run: $(BIN)
> 	@echo "── run ──────────────────────────────"
> 	@./$(BIN)
>
> check: $(BIN)
> 	@./$(BIN) && echo "PASS" || (echo "FAIL"; exit 1)
>
> clean:
> 	rm -rf build
>
> .PHONY: all run check clean build
> ```

실행 명령이다.

```bash
make D=sd36_reuseport V=main SRC="sd36_reuseport/src/port_bind.c sd36_reuseport/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd36_reuseport/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd36_reuseport/src/port_bind.c sd36_reuseport/test/test.c \
>     -pthread -o build/sd36_reuseport_main
> ./build/sd36_reuseport_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `SO_REUSEPORT` 자체를 "무조건 나쁜 옵션"으로 암기 | 멀티 프로세스 부하 분산의 정식 기능이다.<br>문제는 켜는 이유를 모른 채 습관적으로 켜는 것 — 켰다면 그 포트의 UID를 전용 계정으로 격리해야 한다는 결정이 함께 따라와야 한다 |
| `SO_REUSEADDR` 와 `SO_REUSEPORT` 를 혼동 | `SO_REUSEADDR` 는 주로 TIME_WAIT 상태의 소켓 재사용을 허용하는 용도이고, 이 항목이 다루는 "포트 가로채기"의 실질적 원인은 `SO_REUSEPORT` 다.<br>이름이 비슷해서 아무 옵션이나 켜고 넘어가기 쉽다 |
| Good에서도 `INADDR_ANY` 를 그대로 둠 | `SO_REUSEPORT` 를 껐다고 끝이 아니다.<br>`INADDR_ANY` 는 "모든 인터페이스"를 의미하므로, 실제 서비스할 인터페이스로 바인딩 범위를 좁히는 것까지가 치환 규칙이다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `port_bind.h` / `port_bind.c`
> ```c
> #ifndef PORT_BIND_H
> #define PORT_BIND_H
> /* 성공 시 열린 소켓 fd(호출자가 close 해야 함), 실패 시 -1 */
> int bind_socket_bad(int port);
> int bind_socket_good(int port, const char *bind_ip);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <sys/socket.h>
> #include <netinet/in.h>
> #include <arpa/inet.h>
> #include <unistd.h>
> #include <string.h>
> #include "port_bind.h"
>
> int bind_socket_bad(int port)
> {
>     int fd = socket(AF_INET, SOCK_STREAM, 0);
>     int on = 1;
>     struct sockaddr_in addr;
>     if (fd < 0) return -1;
>
>     setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, &on, sizeof(on));   /* 습관적으로 켠 옵션 */
>
>     memset(&addr, 0, sizeof(addr));
>     addr.sin_family = AF_INET;
>     addr.sin_addr.s_addr = htonl(INADDR_ANY);                    /* 모든 인터페이스 */
>     addr.sin_port = htons((unsigned short)port);
>
>     if (bind(fd, (struct sockaddr *)&addr, sizeof(addr)) != 0) {
>         close(fd);
>         return -1;
>     }
>     return fd;
> }
>
> int bind_socket_good(int port, const char *bind_ip)
> {
>     int fd = socket(AF_INET, SOCK_STREAM, 0);
>     struct sockaddr_in addr;
>     if (fd < 0) return -1;
>
>     /* SO_REUSEPORT 를 켜지 않는다 -- 부하 분산이 실제로 필요할 때만 켠다 */
>     memset(&addr, 0, sizeof(addr));
>     addr.sin_family = AF_INET;
>     inet_pton(AF_INET, bind_ip, &addr.sin_addr);                 /* 특정 인터페이스로 범위 축소 */
>     addr.sin_port = htons((unsigned short)port);
>
>     if (bind(fd, (struct sockaddr *)&addr, sizeof(addr)) != 0) {
>         close(fd);
>         return -1;
>     }
>     return fd;
> }
> ```
>
> **눈여겨볼 점**: `bind_socket_bad` 와 `bind_socket_good` 의 차이는 딱 두 줄 — `setsockopt(SO_REUSEPORT)` 유무, `INADDR_ANY` vs 특정 IP. 코드량은 거의 같은데 신뢰 경계는 완전히 다르다.
> **옵션 하나가 신뢰 경계를 통째로 옮길 수 있다**는 걸 이 드릴에서 가장 짧은 diff로 확인한다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD35. 취약한 암호화 해쉬함수 하드코드된 솔트](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD35.%20취약한%20암호화%20해쉬함수%20하드코드된%20솔트%20—%20호출마다%20새%20솔트로%20치환.md)
- Part 2-4 네트워크 계열 1개 완료(Part 2 전체 완료) — [다음: SD37. 경쟁 조건](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD37.%20경쟁%20조건%20—%20파일%20디스크립터%20원자적%20생성으로%20치환.md)

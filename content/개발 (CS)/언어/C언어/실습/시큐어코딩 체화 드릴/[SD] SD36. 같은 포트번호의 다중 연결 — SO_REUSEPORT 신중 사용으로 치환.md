---
title: "SD36. 같은 포트번호의 다중 연결 — SO_REUSEPORT 신중 사용으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD36. 같은 포트번호의 다중 연결 — SO_REUSEPORT 신중 사용으로 치환

> **원본 항목**: [Part 2-4. 네트워크 계열 — 17. 같은 포트번호의 다중 연결](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/Part%202.%20보안기능/[시큐어코딩]%202-4.%20네트워크%20계열.md#17-같은-포트번호의-다중-연결-cwe-605) `CWE-605`
> **repo 폴더**: `sd36_reuseport/` (`make D=sd36_reuseport T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> Part 2-4(네트워크 계열)의 유일한 항목이자 **목(mock) 없이 실제 커널 소켓 동작으로 완전히 재현**되는 드릴이다 — `SO_REUSEPORT` 를 켠 소켓이 정말로 같은 포트에 "끼어들 수 있는지" 직접 확인한다.

---

## 0. 이 드릴로 체화할 것

```diff
- setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, &on, sizeof on);
- addr.sin_addr.s_addr = htonl(INADDR_ANY);          /* 모든 인터페이스, 습관적으로 켠 옵션 */
+ /* SO_REUSEPORT 를 켜지 않는다 — 부하 분산이 실제 필요할 때만 */
+ inet_pton(AF_INET, "10.0.0.7", &addr.sin_addr);    /* 서비스할 인터페이스로 범위 축소 */
```

`SO_REUSEPORT` 자체는 취약점이 아니라 멀티 프로세스 서버의 정식 부하분산 기능이다. 문제는 "습관적으로 켜놓고 이유를 잊는 것" — 켜는 순간 그 포트의 신뢰 경계가 방화벽이 아니라 **UID**로 바뀐다는 사실을 모르면, 같은 UID로 도는 다른 코드가 조용히 연결을 나눠 받아도 알아챌 방법이 없다.

---

## 1. 취약 시나리오 — 변형 A: 내부 서비스 포트 바인딩

> [!QUOTE] 요구사항서 (발췌)
> 내부 API 서버를 특정 포트에 바인딩한다.
> - 이 포트는 이 서비스 프로세스만 점유해야 한다.
> - 같은 포트에 다른 프로세스가 끼어드는 것이 감지되지 않고 허용되어서는 안 된다.

### 신뢰 경계

| 구분 | 내용 |
| :--- | :--- |
| 경계 이전 | `bind()` 를 호출하는 프로세스 — 커널은 소켓 옵션만 보고 허용 여부를 판단한다 |
| 경계 | `SO_REUSEPORT` 옵션 + `INADDR_ANY` 바인딩 |
| 경계 이후 | **UID 검증 없이** 같은 포트를 공유하게 되는 다른 프로세스 — 커널은 "같은 실효 UID인가"만 확인하고 그 이상은 관여하지 않는다 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 같은 포트에 두 번째 소켓을 `SO_REUSEPORT` 로 바인딩 | **성공** (두 소켓이 포트를 공유) | 커널이 연결을 두 소켓에 분배 — 같은 UID의 다른 코드가 트래픽 일부를 조용히 받아간다. 정상 서버는 계속 응답하므로 탈취가 겉으로 드러나지 않는다 |
| 같은 상황(Good) | **실패** (`EADDRINUSE`) | `SO_REUSEPORT` 를 켜지 않았으므로 커널이 두 번째 바인딩을 거부한다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 내부 서비스 포트 바인딩 | 위 내용 |
| **B (2회차)** | **UDP 소켓으로 변형** | `SOCK_STREAM` 대신 `SOCK_DGRAM` 으로 바꿔 같은 실험을 반복한다. 원본 가이드의 보충표에 따르면 "TCP는 리스닝 중이면 bind 자체가 막히지만, UDP는 이 제한이 원래도 약하다" — TCP와 UDP에서 결과가 실제로 같게 나오는지, `SO_REUSEPORT` 유무가 어느 쪽에서 더 결정적인지 직접 로그로 비교한다 |
| **C (3회차)** | **`USE_PORT_SHARDING` 매크로로 조건부 허용** | 가이드 Good 예시처럼 `#ifdef USE_PORT_SHARDING` 로 감싸 "부하 분산이 실제로 필요할 때만" 컴파일 타임에 켜지도록 만든다. 매크로가 꺼져 있으면 두 번째 바인딩 시도 자체가 코드상 불가능하다는 걸 구조로 증명한다 |

---

## 2. 제출물

```text
sd36_reuseport/src/port_bind.h
sd36_reuseport/src/port_bind.c
sd36_reuseport/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

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
> macOS·BSD는 `SO_REUSEPORT` 의 의미가 다르다(부하 분산이 아니라 단순 재사용 허용). 이 드릴은 WSL2(리눅스 커널) 기준으로 설계했다. 또한 `port_bind.c` 에서 `SO_REUSEPORT` 를 쓰려면 `#define _DEFAULT_SOURCE` 를 include 이전에 선언해야 한다 — 없으면 `-std=c11 -pedantic` 조합에서 `SO_REUSEPORT` 가 선언되지 않았다는 에러가 난다([SD06](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD06.%20디렉터리%20경로%20조작%20—%20절대경로%20정규화%20검증으로%20치환.md)에서 다룬 것과 같은 glibc feature-test macro 이슈).

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 — 두 번째 바인딩도 성공 | 30 | ☐ |
| `test_good_blocks_second_bind` 통과 — 두 번째 바인딩이 `EADDRINUSE` 로 실패 | 40 | ☐ |
| Good이 `INADDR_ANY` 대신 특정 인터페이스로 바인딩 범위를 좁혔다 | 20 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `SO_REUSEPORT` 자체를 "무조건 나쁜 옵션"으로 암기 | 멀티 프로세스 부하 분산의 정식 기능이다. 문제는 켜는 이유를 모른 채 습관적으로 켜는 것 — 켰다면 그 포트의 UID를 전용 계정으로 격리해야 한다는 결정이 함께 따라와야 한다 |
| `SO_REUSEADDR` 와 `SO_REUSEPORT` 를 혼동 | `SO_REUSEADDR` 는 주로 TIME_WAIT 상태의 소켓 재사용을 허용하는 용도이고, 이 항목이 다루는 "포트 가로채기"의 실질적 원인은 `SO_REUSEPORT` 다. 이름이 비슷해서 아무 옵션이나 켜고 넘어가기 쉽다 |
| Good에서도 `INADDR_ANY` 를 그대로 둠 | `SO_REUSEPORT` 를 껐다고 끝이 아니다. `INADDR_ANY` 는 "모든 인터페이스"를 의미하므로, 실제 서비스할 인터페이스로 바인딩 범위를 좁히는 것까지가 치환 규칙이다 |

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
> **눈여겨볼 점**: `bind_socket_bad` 와 `bind_socket_good` 의 차이는 딱 두 줄 — `setsockopt(SO_REUSEPORT)` 유무, `INADDR_ANY` vs 특정 IP. 코드량은 거의 같은데 신뢰 경계는 완전히 다르다. **옵션 하나가 신뢰 경계를 통째로 옮길 수 있다**는 걸 이 드릴에서 가장 짧은 diff로 확인한다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (TCP 포트 바인딩) |  |  |  |
| 2 |  | B (UDP 변형) |  |  |  |
| 3 |  | C (매크로 조건부) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD35. 취약한 암호화 해쉬함수 하드코드된 솔트](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD35.%20취약한%20암호화%20해쉬함수%20하드코드된%20솔트%20—%20호출마다%20새%20솔트로%20치환.md)
- Part 2-4 네트워크 계열 1개 완료(Part 2 전체 완료) — [다음: SD37. 경쟁 조건](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD37.%20경쟁%20조건%20—%20파일%20디스크립터%20원자적%20생성으로%20치환.md)

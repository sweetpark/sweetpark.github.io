---
title: "SD58. 다중 스레드 프로그램에서 getlogin() 사용 — getlogin_r로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD58. 다중 스레드 프로그램에서 getlogin() 사용 — getlogin_r로 치환

> **원본 항목**: [Part 7. API 오용 — 5. 다중 스레드 프로그램에서 getlogin() 사용](../../시큐어코딩가이드/[시큐어코딩]%20Part%207.%20API%20오용.md#5-다중-스레드-프로그램에서-getlogin-사용-cwe-558) `CWE-558`
> **repo 폴더**: `sd58_getloginsim/` (`make D=sd58_getloginsim T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> Part 7(API 오용)의 마지막이자 58개 전체의 마지막 드릴이다. 실제 `getlogin()`은 제어 터미널(tty)이 있어야 동작해 테스트 환경에서 실패하기 쉬우므로, **정적 버퍼를 반환한다는 계약 자체**를 흉내낸 대역 함수로 "스레드 간 공유"가 실제로 무엇을 망가뜨리는지 재현한다.

---

## 0. 이 드릴로 체화할 것

```diff
- struct passwd *pwd = getpwnam(getlogin());       /* 반환 버퍼가 스레드 간 공유 */
- if (isTrustedGroup(pwd->pw_gid)) return 1;
+ char id[MAX];
+ if (getlogin_r(id, MAX) != 0) return 0;          /* 지역 버퍼 + 실패 처리 */
+ pwd = getpwnam(id);
+ return isTrustedGroup(pwd->pw_gid) ? 1 : 0;
```

멀티스레드 환경에서 "정적 버퍼를 반환하는 함수"는 전부 `_r`(reentrant) 버전으로 바꾼다. 권한 판정처럼 중요한 값은 반드시 호출자 소유의 지역 버퍼에 고정해야 한다.

**`_r` 버전이 없는 경우**: 스레드 safe 한 함수가 제공되지 않으면 **lock(뮤텍스)으로 호출~복사 구간 전체를 직렬화**해야 한다. 호출만 lock으로 감싸면 부족하고, 반환 값을 지역 버퍼에 복사한 뒤에 unlock 한다.

```c
static pthread_mutex_t login_lock = PTHREAD_MUTEX_INITIALIZER;

char id[MAX];
pthread_mutex_lock(&login_lock);
char *p = getlogin();                            /* _r 버전 없음 → lock 안에서 호출 */
if (p == NULL) { pthread_mutex_unlock(&login_lock); return 0; }
strncpy(id, p, MAX - 1);  id[MAX - 1] = '\0';    /* 지역 버퍼로 복사 후 */
pthread_mutex_unlock(&login_lock);               /* unlock (모든 경로에서) */
```

---

## 1. 취약 시나리오 — 변형 A: 두 사용자의 연속 로그인 조회

> [!QUOTE] 요구사항서 (발췌)
> 로그인한 사용자 이름을 조회해 이후 로직에 사용한다.
> - 한 호출의 결과가 다른 호출에 의해 바뀌어서는 안 된다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `getlogin()`류 함수의 반환 포인터 | 함수 내부 **정적** 버퍼 | 그 포인터를 나중에까지 붙들고 있다가 다시 읽는 지점 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `"alice"`로 한 번 호출해 포인터를 저장 → 나중에 `"bob"`으로 다시 호출 | **처음 저장해둔 포인터도 `"bob"`을 가리키게 됨** | 두 호출이 **같은 정적 버퍼 주소**를 반환하기 때문이다 |
| 같은 상황(Good, `_r` 버전) | 처음 결과(`"alice"`)가 그대로 유지됨 | 각 호출이 호출자가 준 **별도의 버퍼**에 결과를 쓴다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 두 사용자의 연속 로그인 조회 | 위 내용 |
| **B (2회차)** | **권한 판정 로직까지 연결** | 가이드 원문처럼 조회한 이름으로 `isTrustedGroup` 판정을 수행하는 함수로 확장해, 오염된 이름이 잘못된 권한 부여로 이어지는 흐름까지 재현한다 |
| **C (3회차)** | **`strtok`/`ctime` 등 다른 정적 버퍼 함수로 확장** | 같은 문제를 가진 다른 표준 함수(`strtok`, `ctime`, `localtime`)를 하나 골라, 그 함수의 `_r`/`_s` 버전으로 바꾸는 연습을 반복한다 |

---

## 2. 제출물

```text
sd58_getloginsim/src/getloginsim.h
sd58_getloginsim/src/getloginsim.c
sd58_getloginsim/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <string.h>
#include <pthread.h>
#include "getloginsim.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

typedef struct { const char *name; const char *result_ptr; } bad_arg_t;
typedef struct { const char *name; char buf[64]; int rc; } good_arg_t;

static void *thread_bad(void *arg)
{
    bad_arg_t *a = (bad_arg_t *)arg;
    a->result_ptr = getlogin_like_bad(a->name);
    return NULL;
}

static void *thread_good(void *arg)
{
    good_arg_t *a = (good_arg_t *)arg;
    a->rc = getlogin_like_good_r(a->name, a->buf, sizeof(a->buf));
    return NULL;
}

static void test_bad_shares_buffer_across_threads(void)
{
    pthread_t t1, t2;
    bad_arg_t a1, a2;
    a1.name = "alice"; a1.result_ptr = NULL;
    a2.name = "bob";   a2.result_ptr = NULL;

    pthread_create(&t1, NULL, thread_bad, &a1);
    pthread_join(t1, NULL);
    pthread_create(&t2, NULL, thread_bad, &a2);
    pthread_join(t2, NULL);

    T_TRUE(a1.result_ptr == a2.result_ptr,
        "Bad는 두 호출이 같은 정적 버퍼 주소를 반환해야 한다(스레드 간 공유 재현)");
    T_TRUE(strcmp(a1.result_ptr, "bob") == 0,
        "정적 버퍼가 공유되므로, 나중 호출(bob)이 먼저 저장해둔 포인터(alice)가 가리키는 내용까지 덮어써야 한다(취약점 재현)");
}

static void test_good_isolates_each_caller(void)
{
    pthread_t t1, t2;
    good_arg_t a1, a2;
    a1.name = "alice";
    a2.name = "bob";

    pthread_create(&t1, NULL, thread_good, &a1);
    pthread_join(t1, NULL);
    pthread_create(&t2, NULL, thread_good, &a2);
    pthread_join(t2, NULL);

    T_TRUE(a1.rc == 0 && a2.rc == 0, "두 호출 모두 성공해야 한다");
    T_TRUE(strcmp(a1.buf, "alice") == 0,
        "Good은 호출자 각자의 버퍼에 쓰므로, 나중 호출(bob) 이후에도 alice의 결과가 그대로 남아야 한다");
    T_TRUE(strcmp(a2.buf, "bob") == 0, "bob의 결과도 정확해야 한다");
}

int main(void)
{
    test_bad_shares_buffer_across_threads();
    test_good_isolates_each_caller();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] 왜 두 스레드를 동시에 안 돌리고 `join`으로 순서를 고정했는가
> 진짜 레이스(두 스레드가 정확히 같은 순간에 겹쳐 실행)는 타이밍에 의존해 테스트가 실행할 때마다 다른 결과를 낼 수 있다. 이 드릴의 핵심은 "정확히 어느 순간에 겹치는가"가 아니라 **"결과를 담는 그릇(정적 버퍼)이 스레드 사이에 공유되는가"**이므로, 스레드를 순서대로 실행해도(`join` 후 다음 생성) 같은 결함이 100% 결정론적으로 드러난다 — 오히려 실전에서는 이보다 더 나쁜, 진짜 동시 접근으로 인한 반쯤 섞인 문자열까지 나올 수 있다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_shares_buffer_across_threads` 통과(포인터 동일성 + 내용 오염 둘 다) | 40 | ☐ |
| `test_good_isolates_each_caller` 통과 | 40 | ☐ |
| 목표 시간 내 | 20 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 반환된 포인터를 곧바로 문자열로 복사해서 쓰면 괜찮다고 생각 | 맞다 — 그런데 문제는 "그 순간 바로 복사하지 않고 포인터를 들고 있다가 나중에 쓰는" 코드가 실무에서 흔하다는 것이다. `_r` 버전으로 바꾸면 애초에 그런 실수 자체가 코드 구조상 불가능해진다(버퍼를 호출자가 미리 준비해야 하므로) |
| `_r` 버전은 코드가 복잡해지니 성능이 중요하지 않은 곳에서는 원본 함수를 써도 된다고 생각 | 이 항목은 성능이 아니라 **정확성**의 문제다. 싱글스레드로 시작한 코드가 나중에 멀티스레드로 확장되는 일은 매우 흔하고, 그때 이런 정적 버퍼 함수들이 조용히 새로운 버그의 원인이 된다 |
| `_r` 버전이 없는 함수를 lock 없이 그대로 사용 | 스레드 safe 한 대체 함수가 없으면 lock으로 제어해야 한다. lock은 **호출부터 지역 버퍼로 복사할 때까지** 잡고, 같은 함수를 부르는 **모든 경로가 같은 lock**을 써야 하며, 에러 경로를 포함한 모든 반환 경로에서 unlock 해야 한다 |
| `getlogin_r`의 실패(터미널 없음 등)를 처리 안 함 | 가이드 원문의 Good 예시도 `if (getlogin_r(id, MAX) != 0) return 0;`로 실패를 명시적으로 처리한다. `_r` 버전은 실패 가능성이 있는 함수라는 신호이기도 하다 — [SD43]([SD]%20SD43.%20널%20포인터%20역참조%20—%20반환값%20검사%20후%20사용으로%20치환.md)의 반환값 검사 원칙이 여기도 그대로 적용된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `getloginsim.h` / `getloginsim.c`
> ```c
> #ifndef GETLOGINSIM_H
> #define GETLOGINSIM_H
> #include <stddef.h>
> const char *getlogin_like_bad(const char *name);
> int getlogin_like_good_r(const char *name, char *buf, size_t buf_size);
> #endif
> ```
> ```c
> #include <stdio.h>
> #include "getloginsim.h"
>
> static char g_shared_buf[64];
>
> const char *getlogin_like_bad(const char *name)
> {
>     snprintf(g_shared_buf, sizeof(g_shared_buf), "%s", name);
>     return g_shared_buf;              /* 스레드 간 공유되는 정적 버퍼 */
> }
>
> int getlogin_like_good_r(const char *name, char *buf, size_t buf_size)
> {
>     if (snprintf(buf, buf_size, "%s", name) >= (int)buf_size) return -1;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `getlogin_like_bad`는 **반환형이 `const char *`**(내부 버퍼를 가리키는 포인터)이고, `getlogin_like_good_r`은 **반환형이 `int`**(성공/실패만 알림, 실제 데이터는 인자로 받은 `buf`에 쓴다)다. `_r` 계열 함수들의 이 시그니처 패턴(포인터 반환 → 상태코드 반환 + out 파라미터)을 기억해두면 다른 정적 버퍼 함수를 만날 때도 같은 방식으로 치환할 수 있다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (연속 로그인 조회) |  |  |  |
| 2 |  | B (권한 판정 연결) |  |  |  |
| 3 |  | C (strtok/ctime 확장) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD57. 문자열 관리 오용]([SD]%20SD57.%20오용%20문자열%20관리%20—%20크기%20인자%20동반과%20멀티바이트%20경계%20인식으로%20치환.md)
- **Part 7(API 오용) 5개 완료 — 58개 드릴 전체 완료.** 이제 [README](README.md)의 "반복 학습 방법"에 따라 2회차·3회차를 진행하거나, D+14 점검 일정을 잡는다.

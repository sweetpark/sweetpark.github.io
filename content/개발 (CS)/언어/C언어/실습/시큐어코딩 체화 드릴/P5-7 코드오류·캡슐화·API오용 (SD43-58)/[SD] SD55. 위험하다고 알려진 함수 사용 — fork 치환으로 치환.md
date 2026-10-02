---
title: "SD55. 위험하다고 알려진 함수 사용 — fork 치환으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD55. 위험하다고 알려진 함수 사용 — fork 치환으로 치환

> **원본 항목**: [Part 7. API 오용 — 2. 위험하다고 알려진 함수 사용](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%207.%20API%20오용.md#2-위험하다고-알려진-함수-사용-cwe-242) `CWE-242`
> **repo 폴더**: `sd55_dangerfunc/` (`make D=sd55_dangerfunc T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> 가이드 원문의 `gets()`는 이미 C11 표준과 최신 glibc에서 **완전히 제거**돼 이 프로젝트 환경에서는 아예 호출 자체가 불가능하다 — 그 사실 자체가 "위험 함수는 감싸지 말고 금지·치환하라"는 이 항목의 교훈을 가장 강력하게 보여준다. 그래서 이 드릴은 원문의 두 번째 예시, **실제로 호출 가능한 `vfork()`**로 같은 교훈을 재현한다.

---

## 0. 이 드릴로 체화할 것

```diff
  int shared_var = 100;
- pid_t pid = vfork();       /* 자식이 부모 공간을 빌려 씀 */
+ pid_t pid = fork();        /* 부모와 별도 공간 사용 */
  if (pid == 0) {
      shared_var = 999;
      _exit(0);
  }
  waitpid(pid, NULL, 0);
  return shared_var;
```

"고칠 수 없는 함수"는 감싸지 말고 목록으로 금지하고 치환한다. `vfork()`는 입력값을 아무리 검증해도 위험한 채로 남는다 — 함수 **자체의 계약**(자식이 부모의 주소 공간을 그대로 빌려 쓴다)이 문제이기 때문이다.

---

## 1. 취약 시나리오 — 변형 A: 자식 프로세스에서 값 계산

> [!QUOTE] 요구사항서 (발췌)
> 별도 프로세스에서 값을 계산한 뒤 부모는 자신의 상태를 그대로 유지해야 한다.
> - 자식 프로세스의 작업이 부모의 메모리에 영향을 줘서는 안 된다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| (해당 없음) | — | `vfork()` 함수 자체의 계약(주소 공간 공유)이 결함이다 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `vfork()`로 자식 생성 후 자식이 스택 변수 수정 | **부모의 값까지 `999`로 바뀜**(취약점 재현) | `vfork()`는 `exec`/`_exit` 전까지 자식이 부모와 **같은 주소 공간**을 쓴다고 명세돼 있다 |
| 같은 상황(Good, `fork()`) | 부모 값은 `100`으로 그대로 유지 | `fork()`는 자식에게 독립된(Copy-on-Write) 주소 공간을 준다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 자식 프로세스에서 값 계산 | 위 내용 |
| **B (2회차)** | **`gets()` 금지를 문서로 재현** | 실제 호출은 불가능하므로, 대신 "왜 안 되는가"를 `fgets()`와 비교하는 표(크기 인자 유무)로 정리하고, 컴파일러가 `gets`를 만나면 어떤 에러/경고를 내는지 직접 `gets(buf);` 한 줄만 넣어 컴파일해보고 에러 메시지를 기록한다 |
| **C (3회차)** | **위험 함수 목록을 코드에 강제하기** | [부록 — 위험함수 치환표](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20부록%20—%20위험함수%20치환표·암호화%20기준표·PQC%20전환.md)에서 3개를 골라, `#pragma GCC poison`(clang도 지원)으로 해당 함수들을 소스에서 아예 못 쓰게 막는 헤더를 만들어본다 |

---

## 2. 제출물

```text
sd55_dangerfunc/src/dangerfunc.h
sd55_dangerfunc/src/dangerfunc.c
sd55_dangerfunc/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "dangerfunc.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_vfork_corrupts_parent(void)
{
    int r = demonstrate_vfork_bad();
    T_TRUE(r == 999,
        "vfork는 자식이 부모와 주소 공간을 공유해 부모의 스택 변수까지 바꿔버려야 한다(취약점 재현)");
}

static void test_good_fork_isolates_parent(void)
{
    int r = demonstrate_fork_good();
    T_TRUE(r == 100,
        "fork는 자식이 독립된 복사본에서 동작해 부모 값이 그대로 보존돼야 한다");
}

int main(void)
{
    test_bad_vfork_corrupts_parent();
    test_good_fork_isolates_parent();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] `gets()`가 이 프로젝트에서 왜 아예 호출 불가능한가
> `gets()`는 크기 인자를 받을 방법이 원천적으로 없는 시그니처(`char *gets(char *s)`) 때문에 C11 표준에서 완전히 삭제됐고, 최신 glibc(이 환경 포함)는 링크 심볼조차 제공하지 않는다. "위험 함수는 고쳐 쓰지 말고 치환하라"는 이 항목의 원칙을 언어와 표준 라이브러리 차원에서 이미 실현한 사례다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_vfork_corrupts_parent` 통과 | 40 | ☐ |
| `test_good_fork_isolates_parent` 통과 | 40 | ☐ |
| 목표 시간 내 | 20 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "자식에서 부모 변수를 안 건드리면 vfork도 안전하다"고 생각 | 이론적으로는 맞지만, 그 규칙을 지키는 걸 컴파일러도 리뷰어도 강제할 수 없다. "조심해서 쓰면 안전한 함수"는 결국 언젠가 실수로 위반된다 — 그래서 애초에 금지 목록에 올린다 |
| `vfork()`를 `fork()`로 바꾸면 성능이 크게 나빠진다고 걱정 | 현대 리눅스의 `fork()`는 Copy-on-Write로 구현돼 있어 실제 메모리 복사가 거의 일어나지 않는다. `vfork()`가 필요한 성능상의 이유는 대부분의 애플리케이션 코드에는 해당하지 않는다 |
| 위험 함수 목록을 "예전에 취약했던 함수들"로만 이해 | `gets()`처럼 아예 표준에서 삭제된 사례도 있듯, 이 목록은 고정된 게 아니라 계속 갱신된다. 새 프로젝트를 시작할 때마다 [위험함수 치환표](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20부록%20—%20위험함수%20치환표·암호화%20기준표·PQC%20전환.md)를 다시 확인하는 습관이 필요하다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `dangerfunc.h` / `dangerfunc.c`
> ```c
> #ifndef DANGERFUNC_H
> #define DANGERFUNC_H
> int demonstrate_vfork_bad(void);
> int demonstrate_fork_good(void);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <unistd.h>
> #include <sys/wait.h>
> #include "dangerfunc.h"
>
> int demonstrate_vfork_bad(void)
> {
>     int shared_var = 100;
>     pid_t pid = vfork();
>     if (pid == 0) {
>         shared_var = 999;      /* 자식이 부모의 스택 변수를 직접 변경 -- 부모 공간을 빌려 씀 */
>         _exit(0);
>     }
>     waitpid(pid, NULL, 0);
>     return shared_var;          /* vfork 이후 부모 값이 오염됨 */
> }
>
> int demonstrate_fork_good(void)
> {
>     int shared_var = 100;
>     pid_t pid = fork();
>     if (pid == 0) {
>         shared_var = 999;       /* 자식만의 독립된 복사본을 변경 -- 부모는 영향 없음 */
>         _exit(0);
>     }
>     waitpid(pid, NULL, 0);
>     return shared_var;           /* 부모 값은 그대로 100 */
> }
> ```
>
> **눈여겨볼 점**: 두 함수는 `vfork()` ↔ `fork()` **한 단어**만 다르다. 이 항목의 핵심은 "복잡한 재작성"이 아니라 **"위험 함수 이름을 안전한 대안으로 바꿔 부르는 것"** 그 자체가 치환의 전부인 경우가 많다는 것이다 — 대신 그 한 단어를 놓치면 안 된다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (자식 프로세스 계산) |  |  |  |
| 2 |  | B (gets 금지 문서화) |  |  |  |
| 3 |  | C (poison 매크로) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD54. DNS lookup에 의존한 보안결정](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD54.%20DNS%20lookup에%20의존한%20보안결정%20—%20IP%20화이트리스트로%20치환.md)
- [다음: SD56. chroot Jail 작업디렉터리](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD56.%20작업%20디렉터리%20변경%20없는%20chroot%20Jail%20생성%20—%20chdir%20동반으로%20치환.md)

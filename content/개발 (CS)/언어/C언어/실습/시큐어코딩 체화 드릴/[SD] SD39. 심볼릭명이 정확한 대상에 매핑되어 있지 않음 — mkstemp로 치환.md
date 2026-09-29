---
title: "SD39. 심볼릭명이 정확한 대상에 매핑되어 있지 않음 — mkstemp로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD39. 심볼릭명이 정확한 대상에 매핑되어 있지 않음 — mkstemp로 치환

> **원본 항목**: [Part 3. 시간 및 상태 — 3. 심볼릭명이 정확한 대상에 매핑되어 있지 않음](../../시큐어코딩가이드/%5B시큐어코딩%5D%20Part%203.%20시간%20및%20상태.md#3-심볼릭명이-정확한-대상에-매핑되어-있지-않음-cwe-386) `CWE-386`
> **repo 폴더**: `sd39_symmap/` (`make D=sd39_symmap T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 3의 마지막 드릴이다. [SD37](%5BSD%5D%20SD37.%20경쟁%20조건%20—%20파일%20디스크립터%20원자적%20생성으로%20치환.md)과 공격 표면은 같지만 초점이 다르다 — SD37은 "생성과 검사를 원자화"했다면, 여기서는 **"이름 자체를 예측 불가능하게 만들면 공격자가 애초에 트랩을 심을 좌표를 모른다"**를 확인한다.

---

## 0. 이 드릴로 체화할 것

```diff
- snprintf(path, sizeof(path), "%s/guess.tmp", dir);   /* 이름이 항상 같다 -> 예측 가능 */
- f = fopen(path, "w+");                                /* 심볼릭 링크면 그대로 따라간다 */
+ snprintf(path, sizeof(path), "%s/tmpXXXXXX", dir);
+ fd = mkstemp(path);                                    /* 무작위 접미사 -- 미리 예측 불가 */
```

공격자가 심볼릭 링크 트랩을 심으려면 **그 파일이 정확히 어떤 이름으로 만들어질지** 미리 알아야 한다. 이름이 고정이거나 규칙적이면(`app.pid`, `guess.tmp`, `session_1`…) 언제든 예측해서 미리 링크를 걸어둘 수 있다. `mkstemp()`는 이름의 일부를 커널이 무작위로 채워 넣기 때문에 "생성되기 전까지는 그 이름을 아무도 모른다."

---

## 1. 취약 시나리오 — 변형 A: 임시 작업 파일 생성

> [!QUOTE] 요구사항서 (발췌)
> 요청마다 임시 작업 파일을 만들어 결과를 기록한다.
> - 다른 프로세스가 이 파일의 실제 경로를 미리 알 수 없어야 한다.
> - 파일명 충돌이 발생해서는 안 된다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 임시 파일 경로(`guess.tmp`) | 코드에 고정된 이름 | 공격자가 서비스 시작 전에 미리 심볼릭 링크로 선점할 수 있는 좌표 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 공격자가 `guess.tmp` 자리에 `victim_target`을 가리키는 심볼릭 링크를 미리 심어둠 | **`victim_target`이 그대로 덮어써진다** | 이름이 고정이라 공격자가 서비스 실행 전에 정확한 좌표를 미리 알고 트랩을 심을 수 있다 |
| 같은 상황(Good) | **`victim_target`은 전혀 건드려지지 않는다** | `mkstemp()`가 만드는 실제 이름은 매번 다르고 예측 불가능해, 공격자가 미리 심어둔 `guess.tmp` 트랩과 절대 겹치지 않는다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 임시 작업 파일 생성 | 위 내용 |
| **B (2회차)** | **소켓 수신 데이터를 임시 파일에 스트리밍 저장하는 형태로 변형** | 가이드 원문 Good 예시처럼 `recv()` 루프로 받은 데이터를 `mkstemp()`로 만든 파일에 `fwrite`하는 함수로 바꿔본다(SD36의 소켓 지식과 연결) |
| **C (3회차)** | **디렉터리 안의 심볼릭 링크를 사전에 스캔해서 경고 로그 남기기** | 서비스 시작 시 작업 디렉터리 안에 이미 존재하는 심볼릭 링크가 있는지 `lstat()`으로 순회 점검하는 함수 추가 — "생성 전에 미리 확인"하는 방어층을 하나 더 쌓는다 |

---

## 2. 제출물

```text
sd39_symmap/src/symmap.h
sd39_symmap/src/symmap.c
sd39_symmap/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <limits.h>
#include "symmap.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void write_file(const char *path, const char *content)
{
    FILE *f = fopen(path, "w");
    if (f) { fputs(content, f); fclose(f); }
}

static int read_file(const char *path, char *buf, size_t n)
{
    FILE *f = fopen(path, "r");
    size_t r;
    if (!f) return -1;
    r = fread(buf, 1, n - 1, f);
    buf[r] = '\0';
    fclose(f);
    return 0;
}

int main(void)
{
    char base[] = "/tmp/sd39_XXXXXX";
    char victim[PATH_MAX], guess[PATH_MAX];
    char out1[PATH_MAX], out2[PATH_MAX], content[128];

    if (mkdtemp(base) == NULL) { perror("mkdtemp"); return 1; }
    snprintf(victim, sizeof(victim), "%s/victim_target", base);
    snprintf(guess,  sizeof(guess),  "%s/guess.tmp", base);

    write_file(victim, "ORIGINAL");
    symlink(victim, guess);   /* 공격자가 예측 가능한 이름에 미리 심어둔 트랩 */

    T_TRUE(open_predictable_tmp_bad(base, "HACKED") == 0, "Bad 호출 자체는 정상적으로 '성공'해야 한다");
    read_file(victim, content, sizeof(content));
    T_TRUE(strcmp(content, "HACKED") == 0,
        "Bad는 이름이 항상 같으므로 공격자가 미리 심어둔 심볼릭 링크를 그대로 따라가 victim_target을 덮어써야 한다(취약점 재현)");

    write_file(victim, "ORIGINAL");   /* 복원 */

    T_TRUE(create_random_tmp_good(base, out1, sizeof(out1), "SAFE1") == 0, "Good 첫 번째 호출은 성공해야 한다");
    T_TRUE(create_random_tmp_good(base, out2, sizeof(out2), "SAFE2") == 0, "Good 두 번째 호출도 성공해야 한다");
    T_TRUE(strcmp(out1, out2) != 0,
        "Good은 호출마다 다른 무작위 파일명을 만들어야 한다(예측 불가능해야 트랩을 피할 수 있다)");
    T_TRUE(strcmp(out1, guess) != 0 && strcmp(out2, guess) != 0,
        "Good이 만든 실제 경로는 공격자가 미리 심어둔 예측 가능한 이름과 달라야 한다");

    read_file(victim, content, sizeof(content));
    T_TRUE(strcmp(content, "ORIGINAL") == 0,
        "Good은 victim_target 근처에 손도 대지 않아야 한다(예측 불가능한 이름 자체가 방어)");

    read_file(out1, content, sizeof(content));
    T_TRUE(strcmp(content, "SAFE1") == 0, "Good이 실제로 만든 파일에는 내용이 정확히 써져야 한다");

    unlink(guess); unlink(victim); unlink(out1); unlink(out2); rmdir(base);

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| Bad가 미리 심어둔 심볼릭 링크를 따라가 `victim_target`을 실제로 덮어쓴다(취약점 재현) | 30 | ☐ |
| Good이 호출마다 서로 다른 파일명을 만든다 | 25 | ☐ |
| Good이 만든 경로가 공격자의 예측 가능한 이름과 절대 겹치지 않고, `victim_target`도 전혀 건드리지 않는다 | 30 | ☐ |
| 목표 시간 내 | 15 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `tmpnam()`/`mktemp()`로 "이미 안전하다"고 착각 | 두 함수 모두 표준 문서 자체에서 사용을 권장하지 않는다 — 생성 없이 이름만 반환하거나(`tmpnam`), 이름 생성과 파일 생성 사이에 틈이 있어(`mktemp`) 여전히 경쟁이 성립한다. `mkstemp()`만이 "생성"까지 원자적으로 보장한다 |
| `mkstemp()` 반환 fd를 안 쓰고 경로만 받아 다시 `fopen()` | `mkstemp()`가 이미 연 파일 디스크립터를 버리고 이름으로 다시 열면, 그 사이에 또 다른 경쟁 구간이 생긴다. 받은 `fd`를 `fdopen()`으로 그대로 이어써야 한다 |
| 이 항목과 SD37을 완전히 같은 문제로 취급 | SD37은 "생성·검사의 원자성"이 핵심이고, 이 항목은 "이름 자체의 예측 가능성"이 핵심이다. `open(O_CREAT\|O_EXCL)`로 고정 이름을 원자적으로 만들어도, 그 고정 이름 자체가 알려져 있으면 공격자가 서비스 재시작 시점 등을 노려 여전히 선점할 여지가 있다 — 두 방어를 함께 적용해야 완전해진다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `symmap.h` / `symmap.c`
> ```c
> #ifndef SYMMAP_H
> #define SYMMAP_H
> #include <stddef.h>
> int open_predictable_tmp_bad(const char *dir, const char *content);
> int create_random_tmp_good(const char *dir, char *out_path, size_t out_size, const char *content);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <stdio.h>
> #include <stdlib.h>
> #include <string.h>
> #include <unistd.h>
> #include <limits.h>
> #include "symmap.h"
>
> int open_predictable_tmp_bad(const char *dir, const char *content)
> {
>     char path[PATH_MAX];
>     FILE *f;
>     snprintf(path, sizeof(path), "%s/guess.tmp", dir);   /* 이름이 항상 같다 -> 예측 가능 */
>
>     if (access(path, W_OK) != 0) return -1;
>     f = fopen(path, "w+");                                /* 심볼릭 링크면 그대로 따라간다 */
>     if (!f) return -1;
>     fputs(content, f);
>     fclose(f);
>     return 0;
> }
>
> int create_random_tmp_good(const char *dir, char *out_path, size_t out_size, const char *content)
> {
>     char path[PATH_MAX];
>     int fd;
>     FILE *f;
>
>     if (snprintf(path, sizeof(path), "%s/tmpXXXXXX", dir) >= (int)sizeof(path)) return -1;
>
>     fd = mkstemp(path);                                   /* 무작위 접미사 -- 미리 예측 불가 */
>     if (fd == -1) return -1;
>
>     f = fdopen(fd, "w");
>     if (!f) { close(fd); return -1; }
>     fputs(content, f);
>     fclose(f);
>
>     if (out_size <= strlen(path)) return -1;
>     snprintf(out_path, out_size, "%s", path);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `open_predictable_tmp_bad`의 `path`는 함수를 호출하기 **전부터** 이미 결정돼 있다(`dir` 하나만 알면 누구나 계산 가능). `create_random_tmp_good`의 `path`는 `mkstemp()` **내부에서** 커널이 결정하고, 호출자는 그 결과를 사후에 받아볼 뿐이다. "언제 이름이 정해지는가"의 차이가 곧 예측 가능성의 차이다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (임시 작업 파일) |  |  |  |
| 2 |  | B (소켓 스트리밍 저장) |  |  |  |
| 3 |  | C (사전 심볼릭 링크 스캔) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD38. 제어되지 않은 재귀](%5BSD%5D%20SD38.%20제대로%20제어되지%20않은%20재귀%20—%20깊이%20제한%20동반으로%20치환.md)
- Part 3(시간 및 상태) 3개 완료 — [다음: SD40. 오류 메시지 정보 노출](%5BSD%5D%20SD40.%20오류%20메시지를%20통한%20정보%20노출%20—%20일반%20메시지%20응답으로%20치환.md)

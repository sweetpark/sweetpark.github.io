---
title: "SD21. 중요한 자원에 대한 잘못된 권한허용 — 최소 권한 umask로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD21. 중요한 자원에 대한 잘못된 권한허용 — 최소 권한 umask로 치환

> **원본 항목**: [Part 2-1. 인가·권한 계열 — 2. 중요한 자원에 대한 잘못된 권한허용](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-1.%20인가·권한%20계열.md#2-중요한-자원에-대한-잘못된-권한허용-cwe-732) `CWE-732`
> **repo 폴더**: `sd21_umask/` (`make D=sd21_umask T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> mock 없이 **실제 파일**을 만들고 `stat()` 으로 진짜 권한 비트를 확인한다 — 이 계열에서 몇 안 되게 "파일시스템에 직접 흔적을 남기는" 드릴이다.

---

## 0. 이 드릴로 체화할 것

```diff
- umask(0);                                  /* 모두 읽고 쓰기 허용 */
+ umask(077);                                /* 소유자만 */
  int fd = open(path, O_WRONLY|O_CREAT|O_TRUNC, 0666);
```

`umask(0)` 은 "누구나 읽고 쓰라"는 선언이다. 파일 권한은 항상 최소 권한(`077`)으로 시작한다.

---

## 1. 취약 시나리오 — 변형 A: 설정 파일 생성

> [!QUOTE] 요구사항서 (발췌)
> 설정 파일을 생성할 때 파일 권한을 설정한다.
> - 소유자만 읽고 쓸 수 있어야 한다(`0600`).

### 공격 입력표

| umask 설정 | 실제 생성 권한(`open(..., 0666)` 기준) | 위험 |
| :--- | :--- | :--- |
| `umask(0)` | **`0666`(rw-rw-rw-)** | 같은 시스템의 다른 계정이나 침투한 저권한 프로세스가 읽고 쓸 수 있다 |
| `umask(077)` | `0600`(rw-------) | 소유자만 접근 가능 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 설정 파일 생성 | 위 내용 |
| **B (2회차)** | **디렉터리 생성** | `mkdir()` 에도 같은 원리가 적용된다 — 디렉터리는 실행 비트(`x`)가 있어야 그 안에 들어갈 수 있다는 점까지 고려해 권한 값을 정한다 |
| **C (3회차)** | **이미 존재하는 파일의 권한 강화** | 새로 만들 때뿐 아니라, 이미 잘못된 권한으로 존재하는 파일을 `chmod()` 로 사후에 교정하는 함수를 추가로 짜본다 |

---

## 2. 제출물

```text
sd21_umask/src/file_perm.h
sd21_umask/src/file_perm.c
sd21_umask/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <unistd.h>
#include "file_perm.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    int mode = create_file_bad("/tmp/sd21_bad.txt");
    T_TRUE(mode == 0666, "Bad는 소유자 외에도 읽고 쓸 수 있는 권한(0666)으로 생성해야 한다(취약점 재현)");
    unlink("/tmp/sd21_bad.txt");
}

static void test_good_blocks_wide_perm(void)
{
    int mode = create_file_good("/tmp/sd21_good.txt");
    T_TRUE(mode == 0600, "Good은 소유자만 읽고 쓸 수 있는 권한(0600)으로 생성해야 한다");
    unlink("/tmp/sd21_good.txt");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_wide_perm();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!WARNING] 반드시 `/tmp` 안에서 테스트할 것(WSL2 사용자)
> `/mnt/c/...`(윈도우 드라이브 마운트)는 9p 파일시스템이라 유닉스 권한 비트가 온전히 반영되지 않을 수 있다. 이 드릴은 **WSL 네이티브 경로(`/tmp`, 또는 `~`)** 에서 파일을 만들어야 `stat()` 결과가 정확하다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 — 실제 파일 권한이 `0666` 이다 | 30 | ☐ |
| `test_good_blocks_wide_perm` 통과 — 실제 파일 권한이 `0600` 이다 | 40 | ☐ |
| `umask()` 를 호출한 뒤 **원래 값으로 복귀**시켰다(다른 코드에 영향 안 줌) | 20 | ☐ |
| 테스트가 만든 파일을 끝에 `unlink` 로 정리했다 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `umask()` 호출 후 원래 값으로 되돌리지 않음 | `umask` 는 **프로세스 전역 상태**다. 한 번 바꾸면 이후 다른 파일 생성에도 계속 영향을 준다. 함수 안에서 바꿨다면 함수 안에서 반드시 복원한다 |
| `open()` 의 `mode` 인자를 `0600` 으로 미리 낮춰놓고 `umask` 효과를 확인 안 함 | 이 드릴의 핵심은 "umask가 최종 권한을 어떻게 깎아내는지"다. `mode` 인자는 항상 넉넉하게(`0666`) 주고 umask로 실제 결과가 달라지는 걸 관찰해야 의미가 있다 |
| WSL의 `/mnt/c` 경로에서 테스트해서 권한이 항상 이상하게 나옴 | 위 경고 참고 — 네이티브 리눅스 파일시스템에서 테스트한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `file_perm.h` / `file_perm.c`
> **헤더 (`file_perm.h`)**
> ```c
> #ifndef FILE_PERM_H
> #define FILE_PERM_H
> int create_file_bad(const char *path);
> int create_file_good(const char *path);
> #endif
> ```
> **구현 (`file_perm.c`)**
> ```c
> #include <sys/types.h>
> #include <sys/stat.h>
> #include <fcntl.h>
> #include <unistd.h>
> #include "file_perm.h"
>
> static int get_file_mode(const char *path)
> {
>     struct stat st;
>     if (stat(path, &st) != 0) return -1;
>     return (int)(st.st_mode & 0777);
> }
>
> int create_file_bad(const char *path)
> {
>     mode_t old = umask(0);
>     int fd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0666);
>     umask(old);
>     if (fd < 0) return -1;
>     close(fd);
>     return get_file_mode(path);
> }
>
> int create_file_good(const char *path)
> {
>     mode_t old = umask(077);
>     int fd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0666);
>     umask(old);
>     if (fd < 0) return -1;
>     close(fd);
>     return get_file_mode(path);
> }
> ```
>
> **눈여겨볼 점**: `open()` 에 넘긴 `mode` 인자(`0666`)는 **양쪽 함수가 완전히 동일**하다. 실제 파일 권한을 가른 것은 오직 그 앞에 있었던 `umask()` 한 줄뿐이다 — 최종 권한은 `mode & ~umask` 로 계산된다는 사실이 이 드릴의 전부다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (설정 파일) |  |  |  |
| 2 |  | B (디렉터리) |  |  |  |
| 3 |  | C (사후 chmod) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD20. 부적절한 인가](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD20.%20부적절한%20인가%20—%20세션%20식별자%20대조로%20치환.md)
- [다음: SD22. 잘못된 권한 부여](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD22.%20잘못된%20권한%20부여%20—%20그룹별%20UID%20테이블로%20치환.md)

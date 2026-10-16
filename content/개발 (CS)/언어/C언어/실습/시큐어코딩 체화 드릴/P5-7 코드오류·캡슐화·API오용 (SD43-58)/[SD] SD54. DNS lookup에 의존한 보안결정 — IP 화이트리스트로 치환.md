---
title: "SD54. DNS lookup에 의존한 보안결정 — IP 화이트리스트로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD54. DNS lookup에 의존한 보안결정 — IP 화이트리스트로 치환

> **원본 항목**: [Part 7. API 오용 — 1. DNS lookup에 의존한 보안결정](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%207.%20API%20오용.md#1-dns-lookup에-의존한-보안결정-cwe-247) `CWE-247`
> **repo 폴더**: `sd54_dnstrust/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> Part 7(API 오용)의 첫 드릴이다.
> 실제 `gethostbyname()`은 네트워크·시스템 DNS 설정에 의존해 테스트가 실행 환경마다 달라지므로, "DNS 캐시가 포이즈닝됐다"는 상황 자체를 인자(`poisoned`)로 직접 제어해 **공격이 성공하는 순간**을 결정론적으로 재현한다.

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
- trustedSites.insert("www.trust.com");         /* 도메인명 기준 */
- hostent *record = gethostbyname();            /* DNS 조회 의존 */
- if (trustedSites.count(targetSite) > 0) SendContract(ip_address);
+ trustedSiteIPs.insert("232.234.89.52");       /* IP 기준 */
+ if (trustedSiteIPs.count(targetSiteIp) > 0) SendContract(targetSiteIp);  /* DNS 개입 없음 */
```

"이름은 속일 수 있다." 보안 판정의 기준 값은 DNS가 개입하지 않는 값(IP 화이트리스트)으로 잡아야 한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 계약서 전송 대상 결정 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 로그인 리다이렉트 대상 검증으로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** IP도 위조 가능하다는 한계까지 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 계약서 전송 대상 결정

신뢰할 수 있는 사이트로만 계약서를 전송한다.
- DNS가 조작되더라도 신뢰 판정이 뒤집혀서는 안 된다.

**함수**

```c
const char *resolve_hostname_like(const char *hostname, int poisoned);
int decide_send_target_bad(const char *hostname, int poisoned, char *out_ip, size_t out_size);
int decide_send_target_good(const char *claimed_ip, char *out_ip, size_t out_size);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `hostname`으로 조회한 DNS 응답(IP) | DNS 서버(캐시 포이즈닝에 취약) | 그 IP를 그대로 전송 목적지로 신뢰하는 지점 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| DNS 정상 | 진짜 신뢰 IP(`203.0.113.10`)로 전송 | 우연히 문제없이 동작한다 |
| **DNS 포이즈닝됨** | **여전히 "신뢰함"으로 판정되고, 전송 목적지가 공격자 IP(`198.51.100.66`)로 바뀜** | 신뢰 판정 자체가 도메인 **이름**만 보고 이뤄져, DNS가 실제로 무엇을 반환했는지는 검증하지 않는다 |
| 같은 상황(Good) | 공격자 IP는 화이트리스트에 없으므로 거부 | 이름이 아니라 **IP 자체**를 화이트리스트와 비교한다 — DNS 조회 결과가 판정에 아예 관여하지 않는다 |

### 1-B. 변형 B — 로그인 리다이렉트 대상 검증으로 변형

"이 도메인으로 리다이렉트해도 되는가"를 판정하는 함수로 바꿔, OAuth 콜백 URL 검증 같은 실전 시나리오와 연결한다

### 1-C. 변형 C — IP도 위조 가능하다는 한계까지 확장

화이트리스트에 있는 IP라도 그 IP가 실제로 같은 조직 소유인지까지는 이 함수가 보장하지 못한다는 걸 주석으로 남기고, TLS 인증서 검증 같은 추가 계층이 왜 필요한지 한 줄로 정리해본다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `decide_send_target_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int decide_send_target_bad(const char *hostname, int poisoned,
                           char *out_ip, size_t out_size)
{
    /* 1. hostname 이 "www.trust.com" 이 아니면 return -1   ← 도메인명만 확인
     * 2. resolved = resolve_hostname_like(hostname, poisoned)   NULL 이면 return -1
     * 3. snprintf(out_ip, out_size, "%s", resolved)   ← DNS 가 알려준 IP 를 그대로 신뢰
     * 4. return 0 */
}

int decide_send_target_good(const char *claimed_ip, char *out_ip, size_t out_size)
{
    /* [ ] 1. 시그니처에서 hostname, poisoned 를 **없앤다**
     *        DNS 는 판정 경로에 들어오지 않는다 */

    /* [ ] 2. IP 화이트리스트를 직접 비교
     *        strcmp(claimed_ip, "203.0.113.10") != 0 → return -1 */

    /* [ ] 3. snprintf(out_ip, out_size, "%s", claimed_ip) */

    /* [ ] 4. return 0 */
}
```

### 2-B. `decide_send_target_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int decide_send_target_good(const char *claimed_ip, char *out_ip, size_t out_size)
{
    /* [ ] 1. 시그니처에서 hostname, poisoned 를 **없앤다** */

    /* [ ] 2. IP 화이트리스트를 직접 비교 */

    /* [ ] 3. snprintf(out_ip, out_size, "%s", claimed_ip) */

    /* [ ] 4. return 0 */
}
```

### 2-C. `decide_send_target_good` — Level 3 (3회차, 백지)

```c
int decide_send_target_good(const char *claimed_ip, char *out_ip, size_t out_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `resolve_hostname_like(host, poisoned)` 로 DNS 오염을 흉내낸다
     *   - DNS 를 검증하는 게 아니라 판정 경로에서 **뺀다**
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
sd54_dnstrust/src/dnstrust.h
sd54_dnstrust/src/dnstrust.c
sd54_dnstrust/test/test.c
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
#include <string.h>
#include "dnstrust.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_normal_without_poisoning(void)
{
    char out[64];
    T_TRUE(decide_send_target_bad("www.trust.com", 0, out, sizeof(out)) == 0, "포이즈닝이 없으면 정상 전송돼야 한다");
    T_TRUE(strcmp(out, "203.0.113.10") == 0, "정상 상황에서는 진짜 신뢰 IP로 전송돼야 한다");
}

static void test_bad_is_vulnerable_to_poisoning(void)
{
    char out[64];
    T_TRUE(decide_send_target_bad("www.trust.com", 1 /* 포이즈닝됨 */, out, sizeof(out)) == 0,
        "Bad는 DNS가 포이즈닝돼도 도메인명만 보고 여전히 '신뢰함'으로 판정해야 한다(취약점 재현)");
    T_TRUE(strcmp(out, "198.51.100.66") == 0,
        "그 결과 데이터가 공격자 IP로 전송되는 목적지가 설정돼야 한다(공격 성공 재현)");
}

static void test_good_accepts_whitelisted_ip(void)
{
    char out[64];
    T_TRUE(decide_send_target_good("203.0.113.10", out, sizeof(out)) == 0, "화이트리스트에 있는 IP는 통과해야 한다");
    T_TRUE(strcmp(out, "203.0.113.10") == 0, "전송 목적지가 정확해야 한다");
}

static void test_good_rejects_attacker_ip(void)
{
    char out[64];
    T_TRUE(decide_send_target_good("198.51.100.66", out, sizeof(out)) == -1,
        "Good은 DNS 이름을 아예 보지 않고 IP 자체를 비교하므로 공격자 IP를 거부해야 한다");
}

int main(void)
{
    test_bad_normal_without_poisoning();
    test_bad_is_vulnerable_to_poisoning();
    test_good_accepts_whitelisted_ip();
    test_good_rejects_attacker_ip();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 로그인 리다이렉트 대상 검증으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| OAuth 콜백 URL 의 도메인 | 도메인 문자열만 보고 허용 | 허용 목록과 정확히 일치할 때만 |
| 허용 목록의 URL | 허용 | 허용 |

**변형 C — IP도 위조 가능하다는 한계까지 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 화이트리스트 IP 인데 다른 조직 소유 | 허용 | 허용 — IP 판정의 한계, 주석으로 남기고 TLS 인증서 검증을 병행 |
| 목록에 없는 IP | 허용 | 거부 (-1) |

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
make D=sd54_dnstrust V=main SRC="sd54_dnstrust/src/dnstrust.c sd54_dnstrust/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd54_dnstrust/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd54_dnstrust/src/dnstrust.c sd54_dnstrust/test/test.c \
>     -pthread -o build/sd54_dnstrust_main
> ./build/sd54_dnstrust_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "도메인명 화이트리스트도 화이트리스트 아닌가"라고 생각 | 화이트리스트에 무엇을 넣는지가 아니라, **그 값을 어떻게 얻었는지**가 핵심이다.<br>도메인명은 신뢰할 수 있어도, 그 이름이 "지금 실제로 가리키는 곳"은 DNS라는 신뢰할 수 없는 중간 단계를 거친다 |
| Bad를 고치면서 `gethostbyname()` 호출을 아예 없애지 않고 결과만 다르게 씀 | DNS 조회 자체가 신뢰 경계를 넘나드는 지점이다.<br>보안 판정 경로에서는 조회를 하되 그 결과를 신뢰 판정에 **쓰지 않아야** 한다(로깅 등 다른 목적에는 써도 된다) |
| IP 화이트리스트면 완전히 안전하다고 믿음 | 변형 C에서 짚었듯 IP도 스푸핑·BGP 하이재킹 등으로 위조될 수 있다.<br>이 치환은 "DNS보다 낫다"는 것이지 "완전히 안전하다"는 뜻이 아니다 — TLS 인증서 검증 등 추가 계층이 실무에서는 함께 필요하다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `dnstrust.h` / `dnstrust.c`
> ```c
> #ifndef DNSTRUST_H
> #define DNSTRUST_H
> #include <stddef.h>
> const char *resolve_hostname_like(const char *hostname, int poisoned);
> int decide_send_target_bad(const char *hostname, int poisoned, char *out_ip, size_t out_size);
> int decide_send_target_good(const char *claimed_ip, char *out_ip, size_t out_size);
> #endif
> ```
> ```c
> #include <stdio.h>
> #include <string.h>
> #include "dnstrust.h"
>
> const char *resolve_hostname_like(const char *hostname, int poisoned)
> {
>     if (strcmp(hostname, "www.trust.com") != 0) return NULL;
>     return poisoned ? "198.51.100.66" : "203.0.113.10";
> }
>
> int decide_send_target_bad(const char *hostname, int poisoned, char *out_ip, size_t out_size)
> {
>     const char *resolved;
>     if (strcmp(hostname, "www.trust.com") != 0) return -1;   /* 도메인명만 확인 */
>     resolved = resolve_hostname_like(hostname, poisoned);
>     if (!resolved) return -1;
>     snprintf(out_ip, out_size, "%s", resolved);                /* DNS가 알려준 IP를 그대로 신뢰 */
>     return 0;
> }
>
> int decide_send_target_good(const char *claimed_ip, char *out_ip, size_t out_size)
> {
>     if (strcmp(claimed_ip, "203.0.113.10") != 0) return -1;    /* IP 화이트리스트 직접 비교 */
>     snprintf(out_ip, out_size, "%s", claimed_ip);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `decide_send_target_good`의 시그니처에는 `hostname`도, `poisoned`도, `resolve_hostname_like` 호출도 **아예 없다**.
> 가장 확실한 치환은 "DNS 결과를 검증하는 로직 추가"가 아니라 **"DNS를 판정 경로에서 완전히 빼는 것"**이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD53. 시스템 데이터 정보노출](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD53.%20시스템%20데이터%20정보노출%20—%20경로%20제외%20일반%20메시지로%20치환.md)
- [다음: SD55. 위험한 함수 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD55.%20위험하다고%20알려진%20함수%20사용%20—%20fork%20치환으로%20치환.md)

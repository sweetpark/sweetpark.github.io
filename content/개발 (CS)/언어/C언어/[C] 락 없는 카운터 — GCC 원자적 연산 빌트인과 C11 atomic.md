---
title: "락 없는 카운터 — GCC 원자적 연산 빌트인과 C11 atomic"
tags: [학습, 개발-CS, 언어, C언어, 멀티스레드, 원자적연산, atomic]
created: 2026-09-17
modified: 2026-09-17
---

# 락 없는 카운터 — GCC 원자적 연산 빌트인과 C11 atomic

> [!NOTE]
> 여러 스레드가 동시에 건드리는 정수 카운터를, 뮤텍스 없이도 안전하게 증가시키는 원자적 연산(atomic operation) 빌트인을 정리한다. GCC `__sync_*`/`__atomic_*` 빌트인과 C11 `<stdatomic.h>`를 비교한다.

## 0. 왜 필요한가

여러 스레드가 공유하는 요청 처리 카운터가 있다고 하면, 직관적으로는 이렇게 쓰고 싶어진다.

```c
static int g_req_count = 0;

void on_request(void) {
    g_req_count++;   /* 여러 스레드가 동시에 부르면 안전하지 않다 */
}
```

`g_req_count++`은 한 줄이지만 실제로는 **읽기(load) → 더하기(add) → 쓰기(store)** 세 단계로 쪼개져서 실행된다. 스레드 A가 값을 읽은 직후, 아직 쓰기 전에 스레드 B가 끼어들어 같은 옛날 값을 읽고 더해서 쓰면, 두 번 증가해야 할 값이 한 번만 증가한 채 끝난다(레이스 컨디션). 뮤텍스로 감싸면 확실히 안전하지만, 단순 증가 연산 하나 때문에 매번 잠금/해제 비용을 치르는 건 과하다 — 이럴 때 쓰는 게 원자적 연산이다.

## 1. GCC 빌트인 — `__sync_fetch_and_add`

```c
static int g_req_count = 0;

void on_request(void)
{
    __sync_fetch_and_add(&g_req_count, 1);   /* +1을 원자적으로(끊기지 않게) 수행 */
}

int old = __sync_fetch_and_add(&g_req_count, 1);
/* old에는 "더하기 전" 값이 담긴다 — 함수 이름 그대로 fetch(가져오기) 후 add(더하기) */
```

`__sync_fetch_and_add(ptr, value)`는 "읽기·더하기·쓰기"를 **하나의 끊기지 않는 동작**으로 CPU에게 보장받는다(대부분의 아키텍처에서 `LOCK XADD` 같은 전용 명령어로 구현된다). 뮤텍스처럼 다른 스레드를 잠깐 재우는 게 아니라, 하드웨어 수준에서 "이 명령어는 중간에 안 끼어든다"는 걸 보장하는 방식이라 훨씬 가볍다.

## 2. `__atomic_*` 빌트인과 C11 `<stdatomic.h>` — 표준화된 최신 방식

`__sync_*` 계열은 오래됐고 메모리 순서(memory order)를 세밀하게 지정할 수 없다. GCC 4.7 이상에서는 `__atomic_*` 빌트인을, C11부터는 아예 언어 표준에 포함된 `<stdatomic.h>`를 쓸 수 있다.

```c
#include <stdatomic.h>

static atomic_int g_req_count = 0;   /* 일반 int 대신 atomic_int로 선언 */

void on_request(void)
{
    atomic_fetch_add(&g_req_count, 1);
}

int current = atomic_load(&g_req_count);   /* 읽기도 원자적으로 */
```

| 방식 | 표준 여부 | 특징 |
| --- | --- | --- |
| `__sync_fetch_and_add` | GCC 확장(비표준) | 가장 오래됐고 이식성 있는 컴파일러가 많지만, 메모리 순서를 고를 수 없음(항상 가장 엄격한 순서로 동작) |
| `__atomic_fetch_add` | GCC/Clang 확장 | 메모리 순서(`__ATOMIC_RELAXED` 등)를 지정할 수 있어 세밀한 최적화 가능 |
| `atomic_fetch_add` (`<stdatomic.h>`) | **C11 표준** | 컴파일러 무관하게 이식 가능. 신규 코드라면 이 방식이 우선 |

## 3. 뮤텍스 대신 원자적 연산으로 충분한 경우 vs 아닌 경우

원자적 연산은 **"값 하나"에 대한 단순한 연산**(증가, 감소, 교환, compare-and-swap)까지만 보장한다. 여러 필드를 동시에 일관되게 바꿔야 한다면 그건 원자적 연산의 영역이 아니다.

```c
typedef struct {
    int active_count;
    int total_count;
} stats_t;

static stats_t g_stats;

/* 이렇게 각각 원자적으로 바꿔도 "두 필드가 항상 같이 일관된 상태"는 보장되지 않는다 */
__sync_fetch_and_add(&g_stats.active_count, 1);
__sync_fetch_and_add(&g_stats.total_count, 1);
/* 두 호출 사이에 다른 스레드가 g_stats를 읽으면, active_count만 늘고 total_count는 아직 그대로인
   "중간 상태"를 볼 수 있다 */
```

`active_count`와 `total_count`를 **항상 같이** 늘려야 하는 불변조건이 있다면, 이 경우엔 뮤텍스로 두 필드를 함께 잠그는 게 맞다. **원자적 연산은 "변수 하나만 안전하면 되는 경우"의 최적화이지, 여러 값 사이의 일관성까지 보장해주는 도구가 아니다.**

## 4. 자주 하는 실수

- **여러 변수를 각각 원자적으로 바꾸고 전체가 일관될 거라 착각하기** — 3번 항목 그대로다. 개별 연산은 안전해도, 그 연산들 "사이"에 다른 스레드가 끼어드는 건 막지 못한다.
- **`__sync_*`와 `__atomic_*`를 섞어 쓰기** — 같은 변수에 대해 두 계열을 혼용하면 컴파일러가 가정하는 메모리 순서 모델이 달라져 예상 못 한 최적화가 끼어들 수 있다. 한 변수에는 한 계열만 일관되게 쓴다.
- **일반 `int`를 그냥 `__atomic_*`/`atomic_*` 함수에 넘기면 다 안전해진다고 오해하기** — `<stdatomic.h>` 방식은 변수 자체를 `atomic_int`처럼 원자적 타입으로 선언해야 컴파일러와 하드웨어가 올바르게 정렬(alignment)과 접근 방식을 보장한다. 그냥 `int`에 `atomic_fetch_add`를 억지로 캐스팅해서 쓰는 건 정의되지 않은 동작이다.
- **이식성을 고려 안 하고 최신 빌트인만 쓰기** — 오래된 GCC(4.7 미만)나 특정 임베디드 툴체인은 `__atomic_*`/`<stdatomic.h>`를 지원하지 않을 수 있다. 여러 컴파일러/플랫폼을 대상으로 하는 코드베이스라면 빌드 시스템에서 지원 여부를 확인하고 `__sync_*`로 폴백하는 조건부 컴파일이 필요할 수 있다(관련 패턴: [전처리기 조건부 컴파일]([C]%20전처리기%20조건부%20컴파일%20—%20%23if%200으로%20코드%20끄기와%20빌드%20옵션%20분기.md)).

## 관련 문서

- [배열 기반 원형 큐(Ring Buffer) — front·back 인덱스로 만드는 큐]([C]%20배열%20기반%20원형%20큐(Ring%20Buffer)%20—%20front·back%20인덱스로%20만드는%20큐.md)
- [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)

---
title: "함수 포인터와 디스패치 테이블 — switch 대신 테이블로 분기하기"
tags: [학습, 개발-CS, 언어, C언어, 함수포인터, 디스패치테이블, 상태머신]
created: 2026-09-17
modified: 2026-09-17
---

# 함수 포인터와 디스패치 테이블 — switch 대신 테이블로 분기하기

> [!NOTE]
> 이벤트·메시지 종류가 늘어날수록 비대해지는 if-else/switch 사슬을, 함수 포인터를 담은 테이블로 대체하는 패턴을 정리한다. 상태 머신, 이벤트 핸들러, 커스텀 정렬처럼 "종류에 따라 다른 함수를 호출한다"는 문제는 대부분 이 패턴 하나로 풀린다.

## 0. 왜 필요한가

이벤트나 메시지 타입이 늘어날 때마다 처리 코드에 분기를 하나씩 추가하는 방식은 금방 한계에 부딪힌다.

```c
void handle_event(int event_type, void *msg)
{
    if (event_type == EVT_CONNECT)         on_connect(msg);
    else if (event_type == EVT_DISCONNECT) on_disconnect(msg);
    else if (event_type == EVT_TIMEOUT)    on_timeout(msg);
    else if (event_type == EVT_ERROR)      on_error(msg);
    /* 이벤트가 늘어날 때마다 여기에 한 줄씩 계속 추가... */
}
```

이벤트가 20개, 30개로 늘어나면 함수 하나가 수백 줄짜리 분기 덩어리가 되고, 새 이벤트를 추가할 때마다 이 함수를 찾아가 고쳐야 한다. **"이벤트 번호 → 처리 함수"의 대응 관계를 테이블(배열/구조체)로 뽑아내면**, 분기 로직 자체가 사라지고 테이블에 항목 하나를 추가하는 문제로 바뀐다.

## 1. 함수 포인터 문법 — typedef로 가독성 확보

함수 포인터의 기본 선언 형태는 `반환형 (*변수명)(인자목록);`이다.

```c
int on_connect(void *msg);   /* 이런 시그니처의 함수를 가리키려면 */

int (*handler)(void *msg);   /* 이렇게 선언한다 */
handler = on_connect;        /* 함수 이름 자체가 함수의 주소이므로 & 는 생략 가능 */
handler(msg);                /* (*handler)(msg); 와 동일 — 둘 다 표준이 허용 */
```

매번 이 형태를 풀어 쓰면 가독성이 떨어지므로, 실무에서는 거의 항상 `typedef`로 함수 포인터 타입에 이름을 붙여 쓴다.

```c
typedef int (*event_handler_t)(void *msg);

event_handler_t handler = on_connect;
```

## 2. 배열로 만드는 점프 테이블 — 이벤트 번호가 곧 인덱스일 때

이벤트 번호가 `0, 1, 2, 3 ...`처럼 촘촘한 정수라면, 함수 포인터 배열 하나로 분기를 통째로 대체할 수 있다.

```c
typedef int (*event_handler_t)(void *msg);

static int on_connect(void *msg)    { /* ... */ return 0; }
static int on_disconnect(void *msg) { /* ... */ return 0; }
static int on_timeout(void *msg)    { /* ... */ return 0; }

enum { EVT_CONNECT, EVT_DISCONNECT, EVT_TIMEOUT, EVT_MAX };

static const event_handler_t EVENT_TABLE[EVT_MAX] = {
    [EVT_CONNECT]    = on_connect,
    [EVT_DISCONNECT] = on_disconnect,
    [EVT_TIMEOUT]    = on_timeout,
};

int handle_event(int event_type, void *msg)
{
    if (event_type < 0 || event_type >= EVT_MAX || EVENT_TABLE[event_type] == NULL) {
        return -1;   /* 등록 안 된 이벤트 — 반드시 범위 검사 후 호출 */
    }
    return EVENT_TABLE[event_type](msg);
}
```

`[EVT_CONNECT] = on_connect`처럼 인덱스를 지정해서 초기화하는 문법을 **지정 초기화(designated initializer)** 라고 한다. 나열 순서와 무관하게 값이 들어가고, 명시하지 않은 나머지 칸은 자동으로 `NULL`(포인터 배열 기준)로 채워지므로 이벤트 몇 개가 비어 있어도 안전하다.

## 3. 구조체 + 조회 테이블 — 이벤트 번호가 듬성듬성하거나 조합 조건일 때

이벤트 번호가 연속적이지 않거나(상태 코드, 프로토콜 메시지 ID 등), **상태(state)와 이벤트(event)의 조합**에 따라 다른 함수를 불러야 하는 상태 머신이라면, 배열 인덱싱 대신 "테이블을 순회하며 조건에 맞는 항목을 찾는" 방식을 쓴다.

```c
typedef int (*state_func_t)(void *ctx, void *msg);

typedef struct {
    int          state;    /* 현재 상태 */
    int          event;    /* 들어온 이벤트 */
    state_func_t func;     /* 이 조합일 때 부를 함수 */
} transition_t;

static int do_connect(void *ctx, void *msg);
static int do_retry(void *ctx, void *msg);

static const transition_t TRANSITION_TABLE[] = {
    { STATE_IDLE,  EVT_CONNECT, do_connect },
    { STATE_RETRY, EVT_TIMEOUT, do_retry },
    { -1, -1, NULL }   /* 종료 표식(sentinel) */
};

int dispatch(int state, int event, void *ctx, void *msg)
{
    const transition_t *t;

    for (t = TRANSITION_TABLE; t->func != NULL; t++) {
        if (t->state == state && t->event == event) {
            return t->func(ctx, msg);
        }
    }
    return -1;   /* 정의되지 않은 (state, event) 조합 */
}
```

핵심은 `dispatch()` 함수 자체는 이벤트가 몇 개가 되든 **한 줄도 안 바뀐다**는 것이다. 새로운 상태 전이를 추가할 때는 `TRANSITION_TABLE`에 행 하나만 추가하면 되고, 그 표만 보면 상태 머신 전체의 전이 규칙을 한눈에 파악할 수 있다는 부수 효과도 있다.

## 4. 콜백으로 넘기기 — 비교 기준을 함수로 주입하기

함수 포인터의 또 다른 흔한 용도는 "어떻게 비교할지"를 함수 자체로 넘겨서, 알고리즘과 판단 기준을 분리하는 것이다. 표준 라이브러리 `qsort`가 대표적이다.

```c
#include <stdlib.h>

int cmp_int_asc(const void *a, const void *b)
{
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);   /* x>y면 1, x<y면 -1, 같으면 0 */
}

int arr[] = { 5, 2, 8, 1 };
qsort(arr, 4, sizeof(int), cmp_int_asc);   /* 비교 함수만 바꾸면 내림차순도 그대로 재사용 */
```

`qsort`는 데이터가 `int`든 구조체든 신경 쓰지 않는다 — "두 원소를 어떻게 비교하느냐"만 `cmp_int_asc`라는 함수로 위임받았기 때문에, 정렬 로직 자체는 타입에 무관하게 재사용된다.

## 5. 자주 하는 실수

- **함수 포인터 배열에 없는 인덱스로 바로 접근하기** — 2번 예제의 범위 검사(`event_type >= EVT_MAX`)를 빼먹으면 배열 밖 메모리를 함수 주소로 착각해서 호출하는 심각한 버그가 된다. 테이블 기반 분기는 반드시 "찾았는지"부터 확인하고 호출한다.
- **시그니처가 다른 함수를 강제로 캐스팅해서 테이블에 넣기** — 인자 개수나 타입이 다른 함수를 `(event_handler_t)other_func`처럼 캐스팅해서 테이블에 끼워 넣으면 컴파일은 통과할 수 있어도 실제 호출 시 정의되지 않은 동작이다. 테이블에 들어갈 함수들은 처음부터 같은 시그니처로 통일해서 설계한다.
- **`typedef` 없이 원본 문법을 그대로 여기저기 반복하기** — `int (*arr[10])(void *);`처럼 함수 포인터 배열 선언은 괄호가 겹쳐 읽기 어렵다. 타입에 이름을 붙이고(`typedef int (*handler_t)(void *); handler_t arr[10];`) 나면 선언도 짧아지고 시그니처를 통일하기도 쉬워진다.
- **센티넬(sentinel)로 끝나는 테이블에서 종료 조건을 잘못 잡기** — 3번 예제처럼 `{ -1, -1, NULL }`로 끝을 표시하는 테이블은 순회 조건이 `t->func != NULL`이어야 한다. `state`/`event` 값만 보고 끝을 판단하면, 실제 유효한 항목의 값이 우연히 그 값과 겹칠 때 테이블이 중간에서 끊긴다.

## 관련 문서

- [비트플래그(Bit Flag) 연산]([C]%20비트플래그(Bit%20Flag)%20연산.md)
- [extern과 static — 링키지와 다중 파일 공유]([C]%20extern과%20static%20—%20링키지와%20다중%20파일%20공유.md)
- [가변 인자 함수 — stdarg.h로 나만의 printf 만들기]([C]%20가변%20인자%20함수%20—%20stdarg.h로%20나만의%20printf%20만들기.md)
- [배열 기반 원형 큐(Ring Buffer) — front·back 인덱스로 만드는 큐]([C]%20배열%20기반%20원형%20큐(Ring%20Buffer)%20—%20front·back%20인덱스로%20만드는%20큐.md)
- [정수를 void 포인터 인자에 실어 보내기 — intptr_t 캐스팅 관용구]([C]%20정수를%20void%20포인터%20인자에%20실어%20보내기%20—%20intptr_t%20캐스팅%20관용구.md)

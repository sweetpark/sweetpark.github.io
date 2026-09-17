---
title: "pthread_create에 구조체 포인터 넘기기 — void*와 이중포인터 정리"
tags: [학습, 개발-CS, 언어, C언어, 포인터, 캐스팅, 스레드, pthread]
created: 2026-09-17
modified: 2026-09-17
---

# pthread_create에 구조체 포인터 넘기기 — void*와 이중포인터 정리

> [!NOTE]
> `pthread_create`의 마지막 인자(`void *`)로 구조체 포인터를 넘길 때 `&`를 붙여야 하는 경우와 안 붙여도 되는 경우, 이중포인터일 때의 규칙을 정리한다.

## 0. 배경

질문 예시를 정리하면 이런 코드다.

```c
struct_temp *ctx;
pthread_create(&tid, NULL, worker, ctx);

void *worker(void *arg)
{
    struct_temp *c = (struct_temp *)arg;
    /* ... */
}
```

이렇게 쓰면 되는지, `&`를 붙여야 할 때와 안 붙여도 될 때를 어떻게 구분하는지, 이중포인터일 때는 규칙이 어떻게 되는지가 헷갈리는 지점이다.

> 여기서 `struct_temp`는 편의상 표기이며 실제로는 `struct temp *ctx;`(구조체 태그 이름) 또는 `typedef struct { ... } temp_t; temp_t *ctx;` 형태일 것이다. 받는 쪽 캐스팅도 실제 타입 이름을 그대로 써야 한다.

## 1. pthread_create 마지막 인자는 "포인터 값 하나"

```c
int pthread_create(pthread_t *thread, const pthread_attr_t *attr,
                    void *(*start_routine)(void *), void *arg);
```

`arg`는 `void *` 딱 하나다. 여기에 뭘 채워 넣을지는 호출하는 쪽 마음이고, 콜백(`start_routine`) 안에서 원래 타입으로 다시 캐스팅해서 쓴다. 핵심 규칙은 하나뿐이다.

> **넘길 때 이미 갖고 있는 값이 포인터냐 아니냐만 본다.**
> - 이미 포인터(`T *ptr`) → 그대로 넘긴다.
> - 포인터가 아닌 값 자체(`T val`) → 주소를 떠서(`&val`) 넘긴다.

## 2. 구조체 포인터를 넘기는 정석 패턴

```c
struct_temp *ctx = malloc(sizeof(*ctx));
ctx->fd = fd;
ctx->id = id;

pthread_create(&tid, NULL, worker, ctx);   /* ctx는 이미 struct_temp* 이므로 그대로 넘김 */

void *worker(void *arg)
{
    struct_temp *ctx = (struct_temp *)arg;   /* void* -> struct_temp* 캐스팅으로 원래 타입 복원 */
    /* ctx->fd, ctx->id 사용 */
    free(ctx);   /* 이 스레드가 마지막 사용자라면 여기서 해제 — 소유권을 누가 갖는지 미리 정해둬야 함 */
    return NULL;
}
```

- `ctx`는 이미 `struct_temp *`이므로 `&ctx`를 넘기면 안 된다 — `&ctx`를 넘기면 타입이 `struct_temp **`(이중포인터)가 되어 콜백 쪽 캐스팅과 어긋난다(4번 참고).
- `void*` ↔ 다른 객체 포인터 타입 간 변환은 C 표준상 암묵적으로도 가능하다(캐스팅 없이 대입해도 컴파일됨). 그런데도 실무에서 `(struct_temp *)arg`처럼 명시적으로 캐스팅하는 이유는 (1) 코드를 읽을 때 의도가 분명해지고, (2) C++로 컴파일할 경우(예: C/C++ 겸용 헤더) `void*` → 구체 타입 변환은 명시적 캐스팅이 필수라서, 처음부터 캐스팅을 써두면 이식성이 좋아지기 때문이다.

## 3. 헷갈리는 지점 — "포인터인데 왜 &를 안 붙이나"

`&`는 "이 변수의 주소를 달라"는 연산자다. `ctx`가 이미 `struct_temp *`(포인터 변수)라면, `ctx` 자체가 "이미 어떤 구조체의 주소"를 담고 있다. 여기에 `&`를 또 붙이면 "포인터 변수 `ctx` 자신이 메모리 어디에 있는지"(포인터의 포인터)를 구하는 게 되어버려, 원하던 "구조체의 주소"와는 전혀 다른 값이 된다.

```c
int x = 5;
int *p = &x;     /* p: x의 주소 */
int **pp = &p;    /* pp: p 변수 자신의 주소 — x와는 한 단계 더 떨어짐 */
```

같은 원리다.

```c
struct_temp *ctx = malloc(...);
pthread_create(..., ctx);    /* O — struct_temp* 그대로 */
pthread_create(..., &ctx);   /* X (의도한 값 아님) — struct_temp**가 되어버림 */
```

## 4. 이중포인터(T**)는 언제, 어떻게 넘기나

원래부터 `T **` 타입인 값(포인터 배열 등)을 넘기고 싶을 때는 규칙이 한 단계 밀려서 똑같이 적용된다 — "이미 `T **`라면 그대로, `T *` 하나뿐인데 그 주소가 필요하면 `&`".

```c
struct_temp **arr = malloc(n * sizeof(*arr));  /* arr: struct_temp** */
pthread_create(&tid, NULL, worker, arr);        /* arr 자체가 이미 T** 이므로 그대로 넘김 */

void *worker(void *raw)
{
    struct_temp **arr = (struct_temp **)raw;    /* 캐스팅도 T**로 맞춤 */
    struct_temp *first = arr[0];                /* 또는 *arr */
}
```

"이중포인터의 주소"(`T ***`)까지 넘기는 경우는 실무에서 거의 없다 — 스레드가 포인터 배열 하나를 통째로 받아 인덱싱하는 상황 정도가 아니면 나올 일이 드물다. 그런 극단적인 경우가 필요해도 규칙은 동일하게 한 단계 더 밀릴 뿐이다.

## 5. 요약 — 판단 순서

1. 넘기고 싶은 값이 무슨 타입인지 확인한다(`T` 값 자체인지, `T*`인지, `T**`인지).
2. 그 값을 그대로 `void*` 자리에 넣는다. 포인터가 아니면(`T`) `&`로 주소를 떠서 넣는다.
3. 받는 쪽(콜백) 캐스팅은 넘긴 실제 타입과 정확히 짝을 맞춘다 — `T`의 주소를 넘겼으면 `(T *)arg`, `T*`를 그대로 넘겼으면 결과적으로 같은 `(T *)arg`, `T**`를 넘겼으면 `(T **)arg`.
4. `&`를 추가로 붙일지는 "지금 들고 있는 값이 이미 포인터냐"로만 결정한다 — 몇 단계짜리 포인터든 규칙은 동일하게 반복 적용된다.

## 6. 주의 — 스레드 생명주기와 소유권

`ctx`를 스택 지역 변수로 두고 그 주소만 넘기면(`struct_temp ctx; pthread_create(..., &ctx);` 형태), 넘기는 쪽 함수가 스레드보다 먼저 리턴해버릴 때 `ctx`가 가리키던 스택 메모리가 무효화된 뒤 스레드가 그 주소를 읽는 use-after-scope 버그가 된다. `malloc`으로 힙에 만들고 소유권(누가 `free`할지)을 미리 정해두는 게 안전하다 — 값 하나만 넘길 때의 비슷한 함정은 [[C] 정수를 void 포인터 인자에 실어 보내기 — intptr_t 캐스팅 관용구]([C]%20정수를%20void%20포인터%20인자에%20실어%20보내기%20—%20intptr_t%20캐스팅%20관용구.md)에서 더 다뤘다.

## 관련 문서

- [[C] 정수를 void 포인터 인자에 실어 보내기 — intptr_t 캐스팅 관용구]([C]%20정수를%20void%20포인터%20인자에%20실어%20보내기%20—%20intptr_t%20캐스팅%20관용구.md)
- [[C] 실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)

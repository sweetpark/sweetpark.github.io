---
title: "불투명 포인터(Opaque Pointer) — 헤더는 선언만, 구현은 숨기기"
tags: [학습, 개발-CS, 언어, C언어, 캡슐화, 불투명포인터, 헤더설계]
created: 2026-09-17
modified: 2026-09-17
---

# 불투명 포인터(Opaque Pointer) — 헤더는 선언만, 구현은 숨기기

> [!NOTE]
> C에는 `private`/`public` 접근 제어자가 없다. 구조체 정의를 `.c` 파일 안에 숨기고 헤더에는 포인터 타입 이름만 노출하는 불투명 포인터(opaque pointer) 패턴으로, C에서 캡슐화를 흉내 내는 방법을 정리한다.

## 0. 왜 필요한가

구조체를 헤더에 통째로 공개하면, 그 헤더를 include하는 모든 파일이 내부 필드에 직접 접근할 수 있게 된다.

```c
/* counter.h */
typedef struct {
    int value;
    int max;
} counter_t;
```

```c
/* main.c */
#include "counter.h"

counter_t c;
c.value = 999;   /* 검증 없이 내부 필드를 마음대로 건드릴 수 있다 */
```

`counter_t`를 쓰는 쪽에서 `value`가 `max`를 넘지 않아야 한다는 규칙이 있어도, 필드가 헤더에 다 노출돼 있으면 그 규칙은 "각 파일이 알아서 지켜주길 바라는" 관례에 불과하다. 게다가 나중에 필드를 하나 추가하거나 순서를 바꾸면, 그 구조체를 쓰는 **모든** `.c` 파일이 구조를 다시 알아야 한다.

## 1. 불완전 타입(incomplete type) — 몸체 없는 구조체 선언

```c
struct counter;   /* 몸체가 없는 선언. "이런 이름의 구조체가 있다"는 것만 알려준다 */
```

이렇게 몸체(멤버 목록) 없이 이름만 선언한 것을 **불완전 타입**이라고 한다. 이 상태에서는 컴파일러가 `struct counter`의 크기를 모르기 때문에 `struct counter c;`처럼 실체를 만들 수는 없지만, **`struct counter *p;`처럼 포인터는 선언할 수 있다** — 포인터 자체의 크기는 가리키는 대상이 뭐든 항상 고정(8바이트, 64비트 기준)이기 때문이다. 불투명 포인터 패턴은 정확히 이 성질을 이용한다.

## 2. 패턴 — 헤더엔 이름과 함수 원형만, 정의는 `.c`에

```c
/* counter.h */
#ifndef COUNTER_H
#define COUNTER_H

typedef struct counter counter_t;   /* 이름만 공개 — 내부 필드는 이 헤더에 없다 */

counter_t *counter_create(int max);
void       counter_destroy(counter_t *c);
int        counter_increment(counter_t *c);   /* 실패 시 음수, 성공 시 증가된 값 */
int        counter_get(const counter_t *c);

#endif
```

```c
/* counter.c */
#include <stdlib.h>
#include "counter.h"

struct counter {          /* 실제 필드 정의는 여기, .c 파일 안에만 존재 */
    int value;
    int max;
};

counter_t *counter_create(int max)
{
    counter_t *c = malloc(sizeof(counter_t));
    if (c == NULL) {
        return NULL;
    }
    c->value = 0;
    c->max = max;
    return c;
}

void counter_destroy(counter_t *c)
{
    free(c);
}

int counter_increment(counter_t *c)
{
    if (c->value >= c->max) {
        return -1;   /* 상한 검증 — counter.c 안에서만 강제할 수 있다 */
    }
    return ++c->value;
}

int counter_get(const counter_t *c)
{
    return c->value;
}
```

```c
/* main.c */
#include "counter.h"

counter_t *c = counter_create(10);
counter_increment(c);
printf("%d\n", counter_get(c));
/* c->value = 999;  이 줄은 컴파일 에러 — counter.h엔 value라는 필드 자체가 안 보인다 */
counter_destroy(c);
```

`main.c`는 `counter_t`가 내부적으로 어떤 필드를 갖는지 전혀 모른 채, `counter_create`/`counter_increment`/`counter_get`/`counter_destroy` 네 함수만으로 다룬다. 값을 바꾸는 유일한 통로가 `counter_increment` 함수이기 때문에, "값이 `max`를 넘지 않는다"는 규칙을 그 함수 안에서 강제로 지킬 수 있다.

## 3. 얻는 것과 잃는 것

| | 필드를 헤더에 공개 | 불투명 포인터 |
| --- | --- | --- |
| 필드 직접 접근 | 가능(막을 방법 없음) | 불가능(접근자 함수를 거쳐야 함) |
| 내부 구조 변경 시 | 그 구조체를 쓰는 모든 `.c`가 영향받고 재컴파일 필요 | 구현 파일만 바뀜, 쓰는 쪽은 함수 시그니처만 그대로면 재컴파일만 하면 됨 |
| 스택에 변수로 선언 | `counter_t c;` 가능 | 불가능 — 크기를 모르므로 항상 `malloc`으로 힙에 만들어야 함 |
| 값 하나 읽는 비용 | 필드 접근, 사실상 공짜 | 함수 호출 오버헤드 발생(대개 무시할 수준) |

불투명 포인터는 "캡슐화"라는 이득을 얻는 대신, **반드시 힙에 할당해야 하고 사소한 값 하나 읽는 데도 함수 호출을 거쳐야 한다**는 비용을 치른다. 그래서 자주 만들고 없애는 작은 값 하나에는 과할 수 있고, 라이브러리 경계처럼 "내부 구현을 절대 노출하면 안 되는" 지점에서 주로 쓰인다.

## 4. 자주 하는 실수

- **헤더에 필드를 다 공개해놓고 "관례상 안 건드리겠지"라고 기대하기** — `typedef struct { int value; ... } counter_t;`처럼 필드를 헤더에 그대로 둔 채 "이건 내부용이니 건드리지 말 것"이라고 주석만 달아두는 건 강제력이 없다. 컴파일러가 막아주길 원한다면 반드시 구조체 정의 자체를 `.c` 파일로 옮겨야 한다.
- **호출하는 쪽에서 `sizeof(counter_t)`를 쓰려고 하기** — 불완전 타입은 크기를 모르므로 `sizeof`를 헤더만 include한 파일에서 쓰면 컴파일 에러다. 크기가 필요한 상황(예: 여러 개를 배열로 잡고 싶을 때) 자체가 불투명 포인터 패턴과는 안 맞는 요구라, 애초에 배열 대신 포인터 배열이나 별도 생성 함수 반복 호출로 풀어야 한다.
- **`counter_create`가 실패(`NULL` 반환)할 수 있다는 걸 호출부에서 확인 안 하기** — 힙 할당이 강제되는 패턴이라 생성 함수는 항상 실패 가능성을 갖는다. 반환값 체크 없이 바로 `counter_increment(c)`를 부르면 `c`가 `NULL`일 때 크래시로 이어진다.
- **`_destroy`를 짝으로 안 만들거나 안 부르기** — 불투명 포인터는 항상 힙에 있으므로, 생성 함수가 있으면 반드시 그에 대응하는 해제 함수를 만들고 빠짐없이 호출해야 한다(자세한 내용: [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)의 생성/소멸 쌍 항목).

## 관련 문서

- [Union, Typedef, Struct 구조 및 활용]([Lang]%20Union,%20Typedef,%20Struct%20구조%20및%20활용.md)
- [extern과 static — 링키지와 다중 파일 공유]([C]%20extern과%20static%20—%20링키지와%20다중%20파일%20공유.md)
- [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)
- [개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기]([C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md)

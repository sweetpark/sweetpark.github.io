---
title: "extern과 static — 링키지와 다중 파일 공유"
tags: [학습, 개발-CS, 언어, C언어, extern, static, 링키지]
created: 2026-09-16
modified: 2026-09-16
---

# extern과 static — 링키지와 다중 파일 공유

> [!NOTE]
> 여러 `.c` 파일로 나뉜 C 프로젝트에서 함수/변수를 다른 파일과 공유할지 말지를 결정하는 링키지(linkage) 개념과, `extern`/`static` 실전 사용 패턴을 정리한다.

## 0. 배경

여러 `.c` 파일로 나뉜 C 프로젝트에서 "이 함수를 다른 파일에서도 쓰고 싶다" / "이 함수는 이 파일 안에서만 쓰고 싶다"를 결정하는 게 **링키지(linkage)** 다. `extern`/`static`은 정확히는 이 링키지를 다루는 키워드다.

## 1. 세 가지 경우

| 키워드 | 정의인가 선언인가 | 링키지 | 의미 |
| --- | --- | --- | --- |
| (아무것도 안 붙임), 함수 정의 | 정의 | **외부**(기본값) | 다른 파일에서도 이 이름으로 부를 수 있다 |
| `static`, 함수 정의 | 정의 | **내부** | 이 파일 안에서만 보인다. 다른 파일은 이 이름의 존재 자체를 모른다 |
| `extern`, 함수 선언(`;`로 끝남, 본문 없음) | 선언만 | — | "이 이름의 함수가 어딘가(다른 `.c`)에 정의돼 있다"고 컴파일러에게 알려주는 것. 실제 연결은 링크 단계에서 |

## 2. 함수는 원래 기본이 외부 링키지다 (헷갈리는 포인트)

C에서 함수는 **아무것도 안 붙이면 이미 외부 링키지**다.

```c
void *foo(void *arg) { ... }   // 이것만으로 이미 다른 파일에서 부를 수 있다
```

`extern void *foo(void *arg) { ... }`처럼 정의 앞에 `extern`을 붙여도 되지만 아무 효과가 없다(이미 기본값이라서). 그래서 실무에서 `extern`은 거의 항상 **함수를 정의하는 쪽이 아니라, 부르는 쪽 파일에서 선언만 할 때** 쓴다 — "이런 함수가 있다는 건 알아, 어디 정의돼 있는지는 지금 몰라도 되고 링크할 때 찾아줘"라는 뜻이다.

## 3. 실전 패턴 — 스레드 함수를 다른 파일로 뺄 때

프로젝트가 커지면 스레드 하나가 하는 일을 별도 파일로 빼는 경우가 흔하다. 그때 호출하는 쪽에서 `extern`으로 존재만 알려주면 된다.

**worker.c** (스레드 함수를 정의하는 파일)
```c
void *worker_thread(void *arg)
{
    /* ... 스레드가 할 일 ... */
    return NULL;
}
```

**main.c** (그 스레드를 만들어서 쓰는 파일)
```c
extern void *worker_thread(void *arg);   /* "worker.c 어딘가에 정의돼 있다" */

int main(void)
{
    pthread_t tid;
    pthread_create(&tid, NULL, worker_thread, NULL);
    pthread_join(tid, NULL);
    return 0;
}
```

`main.c`는 `worker.c`를 `#include`하지 않는다 — **소스 코드가 아니라 심볼(함수 이름과 시그니처)만 알면 되고, 실제 연결은 컴파일 이후 링크 단계**에서 이루어지기 때문이다.

## 4. 흔한 실수 — `static`과 `extern`이 충돌

`worker.c` 쪽에서 실수로 `static`을 붙이면:
```c
static void *worker_thread(void *arg) { ... }   /* worker.c */
```
`main.c`의 `extern` 선언은 **컴파일은 된다**(선언 자체는 문법적으로 문제없음). 하지만 **링크 단계에서 `undefined reference to worker_thread` 에러**가 난다. `static`이 "이 파일 밖에서는 이 이름의 존재 자체를 모르게" 만들어버려서, 링커가 아무리 찾아도 없기 때문이다.

그래서 함수를 만들기 전에 "다른 파일에서도 부를 거냐, 이 파일 안에서만 쓸 거냐"를 먼저 정해야 한다.
- **다른 파일에서 부를 함수** → `static` 금지
- **이 파일 안에서만 쓰는 함수** → `static`을 붙이는 게 좋다(같은 프로젝트의 다른 파일에 우연히 같은 이름의 `static` 함수가 있어도 서로 충돌하지 않는다)

## 5. `extern` 선언을 어디에 둘 것인가 — 인라인 vs 헤더 파일

**방식 A — 부르는 쪽 `.c` 파일 맨 위에 직접**
```c
/* main.c */
extern void *worker_thread(void *arg);
```
빠르고 간단하지만, `worker_thread`를 여러 파일에서 부르게 되면 그 선언을 매번 복사해야 하고, `worker.c`에서 함수 시그니처가 바뀌었을 때 이 `extern` 선언 쪽 고치는 걸 깜빡해도 컴파일러가 못 잡아주는 경우가 생긴다.

**방식 B — 전용 헤더 파일**
```c
/* worker.h */
#ifndef WORKER_H
#define WORKER_H
void *worker_thread(void *arg);
#endif
```
```c
/* worker.c */
#include "worker.h"
void *worker_thread(void *arg) { ... }
```
```c
/* main.c */
#include "worker.h"
```
헤더 하나에 선언을 모아두면, `worker.c` 자신도 그 헤더를 include해서 "내가 정의한 게 헤더에 선언한 것과 정확히 같은 타입인지"를 컴파일러가 그 자리에서 검증해준다. 함수를 부르는 파일이 여러 개면 이 방식이 훨씬 안전하다.

**언제 A, 언제 B?** 그 함수를 부르는 파일이 딱 하나뿐이고 앞으로도 안 늘어날 게 확실하면 A(인라인 `extern`)로 충분하다. 두 군데 이상에서 부르거나, 그 함수와 관련된 타입(구조체 등)까지 같이 공유해야 하면 B(헤더)가 낫다.

## 6. 변수에서는 `extern`이 진짜로 필요하다

함수와 달리 **전역 변수는 여러 파일에서 이름만 겹치게 정의하면 에러**다(중복 정의). 여러 파일에서 같은 전역 변수를 공유하려면 반드시 "정의는 딱 한 파일에서, 나머지는 `extern` 선언만" 규칙을 지켜야 한다.

```c
/* shared.c */
int g_counter = 0;          /* 정의(딱 한 번만) */

/* other.c */
extern int g_counter;       /* 선언만 — g_counter는 다른 데 있다 */
void increment(void) { g_counter++; }
```

`other.c`에도 `int g_counter = 0;`을 또 쓰면 `multiple definition of g_counter` 링크 에러가 난다. 함수는 정의 자체가 곧 "여기 있다"는 신호라 이런 문제가 잘 안 생기지만(각 함수 이름은 보통 한 곳에만 정의하니까), 변수는 정의와 선언을 명확히 구분해야 하는 이유가 여기 있다.

## 관련 문서

- [비트플래그(Bit Flag) 연산]([C]%20비트플래그(Bit%20Flag)%20연산.md)
- [select() — 여러 입력과 타임아웃 함께 기다리기]([C]%20select()%20—%20여러%20입력과%20타임아웃%20함께%20기다리기.md)

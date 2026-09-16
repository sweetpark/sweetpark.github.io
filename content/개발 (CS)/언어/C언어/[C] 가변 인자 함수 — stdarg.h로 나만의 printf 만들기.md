---
title: "가변 인자 함수 — stdarg.h로 나만의 printf 만들기"
tags: [학습, 개발-CS, 언어, C언어, 가변인자, stdarg, 로깅]
created: 2026-09-17
modified: 2026-09-17
---

# 가변 인자 함수 — stdarg.h로 나만의 printf 만들기

> [!NOTE]
> `printf`, `snprintf`처럼 인자 개수가 호출할 때마다 달라지는 함수를 직접 만드는 방법(`stdarg.h`)과, 로그 함수를 만들 때 실제로 쓰이는 `vsnprintf` 조합 패턴을 정리한다.

## 0. 왜 필요한가

로그를 남기는 함수를 만든다고 하면, 보통 `printf`처럼 포맷 문자열과 가변 개수의 인자를 그대로 받고 싶어진다.

```c
log_error("connect fail: fd=%d, errno=%d(%s)", fd, err, strerror(err));
log_error("timeout\n");   /* 호출마다 인자 개수가 다르다 */
```

인자 개수가 정해지지 않은 함수는 일반적인 매개변수 목록(`int a, int b`)으로는 표현할 수 없다. C 표준은 이걸 `<stdarg.h>`의 `va_list`/`va_start`/`va_arg`/`va_end` 매크로로 처리한다.

## 1. 기본 사용법 — 네 가지 매크로

```c
#include <stdarg.h>
#include <stdio.h>

int sum_all(int count, ...)          /* '...'은 반드시 매개변수 목록의 맨 끝에만 올 수 있다 */
{
    va_list args;
    int total = 0;
    int i;

    va_start(args, count);           /* count: '...' 바로 앞의 고정 인자 이름 */
    for (i = 0; i < count; i++) {
        total += va_arg(args, int);  /* 꺼낼 때마다 타입을 명시한다 */
    }
    va_end(args);                    /* 반드시 짝을 맞춰 호출 */

    return total;
}

sum_all(3, 10, 20, 30);   /* 60 */
```

| 매크로 | 역할 |
| --- | --- |
| `va_list` | 가변 인자를 순회하기 위한 상태를 담는 타입 |
| `va_start(args, last_fixed)` | 순회 시작. 두 번째 인자는 `...` 바로 앞 고정 매개변수 이름 |
| `va_arg(args, type)` | 다음 인자를 `type`으로 꺼내면서 커서를 한 칸 전진 |
| `va_end(args)` | 순회 종료. `va_start`와 반드시 짝을 이뤄야 함 |

## 2. 마지막 고정 인자가 필요한 이유

`va_start`의 두 번째 인자로 "`...` 바로 앞의 고정 매개변수 이름"을 넘기는 이유는, **가변 인자 목록의 시작 위치를 찾기 위한 기준점**이 필요하기 때문이다. 그래서 가변 인자 함수는 항상 고정 인자를 최소 하나 이상 가져야 한다 — `void foo(...)`처럼 고정 인자 없이 `...`만 있는 함수는 표준 C에서 정의할 수 없다.

또한 **가변 인자 자체에는 "몇 개가 왔는지"를 알아내는 표준적인 방법이 없다.** `sum_all`이 `count`라는 고정 인자로 개수를 미리 알려주는 이유가 이것이다. `printf`처럼 개수를 별도로 안 받는 함수는, 대신 포맷 문자열(`%d`, `%s`의 개수)을 세서 간접적으로 알아낸다.

## 3. 실전 패턴 — `vsnprintf`로 만드는 로그 함수

`printf` 계열 함수를 감싸는 로그 함수를 만들 때는 `va_list`를 직접 순회하지 않고, 이미 `va_list`를 받는 버전(`vprintf`, `vsnprintf`, `vfprintf`)에 그대로 넘기는 게 표준 패턴이다.

```c
#include <stdarg.h>
#include <stdio.h>
#include <time.h>

void log_error(const char *fmt, ...)
{
    char      buf[512];
    va_list   args;
    time_t    now = time(NULL);
    struct tm tm_now;

    localtime_r(&now, &tm_now);

    va_start(args, fmt);
    vsnprintf(buf, sizeof(buf), fmt, args);   /* buf 크기를 넘지 않게 안전하게 조립 */
    va_end(args);

    fprintf(stderr, "[%04d-%02d-%02d %02d:%02d:%02d] %s\n",
            tm_now.tm_year + 1900, tm_now.tm_mon + 1, tm_now.tm_mday,
            tm_now.tm_hour, tm_now.tm_min, tm_now.tm_sec, buf);
}

log_error("connect fail: fd=%d, errno=%d(%s)", fd, err, strerror(err));
```

`log_error`는 내부적으로 딱 한 번만 `va_list`를 순회한다(`vsnprintf` 안에서). **직접 `va_arg`로 인자를 하나씩 꺼내 포맷을 재구현하지 않는 이유**는, `%d`/`%s`/`%f` 등 모든 포맷 지정자의 파싱 규칙을 직접 다시 짜는 셈이 되기 때문이다 — 이미 표준 라이브러리가 그 일을 하는 `vsnprintf`에 그대로 위임하는 게 압도적으로 안전하고 간단하다.

## 4. 자주 하는 실수

- **`va_end`를 안 부르기** — `va_start`로 연 자원은 `va_end`로 반드시 정리해야 한다. 대부분의 구현에서는 당장 문제가 없어 보이지만, 표준상 짝을 안 맞추면 정의되지 않은 동작이고 일부 플랫폼(특히 `va_list`를 겹쳐 쓰는 경우)에서 실제로 문제가 된다.
- **`va_list`를 두 번 이상 순회하기** — 한 번 `va_arg`로 끝까지 읽은 `va_list`는 되감을 표준적인 방법이 없다. 같은 인자 목록을 두 번 써야 한다면(예: 필요한 버퍼 크기를 먼저 계산하고 그다음 실제로 기록) `va_copy`로 복사본을 만들어서 각각 순회해야 한다.
- **`va_arg`에 넘기는 타입을 실수로 원래 타입 그대로 쓰기** — 호출부에서 `char`나 `short`, `float`을 넘겨도 가변 인자로 전달될 때는 **정수 확장/실수 확장 규칙에 따라 항상 `int`(또는 `unsigned int`)와 `double`로 승격**된다. 그래서 `va_arg(args, char)`처럼 꺼내면 안 되고, `va_arg(args, int)`로 꺼낸 뒤 필요하면 직접 좁혀야 한다.
- **가변 인자 개수를 알려줄 방법을 안 만들어두기** — `count` 같은 고정 인자나, `NULL`/특정 값으로 끝을 표시하는 센티넬 인자 없이 가변 인자를 무작정 순회하면, 실제로 넘어온 개수보다 더 많이 `va_arg`를 호출해 쓰레기 값을 읽게 된다. 개수를 세는 별도 인자(`sum_all`의 `count`)나 포맷 문자열(`printf` 방식) 둘 중 하나는 반드시 있어야 한다.

## 관련 문서

- [snprintf와 sscanf — 문자열 조립과 파싱의 차이]([C]%20snprintf와%20sscanf%20—%20문자열%20조립과%20파싱의%20차이.md)
- [함수 포인터와 디스패치 테이블 — switch 대신 테이블로 분기하기]([C]%20함수%20포인터와%20디스패치%20테이블%20—%20switch%20대신%20테이블로%20분기하기.md)

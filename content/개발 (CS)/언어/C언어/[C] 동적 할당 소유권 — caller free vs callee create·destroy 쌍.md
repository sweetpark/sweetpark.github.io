---
title: "동적 할당 소유권 — caller free vs callee create·destroy 쌍"
tags: [학습, 개발-CS, 언어, C언어, 메모리관리, malloc, 소유권, 캡슐화]
created: 2026-09-28
modified: 2026-09-28
---

# 동적 할당 소유권 — caller free vs callee create·destroy 쌍

> [!NOTE]
> C엔 소멸자가 없어서 "누가 `malloc`했으면 누가 `free`하는가"를 매번 코드로 결정해야 한다. 대원칙은 **"할당한 계층이 해제도 책임진다"**지만, 실무에서는 이 원칙이 세 가지 다른 모양으로 구현된다. 셋 다 "결국 caller가 해제 호출을 한다"는 점에서 겉보기엔 비슷해 보이지만, 내부 자원 정리·캡슐화·바이너리 경계 안전성에서 결정적으로 다르다.

## 0. 세 가지 패턴

| 패턴 | 할당 | 해제 | 대표 예 |
| --- | --- | --- | --- |
| 1. Caller 할당·Caller 해제 | Caller (스택 또는 힙) | Caller | `snprintf`, `read`, `memcpy` |
| 2. Callee 모듈이 create/destroy 쌍 제공 | Callee 내부 (`_create`) | Callee 전용 함수 (`_destroy`) | 구조체·자료구조 모듈 |
| 3. Callee가 할당, Caller가 `free` | Callee 내부 | Caller가 표준 `free()` 직접 호출 | `strdup`, `asprintf` |

### 패턴 1 — 버퍼는 caller가 들고 있는다

Callee는 포인터와 크기만 받아서 채우기만 한다. 스택/힙 중 뭘 쓸지는 caller가 결정하고, 할당과 해제가 같은 함수 안에 있어서 누수 추적이 가장 쉽다.

```c
void get_user_name(char *out_buf, size_t buf_size);  /* callee */

void caller(void)
{
    char buf[256];               /* 또는 malloc() */
    get_user_name(buf, sizeof(buf));
    /* 사용 후 종료 — malloc을 썼다면 여기서 caller가 free */
}
```

### 패턴 2 — 모듈이 생성·해제를 세트로 제공

```c
/* callee 모듈 */
typedef struct {
    char *name;      /* malloc */
    int  *history;   /* malloc */
    FILE *log_file;  /* fopen */
} user_t;

user_t *user_create(const char *name)
{
    user_t *u = malloc(sizeof(user_t));
    if (u == NULL) return NULL;
    u->name = strdup(name);
    u->history = malloc(sizeof(int) * HISTORY_CAP);
    u->log_file = fopen("user.log", "a");
    return u;
}

void user_destroy(user_t *u)
{
    if (u == NULL) return;
    free(u->name);
    free(u->history);
    if (u->log_file) fclose(u->log_file);
    free(u);
}
```

```c
/* caller */
user_t *user = user_create("Alice");
/* 작업 수행 */
user_destroy(user);   /* free()를 직접 부르지 않는다 */
```

### 패턴 3 — `strdup` 방식 (가능하면 피한다)

```c
char *name = strdup(source);   /* callee 내부에서 malloc */
/* ... */
free(name);                    /* caller가 표준 free()로 직접 해제 */
```

문서나 함수 이름(`create_...`, `alloc_...`, `dup`)으로 소유권 이전을 명확히 드러내지 않으면 caller가 `free()` 호출을 빠뜨리기 쉽고, DLL/공유 라이브러리 경계를 넘을 때는 아래 2절의 힙 불일치 문제까지 겹친다.

## 1. 패턴 2와 3, 뭐가 다른가

둘 다 "callee가 `malloc`하고, 결국 caller가 해제를 호출한다"는 흐름은 같다. 차이는 **caller가 호출하는 것이 표준 `free()`인가, callee가 만든 전용 함수인가**다.

### 1-1. Deep free vs Shallow free — 내부 자원

구조체가 내부에 다른 포인터나 리소스(파일 핸들, 소켓, 추가 동적 할당)를 갖고 있으면:

- **패턴 3처럼 caller가 직접 `free(user)`를 호출하면** — `user` 구조체 자체의 메모리만 해제되고, 내부의 `name`·`history`·`log_file`은 그대로 누수된다 (shallow free).
- **패턴 2의 `user_destroy(user)`를 호출하면** — 모듈 내부에서 `name`·`history`를 `free()`하고 `log_file`을 `fclose()`한 뒤 마지막에 `user`를 해제한다 (deep free). C++ 소멸자가 하는 일을 함수 호출로 흉내 낸 것이다.

### 1-2. 캡슐화 — 할당 방식이 바뀌어도 caller는 몰라도 된다

지금은 `malloc`을 쓰지만 나중에 성능을 위해 메모리 풀이나 정적 캐시로 내부 구현을 바꿀 수 있다.

- caller가 `free(user)`를 직접 호출하면 — 메모리 풀에서 꺼낸 주소를 표준 힙 `free()`에 넘기게 되어 즉시 크래시. caller가 callee의 내부 구현(malloc 여부)까지 알아야 한다.
- `user_destroy(user)`를 호출하면 — 내부에서 `free`를 쓰든 풀로 반환하든 caller는 신경 쓸 필요가 없다.

### 1-3. DLL/공유 라이브러리 힙 경계 — 가장 치명적인 실무 문제

실행 파일(EXE)과 라이브러리(DLL/`.so`)가 서로 다른 C 런타임(CRT)을 링크하면 각자 독립된 힙을 가질 수 있다. DLL 내부에서 `malloc()`한 포인터를 EXE에서 표준 `free()`로 넘기면 다른 힙 관리자에게 해제를 요구하는 셈이 되어 **Heap Corruption 크래시**가 발생한다. 그래서 라이브러리 경계를 넘는 할당은 반드시 그 라이브러리가 제공하는 전용 해제 함수(`xxx_destroy`)를 거쳐, 같은 바이너리 내부에서 `free`가 실행되도록 만들어야 한다.

### 1-4. 책임의 분리 — "언제(When)" vs "어떻게(How)"

| 구분 | Caller가 아는 것 | Callee가 아는 것 |
| --- | --- | --- |
| 패턴 3 (`free` 직접 호출) | "언제" 끝났는지 + "어떻게" 해제해야 하는지(표준 `free`로 충분한지, 서브 자원이 있는지) 둘 다 알아야 함 | 없음 — caller의 가정에 기댄다 |
| 패턴 2 (`_destroy` 호출) | "언제" 끝났는지만 전달 | "어떻게" 해제할지 전담 — 내부가 `malloc`이든 풀이든, 서브 자원이 몇 개든 caller는 안전함 |

## 2. 선택 기준

| 상황 | 권장 패턴 |
| --- | --- |
| 단순 버퍼·문자열·배열 전달 | 1. Caller 할당·Caller 해제 (callee는 포인터+크기만) |
| 동적 객체·구조체 생성 | 2. Callee 모듈이 `_create`/`_destroy` 쌍 제공 |
| Callee가 `malloc`하고 caller가 `free` | 되도록 피한다. 불가피하면 함수 이름(`create_...`, `dup...`)과 문서로 소유권 이전을 명확히 표시 |

1바이트짜리 버퍼 하나를 다루는 정도가 아니라면, 생성 함수와 해제 함수를 세트로 제공하는 패턴 2가 가장 안전하고 견고하다.

## 관련 문서

- [리눅스 시스템 함수(System Call) 카테고리별 치트시트]([C]%20리눅스%20시스템%20함수(System%20Call)%20카테고리별%20치트시트%20—%20파일·프로세스·시그널·네트워크·계정정보.md) — `getlogin_r()` 등 `_r` 접미사 POSIX 함수들이 패턴 1(caller 버퍼 할당)을 따르는 실제 예
- [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md) — A1(생성/소멸 쌍) 항목의 등급 분류와 역순 정리 원칙
- [불투명 포인터(Opaque Pointer) — 헤더는 선언만, 구현은 숨기기]([C]%20불투명%20포인터(Opaque%20Pointer)%20—%20헤더는%20선언만,%20구현은%20숨기기.md) — `_create`/`_destroy` 쌍을 캡슐화까지 확장한 패턴
- [개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기]([C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md) — 다단계 할당의 역순 해제 예시

---
title: "비트플래그(Bit Flag) 연산"
tags: [학습, 개발-CS, 언어, C언어, 비트연산, 설정파일]
created: 2026-09-16
modified: 2026-09-16
---

# 비트플래그(Bit Flag) 연산

> [!NOTE]
> 여러 개의 on/off 옵션을 정수 하나에 담아 다루는 비트플래그 패턴과, 문자열 옵션 목록을 비트마스크로 조립하는 실전 코드를 정리한다.

## 0. 왜 필요한가

"여러 개의 켜고/끄는 옵션을 정수 하나에 다 담고 싶다"는 상황은 흔하다. 로깅 모드(날짜별 파일 저장 여부, 스레드 ID 출력 여부, 타임스탬프 출력 여부 ...), 파일 열기 모드(읽기/쓰기/생성 ...), 권한(읽기/쓰기/실행) 같은 것들이 전부 이 패턴이다. 옵션마다 `bool` 변수를 따로 두는 대신, 정수 하나의 **각 비트 자리**를 옵션 하나에 대응시키면 int 하나로 수십 개의 on/off를 표현할 수 있다.

## 1. 값은 반드시 2의 거듭제곱이어야 한다

```c
#define OPT_TIMESTAMP  1   /* 0b00000001 */
#define OPT_THREAD_ID  2   /* 0b00000010 */
#define OPT_JSON       4   /* 0b00000100 */
#define OPT_COLOR      8   /* 0b00001000 */
#define OPT_LINE_INFO  16  /* 0b00010000 */
```

각 값이 정확히 비트 하나씩만 차지해야(1, 2, 4, 8, 16, 32 ...) 서로 겹치지 않는다. 실수로 `OPT_JSON`을 `3`(=1+2)처럼 잡으면 `OPT_TIMESTAMP`/`OPT_THREAD_ID`와 비트가 겹쳐서, 하나만 켜려고 해도 다른 게 같이 켜지는 버그가 생긴다.

## 2. 세 가지 핵심 연산

| 하고 싶은 것 | 연산자 | 코드 |
| --- | :-: | --- |
| **켜기 (set)** | `\|` (OR) | `mode \|= OPT_JSON;` |
| **검사 (test)** | `&` (AND) | `if (mode & OPT_JSON) { ... }` |
| **끄기 (clear)** | `& ~` (AND NOT) | `mode &= ~OPT_JSON;` |
| **토글 (toggle)** | `^` (XOR) | `mode ^= OPT_JSON;` |

```c
int mode = 0;                    /* 0b00000000 — 아무 옵션도 없는 초기 상태 */

mode |= OPT_TIMESTAMP;           /* 0b00000001 */
mode |= OPT_JSON;                /* 0b00000101 — TIMESTAMP는 그대로 두고 JSON만 추가 */

if (mode & OPT_JSON) {           /* 0b00000101 & 0b00000100 = 0b00000100(참) */
    /* JSON 포맷으로 출력 */
}

mode &= ~OPT_TIMESTAMP;          /* 0b00000101 & 0b11111110 = 0b00000100 — TIMESTAMP만 끔 */
```

`|=`은 "이미 켜진 비트는 그대로 두고, 지정한 비트만 추가로 켠다"는 뜻이라 여러 번 호출해도 안전하다(멱등). `&= ~X`는 반대로 "X 비트만 끄고 나머지는 그대로 둔다."

## 3. 실전 패턴 — 이름 목록(문자열)을 비트마스크로 조립하기

설정 파일이나 커맨드라인에서 옵션을 `"TIMESTAMP,JSON,COLOR"`처럼 **이름을 콤마로 나열한 문자열**로 받는 경우가 많다. 이걸 매번 `if (strcmp(...) == 0) mode |= ...` 식으로 늘어놓지 않고, "이름 → 값" 룩업 테이블 하나로 처리하는 게 일반적인 패턴이다.

```c
typedef struct {
    const char *name;
    int value;
} FlagEntry;

static const FlagEntry OPT_TABLE[] = {
    { "TIMESTAMP", OPT_TIMESTAMP },
    { "THREAD_ID", OPT_THREAD_ID },
    { "JSON",      OPT_JSON },
    { "COLOR",     OPT_COLOR },
    { "LINE_INFO", OPT_LINE_INFO },
    { NULL, 0 }
};

static int find_flag(const FlagEntry *table, const char *name)
{
    int i;
    for (i = 0; table[i].name != NULL; i++) {
        if (strcmp(table[i].name, name) == 0) {
            return table[i].value;
        }
    }
    return -1;   /* 못 찾음 */
}

int parse_options(const char *csv)   /* csv 예: "TIMESTAMP,JSON,COLOR" */
{
    char buf[128];
    char *token;
    char *save = NULL;
    int mode = 0;
    int flag;

    snprintf(buf, sizeof(buf), "%s", csv);

    for (token = strtok_r(buf, ",", &save); token != NULL; token = strtok_r(NULL, ",", &save)) {
        flag = find_flag(OPT_TABLE, token);
        if (flag < 0) {
            printf("unknown option: %s\n", token);
            return -1;
        }
        mode |= flag;    /* 토큰 하나 처리할 때마다 해당 비트만 켬 */
    }

    return mode;
}
```

`mode`를 `0`으로 초기화하고 시작해서, 토큰을 하나씩 볼 때마다 `mode |= flag`로 비트를 누적해나가는 게 핵심이다. `OPT_TIMESTAMP | OPT_JSON | OPT_COLOR`(값 1+4+8=13)처럼 컴파일 타임에 상수를 나열해서 만들던 조합을, 런타임에 문자열 리스트로부터 똑같이 조립하는 셈이다. `strtok_r`(스레드 안전 버전)은 연속된 구분자를 하나로 취급해서 빈 토큰을 안 만들기 때문에, 콤마 사이에 공백이 섞여 있어도 별도 처리 없이 안전하다.

## 4. 자주 하는 실수

- **`mode`를 초기화 안 하고 `|=`부터 하기** — 지역변수는 초기값이 쓰레기값이라, 예상 못 한 비트가 이미 켜진 채로 시작할 수 있다. 항상 `int mode = 0;`부터.
- **`|`와 `||`를 헷갈리기** — `|`는 비트 OR(정수 연산), `||`는 논리 OR(참/거짓 판단)이다. `mode | OPT_JSON`과 `mode || OPT_JSON`은 완전히 다른 연산이라 컴파일은 되지만 결과가 전혀 다르다.
- **비트 자리가 부족한 타입 쓰기** — 플래그가 계속 늘어나는 걸 감안 안 하고 좁은 타입(`char`, 8비트라 최대 8개 옵션)을 썼다가, 나중에 9번째 옵션을 추가할 때 타입을 통째로 바꿔야 하는 상황이 생길 수 있다. C에서 정수 리터럴과 비트 연산 결과는 기본적으로 `int`로 승격되므로, 특별한 이유(메모리에 수천~수만 개를 배열로 저장한다든가)가 없다면 그냥 `int`를 쓰는 게 안전하고 관용적이다 — 지금 옵션 개수 기준으로 "딱 맞는 크기"를 계산해서 타입을 줄이는 건 실익 없는 최적화인 경우가 많다.

## 관련 문서

- [extern과 static — 링키지와 다중 파일 공유]([C]%20extern과%20static%20—%20링키지와%20다중%20파일%20공유.md)

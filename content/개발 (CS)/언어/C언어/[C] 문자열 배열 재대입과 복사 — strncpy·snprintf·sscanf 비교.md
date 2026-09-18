---
title: "문자열 배열 재대입과 복사 — strncpy·snprintf·sscanf 비교"
tags: [학습, 개발-CS, 언어, C언어, 문자열, strncpy, snprintf, sscanf, 배열, 포인터]
created: 2026-09-17
modified: 2026-09-17
---

# 문자열 배열 재대입과 복사 — strncpy·snprintf·sscanf 비교

> [!NOTE]
> `char str[] = "test";` 선언 후 `str = "ppp";`처럼 재대입이 되는지, 그리고 버퍼로 문자열을 복사할 때 `strncpy`·`snprintf`·`sscanf`가 서로 같은 의미인지를 정리한다.

## 0. 배경

두 가지 질문을 합쳐서 정리한다.

- `char str[] = "test";` 선언 후 `str = "ppp";`로 값을 바꿀 수 있나?
- `char buffer[10];`에 `str`을 복사할 때 `strncpy`/`snprintf`/`sscanf` 셋이 같은 동작인가?

## 1. 배열 이름은 재대입할 수 없다

```c
char str[] = "test";   /* str은 5바이트 배열('t','e','s','t','\0') — "초기화" 시점에 복사됨 */
str = "ppp";            /* 컴파일 에러: assignment to expression with array type */
```

- `char str[] = "test";`는 **초기화**(initialization)다. 컴파일러가 `str`이라는 배열 메모리를 만들고 그 자리에 문자들을 복사해 넣는다.
- `str = "ppp";`는 **대입**(assignment)인데, 배열 이름은 "수정 가능한 lvalue"가 아니다 — 배열은 애초에 "어딘가를 가리키는" 게 아니라 그 메모리 자리 자체가 데이터이므로, 배열 전체를 다른 곳으로 재대입하는 문법 자체가 없다.
- 값을 바꾸려면 배열 **안의 내용**을 덮어써야 한다.

```c
strcpy(str, "ppp");   /* OK — str이 "ppp\0"(4바이트)를 담을 만큼 큼(5바이트) */
```

> [!TIP] `char *str = "test";`였다면 얘기가 다르다
> 포인터로 선언했다면 `str = "ppp";`는 문법적으로 된다. 다만 이건 `str`이 가리키는 대상을 문자열 리터럴 `"test"`에서 `"ppp"`로 **바꿔치기**하는 것뿐이지, 원래 `"test"` 리터럴의 내용을 고치는 게 아니다. 문자열 리터럴은 읽기 전용 메모리에 있어서 `str[0] = 'x';`처럼 내용을 직접 고치려 하면 런타임에 크래시(미정의 동작)가 난다. `char str[]`(배열)과 `char *str`(포인터)는 선언문 모양은 비슷해도 메모리 모델이 완전히 다르다는 점이 여기서 갈린다.

## 2. buffer로 복사하기: strncpy vs snprintf vs sscanf

### 2.1 strncpy — 파라미터 순서에 주의

```c
char *strncpy(char *dest, const char *src, size_t n);
```

```c
char str[] = "test";
char buffer[10];

strncpy(buffer, str, sizeof(buffer) - 1);  /* 올바른 순서: dest, src, n */
buffer[sizeof(buffer) - 1] = '\0';         /* strncpy는 n을 다 썼을 때 널 종료를 보장 안 함 — 직접 채워주는 게 관용구 */
```

질문에 적힌 `strncpy(buffer, sizeof(buffer), str)`는 인자 순서가 실제 시그니처와 어긋난다.

- 2번째 자리는 `src`(문자열 포인터), 3번째 자리는 `n`(개수)이어야 하는데, 정수(`sizeof(buffer)`)와 포인터(`str`)의 자리가 뒤바뀌어 있다. 이 상태면 컴파일러가 "포인터-정수형 불일치" 경고를 내고, 실행 시 정수를 주소로 취급해 엉뚱한 메모리를 읽어 크래시 나거나 미정의 동작이 된다.
- `n`은 "복사할 최대 바이트 수"일 뿐 버퍼 크기를 자동으로 맞춰주지 않는다. `src`가 `n`바이트 이상이면 **널 종료 문자가 안 붙는다** — 그래서 `sizeof(buffer) - 1`만큼만 복사하고 마지막 칸을 직접 `'\0'`으로 채우는 패턴이 필요하다.

### 2.2 snprintf — 널 종료를 항상 보장, 실무에서 더 선호

```c
snprintf(buffer, sizeof(buffer), "%s", str);
```

- [[C] snprintf와 sscanf — 문자열 조립과 파싱의 차이]([C]%20snprintf와%20sscanf%20—%20문자열%20조립과%20파싱의%20차이.md)에서 정리했듯, `snprintf`는 `size`를 넘으면 잘라내되(size가 0이 아닌 한) **항상 널 종료를 보장**한다.
- `str`이 `buffer`보다 짧거나 같으면 `strncpy(buffer, str, sizeof(buffer)-1); buffer[sizeof(buffer)-1]='\0';`와 결과가 동일하다. 다만 `snprintf`가 널 종료를 자동으로 챙겨줘서 실수할 여지가 적다 — 단순 복사 용도면 `snprintf`가 더 안전한 선택.

### 2.3 sscanf — "복사"가 아니라 "파싱"이라 의미가 다르다

```c
sscanf(str, "%s", buffer);       /* 폭 제한 없음 — 위험 */
sscanf(str, "%9s", buffer);      /* buffer[10]이면 최대 9자 + 널 = 10, 안전 */
```

- `%s`는 공백 문자(스페이스·탭·개행) **전까지만** 읽는다. `str`에 공백이 없으면(`"test"`) 결과가 전체 복사처럼 보이지만, 이건 우연히 같아 보이는 것뿐 의미가 같은 게 아니다. `str`이 `"hello world"`였다면 `buffer`엔 `"hello"`만 들어가고 나머지는 버려진다.
- 필드 폭(`%9s`)을 안 주면 `buffer` 크기와 무관하게 얼마든지 길게 써버릴 수 있어 오버플로우 위험이 있다.
- 결론: 순수하게 문자열 전체를 복사할 목적이면 `sscanf`는 맞는 도구가 아니다. `sscanf`는 "포맷에 맞춰 구조가 있는 문자열을 분해"하는 용도지, 통짜 복사용이 아니다.

## 3. 요약

| 방법 | 적합한 용도 | 널 종료 | 공백 처리 |
| --- | --- | --- | --- |
| `strncpy(dest, src, n)` | 단순 복사, 직접 크기 제어 | `n`을 다 썼으면 보장 안 됨 → 직접 처리 필요 | 공백 포함 그대로 복사 |
| `snprintf(dest, size, "%s", src)` | 단순 복사(권장) | 항상 보장 | 공백 포함 그대로 복사 |
| `sscanf(src, "%s", dest)` | 공백으로 구분된 토큰 하나만 추출 | 필드 폭 안 주면 보장 안 됨(오버플로우 위험) | 첫 공백에서 끊김 |

## 관련 문서

- [[C] snprintf와 sscanf — 문자열 조립과 파싱의 차이]([C]%20snprintf와%20sscanf%20—%20문자열%20조립과%20파싱의%20차이.md)
- [[C] 실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)

---
title: "문자열 비교와 strcasecmp — strcmp 차이, 대소문자 무시 및 컴파일러 속성 해독"
tags: [학습, 개발-CS, 언어, C언어, 문자열, strcmp, strcasecmp, 컴파일러속성, nonnull, pure]
created: 2026-09-18
modified: 2026-09-18
---

# 문자열 비교와 strcasecmp — strcmp 차이, 대소문자 무시 및 컴파일러 속성 해독

> [!NOTE]
> C 언어 표준 및 POSIX의 문자열 비교 함수군(`strcmp`, `strcasecmp`, `strncasecmp`)의 동작 차이와 반환값 해석 관용구, 그리고 표준 라이브러리 선언문에 붙어 있는 컴파일러 최적화 속성(`__attribute_pure__`, `__nonnull`)의 실무적 의미를 정리한다.

---

## 0. 개요: `strcmp` vs `strcasecmp`

C 언어에서 문자열 비교는 연산자(`==`)로 할 수 없다. 문자열 변수의 이름은 메모리 주소(포인터)이므로, `str1 == str2`는 내용이 아니라 **두 포인터가 같은 메모리 번지를 가리키는지**를 검사하기 때문이다.

내용을 비교하려면 반드시 라이브러리 함수를 사용해야 하며, 크게 **대소문자를 엄격히 구분하는 함수**와 **대소문자를 무시하는 함수**로 나뉜다.

| 함수 | 표준 | 대소문자 구분 여부 | 비교 범위 |
| :--- | :--- | :---: | :--- |
| **`strcmp`** | C 표준 (ANSI C) | **구분 (Case-sensitive)** | `\0` 만날 때까지 전체 |
| **`strncmp`** | C 표준 (ANSI C) | **구분 (Case-sensitive)** | 최대 `n`바이트까지 |
| **`strcasecmp`** | POSIX 표준 | **무시 (Case-insensitive)** | `\0` 만날 때까지 전체 |
| **`strncasecmp`** | POSIX 표준 | **무시 (Case-insensitive)** | 최대 `n`바이트까지 |

```c
strcmp("AMF01", "amf01");      /* 0이 아님! (다름 판정 - 대소문자 불일치) */
strcasecmp("AMF01", "amf01");   /* 0 반환!  (같음 판정 - 대소문자 무시) */
```

---

## 1. `strcasecmp`의 동작 원리와 반환값 해석

### 1.1 반환값(Return Value)의 의미
`strcasecmp`는 단순히 참/거짓(true/false)을 돌려주지 않고 **사전순(Lexicographical) 차이값**을 반환한다:

- **`0`**: 두 문자열이 완벽히 일치함 (대소문자 무시).
- **`음수 (< 0)`**: `s1`이 `s2`보다 사전순으로 앞섬 (ASCII 코드상 더 작음).
- **`양수 (> 0)`**: `s1`이 `s2`보다 사전순으로 뒤임 (ASCII 코드상 더 큼).

### 1.2 실무 조건문 관용구 (가장 흔한 실수 주의!)
초보 개발자가 가장 많이 저지르는 실수는 **"같으면 참(1)"**이라고 착각하여 다음과 같이 쓰는 것이다:

```c
/* [위험한 안티패턴] */
if (strcasecmp(user_role, "ADMIN")) {
    // 0(일치)일 때 거짓이 되어 이 블록이 실행되지 않음!
    // 다를 때(0이 아닌 값) 참이 되어 여기가 실행되는 치명적 보안 버그!
}

/* [올바른 실무 관용구] */
if (strcasecmp(user_role, "ADMIN") == 0) { ... }  /* 명시적 비교 (가독성 최고) */
if (!strcasecmp(user_role, "ADMIN"))     { ... }  /* 부정 연산자 ! 사용 (실무 다수) */
```

---

## 2. 표준 라이브러리 헤더 선언문 해독

C 표준 라이브러리 헤더(`<strings.h>`)를 열어보면 다음과 같이 선언되어 있다:

```c
/* Compare S1 and S2, ignoring case.  */
extern int strcasecmp (const char *__s1, const char *__s2)
     __THROW __attribute_pure__ __nonnull ((1, 2));
```

이 외계어 같은 키워드들은 컴파일러에게 함수의 특성을 알려주는 **GCC/Clang 컴파일러 지시어(Attribute)**다.

### ① `__THROW`
- C++ 코드에서 이 C 헤더를 include할 때, **"이 함수는 C++ 예외(Exception)를 절대 던지지 않는다(`noexcept`)"**는 것을 보장하여 불필요한 예외 처리 스택 프레임 생성을 생략시킨다.

### ② `__attribute_pure__` (순수 함수)
- 매크로 원형: `__attribute__((pure))`
- **의미**: "이 함수는 전역 변수를 수정하거나 I/O를 수행하는 등의 **부작용(Side Effect)이 전혀 없으며**, 반환값은 오직 넘겨받은 파라미터(`__s1`, `__s2`)의 메모리 내용에만 의존한다."
- **컴파일러 최적화 효과 (Common Subexpression Elimination)**:
  ```c
  for (int i = 0; i < 1000; i++) {
      if (strcasecmp(name, "SYSTEM") == 0) {
          // 루프 도중 name의 내용이 바뀌지 않는다면...
      }
  }
  ```
  컴파일러는 `pure` 속성을 보고 "어차피 `name`이 안 바뀌면 결과도 항상 같겠네?"라고 판단하여, **루프를 돌 때마다 함수를 1,000번 호출하지 않고 딱 1번만 호출한 뒤 그 결과를 레지스터에 캐싱해서 재사용**한다.

### ③ `__nonnull ((1, 2))` (NULL 포인터 전달 금지)
- 매크로 원형: `__attribute__((nonnull(1, 2)))`
- **의미**: **"첫 번째 인자(`__s1`)와 두 번째 인자(`__s2`)에 절대 `NULL`을 넘기지 마라!"**
- **컴파일 타임 안전장치**:
  개발자가 실수로 `strcasecmp(NULL, "TEST")` 같은 코드를 작성하면, 컴파일러가 빌드 타임에 즉시 경고를 띄워준다:
  ```
  warning: argument 1 null where non-null expected [-Wnonnull]
  ```

---

## 3. 실무 주의사항: 런타임 Crash 방어

> [!CAUTION]
> `__nonnull` 속성은 컴파일러가 정적으로 알 수 있는 `NULL`만 잡아줄 뿐, **런타임에 변수에 담겨 들어오는 `NULL`은 막아주지 못한다.**

만약 런타임에 둘 중 하나라도 `NULL`인 포인터를 `strcasecmp()`에 넘기면, 함수 내부에서 첫 글자를 읽으려다 즉시 **세그폴트(Segmentation Fault / SIGSEGV)**가 발생하며 데몬 전체가 크래시된다.

### 안전한 실무 비교 래퍼 패턴:
실무에서 외부 입력(JSON, 네트워크 패킷 등)을 비교할 때는 항상 널 체크가 선행되어야 한다:

```c
// 둘 다 NULL이면 같다고 볼 것인지, 하나라도 NULL이면 다르다고 볼 것인지 명확히 처리
static inline int safe_strcasecmp(const char *s1, const char *s2)
{
    if (s1 == NULL && s2 == NULL) return 0;   // 둘 다 없으면 같음
    if (s1 == NULL || s2 == NULL) return -1;  // 하나만 없으면 다름
    return strcasecmp(s1, s2);
}
```

---

## 4. 이식성(Portability) 팁: Linux vs Windows

- **Linux / POSIX (GCC/Clang)**: `strcasecmp`, `strncasecmp` (`<strings.h>`)
- **Windows / MSVC**: Windows 표준 C 런타임에는 `strcasecmp`라는 이름 대신 **`_stricmp`**, **`_strnicmp`** (`<string.h>`)라는 이름을 사용한다.

따라서 멀티 플랫폼 라이브러리를 만들 때는 헤더에 다음과 같은 호환 매크로를 선언하는 것이 관례다:

```c
#ifdef _WIN32
  #define strcasecmp  _stricmp
  #define strncasecmp _strnicmp
#endif
```

---

## 관련 문서
- [문자열 배열 재대입과 복사 — strncpy·snprintf·sscanf 비교]([C]%20문자열%20배열%20재대입과%20복사%20—%20strncpy·snprintf·sscanf%20비교.md)
- [snprintf와 sscanf — 문자열 조립과 파싱의 차이]([C]%20snprintf와%20sscanf%20—%20문자열%20조립과%20파싱의%20차이.md)
- [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)
- [메모리 정렬(Memory Alignment)과 aligned_alloc — CPU 워드 경계와 안전한 할당 래퍼]([C]%20메모리%20정렬(Memory%20Alignment)과%20aligned_alloc%20—%20CPU%20워드%20경계와%20안전한%20할당%20래퍼.md)

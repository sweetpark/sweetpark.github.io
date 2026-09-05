---
title: "Win32 멀티스레드 API (_beginthreadex)"
tags: [학습, 개발-CS, 언어, C, Windows, 멀티스레드]
modified: 2026-09-05
---

# Win32 멀티스레드 API (_beginthreadex)

> [!NOTE]
> Windows 환경에서 C로 멀티스레드를 구현할 때 쓰는 `_beginthreadex`와 관련 Win32 자료형 정리. "PortScan" 미니프로젝트에서 추출.
> 관련 노트(POSIX 계열): [(Windows) pthread 멀티스레드 API 레퍼런스 - 핵심 개념 및 특징 정리](../../%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/[Windows]%20pthread%20%EB%A9%80%ED%8B%B0%EC%8A%A4%EB%A0%88%EB%93%9C%20API%20%EB%A0%88%ED%8D%BC%EB%9F%B0%EC%8A%A4%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)

## ⚙️ Win32 자료형 정리

`HANDLE`은 핸들로 사용되는 32비트 정수다. HANDLE의 종류는 여러 가지가 있지만 모두 HANDLE과 같은 크기이며, 모든 핸들 유형은 H로 시작한다.

- `HANDLE`: void* 64비트 포인터
- `HWND`: window 핸들로 사용되는 32비트 정수
- `BYTE`: 8비트 무부호 문자
- `WORD`: 16비트 부호 없는 짧은 정수
- `DWORD`: 32비트 부호 없는 long 정수(== uint32)
- `UINT`: 32비트 부호 없는 정수
- `LONG`: long의 또 다른 이름
- `BOOL`: 정수 유형
- `LPSTR`: 문자열에 대한 포인터
- `LPCTSTR`: 문자열에 대한 const 포인터

## ⚙️ 스레드 생성 — `_beginthreadex`

> [!NOTE]
> C언어는 멀티플렉스를 기본적으로 제공하지 않으므로 쓰레드랑은 어울리지 않는다.

- `CreateThread()` — CRT(C 런타임) 내부 상태를 안전하게 초기화하지 않아 사용 자제
- `_beginthreadex` 사용 권장 (CRT와 함께 쓰기 안전)

```c
_beginthreadex(
    void * security,           // Default : NULL
    unsigned stack_size,       // Default : 0
    unsigned(*start_address)(void*), // thread function
    void *arglist,              // thread function 인자 지정
    unsigned * initflag,        // 쓰레드 생성 후 바로실행 or 대기 (default : 0)
    unsigned * thrdaddr          // 쓰레드 생성시 쓰레드 ID 생성된 값 저장하는 변수 포인터
)
```

## ⚙️ 인자 전달 — 구조체로 여러 값 묶기

> [!NOTE]
> 인자는 1개만 전달 가능(32비트, `LPVOID` 자료형). 여러 개 인자를 전달하려면 구조체를 사용해야 한다.

```c
void FUNCTION(LPVOID pArgs);

struct args {
    int *i;
    double d;
};

int main() {
    int x = 1;
    double y = 5.23;
    // ...
    args args_ = {&x, y};
    // ...
    _beginthreadex(NULL, 0, FUNCTION, &args, 0, &ThreadID);
}
```

## ⚙️ 관련 상수

- `FD_SETSIZE` ⇒ 64 (select() 모델에서 한 번에 감시 가능한 소켓 디스크립터 최대 개수 — 64개를 넘으면 별도 처리 필요)

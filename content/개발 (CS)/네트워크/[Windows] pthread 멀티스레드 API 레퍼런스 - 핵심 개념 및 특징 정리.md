---
title: "pthread 멀티스레드 API 레퍼런스"
tags: [학습, 개발-CS, 네트워크, C, pthread, 멀티스레드]
modified: 2026-09-05
---

# pthread 멀티스레드 API 레퍼런스

> [!NOTE]
> Linux/POSIX 환경에서 멀티스레드로 포트/네트워크를 스캔할 때 쓰는 `pthread` 기본 API 정리. "PortScan" 미니프로젝트 기획 문서에서 추출.
> 관련 노트(Windows 계열): [(Windows) Win32 멀티스레드 API (_beginthreadex) - Win32 멀티스레드 API (beginthreadex)](../%EC%9D%B8%ED%94%84%EB%9D%BC/WINDOWS/[Windows]%20Win32%20%EB%A9%80%ED%8B%B0%EC%8A%A4%EB%A0%88%EB%93%9C%20API%20(_beginthreadex)%20-%20Win32%20%EB%A9%80%ED%8B%B0%EC%8A%A4%EB%A0%88%EB%93%9C%20API%20(beginthreadex).md)

## ⚙️ pthread API

- **`pthread_create()`**
    - 인자: (쓰레드 식별자, 쓰레드 속성정보(Default: NULL), 쓰레드가 실행할 함수, 실행 함수에 들어갈 인자)
    - 예) `pthread_create(&threads[t], NULL, print_hello, (void *)t)`
    - 성공 시 반환값 0
- **`pthread_exit()`** — 쓰레드 종료
- **`pthread_join()`**
    - 인자: (쓰레드 식별자, 쓰레드에 할당된 함수 실행 후 종료상태)
    - 예) `pthread_join(threads[t], NULL)`
    - 지정된 쓰레드가 종료될 때까지 기다리며, 쓰레드가 종료되면 즉시 반환
    - 성공 시 반환값 0

참고: [pthread 함수 정리 (velog)](https://velog.io/@hokim/pthread-%ED%95%A8%EC%88%98-%EC%A0%95%EB%A6%AC)

## ⚙️ `recv()` 타임아웃 처리

블로킹 소켓의 `recv()`가 무한 대기하지 않도록, alarm 시그널을 이용해 타임아웃을 구현할 수 있다(`alarm()` + `SIGALRM` 핸들러로 일정 시간 후 강제로 시스템 콜을 인터럽트).

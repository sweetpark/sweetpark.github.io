---
title: "process 비정상 종료 트러블 슈팅 목록"
tags: [학습, 개발-CS, 언어, C언어, 시그널, coredump, gdb, 디버깅, 트러블슈팅]
created: 2026-09-29
---

# process 비정상 종료 트러블 슈팅 _index

> [!NOTE]
> `Segmentation fault (core dumped)` 한 줄만으로는 원인을 알 수 없다. **"어떤 시그널인지 식별 → 그 시그널의 원인 후보 좁히기 → core dump/로그로 실제 증거 확보"** 순서로 체계적으로 분석하는 방법을 정리한 시리즈.

## 읽는 순서

| 순서 | 문서 | 다루는 것 |
| :---: | --- | --- |
| 1 | [1. 비정상 종료 시그널 종류](1.%20비정상%20종료%20시그널%20종류%20—%20SIGSEGV·SIGABRT·SIGBUS·SIGILL·SIGFPE%20개관.md) | 정상/비정상 종료 구분, `$?`의 `128+N` 규칙, 시그널 기본동작(disposition) 표 |
| 2 | [2. 시그널별 원인 분석](2.%20시그널별%20원인%20분석%20—%20각%20시그널이%20실제로%20왜%20발생하는가.md) | SIGSEGV·SIGABRT·SIGBUS·SIGILL·SIGFPE가 각각 실제로 왜 발생하는지, 코드 패턴별 원인 |
| 3 | [3. Core Dump 확인 방법](3.%20Core%20Dump%20확인%20방법%20—%20활성화·수집·gdb%20분석.md) | `ulimit`/`core_pattern`/systemd로 core 활성화, `coredumpctl`·`gdb`로 실제 분석 |
| 4 | [4. 추가로 알아야 할 것들](4.%20추가로%20알아야%20할%20것들%20—%20dmesg·siginfo_t·ASan·예방%20도구.md) | dmesg 커널 로그, 자체 크래시 핸들러, ASan/Valgrind로 사전 예방, 컨테이너 함정, 체크리스트 |

## 핵심 요약

- 시그널 자체(`Segmentation fault`)는 **"무슨 종류"** 인지만 알려줄 뿐, **"왜"** 는 알려주지 않는다.
- "왜"를 알아내려면 **증거(core dump, dmesg 로그, siginfo_t)** 가 필요하고, 증거가 없으면 재현해서 만들어내야 한다.
- gdb로 보기 전에 `-g`(디버그 심볼) 빌드인지, core dump가 켜져 있는지부터 확인한다 — 이 둘이 안 맞으면 core를 열어도 아무 정보가 안 나온다.
- 재현이 간헐적인 크래시(UAF, 레이스 컨디션)는 core dump 사후분석보다 **ASan 빌드로 상시 테스트**가 훨씬 빠르게 원인을 잡는다.

## 관련 문서
- [[C] 실무 C 코드 관례와 UB 함정 정리](../[C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)
- [[C] 리눅스 시스템 함수(System Call) 카테고리별 치트시트](../[C]%20리눅스%20시스템%20함수(System%20Call)%20카테고리별%20치트시트%20—%20파일·프로세스·시그널·네트워크·계정정보.md)
- [[C] 동적 할당 소유권 — caller free vs callee create·destroy 쌍](../[C]%20동적%20할당%20소유권%20—%20caller%20free%20vs%20callee%20create·destroy%20쌍.md)

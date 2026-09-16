---
title: "이름-키 매핑 테이블 방식의 IPC 키 관리"
tags: [학습, 개발-CS, CS기초, 운영체제, IPC, System V, 설정파일]
created: 2026-09-16
modified: 2026-09-16
---

# 이름-키 매핑 테이블 방식의 IPC 키 관리

> [!NOTE]
> `ftok()` 대신 사람이 직접 관리하는 이름-키 매핑 테이블 파일의 컬럼 구조, 팀/모듈별 KEY 대역 관례, 설정 반영 절차(재기동)를 정리한다. 실명·실제 시스템명은 예시를 위해 일반화했다.

## 0. 예시 파일

수십 개 프로세스가 각자 IPC 키를 알아야 하는 시스템에서는, 아래처럼 "이름 → 타입 → KEY → 플래그"를 한 파일에 테이블로 정리해두고 기동 시 이 파일을 읽어 큐를 생성하는 방식을 쓰기도 한다.

```
# ipc-registry.conf — auto-generated, do not edit by hand
#
CORE_COMM    MSGQ    ea10    0
CORE_CTRL    MSGQ    ea11    0
CORE_MGR     MSGQ    ea12    0
CORE_AGENT   MSGQ    ea13    0
ALARM_SVC    MSGQ    ea15    0
HA_MON       NULL    ea1d    0
# TEST APP
TESTAPP1     MSGQ    e910    0
TESTAPP2     MSGQ    e911    0
# TEST APP, added by <팀원A>, <날짜>
TEAMA_CLIENT MSGQ    e710    0
TEAMA_SERVER MSGQ    e810    0
# TEST APP, added by <팀원B>, <날짜>
TEAMB_CLIENT MSGQ    e510    0
TEAMB_SERVER MSGQ    e610    0
```

## 1. 컬럼 구조: NAME · TYPE · KEY · FLAG

| 컬럼 | 예시 | 의미 |
| --- | --- | --- |
| 1. 이름 | `TEAMB_SERVER` | 프로세스/모듈 식별자. 코드에서 `#define IPC_SERVER "TEAMB_SERVER"`처럼 문자열로 정의해 오픈/키조회 함수에 그대로 넘김 |
| 2. 타입 | `MSGQ` / `NULL` | IPC 오브젝트 종류. `MSGQ`는 메시지 큐를 생성. `NULL`은 큐를 만들지 않는 엔트리 |
| 3. KEY | `ea10`, `e510` | `msgget()`에 넘어가는 실제 IPC 키(16진수 정수). [메시지 큐 API]([OS]%20메시지%20큐%20API%20(msgget·msgsnd·msgrcv·msgctl).md)에서 본 큐 생성 키이자, 메시지 헤더의 src/dst 주소로도 재사용됨 |
| 4. FLAG | `0` | 예약 필드이거나 상태 조회 명령 관련 초기값으로 쓰이는 경우가 있음(구체 의미는 문서화가 안 된 필드로 남는 경우도 흔하다) |

## 2. KEY 대역이 그룹별로 나뉘는 패턴

| 그룹 | KEY 대역(예시) |
| --- | --- |
| 코어 시스템 모듈 | `ea10` ~ `ea1d` (순차 증가) |
| 테스트앱 기본 | `e910`, `e911` |
| 팀원 A 테스트앱 | `e710` / `e810` |
| 팀원 B 테스트앱 | `e510` / `e610` |

[ftok과 IPC 키 생성]([OS]%20ftok과%20IPC%20키%20생성.md)에서 본 것처럼 System V 키는 **겹치지만 않으면** 되므로, 이렇게 사람/팀별로 hex 대역을 나눠 쓰는 건 기술적 강제가 아니라 협업 관례(충돌 방지 목적)입니다.

## 3. 반영 절차 (기동/재기동 스크립트)

> 순서는 종료 → 기동
> 1. IPC 매니저 종료 스크립트 실행 — 기존 메시지 큐가 정리됨
> 2. IPC 매니저 기동 스크립트 실행 — 매핑 테이블 파일을 다시 읽어 새 KEY로 큐 생성
> 3. `ipcstat -a` — 반영 확인

매핑 테이블에 KEY만 추가하고 재기동하지 않으면 오픈 함수 호출이 실패한다.

## 관련 문서

- [System V IPC 개념]([OS]%20System%20V%20IPC%20개념%20(메시지%20큐·세마포어·공유메모리).md)
- [메시지 큐 API]([OS]%20메시지%20큐%20API%20(msgget·msgsnd·msgrcv·msgctl).md)
- [ftok과 IPC 키 생성]([OS]%20ftok과%20IPC%20키%20생성.md)

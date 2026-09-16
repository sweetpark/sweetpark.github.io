---
title: "메시지 큐 API (msgget·msgsnd·msgrcv·msgctl)"
tags: [학습, 개발-CS, CS기초, 운영체제, IPC, System V, msgget, msgrcv]
created: 2026-09-16
modified: 2026-09-16
---

# 메시지 큐 API (msgget·msgsnd·msgrcv·msgctl)

> [!NOTE]
> System V 메시지 큐 API 4형제와, 사내 프레임워크가 이를 감싸는 일반적인 래핑 패턴, 메시지 헤더로 응답 주소를 실어 보내는 라우팅 패턴을 정리한다.

## 1. 메시지 큐 API 4형제

| 함수 | 역할 |
| --- | --- |
| `msgget(key, flags)` | 큐 생성/오픈. 성공 시 큐 ID(`qid`) 반환 |
| `msgsnd(qid, msg, size, flags)` | 큐에 메시지 삽입(송신) |
| `msgrcv(qid, msg, size, type, flags)` | 큐에서 메시지 추출(수신). 꺼내면 큐에서 제거됨 |
| `msgctl(qid, cmd, buf)` | 큐 상태 조회/삭제(`IPC_RMID`) 등 제어 |

```c
key_t key = 0xea10;
int qid = msgget(key, IPC_CREAT | 0666);      // 큐 생성/오픈

struct { long mtype; char text[100]; } msg;
msg.mtype = 1;
strcpy(msg.text, "hello");
msgsnd(qid, &msg, sizeof(msg.text), 0);       // 송신

msgrcv(qid, &msg, sizeof(msg.text), 0, 0);    // 수신 (mtype=0 → 아무 타입이나)
```

`mtype`은 `msgrcv`에서 특정 타입의 메시지만 골라 받을 때 쓰는 필터 값(long 하나)입니다.

## 2. 사내 프레임워크의 래퍼 패턴

사내 프레임워크는 이 API를 직접 안 쓰고 감싼 함수를 제공하는 경우가 흔합니다.

| System V 원본 | 래퍼(예시) |
| --- | --- |
| `msgget` (+ 이름→키 매핑) | `ipc_open()`, `ipc_getkey()` |
| `msgsnd` | `ipc_msgsnd()` |
| `msgrcv` | `ipc_msgrcv()` |
| `msgctl(IPC_RMID)` | `ipc_close()` |

키를 직접 hex로 관리하지 않고 `ipc_getkey(&handle, "SERVER0")`처럼 **이름으로 조회**할 수 있는 이유는 [이름-키 매핑 테이블 방식의 IPC 키 관리]([OS]%20이름-키%20매핑%20테이블%20방식의%20IPC%20키%20관리.md)에 이름 ↔ KEY 매핑이 등록돼 있기 때문입니다.

## 3. 메시지 헤더로 라우팅하는 패턴

메시지 안에 자체 헤더를 두는 패턴이 흔합니다.

```c
msg.u.h.src = key;       // 내 KEY (보낸 사람 주소)
msg.u.h.dst = dst_key;   // 상대방 KEY (받을 사람 주소)
```

서버는 받은 메시지의 `src`를 그대로 `dst`로 바꿔서 응답 — reply-to 주소를 헤더에 실어 보내는 패턴입니다. 즉 이름-키 매핑 테이블에 등록된 KEY 값이 **① `msgget()`의 큐 생성 키, ② 메시지 헤더 안의 프로세스 주소**로 이중으로 쓰입니다.

## 관련 문서

- [System V IPC 개념]([OS]%20System%20V%20IPC%20개념%20(메시지%20큐·세마포어·공유메모리).md)
- [이름-키 매핑 테이블 방식의 IPC 키 관리]([OS]%20이름-키%20매핑%20테이블%20방식의%20IPC%20키%20관리.md)

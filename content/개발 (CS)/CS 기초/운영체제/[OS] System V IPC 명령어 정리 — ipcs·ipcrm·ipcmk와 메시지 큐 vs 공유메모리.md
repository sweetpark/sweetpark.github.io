---
title: "System V IPC 명령어 정리 — ipcs·ipcrm·ipcmk와 메시지 큐 vs 공유메모리"
description: "메시지 큐와 공유메모리의 역할 차이, ipcs/ipcrm/ipcmk 사용법, 고아 세그먼트 정리 절차를 정리했습니다."
tags: [학습, 개발-CS, CS기초, 운영체제, IPC, 공유메모리, 메시지큐, ipcs, ipcrm, ipcmk]
created: 2026-11-25
modified: 2026-11-25
---

# System V IPC 명령어 정리 — ipcs·ipcrm·ipcmk와 메시지 큐 vs 공유메모리

> 계기: NSSF 컨테이너/서버에서 `startipc`가 `shmget() fail, ShmKey=0xcf989002 exist` 로 실패했다. 프로세스(`ipcman`)는 없는데 **공유메모리가 커널에 남아 있었기 때문**이다. 이 노트는 그때 필요한 개념과 명령을 모은 것이다.
> 개념 상세: [System V IPC 개념](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20System%20V%20IPC%20개념%20%28메시지%20큐·세마포어·공유메모리%29.md) · [공유메모리 세그먼트](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20공유메모리%20세그먼트%20—%20크기·key·권한·수명과%20삭제.md) · [메시지 큐 API](개발%20%28CS%29/CS%20기초/운영체제/[OS]%20메시지%20큐%20API%20%28msgget·msgsnd·msgrcv·msgctl%29.md)

## 1. 메시지 큐 vs 공유메모리 — 역할이 다르다

| | 메시지 큐 (message queue) | 공유메모리 (shared memory) |
|---|---|---|
| 한 줄 비유 | **우체통** — 편지(메시지)를 넣으면 상대가 꺼내 간다 | **공용 화이트보드** — 같은 판을 여럿이 직접 읽고 쓴다 |
| 데이터 전달 | 커널이 **복사**해서 전달 (`msgsnd` → `msgrcv`) | **복사 없음.** 같은 물리 메모리를 각자 주소 공간에 붙임 (`shmat`) |
| 단위 | 메시지 1건 단위, 타입(mtype)으로 골라 받기 가능 | 바이트 덩어리. 구조는 프로그램이 정함 |
| 순서·대기 | 큐라서 **순서가 있고**, 비었으면 `msgrcv`가 블로킹 | **없음.** 언제 바뀌었는지 알려주지 않음 → 락/세마포어 필요 |
| 동기화 | 커널이 해줌 (넣기/꺼내기가 원자적) | **직접** 해야 함 (뮤텍스, 세마포어) |
| 속도 | 복사 비용 있음 | 가장 빠름 |
| 용도 | 프로세스 간 **요청/이벤트 전달** | 여러 프로세스가 **같이 보는 상태·테이블·캐시** |
| 쌓이는 것 | 안 읽은 메시지(`used-bytes`, `messages`) | 세그먼트 크기와 붙은 수(`nattch`) |

핵심: **"무언가를 보낸다"는 메시지 큐, "같은 데이터를 같이 본다"는 공유메모리.** 실무에서는 같이 쓴다. 예) TAP 프레임워크는 프로세스 사이 메시지는 큐(`ipcman.ut`의 MSGQ 항목들)로, 공용 테이블·상태는 공유메모리(`0xcf989000`대 키)로 둔다. 큐로 "처리해라" 신호를 보내고, 실제 데이터는 공유메모리에서 읽는 식으로 섞는 경우도 많다.

세 번째 형제인 **세마포어**는 데이터를 나르지 않고 "지금 써도 되나?"만 조율한다 (주로 공유메모리 보호용).

공통점: 셋 다 **커널이 소유**한다. 프로세스가 죽어도 **저절로 사라지지 않고**, `IPC_RMID`(코드) 또는 `ipcrm`(셸)으로 지우거나 재부팅해야 없어진다. 이것이 고아 세그먼트 문제의 원인이다.

## 2. 한눈에 보는 치트시트

| 하고 싶은 일 | 명령 |
|---|---|
| 전부 보기 (큐·세마포어·공유메모리) | `ipcs` 또는 `ipcs -a` |
| 공유메모리만 / 큐만 / 세마포어만 | `ipcs -m` / `ipcs -q` / `ipcs -s` |
| 시스템 한도 | `ipcs -m -l`, `ipcs -q -l`, `ipcs -s -l` |
| 현재 사용량 요약 | `ipcs -m -u` (세그먼트 수, 사용 페이지 등) |
| 만든 사람/소유자 | `ipcs -m -c` (creator, owner) |
| 마지막으로 붙은/뗀 PID | `ipcs -m -p` (cpid=생성자, lpid=마지막 접근자) |
| 붙고 뗀 시각 | `ipcs -m -t` (attach, detach, change time) |
| 한 개 상세 | `ipcs -m -i <shmid>` |
| shmid로 삭제 | `ipcrm -m <shmid>` / `ipcrm -q <msqid>` / `ipcrm -s <semid>` |
| **key로** 삭제 | `ipcrm -M <key>` / `ipcrm -Q <key>` / `ipcrm -S <key>` |
| 테스트용 만들기 | `ipcmk -M 1024` (공유메모리 1KB), `ipcmk -Q` (큐), `ipcmk -S 1` (세마포어) |
| 누가 붙어 있나 | `lsof \| grep SYSV<소문자 8자리 key>` |
| 커널이 보는 원본 | `cat /proc/sysvipc/shm` (`msg`, `sem`도 동일) |
| 한도 값(sysctl) | `sysctl kernel.shmmax kernel.shmall kernel.shmmni kernel.msgmni kernel.msgmnb kernel.msgmax kernel.sem` |

### 소문자 옵션 = shmid, 대문자 옵션 = key

`ipcrm` 에서 헷갈리기 쉬운 부분이다.

- `ipcrm -m 32768` : **shmid**(커널이 붙인 번호)로 지운다.
- `ipcrm -M 0xcf989002` : **key**(프로그램이 정한 번호)로 지운다. 에러 메시지에 나오는 값이 key일 때 바로 쓸 수 있다.

## 3. ipcs 출력 읽는 법

```
------ Shared Memory Segments --------
key        shmid      owner      perms      bytes      nattch     status
0xcf989002 32768      nssf       600        1048576    0
0x00000000 32769      nssf       600        4096       2          dest
```

| 열 | 의미 |
|---|---|
| `key` | 프로그램이 `shmget`에 넘긴 번호. 같은 key로 찾아 붙는다. `0x00000000` 은 `IPC_PRIVATE` 로 만든 것 |
| `shmid` | 커널이 붙인 관리 번호. `ipcrm -m` 에 쓴다 |
| `owner` | 만든 계정 |
| `perms` | 8진수 권한 (600 = 소유자만 읽기/쓰기) |
| `bytes` | 크기 |
| `nattch` | **지금 붙어 있는(`shmat`한) 프로세스 수** |
| `status` | `dest` = 삭제 예약됨 (마지막 프로세스가 떼면 사라짐) |

핵심 판단 기준:

- **`nattch` 0 + 해당 프로그램 프로세스 없음 → 고아.** 지워도 된다.
- **`nattch` > 0 → 누군가 쓰는 중.** 지우면 `dest` 로 표시만 되고 붙은 쪽이 떼기 전까지 남는다. 먼저 `lsof`로 누구인지 본다.
- 큐는 `used-bytes`, `messages` 열이 0이 아니면 **안 읽은 메시지가 쌓인 것**이다.

## 4. 고아 세그먼트 정리 절차 (안전 순서)

증상: 프로그램을 다시 띄우면 `shmget() fail ... exist` 또는 `File exists (EEXIST)`.

1. **읽기 전용 확인**
   ```bash
   ipcs -m | grep -i cf98900          # 문제의 key 찾기
   ps -ef | grep <프로그램명>           # 프로세스가 진짜 없는지
   ```
2. **owner 확인.** 공용 서버라면 다른 계정이 같은 key를 쓰고 있을 수 있다. **남의 것은 건드리지 않는다.**
3. **붙은 프로세스 확인**
   ```bash
   lsof 2>/dev/null | grep SYSVcf989002
   ```
   `lsof`에 `SYSV` + key(소문자 16진 8자리)로 나온다.
4. **프로그램이 제공하는 정리 명령이 있으면 그것을 먼저 쓴다.** (NSSF: `ipcutil -t` 종료 → `ipcutil -c` 정리.) 내부 테이블과 일관되게 정리하기 때문이다.
5. 없거나 안 되면 직접 삭제
   ```bash
   ipcrm -M 0xcf989002          # key로
   # 또는
   ipcrm -m <shmid>             # shmid로
   ```
6. 다시 `ipcs -m` 으로 사라졌는지 확인하고 프로그램을 기동한다.

주의:
- **남아 있는 큐도 같이 확인한다** (`ipcs -q`). 공유메모리만 지우고 큐를 두면, 다음 기동 때 **이전 메시지를 읽는** 문제가 생길 수 있다.
- 지우기 전 `nattch` 와 `owner` 를 보는 습관을 들인다. 일괄 삭제(`ipcrm --all` 등 옵션)는 util-linux 버전마다 있고 없고 해서, 쓰기 전에 `ipcrm --help` 로 확인한다. 공용 서버에서는 특히 쓰지 않는다.
- 일반 계정은 **자기 소유만** 지울 수 있다. 다른 계정 것은 root 가 필요하다.

## 5. 실험해 보기 (연습용)

```bash
ipcmk -M 4096          # "Shared memory id: 98304" 처럼 shmid 출력
ipcs -m                # 방금 만든 세그먼트 (key 0x00000000, nattch 0)
ipcs -m -i 98304       # 상세
ipcrm -m 98304         # 삭제
ipcs -m                # 사라짐 확인
```

`ipcmk` 로 만든 것은 프로세스가 붙지 않아 `nattch` 가 0이다. 고아 세그먼트와 똑같은 상태이므로 `ipcs` 읽는 연습에 좋다.

## 6. 이번 사례 정리 (NSSF)

| 관찰 | 해석 |
|---|---|
| `stopipc` → "ALREADY STOPPED" | `ipcman` **프로세스**가 없다는 뜻 |
| `startipc` → `shmget() fail, ShmKey=0xcf989002 exist` | 프로세스는 없지만 **세그먼트가 남아 있다** |
| 원인 후보 | 이전 `ipcman` 이 `kill`/비정상 종료로 세그먼트를 못 지움 |
| 조치 | owner/nattch 확인 → `ipcutil -c` → (안 되면) `ipcrm -M 0xcf989002` → `startipc` |

TAP 쪽 보조 도구: `ipcstat`(상태 조회, `TOTAL` 줄 확인), `ipcutil -t`(종료), `ipcutil -c`(정리), `startipc`/`stopipc`. 컨테이너에서는 `nssf-restart` 가 이 순서를 자동으로 한다. 자세한 흐름은 환경구성 노트 4번(`ipcman` 재시작 순서)을 본다.

---
title: "스레드별 전용 큐와 해시 샤딩 — 락 경합 없는 고성능 워커 패턴"
tags: [학습, 개발-CS, 언어, C언어, 멀티스레드, 큐, 동시성, 아키텍처, 성능최적화]
created: 2026-09-18
modified: 2026-09-18
---

# 스레드별 전용 큐와 해시 샤딩 — 락 경합 없는 고성능 워커 패턴

> [!NOTE]
> 초당 수만~수십만 건의 트래픽을 처리하는 고성능 통신/네트워크 서버에서, 단일 공용 큐의 뮤텍스 락 경합(Lock Contention)을 완전히 제거하고 세션 데이터에 무락(Lock-Free)으로 접근하기 위한 **"워커별 전용 큐 + 해시 샤딩(Per-Worker Queue with Hash-based Sharding)"** 설계 패턴을 정리한다.

---

## 0. 단일 공용 큐 모델(Competing Consumers)의 한계

일반적인 멀티스레드 생산자-소비자(Producer-Consumer) 패턴에서는 보통 1개의 공용 큐를 둡니다.

```text
[요청 유입] ──► [단일 공용 큐 (Shared Queue)]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   워커 스레드 0     워커 스레드 1     워커 스레드 2  (뮤텍스 락 쟁탈전!)
```

### 치명적인 병목 현상
1. **극심한 락 경합(Lock Contention)**:
   - 모든 워커 스레드가 일감을 꺼내기 위해 단 하나의 뮤텍스(`pthread_mutex_lock`)에 달려듭니다.
   - 트래픽이 폭주할수록 CPU는 실제 비즈니스 로직을 수행하는 대신, **락 획득 대기와 커널 컨텍스트 스위칭(Context Switching)에 대부분의 클럭을 낭비**합니다.
2. **세션 컨텍스트 동기화 오버헤드**:
   - 동일 클라이언트의 1차 요청은 워커 0이 처리하고, 2차 요청은 워커 2가 처리할 수 있습니다.
   - 따라서 공용 세션 메모리를 건드릴 때마다 또다시 별도의 뮤텍스 락을 잡아야 하므로 이중으로 성능이 저하됩니다.

---

## 1. 해결책: 스레드별 전용 큐와 해시 샤딩 (Per-Worker Queue)

이 문제를 해결하는 시스템 아키텍처가 바로 **"큐를 스레드 개수만큼 1:1로 쪼개고, 세션 키(Key)를 해싱하여 해당 워커 큐에 다이렉트로 투하"**하는 방식입니다.

```text
[요청 도착 (세션 ID = sid)]
       │
       ▼ 수신 스레드가 즉시 해싱 연산
   worker_idx = sid % N_WORKERS;
       │
       ├─────────────────┬─────────────────┐
       ▼ (Direct Enqueue)▼                 ▼
 [전용 큐 0]        [전용 큐 1]        [전용 큐 2] ...
       │                 │                 │
       ▼ (fetch)         ▼ (fetch)         ▼ (fetch)
  워커 스레드 0     워커 스레드 1     워커 스레드 2
```

### 핵심 장점
1. **락 경합 원천 제거 (Zero Lock Contention)**:
   - 워커 0은 오직 0번 큐만 보고, 워커 1은 오직 1번 큐만 소비(Consume)합니다.
   - 워커들끼리 서로의 큐를 넘볼 일이 전혀 없으므로 락 쟁탈전이 0%입니다.
2. **세션 어피니티(Session Affinity)를 통한 무락(Lock-Free) 처리**:
   - 동일한 `sid`를 가진 세션 요청은 언제나 `sid % N`에 의해 **항상 동일한 워커 스레드로만 배정**됩니다.
   - 따라서 해당 워커는 세션 데이터(`session_table[sid]`)를 읽고 쓸 때 **뮤텍스 락을 전혀 걸지 않고 안전하게 초고속 연산**을 수행할 수 있습니다.

---

## 2. 왜 디스패처 중간 큐를 두지 않는가? (Zero-Hop Direct Sharding)

일반적인 디스패처 모델은 다음과 같이 중간 큐를 두기 쉽습니다:
`소켓 수신 ➡️ [디스패처 중간 큐] ➡️ 디스패처 스레드가 꺼냄 ➡️ [워커 큐] ➡️ 워커가 꺼냄`

하지만 초저지연(Ultra-Low Latency) 통신 서버에서는 중간 큐를 완전히 배제합니다:
- **소켓/IPC 버퍼 자체가 이미 큐의 역할**을 수행하고 있습니다.
- 소켓 수신 스레드가 패킷을 `recv`하는 그 자리에서 `sid % N`을 계산하여, **중간 단계 없이 곧바로 해당 워커의 전용 큐로 Direct Enqueue**합니다.
- 결과적으로 큐 오버헤드와 스레드 전환 횟수가 정확히 절반으로 줄어듭니다.

---

## 3. C 구현 패턴: 총괄 관리 컨텍스트 구조체

이 아키텍처를 구현하기 위해 모든 큐와 스레드 정보를 한곳에 묶어두는 **총괄 관리 컨텍스트(Manager Context)**를 전역으로 선언하여 사용합니다.

```c
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include "queue_lib.h" /* 추상화된 큐 라이브러리 (예: mpq) */

#define MAX_WORKERS 8

/* 워커 스레드 개별 정보 */
typedef struct {
    pthread_t   th_id;
    char        sz_name[32];
    int         worker_id;
} worker_thr_t;

/* 전체 워커 총괄 컨텍스트 */
typedef struct {
    int           n_max_workers;
    queue_t     **pst_queues;       /* 큐 포인터 배열 (pst_queues[0 ~ N-1]) */
    worker_thr_t *pst_workers;      /* 워커 스레드 정보 배열 */
} worker_mng_t;

static worker_mng_t g_work_mng;
```

---

## 4. 초기화 패턴: 왜 스레드 풀을 한 번에 만들지 않고 루프를 도는가?

스레드 풀 라이브러리에 `thread_pool_init(name, 8)` 함수가 있더라도, 이를 쓰지 않고 **`for` 루프를 돌며 스레드를 1개씩 8번 생성**하는 고전적 관용구를 씁니다:

```c
int worker_system_init(int n_workers)
{
    g_work_mng.n_max_workers = n_workers;
    g_work_mng.pst_queues = calloc(n_workers, sizeof(queue_t *));
    g_work_mng.pst_workers = calloc(n_workers, sizeof(worker_thr_t));

    for (int i = 0; i < n_workers; i++) {
        // 1. 각 워커 전용 큐 생성
        char q_name[32];
        snprintf(q_name, sizeof(q_name), "WORK_Q_%d", i);
        g_work_mng.pst_queues[i] = queue_create(q_name);

        // 2. 워커 스레드 생성: 자기 번호(i)를 uarg로 실어 보냄
        snprintf(g_work_mng.pst_workers[i].sz_name, 32, "worker_%d", i);
        g_work_mng.pst_workers[i].worker_id = i;

        /* (void *)(long)i 관용구로 워커 번호를 값 복사 전달 */
        thread_create(&g_work_mng.pst_workers[i].th_id,
                      worker_thread_main,
                      (void *)(long)i);
    }
    return 0;
}
```

> [!IMPORTANT]
> 스레드 풀을 한 번에 8개 만들면 모든 스레드가 동일한 단일 `uarg`를 받으므로 **자신이 몇 번 워커인지 고유 ID를 알 수 없습니다.** 루프를 돌며 각 스레드에게 고유 번호(`(void *)(long)i`)를 주어야, 스레드가 떴을 때 자기 전용 큐(`pst_queues[my_idx]`)를 찾아갈 수 있습니다.

---

## 5. 워커 스레드 루프와 비동기 송신 분리 (Inbound & Outbound)

워커 스레드는 큐에서 일감을 꺼내 처리한 뒤, **네트워크 소켓에 직접 대고 `send()`를 블로킹하며 기다리지 않습니다.**

```c
/* 워커 스레드 본체 */
void *worker_thread_main(void *pv_arg)
{
    long worker_idx = (long)pv_arg; // "나는 worker_idx 번 워커다!"
    queue_t *my_queue = g_work_mng.pst_queues[worker_idx];

    while (g_running) {
        msg_t *msg = NULL;
        // 1. 자기 전용 큐에서만 메시지 인출 (경합 없음)
        if (queue_fetch(my_queue, (void **)&msg, 100) < 0 || msg == NULL) {
            continue;
        }

        // 2. 비즈니스 로직 수행 (세션 락 없이 안전)
        resp_t *resp = process_session_logic(msg->sid, msg);

        // 3. 응답 송신: 소켓 블로킹을 피하기 위해 비동기 송신 큐(send_queue)에 밀어 넣음
        queue_append(g_send_queue[msg->dst_id], resp, 0 /* non-blocking */);

        free_msg(msg);
    }
    return NULL;
}
```

- **Inbound (수신)**: 수신 스레드가 `sid % N`으로 해당 워커 전용 큐에 직행.
- **Worker (처리)**: 워커는 자기 큐만 보며 무락(Lock-Free)으로 고속 연산.
- **Outbound (송신)**: 응답은 백그라운드 송신 큐(`send_queue`)에 0초(논블로킹)로 밀어 넣고 즉시 다음 세션으로 복귀.
- **Send Worker (발사)**: 별도의 I/O 송신 전용 스레드가 송신 큐에서 꺼내 소켓 전송 전담.

---

## 6. 패턴 요약 및 고려사항

| 항목 | 단일 공용 큐 모델 | 전용 큐 + 해시 샤딩 모델 |
| :--- | :--- | :--- |
| **큐 구조** | 1개의 공유 큐 | **스레드당 1개의 독립 전용 큐** |
| **동기화 락** | 큐 접근마다 뮤텍스 경합 | **워커 간 경합 제로 (Lock-free)** |
| **세션 데이터 보호** | 세션 접근 시 뮤텍스 필수 | **세션 어피니티 덕분에 무락(Lock-Free) 접근 가능** |
| **적합한 시스템** | 작업 시간 편차가 큰 범용 작업 | **초고성능 통신 데몬, 패킷 처리, 게임 서버** |
| **주의할 점 (Trade-off)** | 일감이 균등하게 분배됨 | **특정 세션 키에 작업이 몰리면 해당 워커만 지연될 수 있음** |

---

## 관련 문서
- [[C] 정수를 void 포인터 인자에 실어 보내기 — intptr_t 캐스팅 관용구]([C]%20정수를%20void%20포인터%20인자에%20실어%20보내기%20—%20intptr_t%20캐스팅%20관용구.md)
- [[C] 배열 기반 원형 큐(Ring Buffer) — front·back 인덱스로 만드는 큐]([C]%20배열%20기반%20원형%20큐(Ring%20Buffer)%20—%20front·back%20인덱스로%20만드는%20큐.md)
- [[C] pthread_create에 구조체 포인터 넘기기 — void 포인터와 이중포인터 정리]([C]%20pthread_create에%20구조체%20포인터%20넘기기%20—%20void%20포인터와%20이중포인터%20정리.md)

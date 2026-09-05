---
title: "프로세스와 좀비 프로세스 (fork·waitpid)"
tags: [학습, 개발-CS, CS기초, 개발, 프로세스, OS]
modified: 2026-09-05
---

# 프로세스와 좀비 프로세스 (fork·waitpid)

> [!NOTE]
> 자식 프로세스가 종료됐는데도 부모가 상태를 수거하지 않아 defunct(좀비) 상태로 남는 문제의 근본 원리(fork/wait/waitpid)를 정리.

## 📌 개념

### 좀비 프로세스가 생기는 일반적 원인
1. **부모 프로세스의 비정상 종료** — 좀비 프로세스는 주로 부모가 종료되기 전에 자식의 종료 상태를 수집하지 않았거나, 부모 자체가 비정상 종료된 경우 발생한다. 부모는 자식의 종료 상태를 수집하고 자원을 해제할 책임이 있는데, 이를 수행하지 못하면 자식은 좀비가 된다.
2. **부모가 자식의 종료 상태를 무시** — 부모가 `wait()`/`waitpid()` 같은 시스템 호출로 자식의 종료 상태를 수집하지 않으면 자식은 계속 좀비로 남는다.

> [!NOTE]
> 좀비 프로세스는 PID를 계속 점유한다. 오래 방치되면 시스템의 PID가 고갈될 수 있으므로, 부모는 반드시 `wait()`/`waitpid()`로 자식의 종료 상태를 수집하고 자원을 해제해야 한다.

### fork() 기본 동작
```c
pid = fork(); // 호출 직후 부모/자식이 동일한 주소공간(카피)을 가짐

if (pid > 0) {       // 부모 코드 (pid == 자식의 PID)
    printf("parent\n");
} else if (pid == 0) { // 자식 코드 (자식 입장에서는 pid == 0)
    printf("child\n");
} else {              // fork 실패
    return 1;
}

// 부모가 자식을 기다리는 전형적인 패턴
if (pid > 0) {
    wait(&status);   // 자식이 끝날 때까지 대기
} else if (pid == 0) {
    sleep(100);
}
// 자식이 비정상 종료(kill -9)되면 status에 그 값이 반영됨
```

### wait / waitpid

```c
waitpid(p_child, &state, 0);
// wait(&state)와 동일한 의미(자식이 끝날 때까지 블로킹 대기)

waitpid(p_child, &state, WNOHANG);
// WNOHANG: 논블로킹 확인
// - 자식이 아직 살아있으면 0 반환
// - 자식이 이미 종료됐으면 그 자식의 pid 반환
// - 그 외(오류)에는 -1 반환
```

### 흔한 버그 패턴 — kill 직후 waitpid를 호출하지 않음

자식 프로세스를 강제 종료(`kill -9`)한 뒤 `waitpid()`를 호출하지 않고 바로 리턴해버리면, 커널은 자식의 종료 상태를 회수해줄 부모를 계속 기다리게 되고 그 자식은 좀비로 남는다.

```c
do {
    wret = waitpid(p_child, &state, WNOHANG);
    if (wret == -1) {
        // 에러 처리
        return 1;
    } else if (wret == 0) {
        if (is_stop()) {
            kill(p_child, 9);
            waitpid(p_child, &state, 0);  // ← kill 직후 반드시 회수
            return 2;
        }
        usleep(POLL_INTERVAL);
        timeout -= POLL_INTERVAL;
    } else if (wret == p_child) {
        return 0;  // 정상 종료, 이미 회수됨
    }
} while (timeout > 0);

// 타임아웃 시에도 동일하게 kill 후 회수
kill(p_child, 9);
waitpid(p_child, &state, 0);
return ETIMEDOUT;
```

**수정 포인트**: `kill()` 호출 바로 다음 줄에서 `waitpid(p_child, &state, 0)`으로 즉시 자식의 종료 상태를 회수하도록 만들면, 별도의 블로킹 이슈 없이 좀비 프로세스 발생을 막을 수 있다.

> [!IMPORTANT]
> 주의할 점
> 1. 부모가 무한정 기다리게 될 가능성 — kill이 실제로 전달되지 않거나 자식이 신호를 인지하지 못하면 부모가 자식 종료를 영원히 기다릴 수 있다.
> 2. 대응책으로 `kill()` 직후 `usleep(WPOLL_INTERVAL)`(예: 0.2초) 정도의 간극을 주어 자식이 시그널을 인지할 시간을 확보하는 방법도 있다.

## 🔗 참고
- 리턴값으로 좀비 여부를 판단해 나중에 별도로 회수하는 방식도 가능하지만, kill 시점에 바로 `waitpid()`를 호출하는 편이 구현 공수 대비 효율적이다.

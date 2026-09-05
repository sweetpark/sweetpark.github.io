---
title: "which vs command -v, 프로세스 종료 시그널"
tags: [학습, 개발-CS, 언어, Shell-Script, 개발, 이식성, 시그널]
created: 2026-09-05
modified: 2026-09-05
---

# which vs command -v, 프로세스 종료 시그널

> [!NOTE]
> 여러 유닉스 계열(특히 SunOS 같은 상용 Unix)에서 셸 스크립트의 이식성을 해치는 대표적인 두 가지 함정 — `which`의 비표준 동작과, 프로세스를 죽일 때 시그널 종류에 따라 로그가 달라지는 문제.

## 📌 개념

### `which` vs `command -v`

`which`는 POSIX 표준 명령어가 아니라 셸/배포판마다 구현이 다르고, 아예 존재하지 않는 환경도 있다. 반면 `command -v`는 POSIX 표준이라 이식성이 더 좋다.

```bash
SLEEP_CMD=$(command -v sleep 2>/dev/null)
SENDMAIL_CMD=$(command -v sendmail 2>/dev/null)

if [ "$SENDMAIL_CMD" = "" ]; then
    if [ -f "/usr/sbin/sendmail" ]; then
        SENDMAIL_CMD="/usr/sbin/sendmail"
    fi
fi
```

> [!WARNING]
> `command -v`는 alias가 걸려 있으면 실제 실행 파일 경로 대신 alias 정의가 출력될 수 있으므로, alias 환경에서 스크립트를 쓸 때는 결과를 한 번 더 검증하는 것이 안전하다.

- 결론: 크로스플랫폼(특히 상용 Unix 포함) 스크립트에서는 `which`보다 `command -v`를 우선 사용하고, 그래도 실패하면 알려진 절대경로(`/usr/sbin/xxx` 등)를 fallback으로 두는 방어적 작성이 안전하다.

### 프로세스 종료 시그널 — SIGTERM으로 정상 종료

백그라운드로 띄운 프로세스를 종료할 때 시그널을 지정하지 않으면 환경에 따라 강제 종료(kill) 로그가 남을 수 있다. `SIGTERM`으로 정상 종료를 요청하면 이런 로그를 줄일 수 있다.

```bash
${KILL_CMD} -SIGTERM $tmp_pid 2>/dev/null
```

- 시그널 없이 kill한 경우(SunOS 등 일부 환경) 셸이 다음과 같은 메시지를 출력할 수 있다.
    ```text
    ./script.sh: line 50:  8636 Terminated              ${CMD} ...
    ```
- `-SIGTERM`(정상 종료 요청) 옵션을 추가하면 이런 메시지 없이 조용히 종료되는 경우가 많다. 강제 종료가 필요한 경우가 아니라면 `SIGKILL(-9)`보다 `SIGTERM`을 우선 시도하는 것이 프로세스가 정리 작업(cleanup)을 할 기회를 준다는 점에서도 바람직하다.

## 🔗 참고
- 같은 스크립트가 리눅스/유닉스 여러 배포판에서 동작해야 한다면, `which` 대신 `command -v` + 알려진 절대경로 fallback, 그리고 프로세스 종료 시 시그널을 명시하는 두 가지를 기본 습관으로 두는 것이 좋다.

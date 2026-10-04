---
title: "[명령어] Ftrace 사용법 (source 분석)"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 3일 오후 11:08
modified: 2026-09-05
---

# [명령어] Ftrace 사용법 (source 분석)

> [!NOTE]
> 리눅스 기본 제공 tracer인 ftrace로 커널 함수/이벤트/프로세스 단위 실행 흐름을 추적하여 소스를 분석하는 방법 정리.

## 📌 개념

- ftrace는 리눅스 커널에 기본 제공되는 tracer로, `/sys/kernel/debug/tracing`을 통해 함수·이벤트 호출 흐름을 추적한다.

## 💻 예시

### 1. trace 확인 (debugfs 마운트)

```bash
# ftrace 마운트 확인
ls /sys/kernel/debug

# 출력값이 없다면 mount
mount -t debugfs nodev /sys/kernel/debug
```

### 2. tracer 설정

```bash
cd /sys/kernel/debug/tracing

cat current_tracer        # 현재 tracer 모드 확인 (기본 nop)
cat available_tracers     # 사용 가능한 tracer 종류 확인
echo function_graph > current_tracer   # function_graph tracer로 설정
```

### 3. tracer 대상 설정

```bash
# 보고 싶은 함수 필터링 (vfs, write 포함 함수)
cat available_filter_functions
echo "*vfs*" > set_ftrace_filter
echo "*write*" >> set_ftrace_filter
cat trace
echo " " > set_ftrace_filter          # 필터 초기화

# 제외할 함수 설정
echo "*tty*" > set_ftrace_notrace

# 이벤트 기준 설정
cat available_events
echo sys_enter_write > set_event
cat trace
echo " " > set_event                  # 이벤트 초기화

# 프로세스(pid) 기준 설정
ps -e | grep vim                       # 대상 pid 확인
echo 5573 > set_ftrace_pid
echo > trace                           # 기존 tracing 데이터 삭제
```

### 4. trace 결과 보기 / 켜고 끄기

```bash
cd /sys/kernel/debug/tracing
vi trace

echo 1 > tracing_on    # tracing 켜기
echo 0 > tracing_on    # tracing 끄기
```

## 🔗 참고

- [Linux ftrace 사용법 (Medium)](https://medium.com/@hyoje420/linux-ftrace-%EC%82%AC%EC%9A%A9%EB%B2%95-31b4dc7ac93c)
- 소스 시각화 도구: CoatiSoftware SourceTrail (`coatisoftware/sourcetrail/release`)

---
title: "메모리 누수 찾기"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 3일 오후 11:09
modified: 2026-09-05
---

# 메모리 누수 찾기

> [!NOTE]
> `valgrind`로 C/C++ 프로그램의 메모리 누수(leak)를 찾는 방법 정리.

## 📌 개념

- **valgrind 주요 옵션**
    - `--leak-check=full`: 메모리 leak 부분을 상세히 찾기
    - `--show-leak-kinds=all`: 메모리 leak 종류를 모두 표시
    - `--track-origins=yes`: 초기화되지 않은 값의 출처 추적

## 💻 예시

```bash
# valgrind 사용법
valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes \
  ./vf_analyze --collect linux_collect.xml --result result.xml
```

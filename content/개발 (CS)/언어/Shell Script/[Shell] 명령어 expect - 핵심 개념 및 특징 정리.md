---
title: "[명령어] expect"
tags: [학습, 개발-CS, 언어, Shell-Script, 개발, Shell, 자동화]
created: 2026-09-05
modified: 2026-09-05
---

# [명령어] expect

> [!NOTE]
> 대화형 프로그램의 프롬프트를 자동 응답 처리하는 `expect` 스크립트 도구.

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

`expect`는 대화형(interactive) 프로그램의 프롬프트를 자동 응답 처리하는 스크립트 도구다. ssh/ftp/passwd 등 사람이 입력을 기다리는 명령을 무인 자동화할 때 쓴다.

- `EOF` : Here-document의 Delimiter(구분자) — `<<EOF ... EOF` 사이를 입력으로 전달
- `spawn` : 제어할 프로세스를 실행
- `expect` : 특정 출력(예측값) 패턴이 나올 때까지 대기
- `send` : 패턴이 나오면 지정한 문자열을 입력
- `expect eof` : 프로세스가 종료될 때까지 대기

## 💻 예시

```bash
expect <<EOF

	spawn ssh root@192.168.0.1 [명령어]
	expect "password:"
	send "$PW\n"

	expect eof

EOF
```

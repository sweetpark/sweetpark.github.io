---
title: "[명령어] TAR 사용법"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 3일 오후 11:07
modified: 2026-09-05
---

# [명령어] TAR 사용법

> [!NOTE]
> `tar`로 파일을 묶고 푸는 기본 사용법과 gzip/bzip2 압축 옵션 정리.

## 📌 개념

`tar` 자체는 여러 파일을 하나의 아카이브로 "묶기만" 할 뿐 압축 기능이 없다(Tape ARchive의 약자로, 원래 테이프 백업용 도구). 실무에서는 보통 gzip(`-z`)이나 bzip2(`-j`) 압축 옵션을 함께 써서 용량까지 줄인다.

- gzip(`-z`, 확장자 `.tar.gz`): 압축/해제 속도가 빠른 대신 압축률은 상대적으로 낮음 — 배포·백업처럼 속도가 중요할 때
- bzip2(`-j`, 확장자 `.tar.bz2`): 압축률은 더 좋지만 속도가 느림 — 장기 보관용으로 용량을 최대한 줄이고 싶을 때

자주 쓰는 명령:

- 압축(묶기): `tar -cvf [tar이름].tar [묶을 파일]`
- 풀기: `tar -xvf [tar파일]`
- tar.gz: 묶기 `tar -zcvf`, 풀기 `tar -zxvf`

## 💻 예시

| 작업 | 명령어 |
| --- | --- |
| 현재 디렉토리의 모든 파일·디렉토리를 tar로 묶기 | `tar cvf T.tar *` |
| 대상 디렉토리를 포함해 묶기 | `tar cvf T.tar [PATH]` |
| 파일을 지정하여 묶기 | `tar cvf T.tar [FILE_1] [FILE_2]` |
| tar 아카이브를 현재 디렉토리에 풀기 | `tar xvf T.tar` |
| tar 아카이브를 지정 디렉토리에 풀기 | `tar xvf T.tar -C [PATH]` |
| tar 아카이브 내용 확인 | `tar tvf T.tar` |
| tar로 묶고 gzip 압축 | `tar zcvf T.tar.gz *` |
| gzip 압축 tar 풀기 | `tar zxvf T.tar.gz` |
| tar로 묶고 bzip2 압축 | `tar jcvf T.tar.bz2 *` |
| bzip2 압축 tar 풀기 | `tar jxvf T.tar.bz2` |
| 묶거나 풀 때 파일별 진행 확인 | `tar cvfw T.tar *` |

> [!TIP]
> `tar tvf`로 먼저 내용물을 확인하는 습관이 중요하다 — 대용량 아카이브를 풀었다가 디렉토리 구조가 예상과 달라 파일이 여기저기 흩어지는 사고를 미리 방지할 수 있다.

## 🔗 참고

- [리눅스 tar 명령어 사용법 - recipes4dev](https://recipes4dev.tistory.com/146)

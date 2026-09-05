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

## 🔗 참고

- [리눅스 tar 명령어 사용법 - recipes4dev](https://recipes4dev.tistory.com/146)

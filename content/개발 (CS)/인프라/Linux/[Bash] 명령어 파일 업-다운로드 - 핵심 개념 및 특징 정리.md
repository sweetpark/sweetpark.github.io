---
title: "[명령어] 파일 업/다운로드"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 3일 오후 11:07
modified: 2026-09-05
---

# [명령어] 파일 업/다운로드

> [!NOTE]
> `lrzsz` 패키지의 `sz`(다운로드) / `rz`(업로드) 명령으로 터미널에서 서버↔PC 간 파일을 주고받는 방법 정리.

## 📌 개념

- **sz**: 서버에 있는 파일을 (PC로) 다운로드하는 명령
- **rz**: 서버에 파일을 (PC에서) 업로드하는 명령

## 💻 예시

### 설치

```bash
rpm -qa | grep lrzsz    # 설치 확인
yum install lrzsz       # CentOS
apt install lrzsz       # Ubuntu
```

### 사용법

```bash
sz [경로]파일명    # 윈도우 PC로 다운로드됨
rz                 # 윈도우에 있는 파일을 서버로 업로드
```

> [!NOTE]
> XTerm에서 사용 시
> - sz 명령어 → Ctrl + 마우스 오른쪽 → Receive file using Z-modem
> - rz 명령어 → Ctrl + 마우스 오른쪽 → Send file using Z-modem

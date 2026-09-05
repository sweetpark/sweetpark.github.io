---
title: "Shell 종류"
tags: [학습, 개발-CS, 언어, Shell-Script, 개발, Shell, 리다이렉션]
created: 2026-09-05
modified: 2026-09-05
---

# Shell 종류

> [!NOTE]
> 셸 종류(sh/ksh/csh/bash)와 exec, awk, 표준 스트림/dev/null 개념.

## 📌 개념

### 셸 종류

- sh (dash) ⇒ `#!/bin/sh`
- ksh
- csh
- **bash ⇒ `#!/bin/bash`**

```bash
#!/usr/bin/bash
```

### exec (find)

- `find` 명령어에서 사용
- `find / -name -exec cat {} > /root/tmp \;`

> [!NOTE]
> `-exec 명령어 {} \;`
> - `{}` : find로 찾은 파일들
> - `\;` : -exec 옵션 내용의 끝을 나타냄

### awk

- awk는 공백을 기준으로 `$1` ~ `$N` 까지 분류
- `awk '$4 < 100000'`
- `awk -f [awk 명령 파일] [awk 명령을 적용할 텍스트 파일]`
    - awk 명령 파일 ⇒ `{print "안녕하세요 " $1, $2 "님"}`
    - 결과 ⇒ `안녕하세요 홍 길동님`

### 표준 스트림과 /dev/null

| 스트림 | 파일 디스크립터 |
| --- | --- |
| 표준입력 | 0 |
| 표준출력 | 1 |
| 표준에러 | 2 |

- `cat /etc/passwd > /sola/tmp` == `cat /etc/passwd 1> /sola/tmp`

> [!NOTE]
> `1>` : 표준출력을 /sola/tmp로 바꿈

- `cat /etc/pppp > /sola/tmp 2>&1`

> [!NOTE]
> `2>&1` : `cat /etc/pppp` 오류를 /sola/tmp로 저장

- `cat /etc/sadjksaasdasdsa > /dev/null 2>&1`

> [!NOTE]
> `>/dev/null` : 표준출력을 /dev/null로 버림
> `2>&1` : 표준에러를 표준출력으로 출력

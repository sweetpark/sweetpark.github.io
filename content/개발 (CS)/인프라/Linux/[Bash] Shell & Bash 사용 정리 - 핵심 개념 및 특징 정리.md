---
title: "Shell & Bash 사용 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:18
modified: 2026-09-05
---

# Shell & Bash 사용 정리

> [!NOTE]
> Bash 기본 사용법 정리. 셸 종류·정규표현식·와일드카드, 환경/셸 변수, 입출력 리다이렉션과 파일 디스크립터, alias, 환경변수 설정 파일.

## 📌 개념

### vi 편집기에서 셸 명령 실행

| 명령 | 설명 |
| --- | --- |
| `:!명령어` | vi 종료 없이 외부 명령 1회 실행 |
| `:sh` | vi 종료 후 셸로 이동 (여러 명령 실행 가능) |
| `exit` | 셸 종료 → vi 복귀 |

### 정규표현식 / 와일드카드

| 기호 | 의미 |
| --- | --- |
| `*` | (정규식) 0회 이상 반복 / (셸) 모든 파일 |
| `^` | 줄의 시작 |
| `$` | 줄의 끝 |
| `..` | 임의의 2글자 |
| `~` | 현재 사용자 홈 디렉토리 |

### 명령 연결

| 형태 | 설명 |
| --- | --- |
| `명령1 ; 명령2` | 순차 실행 |
| `명령1 \| 명령2` | 앞 명령의 결과를 다음 명령 입력으로 전달(파이프) |
| `'명령'` | 문자열 그대로 인식 (확장 X) |

### 파일 디스크립터 (FD)

| 번호 | 이름 | 설명 |
| --- | --- | --- |
| 0 | stdin | 표준 입력 |
| 1 | stdout | 표준 출력 |
| 2 | stderr | 표준 오류 |

### 출력 리다이렉션

| 형태 | 설명 |
| --- | --- |
| `>` | 파일 덮어쓰기 |
| `>>` | 파일에 추가 |

### 환경변수 설정 파일

| 파일 | 역할 |
| --- | --- |
| `/etc/profile` | 시스템 전체 환경변수 |
| `~/.bash_profile` | 사용자 환경변수 |
| `/etc/bashrc` | 시스템 alias |
| `~/.bashrc` | 사용자 alias |

### 매개변수

- `$1 ~ $N`: 스크립트 실행 시 전달된 인자

## 💻 예시

### 셸 종류 확인 / 변수 목록

```bash
cat /etc/shells   # 설치된 로그인 셸 목록
env               # 환경변수만
set               # 셸 변수 + 환경변수
```

### Bash 변수

```bash
변수명=값          # 띄어쓰기 금지
SOME=test
echo $SOME         # 변수 출력

export SOME        # 환경변수 등록
unset 변수명        # 변수 해제
export -n 변수명    # 환경변수 → 셸 변수
```

### 출력 (printf)

```bash
printf "형식문자열" 인수
printf "%d + %d = %d\n" 10 10 20
```

### 리다이렉션

```bash
ls 1> ls.out          # 정상 출력 저장
ls 2> err.out         # 오류 출력 저장
cat > 1.txt           # 입력값 저장
echo "hi" > 1.txt

ls . /abc > 1.txt 2>&1   # stdout + stderr 합치기 (&1 = 1번이 가리키는 파일)
```

### alias

```bash
alias lll='ls -al'    # 등록
alias                 # 확인
unalias 별명           # 해제

source ~/.bashrc      # 즉시 적용 (로그아웃 없이 반영)

# 영구 저장
cd ~
vi .bashrc            # alias lll='ls -al' 추가
source ~/.bashrc
```

> [!IMPORTANT]
> alias는 기본적으로 재부팅 시 사라진다. `.bashrc`에 저장해야 영구 적용된다.

### 설정 반영

```bash
source ~/.bashrc
source ~/.bash_profile
```

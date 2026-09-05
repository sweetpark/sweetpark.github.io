---
title: "Linux 기본명령 & 시스템 관리 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:16
modified: 2026-09-05
---

# Linux 기본명령 & 시스템 관리 정리

> [!NOTE]
> 리눅스 기본 명령과 시스템 관리 정리. find/grep, sudo·비밀번호 정책, 파일 종류·속성·링크, 파일 관리, 특수 권한(SUID/SGID/Sticky)·ACL, 작업 스케줄링(at/crontab).

## 📌 개념

### sudo 권한 설정 (`/etc/sudoers`)

| 설정 | 의미 |
| --- | --- |
| `계정명 ALL=(ALL) ALL` | 해당 계정 모든 sudo 권한 |
| `%그룹명 ALL=(ALL) ALL` | 해당 그룹 sudo 권한 |

### 비밀번호 정책 (`chage`)

| 옵션 | 설명 |
| --- | --- |
| -m | 최소 변경 기간 |
| -M | 최대 사용 기간 |
| -E | 만료 날짜 |
| -W | 만료 전 경고 기간 |

### 파일 종류

| 기호 | 파일 종류 |
| --- | --- |
| b | 블록 장치 파일 |
| c | 문자(섹터) 장치 파일 |
| p | 파이프 파일 |
| s | 소켓 파일 |

### 링크 개념

- **하드 링크**: 동일 inode 공유, 파일 개수 증가 (`ln 원본 링크`)
- **심볼릭 링크**: 바로가기 개념 (`ln -s 원본 링크`)

### 특수 권한 (SUID / SGID / Sticky Bit)

| 권한 | 설명 | 표시 |
| --- | --- | --- |
| setUID | 파일 소유자 권한으로 실행 | `rws------` (4000) |
| setGID | 그룹 권한으로 실행 | `---rws---` (2000) |
| Sticky Bit | 파일 소유자만 삭제 가능 | `------rwt` (1000) |

> [!IMPORTANT]
> 대문자 `S`, `T`로 표시되면 실행 권한이 없는 상태다.

### 작업 스케줄링

- **at**: 단일 작업 예약. 실행 파일 위치 `/var/spool/at/`
- **crontab**: 정기 작업. 형식 `분 시 일 월 요일 명령어`, 기호 `*`(매번) `-`(범위) `,`(다중) `/`(주기)
- **anacron**: 장시간 꺼져 있던 시스템에서도 실행 보장

## 💻 예시

### 파일 · 문자열 찾기

```bash
find [경로] -name "파일명"
find [경로] -name "파일명" -ls
find [경로] -name "파일명" -exec [명령어] {} \;

grep "문자열" 파일명
grep -l "문자열" 파일명    # 문자열을 포함한 파일 이름만 출력
```

### 계정 / 비밀번호 정책

```bash
vi /etc/sudoers
vi /etc/login.defs
chage -l 계정명
```

### 파일 속성 / 링크

```bash
stat 파일명                # 크기, 블록 수, inode, 시간, 권한
ln 원본파일 링크파일        # 하드 링크
ln -s 원본파일 링크파일     # 심볼릭 링크
```

### 파일 · 디렉토리 관리

```bash
cp 원본 대상
cp /etc/passwd /test/a
cp -r 디렉토리 대상       # 디렉토리 복사
mv 원본 새이름           # 이동 / 이름 변경
echo 문자열
echo $변수명
alias ll='ls -al'
```

### vi 편집기 핵심

```text
G        : 파일 끝
:숫자     : 해당 줄 이동
:set nu  : 줄 번호 표시
i / a / o : 입력 모드 (커서 앞 / 뒤 / 다음 줄)
yy / p / dd : 복사 / 붙여넣기 / 삭제
```

### 특수 권한 설정

```bash
chmod u+s 파일    # setUID
chmod g+s 파일    # setGID
chmod o+t 파일    # Sticky
```

### ACL (Access Control List)

```bash
# 확인 (권한 끝에 '+'가 있으면 ACL 설정됨)
ls -l
getfacl 파일명

# 설정
setfacl -m u:user01:rwx 파일
setfacl -m d:u:user01:rwx 파일
setfacl -m d:g:group01:rwx 파일

# 제거
setfacl -x u:user01 파일
setfacl -k 파일    # default ACL 제거
setfacl -b 파일    # 모든 ACL 제거

# 하위 디렉토리 포함
setfacl -Rm u:user01:rwx 디렉토리
setfacl -Rb 디렉토리
```

### at (단일 작업)

```bash
at now +5min
atq
```

| 명령 | 의미 |
| --- | --- |
| `at 22:30` | 오늘 22:30 |
| `at 11:00AM` | 오전 11시 |
| `at Feb 12 2022 15:00` | 특정 날짜 |
| `at now +5min` | 5분 후 |

### crontab (정기 작업)

```bash
crontab -e
crontab 파일명
crontab -l
crontab -r
```

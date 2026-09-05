---
title: "👤 Linux 사용자 · 권한 · 로그 관리 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:24
modified: 2026-09-05
---

# Linux 사용자 · 권한 · 로그 관리 정리

> [!NOTE]
> 사용자 수정(usermod)·패스워드 에이징(chage)·그룹 관리, 로그인 정보(who/w/last), sudo·소유권, 로그 관리(rsyslog/journalctl)를 정리.

## 📌 개념

### usermod 주요 옵션

| 옵션 | 설명 |
| --- | --- |
| `-u` | UID 수정 |
| `-o` | UID 중복 허용 |
| `-g` | 기본 그룹(GID) 변경 |
| `-G` | 보조 그룹 변경 |
| `-d` | 홈 디렉터리 변경 |
| `-s` | 기본 셸 변경 |
| `-l` | 계정 이름 변경 |

### chage (패스워드 에이징)

| 항목 | 옵션 | 의미 |
| --- | --- | --- |
| MIN | `-m` | 최소 사용 기간 |
| MAX | `-M` | 최대 사용 기간 |
| Warning | `-W` | 만료 전 경고 |
| Inactive | `-I` | 만료 후 유예 기간 |
| Expire | `-E` | 계정 만료일 |
| 조회 | `-l` | 정책 확인 |

### who 옵션

| 옵션 | 설명 |
| --- | --- |
| `-m` | 현재 사용자 정보 |
| `-r` | 현재 런레벨 |
| `-H` | 헤더 출력 |
| `-q` | 사용자 이름만 |
| `-b` | 마지막 부팅 시간 |

### 로그인 기록 (last 계열)

| 명령 | 설명 |
| --- | --- |
| `last` | 로그인/로그아웃 기록 |
| `lastb` | 로그인 실패 기록 |
| `lastlog` | 계정별 마지막 로그인 |

### 로그 데몬 / 주요 로그 파일

| 데몬 | 설명 |
| --- | --- |
| syslogd | 전통적 로그 데몬 |
| rsyslog | 확장된 로그 데몬 |
| systemd-journald | systemd 로그 |

| 파일 | 내용 |
| --- | --- |
| `/var/log/messages` | 시스템 일반 로그 |
| `/var/log/secure` | 보안 로그 |
| `/var/log/lastlog` | 마지막 로그인 |
| `/var/log/btmp` | 로그인 실패 기록 |

### journal 저장 위치 / 제한

- `/run/log`(임시 로그) / `/var/log/journal`(영구 로그)
- 저장 제한: 파일시스템 전체 용량의 10% 초과 불가, 여유 공간의 15% 초과 불가

### 시험용 한 줄 요약

> usermod → chage → group → sudo → last → journalctl

## 💻 예시

### 사용자 / 그룹 관리

```bash
usermod [옵션] 계정명
chage [옵션] 계정명
find / -user UID -exec rm -r {} \;   # 사용자 소유 파일 삭제

# 그룹
groupadd 그룹명
groupadd -g GID 그룹명
groupmod -g GID 그룹명         # GID 변경
groupmod -n 새이름 기존이름     # 그룹명 변경
groupdel 그룹명
```

### 로그인 정보 확인

```bash
who
w    # 현재 로그인 사용자 + 작업 상태
```

### sudo 권한 설정

```bash
# /etc/sudoers (반드시 visudo 사용 권장)
#   계정명  위치=(권한)  명령어
#   %그룹명 위치=(권한)  명령어
# 예시:
#   root    ALL=(ALL)    ALL
#   %wheel  ALL=(ALL)    ALL
visudo
```

### 파일 소유권 변경

```bash
chown 소유자 파일
chown 소유자:그룹 파일
chgrp 그룹 파일
```

### 로그 생성 / journalctl

```bash
logger -p facility.level "메시지"          # 로그 수동 생성

journalctl -p crit..emerg                  # 중요 로그
journalctl --since "YYYY-MM-DD" --until "YYYY-MM-DD"
```

### journal 로그 영구 저장 설정

```bash
mkdir /var/log/journal
chown root:systemd-journal /var/log/journal
chmod g+s /var/log/journal
systemctl restart systemd-journald
```

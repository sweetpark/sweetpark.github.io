---
title: "CentOS 시스템 점검 명령어 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 3일 오전 10:10
modified: 2026-09-05
---

# CentOS 시스템 점검 명령어 정리

> [!NOTE]
> CentOS 서버 점검 명령어 모음. 시스템 상태·프로세스·CPU/메모리·디스크/LVM·계정·크론·로그를 확인하는 명령을 정리.

## 📌 개념

실무 기준 요약:

- **CPU / MEM 이슈** → `top`, `free -m`, `vmstat`
- **디스크 용량 이슈** → `df -h`, `du -sh *`, `lsblk`
- **프로세스 문제** → `ps -ef`, `ps aux`
- **보안 / 장애 원인** → `/var/log/messages`, `/var/log/secure`, `dmesg`
- **스토리지 구조 확인** → `fdisk -l`, `pvs/vgs/lvs`

## 💻 예시

### 1. 시스템 상태 / Uptime / 사용자

```bash
w    # 로그인 사용자 + 가동 시간 + Load Average
```

### 2. 프로세스 상태

```bash
top                     # 실시간 프로세스 / CPU·MEM 사용률
ps -ef                  # 모든 프로세스 (풀 포맷)
ps aux                  # 프로세스별 메모리 사용률
ps -ef | grep 프로세스명  # 특정 프로세스 확인
```

### 3. CPU / Memory 상태

```bash
cat /proc/cpuinfo | more                          # CPU 정보
cat /proc/cpuinfo | grep processor | wc -l        # CPU 코어 수
free
free -m
vmstat
cat /proc/meminfo | more                          # 메모리 상세
```

### 4. 디스크 / 파일 시스템

```bash
df -h        # 파일 시스템 사용량
fdisk -l     # 디스크 파티션
lsblk        # 블록 디바이스 구조
du -a
du -sh *     # 디렉토리/파일 용량
```

### 5. LVM 상태

```bash
pvs   # Physical Volume
vgs   # Volume Group
lvs   # Logical Volume
```

### 6. 사용자 / 계정 / 크론

```bash
cat /etc/passwd    # 사용자 계정
crontab -l         # 사용자 크론
cat /etc/crontab   # 시스템 크론
```

### 7. 로그 / 에러 메시지

```bash
# 시스템 로그
cat /var/log/messages | grep -e fail -e error
cat /var/log/messages* | grep -i -e error -e fail -e stop

# 보안 로그
cat /var/log/secure | grep -e fail -e error
cat /var/log/secure* | grep -i -e error -e fail -e stop

# 커널 / 부팅 메시지
dmesg
dmesg | grep -i -e error -e fail -e stop
```

### 8. 장치 정보

```bash
cat /proc/devices | more
```

### 9. 점검용 명령어 묶음 (실무용)

```bash
# 빠른 상태 점검 (1분)
w
top
df -h
free -m

# 디스크 / LVM 점검
lsblk
pvs
vgs
lvs

# 장애 로그 점검
dmesg | grep -i -e error -e fail -e stop
cat /var/log/messages* | grep -i error
cat /var/log/secure* | grep -i error
```

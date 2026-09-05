---
title: "AIX 서버 점검 명령어 정리 (운영 표준)"
tags: [학습, 개발-CS, 인프라, 인프라-기초-지식, 개발, AIX, Unix]
modified: 2026-09-05
---

# AIX 서버 점검 명령어 정리 (운영 표준)

> [!NOTE]
> IBM AIX 서버 정기점검·장애대응용 명령어 총정리. 기본 상태 확인부터 CPU/메모리/디스크 성능, LVM, Paging Space, System Dump, 에러 로그, 하드웨어, 네트워크, 계정/보안, 파일시스템 확장까지. 원래 두 개 문서(운영 표준 버전 + 실사용 버전)로 나뉘어 있던 것을 하나로 통합·중복 제거함.
>
> OS 백업(mksysb) 절차는 별도 문서 [(Bash) AIX mksysb(OS 백업) 작업 절차 정리 - 핵심 개념 및 특징 정리]([Bash]%20AIX%20mksysb%28OS%20백업%29%20작업%20절차%20정리%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.

## 📌 개념

### 1. 시작 — 가동 상태 / 접속자 / 에러 (가장 먼저 확인)
```bash
w
uptime
errpt
```
- `w` : 접속 사용자, load average
- `uptime` : 서버 가동 시간
- `errpt` : AIX 하드웨어/시스템 에러 로그

### 2. OS 레벨 / 패치
```bash
oslevel -r
oslevel -s
instfix -i | grep ML
```
- 확인 포인트: OS 버전, TL/SP 레벨, ML(Maintenance Level) 최신 패치 적용 여부

### 3. 장치 인식 상태 확인
```bash
lsdev -Cc processor
lsdev -Cc memory
lsdev -Cc disk
lsdev -Cc adapter
```

**부트 디바이스 / 시스템 설정**
```bash
bootlist -m normal -o
lsattr -El mem0
lsattr -El sys0
```

### 4. 파일시스템 & 디스크 사용량
```bash
df -g
df -k
df -gP
```
- AIX에서는 `df -g`가 가장 직관적

### 5. CPU / Memory / Disk 성능 점검

**CPU**
```bash
top
topas
sar -P ALL 5 10
```

**Memory**
```bash
rmss -p
free -m
svmon
svmon -G -O summary=basic,unit=GB
bootinfo -r
```

**Disk I/O**
```bash
iostat 1 10
```
- 판단 기준: `iostat` busy ↑ → 디스크 병목 / `lsps` 사용률 ↑ → 메모리 부족

### 6. 프로세스 점검
```bash
ps -ef
ps -ef | wc -l
ps -ef | grep defunct
ps -ef | grep 프로세스명
topas
```
- defunct(좀비) 프로세스 다수 → 애플리케이션 또는 부모 프로세스 문제

### 7. LVM 상태 점검(AIX 핵심)

**VG / LV / PV 상태**
```bash
lsvg -o                              # Online VG
lsvg -o | lsvg -il | grep -ic stale  # stale 여부
lsvg -o | lsvg -ip | grep -ic miss   # PV 인식 문제 여부
lsvg -l rootvg                       # rootvg 포함 LV 확인
```

**개별 디스크**
```bash
lspv
lspv -l hdisk0
```
- 중요: `stale` → 미러 깨짐 / `miss` → PV 인식 문제

### 8. Paging Space(Swap) 점검
```bash
lsps -a
lsps -s
```
- 페이징 스페이스 = 디스크 일부를 메모리처럼 사용(메모리 부족 시 사용, Windows 가상 메모리와 동일 개념). VG당 최소 1개 필요, 80% 이상 사용 시 위험.

### 9. System Dump 장치 점검(장애 대비)
```bash
sysdumpdev -l
sysdumpdev -e
```
덤프 크기 계산:
```bash
bc
EstimatedDumpSize /1024/1024
```
- 권장: dump size < 3GB, dump device 미설정은 장애 시 치명적

### 10. 에러 로그 점검(매우 중요)
```bash
errpt
errpt -a
errpt -d H
errpt -aj ERROR_ID
```
로그 초기화(필요 시): `errclear 0`
- 경로: `/var/adm/ras/errlog`
- 추가 로그: `cat /var/log/messages.* | grep -e fail -e error` (AIX는 errpt + messages 로그를 같이 보는 게 중요)

### 11. SAN / Path / RAID
```bash
lspath
powermt display
powermt check
```

### 12. 네트워크 점검
```bash
ifconfig -a
entstat -d en?
netstat -v
netstat -rn
```
- 확인 포인트: Interface Speed(예: 1000Mbps Full), 패킷 에러 여부, 라우팅 테이블

### 13. 부팅 / 시스템 정보
```bash
bootlist -m normal -o
bootinfo -b
uname -Mu
lsconf
lscfg
lsslot -c
```
- 디스크 장애 시 부트 디스크 확인 필수

### 14. 파일 / 계정 / 보안 설정
```bash
cat /etc/passwd
cat /etc/hosts
cat /etc/services
cat /etc/security/user
```

### 15. 파일시스템 확장(실무 자주 사용)
```bash
lsvg rootvg
chfs -a size=+5G /usr
df -g
```
- 순서: VG 여유 공간 확인 → `chfs` → `df` 재확인

### 16. Oracle 점검(AIX + Oracle)
```bash
sqlplus / as sysdba
archive log list
@monitoring.sql
```
SID 설정 필요 시: `export ORACLE_SID=kras`

### 17. 예약 작업 / 애플리케이션 확인
```bash
crontab -l
```
- 애플리케이션/서비스 확인: CI 프로그램 정상 동작 여부, 웹 서비스 직접 접속 테스트, 프로그램 직접 실행 테스트 (OS 정상 + 서비스 비정상 상황을 구분하기 위한 단계)

### 18. 최근 파일 변경 내역(마무리 확인)
```bash
ls -ltr
```

### 19. 주요 AIX 로그 위치

| 종류 | 경로 |
| --- | --- |
| mail | /var/spool/mail |
| user | /var/adm/sulog |
| login | /var/adm/wtmp |
| fail | /etc/security/faillog |
| error | /var/adm/ras/errlog |
| boot | /var/adm/ras/bootlog |
| cron | /var/adm/cron/log |

### 참고 개념 — topas 메모리 지표 해석
- `comp` → 시스템 연산에 반드시 필요한 메모리
- `noncomp` → 사용자/프로세스가 실질적으로 사용하는 메모리

> [!WARNING]
> comp가 90% 이상이면 메모리 병목 현상 및 성능 저하 가능성이 매우 큼.

### AIX 실제 점검 순서 요약(현장용)
1. `w / uptime / errpt`
2. `oslevel -r`
3. `df -g`
4. `iostat / topas / svmon`
5. `lsvg / lspv`
6. `lsps`
7. `sysdumpdev`
8. `errpt`
9. `ifconfig / entstat`

## 💻 예시
```bash
w; uptime; errpt
oslevel -r; df -g
topas
errpt -a
lsdev -Cc disk; lsvg -o
```

## 🔗 참고
- 관련 문서: [(Bash) AIX mksysb(OS 백업) 작업 절차 정리 - 핵심 개념 및 특징 정리]([Bash]%20AIX%20mksysb%28OS%20백업%29%20작업%20절차%20정리%20-%20핵심%20개념%20및%20특징%20정리.md)
- 이 문서는 AIX 서버 정기점검·장애 대응·인수인계까지 포괄하는 운영 표준 문서로 정리됨.

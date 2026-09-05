---
title: "HP-UX 서버 점검 명령어 정리"
tags: [학습, 개발-CS, 인프라, 인프라-기초-지식, 개발, HP-UX, Unix]
modified: 2026-09-05
---

# HP-UX 서버 점검 명령어 정리

> [!NOTE]
> HP-UX 서버 점검 명령어 정리 — 기본 시스템 정보, 네트워크, 디바이스/부팅, LVM, 파일시스템, RAID, 성능 모니터링, 클러스터, 패치/복구, GUI 관리 툴까지 장애대응·정기점검용 표준 가이드. 원래 두 개의 거의 동일한 문서(정리 1, 정리 2)를 하나로 통합·중복 제거함.

## 📌 개념

### 1. 기본 시스템 / H/W 정보

**OS & 커널**
```bash
swlist | grep OE
uname -a
```

**모델 / CPU / 메모리**
```bash
model      # 서버 모델명
machinfo   # CPU, Memory, 시스템 아키텍처 상세
```

### 2. 네트워크 정보 확인

**네트워크 상태 / 라우팅**
```bash
netstat -v
netstat -nr
```

**NIC & IP 정보**
```bash
lanscan
netstat -in
cat /etc/rc.config.d/netconf
```
- 용도: NIC 링크 상태, IP 설정 확인, 라우팅 이상 여부 점검

### 3. 디바이스 & 부팅 정보

**전체 장치 스캔**
```bash
ioscan -fn | more
```

**부팅 메시지 / 시스템 로그**
```bash
dmesg
cat /var/adm/syslog/syslog.log
cat /var/opt/resmon/log/event.log
```
- 용도: 부팅 중 하드웨어 오류, 디스크/컨트롤러 에러 확인

### 4. Boot / LVM 구조 확인

**Boot / Root / Swap / Dump**
```bash
lvlnboot -v
```

**LVM 구성**
```bash
pvdisplay
vgdisplay -v vg00
lvdisplay -v /dev/rdsk/c0t0d0
```
- 용도: 디스크 장애 시 복구 구조 파악, RootVG(vg00) 구성 확인

### 5. 파일시스템 / 디스크 사용량
```bash
bdf
df -k
df -g
```
- 권장: HP-UX에서는 `bdf`가 가장 직관적이고 효율적

### 6. RAID 구성 확인(컨트롤러별)

**RAID 디바이스 확인**
```bash
ioscan -fnK
```
→ `/dev/sasd0`, `/dev/sasd1`, `/dev/ciss0` 등 존재 여부 확인

**SAS 컨트롤러**
```bash
sasmgr get_info -D /dev/sasd0
sasmgr get_info -D /dev/sasd0 -q vpd
sasmgr get_info -D /dev/sasd1 -q raid
```

**SCSI 컨트롤러**
```bash
sautil /dev/ciss0
```
- 용도: RAID Level, 디스크 Fail 여부, Hot-Spare 상태 확인

### 7. 성능 / 리소스 모니터링

**CPU / Memory / Disk**
```bash
top
swapinfo
swapinfo -tm
swapinfo -dm
iostat 3 1
```
- 디스크 I/O: 전송률, 서비스 타임, 디바이스 부하 확인 가능
- swap: 메모리 부족 시를 대비해 미리 확보한 공간

**통합 모니터링 툴**
```bash
glance
```
- `glance(HP-UX)` ≒ `smitty(IBM AIX)` — CPU/MEM/DISK 한 화면 요약

### 8. 클러스터 / 마운트 상태
```bash
cmviewcl
```
- 용도: 클러스터 환경에서 디스크 정상 마운트 여부 확인

### 9. 프로세서 상태
```bash
psrinfo -v
swap -s
```
- 프로세서 온라인/오프라인 상태 확인

### 10. 패치 / 복구 정보

**라이브러리 패치**
```bash
swlist -l product | grep libc
```

**Ignite 복구 정보**
```bash
ll /var/opt/ignite/recovery
```
- 용도: OS 패치 상태 확인, 장애 시 OS 복구 가능 여부 확인

### 11. 관리 툴(GUI) — SAM(System Administration Manager)
```bash
sam
```
- GUI 기반 시스템 관리 툴, RAID/디스크 확인 용도로 특히 유용

## 💻 예시
```bash
# 장애 대응 시 우선 확인
dmesg
cat /var/adm/syslog/syslog.log
glance

# 디스크/RAID 확인
ioscan -fnK
sasmgr get_info -D /dev/sasd0 -q vpd

# 실무 기준 정리 포인트
# 장애 대응 : dmesg, syslog, event.log, glance
# 용량 이슈 : bdf, swapinfo, lvdisplay
# RAID 확인 : ioscan + sasmgr / sautil
# 자산 점검 : machinfo, model, swlist
```

## 🔗 참고
- 이 문서는 HP-UX 서버 장애 대응 + 정기 점검 + 디스크/RAID 관리용 표준 가이드로, [(Bash) AIX 서버 점검 명령어 정리 (운영 표준) - 핵심 개념 및 특징 정리]([Bash]%20AIX%20서버%20점검%20명령어%20정리%20%28운영%20표준%29%20-%20핵심%20개념%20및%20특징%20정리.md) 문서와 함께 두면 이기종 Unix 서버 운영 문서로 활용 가능.

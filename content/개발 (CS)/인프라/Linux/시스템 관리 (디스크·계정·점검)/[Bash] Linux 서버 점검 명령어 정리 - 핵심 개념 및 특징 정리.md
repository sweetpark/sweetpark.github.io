---
title: "Linux 서버 점검 명령어 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 3일 오전 9:58
modified: 2026-09-05
---

# Linux 서버 점검 명령어 정리 (운영/장애대응용)

> [!NOTE]
> 리눅스 서버 운영·장애 대응용 점검 명령어 모음. H/W 로그, 시스템·OS 정보, 운영 상태, 시간/스케줄, 디스크, 네트워크, 패킷 캡처까지.

## 📌 개념

각 점검의 목적:

- **H/W 로그**(dmesg, messages, secure): 디스크 오류·하드웨어 에러·보안 실패 로그인 확인
- **시스템 정보**(cpuinfo, meminfo, fstab): 서버 스펙·디스크 구성 파악
- **운영 상태**(w, top, ps, free, vmstat): 과부하·좀비 프로세스·메모리 누수 확인
- **시간/스케줄**: 로그 시간 꼬임, 배치 오작동 방지

## 💻 예시

### 1. H/W 상태 (에러 로그)

```bash
dmesg | grep -e fail -e error -e DISK -e MEDIA -e IBM   # 커널 로그
cat /var/log/messages.* | grep -e fail -e error         # 시스템 에러
cat /var/log/secure.* | grep -e fail -e error           # 보안 로그
```

### 2. 시스템 정보

```bash
cat /proc/cpuinfo
cat /proc/meminfo
cat /proc/devices
cat /proc/scsi/scsi
cat /etc/fstab
fdisk -l
```

### 3. S/W (OS) 정보

```bash
uname -a
cat /proc/version
cat /etc/issue
```

### 4. 서버 운영 상태

```bash
w            # uptime + 로그인 사용자
top          # 실시간 프로세스
ps -ef       # 전체 프로세스
ps aux       # 메모리 사용량 기준
free
vmstat
```

### 5. 시간 / 스케줄

```bash
date
date -s "2014-11-11 11:30:00"
hwclock -r
hwclock --localtime --systohc

crontab -l
cat /etc/crontab
```

### 6. 디스크 사용량 & 유지보수

```bash
df -h
du -a
fsck -Ar     # /etc/fstab 기준 전체 파일시스템 점검 (운영 중 서버에서는 주의)
```

### 7. 사용자 & 시스템 관리

```bash
cat /etc/passwd
export LANG=ko_KR.UTF-8    # 언어 설정
skill -kill 사용자명        # 사용자 강제 종료
```

### 8. 서버 종료 / 재부팅

```bash
# 종료
init 0
shutdown -h now

# 재부팅
init 6
shutdown -r now
```

### 9. OS 설치 날짜 확인

```bash
ll --time-style full-iso /root/install.log              # CentOS
ll --time-style full-iso /var/log/installer/syslog      # Ubuntu
```

### 10. 헷갈리는 명령어

```bash
cp -r 디렉터리1 디렉터리2    # 복사
rm -rf 디렉터리              # 삭제 (복구 불가, 주의)
```

### 11. 부팅 시 서비스 자동 실행 (CentOS)

```bash
chkconfig --list
chkconfig --level 2345 서비스명 on
```

### 12. 네트워크 / 로그

```bash
cat /var/log/dns_*.log                  # DNS 로그
cat /var/lib/dhcpd/dhcpd.leases         # DHCP Lease
```

### 13. HDD 마운트 절차

```bash
fdisk /dev/sda            # n(생성) p(확인) w(저장) q(종료)
mkfs -t ext4 /dev/sda1
mount /dev/sda1 /HDD

# 자동 마운트 (/etc/fstab)
# /dev/sda1 /HDD ext4 defaults 0 0
```

### 14. 네트워크 카드 설정

```bash
ethtool eth0
ethtool -s eth0 speed 1000 duplex full autoneg on
mii-tool
```

### 15. 패킷 캡처

```bash
tcpdump -i eth0 -w capture.pcap
# 옵션: -n(DNS 해석 X), -i(인터페이스), -w(파일 저장). Wireshark로 분석 가능
```

### 16. Oracle DB 점검

- DB 프로세스 / 리스너 / 디스크 / 로그 중심 점검 (별도 정리 권장)

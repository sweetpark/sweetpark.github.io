---
title: "🧱 Linux 고급 운영 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:23
modified: 2026-09-05
---

# Linux 고급 운영 정리 (LVM · systemd · 부팅 · 패키지 · 사용자)

> [!NOTE]
> LVM 생성·확장, systemd/target, 종료·부팅·GRUB, root 패스워드 복구, 패키지 관리(RPM/YUM), 사용자 계정 관리를 정리한 리눅스 고급 운영 노트.

## 📌 개념

### LVM 구성 단위

| 약어 | 의미 |
| --- | --- |
| PV | Physical Volume |
| VG | Volume Group |
| LV | Logical Volume |

파일시스템 확장 명령: xfs → `xfs_growfs /마운트포인트`, ext4 → `resize2fs /dev/myvg/lv02`

### systemd target (런레벨)

| Runlevel | Target |
| --- | --- |
| 0 | poweroff.target |
| 1 | rescue.target |
| 3 | multi-user.target |
| 5 | graphical.target |
| 6 | reboot.target |

### init (구버전)

| 명령 | 의미 |
| --- | --- |
| init 0 | 종료 |
| init 3 | CLI |
| init 5 | GUI |
| init 6 | 재부팅 |

### 데몬 / 부트로더

- **데몬**: 백그라운드 서비스. 슈퍼데몬 = UNIX `inetd` / Linux `xinetd`
- **systemd**: PID 1, 모든 프로세스의 조상
- **GRUB**: 멀티부팅 지원, 부팅 시 옵션 수정 가능, root PW 분실 복구 가능

### 부팅 타겟

| Target | 특징 |
| --- | --- |
| emergency | ro, root PW 필요 |
| rescue | rw, root PW 필요 |
| multi-user | CLI |
| graphical | GUI |

### RPM 명령

| 기능 | 명령 |
| --- | --- |
| 설치 | `rpm -ivh` |
| 업그레이드 | `rpm -Uvh` |
| 조회 | `rpm -q` / `rpm -qa` |
| 정보 | `rpm -qi` |
| 파일 | `rpm -ql` |
| 의존성 | `rpm -qR` |
| 삭제 | `rpm -e` |

### 사용자 계정 파일 형식

```text
# /etc/passwd  (UID 0=root, 1000~ 일반 사용자, /sbin/nologin=로그인 불가)
계정:x:UID:GID:설명:HOME:SHELL

# /etc/shadow  ($6$=SHA-512, salt 사용)
ID:암호:최종변경:MIN:MAX:WARN:INACTIVE:EXPIRE

# /etc/group
그룹명:x:GID:사용자목록
```

### useradd 주요 옵션

| 옵션 | 설명 |
| --- | --- |
| -u | UID |
| -g | 주그룹 |
| -G | 보조그룹 |
| -m | 홈 생성 |
| -s | 쉘 |
| -f | inactive |

### 최종 암기 흐름

> PV → VG → LV → FS → mount → systemd → GRUB → user

## 💻 예시

### LVM 생성 흐름

```bash
# PV 생성
pvcreate /dev/sdb
pvscan

# VG 생성
vgcreate vg0 /dev/sdb
vgscan -v

# LV 생성
lvcreate vg0 -L 4G -n lv01
lvcreate vg0 -l 512 -n lv02
lvcreate vg0 -l 100%FREE -n lv03
lvscan

# 포맷 & 마운트
mkfs.xfs /dev/vg0/lv03
mount /dev/vg0/lv03 /data
```

### LVM 해제 (순서 중요)

```bash
umount /data
lvremove /dev/vg0/lv01
vgremove vg0
pvremove /dev/sdb1
```

### LVM 확장

```bash
vgextend myvg /dev/sdb3           # VG 확장
lvextend -L 5G /dev/myvg/lv01     # LV 확장
# 이후 파일시스템 확장 필수 (xfs_growfs / resize2fs)
```

### systemd / target

```bash
systemctl status 서비스 -l
systemctl start/stop/restart 서비스
systemctl mask 서비스
systemctl unmask 서비스
systemctl -a

who -r
systemctl get-default
systemctl set-default multi-user.target
systemctl isolate rescue.target
```

### 종료 명령

```bash
reboot
poweroff
halt
shutdown -h now
shutdown -r +3
shutdown -k +2 "메세지"
shutdown -c
pstree
```

### 부팅 타겟 / root 패스워드 복구

```bash
# emergency 진입: GRUB → e → systemd.unit=emergency.target → 실행

# root PW 분실 복구: GRUB → e → rd.break → Ctrl+X
mount -o remount,rw /sysroot
chroot /sysroot
passwd
touch /.autorelabel
reboot
```

### 패키지 관리

```bash
# 소스 컴파일
gcc
make

whereis 패키지명

# YUM / DNF
yum repolist
yum list
dnf install 패키지
```

### 사용자 계정 생성 / 삭제

```bash
useradd user01
passwd user01

userdel -r user01

# UID 기준 파일 삭제
find / -user 2001 -exec rm -r {} \;
```

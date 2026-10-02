---
title: "💽 Linux 디스크 & 파일시스템 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:21
modified: 2026-09-05
---

# Linux 디스크 & 파일시스템 정리

> [!NOTE]
> 디스크 구조·파티션(MBR/GPT)·인터페이스, fdisk 파티셔닝, inode, 포맷·마운트, /etc/fstab, Swap, LVM까지 리눅스 디스크·파일시스템 정리.

## 📌 개념

### 디스크 구조

```text
디스크
 └ 파티션
    └ 실린더
       └ 트랙
          └ 섹터
```

- **섹터**: 최소 저장 단위
- **블록**: 파일시스템 최소 단위 (기본 4KB)

### 디스크 사용 전체 흐름 (순서 고정)

1. 물리적으로 디스크 추가
2. 디스크 인식
3. 파티셔닝
4. 파일시스템 초기화 (포맷)
5. 마운트 (mount)

### 파티션 방식

**MBR 파티션** (BIOS 기반)

- 디스크 0번 섹터 = MBR(Master Boot Record), 파티션 정보 저장
- Primary 파티션 최대 4개, 최대 디스크 크기 2TB

| 종류 | 설명 |
| --- | --- |
| Primary | OS 설치 가능 |
| Extended | Logical 정보만 담는 컨테이너 |
| Logical | 데이터 저장 전용 |

**GPT 파티션** (EFI/UEFI 기반): 최대 128개 파티션, 최대 8ZB, Primary/Extended/Logical 구분 없음

### 디스크 연결 인터페이스

| 방식 | 특징 |
| --- | --- |
| E-IDE | 구형 PC, 핫플러그 X |
| SATA | 핫플러그 O, 1포트=1디스크 |
| SCSI | 서버용, 장치 자체 제어 |
| SAS | SCSI 개선판, SATA 호환 |

### inode

- 파일 메타정보 저장(데이터 위치·권한·크기 O, 파일명 X)

### mount 옵션

| 옵션 | 의미 |
| --- | --- |
| rw / ro | 읽기·쓰기 / 읽기 |
| sync / async | 동기 / 비동기 |
| exec | 실행 허용 |
| suid | setuid 허용 |
| dev | 장치파일 인식 |
| auto | 부팅 시 자동 |

### /etc/fstab

```text
장치명  마운트포인트  FS종류  옵션  dump  fsck
```

> [!WARNING]
> 반드시 TAB 간격으로 작성하며, 잘못 설정하면 부팅 불가.

### Swap (가상 메모리)

- 디스크 일부를 메모리처럼 사용. 실제 RAM + SWAP = 가상 메모리
- 권장 크기: 물리 메모리의 약 2배
- 메모리 기본: RAM(빠름, 휘발성) vs 디스크(느림, 비휘발성). 페이징(page-in / page-out)

### LVM

- 여러 디스크를 하나처럼 사용, 용량 확장에 유리. 생성 순서: PV → VG → LV

### 한 줄 요약 (암기용)

> 디스크 추가 → 파티션 → 포맷 → 마운트 → fstab → (필요 시 Swap/LVM)

## 💻 예시

### 파티션 생성 (fdisk)

```bash
fdisk /dev/sdX
```

fdisk 주요 명령: `m`(도움말) `p`(목록) `n`(생성) `d`(삭제) `w`(저장 후 종료) `q`(저장 없이 종료). 1~4번 = Primary, 5번 이후 = Logical(Extended 필요).

Windows 디스크 관리: 실행 → `diskmgmt.msc`

### 포맷 & 마운트

```bash
mkfs -t ext4 /dev/sdb1
mkfs.ext4 /dev/sdb1        # 기본 블록 크기 4KB

mount /dev/sdb1 /data      # 마운트 포인트에 연결
mount -t iso9660 -o ro /dev/cdrom /cdrom   # CD-ROM (iso9660, 읽기 전용)
```

### 디스크 정보 확인

```bash
lsblk        # name / size / type / mountpoint
lsblk -f     # 파일시스템 종류, UUID
ls -i        # inode 번호
df -Th
du -sh *
```

### Swap 실습

```bash
free -h
swapon -s

mkswap /dev/sdb1
swapon /dev/sdb1

# 자동 활성화 (/etc/fstab)
# /swap-file   swap   swap   defaults   0 0

# 파티션 타입 변경
fdisk /dev/sdb   # t
```

### LVM 생성

```bash
pvcreate /dev/sdb
vgcreate vg01 /dev/sdb
lvcreate -n lv01 -L 10G vg01
```

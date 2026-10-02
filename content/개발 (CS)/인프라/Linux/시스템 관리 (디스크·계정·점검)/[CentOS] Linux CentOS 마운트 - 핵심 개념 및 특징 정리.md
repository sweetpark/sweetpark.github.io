---
title: "Linux CentOS 마운트"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 3일 오전 10:32
modified: 2026-09-05
---

# Linux CentOS 마운트

> [!NOTE]
> CentOS에서 새 디스크를 인식·파티션하고 LVM(PV→VG→LV) 구성 후 포맷·마운트하고 fstab에 등록하는 절차 정리.

## 📌 개념

### 전체 흐름 요약

```text
fdisk -l
→ fdisk /dev/sdb
→ pvcreate /dev/sdb1
→ vgcreate datavg /dev/sdb1
→ lvcreate
→ mkfs.ext4
→ mount
→ /etc/fstab
→ df -h
```

### 실무 주의사항

- `fdisk` 작업 전 디스크명 반드시 재확인
- `w` 저장 전 파티션 정보 검토
- `/etc/fstab` 오타 시 부팅 불가 위험
- 운영 서버는 변경 후 재부팅 테스트 필수

## 💻 예시

### 1. 디스크 연결 확인

```bash
fdisk -l    # 새로 추가된 디스크(/dev/sdb 등), 기존 파티션·용량 확인
```

### 2. 파티션 생성 (fdisk)

```bash
fdisk /dev/sdb
```

fdisk 주요 옵션:

- `m`: 도움말
- `n`: 새 파티션 생성 / `p`: Primary 파티션
- Sector / I/O size: default 값 사용(Enter)
- `t`: 파티션 타입 변경, `L`: 헥사코드 목록(`8e` = Linux LVM)
- `w`: 저장 및 종료 → 이후 `fdisk -l`로 결과 확인

### 3. LVM 구성

```bash
# Physical Volume
pvs
pvcreate /dev/sdb1

# Volume Group
vgs
vgcreate datavg /dev/sdb1

# Logical Volume
lvs
lvcreate -n datalv -l 100%FREE datavg
lvdisplay
```

### 4. 파일 시스템 생성 (포맷)

```bash
mkfs.ext4 /dev/datavg/datalv   # LVM 위에 ext4 생성
```

### 5. 마운트

```bash
mkdir /data
mount /dev/datavg/datalv /data
```

### 6. 부팅 시 자동 마운트 (/etc/fstab)

```bash
vi /etc/fstab
# /dev/datavg/datalv   /data   ext4   defaults   0 0
```

> [!TIP]
> 운영 환경에서는 장치명 대신 UUID 사용을 권장한다. `blkid`로 UUID 확인.

### 7. 최종 확인

```bash
df -h    # /data 마운트 여부, 용량 정상 표시 확인
```

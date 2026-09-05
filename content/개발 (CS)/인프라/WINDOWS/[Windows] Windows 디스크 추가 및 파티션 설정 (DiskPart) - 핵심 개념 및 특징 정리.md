---
title: "Windows 디스크 추가 및 파티션 설정 (DiskPart)"
tags: [학습, 개발-CS, 인프라, WINDOWS, 개발]
modified: 2026-09-05
---

# Windows 디스크 추가 및 파티션 설정 (DiskPart)

> [!NOTE]
> Windows에서 `diskpart` CLI로 새 디스크를 인식·분할하고 볼륨을 생성·포맷하는 절차 정리.

## 📌 개념

> [!WARNING]
> - **관리자 권한 CMD 필수**
> - 디스크 번호(`disk 2` 등)를 **절대 헷갈리면 안 됨** — 잘못 선택하면 데이터 손실
> - 기존 데이터가 있는 디스크는 **사전 백업 필수**

### 전체 작업 흐름 요약

```text
diskpart
→ list disk
→ select disk
→ list partition
→ select partition
→ shrink
→ create partition
→ list volume
→ select volume
→ format
→ assign
→ exit
```

### 실무 팁

- `shrink` 실패 시 → 조각 모음 또는 이동 불가 파일(Pagefile 등) 확인
- 서버 환경에서는 GUI(디스크 관리)보다 `diskpart`가 더 안정적인 경우가 많음
- 드라이브 문자는 자동 할당되지만, 필요 시 `assign letter=E` 형태로 지정 가능

## 💻 예시

### 1. DiskPart 실행 및 디스크 확인

```text
diskpart
list disk          :: 현재 디스크 목록 (새 디스크 번호 확인, 예: Disk 2)
```

### 2. 디스크 선택 및 파티션 분할

```text
select disk 2          :: 작업할 디스크 선택
list partition         :: 기존 파티션 확인
select partition 1     :: 분할 대상 파티션 선택
shrink desired=30000   :: 볼륨 축소, 단위 MB (예: 30GB 확보)
create partition primary   :: 남은 공간에 새 파티션 생성
list partition             :: 파티션 생성 확인
```

### 3. 볼륨 생성 및 포맷

```text
list volume                          :: 볼륨 목록 확인
select volume 6                      :: 새로 생성된 볼륨 선택
format fs=ntfs quick label=ex_hdd_pt :: NTFS 빠른 포맷 + 라벨 지정
assign                               :: 드라이브 문자 할당
list volume                          :: 볼륨 최종 확인
```

### 4. DiskPart 종료

```text
exit
```

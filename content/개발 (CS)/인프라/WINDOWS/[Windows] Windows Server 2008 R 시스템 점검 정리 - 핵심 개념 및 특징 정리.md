---
title: "Windows Server 2008 R 시스템 점검 정리"
tags: [학습, 개발-CS, 인프라, WINDOWS, 개발]
modified: 2026-09-05
---

# Windows Server 2008 R 시스템 점검 정리

> [!NOTE]
> Windows Server 2008 R2 서버 점검용 명령어 모음. 시스템 정보·네트워크·디스크·자산 사양을 CMD / WMIC / PowerShell로 확인하는 방법을 정리한다.

## 📌 개념

용도별로 점검 도구를 나누어 사용한다.

- **장애 대응용** → `systeminfo` / `netstat` / 이벤트 로그
- **자산·사양 확인용** → `wmic` + PowerShell
- **용량 이슈** → `logicaldisk` + `fsutil`

## 💻 예시

### 1. 시스템 기본 정보 확인

- **시스템 정보 요약**

```bat
msinfo32.exe
```

- **시스템 정보 + Uptime**

```bat
systeminfo
```

- **서비스 확인**

```bat
services.msc
```

- **CPU / Memory 상세**: 작업관리자 → 성능 → 리소스 모니터
- **이벤트 로그**: 컴퓨터 관리 → 이벤트 뷰어 → Windows 로그 (응용 프로그램 / 보안 / 시스템)
- **디스크 구성**: 컴퓨터 관리 → 저장소 → 디스크 관리

### 2. 네트워크 상태 확인

```bat
netstat -na                          :: 전체 TCP/UDP 포트
netstat -na | findstr LISTENING      :: LISTEN 중인 TCP 포트
netstat -na -p udp | findstr *.*     :: LISTEN 중인 UDP 포트
netstat -nao                         :: 포트 + PID 확인
```

### 3. 트랜잭션 로그 용량 확인 (Exchange)

- `C:` → **First Storage Group** 위치 및 용량 확인

### 4. 실행창 주요 명령어

```bat
winsat cpu -encryption   :: CPU 성능
winsat mem               :: 메모리 성능
notepad                  :: 메모장
calc                     :: 계산기
mspaint                  :: 그림판
msconfig                 :: 시작프로그램 / 부팅 설정
```

### 5. WMIC (시스템 상세 정보)

```bat
:: 운영체제
wmic OS get Caption,CSDVersion,OSArchitecture,Version

:: BIOS
wmic BIOS get Manufacturer,Name,SMBIOSBIOSVersion,Version
wmic bios get serialnumber,BIOSVersion,ReleaseDate,Name

:: CPU
wmic CPU get Name,NumberOfCores,NumberOfLogicalProcessors
wmic cpu get AddressWidth,CurrentClockSpeed,MaxClockSpeed,L2CacheSize,ProcessorId,Status,Name
wmic path win32_processor get Description,DeviceID,L2CacheSize,L3CacheSize,NumberOfCores,NumberOfLogicalProcessors,ProcessorId,Name

:: 메모리 (최대 설치 가능 / 슬롯 상세)
wmic MEMPHYSICAL get MaxCapacity
wmic MEMORYCHIP get BankLabel,DeviceLocator,MemoryType,Capacity,Speed,Manufacturer,PartNumber,SerialNumber
```

### 6. 네트워크 / 사용자

```bat
:: 네트워크 카드
wmic NIC get Description,MACAddress,NetEnabled,Speed

:: 사용자 계정
wmic USERACCOUNT get Caption,Name,PasswordRequired,Status
```

### 7. 디스크 / 스토리지

```bat
:: 물리 디스크
wmic DISKDRIVE get InterfaceType,Name,Size,Status
wmic diskdrive get DeviceID,Model,Size,SerialNumber,Partitions,Status

:: 디스크 시리얼
wmic path win32_physicalmedia get SerialNumber

:: 논리 디스크
wmic logicaldisk get Name,DeviceID,FileSystem,Size,FreeSpace,Description
```

### 8. PowerShell 디스크 용량 확인

```powershell
# 물리 디스크 (GB)
Get-WmiObject Win32_DiskDrive |
FT DeviceID,@{E={"{0:N1} GB" -F($_.Size/1GB)}} -H -A

# 물리 디스크 (GiB)
Get-WmiObject Win32_DiskDrive |
FT DeviceID,@{E={"{0:N1} GiB" -F($_.Size/1000000000)}} -H -A

# 논리 디스크
Get-WmiObject Win32_LogicalDisk -Filter DriveType=3 |
FT DeviceID,@{E={"{0:N1} GB" -F($_.Size/1GB)}} -H -A
```

### 9. 디스크 여유 공간 (fsutil)

```bat
fsutil volume diskfree C:
fsutil volume diskfree D:
fsutil volume diskfree E:
```

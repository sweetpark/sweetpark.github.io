---
title: "AIX mksysb(OS 백업) 작업 절차 정리"
tags: [학습, 개발-CS, 인프라, 인프라-기초-지식, 개발, 인프라기초]
modified: 2026-09-05
---

# AIX mksysb(OS 백업) 작업 절차 정리

> [!NOTE]
> AIX에서 `mksysb`로 OS(rootvg) 백업을 수행하는 절차. 사전 환경 점검 → 백업 디바이스(USB) 초기화 → SMIT mksysb 실행 순서로 정리.

## 📌 개념

### 전체 작업 흐름 요약

```text
locale / LANG
→ bootlist
→ sync
→ lsvg / df
→ errpt
→ 시간 확인
→ USB 인식 확인
→ mkfs (초기화)
→ smitty mksysb
→ 백업 완료
```

### 실무 주의사항

- `errpt`에 치명적 오류가 있으면 백업 중단
- `/etc` 변경 직후라면 `sync` 필수
- `/tmp` 용량 부족 시 백업 실패 가능
- USB 디바이스명 오타 = 데이터 손실 위험
- 백업 완료 후 복구 테스트 가능 여부 확인 권장

## 💻 예시

### 1. 사전 환경 점검

```bash
locale                  # 현재 언어 설정 확인 (예: en_US)
LANG=en_US              # 언어 변경 (필요 시)

bootlist -m normal -o   # 부팅 디스크 위치 / rootvg 미러링 여부 점검
sync                    # 디스크 버퍼를 실제 디스크에 기록

lsvg -l rootvg          # rootvg에 포함된 Logical Volume 확인
lsvg -o | lsvg -il      # 온라인 VG 목록 / rootvg 활성 상태 확인
df -g                   # 디스크 사용량, 백업 대상 용량 사전 점검
errpt                   # 하드웨어/시스템 오류 여부 확인
lsvg -o | lsvg -ip      # rootvg의 active disk 확인

echo $TZ                # 타임존 확인
date                    # 현재 시간 확인 (백업 시점 기록)
```

### 2. 백업 디바이스(USB) 확인 및 초기화

```bash
lsdev -C | grep usb                    # USB 장치 인식 확인 (예: /dev/usbms0)
mkfs -V jfs2 -o ea=v2 /dev/usbms0      # jfs2 파일시스템 생성, 확장속성 ea=v2
# 초기화 중 yes 입력 → 포맷 완료
```

> [!WARNING]
> 초기화 시 기존 데이터가 전부 삭제된다. 디바이스명을 반드시 재확인할 것.

### 3. mksysb 백업 수행 (SMIT)

```bash
smitty mksysb
```

옵션 설정:

1. **Backup DEVICE or FILE**: `Esc + 4` → `/dev/usbms0` 선택
2. **Expand /tmp if needed?**: `yes`
3. **Disable software packing or backup?**: `yes`
4. 설정 확인 후 **Enter**

### 4. 백업 완료

- 백업 진행 상황 모니터링
- 완료 메시지 확인, 필요 시 백업 로그 확인

## 📎 기타

이 문서는 그대로 AIX OS 백업 운영 매뉴얼 / 인수인계 문서 / 정기 백업 체크리스트로 활용 가능하다.

---
title: "Windows 점검 순서"
tags: [학습, 개발-CS, 인프라, WINDOWS, 개발]
modified: 2026-09-05
---

# Windows 점검 순서

> [!NOTE]
> Windows 서버 정기 점검 시 확인 순서(리소스 → 네트워크 → 로그 → 디스크 → OS → 시리얼)를 단계별로 정리.

## 📌 개념

점검은 아래 순서로 진행한다.

1. **장치 인식 확인 및 사용률 점검**
    - 작업관리자(실행 → `taskmgr`)
        - MEM 사용률 / CPU 사용률
        - 프로세스: 총 기동 개수 + 주 사용 프로세스
    - 작동시간(uptime): cmd → `systeminfo`
2. **네트워크 상태**(listening, established)
    - cmd → `netstat -nao`
3. **로그 확인**
    - 이벤트 뷰어(시스템), 명령어 `eventvwr`
4. **디스크 사용률** → 파일 탐색기
5. **OS 확인**
    - 실행 → `dxdiag` 또는 `msinfo32`
    - 운영체제 종류, 시스템 제조업체, 장비 모델명, BIOS, 프로세서와 메모리
6. **시리얼 넘버 확인**
    - cmd → `wmic bios get SerialNumber`

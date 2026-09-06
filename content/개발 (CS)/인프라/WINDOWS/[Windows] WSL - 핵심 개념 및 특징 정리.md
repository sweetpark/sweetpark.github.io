---
title: "WSL"
tags: [학습, 개발-CS, 인프라, WSL]
modified: 2026-09-05
---

# WSL

> [!NOTE]
> Windows에서 WSL(Windows Subsystem for Linux) 설치 및 Ubuntu 실행 절차.

WSL은 별도의 가상머신(VirtualBox/VMware)이나 듀얼 부팅 없이, Windows 안에서 리눅스 커널 호환 계층을 통해 리눅스 배포판을 바로 실행하는 기능이다. 전체 VM처럼 CPU/메모리를 고정 할당하지 않고 파일시스템도 Windows와 상호 접근이 가능해 가볍고, 개발 환경에서 리눅스 전용 도구(bash 스크립트, 리눅스 패키지 등)를 Windows를 벗어나지 않고 쓰고 싶을 때 실무적으로 많이 쓰인다.

> [!CAUTION]
> 계정 정보 — ID: `wooyeong` / PW: `***MASKED***` (테스트 계정 비밀번호, 보안상 마스킹 — 복원 금지)

## 🖥️ 시스템/환경
- 대상: Windows PowerShell(관리자), WSL 2, Microsoft Store(Ubuntu)

## 📋 작업 내역

### 설치방법
1. PowerShell 관리자 실행
    - `dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart`
    - `dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart`
2. 재부팅
3. PowerShell 관리자 실행
    - `wsl --set-default-version 2`
4. 패키지 다운로드
    - 참고: [이전 버전 WSL의 수동 설치 단계](https://learn.microsoft.com/ko-kr/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package)
5. Microsoft Store에서 ubuntu 설치
6. Ubuntu 실행(시작에서 ubuntu 검색)

- 참고: [WSL로 윈도우에 리눅스 설치하기](https://www.yalco.kr/_01_install_wsl/)

## 📌 비고
- 없음.

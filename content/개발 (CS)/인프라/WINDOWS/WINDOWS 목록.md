---
title: "WINDOWS 목차"
tags: [학습, 목차]
created: 2026-10-16
modified: 2026-10-16
---

**위치**: [학습](학습%20목록.md) › [개발 (CS)](개발%20%28CS%29/개발%20%28CS%29%20목록.md) › [인프라](개발%20%28CS%29/인프라/인프라%20목록.md) › WINDOWS  
**규모**: 포스팅 7개

## 개발 환경

> WSL, Rust 툴체인, Win32 스레드 API 등 Windows 개발 환경.

| 포스팅 | 설명 |
|---|---|
| [WSL](개발%20%28CS%29/인프라/WINDOWS/[Windows]%20WSL%20-%20핵심%20개념%20및%20특징%20정리.md) | Windows에서 WSL(Windows Subsystem for Linux) 설치 및 Ubuntu 실행 절차. |
| [Rust 툴체인 설치와 MSVC 링커 트러블슈팅](개발%20%28CS%29/인프라/WINDOWS/[Windows]%20Rust%20툴체인%20설치와%20MSVC%20링커%20트러블슈팅%20-%20핵심%20개념%20및%20특징%20정리.md) | Rust 프로젝트(cargo build)를 Windows/macOS에서 빌드하기 위한 툴체인 설치 절차와, Windows에서 가장 흔히 겪는 "MSVC C++ 워크로드 누락으로 인한 링커 실패… |
| [Win32 멀티스레드 API (_beginthreadex)](개발%20%28CS%29/인프라/WINDOWS/[Windows]%20Win32%20멀티스레드%20API%20%28_beginthreadex%29%20-%20Win32%20멀티스레드%20API%20%28beginthreadex%29.md) | Windows 환경에서 C로 멀티스레드를 구현할 때 쓰는 _beginthreadex와 관련 Win32 자료형 정리. "PortScan" 미니프로젝트에서 추출. |
| [Windows 단축키](개발%20%28CS%29/인프라/WINDOWS/[Windows]%20Windows%20단축키%20-%20핵심%20개념%20및%20특징%20정리.md) | Windows 키보드 단축키와 실행창 명령어(MSC 콘솔, 제어판 CPL, 실행 명령어) 레퍼런스 모음. |

## 서버 점검·디스크

> Windows Server 점검 순서와 디스크·파티션 설정.

| 포스팅 | 설명 |
|---|---|
| [Windows 점검 순서](개발%20%28CS%29/인프라/WINDOWS/[Windows]%20Windows%20점검%20순서%20-%20핵심%20개념%20및%20특징%20정리.md) | Windows 서버 정기 점검 시 확인 순서(리소스 → 네트워크 → 로그 → 디스크 → OS → 시리얼)를 단계별로 정리. |
| [Windows Server 2008 R 시스템 점검 정리](개발%20%28CS%29/인프라/WINDOWS/[Windows]%20Windows%20Server%202008%20R%20시스템%20점검%20정리%20-%20핵심%20개념%20및%20특징%20정리.md) | Windows Server 2008 R2 서버 점검용 명령어 모음. |
| [Windows 디스크 추가 및 파티션 설정 (DiskPart)](개발%20%28CS%29/인프라/WINDOWS/[Windows]%20Windows%20디스크%20추가%20및%20파티션%20설정%20%28DiskPart%29%20-%20핵심%20개념%20및%20특징%20정리.md) | Windows에서 diskpart CLI로 새 디스크를 인식·분할하고 볼륨을 생성·포맷하는 절차 정리. |

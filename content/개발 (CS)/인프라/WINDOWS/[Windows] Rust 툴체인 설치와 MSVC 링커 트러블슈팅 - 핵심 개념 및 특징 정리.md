---
title: "Rust 툴체인 설치와 MSVC 링커 트러블슈팅"
tags: [학습, 개발-CS, 인프라, Rust, Windows, MSVC]
modified: 2026-09-05
---

# Rust 툴체인 설치와 MSVC 링커 트러블슈팅

> [!NOTE]
> Rust 프로젝트(cargo build)를 Windows/macOS에서 빌드하기 위한 툴체인 설치 절차와, Windows에서 가장 흔히 겪는 "MSVC C++ 워크로드 누락으로 인한 링커 실패"의 진단·해결 방법. OSSCA GlueSQL 오픈소스 멘티 활동 중 겪은 환경 세팅 트러블슈팅에서 추출.

## ⚙️ 개념 — 무엇을 설치해야 하는가

Rust 프로젝트를 빌드하려면 **두 가지**가 모두 필요하다. 둘 다 있어야 `cargo build`가 끝까지 성공한다.

| 구성요소 | 역할 | 비고 |
|---|---|---|
| **Rust 툴체인** (rustc, cargo, rustup) | 컴파일러 + 패키지/빌드 매니저 | rustup으로 설치 |
| **MSVC C++ Build Tools** (link.exe) — Windows | Windows용 링커 | Rust가 최종 실행파일을 만들 때 필수 |
| **Xcode Command Line Tools** (clang, ld) — macOS | C 컴파일러 + 링커 | Windows의 MSVC에 대응 |

> [!WARNING]
> Windows에서 가장 흔한 실패: Rust만 깔고 MSVC 빌드 도구가 없어서 `link.exe not found` 에러가 난다. 아래 순서를 **모두** 따라야 한다.

## ⚙️ Windows 설치 절차

### 1단계 — MSVC C++ Build Tools 설치

**방법 A) winget (권장)**
```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e
```
설치 후 **"Visual Studio Installer"** 실행 → BuildTools 수정(Modify) → **"C++를 사용한 데스크톱 개발"** 워크로드 체크 → 설치.

> [!WARNING]
> 여기서 워크로드 체크를 빼먹는 게 1순위 실수다. BuildTools만 깔고 이 워크로드를 안 고르면 링커(`link.exe`)가 안 깔려서 나중에 `cargo build`가 기초 크레이트부터 줄줄이 실패한다.

**방법 B) 직접 다운로드**: https://visualstudio.microsoft.com/visual-cpp-build-tools/ 에서 "Build Tools for Visual Studio 2022" 다운로드 후 동일하게 C++ 워크로드 선택. 이미 Visual Studio에 C++ 워크로드가 설치돼 있으면 생략 가능.

### 2단계 — Rust 설치 (rustup)

```powershell
winget install --id Rustlang.Rustup -e
```
또는 https://rustup.rs 접속 → `rustup-init.exe` 실행 → 기본값 선택. 설치 후 **PowerShell 창을 새로 열어야** PATH가 적용된다.

### 3단계 — 설치 확인

```powershell
rustc --version
cargo --version
rustup show          # 활성 toolchain 확인 (stable-x86_64-pc-windows-msvc 여야 함)
```

`...-msvc` toolchain이 기본이 아니라면:
```powershell
rustup default stable-x86_64-pc-windows-msvc
```

### 4단계 — 빌드 & 테스트 (일반적인 Rust 프로젝트 기준)

```powershell
cargo build                          # 첫 빌드는 의존성 컴파일로 수 분 소요 — 정상
cargo clippy --all-targets -- -D warnings   # 코드 품질 검사(기여 시 필수 통과)
cargo fmt --all                      # 포맷 검사/정리
cargo test                           # 테스트
```

## ⚙️ macOS 설치 절차

macOS는 Windows의 MSVC 대신 **Xcode Command Line Tools**가 링커/컴파일러를 제공한다. Apple Silicon과 Intel 모두 동일 절차이며 Rust가 자동으로 아키텍처를 잡는다.

```bash
# 1) Xcode Command Line Tools 설치
xcode-select --install

# 2) Rust 설치 (rustup) — 공식 스크립트
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# 설치 후 PATH 적용
source "$HOME/.cargo/env"

# 3) 설치 확인
rustc --version
cargo --version
rustup show   # Apple Silicon: stable-aarch64-apple-darwin / Intel: stable-x86_64-apple-darwin

# 4) 빌드 & 테스트
cargo build
cargo clippy --all-targets -- -D warnings
cargo fmt --all
cargo test
```

## 🔥 부록 — Windows 빌드 실패 진단/해결 (C++ 워크로드 누락)

`cargo build` 시 아래처럼 build script들이 줄줄이 실패하는 경우:
```
error: could not compile `windows_x86_64_msvc` (build script) due to 1 previous error
error: could not compile `proc-macro2` (build script) due to 1 previous error
error: could not compile `libm` (build script) due to 1 previous error
error: could not compile `serde` (build script) due to 1 previous error
```

**원인**: build script는 그 자체가 작은 실행파일이라 **링커로 링크**돼야 한다. MSVC 링커(`link.exe`)가 없으면 `serde`·`proc-macro2`·`libm` 같은 기초 크레이트가 전부 링크 단계에서 실패한다. 보통 "Build Tools는 설치했지만 C++ 데스크톱 개발 워크로드를 빼먹어" 링커가 없는 상태다.

**진단(PowerShell)**
```powershell
# VS BuildTools는 있는데 MSVC 툴셋(=링커)이 있는지 확인
Get-ChildItem "C:\Program Files (x86)\Microsoft Visual Studio\2022\*\VC\Tools\MSVC" -Directory -ErrorAction SilentlyContinue
# → 결과가 없으면(폴더 없음) C++ 워크로드 미설치가 원인 확정
```

**해결 A) GUI**: 시작 메뉴 → Visual Studio Installer → Build Tools → 수정(Modify) → "C++를 사용한 데스크톱 개발" 체크 → 설치.

**해결 B) 명령어 한 줄**
```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```
`--includeRecommended`가 링커 + 필요한 Windows SDK까지 함께 설치한다.

설치 후 **PowerShell 창을 새로 열고**(Rust가 vswhere로 링커를 다시 탐지해야 함) 재시도.

## 📋 자주 막히는 부분 정리

| 증상 | 원인 / 해결 |
|---|---|
| `error: linker 'link.exe' not found` | MSVC Build Tools 미설치 → 1단계 수행 |
| serde/proc-macro2/libm 등 build script 줄줄이 실패 | ⭐ C++ 데스크톱 워크로드 누락 → 부록 참고 |
| `cargo`/`rustc` 명령 인식 안 됨 | PATH 미적용 → 터미널을 새로 열기 |
| toolchain이 `gnu`로 잡힘 | `rustup default stable-x86_64-pc-windows-msvc` |
| clippy 경고로 빌드 실패 | `-D warnings`라 경고=에러. 메시지 따라 수정 |
| (macOS) `xcrun: error: no developer tools` | Command Line Tools 미설치 → `xcode-select --install` |
| (macOS) `linker 'cc' not found` | Command Line Tools 미설치 |

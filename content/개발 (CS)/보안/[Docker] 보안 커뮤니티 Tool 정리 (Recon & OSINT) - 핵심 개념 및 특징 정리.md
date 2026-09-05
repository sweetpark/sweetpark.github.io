---
title: "🛠️ 보안 커뮤니티 Tool 정리 (Recon & OSINT)"
tags: [학습, 개발-CS, 보안, 개발, OSINT, Recon, CloudSecurity]
modified: 2026-09-05
---

# 🛠️ 보안 커뮤니티 Tool 정리 (Recon & OSINT)

> 목적
> 
> 
> 외부 자산 식별, 정보 수집(OSINT), 취약한 구성 탐색을 위한 커뮤니티 기반 보안 도구 모음
> 

---

## 🔎 1. 포트 / 네트워크 스캐닝

### 1. RustScan

**개요**

- 초고속 포트 스캐너
- 열린 포트를 자동으로 **Nmap으로 파이프 연결**

**특징**

- Rust 기반 고속 스캐닝
- Python / Lua / Shell 지원
- **Adaptive Learning**
    - 스캔 환경을 학습하여 점점 효율 향상
- 대규모 타겟 스캔에 적합

**주 용도**

- 초기 정찰 단계 (열려 있는 포트 식별)

---

## 🌐 2. 도메인 / 자산 정찰 (Recon)

### 2. Amass

**개요**

- 외부 자산 탐색을 위한 **정찰 프레임워크**

**수집 기법**

- 인증서
- DNS
- 라우팅 정보
- 웹 스크래핑
- Web Archive
- WHOIS

**주 용도**

- 기업 도메인 및 서브도메인 열거
- 공격 표면 확장

---

### 3. ASM (Attack Surface Mapping)

**개요**

- 공격 표면 확장용 정찰 도구

**기능**

- 하위 도메인 무차별 대입
- 동일 네트워크 블록 소유 IP 탐색
- 다중 도메인이 가리키는 IP 식별

**주 용도**

- IP / 도메인 기반 추가 타겟 확보

---

### 4. dnscan

**개요**

- Python 기반 DNS 하위 도메인 스캐너

**특징**

- 단어 리스트 기반 브루트포싱
- Name Server 실패 시:
    - TXT / MX 레코드 조회 후 재귀 스캔

**주 용도**

- 숨겨진 하위 도메인 탐색

---

## ☁️ 3. 클라우드 OSINT

### 5. cloud_enum

**개요**

- 멀티 클라우드 OSINT 도구

**지원 클라우드**

- AWS
- Azure
- Google Cloud

**탐색 대상**

- 공개 / 보호된 S3 버킷
- Azure Storage / Blob
- 호스팅 DB
- VM
- Web App
- Firebase / Cloud Functions

**주 용도**

- 클라우드 리소스 노출 여부 확인

---

### 6. S3Scanner

**개요**

- AWS S3 설정 오류 탐지 도구

**특징**

- 멀티 스레드 스캐닝
- Docker 지원
- 모든 버킷 권한 검사

**주 용도**

- 잘못 구성된 S3 퍼미션 탐지

---

## 📧 4. 이메일 / 계정 OSINT

### 7. Buster

**개요**

- 이메일 기반 정보 수집 도구

**수집 소스**

- Gravatar
- MySpace
- Skype
- GitHub
- LinkedIn
- Google / Twitter / DarkSearch
- Paste 사이트

**기능**

- 이메일과 연결된 도메인 탐색
- 소셜 계정 식별
- 사용자 이름 후보 생성

---

### 8. linkedin2username

**개요**

- LinkedIn 기반 OSINT 도구

**기능**

- 회사 소속 직원 이름 수집
- 다양한 사용자 이름 패턴 자동 생성

**결과 예시**

- `first.last.txt` → Joe.Schmoe
- `f.last.txt` → J.Schmoe
- `flast.txt` → JSchmoe
- `first.txt` → Joe
- `rawnames.txt` → Joe Schmoe

**주 용도**

- 계정 추측 공격 전 사전 정보 수집

---

### 9. spoofcheck

**개요**

- 이메일 도메인 스푸핑 가능 여부 검사

**검사 항목**

- SPF
- DMARC

**개념 정리**

- **SPF** : 메일 송신 서버 정의
- **DMARC** : 이메일 스푸핑 방지 정책

**주 용도**

- 피싱 공격 가능성 판단

---

## 🕷️ 5. 웹 / 검색 기반 정찰

### 🔟 pagodo

**개요**

- Google Dork 자동화 도구

**기능**

- 잠재적으로 취약한 웹 페이지 탐색
- HTTP / HTTPS / SOCKS5 지원
- 다중 프록시 지원

**Google Dork란?**

- Google 검색 연산자를 이용한 정보 노출 탐색 기법

---

### 11. SpiderFoot

**개요**

- OSINT 자동화 프레임워크

**특징**

- 100개 이상의 공개 데이터 소스 활용
- IP / 도메인 / 이메일 / 이름 기반 수집

**주 용도**

- 대규모 OSINT 자동 정찰

---

### 12. WitnessMe

**개요**

- Nessus / Nmap XML 결과 분석 도구

**특징**

- 대용량 XML 파싱
- Docker 호환
- RESTful API 제공
- CLI 기반 결과 검색

**주 용도**

- 스캔 결과 후처리 & 분석

---

## 🔗 6. LinkedIn 데이터 수집

### 13. LinkedInt

**개요**

- LinkedIn 프로필 데이터 수집 도구

**특징**

- 네트워크 연결 관계 강조
- 프로필 정보 출력

**주 용도**

- 조직 구조 파악
- 타겟 프로파일링

---

## 📌 노션 정리 팁 (강추)

### 📂 추천 구조

```
🛠️ Security Tools
 ├─ 🔎 Recon / OSINT
 ├─ ☁️ Cloud
 ├─ 📧 Email / Identity
 ├─ 🌐 Network
 └─ 🕷️ Web

```

### 🏷️ 태그 예시

```
#OSINT
#Recon
#CloudSecurity
#EmailSecurity
#RedTeam
#CommunityTool

```

---

## 🧠 한 줄 요약 (노션 상단용)

> 외부 자산 식별과 공격 표면 확장을 위해커뮤니티에서 활용되는 정찰·OSINT 도구 모음이다.
> 

---

원하면 다음도 바로 가능 👇

- 🔹 **Kill Chain 단계별 Tool 매핑**
- 🔹 **이 툴들을 하나의 Recon 파이프라인으로 정리**
- 🔹 **CTF / 모의침투 프로젝트용 Tool Flow**
- 🔹 **Blue Team 관점 대응 포인트 정리**

다음 정리 뭐로 갈지 골라줘 🔥

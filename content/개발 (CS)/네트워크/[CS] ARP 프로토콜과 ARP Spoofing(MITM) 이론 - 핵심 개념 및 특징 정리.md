---
title: "ARP 프로토콜과 ARP Spoofing(MITM) 이론"
tags: [학습, 개발-CS, 네트워크, 보안, ARP, MITM]
modified: 2026-09-05
---

# ARP 프로토콜과 ARP Spoofing(MITM) 이론

> [!NOTE]
> ARP 프로토콜의 동작 원리, ARP Spoofing으로 MITM(중간자 공격)이 성립하는 과정, 그리고 탐지/방어 기법 정리. "ARP Spoofing" 미니프로젝트에서 이론 부분(약 90%)만 추출했다. libpcap 함수 레퍼런스는 [(TCP_IP) libpcap 함수 - 핵심 개념 및 특징 정리]([TCP_IP]%20libpcap%20함수%20-%20핵심%20개념%20및%20특징%20정리.md) 참고, 실제 구현 C 소스코드는 원본 프로젝트 노트에 그대로 남아 있다.

## ⚙️ 1. ARP 기본 개념

**ARP(Address Resolution Protocol)란?**
- **IP 주소 → MAC 주소**를 매핑하기 위한 2계층 프로토콜
- 같은 네트워크(LAN) 내에서만 동작
- **인증 절차가 없음** → 신뢰 기반 프로토콜

**ARP 동작 흐름 (정상)**
1. 호스트가 목적지 IP의 MAC을 모를 경우
2. **ARP Request (Broadcast)** 전송
3. 해당 IP를 가진 장비가 **ARP Reply (Unicast)** 응답
4. 응답 정보를 **ARP Cache**에 저장

핵심 포인트: "누가 응답하든" 신뢰하며, 이전 응답을 덮어쓸 수 있다.

## ⚙️ 2. ARP Spoofing 개념 (이론)

**ARP Spoofing이란?** 공격자가 위조된 ARP Reply를 지속적으로 전송하여 피해자와 게이트웨이의 ARP Cache를 오염시키는 공격.

**결과**
- 피해자 ↔ 게이트웨이 트래픽이 **공격자를 경유**
- **MITM(Man-In-The-Middle)** 성립
- 패킷 도청 / 변조 가능

**전형적인 구조**
```
Victim  <——>  Attacker  <——>  Gateway
```

## ⚙️ 3. ARP 패킷 구조 (2계층, 총 42Bytes)

**Ethernet Header (14 Bytes)**

| 필드 | 설명 |
| --- | --- |
| Destination MAC | 목적지 MAC |
| Source MAC | 출발지 MAC |
| EtherType | 0x0806 (ARP) |

**ARP Header (28 Bytes)**

| 필드 | 설명 |
| --- | --- |
| Hardware Type | Ethernet (1) |
| Protocol Type | IPv4 (0x0800) |
| Hardware Size | MAC 길이 (6) |
| Protocol Size | IP 길이 (4) |
| Opcode | Request(1) / Reply(2) |
| Sender MAC/IP | 송신자 정보 |
| Target MAC/IP | 대상 정보 |

## ⚙️ 4. libpcap 개요 (보안 분석 도구 관점)

libpcap은 네트워크 패킷을 캡처·분석·주입하기 위한 라이브러리다.

**핵심 역할**: 네트워크 인터페이스로부터 패킷 수집 → 필터(BPF)로 특정 트래픽 선별 → 패킷 재전송(분석/테스트 목적).

**주요 구조체 `pcap_t`**: 패킷 캡처 핸들. 네트워크 장치와 캡처 세션을 관리.

**주요 함수 개념(용도 중심)** — 세부 시그니처/예제는 [(TCP_IP) libpcap 함수 - 핵심 개념 및 특징 정리]([TCP_IP]%20libpcap%20함수%20-%20핵심%20개념%20및%20특징%20정리.md) 참고

| 함수 | 역할 |
| --- | --- |
| pcap_open_live | 네트워크 장치 열기 |
| pcap_compile | BPF 필터 컴파일 |
| pcap_setfilter | 필터 적용 |
| pcap_loop | 패킷 캡처 루프 |
| pcap_sendpacket | 패킷 전송 |

BPF(Berkeley Packet Filter)는 커널 레벨에서 패킷 필터링을 수행한다.

## ⚙️ 5. 공격 원리 (구현 목적 설명, 재현 절차 아님)

**전체 구조 개요**
```
[초기화]
 ├─ 네트워크 디바이스 선택
 ├─ libpcap 핸들 생성
 ├─ 필터 설정

[동작]
 ├─ ARP 위조 패킷 주기적 전송 (스레드)
 ├─ 트래픽 캡처
 ├─ MAC 주소 변경 후 재전송 (MITM)
```

**핵심 포인트**
- **멀티 스레드**: ARP 패킷을 지속적으로 보내기 위함
- **Callback 함수**: 캡처된 패킷을 가로채 MAC 주소만 수정, 상위 계층(IP/TCP/UDP)은 변경하지 않음
- **MITM 유지 조건**: ARP Cache는 시간이 지나면 만료되므로, 위조 ARP Reply를 **지속적으로 전송**해야 유지된다

## ⚙️ 6. 왜 가능한가? (보안 관점)

| 원인 | 설명 |
| --- | --- |
| ARP 무인증 | 응답 검증 없음 |
| Cache 덮어쓰기 | 기존 MAC 정보 무효화 |
| L2 신뢰 구조 | 스위치 단에서 탐지 어려움 |

## ⚙️ 7. 탐지 및 방어 방법

**네트워크 레벨**
- Dynamic ARP Inspection (DAI)
- ARP 패킷 Rate 제한
- Static ARP Table (중요 서버)

**시스템 레벨**
- ARP Cache 변화 모니터링
- 동일 IP → MAC 변경 탐지

**보안 장비**
- IDS / IPS (ARP anomaly detection)
- L2 보안 스위치 설정

## 🔁 핵심 요약

- ARP는 신뢰 기반 프로토콜이며 인증이 없어 MITM 공격에 취약하다.
- ARP Spoofing은 L2 공격이며, 방어는 네트워크 장비 설정이 핵심이다.
- 보안의 핵심은 "차단"이 아니라 "탐지 + 가시성"이다.

## 관련 문서

- [(프로젝트) ARP Spoofing 구현 - MITM 공격 이해와 C 구현](../../프로젝트/보안/[프로젝트]%20ARP%20Spoofing%20구현%20-%20MITM%20공격%20이해와%20C%20구현.md) — 이 이론 노트가 추출된 원본 프로젝트 노트(실제 C 구현 소스코드 포함)

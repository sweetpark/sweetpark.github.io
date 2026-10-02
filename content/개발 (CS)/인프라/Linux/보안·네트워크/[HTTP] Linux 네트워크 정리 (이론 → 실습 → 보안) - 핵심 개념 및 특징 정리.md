---
title: "🌐 Linux 네트워크 정리 (이론 → 실습 → 보안)"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:25
modified: 2026-09-05
---

# Linux 네트워크 정리 (이론 → 실습 → 보안)

> [!NOTE]
> OSI 7계층·통신 흐름·장비 역할 이론부터 nmcli/nmtui/ip 실습, 원격접속 암호화(해시·대칭·비대칭·혼합)까지 리눅스 네트워크 정리.

## 📌 개념

### OSI 7계층

| 계층 | 단위 | 이름 | 핵심 기능 | 장치 / 프로토콜 |
| --- | --- | --- | --- | --- |
| 1 | Bit | 물리 | 전기적 연결 | 허브, 리피터, 케이블 |
| 2 | Frame | 데이터링크 | 신호 → 데이터 | 스위치, NIC, Ethernet |
| 3 | Packet | 네트워크 | 라우팅 | 라우터, L3, IP |
| 4 | Segment | 전송 | 신뢰성, 포트 | TCP, UDP, L4 |
| 5 | Data | 세션 | 세션 관리 | |
| 6 | Data | 표현 | 인코딩/압축 | |
| 7 | Data | 응용 | 서비스 동작 | HTTP, FTP, SMTP, DNS |

### 서버–클라이언트 통신 흐름

클라이언트 → 서버 요청 과정:

1. 7계층: 데이터 생성
2. 4계층: TCP/UDP + 포트번호
3. 3계층: IP 주소 지정
4. 2계층: MAC 주소 (Gateway MAC)

통신 필수 요소: MAC 주소(하드웨어 고유), IP 주소(논리적), Subnet Mask(같은 네트워크 판단), Gateway(외부 네트워크 출구), DNS(도메인 → IP 변환).

### 장비 역할

| 장비 | 특징 |
| --- | --- |
| 스위치 | MAC 기반, 내부 통신 |
| 라우터 | IP + MAC, 외부 통신 |
| L4 | 포트/세션/로드밸런스 |
| L7 | 데이터 내용까지 분석 |

### 네트워크 장애 확인 순서

1. `ping` → 게이트웨이 확인
2. `tracert` / `traceroute` → 경로 추적
3. `nslookup` → DNS 확인

### 가상머신 네트워크 카드

| 카드 | 용도 |
| --- | --- |
| Host-only | Host ↔ VM |
| NAT | VM ↔ Internet |

### NetworkManager 도구

권장 방식(현업 기준). Connection 설정 → Interface 연결 흐름.

| 명령 | 설명 |
| --- | --- |
| nmcli | CLI |
| nmtui | TUI |

### 원격접속 암호화

- **해시(단방향)**: 복호화 불가, 무결성 검증. ex) md5, sha256, sha512
- **대칭키**: 키 1개, 빠름, 키 유출 위험. ex) AES, DES
- **비대칭키**: 공개키/개인키, 키 전달 문제 해결, 느림. ex) RSA
- **혼합 방식(실사용)**: ① 공개키로 대칭키 전달 → ② 이후 대칭키로 통신
- **전자서명**: 개인키로 hash 암호화, 인증 목적(암호화 아님)
- SSH, SSL(HTTPS) 모두 혼합 암호화 방식

### 한 줄 요약 (암기용)

> OSI → IP/MAC → ping → nmcli → ip → SSH

## 💻 예시

### 네트워크 확인 명령

```bash
ip addr
ip route
netstat -r
```

### nmcli 사용 흐름

```bash
# 인터페이스 확인
nmcli con show
nmcli device status
nmcli dev show enp0s3

# 커넥션 생성 (Static 예시)
nmcli con add con-name test-net type ethernet ifname enp0s3 \
  ipv4.addresses 10.0.2.30/24 ipv4.gateway 10.0.2.1

# 커넥션 수정
nmcli con modify test-net ipv4.method manual
nmcli con modify test-net ipv4.dns 8.8.8.8

# 활성 / 비활성
nmcli con up test-net
nmcli con down test-net
```

### DHCP / Static 설정

```bash
# DHCP
nmcli con add con-name dhcp2 type ethernet ifname enp0s3
nmcli con up dhcp2

# Static
nmcli con modify test ipv4.method manual \
  ipv4.addresses 10.0.2.35/24 ipv4.gateway 10.0.2.1
nmcli con up test
```

### 설정 파일 직접 수정 (심화)

```bash
cd /etc/sysconfig/network-scripts
vi ifcfg-enp0s3
```

```text
TYPE=Ethernet
BOOTPROTO=none
ONBOOT=yes
IPADDR=10.0.2.30
PREFIX=24
GATEWAY=10.0.2.1
DNS1=8.8.8.8
```

```bash
nmcli con reload
nmcli con up enp0s3
```

### ip / ifconfig 방식 (구버전·비상용)

```bash
# ip 명령
ip addr add 10.0.2.30/24 dev enp0s3
ip route add default via 10.0.2.1

# ifconfig 방식
ifconfig enp0s3 10.0.2.30 netmask 255.255.255.0 up
route add default gw 10.0.2.1
```

### nmtui (과제/실습용)

```bash
nmtui
```

| 메뉴 | nmcli 대응 |
| --- | --- |
| edit connection | add / modify |
| activate | con up |
| set hostname | hostnamectl |

### Hostname / uname

```bash
hostnamectl set-hostname server01
hostname tempname
uname -a
```

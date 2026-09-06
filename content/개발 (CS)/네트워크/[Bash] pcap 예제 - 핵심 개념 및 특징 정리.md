---
title: "pcap 예제"
tags: [학습, 개발-CS, 네트워크, libpcap, C]
modified: 2026-09-05
---

# pcap 예제

> [!NOTE]
> pcap 개발환경 설치/컴파일 방법과 Ethernet/IP/TCP 헤더 구조, 바이트 오더 변환 함수(htons/htonl/ntohs/ntohl) 정리.

## ⚙️ 구현

관련 노트:
- [(프로젝트) 패킷 캡처와 분석 - libpcap C 구현과 tshark 활용](../../프로젝트/보안/[프로젝트]%20패킷%20캡처와%20분석%20-%20libpcap%20C%20구현과%20tshark%20활용.md)

### pcap 설치
```bash
apt install libpcap.dev
```

### pcap 실행
```bash
# 컴파일
gcc -o 저장할이름 c언어파일.c -lpcap
# 실행
./저장된이름
```

### 헤더 정보

**Ethernet이란?**
물리계층에서는 신호와 배선, 데이터링크 계층에서 MAC 패킷과 프로토콜 형식을 정의.
헤더 구조:
- Dest MAC (6byte)
- Source MAC (6byte)
- TYPE (2byte): 상위 계층 프로토콜 종류 구분

**IP란?**
컴퓨터 주소. 헤더 구조:
- Version: 4bit, IP 버전
- Header Length: 4bit, 헤더 길이 값
- Type-of-Service-Flags: 서비스의 우선순위 제공
- Total Packet Length: 2byte, IP~패킷 끝까지 총 길이
- Fragment identifier: 2byte, 데이터 식별을 위한 것
- Fragment Flags: 3bits
    - x: 항상 0으로 설정
    - D: 분열 여부 (0: 분열 가능 / 1: 분열 방지)
    - M: 분열된 조각이 더 있는지 판단 (0: 마지막 조각 / 1: 조각 더 있음)
- Fragment Offset: 13bits, 원래 데이터의 바이트 범위를 나타냄
- Time-to-live: 1byte, 데이터를 전달할 수 있는 단계의 수 (소멸되기 전까지)
- Protocol Identifier: 1byte, 상위계층 프로토콜 표시 (TCP: 6 / UDP: 17)
- Header Checksum: 2byte, IP 헤더의 체크섬 저장
- Source IP Address: 4byte, 출발지 IP 주소
- Destination IP Address: 4byte, 목적지 IP 주소

**TCP란?**
데이터를 분할하여 보냄 (IP 이용). 헤더 정보:
- Source Port: 2byte, 데이터 전송 포트
- Dest Port: 2byte, 목적지 포트
- Sequence Number: 4byte, 데이터 일련번호 (쪼개져서 들어와도 이 순서에 맞춰서 재조립)
- Acknowledgement Number: 4byte, 수신 준비 및 수신 완료 확인 메세지 전달
- Header Length: 4byte, 필드값 × 4 = TCP 헤더 길이 값
- Reserved: 6bit, 차후 사용을 위한 예약 필드
- Control Flags (6bit)
    - C: 혼잡 윈도우 크기 감소
    - E: 혼잡 알림
    - U: 세그먼트 번호까지 긴급데이터를 포함한다는 것을 알림 (0이라면 무시)
    - A: 확인 응답 메세지
    - P: 데이터를 포함한다는 것을 알림
    - R: 수신거부
    - S: 확인 메세지 전송
    - F: 연결 종료 요청
- window size: 2byte, 보낼 수 있는 버퍼 크기를 바이트 단위로 나타냄
- CheckSum: 2byte, TCP 세그먼트 유효 및 손상 여부 검사

### IP 변환 (hex값 표현 → little endian VS big endian 방식)
- host to network
    - `htons()`: short int (2byte) → 네트워크 바이트로 변환
    - `htonl()`: long int (4byte) → 네트워크 바이트로 변환
- network to host
    - `ntohl()`: long int 데이터 → host byte로 변환
    - `ntohs()`: short int 데이터 → host byte로 변경
- `inet_addr()` ↔ `inet_ntoa()`
    - `inet_ntoa()`: IP(바이트)값을 10진수로 표현
    - 예) `192.157.xxx.xxx`

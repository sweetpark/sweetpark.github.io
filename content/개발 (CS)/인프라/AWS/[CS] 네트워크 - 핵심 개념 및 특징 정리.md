---
title: "네트워크 - VPN & VPC 정리"
tags: [학습, 개발-CS, 인프라, AWS, 개발]
created: 2026년 2월 2일 오후 11:32
modified: 2026-09-05
---

# 네트워크 - VPN & VPC 정리

> [!NOTE]
> AWS 기준 VPN·VPC 네트워크 개념 정리. Subnet, IGW, NAT, Routing Table, 보안(SG/NACL), Endpoint, VPC 생성·삭제 순서, 피어링까지.

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### VPN (Virtual Private Network)

- 공용 인터넷 위에 사설 네트워크를 구성하는 기술
- 외부에서 내부 네트워크처럼 안전하게 접속 가능
- 트래픽이 암호화된 터널을 통해 이동
- 목적: 보안, 내부망 접근, 지사·원격근무 연결

### VPC (Virtual Private Cloud)

- 클라우드 상의 전용 가상 네트워크
- 사용자가 IP 대역을 직접 정의
- 같은 VPC 안에 있으면 subnet이 달라도 통신 가능
- 외부 통신 여부는 라우팅 테이블 + 게이트웨이로 결정

### Subnet 종류

- **Public Subnet**: 인터넷과 통신 가능
    - 조건: 인터넷 게이트웨이(IGW) 연결, 라우팅 테이블에 `0.0.0.0/0 → IGW`
- **Private Subnet**: 인터넷과 직접 통신 불가
    - 보안 서버(DB 등) 배치, 외부 통신 필요 시 NAT Gateway 사용

### Internet Gateway (IGW)

- VPC ↔ 인터넷 연결
- Public Subnet 필수 요소, 양방향 통신 가능

### NAT (Network Address Translation)

> [!IMPORTANT]
> 오타 교정: "Network Access Transmition" (X) → **Network Address Translation** (O)

- Private Subnet → Internet 단방향 통신
- 내부 IP → 공인 IP로 변환, 외부에서 직접 접근 불가
- 특징: 보안성 ↑, 패치·업데이트 용도

### Routing Table

- 아웃바운드 트래픽 경로 결정, Subnet 단위로 연결됨

```text
0.0.0.0/0 → IGW (Public)
0.0.0.0/0 → NAT Gateway (Private)
```

### VPC 보안 구조

- **보안 그룹(Security Group)**: 인스턴스 단위, 상태 기반(Stateful), 허용(Allow)만 가능
- **네트워크 ACL(NACL)**: 서브넷 단위, 무상태(Stateless), 허용 + 거부(Deny) 가능

| 항목 | 보안그룹 | NACL |
| --- | --- | --- |
| 적용 단위 | 인스턴스 | 서브넷 |
| 상태 | Stateful | Stateless |
| 규칙 | Allow only | Allow / Deny |

### NAT Gateway

- Public Subnet에 생성, Private Subnet의 인터넷 접근 담당
- 탄력적 IP(EIP) 필수
- 과금: NAT Gateway 자체 요금 + EIP 요금(미사용 시에도 과금)

### VPC Endpoint

- 인터넷 없이 AWS 서비스 접근 (대상: S3, DynamoDB 등)
- 효과: 보안 ↑, NAT Gateway 비용 절감

### VPC 생성 순서

1. VPC 생성 (CIDR 블록 지정, 예: `10.0.0.0/16`)
2. Subnet 생성 (Public / Private 분리)
3. Internet Gateway 생성 및 VPC 연결
4. Routing Table 생성 (Public RT / Private RT)
5. Subnet ↔ Routing Table 연결

### Private Subnet에서 인터넷 사용하려면?

1. NAT Gateway 생성 (Public Subnet에 생성)
2. Private Routing Table 수정 (`0.0.0.0/0 → NAT Gateway`)
3. Private Subnet에 RT 연결

Private 서버 접속(실무)은 보통 Bastion Host(Public)를 거쳐 내부 서버(Private)로 접속한다.

```bash
ssh ec2-user@IP -i key.pem
```

### VPC 삭제 순서 (과금 방지)

1. 인스턴스 종료
2. NAT Gateway 삭제
3. 탄력적 IP Release (중요)
4. 서브넷 삭제
5. 라우팅 테이블 삭제
6. IGW 분리 및 삭제
7. VPC 삭제

### VPC 피어링

- 서로 다른 VPC 간 사설 통신 (CIDR 겹치면 불가)
- 설정 순서
    1. VPC 피어링 요청 생성
    2. 상대 VPC에서 승인
    3. 양쪽 라우팅 테이블 수정 (상대 VPC CIDR → Peering Connection)
- 특징: Transitive 불가 (A-B, B-C ≠ A-C)

### 한 줄 요약 (암기용)

> Public = IGW / Private = NAT / 보안 = SG + NACL / 통신 = Routing Table

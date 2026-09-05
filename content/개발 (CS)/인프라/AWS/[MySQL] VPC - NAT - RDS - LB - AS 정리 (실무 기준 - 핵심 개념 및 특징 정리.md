---
title: "✅ VPC / NAT / RDS / LB / AS 정리 (실무 기준 교정본)"
tags: [학습, 개발-CS, 인프라, AWS, 개발]
created: 2026년 2월 2일 오후 11:33
modified: 2026-09-05
---

# VPC / NAT / RDS / LB / AS 정리 (실무 기준 교정본)

> [!NOTE]
> AWS VPC 생성, NAT Gateway, RDS, 로드밸런서(ELB), 오토 스케일링 구성 절차를 실무 기준으로 교정한 정리.

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### VPC 생성

기본 흐름:

1. VPC 생성 — CIDR 블록 지정 (예: `10.0.0.0/16`)
2. 서브넷 생성 — Public Subnet / Private Subnet
3. 인터넷 게이트웨이(IGW) 생성
4. 라우팅 테이블 생성 — Public RT / Private RT
5. 서브넷 ↔ 라우팅 테이블 연결

핵심: **IGW는 VPC에 연결**, **Subnet은 Routing Table에 연결**.

### NAT Gateway

> [!IMPORTANT]
> "서브넷 연결은 불필요, default로 자동 연결"은 **틀린 설명**이다. NAT Gateway는 서브넷에 자동 연결되지 않는다.

정확한 절차:

1. 탄력적 IP(EIP) 할당
2. NAT Gateway 생성 — 반드시 Public Subnet에 생성, EIP 연결
3. Private Routing Table 수정 — `0.0.0.0/0 → NAT Gateway`
4. Private Subnet ↔ Private RT 연결

정리: NAT는 Subnet이 아니라 Routing Table을 통해 사용하며, Subnet 연결은 항상 Routing Table 기준이다.

> 면접용 한 줄: "NAT Gateway는 Public Subnet에 위치하고, Private Subnet은 라우팅 테이블을 통해 NAT를 사용합니다."

### RDS (RDB)

기본 절차:

1. RDS 생성 — 보통 Private Subnet, Public access 비활성(권장)
2. 엔드포인트 확인
3. 클라이언트 접속 (생성 시 설정한 비밀번호로)

```bash
mysql -u root -p -h [RDS Endpoint]
```

실무 포인트:

- RDS는 IP가 아니라 Endpoint로 접속
- 보안 그룹에서 3306 포트 허용 필수
- EC2 ↔ RDS는 같은 VPC이거나 Peering 필요

### 로드밸런서 (ELB)

생성 흐름:

1. 타겟 그룹 생성 — EC2 / IP / Lambda 중 선택
2. 로드밸런서 생성 — ALB / NLB 선택
3. 리스너 설정 — 80 → 443, HTTPS 시 인증서 필요
4. 타겟 그룹 연결

실무 팁:

- ALB → HTTP/HTTPS (L7)
- NLB → TCP (L4)
- 로드밸런서는 Public Subnet에 위치

삭제 순서: 로드밸런서 삭제 → 타겟 그룹 삭제. (타겟 그룹이 남아도 과금은 없지만 리소스 정리 차원에서 삭제 권장)

### 오토 스케일링

시작 구성 vs 시작 템플릿:

| 항목 | 시작 구성 | 시작 템플릿 |
| --- | --- | --- |
| 상태 | 구버전 | 최신 |
| 버전 관리 | 불가 | 가능 |
| 추천 | X | O |

→ 무조건 시작 템플릿 사용.

Auto Scaling 기본 구조:

1. 시작 템플릿
2. Auto Scaling Group — 최소 / 최대 / 희망 인스턴스 수
3. 스케일 정책 — CPU / 트래픽 기준
4. 로드밸런서 연결

```text
ALB
 └─ Target Group
     └─ Auto Scaling Group
         └─ EC2
```

### 시험·면접용 한 줄 요약

- Public Subnet → IGW
- Private Subnet → NAT Gateway (via Routing Table)
- NAT Gateway는 Public Subnet
- Subnet은 Routing Table과 연결
- RDS는 Endpoint로 접속
- Auto Scaling은 시작 템플릿 사용

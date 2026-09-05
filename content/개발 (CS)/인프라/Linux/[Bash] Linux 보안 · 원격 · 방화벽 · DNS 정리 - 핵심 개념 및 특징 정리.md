---
title: "🔐 Linux 보안 · 원격 · 방화벽 · DNS 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:27
modified: 2026-09-05
---

# Linux 보안 · 원격 · 방화벽 · DNS 정리

> [!NOTE]
> 비대칭키의 한계와 CA, SSH 보안·키 인증·SCP, firewalld(Zone) 방화벽, DNS 개념·조회·BIND 서버 구축을 정리한 리눅스 보안/네트워크 노트.

## 📌 개념

### 비대칭키의 한계와 해결책

- 단점: 공개키 자체가 진짜인지 보장할 수 없음 → 중간자 공격(MITM) 가능
- MITM 공격 흐름
    1. A는 해커의 공개키로 암호화
    2. 해커가 자신의 개인키로 복호화 → 내용 조작
    3. 해커가 B의 공개키로 재암호화
    4. B는 A가 보낸 정상 데이터로 착각
- 해결책: 제3의 인증기관(CA)이 공개키의 진위를 인증(대표 예: SSL/TLS)

### SSH 보안 구조

| 버전 | 특징 |
| --- | --- |
| SSH v1 | MITM 공격 취약 |
| SSH v2 | Diffie-Hellman 사용 |

- SSH v2: 공개키 기반으로 대칭키를 생성하고 이후 통신은 대칭키로 암호화(키 전달 문제 해결 + 속도 확보)
- SSH 서버 설정(`/etc/ssh/sshd_config`): `Port`(포트 변경), `ListenAddress`(특정 IP만 허용). 기본 포트 22, 기본 ListenAddress 0.0.0.0
- `~/.ssh/known_hosts`: 접속했던 서버의 공개키 저장

### firewalld (Zone 기반 방화벽)

인터페이스 ↔ Zone 연결.

| Zone | 의미 |
| --- | --- |
| drop | 패킷 폐기 |
| reject | 거부 응답 |
| public | 공개 영역 |
| home | 내부 서비스 허용 |
| dmz | 외부 공개 |
| trust | 모든 허용 |

### DNS

- 역할: 도메인 이름 → IP 주소 변환
- FQDN 예시: `docs.google.com` (docs = 호스트, google.com = 도메인)
- 조회 순서: `/etc/hosts` → DNS 캐시 → DNS 서버 질의

### 전체 흐름 요약

> Client → resolv.conf → DNS → zone → record → IP 반환

> 최종 암기: 비대칭키 → CA → SSH → firewall → DNS

## 💻 예시

### SSH 기본 / 키 인증 / SCP

```bash
ssh 계정@IP
ssh -X 계정@IP           # GUI 포워딩 (원격 gedit 실행, 파일은 원격 서버 저장)

# 키 기반 인증 (Passwordless)
ssh-keygen               # 개인키 + 공개키 생성 (개인키 유출 금지)
ssh-copy-id 계정@IP       # 공개키 → 서버 authorized_keys

# SCP (원격 파일 복사)
scp 로컬파일 계정@IP:원격경로
scp ./test root@10.0.2.30:/root/test
```

### 방화벽 (firewalld)

```bash
# Zone 확인
firewall-cmd --get-zones
firewall-cmd --get-default-zone
firewall-cmd --info-zone=public

# 서비스 / 포트 관리
firewall-cmd --list-services
firewall-cmd --add-service=http
firewall-cmd --remove-service=http
firewall-cmd --add-port=8080/tcp
firewall-cmd --remove-port=8080/tcp

# 영구 설정
firewall-cmd --add-service=http --permanent
firewall-cmd --reload
```

### DNS 조회

```bash
nslookup naver.com
dig @8.8.8.8 domain
host domain
```

### DNS 서버 구축 (BIND, 캐시 전용)

```bash
yum install -y bind bind-chroot

# /etc/named.conf
#   listen-on port 53 { any; };
#   listen-on-v6 port 53 { none; };
#   allow-query { any; };

systemctl restart named
systemctl enable named

firewall-cmd --add-service=dns --permanent
firewall-cmd --reload

dig @DNS서버IP domain      # 클라이언트 확인
```

### 주 DNS 서버 (Master) 구축

```bash
# Zone 설정 (/etc/named.conf)
# zone "linux.com" IN {
#     type master;
#     file "linux.com.db";
#     allow-update { none; };
# };
named-checkconf

# Zone 파일 (/var/named/linux.com.db) 핵심 레코드: SOA, NS, A, www.linux.com, ns.linux.com
chmod -R 754 /var/named

# Client 설정
vi /etc/resolv.conf
# nameserver DNS서버IP
nslookup
```

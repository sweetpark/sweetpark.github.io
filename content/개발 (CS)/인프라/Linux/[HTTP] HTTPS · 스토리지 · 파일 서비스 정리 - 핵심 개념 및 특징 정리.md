---
title: "🔐 HTTPS · 스토리지 · 파일 서비스 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:30
modified: 2026-09-05
---

# HTTPS · 스토리지 · 파일 서비스 정리

> [!NOTE]
> Self-Signed HTTPS 구축(Apache SSL), 스토리지 종류(DAS/NAS/SAN), NFS·AutoFS·FTP(vsFTP) 파일 서비스 실습 정리.

## 📌 개념

### 스토리지 종류

| 구분 | 특징 |
| --- | --- |
| DAS | 서버에 직접 연결 (SATA, SAS) |
| NAS | 네트워크 파일 공유 (NFS, SMB) |
| SAN | 전용 네트워크 + 블록 스토리지 |

### FTP 이론

- **Active Mode**: 21(제어), 20(데이터), 서버 → 클라이언트로 데이터 연결
- **Passive Mode**: 서버가 포트를 열어줌, 방화벽 환경에서 유리

### AutoFS (자동 마운트)

- 목적: 접근 시 자동 마운트, 서버 장애 시 부팅 멈춤 방지
- MAP 구조: Master Map(`/etc/auto.master.d/*.autofs`), Direct Map, Indirect Map
- 시험 포인트: AutoFS는 접근할 때만 마운트됨

### 인증서 확장자

- `.crt` / `.cer` / `.pem` (내용은 거의 동일)

### 전체 흐름 요약 (암기용)

> HTTPS(암호화) → NFS(공유) → AutoFS(자동화) → FTP(전송)

## 💻 예시

### HTTPS 구축 실습 (Self-Signed)

전체 흐름: 개인키 생성 → CSR 생성 → 인증서 생성 → Apache SSL 설정 → 방화벽

```bash
# 1) HTTP 서버 설치
yum -y install httpd

# 2) 개인키 생성 (RSA 2048bit)
openssl genrsa -out private.key 2048

# 3) CSR 생성 (서버 정보 + 공개키, CA에 보내는 파일)
openssl req -new -key private.key -out cert.csr

# 4) 인증서 생성 (Self-Signed, X.509, 공개키 포함)
openssl x509 -req -signkey private.key -in cert.csr -out cert.crt

# 5) 인증서/키 위치 이동
mv cert.crt /etc/pki/tls/certs
mv private.key /etc/pki/tls/private

# 6) SELinux 컨텍스트 복원
restorecon -Rv /etc/pki/tls/

# 7) 개인키 권한 제한 (root만 접근)
chmod 600 /etc/pki/tls/private/private.key
```

### SSL 설정 (Apache)

```bash
yum -y install mod_ssl
vi /etc/httpd/conf.d/ssl.conf
# 핵심 항목:
#   SSLCertificateFile    → cert.crt
#   SSLCertificateKeyFile → private.key

# 서비스 재시작 + 방화벽
systemctl restart httpd
firewall-cmd --add-service=https --permanent
firewall-cmd --add-service=http --permanent
firewall-cmd --reload
```

### HTTPS Client 테스트

```bash
vi /etc/hosts
# 서버IP   www.example.com
```

- Firefox → `https://www.example.com`
- Self-Signed이므로 경고가 뜨는 것이 정상

### NFS Server

```bash
rpm -qa nfs-utils                      # 설치 확인
vi /etc/exports                        # 공유 설정
#   /share  10.0.2.0/24(rw,sync)   → rw: 읽기/쓰기, sync: 안정성(속도↓)
chmod 777 /share
systemctl restart nfs-server
systemctl enable nfs-server
exportfs -v                            # 공유 확인

# 방화벽
firewall-cmd --add-service=nfs --permanent
firewall-cmd --add-service=mountd --permanent
firewall-cmd --add-service=rpc-bind --permanent
firewall-cmd --reload
```

### NFS Client

```bash
rpm -qa nfs-utils
showmount -e 서버IP        # rpc-bind, mountd 포트가 열려 있어야 함
mkdir /mnt/nfs
mount -t nfs 서버IP:/share /mnt/nfs
```

### vsFTP 실습

```bash
# 주의: /etc/vsftpd/ftpusers 에 있으면 FTP 로그인 불가

# Server
yum -y install vsftpd
echo filea > /var/ftp/pub/filea
echo fileb > /var/ftp/pub/fileb
systemctl start vsftpd
systemctl enable vsftpd
firewall-cmd --add-service=ftp --permanent
firewall-cmd --reload

# Client
yum -y install ftp
ftp 서버IP
#   put 파일명   # 업로드
#   get 파일명   # 다운로드
```

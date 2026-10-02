---
title: "Fedora CoreOS 설치 및 Ignition-Butane 워크플로우"
tags: [학습, 개발-CS, 인프라, FedoraCoreOS, Linux, Ignition, Butane]
modified: 2026-09-05
---

# Fedora CoreOS 설치 및 Ignition-Butane 워크플로우

> [!NOTE]
> Fedora CoreOS(FCOS)는 컨테이너 워크로드 전용의 최소·불변(immutable) OS다. 패키지 관리자가 없고 `/`, `/usr` 등이 읽기 전용으로 마운트되며, 모든 설정은 최초 부팅 시 1회 적용되는 Ignition 설정 파일로 이루어진다. 재직 중 VADA 진단 대상 OS로 설치·검증한 경험을 일반화해 정리함.

## 📌 개념

### 설치 개요
1. LIVE ISO 파일 다운로드
2. 최초 부팅 후 `core@localhost` 계정으로 네트워크/SSH 설정
3. ignition 파일(cloud-config 또는 butane→ign 변환)을 만들어 디스크에 설치
4. 재부팅 후 ignition에 정의된 설정이 1회 적용됨

### 초기 네트워크 / SSH 설정
```bash
# 네트워크 고정 IP
nmcli device show
nmcli connection mod "Wired connection 1" ipv4.method manual ipv4.addresses 20.20.0.50/16 ipv4.gateway 20.20.0.1 ipv4.dns 8.8.8.8
systemctl restart NetworkManager

# sshd 비밀번호 접근 허용 (기본은 키 인증만 허용)
cd /etc/ssh/sshd_config.d
touch 20-enable-passwords.conf
echo "PasswordAuthentication yes" > 20-enable-passwords.conf
systemctl restart sshd
```

### 패키지 관리 — rpm-ostree
CoreOS는 `yum`/`apt` 같은 일반 패키지 관리자를 사용하지 않는다(컨테이너를 올리는 목적의 최소 구성이기 때문). 서비스를 추가하려면 `rpm-ostree`를 사용한다.

```bash
rpm-ostree install [패키지명]
reboot   # 적용을 위해 재부팅 필요

# dnf(yum과 동일한 역할) 설치
rpm-ostree install dnf
reboot
dnf install xinetd
```

### 디스크 파티션 / 마운트
```bash
fdisk -l              # 디스크 목록 확인
fdisk /dev/sda         # 파티션 설정
# p : 파티션 목록  n : 파티션 추가  w : 저장 후 종료  q : 저장하지 않고 종료
mkfs.ext4 /dev/sda3    # 파티션 포맷(ext4/xfs/ext3 등)
```

### ssh 키 생성
```bash
ssh-keygen -t rsa
# 공개키/개인키 기본 위치: /root/.ssh/[키파일명]
```

### Ignition 설정 만들기 — cloud-config 방식(간단)
```yaml
#cloud-config
hostname: "coreos-example"
users:
  - name: "example"
    passwd: "[openssl passwd -1 로 생성한 해시]"
    groups:
      - "sudo"
      - "docker"
```
```bash
sudo coreos-installer install /dev/sda --copy-network --ignition-file ./cloud-config.yaml
reboot
```

### Ignition 설정 만들기 — Butane 방식(권장)
Butane은 사람이 읽기 쉬운 YAML(`.bu`)을 실제 Ignition 스펙(`.ign` JSON)으로 변환해주는 도구다.

```yaml
variant: fcos
version: 1.4.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-rsa AAAA... (공개키)
```
```bash
# fedora(설치 대상 OS가 아닌 별도 작업 서버)에서 butane 설치
apt install butane
butane --pretty --strict example.bu > example.ign
```

### Ignition 설정 만들기 — fcct 방식(구버전 툴체인)
fcct는 butane의 전신으로, 별도의 URL 호스팅 서버(예: Apache)에 ign 파일을 올려두고 설치 시 URL로 가져오는 방식이다.

```bash
# 1) URL 호스팅용 apache 설치
yum install httpd
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
systemctl enable httpd
systemctl start httpd

# 2) 비밀번호 해시 생성
openssl passwd -1

# 3) fcct 파일(.fcct) 작성 후 ign으로 변환
fcct -p -o coreos.ign ./example.fcct

# 4) ign 파일을 호스팅 디렉토리로 이동
mv coreos.ign /var/www/html

# 5) 설치 시 URL에서 ignition 파일을 가져와 설치
sudo coreos-installer install /dev/sda --copy-network --insecure-ignition --ignition-url http://[호스팅서버IP]/coreos.ign
```
- `--copy-network` : 현재 네트워크 설정을 그대로 적용
- `--insecure-ignition` : https가 아닌 프로토콜로 ignition 파일을 가져올 때 필요
- `--ignition-url` : ignition 파일을 가져올 URL 지정

### SSH 인증 오류 대응
```bash
# 접속하려는 클라이언트의 공개키를 서버 쪽 authorized_keys에 등록
vi /root/.ssh/authorized_keys

# 비밀번호 인증을 막아둔 경우 해제
vi /etc/ssh/sshd_config.d/40-disable-passwords.conf
# PasswordAuthentication yes
```

## 📌 개념 — 불변(immutable) OS의 서비스 등록 문제

CoreOS는 `/usr/lib/systemd/system`을 포함한 시스템 영역이 Read-Only로 마운트되므로, 설치 후에 일반적인 방식으로 systemd 서비스를 등록할 수 없다. 우회 방법은 다음과 같다(각각 트레이드오프가 있음).

| 방법 | 설명 | 문제점 |
| --- | --- | --- |
| crontab | 필요한 프로세스를 주기적으로 실행 | 프로세스 생존 여부 판별 불가 → 중복 실행 가능성 |
| init.d 등록 | 부팅 시 자동 실행되도록 등록 | crontab과 동일한 문제(생존 확인 불가) |
| Ignition에 서비스 등록 | 최초 mount 설정 시 ignition 파일에 systemd unit을 포함 | 이미 설치된 OS는 재초기화해야 적용됨(ignition은 최초 부팅 시 1회만 읽음) |
| 직접 실행 | 바이너리를 foreground/nohup으로 직접 실행 | 서비스 매니저의 이점(재시작, 상태관리)을 못 받음 |

> [!NOTE]
> 모든 변경사항은 `rpm-ostree`를 통해서만 적용해야 하며, `/root`, `/sysroot`는 읽기 전용으로 마운트되어 직접 접근·수정하면 안 된다.

### xinetd / inetd 개념
xinetd(및 전신인 inetd)는 여러 데몬을 상시 띄워두는 대신, 필요할 때만 해당 데몬을 실행해주는 슈퍼서버 데몬이다. 특정 포트에서 대기하다가 연결 요청이 오면 그때 실제 서비스 데몬(sshd, ftpd, smbd 등)을 띄워 CPU/메모리를 절약한다. 자주 쓰이는 서비스(sendmail 등)는 오히려 상시 데몬으로 띄우는 경우가 많아, 상시 데몬과 inetd/xinetd 관리 대상이 혼재하는 것이 일반적이다.

## 🔗 참고
- [Install Fedora CoreOS as a VM](https://devopstales.github.io/cloud/fcos-install/)
- [Config Fedora CoreOS with ignition file - HackMD](https://hackmd.io/@yujungcheng/Hyik85Whq)
- [Fedora CoreOS - First Steps](https://www.matthiaspreu.com/posts/fedora-coreos-first-steps/)
- [Producing an Ignition Config](https://docs.fedoraproject.org/en-US/fedora-coreos/producing-ign/)

---
title: "Ubuntu & redHat (OpenStack)"
tags: [학습, 개발-CS, 인프라, OpenStack, Linux]
modified: 2026-09-05
---

# Ubuntu & redHat (OpenStack)

> [!NOTE]
> Ubuntu / RHEL 8 환경에서 DevStack으로 OpenStack을 설치하는 절차와 참고자료 정리.

## 📌 개념

### 참고자료
- Ubuntu
    - [Ubuntu Openstack — Devstack으로 설치](https://doryoku.tistory.com/429)
    - [Ubuntu iptables로 방화벽 port 설정하기](https://freestrokes.tistory.com/44)
    - [Openstack 설치해보자! (Devstack_ocata, Ubuntu)](https://simpleisit.tistory.com/35)
- redhat
    - [(학습) OpenStack 환경 설정 - DevStack 설치 — 2020 Contributhon Documentation 문서](https://openstack-kr-contributhon2020.readthedocs.io/ko/latest/dongwon_jang/study-how_to_install_devstack.html)
- FORCE=yes issue 사항
    - [error: "/opt/stack/logs/error.log: No such file or directory" - devstack deploy in Ubuntu 12.04 LTS](https://stackoverflow.com/questions/42973688/error-opt-stack-logs-error-log-no-such-file-or-directory-devstack-deploy)

### Ubuntu OpenStack 설치
참고: [Ubuntu Openstack — Devstack으로 설치](https://doryoku.tistory.com/429)

1. apache 설치
    ```bash
    apt install apache2
    ```
2. 방화벽 비활성화
    ```bash
    #systemctl stop ufw // 방화벽 중지
    #systemctl disable ufw // 방화벽 재시작 시 자동 실행 비활성화
    ```
3. 호스트 설정 — 해당 IP에 `devstack`이 인식될 수 있도록 설정(ex. Domain Name)
    ```bash
    vi /etc/hosts

    192.168.5.177  devstack
    ```
4. stack user 생성
    ```bash
    sudo useradd -U -G sudo -s /bin/bash -m stack
    echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack
    ```
5. stack 로그인
    ```bash
    su - stack
    ```
6. devstack git에서 가져오기
    ```bash
    apt install git
    git clone https://git.openstack.org/openstack-dev/devstack
    ```
    - 권한설정
        ```bash
        sudo chown -R stack ./devstack
        sudo chmod -R 777 devstack
        ```
7. `local.conf` 설정 — openstack password 설정
    ```bash
    vi ./devstack/samples/local.conf

    [[local|localrc]]
    HOST_IP=XX.XX.XX.XX

    ADMIN_PASSWORD=password
    DATABASE_PASSWORD=$ADMIN_PASSWORD
    RABBIT_PASSWORD=$ADMIN_PASSWORD
    SERVICE_PASSWORD=$ADMIN_PASSWORD

    cp local.conf ./devstack
    ```
8. `stack.sh` 실행 — ubuntu 20.04인 경우 `/opt/stack`이 생성 안 되므로:
    ```bash
    # FORCE=yes ./stack.sh // FORCE=yes를 옵션값으로 넣어주어야 함
    ```

### Rhel 8 OpenStack 설치
- ubuntu와 비슷하나, 방화벽 설정만 다름
- 방화벽 설정 — 22(ssh), 80(http), 6080 포트 개방 필요
    ```bash
    firewall-cmd --add-port=22/tcp --add-port=80/tcp --add-port=6080/tcp --permanent
    firewall-cmd --reload
    ```

    > [!NOTE]
    > 원문을 AI가 검토·보강함(사실 확인 권장). 원문의 `firewall-cmd -add 22/80/6080`은 `firewall-cmd`의 실제 옵션 문법과 다르므로 `--add-port` 및 `--permanent`/`--reload`를 사용하는 형태로 보강함.

```bash
# stack 계정 설정
$ sudo useradd -s /bin/bash -d /opt/stack -m stack
$ echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack
$ sudo su - stack

# git
$ git clone https://opendev.org/openstack/devstack
$ cd devstack

# local.conf 작성
ADMIN_PASSWORD=secret
DATABASE_PASSWORD=$ADMIN_PASSWORD
RABBIT_PASSWORD=$ADMIN_PASSWORD
SERVICE_PASSWORD=$ADMIN_PASSWORD
HOST_IP=[접근하는 시스템의 공인IP]

# stack.sh 실행
./stack.sh
```

## 💻 예시
```bash
git clone https://git.openstack.org/openstack-dev/devstack
cd devstack
FORCE=yes ./stack.sh
```

## 🔗 참고
- 위 "참고자료" 절 참조.
- `ADMIN_PASSWORD=password` / `ADMIN_PASSWORD=secret`는 DevStack 공식 예제에서 흔히 쓰이는 튜토리얼용 예시 값으로, 실제 운영 자격증명이 아님.
- 개념 요약: [(Ubuntu) devstack (OpenStack) - 핵심 개념 및 특징 정리]([Ubuntu]%20devstack%20%28OpenStack%29%20-%20핵심%20개념%20및%20특징%20정리.md)

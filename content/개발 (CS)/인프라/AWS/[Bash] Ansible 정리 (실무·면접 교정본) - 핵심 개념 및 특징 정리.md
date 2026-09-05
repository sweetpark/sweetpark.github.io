---
title: "✅ Ansible 정리 (실무·면접 교정본)"
tags: [학습, 개발-CS, 인프라, AWS, 개발]
created: 2026년 2월 2일 오후 11:34
modified: 2026-09-05
---

# Ansible 정리 (실무·면접 교정본)

> [!NOTE]
> 에이전트 없는 SSH 기반 구성 관리 도구 Ansible의 개념, Bash와의 차이(멱등성), 아키텍처, 설치·Inventory·Playbook·Module 사용을 실무·면접 관점으로 정리.

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### Ansible 개요

- 여러 대의 서버를 동시에 관리 가능한 환경 구성 자동화 도구
- 한 줄 정의(면접용): "Ansible은 에이전트 없이 SSH 기반으로 서버 상태를 선언적으로 관리하는 **구성 관리(Configuration Management)** 도구"

### Bash vs Ansible

Bash도 동일 구성은 가능하지만, 차이는 아래와 같다.

| Bash | Ansible |
| --- | --- |
| 절차적 | 선언적 |
| 멱등성 없음 | 멱등성 보장 |
| 실패 시 복구 어려움 | 상태 기반 관리 |
| 서버 상태 파악 어려움 | 상태 비교 가능 |

> 면접용 정답 문장: "Bash 스크립트는 절차 기반이라 서버 상태에 따라 결과가 달라질 수 있지만, Ansible은 멱등성을 보장하여 동일한 상태를 유지할 수 있습니다."

### 아키텍처

- Ansible은 별도 에이전트 설치가 필요 없다(최대 장점)
- 구조: **Control Node**(Ansible 실행 서버) / **Managed Node**(제어 대상 서버)
- Client / Server 구조가 아니라 Control / Managed Node 구조라는 표현이 정확

### Module

- 500개 이상의 모듈 존재
- **shell / command 모듈은 최후의 수단** — 멱등성이 보장되지 않고 상태 추적이 어렵기 때문

```yaml
# 지양
- shell: yum install nginx -y
# 권장 (멱등성 보장)
- yum:
    name: nginx
    state: present
```

### 초압축 요약

- Ansible = 에이전트 없는 구성 관리 도구
- SSH 기반, 멱등성 보장
- Inventory / Playbook / Module
- Bash와 차이 = 상태 기반 관리
- Control Node / Managed Node 구조

## 💻 예시

### 설치

```bash
# 가상환경/특정 버전 고정 시
pip3.6 install ansible

# 권장 (요즘 기준)
yum install -y ansible
# 또는
dnf install -y ansible
```

### 전용 계정 구성

```bash
adduser ansible-user
passwd ansible-user
```

```bash
# sudo 권한 (운영환경에서는 NOPASSWD:ALL 지양, 필요한 명령만 제한 권장)
ansible-user ALL=(ALL) NOPASSWD:ALL
```

### SSH 키 기반 인증

```bash
ssh-copy-id ansible-user@ip
```

무인 자동화를 위해 필요하다.

### Inventory (hosts.ini)

```ini
ansible-target-host ansible_host=10.0.2.10 ansible_user=ansible-user
```

실무에서 자주 쓰는 그룹 형태:

```ini
[web]
web1 ansible_host=10.0.2.10
web2 ansible_host=10.0.2.11

[db]
db1 ansible_host=10.0.2.20
```

> 면접용 한 줄: "Inventory는 관리 대상 서버를 그룹화하여 역할 단위로 제어하기 위해 사용합니다."

### Playbook

YAML 포맷이며 `become: true`는 sudo 실행을 의미한다.

```yaml
- hosts: web
  become: true
  tasks:
    - name: install nginx
      yum:
        name: nginx
        state: present
```

핵심 개념: **hosts**(어디서) / **tasks**(무엇을) / **module**(어떻게).

### 동작 테스트

```bash
ansible -m ping -i hosts.ini all
```

> ping 모듈은 실제 ICMP가 아니라 Python 기반 모듈 실행 가능 여부를 확인한다.

## 📎 기타

### 다음 학습 단계

1. Ansible vs Terraform 차이
2. 실무 플레이북 예제 (nginx 설치 / 사용자 생성 / 방화벽 설정)
3. AWS + Ansible 연계 (EC2, ASG)

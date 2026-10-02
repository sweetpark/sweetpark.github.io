---
title: "🔐 Linux 보안 & DB 기초 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:28
modified: 2026-09-05
---

# Linux SELinux 정리 (SELinux · 접근제어)

> [!NOTE]
> SELinux(강제적 접근제어, MAC)의 개념, 접근제어 모델(DAC/MAC/RBAC), 동작 모드·정책, 보안 컨텍스트·Boolean·포트 레이블 관리와 실습 시나리오 정리.

## 📌 개념

### SELinux란?

- **Security-Enhanced Linux**
- 커널 레벨에서 동작하는 강제적 접근제어(MAC) 보안 커널
- DAC 권한(`chmod`)보다 우선 적용

### 접근제어 모델

- **Subject(주체)**: 사용자, 프로세스
- **Object(객체)**: 파일, 디렉토리, 포트 등 리소스

| 모델 | 설명 | 리눅스 적용 |
| --- | --- | --- |
| DAC | 사용자가 권한을 임의 설정 | 기본 chmod |
| MAC | 보안 레이블 + 정책 | SELinux |
| RBAC | 역할 기반 권한 | 고급 보안 모델 |

MAC 핵심 구성요소: 보안 레이블(Context), 정책 스위치(Boolean). DAC 허용 후 MAC에서 다시 검사한다.

### 정책 유형 / 동작 모드

| 정책 타입 | 설명 |
| --- | --- |
| targeted | 특정 프로세스만 보호 (기본) |
| minimum | 최소 보호 |
| mls | 보안 등급 분리 |

| 동작 모드 | 설명 |
| --- | --- |
| Enforcing | 강제 + 로그 |
| Permissive | 로그만 기록 |
| Disabled | 완전 비활성 |

> [!WARNING]
> `/etc/selinux/config` 변경 후에는 반드시 재부팅해야 한다.

### 보안 컨텍스트 구조

```text
사용자 : 역할 : 타입 : 레벨
```

## 💻 예시

### SELinux 상태 / 모드

```bash
getenforce
sestatus
vi /etc/selinux/config   # 정책·모드 설정 파일

# 런타임 변경
setenforce 1   # enforcing
setenforce 0   # permissive
```

### 보안 컨텍스트 관리

```bash
# 확인
ps axZ
ls -alZ

# 임시 변경
chcon -t httpd_sys_content_t 파일

# 복원
restorecon -v 파일
restorecon -rv 디렉토리

# 영구 정책 관리 (기본 정책은 삭제 불가)
semanage fcontext -l
semanage fcontext -a -t 타입 경로
semanage fcontext -d -t 타입 경로
```

### Boolean (정책 스위치)

```bash
getsebool -a
semanage boolean -l

setsebool httpd_enable_homedirs on        # 런타임
setsebool -P httpd_enable_homedirs on     # 영구
```

### 포트 보안 레이블

```bash
semanage port -l
semanage port -a -t http_port_t -p tcp 8080
semanage port -m -t http_port_t -p tcp 8080
semanage port -d -t http_port_t -p tcp 8080
```

### 실습 핵심 시나리오

문제 상황: `/home/user/index.html`을 `/var/www/html`로 이동했더니 웹 접속이 SELinux에 의해 차단됨.

해결 방법 3가지:

```bash
# 1) Permissive (임시)
setenforce 0

# 2) Context 복구 (정석)
restorecon -v /var/www/html/index.html

# 3) Boolean 허용
setsebool -P httpd_enable_homedirs on
```

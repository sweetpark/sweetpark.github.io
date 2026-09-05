---
title: "서버 보안 점검 및 하드닝 정리"
tags: [학습, 개발-CS, 인프라, 인프라-기초-지식, 개발, 인프라기초]
modified: 2026-09-05
---

# 서버 보안 점검 및 하드닝 정리

> [!NOTE]
> 리눅스 서버 보안 점검·하드닝 체크리스트. ESXi 가상화 보안, 로그·계정·권한 점검, PAM 정책, SUID/World-Writable, 취약 서비스 비활성화까지.

## 📌 개념

### 계정 관리 점검 항목 (총 36개)

- 계정 관리: 5개
- 파일/디렉토리 관리: 14개
- 서비스 관리: 15개
- 패치/로그 관리: 2개

### 최종 핵심 요약

- root 원격 로그인 차단
- 불필요 서비스/포트 제거
- PAM 기반 인증 정책 강화
- SUID / World-Writable 제거
- 로그 상시 모니터링
- ESXi MOB 비활성화 필수

## 💻 예시

### 1. ESXi / 가상화 보안

MOB(Managed Object Browser)는 호스트 관리 객체 모델 탐색·설정 변경이 가능해 보안상 위험하므로 비활성화한다.

```bash
vim-cmd proxysvc/service_list                              # MOB 서비스 확인
vim-cmd proxysvc/remove_service "/mob" "httpWithRedirect"  # MOB 비활성화

esxcli network ip connection list                          # 현재 오픈 서비스 확인
```

- 클라우드 서비스 제공 시 SSH, vSphere Client만 허용(불필요 포트는 취약점)
- ESXi 기본 오픈 포트: SSH 22, DNS 53, DHCP 68, SNMP 161, HTTP 80, SLPv2 427, SSL 443, 인증/원격접속 902
- 보안 패치(`esxi update`)는 필수 적용

### 2. 로그 점검 (정기 필수)

주요 점검 항목: 반복적인 로그인 실패, 로그인 거부 메시지, su 시도 기록.

```bash
/var/log/messages
/var/log/secure
```

### 3. Root 계정 원격 접속 제한

접속 방식: tty(로컬 콘솔) / pty(Telnet·SSH 원격 접속)

```bash
cat /etc/securetty                                  # pty 허용 여부 확인
cat /etc/ssh/sshd_config | grep PermitRootLogin     # SSH root 로그인 설정 확인
# → PermitRootLogin no 로 설정하여 차단
```

### 4. 비밀번호 정책 강화 (PAM)

설정 파일: Ubuntu/Debian `/etc/pam.d/common-password`, CentOS/RHEL `/etc/pam.d/system-auth`

주요 옵션: `lcredit`(소문자), `ucredit`(대문자), `dcredit`(숫자), `ocredit`(특수문자), `minlen`(최소 길이), `enforce_for_root`(root에도 적용)

계정 잠금 설정 파일: Ubuntu `/etc/pam.d/common-auth`, CentOS `/etc/pam.d/password-auth` (`auth` = 인증 정책 설정 영역)

> [!NOTE]
> `system-auth`와 `password-auth`는 서로 적용 대상이 다르다.
> - `system-auth` : 콘솔 기반 로그인 정책(현재 적용 중인 패스워드 정책 확인용으로도 `/etc/pam.d/passwd`가 참조하는 파일)
> - `password-auth` : GUI/원격 기반 로그인 정책(예: SSH)
>
> RHEL 8+에서는 `faillock`(계정 잠금 임계값·해제시간) 점검 시 `authselect` 명령으로 확인하며, 계정 잠금 임계값 확인과 잠금 해제시간 확인이 동일한 내부 로직을 공유하는 경우 결과 문구가 똑같이 나올 수 있으니 점검 도구 구현 시 두 항목을 분기 처리해야 한다.

### 5. 패스워드 만료 / Shadow 정책

```bash
grep PASS_MAX_DAYS /etc/login.defs   # 최대 사용 기간 확인 (/etc/login.defs)
chage -M 90 사용자명                  # 사용자별 최대 사용 기간 설정

pwconv     # shadow 패스워드 적용 (/etc/shadow)
pwunconv   # 일반 패스워드 복구
```

### 6. 환경변수(PATH) 보안

```bash
echo $PATH
# $PATH에 '.' 포함 시 악성코드 실행 위험 → 반드시 제거
```

### 7. 중요 파일 권한 점검

```bash
# /etc/passwd (소유자 root, 권한 644)
chown root /etc/passwd
chmod 644 /etc/passwd

ls -l /etc/hosts     # Pharming 공격 위험, root 소유 / 644
```

- `/etc/inetd.conf`, `/etc/xinetd.d/*`: inetd는 슈퍼 서버 데몬(요청 수신 → 해당 서버 프로그램 실행)
- `/etc/rsyslog.conf`: root 소유 / 644
- `/etc/services`: 포트 번호 변경 가능 파일, root 소유 / 644

### 8. SUID / SGID / World-Writable 점검

```bash
# SUID/SGID 파일 탐색
find / -user root -type f \( -perm -4000 -o -perm -2000 \) -exec ls -lg {} \;
chmod -s 파일명   # 제거

# World Writable 파일 점검
find / -type f -perm -2 -exec ls -l {} \;
```

### 9. 원격 신뢰 파일 / 접속 제한

```bash
# 사용 금지 (권한 600 이하)
ls -al /etc/hosts.equiv
cat ~/.rhosts

# 접속 IP / 포트 제한
cat /etc/hosts.allow
cat /etc/hosts.deny
iptables -nL
```

- Cron 권한 점검: `crontab` 파일 권한 확인, 비인가 사용자 접근 차단

### 10. 취약 서비스 비활성화

```bash
# r 계열 서비스 (rlogin / rsh / rexec)
/etc/xinetd.d/r* | grep disable

# 서비스 재시작
service xinetd restart
```

- **FINGER**: `/etc/inetd.conf`
- **Anonymous FTP**: `/etc/vsftpd/vsftpd.conf` → `anonymous_enable=NO`, `/etc/passwd`에서 anonymous 계정 제거
- **DDoS 악용 서비스 차단**(echo, discard, daytime, chargen): `/etc/xinetd.d/*`
- **RPC / NIS / tftp / talk**: 비활성화, `/etc/xinetd.d/`

### 11. automount 제거

```bash
chkconfig --level 0123456 autofs off
```

### 12. 프로세스 / 파일 접근 통제

```bash
ps -ef
kill -9 PID

# 파일 접근 통제
/etc/exports
showmount
umount
```

### 13. Sendmail / DNS 보안

```bash
ps -ef | grep sendmail
# /etc/mail/sendmail.cf → SMTP Relay 제한 필수 (사용 비권장)
```

- **DNS**: Zone Transfer 제한, DNS 기반 공격(DoS, 버퍼 오버플로우, root 탈취) 주의

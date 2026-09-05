---
title: "Aruba 스위치 보안 하드닝 가이드"
tags: [학습, 개발-CS, 네트워크, 개발, Aruba, 보안, 하드닝]
modified: 2026-09-05
---

# Aruba 스위치 보안 하드닝 가이드

> [!NOTE]
> HPE Aruba 스위치 2개 계열 — **ArubaOS-Switch**(2930F 등, 레거시 CLI)와 **ArubaOS-CX**(8320 등, 차세대 CLI) — 의 보안 취약점 점검·하드닝 명령어를 항목별로 정리. 두 계열은 명령어 문법이 다르므로 각 항목마다 두 계열을 나란히 비교했다. 네트워크 장비 보안 진단 솔루션 개발 과정에서 수집한 실기 검증 결과를 일반화함(예시의 IP·계정명은 모두 문서화용 placeholder로 치환).

## 📌 개념 — 공통 조작

### 페이징(paging) 해제 — 긴 출력 결과를 한 화면에
```bash
# ArubaOS-Switch (2930F)
switch# no page
# 또는: screen-length 1000  (2~1000 범위)

# ArubaOS-CX (8320)
switch# no page
```

### 권한 상승(privilege) — 일반 계정 → 관리자
```bash
# ArubaOS-Switch: enable 시 비밀번호를 물어봄
switch> enable
Username :
Password :

# ArubaOS-CX: enable 시 비밀번호를 묻지 않음(로그인 계정 권한 그대로 상승)
switch> enable
```

### 관리 인터페이스 초기 설정(ArubaOS-CX 예)
```bash
switch# config
switch(config)# user admin password
switch(config)# ssh server vrf mgmt
switch(config)# interface mgmt
switch(config-if-mgmt)# ip static 192.168.1.100
switch(config-if-mgmt)# default-gateway 192.168.1.1
switch(config-if-mgmt)# nameserver 8.8.8.8
switch(config-if-mgmt)# no shutdown
```

---

## 📌 항목별 하드닝 체크리스트

### 1. 기본 패스워드 변경 여부

- 판단기준: 기본(초기) 비밀번호를 변경했으면 양호, 그대로 쓰면 취약

```bash
# 공통 — 설정된 계정의 비밀번호는 running-config에 ciphertext(일방향 암호화)로 저장됨
show running-config
...
user admin group administrators password ciphertext [암호화된 문자열]
...

# ArubaOS-CX 전용 — 패스워드 복잡도 정책 확인
show password-complexity
Global password complexity checking criteria:
    Password complexity                     : Enabled
    Previous passwords to check             : 5
    Minimum password length                 : 8
    Minimum position changes                : 8
    Password composition
        Minimum lowercase characters        : 1
        Minimum uppercase characters        : 1
        Minimum special characters          : 1
        Minimum numeric characters          : 1
```

### 2. 패스워드 복잡도 정책

```bash
# 활성화 옵션 종류
password complexity ?
#  all                     : repeat-char-check + repeat-password-check + user-name-check 모두 적용
#  repeat-char-check       : 동일 문자 3연속 사용 금지
#  repeat-password-check   : 이전 비밀번호 반복 사용 금지
#  user-name-check         : 비밀번호에 계정명(정순/역순) 포함 금지

# 활성화 / 비활성화
password complexity user-name-check
no password complexity user-name-check

# 확인
show running-config | include "password complexity"
```

### 3. 패스워드 암호화 저장 여부

```bash
# ArubaOS-Switch
password non-plaintext-sha256

# 확인 — 두 계열 모두 running-config에 ciphertext로 표시되면 양호
show running-config
```

### 4. VTY(SSH) 접근 제어 / ACL

```bash
# ArubaOS-Switch
show ip ssh
# SSH Enabled : Yes/No

# ArubaOS-CX
show ssh server all-vrfs
# SSH server configuration on VRF default : ...

# 공통 — ACL로 VTY 접근 IP 제한
show running-config
ip access-list extended "110"
    10 deny tcp <차단대상> eq 22
    20 permit tcp <허용대상> eq 22
```

### 5. 세션 Timeout 설정

```bash
# ArubaOS-Switch
console idle-timeout 600
console idle-timeout serial-usb 600

# ArubaOS-CX
(config) # session-timeout <0-43200>   # 기본값 30초
```

### 6. 보안 패치 / 벤더 권고사항 적용 여부 (Review)
```bash
show version
```
- 자동 판정이 어려운 항목 — 버전 정보만 뽑아 담당자 확인(Review) 처리

### 7. SNMP 서비스 사용 여부 / SNMPv3

- 판단기준: SNMP 미사용 시 비활성화, 또는 SNMPv3만 사용(v1/v2 비활성화)하면 양호

```bash
# ArubaOS-Switch
no snmp-server enable
show snmpv3 enable
#   SNMP v3 enabled : No/Yes

# ArubaOS-CX — SNMP는 VRF 단위로 활성화됨
snmp-server vrf [vrf이름]     # vrf 이름: default, mgmt 등
show snmp vrf                 # 활성화된 VRF 목록 확인
show snmpv3 users
```

### 8. SNMP Community String 기본값(public/private) 확인

```bash
show running-config
snmp-server community "public" unrestricted
snmp-server community "[커스텀 이름]" operator

show snmp-server
# Community Name / MIB View / Write Access 컬럼으로 확인
```
- 판단기준: `public`/`private` 같은 업계 표준 기본값을 그대로 사용하면 취약

### 9. SNMP ACL(UDP 161/162 포트 제한)

```bash
show running-config
ip access-list extended "110"
    30 deny udp <차단대상> eq 162
    40 deny udp <차단대상> eq 161

# community 생성 및 권한 옵션
snmp-server community [명칭] [operator|manager|unrestricted|restricted]
# operator      : 모니터링 + 제한된 설정 객체만 접근
# manager       : 모든 MIB 객체 접근
# restricted(ro): 읽기 전용
# unrestricted(rw): 읽기/쓰기 모두 가능
```

### 10. SNMP Community 권한 (RO/RW)

- 판단기준: RO(Restricted, 읽기전용)면 양호, RW(Unrestricted, 읽기/쓰기)면 취약

```bash
show snmp-server
# Write Access 컬럼: Restricted(RO) / Unrestricted(RW)
```

### 11. TFTP 사용 여부

```bash
no tftp client
no tftp server

show running-config
# no tftp client / no tftp server 가 있으면 양호
```

### 12. 스푸핑 방지(ARP Protection)

- ARP 스푸핑만 방지 가능(IP/DNS 스푸핑은 별도 대응 필요)
- 판단기준: ARP Protection Enabled + 해당 포트 Trust 여부로 판정

```bash
show arp-protect
#   ARP Protection Enabled : Yes/No
#   Port  Trust : Yes/No (포트별)

# 설정
arp-protect                              # 전체 활성화
no arp-protect                           # 전체 비활성화
arp-protect trust [포트범위]              # 특정 포트를 trust(신뢰) 처리
no arp-protect trust [포트범위]           # trust 해제(untrusted)
```

### 13. DDoS 방어

- 전용 명령어가 없는 경우가 많음 — 별도 방화벽/DDoS 솔루션에서 처리하는 것으로 간주하고 ACL 현황만 Review

### 14. 미사용 인터페이스 비활성화

```bash
# ArubaOS-Switch
interface [포트번호] disable

# ArubaOS-CX
show interface brief   # 포트별 Enabled/Status 확인
```

### 15. 사용자별 권한 수준(Privilege Level)

```bash
# ArubaOS-Switch
aaa authentication login privilege-mode
aaa authentication local-user "[계정명]" group "Level-15"   # administrators
aaa authentication local-user "[계정명]" group "Level-1"    # operators

# 권한 레벨
# operators      : 1  — 비민감 데이터 읽기 전용
# administrators : 15 — 모든 스위치 리소스 읽기/쓰기
# auditors       : 19 — 감사/이벤트 로그 읽기 전용

# ArubaOS-CX
user [계정명] group [administrators|operators|auditors]
```

### 16. VTY 접근 시 안전한 프로토콜(SSH) 사용

```bash
# 확인
show ip ssh          # ArubaOS-Switch
show ssh server all-vrfs   # ArubaOS-CX

# 텔넷 차단(양호 조건)
no telnet-server
```
- 판단기준: SSH만 허용하고 telnet은 차단되어 있으면 양호

### 17. 로그온 배너(경고 메시지)

```bash
banner motd [구분자]     # 접속 시(motd) 표시
[배너 내용]
[구분자]
banner exec [구분자]     # 로그인 시(exec) 표시
[배너 내용]
[구분자]
```
- 판단기준: 접근 경고 메시지를 설정하고, 시스템 정보(버전 등 민감정보)를 노출하지 않으면 양호

### 18. 로그 설정 / Severity

```bash
logging [syslog서버 IP]
logging severity [emerg|alert|crit|error|warning|notice|info|debug]
show logging
```

### 19. NTP 서버 연동

```bash
ntp server [ip]           # 설정
no ntp server [ip]        # 해제
show ntp servers           # 확인 (ArubaOS-CX)
```
- 판단기준: NTP 서버 연동으로 시간 동기화가 되어 있으면 양호

### 20. 로그 타임스탬프

```bash
show log
```
- 대부분 장비는 기본적으로 로그에 timestamp가 찍혀 있어 별도 설정 없이 양호 처리되는 경우가 많음(정확한 시각을 위해서는 NTP 설정이 선행되어야 함)

### 21. TCP Keepalive

```bash
# ArubaOS-Switch
link-keepalive
show link-keepalive
```
- ArubaOS-CX에서는 대응 명령어가 확인되지 않아 N/A로 처리되는 경우가 있음(모델/펌웨어에 따라 다를 수 있음)

### 22. 불필요 웹 서비스(HTTP) 차단

```bash
no web-management plaintext   # ArubaOS-Switch: 평문 HTTP 비활성화
show web-management
#   HTTP Access  : Disabled
#   HTTPS Access : Disabled

# ArubaOS-CX
https-server vrf [vrf이름]
show access-list   # 관리 페이지 접근 IP 제한용 ACL 확인
```

### 23. Bootp/DHCP 서비스 제한

```bash
show dhcp-server
#   DHCP Server Enabled : No 이면 양호(불필요 서비스 미사용)
```
- BootP는 DHCP 서버 기능의 일부로 동작하는 경우가 많아, DHCP 서비스 비활성화 여부로 함께 판단

### 24. CDP(Cisco Discovery Protocol) 차단

```bash
no cdp run      # ArubaOS-Switch
no cdp enable   # ArubaOS-CX

show running-config   # "no cdp run"/"no cdp enable" 확인
```
- CDP는 Cisco 계열 장비 관리 목적 프로토콜 — 타 벤더 장비에서는 불필요하므로 차단이 양호

### 25. Directed Broadcast 차단(Smurf 공격 방지)

```bash
no ip directed-broadcast   # 기본적으로 비활성화되어 있는 경우가 많음(명시적으로도 재확인)
```

### 26. Source Routing 차단

```bash
no ip source-route
```

### 27. Proxy ARP 차단

```bash
# ArubaOS-Switch (vlan 단위)
vlan [번호]
no ip proxy-arp

# ArubaOS-CX (interface 단위)
interface [포트]
no ip proxy-arp
```
- 일부 구형 펌웨어(예: 16.01)는 해당 명령어를 지원하지 않을 수 있음 — 펌웨어 업그레이드 필요 여부 확인

### 28. ICMP Redirect / Unreachable 차단

```bash
no ip icmp redirects
no ip icmp unreachable
```

### 29. identd / Domain Lookup / PAD 서비스

- 해당 서비스 자체가 스위치에 존재하지 않아 N/A 처리되는 경우가 대부분(모델·펌웨어에 따라 다를 수 있음)

### 30. ICMP mask-reply 차단(서브넷마스크 정보 노출 방지)

```bash
no ip icmp addrmask
show ip icmp
#   Address Mask Replies [Off] : Off  → 양호
```

### 31. 포트 보안 / SPAN

```bash
port-security [포트번호] eavesdrop-prevention
show port-security
```
- SPAN(트래픽 미러링) 기능은 스위치 자체보다 별도 NAC 솔루션(예: 벤더의 중앙관리 플랫폼)에서 제공하는 경우가 많음

---

## 📌 참고 — 진단 자동화 관점 팁

- 같은 보안 항목이라도 **ArubaOS-Switch**와 **ArubaOS-CX**는 명령어 문법이 다르고, 결과 파싱 포맷도 다르므로 자동 진단 도구를 만든다면 OS 계열별로 파서를 분리하는 것이 안전하다.
- 렌탈/테스트 장비의 펌웨어 버전에 따라 특정 명령어(`proxy-arp`, `link-keepalive` 등)가 아예 존재하지 않을 수 있으므로, "명령어 없음"과 "취약"을 구분해 N/A로 별도 분류하는 판정 로직이 필요하다.
- SNMP community string, 계정 비밀번호(ciphertext) 등은 장비가 자체적으로 암호화해서 보여주는 값이라도, 문서·로그로 남길 때는 실제 값 대신 placeholder로 치환하는 습관을 들이는 것이 안전하다.

## 🔗 참고
- [Aruba techdocs — snmp-server community](https://www.arubanetworks.com/techdocs/AOS-CX/AOSCX-CLI-Bank/cli_8360/Content/Chp_SNMP/SNMP_cmds/snm-ser-com.htm)
- [Aruba techdocs — Pipe(|) command](https://www.arubanetworks.com/techdocs/AOS-CX/10.07/HTML/5200-7834/Content/cli_ses_cmds/pipe.htm)
- [Airheads Community — device fingerprinting](https://community.arubanetworks.com/discussion/what-is-device-fingerprinting-how-do-you-configure-device-fingerprinting-in-arubaos-switch)

---
title: "RHEL 8 NTP에서 chrony로의 전환"
tags: [학습, 개발-CS, 인프라, NTP, chrony, RHEL]
modified: 2026-09-05
---

# RHEL 8 NTP에서 chrony로의 전환

> [!NOTE]
> RHEL 8부터 기본 시각 동기화 데몬이 `ntpd`에서 `chronyd`로 바뀌었다. 시스템 점검/진단 도구를 만들 때 과거 ntp 기준으로만 점검하면 chrony를 쓰는 최신 환경을 제대로 진단하지 못하므로, 두 서비스를 모두 고려해야 한다.

## 📌 개념

### ntp vs chrony
- RHEL 7 이하: `ntpd` 기본
- RHEL 8 이상: `chronyd` 기본(`ntpd`도 설치는 가능하나 권장되지 않음)
- 점검 대상: 서비스 기동 여부, 프로세스, 설정 파일(`ntp.conf` vs `chrony.conf`)을 모두 확인해야 신구 버전 환경을 함께 지원할 수 있음

### RHEL 8 subscription 등록 (yum 사용 전제조건)
RHEL은 Red Hat 계정으로 subscription을 등록해야 `yum`/`dnf`로 패키지를 설치할 수 있다(무상 개발자 구독 포함).

```bash
subscription-manager register
# USERNAME:
# PASSWORD:

subscription-manager attach-auto
```

- 참고: [Red Hat Enterprise Linux 다운로드](https://developers.redhat.com/products/rhel/download)

## 🔗 참고
- 진단/수집 도구를 설계할 때는 서비스명이 OS 버전에 따라 달라질 수 있다는 점을 감안해, 여러 후보 서비스명·설정파일 경로를 모두 확인하는 방식으로 설계하는 것이 안전하다.

---
title: "Grafana Alert Slack 연동 설정 가이드"
tags: [학습, 개발-CS, 인프라, Grafana, Loki, Slack, Alert]
modified: 2026-09-05
---

# Grafana Alert Slack 연동 설정 가이드

> [!NOTE]
> Grafana Loki 기반 에러 로그를 감지해 Slack으로 알림을 보내는 Alert Rule/Contact Point/Notification Policy 설정 절차. "Logging (최소 APM 구현)" 미니프로젝트에서 추출.
> 관련 노트: [(MyBatis) Log 고도화 작업 - 핵심 개념 및 특징 정리]([MyBatis]%20Log%20고도화%20작업%20-%20핵심%20개념%20및%20특징%20정리.md)의 Grafana Alert 섹션 — 실무에서는 메일 채널로 알림을 보냈다(SLOW Query/Exception/응답지연 메일 발송). 이 노트는 Slack 채널 연동에 특화된 절차를 다룬다.

## ⚙️ 1. Slack Webhook URL 발급

1. https://api.slack.com/apps 접속
2. **Create New App** → From scratch
3. 앱 이름 입력 + 워크스페이스 선택
4. **Incoming Webhooks** → Activate → **Add New Webhook to Workspace**
5. 알림 받을 채널 선택
6. Webhook URL 복사

## ⚙️ 2. Contact Point 생성

**Alerting → Contact points → Add contact point**
```yaml
Name: <contact-point-이름>
Type: Slack
Webhook URL: <발급받은 webhook url>
Title: 🚨 <서비스명> 에러 감지
Text:
  *상태:* {{ .Status }}
  *내용:* {{ .CommonAnnotations.description }}
  *시각:* {{ .CommonLabels.grafana_folder }}
  *로그확인:* <Grafana 대시보드 URL>
```

## ⚙️ 3. Alert Rule 생성

**Alerting → Alert rules → New alert rule**

**Step 1. 쿼리(A)**
```
sum(count_over_time(
  {app=~"서비스1|서비스2|..."}
  |~ "ERROR|FAILED|EXCEPTION|SQL_EXCEPTION"
  [10m]
))
```

**Step 2. Expressions**
```
B: Reduce
   - Input: A
   - Function: Last
   - Mode: Strict

C: Threshold  ← ✅ Alert condition 설정
   - Input: B
   - IS ABOVE: 0
```

> [!WARNING]
> A(원본 쿼리)가 아닌 **C(Threshold)를 Alert condition으로 설정**해야 한다. A로 설정하면 Firing이어도 알림이 안 갈 수 있다.

**Step 3. Evaluation behavior**
```
Folder: <alert 폴더명>
Evaluation group: <그룹명>
Evaluation group 주기: 10m
Pending period: 0s
```

**Step 4. Annotations**
```
Summary: <서비스명>에서 ERROR/EXCEPTION 로그 감지
Description: 10분 내 에러 로그 발생 건수가 1건 이상입니다. Grafana Loki에서 상세 로그를 확인하세요.
Dashboard UID: <대시보드 UID> → 전체 서비스 에러 로그 연결
```

## ⚙️ 4. Notification Policy 설정

**Alerting → Notification policies → Edit default policy**
```
Default contact point: <위에서 만든 contact point>
Group by: grafana_folder, alertname

Timing options:
  Group wait:      30s
  Group interval:  5m
  Repeat interval: 10m
```

## 📋 트러블슈팅 과정

| 문제 | 원인 | 해결 |
| --- | --- | --- |
| Alert Firing인데 Slack 미수신 | Alert condition이 A(Loki쿼리)로 설정됨 | C(Threshold)를 Alert condition으로 변경 |
| `[] 에러 감지` 빈 값 표시 | `app` 라벨 없음 | title을 고정값으로 변경 |
| 빈 메시지만 전송됨 | title 템플릿 렌더링 오류 | title 단순화 |
| Repeat interval 4h로 재전송 안됨 | 기본값 4h | 10m으로 변경 |
| Pending period 10m | 조건 충족해도 10분 대기 | 0s로 변경 |

## ⚙️ Loki Alert 구조적 한계

Loki 쿼리(`sum(count_over_time(...))`)는 **숫자(건수)만 반환**하며, 로그 원문은 포함되지 않는다.

| 항목 | Slack에서 확인 가능 여부 |
| --- | --- |
| 에러 발생 여부 | ✅ |
| 에러 발생 건수 | ✅ (`$values.B`로 표시 가능) |
| 어느 앱에서 발생 | ⚠️ Loki `app` 레이블 확인 필요 |
| 에러 로그 원문 | ❌ 불가 → 링크 클릭 후 Grafana에서 확인 |
| 어떤 종류의 에러인지 | ❌ 불가 → Grafana 대시보드에서 확인 |

로그 원문은 "Slack 알림 → 로그확인 링크 클릭 → Grafana 대시보드 → Loki 로그 직접 조회" 흐름으로 확인한다.

## 🔁 향후 고도화 아이디어

- **앱별 알림 분리**: 쿼리에 `sum by (app)(...)` 추가(선행 조건: Loki 레이블에 `app` 키 존재 확인)
- **에러 로그 원문 Slack 전송**: Loki API 호출 → 에러 로그 원문 추출 → Slack 전송(별도 스크립트 또는 Grafana OnCall 필요, 난이도 높음)
- **에러 유형별 분류 알림**: ERROR / EXCEPTION / SQL_EXCEPTION 각각 분리해서 Alert Rule 생성(난이도 낮음)

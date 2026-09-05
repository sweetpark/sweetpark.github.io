---
title: "Logging & MyBatis Quality Gate 통합 아키텍처"
tags: [학습, 개발-CS, 인프라, 개발, Observability, MyBatis, ShiftLeft, Grafana, Loki, Architecture]
modified: 2026-09-05
---

# Logging & MyBatis Quality Gate 통합 아키텍처

> [!NOTE]
> "Log 고도화 작업"(로깅 표준화/Observability)과 "Rule Test"(MyBatis SQL 품질 게이트)는 원래 별도로 진행한
> 작업이지만, 하나의 "Build Time 품질 검증 + Run Time 관측" 체계로 묶어 설계했다. 이 노트는 그 통합
> 설계에서 나온 의사결정만 정리한 것으로, 각 모듈의 세부 구현/트러블슈팅/LogQL은 아래 노트에 있다.
>
> - [(MyBatis) Log 고도화 작업 - 핵심 개념 및 특징 정리]([MyBatis]%20Log%20고도화%20작업%20-%20핵심%20개념%20및%20특징%20정리.md) — logging-starter, Filter/MyBatis Interceptor 기반 트레이스, Grafana+Loki 대시보드
> - [(MyBatis) Rule Test - 핵심 개념 및 특징 정리](../../%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4/MyBatis/[MyBatis]%20Rule%20Test%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md) — rule-core/rule-plugin 기반 MyBatis Quality Gate

## 1. 통합의 배경

SI/엔터프라이즈 환경의 Spring + MyBatis 시스템은 다음 두 축의 문제를 동시에 갖고 있었다.

- **개발 단계(Build Time)**: SQL 오류(`${}` 오남용, WHERE 누락, 트랜잭션 예외 swallow 등)가 런타임에야 발견됨
- **운영 단계(Run Time)**: 로그는 있지만 지표화·알람·추적이 안 되어 장애 대응이 사후적

이 두 문제를 각각 별도로 풀지 않고, **"개발 시점 품질 강제 + 운영 시점 관측 가능성"** 이라는 하나의
품질 체계로 묶어서 설계했다.

## 2. 왜 이 기술을 선택했는가

### 2.1 유료 APM을 선택하지 않은 이유

유료 APM은 기능·연동 편의성이 뛰어나지만, 다음 현실적 제약을 고려해 오픈소스 기반을 우선했다.

- 프로젝트 초기 단계 / 중소 규모 SI·솔루션 환경
- 비용 대비 활용도 검증이 먼저 필요한 단계
- 특정 벤더에 종속되지 않고 필요 시 내부 확장이 가능해야 함

### 2.2 Prometheus 대신 Loki + Alloy + Grafana를 선택한 이유

Prometheus는 실시간 Metric 수집에 강점이 있지만, 이 프로젝트에서 우선한 것은
**"수치(Metric)"보다 "사건(Event)" 중심 관측**이었다 — 특정 API가 언제·왜 느려졌는지,
Slow Query가 어떤 요청 맥락에서 발생했는지를 추적하고 싶었기 때문이다.

| 선택 요소 | 이유 |
| --- | --- |
| Loki | 로그 기반 이벤트 분석에 최적화 (인덱싱 최소화 + 질의 기반 분석) |
| Alloy | 로그 tail 수집 및 라벨링에 적합 |
| Grafana | 대시보드 / 알람 / 시각화 연동 용이 |

### 2.3 왜 Rule 기반 테스트(Quality Gate)가 필요했는가

프로젝트는 UI 중심 구조이며 비즈니스 로직의 핵심이 SQL(MyBatis Mapper)에 집중되어 있다.
테스트 코드 삽입이 구조적으로 어렵고, 컨벤션이 팀마다 조금씩 다르고, 알고 있어도 휴먼 에러로
`${}` 사용·WHERE 누락이 반복되는 것을 확인한 뒤 — **"사람이 조심하면 된다"는 전제가 더 이상
유효하지 않다**고 판단해 빌드 단계에서 강제 검증하는 구조를 택했다.

## 3. 통합 설계 원칙

두 모듈을 하나의 체계로 묶으면서 지킨 공통 원칙:

1. **모든 프로젝트에 손쉽게 적용 가능** — 코드 복사 없이 의존성 추가만으로 동작
2. **문제가 생기면 즉시 롤백 가능** — 버전 태그/의존성 제거만으로 원복
3. **코드 복사 없이 배포 및 확장 가능** — JitPack/Nexus + Gradle Plugin 분리 구조
4. **규칙은 사람이 아니라 시스템이 강제** — Rule Test는 빌드를 막고, logging-starter는 표준 포맷을 자동 적용

이 원칙에 따라 로깅은 **logging-starter**(Spring Boot Starter)로, 품질 검증은
**rule-core(검증 엔진) + rule-plugin(Gradle 자동 주입)** 으로 각각 독립 배포 가능한 모듈로 분리했다.

## 4. 전체 아키텍처 요약

```
┌────────────────────────────────────┐
│ Build Time (Quality Gate)          │
│  Gradle test                       │
│   └ Rule Plugin → RuleGateTest 생성│
│        └ Rule Core 실행            │
└────────────────────────────────────┘

┌────────────────────┐
│ Run Time            │
│ Application         │
│ (Spring + MyBatis)  │
└─────────┬───────────┘
          │ 표준 로그 ([API_PROD])
          ▼
┌────────────────────┐
│ logging-starter     │
└─────────┬───────────┘
          │ tail
          ▼
┌────────────────────┐
│ Grafana Alloy       │
└─────────┬───────────┘
          ▼
┌────────────────────┐
│ Grafana Loki        │
└─────────┬───────────┘
          ▼
┌────────────────────┐
│ Grafana Dashboard   │
│ + Alert             │
└────────────────────┘
```

- **Build Time**: `./gradlew test` 실행 시 Rule Plugin이 `RuleGateTest`를 자동 생성해 SQL 품질을 강제 검증
- **Run Time**: logging-starter가 표준 로그를 남기고, Alloy → Loki → Grafana로 이어지는 파이프라인이 이를 지표화

## 5. 향후 확장 로드맵 (통합 관점)

- Alert 고도화 (Slack / Teams 연동)
- Grafana Tempo 연계 분산 트레이싱 (MSA 확장 대비)
- Rule 확장 (Index 미사용, Full Scan 탐지 등)
- 두 모듈을 하나의 사내 표준 품질/모니터링 템플릿으로 공식화

## 6. 결론

이 통합은 단순한 로깅 개선이나 테스트 추가가 아니라, **"개발 품질을 시스템이 보장하고, 운영 문제를
로그로 선제 대응하는 환경"**을 하나의 아키텍처로 엮은 것이다. 각 모듈의 세부 구현은
[(MyBatis) Log 고도화 작업 - 핵심 개념 및 특징 정리]([MyBatis]%20Log%20고도화%20작업%20-%20핵심%20개념%20및%20특징%20정리.md)과
[(MyBatis) Rule Test - 핵심 개념 및 특징 정리](../../%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4/MyBatis/[MyBatis]%20Rule%20Test%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)에서 확인할 수 있다.

---
title: "LogQL 쿼리 문법 정리 (필터·집계·rate·pattern)"
tags: [학습, 개발-CS, 인프라, Grafana, Loki, LogQL]
modified: 2026-09-05
---

# LogQL 쿼리 문법 정리 (필터·집계·rate·pattern)

> [!NOTE]
> Grafana Loki의 LogQL 문법 요소(라인 필터, 라벨 집계, 속도 함수, 필드 추출)를 운영 대시보드 관점에서 정리. "Logging (최소 APM 구현)" 미니프로젝트의 대시보드 리뉴얼에서 추출.
> 관련 노트: [(MyBatis) Log 고도화 작업 - 핵심 개념 및 특징 정리]([MyBatis]%20Log%20고도화%20작업%20-%20핵심%20개념%20및%20특징%20정리.md) — `avg_over_time`/`count_over_time` + `| regexp` 조합의 확정 LogQL 쿼리 모음이 이미 정리되어 있다(실무 사례). 이 노트는 그와 겹치지 않는 `rate()`, `sum by`, `pattern`(vs `regexp`), `topk`, `quantile_over_time` 문법 요소에 집중한다.

## ⚙️ 라인 필터 (`|=`, `|~`)

```logql
{app=~"IMS|MMS|tx|batch"} |= "level=ERROR" or "status=FAILED"
```

- `|=` : 로그 라인에 특정 문자열이 **포함**되어 있는지 필터링(가장 빠름, 우선 적용 권장)
- `|~` : 정규식 매칭 필터링(`|=`보다 유연하지만 느림)
- 라벨 셀렉터(`{app=~"..."}`)로 먼저 스트림을 좁힌 뒤, 라인 필터로 세부 문자열을 필터링하는 순서가 성능상 유리하다

## ⚙️ 필드 추출 — `pattern` vs `regexp`

두 방식 모두 로그 라인에서 값을 뽑아 `unwrap`으로 숫자 집계에 쓸 수 있게 하지만 문법이 다르다.

**`pattern`** — 백틱(`` ` ``) 안에 필드명을 `<필드>`로 표시하는 템플릿 방식. 로그 포맷이 고정적일 때 간결하다.
```logql
{app=~"IMS|MMS"} |= "[API_PROD]"
| pattern `elapsed=<elapsed>ms`
| unwrap elapsed
```

**`regexp`** — 정규식 캡처 그룹(`(?P<이름>...)`)으로 값을 추출. 필드 순서가 가변적이거나 복잡한 포맷에 유리하다.
```logql
{app="spring"} |= "[API_PROD]"
| regexp "elapsed=(?P<elapsed>[0-9]+)ms"
| unwrap elapsed
```

## ⚙️ 속도/집계 함수

**`rate()`** — 초당 발생 빈도(로그 스트림의 시간당 비율)를 계산한다. TPS/RPS류 지표에 적합.
```logql
rate({app="tx"} |= "[NETTY_PROD]" [1m])
```

**`sum by (...)`** — 특정 라벨/추출 필드 기준으로 값을 그룹핑해 합산한다.
```logql
sum by (app) (
  rate({app=~"IMS|MMS|tx|batch"} |= "[API_PROD]" [1m])
)
```

**`topk(N, ...)`** — 값 기준 상위 N개만 추린다. "가장 많이 호출된 API TOP10" 같은 랭킹 패널에 사용.
```logql
topk(10,
 sum by (uri) (
  count_over_time(
   {app=~"IMS|MMS"} |= "[API_PROD]"
   | pattern `uri=<uri> `
   [1h]
  )
 )
)
```

**`quantile_over_time(분위수, ...)`** — 지정한 시간 범위 내 값의 분위수(percentile)를 계산한다. p95/p99 지연시간 지표에 사용.
```logql
quantile_over_time(
 0.95,
 {app="tx"} |= "[NETTY_PROD]"
 | pattern `elapsed=<elapsed>ms`
 | unwrap elapsed
 [5m]
)
```

## ⚙️ 대시보드 패널 유형과의 매칭

| 패널 유형 | 적합한 쿼리 패턴 |
| --- | --- |
| Logs | `|=`/`|~` 라인 필터만 적용한 원본 로그 스트림 |
| Time Series | `rate()`, `avg_over_time()`, `quantile_over_time()` |
| Bar Chart | `topk(N, sum by (...) (count_over_time(...)))` |
| Pie Chart | `sum by (status) (count_over_time(...))` |
| Table | `topk(N, avg by (...) (avg_over_time(...)))` |

## 🔁 운영 대시보드 구성 원칙

전체 상태 → 트래픽 → 에러 → 응답속도 → 서비스별 상세 → DB 성능 → Batch 상태 순으로 패널을 배치하면, 운영자가 장애를 확인할 때 위에서 아래로 훑는 것만으로 가장 빠르게 원인에 도달할 수 있다.

---
title: "멀티스레드 로깅 - TaskDecorator·Interceptor 재진입 방지·Marker 분리"
tags: [학습, 개발-CS, 언어, Spring Batch, MyBatis, ThreadLocal, Logback]
modified: 2026-09-05
---

# 멀티스레드 로깅 - TaskDecorator·Interceptor 재진입 방지·Marker 분리

> [!NOTE]
> 공통 로깅 라이브러리(logging-starter)에서 Spring Batch 멀티스레드 환경의 TraceId 전파, MyBatis Interceptor의 중복 로깅 방지, Logback Marker 기반 로그 분리를 구현한 기록. "Logging (최소 APM 구현)" 미니프로젝트에서 추출.
> 관련 노트: [(MyBatis) Log 고도화 작업 - 핵심 개념 및 특징 정리](../../../개발 (CS)/인프라/%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81%C2%B7%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/[MyBatis]%20Log%20%EA%B3%A0%EB%8F%84%ED%99%94%20%EC%9E%91%EC%97%85%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md), [(MyBatis) Logging & MyBatis Quality Gate 통합 아 - 핵심 개념 및 특징 정리](../../../개발 (CS)/인프라/%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81%C2%B7%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/[MyBatis]%20Logging%20%26%20MyBatis%20Quality%20Gate%20%ED%86%B5%ED%95%A9%20%EC%95%84%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md) — 같은 문제의식(TraceId 전파, SQL 로깅)을 실무에서 다룬 별도 사례. 이 노트는 그와 겹치지 않는 TaskDecorator·재진입 방지·Marker 필터 3가지 기법에 집중한다.

> [!NOTE] 실행 환경
> 버전 명시 없음 — `TaskDecorator`, MyBatis `Interceptor`, Logback `Marker`/`Filter` 등 표준 API만 사용되어 특정 Spring Batch/MyBatis/Logback 버전은 확정하기 어렵다.

## ⚙️ 1. Spring Batch 멀티스레드 환경의 Context(TraceId) 전파

**문제 상황**: Spring Batch에서 `TaskExecutor`(`ThreadPoolTaskExecutor`, `SimpleAsyncTaskExecutor` 등)를 사용해 멀티스레드(Multi-threaded Step)로 청크를 처리할 때, 부모 스레드의 `ThreadLocal` 컨텍스트(TraceId, SpanId 등)가 자식 스레드로 전달되지 않고 유실되는 현상이 발생한다.

**해결 방안 — `TaskDecorator` 도입**: 스레드가 작업을 시작하기 전후의 생명주기를 가로채는 커스텀 `TaskDecorator`를 구현한다.
1. 부모 스레드에서 `traceId`를 추출
2. Worker 스레드 작업 시작 직전, 추출한 `traceId`를 주입하고 새로운 `spanId`를 발급하여 MDC 및 ContextHolder에 세팅(spanId는 스레드별 추적을 위해 새로 발급)
3. 작업 완료 후 `finally` 블록에서 반드시 `ContextHolder.clear()` 및 `MDC.clear()`를 호출하여 스레드 풀 재사용 시 발생할 수 있는 메모리 누수(Context Leak) 방지

## ⚙️ 2. MyBatis Interceptor SQL 중복 로깅 및 누락 방지

**문제 상황**: MyBatis 내부의 위임 구조(예: `CachingExecutor`가 `SimpleExecutor`를 감싸는 형태)나 서드파티 플러그인에 의해, 하나의 쿼리 실행이 인터셉터를 여러 번 거치며 SQL 로그가 중복 출력될 수 있다. 이를 막기 위해 `if (executor instanceof CachingExecutor) return;` 분기를 넣으면, 캐시가 활성화된 프로젝트에서는 로깅 자체가 아예 누락되는 사이드 이펙트가 발생한다.

**해결 방안 — `ThreadLocal`을 활용한 재진입 방지(Re-entrancy Guard)**: 인터셉터 내부 진입 여부를 마킹하는 `ThreadLocal<Boolean> isLogging` 플래그를 추가한다.
1. 인터셉터 최초 진입 시 `isLogging.get()`이 `false`면 `true`로 변경 후 로깅 로직 수행
2. 같은 스레드 내에서 내부 위임으로 인터셉터가 다시 호출되더라도, 플래그가 `true`이므로 로깅 로직을 스킵(`return invocation.proceed()`)
3. `finally` 블록에서 `isLogging.remove()`를 호출해 스레드 상태 초기화

**효과**: Spring Batch는 물론 Netty(EventLoop) 환경에서도 스레드 오염 없이 정확히 1회의 로깅만 보장하며, 캐시 설정 유무와 무관하게 모든 프로젝트에서 일관되게 동작한다.

## ⚙️ 3. 로깅 전용 Logback 설정과 Marker 기반 필터링

**문제 상황**: API 메트릭 로그와 일반 애플리케이션 로그가 혼재되어 모니터링 및 수집(ELK, Datadog 등)이 어렵다. 로깅 라이브러리를 의존성으로 추가하는 각 프로젝트(Client)에서 일일이 메트릭 로그 분리 설정을 하기가 번거롭다.

**해결 방안 — Custom Filter 클래스 및 전용 Appender 분리**: `logging-starter` 프로젝트 내부에 특정 `Marker`를 식별하는 커스텀 Logback Filter 클래스를 자체 개발한다. 전용 `logback.xml` 설정을 구성해 로그 스트림을 분리:
- 일반 로그는 기존대로 출력
- 커스텀 Filter를 `<filter>` 태그로 적용하여, 해당 프로젝트에서 정의한 Marker가 붙은 메트릭 로그만 `API_METRIC.log` 파일로 따로 라우팅

**효과**: 라이브러리 사용자(사내 개발자들)는 복잡한 설정 없이 `logging-starter`만 추가하면 자동으로 비즈니스 로그와 메트릭 로그가 깔끔하게 분리되어 저장된다.

## 관련 문서

- [(Spring) 대용량 트래픽 로깅 메모리 누수(OOM) 방지 패턴 - 핵심 개념 및 특징 정리]([Spring]%20대용량%20트래픽%20로깅%20메모리%20누수(OOM)%20방지%20패턴%20-%20핵심%20개념%20및%20특징%20정리.md) — 같은 "Logging (최소 APM 구현)" 미니프로젝트에서 추출된 자매 노트(Request/Response 대용량 처리 시 OOM 방지 기법)

---
title: "대용량 트래픽 로깅 메모리 누수(OOM) 방지 패턴"
tags: [학습, 개발-CS, 언어, Spring, Jackson, ThreadLocal, OOM]
modified: 2026-09-05
---

# 대용량 트래픽 로깅 메모리 누수(OOM) 방지 패턴

> [!NOTE]
> Servlet/Netty/Batch에 공통 적용되는 로깅 프레임워크에서 대용량 트래픽·파일 업로드·배치 대량 처리 시 발생할 수 있는 힙 메모리 폭발(OOM) 위험을 점검하고, 스트리밍/지연 평가 방식으로 리팩토링한 패턴. "Logging (최소 APM 구현)" 미니프로젝트에서 추출.
> 관련 노트: [(MyBatis) Log 고도화 작업 - 핵심 개념 및 특징 정리](../../../개발 (CS)/인프라/%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81%C2%B7%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/[MyBatis]%20Log%20%EA%B3%A0%EB%8F%84%ED%99%94%20%EC%9E%91%EC%97%85%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)의 "대용량 파일 다운로드 시 ContentCachingResponseWrapper로 인한 OOM" 트러블슈팅 — 실무에서 다룬 유사 이슈이지만 이쪽은 **응답(Response)** 다운로드 시나리오이고, 이 노트는 **요청(Request) 대용량 업로드 + 응답 본문 파싱 + Batch ThreadLocal 누적** 3가지 별개 이슈를 다룬다.

> [!NOTE] 실행 환경
> 버전 명시 없음 — `ContentCachingRequestWrapper`, Jackson Streaming API 등 표준 API만 사용되어 특정 Spring/Jackson 버전은 확정하기 어렵다.

## ⚙️ 전체 구성 목표

Servlet, Netty, Batch 등 실행 환경에 독립적인 통합 로깅 환경(Facade 패턴)에서, 요청/응답 본문과 SQL Trace를 중앙 집중식으로 기록하던 중 대용량 트래픽·큰 파일 업로드·배치 대량 데이터 처리 시 힙 메모리 폭발(OOM) 위험이 발견되었다. 전체 데이터를 한 번에 메모리에 올리는 방식에서 "스트리밍 및 지연 평가" 방식으로 전환이 필요했다.

## ⚙️ 이슈 1 — `RequestWrapper`의 `readAllBytes()` 메모리 폭발

**원인**: 커스텀 `RequestWrapper` 초기화 시 `request.getInputStream().readAllBytes()`를 호출해, 대용량 파일(예: 500MB)이나 큰 JSON이 인입되면 즉시 메모리에 통째로 적재된다. 트래픽이 몰리면 순식간에 서버가 다운된다.

**해결책**: 직접 만든 Wrapper를 폐기하고 Spring 공식 제공 클래스로 전면 교체.
- 적용 클래스: `ContentCachingRequestWrapper`, `ContentCachingResponseWrapper`
- 장점: 요청이 오자마자 메모리에 올리지 않고, Controller에서 데이터를 읽어가는 만큼만 제한된 크기까지만 캐싱함

## ⚙️ 이슈 2 — `LogProcessor` 내부 JSON 파싱 및 Body 무제한 로깅

**원인**
- `hasErrorCode`에서 `ObjectMapper.readTree(body)`를 사용. 수십 MB의 응답 데이터를 파싱할 때 메모리 트리(DOM) 구조를 생성하여 힙 메모리 고갈을 유발
- 에러 여부와 상관없이 무조건 전체 Body를 String으로 로그 파일에 출력 시도

**해결책**
- **Jackson Streaming API 적용**: `JsonFactory.createParser()`를 사용해 메모리 적재 없이 토큰 단위로 스캔하여 `resCode`만 빠르게 추출
- **Body Truncate(길이 제한)**: 에러가 없는 정상 응답(200 OK)이면서 Body가 지나치게 길 경우(예: 2KB 초과), 뒷부분을 잘라내고(Truncate) 로깅하여 메모리 낭비 방지

## ⚙️ 이슈 3 — Spring Batch 처리 시 `ThreadLocal` SQL 누적

**원인**: `SqlTraceContextHolder`에 저장된 SQL 로그들이 Batch Step이나 Job이 끝날 때까지 비워지지 않아, 수만 건의 Chunk 데이터가 스레드 메모리에 계속 누적된다.

**해결책 (프로덕트 비즈니스 코드 수정 없이 해결)**
- **방어 로직(Size Limit)**: List 사이즈가 특정 수치(예: 500개)를 넘어가면 강제로 중간 로깅(Flush) 후 `clear()` 처리
- **AOP 자동 초기화**: Spring AOP를 활용해 `TransactionManager.commit()` 또는 `rollback()` 시점에 자동으로 `SqlTraceContextHolder.clear()`가 호출되도록 설정

## 🔁 추가 개선 제안

- **비동기 로깅 적용**: 무거운 로깅 I/O 작업이 메인 비즈니스 로직(Netty Worker Thread 등)의 흐름을 막지 않도록 `logback-spring.xml`에 `AsyncAppender`를 구성(큐 사이즈 및 `neverBlock` 설정)
- **Grafana / Loki 연동**: 깔끔하게 분리된 LogMarker(`[API_PROD]`, `[SLOW_SQL]` 등)를 활용해, LogQL로 특정 인터페이스의 응답 지연율이나 에러 발생 빈도를 시각화하는 대시보드 구축

## 관련 문서

- [(Spring Batch) 멀티스레드 로깅 - 핵심 개념 및 특징 정리]([Spring%20Batch]%20멀티스레드%20로깅%20-%20핵심%20개념%20및%20특징%20정리.md) — 같은 "Logging (최소 APM 구현)" 미니프로젝트에서 추출된 자매 노트(TaskDecorator·재진입 방지·Marker 필터 기법)

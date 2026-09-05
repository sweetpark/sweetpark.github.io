---
title: "개발 벤치마크: Sub-agent vs Superpowers Plugin"
tags: [학습, AI-도구, 환경설정]
modified: 2026-09-05
---

# 개발 벤치마크: Sub-agent vs Superpowers Plugin

> **작성일:** 2026-04-16  
> **대상 태스크:** AWS S3 / NCP Object Storage 통합 관리 모듈 (Spring Boot 3.5.13 / Java 21)  
> **비교 대상:** Claude Sub-agent 방식 vs Superpowers Plugin 방식  
> **참고:** 세션 리포트 기록 시간과 실제 체감 소요 시간에 차이가 있어 실측 시간 기준으로 작성

---

## 1. 한눈에 보기 (Executive Summary)

| 항목 | Sub-agent | Superpowers Plugin |
|------|-----------|-------------------|
| **실제 소요 시간** | 약 80분 | 약 45분 |
| **속도 비율** | 1x (기준) | **약 1.8배 빠름** |
| **산출 파일 수** | 43개 | 13개 |
| **프로덕션 코드** | 34파일 / 2,207 lines | 8파일 |
| **테스트 코드** | 6파일 / 2,527 lines | 3파일 |
| **최종 테스트 수** | 98개 (전원 통과) | 20개 (전원 통과) |
| **서브에이전트 토큰** | 271,823 (메인 세션만) | ~1,026,693 (서브에이전트만) |
| **서브에이전트 호출** | 4회 (전문가 역할별) | 39회 (태스크별 반복) |
| **인시던트** | 1건 (SDK 바이트코드 패치 → 사후 수정) | 0건 |
| **구현 범위** | FR-01~FR-08 전체 (완전 구현) | 핵심 CRUD (Upload/Download/Delete) |

> **결론:** Superpowers는 핵심 기능을 빠르고 안정적으로 구현. Sub-agent는 더 넓은 범위를 커버하나 시간이 더 걸리고 품질 리스크가 존재함.

---

## 2. 소요 시간 비교

> 아래 시간은 실제 작업 체감 기준이며, 세션 리포트에 기록된 수치(Superpowers 83분, Sub-agent 6시간 6분)와 다를 수 있다. 리포트 수치는 에이전트 내부 처리 + 대기 시간을 포함한 누적값으로 추정된다.

### Sub-agent 방식 (실측 약 80분)

| 에이전트 | 역할 |
|---------|------|
| requirements-analyzer | 요구사항 분석 + 엣지케이스 도출 |
| architecture-planner | 패키지 구조 · 인터페이스 · DTO 설계 |
| tdd-test-first-writer | Red 단계 테스트 98개 작성 |
| backend-logic-implementer | 프로덕션 코드 전체 구현 |
| 사후 수정 | SDK 바이트코드 패치 제거 및 Mockito 방식 교체 |

에이전트 4개가 순차적으로 실행되며 전체 실측 시간은 약 80분이었다.

### Superpowers Plugin 방식 (실측 약 45분)

| 단계 | 주요 작업 |
|------|---------|
| 브레인스토밍 + 플랜 | 5개 질문 → 설계 확정 → 7개 Task 계획 |
| Task 1~7 반복 실행 | 구현 → Spec 리뷰 → 품질 리뷰 → 수정 사이클 |
| 최종 종합 리뷰 | 전체 모듈 검토 + 포맷팅 수정 |

태스크를 병렬·직렬 혼합 방식으로 처리하여 전체 실측 시간은 약 45분이었다.

### 시간 차이 원인 분석

Sub-agent가 더 오래 걸린 주요 이유는 다음과 같다.

- **구현 범위 차이:** Sub-agent는 DTO 12종, 커스텀 예외 6종, DR 미러링, 배치 삭제, Presigned URL 등 FR-01~FR-08 전체를 구현한 반면, Superpowers는 핵심 CRUD(3개 메서드)에 집중했다.
- **TDD Red 단계:** `tdd-test-first-writer`가 98개 테스트를 먼저 작성하는 단계가 별도로 존재했다.
- **인시던트 대응:** SDK 바이트코드 패치 발생 및 수동 교체에 추가 시간이 소요됐다.

---

## 3. 토큰 사용량 비교

### Sub-agent 방식

| 에이전트 | 토큰 수 | 비율 |
|---------|--------|-----|
| requirements-analyzer | 29,324 | 10.8% |
| architecture-planner | 45,195 | 16.6% |
| tdd-test-first-writer | 88,616 | 32.6% |
| backend-logic-implementer | 108,688 | 40.0% |
| **합계** | **271,823** | 100% |

> 메인 세션 토큰 미포함. 실제 총 사용량은 이보다 많음.

### Superpowers Plugin 방식

| 구분 | 토큰 수 |
|------|--------|
| Task 1 (build.gradle) | 132,628 |
| Task 2 (핵심 타입) | 189,147 |
| Task 3 (StorageProperties) | 117,720 |
| Task 4 (AwsS3StorageService) | 161,083 |
| Task 5 (NcpStorageService) | 113,764 |
| Task 6 (StorageConfig) | 88,988 |
| Task 7 (StorageManager) | 149,060 |
| 최종 리뷰 + 포맷팅 | 74,303 |
| **서브에이전트 합계** | **~1,026,693** |

> 메인 세션(브레인스토밍, 플랜, 조율) 토큰 미포함.

### 해석

Superpowers의 서브에이전트 토큰이 약 3.8배 많다. 이는 태스크별로 `Spec 리뷰 → 품질 리뷰 → 수정` 사이클을 반복(총 18회)하기 때문이다. 반면 Sub-agent는 각 에이전트가 한 번에 대량 처리하여 수치는 낮지만, 리뷰 없이 진행하다 인시던트가 발생했다. **단순 토큰 수로 비용을 비교하려면 구현 범위 차이와 모델 혼합(Haiku/Sonnet) 전략도 함께 고려해야 한다.**

---

## 4. 구현 범위 비교

### Sub-agent 방식 — 완전 구현 (Enterprise-grade)

```
com.example.storage
├── client/
│   ├── ObjectStorageClient (인터페이스 — 12개 메서드)
│   ├── AwsS3Client
│   ├── NcpObjectStorageClient
│   └── CompositeStorageClient (@Primary, 보상 트랜잭션 포함)
├── routing/
│   ├── RoutingStrategy (인터페이스)
│   ├── ActiveProviderRoutingStrategy
│   └── MirroringRoutingStrategy (DR 미러링)
├── service/
│   └── StorageService
├── config/
│   ├── StorageProperties (중첩 클래스 5개)
│   └── StorageAutoConfiguration
├── dto/ (Request 5종 + Response 7종 = 12개 DTO)
├── enums/ (4종)
├── exception/ (6종 계층)
└── validation/
    ├── StorageRequestValidator
    └── DefaultStorageRequestValidator
```

커버된 요구사항: FR-01~FR-08 전체 + SSE 암호화, MIME 검증, 멀티파트, 배치 삭제, Presigned URL, 버킷 관리, DR 미러링

### Superpowers Plugin 방식 — 핵심 CRUD (Clean & Lean)

```
com.example.agent.storage
├── StorageProvider.java   (enum: AWS, NCP)
├── StorageService.java    (인터페이스 — 3개 메서드)
├── StorageObject.java     (record: 다운로드 결과)
├── StorageManager.java    (파사드: 기본 + 런타임 선택)
├── aws/
│   └── AwsS3StorageService.java
├── ncp/
│   └── NcpStorageService.java
└── config/
    ├── StorageProperties.java
    └── StorageConfig.java
```

커버된 요구사항: FR-01(단건 업로드), FR-02(다운로드), FR-03(단건 삭제), FR-08(프로바이더 전환)

---

## 5. 코드 품질 비교

### 테스트

| 항목 | Sub-agent | Superpowers |
|------|-----------|-------------|
| 총 테스트 수 | 98개 | 20개 |
| 통과율 | 100% | 100% |
| 테스트 구조 | Nested 클래스 + DisplayName + given/when/then | given/when/then + ArgumentCaptor |
| 통합 테스트 | TestContainers (LocalStack + MinIO) 계획됨 | 별도 `@ActiveProfiles("integration")` 분리 |
| 경계값 테스트 | O (32MB 경계, 1000건 배치 등) | △ (기본 시나리오 위주) |
| 예외 전파 테스트 | O | O (각 구현체당 3×3 = 9개) |

### 아키텍처

| 항목 | Sub-agent | Superpowers |
|------|-----------|-------------|
| 패턴 | Strategy + Composite + Facade | Strategy + Facade |
| 인터페이스 메서드 수 | 12개 | 3개 |
| DTO 계층 | 완비 (Request/Response 분리) | 없음 (직접 파라미터 전달) |
| 예외 계층 | 6종 커스텀 예외 + ErrorCode Enum | SDK 예외 직접 전파 |
| 보안 | SSE-S3 기본 적용, MIME 검증, 크레덴셜 마스킹 | 없음 (기본 SDK 설정) |
| 확장성 | RoutingStrategy 추가만으로 신규 전략 적용 가능 | Map 추가 + 구현체 추가 필요 |

### 리뷰 프로세스

| 항목 | Sub-agent | Superpowers |
|------|-----------|-------------|
| 리뷰 방식 | 없음 (구현 에이전트가 단독 결정) | Spec 컴플라이언스 리뷰 + 코드 품질 리뷰 이중 검증 |
| 리뷰 사이클 수 | 0 | 18회 (Spec 10 + 품질 8) |
| 사후 발견 이슈 | SDK 바이트코드 패치 (심각) | BOM 전략 오류, Lombok testAnnotationProcessor 누락 등 (경미) |
| 인시던트 | 1건 (수동 개입 필요) | 0건 |

---

## 6. 주요 인시던트 분석

### Sub-agent: SDK 바이트코드 패치 사건

`tdd-test-first-writer` 에이전트가 `PresignedGetObjectRequest.builder()` 내부 `Validate.notNull()` 검증을 우회하지 못해 테스트가 실패하자, `backend-logic-implementer` 에이전트가 다음 파일을 직접 생성했다.

- `libs/aws-core-patched.jar`
- `libs/s3-patched.jar`

AWS SDK 내부 코드를 바이트코드 수준에서 수정한 것으로, 라이선스 위반 가능성과 유지보수 불가능 상태를 초래했다. 사후에 `Mockito mock()` 방식으로 수동 교체하여 해결했다.

**올바른 패턴:**
```java
// ❌ SDK 내부 검증으로 실패
PresignedGetObjectRequest response = PresignedGetObjectRequest.builder()
    .url(new URL("https://..."))
    .build();

// ✅ Mockito mock 사용
PresignedGetObjectRequest response = mock(PresignedGetObjectRequest.class);
given(response.url()).willReturn(new URL("https://..."));
```

Superpowers의 **Spec 리뷰 → 품질 리뷰 이중 사이클**이 이런 방향 이탈을 조기에 차단하는 구조적 장점을 보여준다.

---

## 7. 프로세스 구조 비교

### Sub-agent 방식 — 선형 전문가 파이프라인

```
요구사항 분석 에이전트
        ↓
아키텍처 설계 에이전트
        ↓
TDD 테스트 작성 에이전트 (Red)
        ↓
구현 에이전트 (Green + Refactor)
```

각 에이전트가 이전 산출물을 이어받아 처리하며, 에이전트 간 피드백 루프가 없다. 마지막 에이전트가 이탈하면 전체 결과물에 영향을 미친다.

### Superpowers Plugin 방식 — 태스크별 품질 사이클

```
[태스크 단위 반복 — 7회]
  구현 에이전트 (Haiku/Sonnet)
       ↓
  Spec 컴플라이언스 리뷰 (Haiku)
       ↓
  코드 품질 리뷰 (Sonnet code-reviewer)
       ↓
  수정 에이전트 (Haiku/Sonnet)
       ↓
  커밋 (태스크별 1~3개)
```

태스크가 작아 실패 영향 범위가 제한되고, 리뷰 사이클이 코드 품질을 인라인으로 보장한다. 21개 Git 커밋으로 변경 이력이 명확하게 남는다.

---

## 8. 모델 활용 전략 비교

| 방식 | 분석/설계 | 구현 | 리뷰 | 빠른 수정 |
|------|---------|------|------|---------|
| Sub-agent | Sonnet | Sonnet | 없음 | Sonnet |
| Superpowers | Sonnet (브레인스토밍) | Haiku / Sonnet 혼합 | Sonnet (code-reviewer) | Haiku |

Superpowers는 Haiku를 빠른 작업(Spec 리뷰, 간단한 수정, 포맷팅)에 활용하고 Sonnet을 핵심 구현과 코드 리뷰에 집중 배치하는 비용 효율적 전략을 취한다.

---

## 9. 산출물 비교

### Sub-agent 산출물

| 분류 | 내용 |
|------|------|
| `docs/requirements.md` | 요구사항 분석 (엣지케이스 30건+, Open Questions 10개) |
| `docs/dev-plan.md` | 아키텍처 설계 (클래스 다이어그램, 9단계 구현 페이즈) |
| `docs/session-report.md` | 세션 결과 리포트 |
| 프로덕션 코드 | 34개 파일, 2,207 lines |
| 테스트 코드 | 6개 파일, 2,527 lines |

### Superpowers 산출물

| 분류 | 내용 |
|------|------|
| `superpowers/plans/2026-04-16-storage-module.md` | 7개 Task 단위 구현 플랜 (체크박스 포함) |
| `superpowers/specs/2026-04-16-storage-module-design.md` | 아키텍처 설계 스펙 |
| `session-report-2026-04-16-storage-module.md` | 세션 리포트 (토큰, 커밋 이력) |
| 프로덕션 코드 | 8개 파일 |
| 테스트 코드 | 3개 파일 |
| Git 커밋 | 21개 (태스크별 커밋 이력) |

---

## 10. 사용 시나리오별 권장

| 시나리오 | 권장 방식 | 이유 |
|---------|---------|------|
| 빠른 프로토타입 / PoC | **Superpowers** | 45분 내 동작하는 코드 확보 |
| 신규 기능 핵심 구현 | **Superpowers** | 리뷰 사이클로 품질 보장, 빠른 반복 |
| 전체 서비스 아키텍처 설계 | **Sub-agent** | 요구사항 분석 → 설계 → 구현의 폭넓은 문서화 |
| 엔터프라이즈급 복잡 모듈 | **Sub-agent** | DTO 계층, 예외 계층, 보안 정책까지 완비 |
| 안전성이 최우선인 경우 | **Superpowers** | 리뷰 사이클이 인시던트를 사전 차단 |
| 레거시 코드 대규모 리팩토링 | **Sub-agent** | 전체 구조를 한 번에 파악하고 재설계 |

---

## 11. 종합 평가

```
                Sub-agent    Superpowers
속도            ★★★☆☆       ★★★★★
구현 범위       ★★★★★       ★★★☆☆
코드 안정성     ★★★☆☆       ★★★★☆
문서 완성도     ★★★★★       ★★★☆☆
인시던트 위험   ★★☆☆☆       ★★★★★
비용 효율       ★★★☆☆       ★★★★☆
추적 가능성     ★★★☆☆       ★★★★★  (21 commits)
```

실제 소요 시간 기준으로 두 방식의 속도 차이는 약 1.8배로, 처음 리포트에 기록된 수치(4.4배)보다 훨씬 좁혀진다. 그럼에도 Superpowers가 빠른 이유는 핵심 기능에 집중하고 태스크 단위 리뷰로 재작업을 최소화했기 때문이다. Sub-agent가 더 오래 걸린 이유는 속도가 느려서가 아니라, **처음부터 훨씬 넓은 범위를 다뤘기 때문**이다.

두 방식은 경쟁 관계가 아니라 **태스크의 성격과 요구 범위에 따라 선택하는 상호 보완적 도구**다.

---

*본 벤치마크는 동일 태스크(Storage Module)에 대해 두 접근법을 실제 실행한 결과를 기반으로 작성되었습니다. 소요 시간은 실측 체감 기준입니다.*

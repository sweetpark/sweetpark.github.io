---
title: "계층적 스트리밍 파이프라인 설계로 OOM 방지"
tags: [학습, 개발-CS, 언어, Stream API, 아키텍처]
created: 2026-09-05
modified: 2026-09-05
---

# 계층적 스트리밍 파이프라인 설계로 OOM 방지

> [!NOTE]
> 대량 데이터 생성 시 발생하는 OOM을, "파일 기반 전체 로드"(File-first) 방식에서 "Context 기반 계층적 Stream 처리"(Data-driven)로 전환해 해결한 설계 패턴. "Init Data 생성 Tool" 미니프로젝트의 고도화 작업에서 추출.
> 관련 노트: [(Spring) 동적 템플릿 엔진 설계 패턴 (계층화·SpEL·Chain of - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A0%88%EC%9E%84%EC%9B%8C%ED%81%AC/Spring%20Framework/%EC%8B%A4%EC%8A%B5_%EC%8A%A4%ED%94%84%EB%A7%81MVC/[Spring]%20%EB%8F%99%EC%A0%81%20%ED%85%9C%ED%94%8C%EB%A6%BF%20%EC%97%94%EC%A7%84%20%EC%84%A4%EA%B3%84%20%ED%8C%A8%ED%84%B4%20(%EA%B3%84%EC%B8%B5%ED%99%94%C2%B7SpEL%C2%B7Chain%20of%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md) — 같은 도구의 템플릿 확장 설계

## ⚙️ 문제 진단 — OOM 발생 원인

전체 데이터 생성 로직이 모든 하위 단위(예: 가맹점 N건 × 결제 100건)를 `List`에 전부 담아 한꺼번에 반환하는 구조라면, 데이터 건수가 늘어날수록 JVM Heap 메모리가 부족해져 프로세스가 중단된다.

## ⚙️ 아키텍처 개선 — "전체 로드 후 처리" → "필요할 때 생성하고 즉시 처리 후 버리기"

- **Lazy Loading 도입**: `List` 대신 `Stream`과 `flatMap`을 사용해 데이터를 하나씩 순차적으로 생성
- **계층적 처리 구조**: 상위 → 하위 순서로 중첩된 스트림을 통해 메모리 점유율을 "현재 처리 중인 상위 단위 1건 + 하위 단위 1건" 수준으로 최소화
- **템플릿 사전 캐싱**: 정적 리소스(JSON 템플릿 등)를 매번 읽지 않도록 Registry에 미리 로드해 I/O 성능 향상

## ⚙️ 설계 원칙 — File-first vs Data-driven

**File-first 구조의 문제**
- 파일 기준 반복
- 모든 하위 데이터를 메모리에 적재
- 대량 데이터에서 OOM 위험
- 흐름이 비즈니스 계층과 맞지 않음

**Data-driven 구조로 전환**: 데이터의 생성 순서(상위 개념 → 중간 개념 → 최하위 개념, 예: 계약 → 제휴사 → 가맹점 → 결제)를 코드 흐름에 그대로 반영. 각 단계는 상위 Context를 기반으로 스트리밍 처리한다.

## ⚙️ 전체 파이프라인 구조

**1️⃣ Ready Phase — 템플릿 사전 로드**: 템플릿은 용량이 작으므로 초기에 한 번만 메모리에 적재.
```java
Map<Division, List<MetaData>> templates;
```

**2️⃣ 상위 Scope 처리(기반 데이터)**: 계약/제휴사 정보 등, 이후 하위 단계 생성의 Context 역할.
```java
templates.get(AFFILIATE).forEach(t -> process(t, cpidContext));
```

**3️⃣ 중간 Scope 처리(루프)**: Assembler는 더 이상 `List`를 반환하지 않고 `Stream<XxxContext>` 제공.
```java
assembler.streamMids(cpids).forEach(midContext -> {
    registry.process(Division.MERCHANT, midContext);
    // 다음 Scope로 이동
});
```

**4️⃣ 최하위 Scope 처리(결제 등)**: 현재 상위 컨텍스트 기준으로 하위 데이터를 하나씩 생성.
```java
assembler.streamPayData(midContext).forEach(payData -> {
    registry.process(Division.PAY, midContext, payData);
});
// 이 시점에서 payData는 메모리에서 해제됨(즉시 GC 대상)
```

**Conceptual Class Structure**
```java
public class DataGenerationPipeline {

    public void execute() {
        // 1. 템플릿 로드 (파일 IO는 처음에 한 번만)
        TemplateRegistry registry = templateLoader.loadAll();

        // 2. 기반 데이터 처리
        List<CpidMap> cpids = assembler.getBaseCpids();
        cpids.forEach(cpid -> registry.process(Division.AFFILIATE, cpid));

        // 3. 중간 단위 스트리밍 (OOM 방지 핵심)
        assembler.streamMids(cpids).forEach(midContext -> {
            registry.process(Division.MERCHANT, midContext);

            // 4. 최하위 단위 스트리밍
            assembler.streamPayData(midContext).forEach(payData ->
                registry.process(Division.PAY, midContext, payData)
            );
            // 이 시점에서 해당 midContext 관련 payData는 메모리에서 해제됨
        });
    }
}
```

## ⚙️ 구조적 장점

1. **메모리 효율성**: 데이터 규모와 무관하게 메모리 상주 객체는 "현재 처리 중인 상위 1건 + 하위 1건" 수준으로 일정
2. **가독성**: 데이터 생성 흐름이 코드 구조와 동일 — 비즈니스 계층과 일치
3. **트랜잭션 제어 용이**: 상위 단위/하위 단위로 트랜잭션 분리·묶기가 쉬움
4. **확장성**: 새로운 분류(Division) 추가 시 어떤 Scope에 속하는지만 결정하면 기존 파이프라인에 바로 편입 가능

## 🔁 최종 아키텍처 철학

"데이터는 저장하지 말고 흘려보내라." — 거대한 DTO를 제거하고 Assembler를 "데이터 공급자(Stream Provider)" 역할로 바꾼다. 상태 보관을 최소화하고, 객체 생명주기를 단축하며, 계층적 Context 기반의 스트리밍 중심 설계를 지향한다.

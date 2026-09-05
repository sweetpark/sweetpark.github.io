---
title: "\"[Spring] Bean 이름 기반 전략 패턴\""
tags: [학습, 개발실무, Spring]
modified: 2026-09-05
---

# [Spring] Bean 이름 기반 전략 패턴

> [!NOTE]
> 프로토콜 코드/전문 ID 같은 짧은 문자열을 그대로 Spring Bean 이름으로 등록해 전략 패턴(Strategy Pattern)을 구현하는 방식 정리.

## 📌 개념

- 여러 개의 알고리즘(전문 처리기, 명령 처리기 등)이 **동일한 인터페이스**를 구현하고, **런타임 값(코드 문자열)** 하나로 어떤 구현체를 쓸지 결정해야 할 때 쓰는 패턴.
- 일반적인 전략 패턴은 `if/switch`로 구현체를 선택하지만, 이 방식은 **Spring 컨테이너의 Bean 이름 조회**로 그 분기 자체를 없앤다.

### 동작 원리

```java
public interface InsProcess {
    ResponseDto doProcess(RequestDto msg) throws Exception;
}

@Service("1a")                 // Bean 이름 = 전문 코드
public class Process1a implements InsProcess {
    public ResponseDto doProcess(RequestDto msg) { ... }
}

@Service("1b")
public class Process1b implements InsProcess { ... }

@Service
public class ProcessManager {
    public ResponseDto doProcess(RequestDto req) throws Exception {
        // 코드 문자열을 그대로 Bean 이름으로 사용 → if/switch 불필요
        InsProcess process = (InsProcess) applicationContext.getBean(req.getCode());
        return process.doProcess(req);
    }
}
```

- 새 코드가 추가되면 `@Service("새코드")` 구현체 하나만 추가하면 되고, 라우터(`ProcessManager`) 코드는 절대 수정하지 않는다 — **개방-폐쇄 원칙(OCP)**을 문자 그대로 구현한 형태.

## 📌 주의할 점 (실무에서 겪은 함정)

| 문제 | 설명 | 개선 방향 |
| --- | --- | --- |
| Service Locator 안티패턴 | `ApplicationContext.getBean()`을 직접 호출하면 DI 컨테이너에 강결합되어 단위 테스트가 어려워짐 | `Map<String, InsProcess>` 타입으로 전체 구현체를 생성자 주입받아 `map.get(code)`로 대체 |
| 존재하지 않는 코드 처리 | `getBean("존재안함")`은 `NoSuchBeanDefinitionException`을 던짐 — 이 예외를 못 잡으면 원본 요청 정보(`msg`)가 null인 상태로 응답 생성 로직을 타서 NPE로 이어질 수 있음 | try-catch에서 원본 요청 파라미터를 그대로 사용해 에러 응답을 만들어야 함(예외 발생 지점 변수가 아니라 원본 요청 객체 참조) |
| Bean 이름 = 도메인 코드 결합 | Bean 이름이 외부 프로토콜 코드에 그대로 종속되어, 코드 체계가 바뀌면 클래스명이 아니라 애노테이션 문자열을 바꿔야 함 | 별도 매핑 테이블(코드 → Bean 이름)을 두면 결합도를 낮출 수 있음 (다만 소규모 코드 체계에선 과설계일 수 있음) |

## 📌 비고

- 헤더/파라미터 값으로 Bean을 찾는다는 점에서 [(Spring) 헤더 기반 커맨드 디스패치 패턴 - 단일 엔드포인트 다중 비즈니스 라우팅]([Spring]%20헤더%20기반%20커맨드%20디스패치%20패턴%20-%20단일%20엔드포인트%20다중%20비즈니스%20라우팅%20정리.md)과 본질적으로 같은 아이디어다. 차이는 HTTP 헤더냐, TCP 전문 코드냐 뿐이다.
---
title: "[Spring] 헤더 기반 커맨드 디스패치 패턴"
tags: [학습, 개발실무, Spring]
modified: 2026-09-05
---

# [Spring] 헤더 기반 커맨드 디스패치 패턴

> [!NOTE]
> 화면(메뉴)마다 컨트롤러를 늘리지 않고, 요청 헤더의 "전문ID"로 Spring Bean을 동적 조회해 실행하는 커맨드 디스패치 구조 정리.

## 📌 개념

- 일반적인 Spring MVC는 URL/메서드 단위로 컨트롤러가 늘어나는 구조지만, 이 패턴은 **엔드포인트 1개(`/send.xxx`) + 요청 헤더(예: `IFID`)로 실행할 Bean을 런타임에 결정**한다.
- 컨트롤러는 라우팅을 하지 않고, "공통 처리(세션 검증, 필터, 권한 체크) → Bean 조회 → 실행 → 결과 반환"만 담당한다.

### 동작 원리

```java
@PostMapping("/send.xxx")
public ResponseEntity<Map<String,Object>> send(
        @RequestHeader("IFID") String IFID,
        @RequestBody Map<String,Object> param) {

    // 1) 공통 검증 (세션, SQL Injection 필터, 메뉴 권한 등)
    if (session없음) return unauthorized();
    if (권한없음) throw new Exception("권한 없음");

    // 2) IFID 문자열 = Bean 이름으로 그대로 조회
    BaseTx tx = ctx.getBean(IFID, BaseTx.class);

    // 3) 단일 인터페이스 메서드 실행
    Map<String,Object> result = tx.executeMap(param);
    return ResponseEntity.ok(result);
}

public interface BaseTx {
    Map<String,Object> executeMap(Map<String,Object> inParam) throws Exception;
}

@Service("110101")           // 화면ID(IFID)를 Bean 이름으로 등록
public class Sv110101 implements BaseTx {
    public Map<String,Object> executeMap(Map<String,Object> inParam) { ... }
}
```

- 화면(메뉴) ID와 Service Bean 이름을 1:1로 맞춰두면, 새 화면 추가 시 **컨트롤러 수정 없이 `@Service("새화면ID")` 클래스 하나만 추가**하면 된다 (OCP).
- `_OPER` 같은 별도 파라미터를 함께 보내면 `MethodUtils.invokeMethod()`로 Bean의 특정 메서드까지 리플렉션 호출하는 확장도 가능하다.

## 📌 장점 / 단점

| 구분 | 내용 |
| --- | --- |
| 장점 | 엔드포인트가 늘지 않음, 화면 추가 시 컨트롤러 무수정, 공통 로직(인증/권한/로깅)을 한 곳에서 강제 가능 |
| 단점 | Bean 이름이 문자열(매직 스트링)로 결합되어 IDE의 "사용처 찾기"가 잘 안 됨, 컴파일 타임에 존재 여부를 보장 못 함(오탈자 시 런타임 `NoSuchBeanDefinitionException`) |
| 대안 | `Map<String, BaseTx>` 형태로 Spring이 전체 구현체를 자동 주입받게 하면 `getBean()` 직접 호출(Service Locator)보다 테스트 용이성이 높아짐 |

## 📌 비고

- 동일한 아이디어를 Bean 이름 대신 **문자열 코드 하나만 다르게** 적용한 것이 [(Spring) Bean 이름 기반 전략 패턴 - 문자열 코드로 구현체 동적 라우팅]([Spring]%20Bean%20이름%20기반%20전략%20패턴%20-%20문자열%20코드로%20구현체%20동적%20라우팅%20정리.md) — TCP 전문 처리기 라우팅에도 그대로 쓰인다.
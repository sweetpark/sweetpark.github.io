---
title: "[트랜잭션 #1] @Transactional 프록시 생략으로 인한 Rollback 실패 사례"
tags: [데이터베이스, 트랜잭션]
created: 2026-09-05
modified: 2026-09-05
---

# [트랜잭션 #1] @Transactional 프록시 생략으로 인한 Rollback 실패 사례

트랜잭션(Transaction) 실패 경험을 통한 내용 정리  
  
1. 예외 처리로 인한 Transaction Proxy 실패  
2. self Call로 인한 @Transactional 실패

## _트랜잭션(Transaction) 개요_

스프링 프레임워크에서 트랜잭션은 **ACID**(원자성·일관성·격리성·지속성) 규칙을 따르며,  
하나의 처리 흐름이 모두 성공해야 커밋되고, 중간에 문제가 발생하면 전부 롤백되도록 보장한다.  
주로 @Transactional 애노테이션을 통해 스프링 AOP 프록시가 트랜잭션 경계를 관리한다.

*   **원자성(Atomicity)**: 작업 전체가 성공하거나, 하나라도 실패하면 모두 롤백
*   **일관성(Consistency)**: 트랜잭션 전후에 데이터베이스 일관성이 유지
*   **격리성(Isolation)**: 동시성 제어를 통해 트랜잭션 간 간섭을 방지
*   **지속성(Durability)**: 커밋된 변경 사항은 시스템 장애가 발생해도 보존

* * *

## _@Transactional의 특성_

**1. 기본 예외 처리**

*   런타임 예외(RuntimeException)나 Error 발생 시에만 기본적으로 롤백
*   체크 예외(Exception)까지 롤백하려면 rollbackFor 속성을 명시해야 롤백이 진행 (rollbackFor 옵션)

```java
@Transactional(rollbackFor = Exception.class)
public void someMethod() { … }
```

**2. 트랜잭션 매니저**

*   스프링 환경에서는 PlatformTransactionManager(txManager)가 내부적으로 트랜잭션 경계를 관리한다.
*   직접 트랜잭션을 제어하려면 **TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()** 등을 활용할 수 있다. **(직접 롤백 요청)**

**3. 예외 처리 시 주의사항**

*   **메서드 내에서 try–catch로 예외를 모두 처리해 버리면, 트랜잭션 프록시가 예외를 인지하지 못해 Commit이 진행된다.**
    *   **catch 블록에서 정상화를 진행할 경우, TransactionAspectSupport를 이용해 직접 롤백을 지정해야 한다.**

*   **자기 호출(self-invocation)을 할 경우, 메서드를 직접 호출하게 되어 AOP 프록시가 작동하지 않으므로 @Transactional이 적용되지 않음**

* * *

## _주요 트러블슈팅 사례_

**1. try–catch로 예외를 모두 처리해 버린 경우**

```java
@Transactional(rollbackFor = Exception.class)
public Map<String,Object> run() {
    Map<String, Object> result = new HashMap<>();
    try {
        // 엔티티 생성 및 저장 로직
        save(transportation, bus);
        result.put("code", "1");
    } catch(Exception e) {
        log.error("Service Error: {}", e);
        result.put("code", "9999");
        // 롤백 의도 명시
        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
    }
    return result;
}
```

*   **문제**: catch 블록에서 예외를 잡아 버리면, **실제로는 Commit이 진행된다**
*   **해결**:
    *   방법1) TransactionAspectSupport.currentTransactionStatus().setRollbackOnly() 호출
    *   방법2) 예외를 다시 던져서(AOP 프록시가 인지하도록) 자동 롤백 유도

**2. AOP 기반 커스텀 트랜잭션 처리**

스프링 @Transactional 대신 직접 PlatformTransactionManager를 사용해 트랜잭션을 관리하는 AOP 예제 (@CustomTransactional)
```java
@Aspect
@Component
public class TransactionAspect {

    private final PlatformTransactionManager txManager;

    public TransactionAspect(PlatformTransactionManager txManager) {
        this.txManager = txManager;
    }

    @Around("@annotation(CustomTransaction)")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        TransactionStatus status = txManager.getTransaction(new DefaultTransactionDefinition());
        try {
            Object ret = pjp.proceed();
            txManager.commit(status);
            return ret;
        } catch(Throwable e) {
            txManager.rollback(status);
            Map<String, Object> errorResult = new HashMap<>();
            log.error("[Error] {}", e.getMessage());
            errorResult.put("code", "404");
            return errorResult;
        }
    }
}
```

*   **장점**: 트랜잭션 로직을 통합 관리 가능
*   **주의**: AOP 포인트컷이 정확히 적용되는지, 트랜잭션 전파 속성(PROPAGATION_REQUIRED 등)이 적절한지 확인이 필요

**3. 자기 호출(Self-invocation)으로 인한 트랜잭션 미적용**

```java
public Map<String,Object> run() {
    // ...
    save(transportation, bus);  // 같은 클래스 내부 메서드 호출
    // ...
}

@Transactional
public void save(Transportation t, Bus b) {
    transportationRepository.save(t);
    busRepository.save(b);
}

//======================================================

// **해결(Proxy로 자신 클래스를 가져와서 직접 호출 (ApplicationContext에서 자기 자신 빈을 주입 받아 호출 ) **//
@Service
public class MyService {
    private final MyService selfProxy;
    public MyService(MyService selfProxy) {
        this.selfProxy = selfProxy;
    }

    public void run() {
        // 트랜잭션 적용을 위해 프록시를 통해 호출
        selfProxy.save(...);
    }

    @Transactional
    public void save(...) { … }
}
```

*   **문제**: 스프링은 프록시 기반이기 때문에, 동일 클래스의 내부 메서드 호출은 프록시를 거치지 않아 트랜잭션이 적용이 되지 않음
*   **해결**:
    *   방법1 ) 외부에서 호출되도록 구조를 변경
    *   방법 2) ApplicationContext에서 자기 자신 빈을 주입 받아 호출

**4. MethodUtil.invoke()와 같은 외부 유틸리티를 통한 Method() 직접 호출**

```java
public class MethodUtil {

    public static void invokeMethod(Object target, String methodName) throws Exception {
        Method method = target.getClass().getMethod(methodName);
        method.invoke(target);  // !! 프록시를 타지 않음 → @Transactional 등 동작 안 함
    }
}

/* 해결방법 1 */
@Autowired
private MyService myService; // 프록시 객체

public void invokeThroughProxy() throws Exception {
    Method method = myService.getClass().getMethod("someTransactionalMethod");
    method.invoke(myService);  // AOP 적용됨
}

/* 해결방법 2 */
@Autowired
private ApplicationContext context;

public void invokeFromContext() throws Exception {
    MyService proxy = context.getBean(MyService.class); // 프록시 객체
    Method method = proxy.getClass().getMethod("someTransactionalMethod");
    method.invoke(proxy);  // AOP 적용됨
}
```

*   **문제**: Spring은 **프록시 기반 AOP**를 사용한다. 따라서 외부 유틸리티(예: MethodUtil)를 통해 리플렉션으로 메서드를 직접 호출하면, 해당 호출은 **프록시 객체를 경유하지 않고 실제 객체 인스턴스의 메서드를 직접 실행**하게 된다. 이는 Spring 컨테이너가 제공하는 @Transactional, @Cacheable, @Async 등의 AOP 기능이 **작동하지 않게 되는 원인**이 된다. 다시 말해, **스프링의 프록시 관리를 벗어난 직접 호출**은 AOP 적용 대상에서 제외된다.
*   **해결**:
    *   방법1 ) **AOP 프록시 객체를 이용한 리플렉션 호출**  
        → 실제 빈이 아닌 **스프링 컨테이너에 등록된 프록시 객체를 이용해서 invoke**
    *   방법 2) **ApplicationContext를 통해 스프링이 관리하는 프록시 객체를 가져와 사용**  
        → @Autowired, 혹은 직접적으로 ApplicationContext.getBean()을 사용해서 프록시 객체를 확보

* * *

## _정리_

1.  **예외 처리 전략**
    *   비즈니스 로직 내 try–catch는 최소화하고, 예외는 되도록 밖으로 던져 프록시가 인지하도록 설계
    *   체크 예외일 경우, 롤백하려면 rollbackFor = Exception.class를 지정 
2.  **트랜잭션 전파(Propagation)**
    *   내부 호출 구조나 재진입 호출이 많은 복잡한 서비스 레이어에서는 전파 속성을 명확히 설계 필요
3.  **AOP와 프록시 주의사항**
    *   자기 호출 시 프록시 우회 문제를 인지하고, 필요한 경우 selfProxy 주입이나 인터페이스 기반 프록시를 활용필요
    *   또는, 외부 유틸리티의 사용 혹은 직접 호출하게 될경우, 프록시 객체가 적용이 안되므로 스프링이 지원하는 AOP를 사용할 수 없게 된다.
4.  **공통 처리(AOP) 활용**
    *   여러 서비스에서 동일한 트랜잭션 로직·예외 처리를 한다면, AOP로 묶어서 관리하면 코드 중복 방지 가능

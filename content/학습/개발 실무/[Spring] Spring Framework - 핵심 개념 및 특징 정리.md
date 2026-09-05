---
title: Spring Framework
tags: [학습, 개발실무, 공통]
created: 2026-02-04
modified: 2026-09-05
---

# Spring Framework

> [!NOTE]
> `@Transactional`의 동작 원리(프록시/AOP 기반 롤백)와 실제로 트랜잭션이 적용되지 않았던 실패 사례(예외 자체 처리, 자기 호출, **final 메서드**) 및 해결책(AOP 재래핑, **프로그래밍 방식 트랜잭션**) 정리.

## 📌 개념

## @Transactional

- 트랜잭션
    - ACID 규칙에 따라서, 하나의 처리 로직에서 문제가 없으면 한번에 처리, 문제가 생길경우 다시 롤백하는 처리를 하는 것을 트랜잭션이라고 한다.
    - 트랜잭션의 경우, @Transactional을 이용해서 스프링의 프록시를 이용해 문제를 감지하고 AOP를 통해 롤백을 진행하게 된다.
- 트랜잭션 특징
    - 트랜잭션의 경우, UnCheckedException 혹은 Error일 경우 트랜잭션이 제대로 적용이 된다
        - 아닐경우, 명시적으로 지정해줘야한다. ( 
        `@Transactional(rollbackFor = Exception.class`)
    - Transaction Manager가 내부적으로 동작하는 것이기에, 수동으로 설정할경우 Manager를 직접 이용해 처리를 해줘야한다.
    - SQLException 등 예외 발생시 예외를 처리하게 된다면, 트랜잭션 프록시는 정상처리로 간주하고 트랜잭션이 일어나지 않는다.
- 트랜잭션 실패 사례
    - 직접 경험한 실패 사례로서, @Transactional이 걸려있음에도 불구하고,  제대로 동작하지 않았다.
        1. try ~ catch문을 이용하여 Exception을 직접 처리를 진행하여, 정상화 흐름으로 바꾸는 바람에 제대로 동작하지 못했다.
            - 직접 제어를 할경우 , TransactionAspectSupport.currentTransactionStatus().setRollbackOnly(); 을 이용하여 롤백을 지정해줄 수 있다.
            - 또는, result Code값이 필요하여 Exception을 처리해야한다면, 공통적인 부분은 AOP로 감싸서 처리하는 방식도 있다.
        
        ```java
         @Transactional(rollbackFor = Exception.class)
            @Override
            public Object run() {
                Map<String, Object> returnMap = new HashMap<>();
                try{
                    Transportation transportation = new Transportation();
                    transportation.setCapacity(10);
                    transportation.setName("testTransportation");
                    transportation.setRegDnt(LocalDateTime.now());
                    transportation.setRouteNumber("route");
        
                    Bus bus = new Bus();
                    bus.setBusType("type1");
                    bus.setLowFloor(true);
        
                    save(transportation,bus);
        
                    returnMap.put("code", "1");
        
                }catch(Exception e){
                    log.error("Service1 Error : {}",e);
                    returnMap.put("code","9999");
                    // 해결책 (직접 롤백 진행)
                    TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                }
        
                return returnMap;
            }
        ```
        
        ```java
        // AOP 처리
        package com.example.application.aop;
        
        import lombok.extern.slf4j.Slf4j;
        import org.aspectj.lang.ProceedingJoinPoint;
        import org.aspectj.lang.annotation.Around;
        import org.aspectj.lang.annotation.Aspect;
        import org.springframework.stereotype.Component;
        import org.springframework.transaction.PlatformTransactionManager;
        import org.springframework.transaction.TransactionDefinition;
        import org.springframework.transaction.TransactionStatus;
        import org.springframework.transaction.support.DefaultTransactionDefinition;
        
        import java.util.HashMap;
        import java.util.Map;
        
        @Slf4j
        @Component
        @Aspect
        public class TransactionAspect {
        
            private final PlatformTransactionManager transactionManager;
        
            public TransactionAspect(PlatformTransactionManager transactionManager){
                this.transactionManager = transactionManager;
            }
        
            @Around("@annotation(CustomTransaction)")
            public Object around(ProceedingJoinPoint joinPoint){
        
                DefaultTransactionDefinition def = new DefaultTransactionDefinition();
                def.setName(joinPoint.getSignature().toShortString());
                def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
        
                TransactionStatus status = transactionManager.getTransaction(def);
        
                try{
                    Object proceed = joinPoint.proceed();
                    transactionManager.commit(status);
                    return proceed;
                }catch (Throwable e){
        
                    transactionManager.rollback(status);
        
                    Map<String, Object> result =  new HashMap<>();
                    log.error("[Error] {}", e.getMessage());
                    result.put("code", "404");
                    return result;
                }
        
            }
        
        }
        
        ```
        
        1. 자기호출로 인한, 트랜잭션 미적용
            - 자신 클래스 내부에서 다른 메서드를 통해 호출할때, 트랜잭션을 적용해놓으면 트랜잭션이 제대로 동작하지 않는 문제가 있다.
            - 자신을 호출한 메서드에 @Transactional을 적용하여 트랜잭션이 제대로 동작하도록 설정
            
            ```java
            @Transactional(rollbackFor = Exception.class)
                @Override
                public Object run() {
                    Map<String, Object> returnMap = new HashMap<>();
                    try{
                        Transportation transportation = new Transportation();
                        transportation.setCapacity(10);
                        transportation.setName("testTransportation");
                        transportation.setRegDnt(LocalDateTime.now());
                        transportation.setRouteNumber("route");
            
                        Bus bus = new Bus();
                        bus.setBusType("type1");
                        bus.setLowFloor(true)
                        save(transportation,bus);
            
                        returnMap.put("code", "1");
            
                    }catch(Exception e){
                        log.error("Service1 Error : {}",e);
                        throw new RuntimeException("test")
                    }
            
                    return returnMap;
                }
            
                @Transactional
                public void save(Transportation transportation, Bus bus){
                    transportationRepository.save(transportation);
                    busRepository.saveBus(bus);
                }
            ```

    3. **CGLIB final 메서드로 인한 무효화** — 위 두 사례보다 더 조용히 실패한다
        - Spring의 기본 프록시(CGLIB)는 대상 메서드를 **오버라이드**해서 어드바이스를 끼워 넣는다.
        - 진입점 메서드가 `final`이면 CGLIB이 오버라이드할 수 없다 → **프록시 자체가 안 걸리고, 예외도 없이 조용히 무효화**된다(자기호출과 달리 "다른 빈에서 정상 호출"해도 실패한다는 점이 더 발견하기 어렵다).
        - 확인 방법: `TransactionSynchronizationManager.isActualTransactionActive()`가 write 시점에 `false`이면 트랜잭션이 실제로 걸리지 않은 것.
        - 우회 시도(내부에 익명 클래스로 트랜잭션을 걸기)도 실패한다 — 익명 클래스는 Spring이 관리하는 빈이 아니므로 `@Transactional` 리플렉션 자체가 적용되지 않는다.

    ### 해결책 — 프로그래밍 방식 트랜잭션(어노테이션 대신 TransactionManager 직접 호출)

    final 메서드·자기호출 트랩을 어노테이션으로는 구조적으로 피할 수 없으므로, `PlatformTransactionManager`를 직접 호출하는 공통 헬퍼로 대체할 수 있다. 프로그래밍 방식은 프록시를 거치지 않으므로 두 트랩과 무관하다.

    ```java
    @Autowired @Qualifier("txManager") private PlatformTransactionManager tm;

    protected boolean runTx(TxWork work) throws Exception {
        TransactionStatus status = tm.getTransaction(new DefaultTransactionDefinition());

        boolean ok;
        try {
            ok = work.run();               // TxWork: boolean run() throws Exception (함수형 인터페이스)
        } catch (Exception e) {
            tm.rollback(status);
            throw e;
        }

        if (ok) { tm.commit(status); } else { tm.rollback(status); }
        return ok;
    }

    // 사용
    return runTx(() -> {
        repositoryA.insert(...);
        repositoryB.insert(...);
        return true;                       // false 반환 시에도 rollback 처리
    });
    ```

    - 여러 datasource를 쓰는 환경이면 `TransactionManager`를 조건에 따라 선택하는 로직을 헬퍼에 둘 수 있다(예: `useSecondaryDb ? secondaryTm : primaryTm`).
    - **한 트랜잭션 = 한 datasource** 원칙을 지켜야 한다 — 트랜잭션 시작 시 선택한 매니저의 datasource만 롤백 대상이 되고, 중간에 datasource를 바꾸면 나머지는 독립 커밋된다(서로 다른 datasource를 묶으려면 XA/2PC가 필요하며 일반적으로는 지양).
    - 읽기 전용 검증(중복 체크 등)은 트랜잭션 **밖**에 두어 락 점유 시간을 최소화한다. write(INSERT/UPDATE/DELETE)만 감싼다.
    - 검증은 항상 **강제 실패 테스트로 롤백을 직접 확인**한다 — 프록시가 안 걸린 채로 "정상 동작하는 것처럼" 보이는 게 이 트랩들의 본질이므로, 어노테이션이 붙어 있다는 사실만으로 트랜잭션이 걸렸다고 단정하면 안 된다.

    ### 언제 어노테이션, 언제 프로그래밍 방식인가

    | 상황 | 권장 |
    |---|---|
    | 별도 클래스(Service)로 분리되어 있고, 외부에서 non-final 메서드로 호출됨 | `@Transactional` (선언적, 더 자연스러움) |
    | 진입점이 `final`인 템플릿 메서드 안에서 트랜잭션이 필요함 | 프로그래밍 방식(`runTx`류 헬퍼) |
    | 단일 호출처뿐이라 별도 클래스로 분리할 실익이 없음 | 호출부에 `runTx`를 인라인 — 불필요한 프록시 빈을 줄임 |
    | 여러 호출처에서 재사용되거나, 트랜잭션 범위가 큰 민감한 로직(결제·잔액 등) | 별도 클래스 + `@Transactional` 유지(캡슐화 우선) |

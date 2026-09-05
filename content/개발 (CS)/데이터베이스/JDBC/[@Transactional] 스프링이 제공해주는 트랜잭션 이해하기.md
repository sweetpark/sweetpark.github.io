---
title: "[@Transactional] 스프링이 제공해주는 트랜잭션 이해하기"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [@Transactional] 스프링이 제공해주는 트랜잭션 이해하기

* * *

## _@Transactional과 트랜잭션 프록시 구조_

Spring에서는 서비스 계층에서 트랜잭션을 분리하고 비즈니스 로직에만 집중할 수 있도록 트랜잭션 프록시 기반의 구조를 제공한다. 이는 내부적으로 **AOP(Aspect-Oriented Programming)를 사용 (프록시 구조)** 하여 구현된다

1. 기존 방식) 트랜잭션을 직접 작성한 경우

```java

TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());

try {
    // 비즈니스 로직 수행
    logic();
    transactionManager.commit(status);
} catch (Exception e) {
    transactionManager.rollback(status);
    throw new IllegalStateException(e);
}
```

2. 프록시 기반 구조) Proxy가 적용되어서 logic()에만 집중할 수 있음

(Spring의 경우, AOP형식으로 Proxy구조를 사용하므로 로직에만 집중할 수 있다)

```java

public class Service {
    public void logic() {
        // 비즈니스 로직
    }
}

public class Proxy {
    private final MemberService target;

    public void logic() {
        TransactionStatus status = transactionManager.getTransaction(...);
        try {
            target.logic();
            transactionManager.commit(status);
        } catch (Exception e) {
            transactionManager.rollback(status);
            throw new IllegalStateException(e);
        }
    }
}
```

* * *

## _@Transactional 적용_

@Transactional을 사용하면 **프록시 객체가 자동으로 생성**되어 트랜잭션을 시작하고,  
예외 발생 시 rollback 처리까지 담당한다.

```java

@Service
public class MemberService {

    @Transactional
    public void func() {
        logic();
    }

    public void logic() {
        // 비즈니스 로직
    }
}
```

* * *

## _@Transactional 사용 시 주의사항_

1. Checked 예외는 rollback 되지 않는다

Spring의 기본 설정에서는 **RuntimeException**, **Error** 계열의 예외만 **rollback**된다.  
(필요 시  rollbackFor 을 명시해야 한다)

```java
@Transactional
public void transfer() throws SQLException { // Checked 예외
    // 예외 발생 시 rollback 안 됨
}

/* @Transactional(rollbackFor = SQLException.class) */
```

2. 예외를 catch 후 정상 처리하면 rollback되지 않는다

예외를 catch하여, 정상흐름으로 바꿨을경우 명시적으로 롤백을 지정해야함  
(TransactionAspectSupport)

```java

@Transactional
public void doSomething() {
    try {
        // 로직 수행 중 예외 발생
    } catch (Exception e) {
        // 예외를 잡고 처리 → rollback 되지 않음     
        log.warn("처리됨");
        
        // 명시적으로 선언해야함
        // TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();

    }
}
```

3. 자기 자신의 메서드 호출은 프록시를 거치지 않아 트랜잭션이 적용되지 않는다 (자기호출)

이 문제를 해결하려면 **AopProxyUtils**를 이용해 **자기 자신의 프록시를 주입**받거나 **구조를 분리**하는 방식이 필요하다.

```java

@Transactional
public void methodA() {
    methodB(); // 프록시를 거치지 않음 → 트랜잭션 적용 안 됨
}

@Transactional //-> 이게 안되는거임
public void methodB() {
    // 트랜잭션 처리 의도
}
```

* * *

## _@Transactional 사용시 주의할점 정리_

| 항목 | 설명 |
| --- | --- |
| @Transactional | Spring이 자동으로 트랜잭션 프록시를 생성하여 시작/커밋/롤백 처리함 |
| Checked 예외 | 기본적으로 rollback 되지 않음. rollbackFor로 지정해야 함 |
| 예외를 catch 후 처리 시 | 예외가 외부로 전파되지 않으면 rollback 되지 않음 |
| 자기 호출(self-call) | 프록시를 우회하므로 트랜잭션이 적용되지 않음 |

---
title: [JDBC #5] Transaction Template을  활용한 간단한 트랜잭션 적용
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [JDBC #5] Transaction Template을  활용한 간단한 트랜잭션 적용

## Transaction Template 도식화

![](https://blog.kakaocdn.net/dna/bIlzKC/btsNKuNfKIw/AAAAAAAAAAAAAAAAAAAAAJx-phni3o3BvD7VrBik8MSTDfK33XZNWBZMlCWrgDuz/img.jpg?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=85qTDPFElCJz1gX9788hNFSJ914%3D)

## Transaction Template 사용

Spring에서는 TransactionTemplate을 사용하여 트랜잭션 제어를 더 간단하게 작성할 수 있다.  
내부적으로는 PlatformTransactionManager를 사용하되, 템플릿 방식으로 트랜잭션 경계를 감싸준다.

### 트랜잭션 템플릿의 장점

*   try-catch-finally 반복 없이 코드가 간결해진다.
*   트랜잭션 범위를 람다 표현식 또는 콜백 메서드로 명확하게 구분할 수 있다.
*   선언적 트랜잭션(@Transactional)을 사용하지 않고 명시적으로 경계를 설정하고 싶을 때 유용하다.

* * *

## Transaction Template 설정 예시 (JDBC 기준)

```cpp
@Configuration
public static class Config {
    @Autowired
    DataSource dataSource;

    @Bean
    public PlatformTransactionManager transactionManager() {
        return new DataSourceTransactionManager(dataSource);
    }

    @Bean
    public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {
        return new TransactionTemplate(transactionManager);
    }
}
```

* * *

## Transaction Template 주요 메서드

```java
public class TransactionTemplate {
     private PlatformTransactionManager transactionManager;
     public <T> T execute(TransactionCallback<T> action){..}
     void executeWithoutResult(Consumer<TransactionStatus> action){..}
 }
```
메서드  
- execute() : 응답 값이 있을 때 사용  
- executeWithoutResult() : 응답 값이 없을 때 사용

1. executeWithoutResult() 예시

1. 성공시, 자동으로 commit  
2. 실패시, 자동으로 rollback
```cpp
@Service
public class TxTemplateService {

    @Autowired
    TxTemplateRepo txTemplateRepo;
    @Autowired
    TransactionTemplate template;

    public void txTemplateSaveAfterDelete(Map<String, Object> params) throws Exception {
        template.executeWithoutResult((status) -> {
            try {
                Member member = new Member();
                member.setName(params.get("name").toString());
                member.setAge(Integer.parseInt(params.get("age").toString()));
                member.setAddr(params.get("addr").toString());

                txTemplateRepo.delete(params.get("oldName").toString());
                txTemplateRepo.save(member);
            } catch (Exception e) {
                throw new RuntimeException("txDataSourceSaveAfterDelete Service Error!", e);
            }
        });
    }
}
```

2. execute() 예시

*   retrun true일 때, 자동 커밋
*   return false일 때, setRollbackOnly()를 통한 수동 롤백 명시 필요

```cpp
public boolean processLogic() {
    return transactionTemplate.execute(status -> {
        try {
            // 트랜잭션 안에서 로직 실행
            memberRepository.save(...);
            return true;
        } catch (Exception e) {
            status.setRollbackOnly();
            return false;
        }
    });
}
```

| 상황 | 커밋 or 롤백 | 설명 |
| --- | --- | --- |
| 예외 발생 안함 (return) | 자동 커밋 | 정상 흐름 |
| 예외 발생 (throw new) | 자동 롤백 | Spring이 감지함 |
| 예외 처리 후 setRollbackOnly() | 수동 롤백 지정 필요 | 예외를 삼켰기 때문 |

> 원문: https://gradualprecision.tistory.com/173

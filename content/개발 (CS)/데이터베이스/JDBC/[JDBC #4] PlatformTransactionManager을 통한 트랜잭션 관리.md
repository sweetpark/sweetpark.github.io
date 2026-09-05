---
title: "[JDBC #4] PlatformTransactionManager을 통한 트랜잭션 관리"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [JDBC #4] PlatformTransactionManager을 통한 트랜잭션 관리

## 애플리케이션 구조

```text
[Controller]  프레젠테이션 계층
     │
     ▼
[Service]     서비스 계층 (트랜잭션 제어)
     │
     ▼
[Repository]  데이터 접근 계층 (실제 DB 접근/SQL 실행)
```
(이미지는 아래 텍스트와 동일한 내용의 도식이라 텍스트로 대체함)

프레젠테이션 계층 (Controller)  
└─ UI와 요청 응답 처리, 사용자 요청 검증  
  
서비스 계층 (Service)  
└─ 비즈니스 로직 수행, **트랜잭션 제어**  
  
데이터 접근 계층 (Repository)  
└─ **실제 DB 접근 및 SQL 실행**

* * *

## 순수 JDBC 트랜잭션 문제점

```java
public void func(String param1, String param2, int param3) throws SQLException {
    Connection con = dataSource.getConnection();
    try {
        con.setAutoCommit(false); // 트랜잭션 시작
        bizLogic(con, param1, param2, param3);
        con.commit(); // 트랜잭션 커밋
    } catch (Exception e) {
        con.rollback();
        throw new IllegalStateException(e);
    } finally {
        close(con);
    }
}
```

문제점)

*   **Connection 의존성 문제**: 비즈니스 로직에서 **커넥션을 직접 들고** 다녀야 한다.
*   **예외 누수**: SQLException이 서비스 계층까지 전파된다.
*   **반복 구조**: try-catch-finally 코드가 계속 중복된다.
*   **기술 종속성**: 기술(JDBC → JPA) 변경 시 서비스 로직 수정 필요

* * *

## 트랜잭션 관리 인터페이스

```text
        interface PlatformTransactionManager
       (getTransaction / commit / rollback)
                    ▲   ▲   ▲
                    │   │   │ (구현)
   DataSourceTransactionManager  JpaTransactionManager  HibernateTransactionManager
           (JDBC)                     (JPA)                  (Hibernate)
```
Service 계층은 구체적인 구현체가 아닌 PlatformTransactionManager 인터페이스에만 의존하므로, 기술(JDBC ↔ JPA 등)이 바뀌어도 비즈니스 로직 코드는 그대로 유지할 수 있다.

대표 구현체 )

*   DataSourceTransactionManager → JDBC용
*   JpaTransactionManager → JPA용
*   HibernateTransactionManager → Hibernate용

핵심 인터페이스 구조 )

```java
public interface PlatformTransactionManager {
    TransactionStatus getTransaction(TransactionDefinition definition);
    void commit(TransactionStatus status);
    void rollback(TransactionStatus status);
}
```

* * *

## 트랜잭션 동기화 매니저

Spring에서는 트랜잭션 경계를 지정하면 내부적으로 TransactionSynchronizationManager를 통해 ThreadLocal 기반으로 Connection을 저장 및 공유한다.

동작 순서 )

1.  서비스 계층에서 트랜잭션 시작 → 트랜잭션 매니저가 동기화 매니저에 커넥션 저장
2.  레포지토리 계층에서 DataSourceUtils.getConnection()을 통해 동일 커넥션 획득
3.  서비스 계층에서 트랜잭션 커밋/롤백 처리 후 커넥션 해제

```text
[Service]
   │ 1. transactionManager.getTransaction()
   ▼
[TransactionSynchronizationManager]  (ThreadLocal)
   │ Connection 저장 ─────────────┐
   ▼                              │
[Repository]                      │
   │ 2. DataSourceUtils.getConnection()
   │    (ThreadLocal에서 동일 Connection 조회) ◄──┘
   ▼
[동일 Connection으로 SQL 실행]
   │
   ▼
[Service] 3. transactionManager.commit()/rollback() → ThreadLocal에서 Connection 제거 및 해제
```

* * *

## 트랜잭션 매니저 구현

*   Repository 
    *   DataSource 인터페이스로 커넥션 연결 (DataSourceUtils.getConnection() 사용)
    *   **트랜잭션 계층까지 Connection이 연결되어야하기에, Connection close처리 지연( DataSourceUtils.releaseConnection(con, dataSource); )**

```java
public class TxDataSourceRepo {

    @Autowired
    public DataSource dataSource;

    public void txDataSourceSave(Member member) throws Exception{

        try{
            con = DataSourceUtils.getConnection(dataSource);
            pstmt = con.prepareStatement("INSERT INTO MEMBER(name, age, addr) VALUES (?, ?, ?)");
            pstmt.setString(1, member.getName());
            pstmt.setInt(2, member.getAge());
            pstmt.setString(3, member.getAddr());

            pstmt.executeUpdate();
        }catch(SQLException e){
            throw new RuntimeException("txDataSourceSave() Error!",e);
        }finally {
            if(rs != null) rs.close();
            if(pstmt != null) pstmt.close();
            if(con != null) DataSourceUtils.releaseConnection(con, dataSource);
        }
    }

    public void txDataSourceDelete(String name) throws Exception{
        try{
            con = DataSourceUtils.getConnection(dataSource);
            pstmt = con.prepareStatement("DELETE FROM MEMBER WHERE name = ?");
            pstmt.setString(1, name);
            pstmt.executeUpdate();

        }catch(SQLException e){
            throw new RuntimeException("txDataSourceDelete Error!", e);
        }finally {
            if(rs != null) rs.close();
            if(pstmt != null) pstmt.close();
            if(con != null) DataSourceUtils.releaseConnection(con, dataSource);
        }
    }

}
```

*   **Service**
    *   **트랜잭션 매니저 선언 (DefaultTransactionDefinition()은 트랜잭션 전파 방식 설정값을 기본으로 셋팅)**
    *   **transactionManager의 구현체를 Bean으로 설정했으면 그에 맞게 트랜잭션 처리 진행 (안되어있으면, Spring이 판단하여 구현체를 삽입 - @Autowired 사용시)**
    *   **try ~ catch문을 이용한, commit() / rollback() 수행**

```java
public void txDataSourceSaveAfterDelete(Map<String, Object> params) throws Exception {
    TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());
    try {
        Member member = new Member();
        member.setName(params.get("name").toString());
        member.setAge(Integer.parseInt(params.get("age").toString()));
        member.setAddr(params.get("addr").toString());

        txDataSourceRepo.txDataSourceDelete(params.get("oldName").toString());
        txDataSourceRepo.txDataSourceSave(member);

        transactionManager.commit(status);
    } catch (Exception e) {
        transactionManager.rollback(status);
        throw new RuntimeException("txDataSourceSaveAfterDelete Service Error!", e);
    }
}
```

*   참고) DataSourceTransactionManager 빈 등록

```java
@Configuration
public static class Config{
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

## 정리

| 구성 요소 | 역할 |
| --- | --- |
| DataSource | DB 커넥션을 생성하는 인터페이스 |
| DataSourceUtils | 트랜잭션 동기화 매니저가 관리하는 커넥션을 가져오고 반납함 |
| PlatformTransactionManager | 트랜잭션을 시작/커밋/롤백하는 추상화된 인터페이스 |
| TransactionSynchronizationManager | ThreadLocal 기반 커넥션 동기화 관리 |

```text
[Controller] -> [Service] -> transactionManager.getTransaction()
                                     │
                             DataSource.getConnection()
                                     │
                    TransactionSynchronizationManager (ThreadLocal 저장)
                                     │
                              [Repository] -> DataSourceUtils.getConnection() (동일 커넥션 재사용)
                                     │
                    Service: transactionManager.commit()/rollback()
                                     │
                             DataSourceUtils.releaseConnection()
```

> 원문: https://gradualprecision.tistory.com/169

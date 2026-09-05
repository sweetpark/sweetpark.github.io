---
title: "[JDBC #4] PlatformTransactionManager을 통한 트랜잭션 관리"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [JDBC #4] PlatformTransactionManager을 통한 트랜잭션 관리

## 애플리케이션 구조

![](https://blog.kakaocdn.net/dna/bXujQG/btsKybWvzjA/AAAAAAAAAAAAAAAAAAAAAANpe-6vmix2Ni9V1nx029rLKxKcxjLb8Fzhj2e6kAqS/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=4DiN6DkZ23KFDz8C4tR8TZGV2vQ%3D)

프레젠테이션 계층 (Controller)  
└─ UI와 요청 응답 처리, 사용자 요청 검증  
  
서비스 계층 (Service)  
└─ 비즈니스 로직 수행, **트랜잭션 제어**  
  
데이터 접근 계층 (Repository)  
└─ **실제 DB 접근 및 SQL 실행**

* * *

## 순수 JDBC 트랜잭션 문제점

```cpp
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

![](https://blog.kakaocdn.net/dna/cnhlvk/btsKxXjXq1e/AAAAAAAAAAAAAAAAAAAAAKYWB37pZo762dNoQ2GAMVVgDdl7-SGgM4mCwD27_xhg/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=B1ddzrK5sXeOAFi%2BRPNISltqsts%3D)

대표 구현체 )

*   DataSourceTransactionManager → JDBC용
*   JpaTransactionManager → JPA용
*   HibernateTransactionManager → Hibernate용

핵심 인터페이스 구조 )

```cpp
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

![](https://blog.kakaocdn.net/dna/dZxu2r/btsKwZv1uys/AAAAAAAAAAAAAAAAAAAAAOffywygGwMYLBr-tHvWeFsmYpnjp4KjNvruQSfr4H0g/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=%2F2wrSHYKQDrs%2FIA6VhsVFY7aYKQ%3D)

* * *

## 트랜잭션 매니저 구현

*   Repository 
    *   DataSource 인터페이스로 커넥션 연결 (DataSourceUtils.getConnection() 사용)
    *   **트랜잭션 계층까지 Connection이 연결되어야하기에, Connection close처리 지연( DataSourceUtils.releaseConnection(con, dataSource); )**

```cpp
public class TxDataSourceRepo {

    @Autowired
    public DataSource dataSource;

    public void txDataSourceSave(Member member) throws Exception{

        try{
            con = DataSourceUtils.getConnection(dataSource);
            pstmt = con.prepareStatement("IINSERT INTO MEMBER(name, age, addr) VALUES (?, ?, ?)");
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

```cpp
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

```cpp
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

![](https://blog.kakaocdn.net/dna/baEhNu/btsKxJzddsg/AAAAAAAAAAAAAAAAAAAAAOcHyH8STu24b2SRFheDakWs-BLLNLbVHzYH9BIptKjP/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=PPUujzBM8Y65BXmJ1AoVWfnSP%2FI%3D)

> 원문: https://gradualprecision.tistory.com/169

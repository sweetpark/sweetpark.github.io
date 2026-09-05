---
title: "[기능구현#8] DataSource"
tags: [프로젝트, 게시판 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [기능구현#8] DataSource

## DataSource 란?

DataSource는 JDBC를 이용하여 DB를 연결시에 도와주는 객체이다.  
DataSource는 DB연동을 위한 작업을 중간에서 도와주며, Connection Pool를 이용하여 커넥션 관리를 용이하게 도와준다.  
DataSourceUtils를 이용하면, 커넥션의 반환도 관리할 수 있어서 트랜잭션을 시행할때 많은 도움을 받을 수 있다/  
  
현재 프로젝트에 적용되어있으며, h2DataBase의 드라이버를 사용하지 않고도 DataSource를 이용하여 손쉽게 연결하며 ConnectionPool도 구성할 수 있었다.

## DataSource 구현

*   DataSource Config
    *   DataSource는 인터페이스이고, Hikari를 이용하여 구현체를 사용

```java
public class DataSourceConfig {

    public static DataSource dataSource(){
        HikariConfig config = new HikariConfig();

        config.setJdbcUrl(ConnectionConst.URL);
        config.setUsername(ConnectionConst.USERNAME);
        config.setPassword(ConnectionConst.PASSWORD);

        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setIdleTimeout(600000);
        config.setConnectionTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setConnectionTestQuery("select 1");

        return new HikariDataSource(config);
    }
}
```

*   AppConfig (@Configuration)
    *   수동으로 bean을 등록하여,  생성자 주입을 해주었다

```java
//@Configuration
@Bean
    public BoardRepository boardRepository() {
         return new BoardDBRepository(DataSourceConfig.dataSource());
    }
    
 
 //BoardDBRepository.class
 public BoardDBRepository(DataSource dataSource){
        this.dataSource = dataSource;
        this.excep = new SQLErrorCodeSQLExceptionTranslator(dataSource);
    }
```

*   DataSourceUtils를 사용
    *   트랜잭션을 위한 커넥션 유지

```java
private void close(Connection con, Statement stmt, ResultSet rs){
        JdbcUtils.closeResultSet(rs);
        JdbcUtils.closeStatement(stmt);
        DataSourceUtils.releaseConnection(con, dataSource);
    }
```

## DataSource 장점

*   DataSource를 통해서 Driver 없이 DB와 connect 작업을 수월하게 할 수 있었다
*   DataSource를 통해서 커넥션 유지하여, 트랜잭션이 원활하게 돌아가도록 제공
*   DataSource를 통해서 커넥션 풀을 유지하며, connection을 매번 맺는 리소스를 절약할 수 있었다.

## 아쉬운점

*   DataSource를 이용하여 성능이 얼마나 향상되는지 측정이 되질 않았다. (테스트 코드 작성을 통한 CRUD 확인)
*   DataSource를 이용한 인터페이스 활용 대한 장점은 알겠지만, 이를 몇개를 활용해야하는지에 대한 궁금증이 해결되지 못했다

> 원문: https://gradualprecision.tistory.com/212

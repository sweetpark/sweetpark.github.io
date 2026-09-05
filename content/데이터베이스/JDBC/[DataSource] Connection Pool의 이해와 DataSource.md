---
title: "[DataSource] Connection Pool의 이해와 DataSource"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [DataSource] Connection Pool의 이해와 DataSource

1. 커넥션 풀이란?  
2. 커넥션 풀 구조  
3. 커넥션 풀 오픈소스  
4. 커넥션 풀 직접 구현

## Connection Pool 이란?

DB와 연결을 짓는 과정자체를 Connection 과정이라고 일컫는다.  
여기서 매번 DB와의 연결을 위해서 TCP/IP 3wayhandshake를 과정을 거치기도 하고, 인증과정도 거치게된다.  
이런 과정속에서 인증하고 커넥션 작업을 하는데에만 리소스를 많이 사용하게 될 수도 있기에 미리 커넥션을 맺어놓아 보관해두는 공간을 "Connection Pool"이라고 한다.

```text
[Application] --1. 커넥션 요청--> [DB]
[DB] --2. TCP/IP 3-way handshake--> [Application]
[Application] --3. 인증 정보 전달--> [DB]
[DB] --4. 인증 완료, 커넥션 생성--> [Application]
(매 요청마다 위 과정을 반복)
```

*   위의 그림과 같은 과정을 통해 DB의 커넥션을 가지고 올 수 있다
    *   단점
        *   매번 요청시마다 커넥션을 맺는과정을 거쳐야한다. (리소스를 효율적으로 사용하지 못함)
        *   DB의 상황에따라 많은 수의 쿼리 요청을 받지 못할 가능성이 존재한다.
        *   데이터베이스마다 커넥션 과정의 소요시간은 다르다

## Connection Pool 구조

```text
[Application] --커넥션 요청--> [Connection Pool]
                                  ├─ Connection 1 (사용중)
                                  ├─ Connection 2 (대기중)
                                  ├─ Connection 3 (대기중)
                                  └─ ... (기본 10개)
                                       │
                             [Connection Pool] --반환(release)--> 재사용
                                       │
                                     [DB]
```

*   Connection Pool이란 쉽게 말해서, 미리 커넥션 과정을 맺어놓고 맺어져 있는 커넥션을 사용하고 반환을 반복하는 공간을 말한다
*   커넥션의 개수의 경우 보통은 10개를 기본으로 설정하고 서버 스펙에 따라 상이하게 설정할 수 있다
*   애플리케이션 로직에서는 커넥션 풀에 있는 커넥션을 조회하고 반환하는 작업을 통해 빠르게 DB작업을 이행할 수 있다

## Connection Pool 오픈소스

1. Commons-dbcp2  
2. Tomcat-jdbc pool  
3. HikariCP (현재 주로 사용됨)  
...

*   DataSource 인터페이스를 통해서, 오픈소스를 이용하여 Connection Pool을 이용할 수 있음
*   OCP, DI를 지키며 구현이 가능

```text
              interface DataSource { getConnection(); }
                          ▲   ▲   ▲
                          │   │   │ (구현)
              HikariDataSource   Tomcat-jdbc   Commons-dbcp2
```
애플리케이션 코드는 구체적인 구현체가 아닌 DataSource 인터페이스에만 의존하므로, 실제 사용하는 커넥션 풀 라이브러리를 다른 것으로 교체하더라도(HikariCP → Tomcat-jdbc 등) 비즈니스 로직 변경 없이 대체할 수 있다.

```java
//test
HikariDataSource dataSource = new HikariDataSource();
dataSource.setJdbcUrl(ConnectionConst.URL);
dataSource.setUsername(ConnectionConst.USERNAME);
dataSource.setPassword(ConnectionConst.PASSWORD);

repository = new MemberRepositoryV1(dataSource);

//repositoryV1 Class
private final DataSource dataSource;

    public MemberRepositoryV1(DataSource dataSource){
        this.dataSource = dataSource;
    }
```

## Connection Pool 직접 구현

*   생성자를 통해, 커넥션 생성 ( intialSize를 통해 첫 커넥션 수 지정 )
*   maxSize를 통해, 커넥션 생성 제한

문제점  
여러 스레드가 동시에 요청하면 getConnection 메서드에서 최대 개수 이상으로 커넥션이 생성될 수 있다  
(동시성 제어를 위한 lock이 필요)  
- DataSource 인터페이스를 직접 구현해도 내부 로직을 통해 getConnection이 호출되는 구조라 한계가 있다  
- 실제 사용 시에는 안정성과 성능 면에서 HikariCP 같은 오픈소스 커넥션 풀을 사용하는 것이 권장된다
```java
public class ConnectionPoolEX {
    private BlockingQueue<Connection> connectionPool;
    private int maxPoolSize;
    private String jdbcURL;
    private String jdbcUser;
    private String jdbcPasswd;

    public ConnectionPoolEX(int initialSize,int maxPoolSize, String jdbcURL, String jdbcUser, String jdbcPasswd) throws SQLException{
        this.connectionPool = new LinkedBlockingQueue<>();
        this.maxPoolSize = maxPoolSize;
        this.jdbcURL = jdbcURL;
        this.jdbcUser = jdbcUser;
        this.jdbcPasswd = jdbcPasswd;

        for (int i = 0; i<initialSize; i++){
            connectionPool.add(createConnection());
        }
    }

    private Connection createConnection() throws SQLException {
        return DriverManager.getConnection(jdbcURL,jdbcUser,jdbcPasswd);
    }

    public Connection getConnection() throws InterruptedException, SQLException{

        Connection connection = connectionPool.poll();

        if (connection == null){
            if(connectionPool.size() < maxPoolSize){
                connection = createConnection();
            }else{
                connection = connectionPool.take(); // 요소가 사용가능할때까지 대기
            }
        }

        return connection;

    }

    public void releaseConnection(Connection connection){
        if(connection != null){
            connectionPool.offer(connection); // 꽉차자지 않았을경우, 삽입 (가득찬 경우 지정된 시간까지 대기)
        }
    }

    public void shutdown() throws SQLException{
        for (Connection connection : connectionPool) {
            connection.close();
        }
    }

}
```

> 원문: https://gradualprecision.tistory.com/167

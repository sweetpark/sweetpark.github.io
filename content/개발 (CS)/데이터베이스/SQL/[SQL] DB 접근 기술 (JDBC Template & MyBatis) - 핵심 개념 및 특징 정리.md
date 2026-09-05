---
title: "DB 접근 기술 (JDBC Template & MyBatis)"
tags: [학습, 개발-CS, 데이터베이스, 개발, SQL, JDBC, MyBatis]
modified: 2026-09-05
---

# DB 접근 기술 (JDBC Template & MyBatis)

> [!NOTE]
> 스프링에서 DB에 접근하는 두 기술(JDBC Template, MyBatis)의 장단점과 데이터베이스 연동 테스트(임베디드 H2) 방법을 정리한다.

## 📌 개념

## 1. JDBC Template

- 공식문서
    - https://docs.spring.io/spring-framework/reference/
- 파라미터 넣기 방법 (NamedParameter)
    1. BeanProperty
    2. MapSql
    3. Map
- simpleJdbcInsert
    - insert 편하게 하는 방법

- jdbc Template 정리
    - 단점
        - 동적쿼리를 편리하게 지원하지 않는다
        - sql을 자바코드로 작성하기에, 줄이 넘어가면 “+”를 이용하여 라인을 바꿔줘야한다
    - 장점
        - sql을 애플리케이션단에서 편하게 지원
        - namedParameter 를 사용하여 파라미터 순서로 인한 오류를 방지
        - DB와 애플리케이션의 관례차이 ( 카멜 표기 vs 스네이크 표기) 를 jdbc template이 해결해준다)

## 데이터베이스 연동 테스트

- 테스트 용도 데이터베이스 분리
    - 원래 사용되는 데이터베이스는 잔존 데이터가 있어서 원할한 테스트가 어려움
- 트랜잭션을 이용한 데이터베이스 초기화 가능 (테스트 코드 사용시)
    - 기본 코드에서는 commit을 진행해줌 (@Transactional)
- 임베디드 모드 테스트 (db)
    - main method()
    
    ```java
    @Bean
    	@Profile("test")
    	public DataSource dataSource() {
    		log.info("메모리 데이터베이스 초기화");
    		DriverManagerDataSource dataSource = new DriverManagerDataSource();
    		dataSource.setDriverClassName("org.h2.Driver");
    		dataSource.setUrl("jdbc:h2:mem:db;DB_CLOSE_DELAY=-1");
    		dataSource.setUsername("sa");
    		dataSource.setPassword("");
    		return dataSource;
    	}
    ```
    

## 2. MyBatis

- 공식홈페이지
    - https://mybatis.org/mybatis-3/ko/index.html
- sql이 길어지더라도 xml에서 표현하기 때문에 괜찮다
- 동적쿼리를 작성하기에 편리하다

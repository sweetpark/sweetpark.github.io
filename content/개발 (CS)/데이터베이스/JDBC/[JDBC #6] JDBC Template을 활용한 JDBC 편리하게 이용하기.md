---
title: "[JDBC #6] JDBC Template을 활용한 JDBC 편리하게 이용하기"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [JDBC #6] JDBC Template을 활용한 JDBC 편리하게 이용하기

## _JDBC Template 사용 이유_ 

Spring에서는 반복적인 JDBC 코드를 간소화하기 위해 JdbcTemplate을 제공한다.  
JdbcTemplate은 SQL 실행, 파라미터 바인딩, 예외 처리, 리소스 정리 등을 자동으로 처리해주므로,  
개발자는 비즈니스 로직에만 집중할 수 있다.

* * *

## _JDBC Template 선언 방법_

1) DataSource 주입 방법

```java
public class Test {
    private final JdbcTemplate template;

    public Test(DataSource dataSource) {
        this.template = new JdbcTemplate(dataSource);
    }
}
```

2) @Autowired 사용

```java
@Component
public class JDBCTemplateRepo {
    @Autowired
    public JdbcTemplate jdbcTemplate;
    @Autowired
    public NamedParameterJdbcTemplate namedParameterJdbcTemplate;
}
```

* * *

## _데이터 삽입, 수정, 삭제 (update 메서드 사용)_

**update() 메서드**는 INSERT, UPDATE, DELETE와 같이 반환값이 필요 없는 SQL문을 실행할 때 사용한다.
```java
public void save(Member member) {
    jdbcTemplate.update("INSERT INTO MEMBER(name, age, addr) VALUES (?, ?, ?)",
        member.getName(),
        member.getAge(),
        member.getAddr());
}

public void delete(String name) {
    jdbcTemplate.update("DELETE FROM MEMBER WHERE name = ?", name);
}
```

* * *

## _데이터 조회 (query, queryForObject)_

조회 시에는 **RowMapper**를 사용하여 결과를 객체로 매핑해야 한다.
```java
public List<Member> findAll() {
    return jdbcTemplate.query("SELECT * FROM MEMBER", memberRowMapper());
}

public Member findByName(String name) {
    return jdbcTemplate.queryForObject("SELECT * FROM MEMBER WHERE name = ?", memberRowMapper(), name);
}

private RowMapper<Member> memberRowMapper() {
    return (rs, rowNum) -> {
        Member member = new Member();
        member.setName(rs.getString("name"));
        member.setAge(rs.getInt("age"));
        member.setAddr(rs.getString("addr"));
        return member;
    };
}
```

*   **query()**는 결과가 여러 개일 때 **사용하며** List를 반환한다.
*   **queryForObject()**는 **단일 객체**를 반환할 때 사용한다. 결과가 없거나 2개 이상이면 예외가 발생한다.

* * *

## _NamedParameterJdbcTemplate 사용법_

이름 기반의 파라미터를 사용할 수 있어 가독성이 좋고 **파라미터 순서 실수를 방지**할 수 있다
```java
public void namedSave(Member member) {
    Map<String, Object> param = new HashMap<>();
    param.put("name", member.getName());
    param.put("age", member.getAge());
    param.put("addr", member.getAddr());

    namedParameterJdbcTemplate.update(
        "INSERT INTO MEMBER(name, age, addr) VALUES (:name, :age, :addr)", param);
}
```

* * *

## _JdbcTemplate 요약_

| Method | 설명 |
| --- | --- |
| update(...) | INSERT, UPDATE, DELETE에 사용함 |
| query(...) | 결과가 여러 개인 SELECT 쿼리에 사용함 (List 반환) |
| queryForObject(...) | 단일 결과 SELECT 쿼리에 사용함 (Object 반환) |
| RowMapper | ResultSet을 도메인 객체로 매핑하는 함수형 인터페이스 |
| NamedParameterJdbcTemplate |  |

---
title: "DataBase"
tags: [학습, 개발-CS, 데이터베이스, MyBatis]
modified: 2026-09-05
---

# DataBase

> [!NOTE]
> DBeaver 접속 이슈, MyBatis DB 연결 설정, SQL 작성 방법 정리.
> 실무에서 이관.

> [!TIP] DB 엔진
> 아래 XML 예제의 `LIMIT 1`은 MySQL/MariaDB 전용 문법이다. Oracle이라면 `WHERE ROWNUM = 1` 또는 `FETCH FIRST 1 ROWS ONLY`를 사용해야 한다.

## 📌 개념

**DB Client — DBeaver 드라이버 인증 문제**

- authentication 오류 발생 시 host 대신 URL로 DB 접속하면 원만히 해결됨(DBeaver의 인증 처리 과정에서 실패하는 것으로 추측).

**DB Connect (Sql Mapper) — MyBatis 사용**

- mapper xml 파일을 스프링부트에 인지시키기

```java
@Bean
public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception{
    SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
    sqlSessionFactoryBean.setDataSource(dataSource);
    Resource[] arrResource = new PathMatchingResourcePatternResolver()
            .getResources("classpath:mapper/**/*Mapper.xml");
    sqlSessionFactoryBean.setMapperLocations(arrResource);
    sqlSessionFactoryBean.getObject().getConfiguration().setMapUnderscoreToCamelCase(true);

    return sqlSessionFactoryBean.getObject();

}
```

- mybatis 의존성 추가

```groovy
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:1.3.2'
```

- mybatis 학습
    - xml 에 적는 쿼리문 id가 repository의 함수명 (repository의 경우 인터페이스로 작성)
    - param 값과 return 값의 타입 제시

**sql 작성방법**

- where 작성시 1=1 (참) 입력

```sql
SELECT  *
        FROM CHARGER
        WHERE 1=1
            AND firstcharger = 'yes'
            AND id = '1'
            --AND pass = '2'
```

- 기능상에서는 무조건 참이기에 의미는 없으나, 주석처리하기 편함(디버깅의 이점)
- param의 정보를 가져다 쓸때에는, 저장되어있는 #{변수명} 으로 작성

```sql
WHERE CARD_NO = #{rfid} AND USETYPE = 'USED'
```

- 단, `<if>`문이나 mybatis가 제공하는 제어문안에서는 그냥 작성

```xml
<select id="authorizeCheck" parameterType="map" resultType="map">
    SELECT ID, USETYPE
    FROM CUSTOMER CTM
    WHERE 1=1
    <if test=" rfid != null and rfid != '' ">
        AND CARD_NO = #{rfid}
    </if>
    <if test=" dong != null and dong != '' and guyeok != null and guyeok != ''">
        AND DONG = #{dong} AND GUYEOK = #{guyeok}
    </if>
    <if test=" password != null and password != '' ">
        AND PASSWORD = #{password}
    </if>
    ORDER BY ID DESC
    LIMIT 1
</select>
```

- DDL의 경우 (create, drop, alter 등)
    - spring이 제공하는 schema.sql 을 사용하여 직접 작성
    - 또는, .sql 스크립트를 만들어서 database client에 직접 sql 작성
    - 관계 설정도 sql구문을 통해서 설정 및 기본키/외래키도 sql구문으로 작성
    - mybatis의 경우 CRUD만 주로 이용한다.

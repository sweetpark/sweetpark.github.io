---
title: "[Exception] DB 데이터접근 스프링 예외 변환기"
tags: [토이프로젝트, 예외처리]
created: 2026-09-05
modified: 2026-09-05
---

# [Exception] DB 데이터접근 스프링 예외 변환기

## UnChecked예외 (데이터 접근)

*   생성방법
    *   UnChecked예외를 먼저 만든다
    *   Checked -> UnChecked 예외로 변경 (변경시, 에러코드가 존재하면 해당 예외로 변경)
    *   예외처리

```java
public class DBErrorException extends RuntimeException{ ///... }

public class Service{
    
    //...
    
    try{
        logic();
    }catch (SQLException e){
        
        if ( e.getErrorCode().isEqualTo(42122) ){
            // 42122는 "SQL bad Grammer" 오류 코드
            throw new DBErrorException(e);
        }else{
            throw new RuntimeException(e);
        }
    }
    
    //...
    
}
```

##  Spring 에러코드 정리

*   sql-error-codes.xml

```java
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xsi:schemaLocation="http://www.springframework.org/schema/beans
	   https://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean id="DB2" name="Db2" class="org.springframework.jdbc.support.SQLErrorCodes">
		<property name="databaseProductName">
			<value>DB2*</value>
		</property>
		<property name="badSqlGrammarCodes">
			<value>-007,-029,-097,-104,-109,-115,-128,-199,-204,-206,-301,-408,-441,-491</value>
		</property>
		<property name="duplicateKeyCodes">
			<value>-803</value>
		</property>
		<property name="dataIntegrityViolationCodes">
			<value>-407,-530,-531,-532,-543,-544,-545,-603,-667</value>
		</property>
		<property name="dataAccessResourceFailureCodes">
			<value>-904,-971</value>
		</property>
		<property name="transientDataAccessResourceCodes">
			<value>-1035,-1218,-30080,-30081</value>
		</property>
		<property name="deadlockLoserCodes">
			<value>-911,-913</value>
		</property>
	</bean>

	<bean id="H2" class="org.springframework.jdbc.support.SQLErrorCodes">
		<property name="badSqlGrammarCodes">
			<value>42000,42001,42101,42102,42111,42112,42121,42122,42132</value>
		</property>
		<property name="duplicateKeyCodes">
			<value>23001,23505</value>
		</property>
		<property name="dataIntegrityViolationCodes">
			<value>22001,22003,22012,22018,22025,23000,23002,23003,23502,23503,23506,23507,23513</value>
		</property>
		<property name="dataAccessResourceFailureCodes">
			<value>90046,90100,90117,90121,90126</value>
		</property>
		<property name="cannotAcquireLockCodes">
			<value>50200</value>
		</property>
	</bean>

	<!-- 여러 DB들 -->

</beans>
```

## 스프링 데이터 접근 예외 계층

*   RuntimeException으로 상속 (Unchecked 예외)
*   DataAccessException이 데이터접근 최상위 예외
*   에러코드에 따른, 여러 예외 존재 (Bad Sql, DB Timeout .... )

```text
RuntimeException
└── DataAccessException (데이터 접근 최상위 예외)
    ├── BadSqlGrammarException          (잘못된 SQL 문법)
    ├── DataIntegrityViolationException  (제약조건 위반)
    ├── DuplicateKeyException            (키 중복)
    ├── DataAccessResourceFailureException (DB 연결/자원 실패)
    ├── TransientDataAccessResourceException (일시적 자원 오류)
    ├── DeadlockLoserDataAccessException (데드락)
    └── CannotAcquireLockException       (락 획득 실패)
```

## 스프링 예외 추상화

**SQLExceptionTrnaslator는 여러 DB 에러코드 변환기로서, 어떠한 DB를 사용하더라도 에러코드에 맞는 예외를 던져준다**  
(데이터접근 예외 계층 확인)
```java
private final SQLExceptionTranslator exTranslator = new SQLErrorCodeSQLExceptionTranslator(dataSource);

void func(){
    try{
        logic();
    }catch (SQLException e){
        throw exTranslator.translate("[예외 확인 글자]" , [sql문], e);
    }
}
```

**[세부설명]**

 SQLExceptionTranslator

```java
@FunctionalInterface
public interface SQLExceptionTranslator {
    @Nullable
    DataAccessException translate(String task, @Nullable String sql, SQLException ex);
}
```

SQLErrorCodeSQLExceptionTranslator(DataSource)

```java
public SQLErrorCodeSQLExceptionTranslator(DataSource dataSource) {
        this();
        this.setDataSource(dataSource);
    }
```

translate()

```java
@FunctionalInterface
public interface SQLExceptionTranslator {
    @Nullable
    DataAccessException translate(String task, @Nullable String sql, SQLException ex);
}
```

## 정리

*   직접 예외를 만들어서 (RuntimeException 상속), 에러코드에 따라 만들어도됨
*   스프링이 만들어둔 데이터 접근 예외처리를 에러코드에 따라 만들어도 됨
*   **스프링 예외 변환기를 활용하여, 에러코드는 모르더라도 스프링의 데이터 접근 예외처리를 이용**

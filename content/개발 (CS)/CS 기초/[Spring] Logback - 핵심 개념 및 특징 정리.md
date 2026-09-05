---
title: "Logback"
tags: [학습, 개발-CS, CS-기초, 기초, 개발, Logback]
created: 2026-02-04
modified: 2026-09-05
---

# Logback

> [!NOTE]
> 로그의 개념과 레벨(FATAL~TRACE), 기록 방법, 파사드 패턴(SLF4J), 그리고 logback-spring.xml 설정 예시를 정리한다.

## 📌 개념

- 로그란?
    - 필요한 시스템 정보 및 결과에 대해 출력되는 정보들을 일컫는 말
    - 기본적으로, 결과를 확인하거나 문제가 발생했을 때 원인파악을 위해 사용
- 로그 단계 (단계 순서 : 1 > 2> … >6)
    1. FATAL : 심각한 에러
    2. ERROR : 에러가 일어 났을 때 사용, 개발자가 의도하지 않은 에러
    3. WARN : 에러는 아니지만 주의할 필요한 로그에 사용
    4. INFO : 운영에 참고할만한 사항 또는 중요 정보를 나타낼 때 사용
    5. DEBUG : 개발 단계에서 사용하며, 일반 정보를 나타낼 때 사용
    6. TRACE : 모든 레벨에 대한 로깅이 추적
- 로그 기록 방법
    - 콘솔 출력
        - 서버 실행중에 Console에 로그를 기록하는 방법
        - System.out.println( “ log “ );
        - 주의)
            - 서버 종료와 함께 로그기록도 날아감
            - 많은 양의 로그기록의 경우, 찾는데에 불편함
    - 파일 출력
        - 파일에 기록하여 필요한 로그들을 기록
        - logback, log4j2을 주로 사용
        - logback-spring.xml 을 작성하여 설정

        > [!NOTE]
        > 파일 기록의 장점
        > - 파일 크기를 지정할 수 있다 (로그 파일 사이즈 조절 가능)
        > - 파일별 보관기간 및 파일 보관개수 지정 가능 (로그파일 리소스 사용량 제한 가능)
        > - 일자별 로그 파일 기록 가능 (기간별로 나뉘어 빠르게 로그를 분석할 수 있음)

    - 메일로 로그 보내기
        - 메일을 통한 로그 전달
        - 로그 중앙화 가능
    - DB에 로그 보내기
        - DB의 이점을 이용해 로그 기록
- 로그 구현체 사용

    > [!NOTE]
    > logback, log4j2 등 여러 구현체를 파사드 패턴(SLF4J)으로 감싸 개발자가 사용하기 쉽게 만든 인터페이스를 사용한다.

    - spring-starter-web 의존성 패키지에 로그 라이브러리 패키징
    
    ```java
    private static final Logger logger = LoggerFactory.getLogger(logSample.class);
    logger.info("[INFO] LOG 내용");
    ```
    
    - @Slf4j 사용
        - LoggerFactory에서 꺼내지 않아도, 어노테이션을 사용하여 손쉽게 사용 가능
        - Lombok 패키지를 설치해야함
    
    ```java
    @Slf4j
    log.info("[INFO] 로그 내용");
    ```
    
- 파사드 패턴
    - 파사드 패턴이란 구현체의 복잡한 정보들을 알 필요없이 앞단에 해당 기능 관련 프레임워크를 두어, 사용자가 손쉽게 구현체를 설정하고 사용하기 위한 기술
    - 예를들어, [log.info](http://log.info)() 에 있어서 내부적으로 처리해야하는 것들 “파일에기록하기 또는 콘솔에 어떠한 포맷으로 출력하기” 을 고려하지 않고 log.info()에서 지원하는 문법에 맞춰 사용하면 내부적 처리가 일어나 원하는 결과를 받을 수 있음 (메일로 발송 or 파일에 저장 or 콘솔에 출력 등..)
    - 파사드 패턴의 사용으로 구현체를 손쉽게 변경할 수 있으며, OCP (기존의 코드를 변경하지 않으면서, 기능을 추가)  원칙에 위배되지 않고 사용이 가능하다

> [!NOTE]
> 대부분의 라이브러리가 인터페이스로 추상화하여 제공하는 이유가 바로 이 파사드 패턴 덕분이다.

## 💻 예시

### logback-spring.xml 작성

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<configuration>

    <property name="CONSOLE_PATTERN" value="%d{yyyy-MM-dd HH:mm:ss.SSS} %magenta([%thread]) %highlight([%-3level]) %logger{5} - %msg %n" />
    <property name="ROLLING_PATTERN" value="%d{yyyy-MM-dd HH:mm:ss.SSS}  %logger{5} - %msg %n" />
    <property name="FILE_NAME" value="C:/logs/application.log" />
<!--    <property name="LOG_NAME_PATTERN" value="./logs/application-%d{yyyy-MM-dd-HH-mm}.%i.log" /> <!- 1 Minute &ndash;&gt;-->
<!--    <property name="LOG_NAME_PATTERN" value="./logs/application-%d{yyyy-MM-dd-HH}.%i.log" /> <!- 1 Hour &ndash;&gt;-->
    <property name="LOG_NAME_PATTERN" value="./logs/application-%d{yyyy-MM-dd}.%i.log" /> <!-- 1 day -->
    <property name="MAX_FILE_SIZE" value="10MB" />
    <property name="TOTAL_SIZE" value="30MB" />
    <property name="MAX_HISTORY" value="30" /> <!-- 보관 파일 개수 -->

    <!-- Console appender 설정 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <Pattern>${CONSOLE_PATTERN}</Pattern>
        </encoder>
    </appender>

    <appender name="ROLLING_LOG_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <encoder>
            <pattern>${ROLLING_PATTERN}</pattern>
        </encoder>
        <file>${FILE_NAME}</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOG_NAME_PATTERN}</fileNamePattern>
            <maxHistory>${MAX_HISTORY}</maxHistory>
            <maxFileSize>${MAX_FILE_SIZE}</maxFileSize>
            <totalSizeCap>${TOTAL_SIZE}</totalSizeCap>
        </rollingPolicy>
    </appender>

    <!-- SQL 쿼리 로그 기록 (level 및 로그 기록 여부 지정) -->
            <!-- JDBC 관련 로그 OFF + 로거 전파 x (상위로그 출력 x) -->
    <logger name="jdbc" level="OFF" additive="false">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </logger>
            <!-- SQL 로그 + 로거 전파 x (상위로그 출력 x) -->
    <logger name="jdbc.sqlonly" level="DEBUG" additive="false" >
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </logger>
            <!-- 쿼리 성능 측정 로그 OFF + 로거 전파 x (상위로그 출력 x) -->
    <logger name="jdbc.sqltiming" level="OFF" additive="false" >
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </logger>
    <logger name="org.hibernate.SQL" level="DEBUG" additive="false">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </logger>

    <!-- 패키지 하위 로그 기록 (level 지정) -->
    <logger name="com.example.application.fileInputOutput" level="INFO" additive="true" >
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </logger>
    <logger name="com.example.application.paging" level="DEBUG" additive="false" >
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </logger>

    <!-- 전역 로그 설정  -->
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </root>

</configuration>
```

- appender-ref
    - 출력 형식 지정 (STDOUT : 콘솔 출력, ROLLING_LOG_FILE : 파일 출력)
- 로그 저장 클래스 정리
    
    ```xml
    class="ch.qos.logback.core.rolling.RollingFileAppender" // file 순환 출력
    class="ch.qos.logback.core.FileAppender" // file 출력
    class="ch.qos.logback.core.ConsoleAppender " // console 출력
    class="ch.qos.logback.classic.net.SMTPAppender" // SMTP 메일 전송
    class="ch.qos.logback.classic.db.DBAppender" // DB 저장
    ```
    
- LEVEL
    - off : 저장안함
    - INFO : info 단계저장 (INFO, WARN, ERROR 출력)
        - WARN / ERROR / FATAL / DEBUG  / TRACE: 단계별 저장가능 (해당 단계부터 위의 단계들 로그도 저장됨 )
    - additive=false일 경우 부모로거와 중복 저장 x ( 별도의 설정없으면 부모로거는 “root”)
- POLICY
    - fileNamePattern : 아카이브 되는 파일의 패턴을 지정할 수 있다.
    - maxHistory : 보관할 최대 파일 수를 제어하여 이전 파일을 삭제한다.
    - maxFileSize : 분할할 용량 사이즈를 의미한다.
    - totalSizeCap : 전체 파일 크기를 제어하며, 전체 크기 제한을 초과하면 가장 오래된 파일을 삭제한다. (maxHistory 설정 필수)

## 🔗 참고

- [Logback 공식 설정 매뉴얼](https://logback.qos.ch/manual/configuration.html)
- [Log4j2 공식 설정 매뉴얼](https://logging.apache.org/log4j/2.x/manual/configuration.html)

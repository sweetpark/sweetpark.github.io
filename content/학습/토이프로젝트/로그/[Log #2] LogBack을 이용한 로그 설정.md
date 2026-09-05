---
title: [Log #2] LogBack을 이용한 로그 설정
tags: [토이프로젝트, 로그]
created: 2026-09-05
modified: 2026-09-05
---

# [Log #2] LogBack을 이용한 로그 설정

![](https://blog.kakaocdn.net/dna/SEPsY/btsNEDbLtpb/AAAAAAAAAAAAAAAAAAAAAJkdA1dlBW_dH2D9SDjnH4NriSpkdlFKrv-D3_avA3yF/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=uGx774YdcCEWQ27njTG35yXvGmI%3D)

# LogBack

- Spring Boot에서 로그를 다룰 때 가장 많이 쓰는 로깅 구현체는 Logback  
- logback-spring.xml을 이용하면 로그 포맷, 출력 방식, 파일 보관 정책 등을 유연하게 설정 가능.

## **로그 출력 경로 제어**

클래스 종류설명

| ConsoleAppender | 콘솔에 출력 |
| --- | --- |
| FileAppender | 고정된 파일에 저장 |
| RollingFileAppender | 시간/용량 기준으로 파일 분리 저장 |
| SMTPAppender | 메일 전송용 |
| DBAppender | DB에 로그 저장용 |

## **로그 Level정의**

| OFF | 로그 기록 안 함 |
| --- | --- |
| FATAL | 시스템 치명적 오류 |
| ERROR | 예상하지 못한 오류 |
| WARN | 경고, 주의 필요 |
| INFO | 운영 중 참고용 메시지 |
| DEBUG | 개발 중 디버깅 정보 |
| TRACE | 가장 세세한 단계의 로그 |

## **로그 롤링 정책 (파일 관리)**

> fileNamePattern: 저장될 파일명 패턴  
> maxHistory: 보관할 최대 파일 개수  
> maxFileSize: 파일 1개의 최대 용량  
> totalSizeCap: 전체 로그 용량 제한 (초과 시 오래된 로그 삭제됨)

## **로그 패턴 정책**

| %d{yyyy-MM-dd HH:mm:ss.SSS} | 로그 발생 시점의 날짜와 시간을 포맷에 맞춰 출력→ 2025-04-07 15:32:12.451 |
| --- | --- |
| %magenta(...) | 해당 내용(여기선 쓰레드)을 보라색으로 출력 (콘솔 색상 적용용) |
| %thread | 로그를 출력한 스레드 이름 |
| %highlight(...) | 로그 레벨에 따라 색상을 자동 적용(ex INFO → 녹색, WARN → 노란색, ERROR → 빨간색 등) |
| %level | 로그 레벨(INFO, WARN, ERROR 등)을 표시 |
| %logger{5} | 로거 이름(클래스명 또는 패키지 경로)의 마지막 5개 단어만 표시(ex com.example.controller.UserController → c.e.c.UserController) |
| - | 구분자 (시각적 효과) |
| %msg | 실제 로그 메시지 내용 |
| %n | 줄바꿈 (platform-specific newline, \n 또는 \r\n 등) |

## **LogBack 설정 예시**

```shell
[ 로그 저장 형식 지정 및 설정 ]
   
   <!-- 콘솔 출력 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <Pattern>${CONSOLE_PATTERN}</Pattern>
        </encoder>
    </appender>

    <!-- 파일 출력 + 롤링 -->
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
```
```shell
[ root 로거 설정 ]
<root level="INFO">
    // 콘솔 출력 및 파일 출력
    <appender-ref ref="STDOUT"/>
    <appender-ref ref="ROLLING_LOG_FILE"/>
</root>
```
```shell
[ 특정 패키지 로그 설정 ]

<logger name="com.example.application.paging" level="DEBUG" additive="false" >
    <appender-ref ref="STDOUT"/>
    <appender-ref ref="ROLLING_LOG_FILE"/>
</logger>

ex) JDBC 관련 로그 설정
<logger name="jdbc" level="OFF" additive="false">
    <appender-ref ref="STDOUT"/>
    <appender-ref ref="ROLLING_LOG_FILE"/>
</logger>
```

## **전체 코드**

**( Console + File 로그 출력 XML )**

```java
<?xml version="1.0" encoding="UTF-8" ?>
<configuration>
    
    <!-- 로그 xml 파일 환경변수 사용 property -->
    <property name="CONSOLE_PATTERN" value="%d{yyyy-MM-dd HH:mm:ss.SSS} %magenta([%thread]) %highlight([%-3level]) %logger{5} - %msg %n" />
    <property name="ROLLING_PATTERN" value="%d{yyyy-MM-dd HH:mm:ss.SSS}  %logger{5} - %msg %n" />
    <property name="FILE_NAME" value="C:/logs/application.log" />
    <property name="LOG_NAME_PATTERN" value="./logs/application-%d{yyyy-MM-dd HH:mm:ss}.%i.log" /> <!-- 1초 기준 로그 저장-->
    <property name="MAX_FILE_SIZE" value="10MB" />
    <property name="TOTAL_SIZE" value="30MB" />
    <property name="MAX_HISTORY" value="30" /> <!-- 보관 파일 개수 -->
    <!-- ----------------------------------------------------------- -->
    
    
    <!-- Console appender 설정 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <Pattern>${CONSOLE_PATTERN}</Pattern>
        </encoder>
    </appender>

   <!-- ----------------------------------------------------------- -->
   
   <!-- Rolling File appender 설정 -->
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
   
   <!-- ----------------------------------------------------------- -->
    
    
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

    <!-- ----------------------------------------------------------- -->
    
    
    <!-- 패키지 하위 로그 기록 (level 지정// 각자 맞는 패키지명으로 변경 필요) -->
    <logger name="com.example.application.fileInputOutput" level="INFO" additive="true" >
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </logger>
    <logger name="com.example.application.paging" level="DEBUG" additive="false" >
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </logger>

    
    <!-- ----------------------------------------------------------- -->
    
    
    <!-- 전역 로그 설정  -->
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="ROLLING_LOG_FILE"/>
    </root>
    
    <!-- ----------------------------------------------------------- -->
    
</configuration>
```

## 로그파일 기록 현황

![](https://blog.kakaocdn.net/dna/clFAx2/btsNr0Lfg6f/AAAAAAAAAAAAAAAAAAAAAC22jT1HWvvIybDa7hYdVZTuNquo8U3vgS9Dp54CCHlT/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=JtuSN6t7eWNByECbO8aHx%2BoE1u0%3D)

## *참고 자료*

[https://logback.qos.ch/manual/configuration.html](https://logback.qos.ch/manual/configuration.html)

 [Chapter 3: Configuration

In symbols one observes an advantage in discovery which is greatest when they express the exact nature of a thing briefly and, as it were, picture it; then indeed the labor of thought is wonderfully diminished. —GOTTFRIED WILHELM LEIBNIZ Chapter 3: Logba

logback.qos.ch](https://logback.qos.ch/manual/configuration.html)

[https://logging.apache.org/log4j/2.x/manual/configuration.html](https://logging.apache.org/log4j/2.x/manual/configuration.html)

 [Configuration file :: Apache Log4j

Starting with Log4j 2, the configuration file syntax has been considered part of the public API and has remained stable across significant version upgrades. The syntax of the configuration file changed between Log4j 1 and Log4j 2. Files in the Log4j 1 s

logging.apache.org](https://logging.apache.org/log4j/2.x/manual/configuration.html)

> 원문: https://gradualprecision.tistory.com/263

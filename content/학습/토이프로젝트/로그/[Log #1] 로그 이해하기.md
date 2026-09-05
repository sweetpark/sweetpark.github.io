---
title: [Log #1] 로그 이해하기
tags: [토이프로젝트, 로그]
created: 2026-09-05
modified: 2026-09-05
---

# [Log #1] 로그 이해하기

## 로그란?

- 로그(Log)는 시스템 내부에서 발생한 이벤트, 정보, 오류 등을 기록해두는 데이터  
- 개발자나 운영자가 프로그램의 상태를 파악하고, 에러 원인 분석이나 운영 상황 모니터링을 위해 매우 중요한 도구로 사용

## 로그 레벨(Level)

[ 알고있어야할 정보! ]  
로그에는 중요도에 따라 여러 단계가 있으며, 일반적으로 아래와 같은 순서로 동작  
(위로 갈수록 중요도가 높음)  
  
[Level]  
1. FATAL : 시스템이 즉시 종료될 정도로 치명적인 에러 발생 시 사용  
2. ERROR : 일반적인 에러 발생 시 사용되며, 예외 처리나 문제 추적에 필요  
3. WARN : 시스템 오류는 아니지만, 주의가 필요한 상황일 때 사용  
4. INFO : 시스템의 상태나 정상적인 운영 흐름을 설명할 때 사용  
5. DEBUG : 개발 중 필요한 상세 정보, 변수 상태 등을 기록할 때 사용  
6. TRACE : DEBUG보다 더 미세한 단위로, 모든 흐름을 추적하고 싶을 때 사용

## 로그 기록 방법

**[ 콘솔 출력 ]**  
- 가장 간단한 방법, 실제 로그 시스템과는 별개 (*일반적인 콘솔 출력)  
- 콘솔에만 출력되고,   
서버 종료 시 기록이 사라짐  
- 로그 레벨 구분이 안 되며, 많은 양의 로그를 다룰 땐 불편  
  
  
**[파일 출력]**  
- 일반적으로 사용하는 방식  
- 대표적인 로그 라이브러리: Logback, Log4j2, SLF4J  
("💡 보통 logback-spring.xml 또는 log4j2.xml 같은 설정 파일로 관리")  
  
<장점>  
- 로그 파일별 크기 제한 설정 가능  
- 일자별 파일 저장, 보관 개수 및 기간 지정 가능  
- 파일로 기록되므로 장기 분석, 검색에 유리  
  
  
**[ 메일 전송 ]**  
- 시스템 장애, 오류 발생 시 특정 로그를 이메일로 전송가능  
- 운영팀이나 개발팀에게 즉시 알림 가능  
  
  
**[DB 저장]**  
- 로그를 DB에 저장하면 쿼리를 통해 분석, 검색, 통계가 획득 가능  
- 단점) 성능 저하 가능성이 있으므로 주의

## 로그 예시

[ 일반적인 방법 ]  
- logback, log4j2 등 여러 구현체들을 파사드 패턴을 이용하여,  
개발자가 사용하기 쉽게 만든 인터페이스 사용  
  
[ @Slf4j 방법 ]  
- LoggerFactory에서 꺼내지 않아도, 어노테이션을 사용하여 손쉽게 사용 가능  
- Lombok 패키지를 설치해야함
```java
// [일반적인 방법]
private static final Logger logger = LoggerFactory.getLogger(logSample.class);
logger.info("[INFO] LOG 내용");

// [lombok]
@Slf4j
log.info("[INFO] 로그 내용");
```

## 파사드 패턴과 로그 시스템

**[ 파사드(Facade) 패턴 ]**  
 "파사드(Facade) 패턴이란 복잡한 구현 로직 뒤에 단순한 인터페이스를 제공하여, 사용자가 복잡한 내부 구조를 몰라도 기능을 쉽게 사용할 수 있도록 해주는 구조"  
  
**[ 파사드 적용 로그 ]**  
- 우리는 단순히 log.info("메시지")만 작성하면 되지만, 내부에서는 해당 로그가 콘솔에 출력될지, 파일에 저장될지, 메일로 전송될지 등 다양한 로직이 작동  
- 이처럼 로그 시스템은 복잡한 로직을 하나의 단순한 인터페이스(log.info) 뒤로 숨기고, 유연하게 설정만으로 동작 방식을 변경 가능  
  
<장점>  
- 구현체(Logback → Log4j2 등)를 손쉽게 교체 가능  
- 기존 코드를 수정하지 않고 기능을 확장할 수 있어 OCP 원칙(개방-폐쇄 원칙)에 적합

## 참고 사이트

1. spring docs

[https://docs.spring.io/spring-boot/reference/features/logging.html#features.logging.file-output](https://docs.spring.io/spring-boot/reference/features/logging.html#features.logging.file-output)

 [Logging :: Spring Boot

By default, Spring Boot logs only to the console and does not write log files. If you want to write log files in addition to the console output, you need to set a logging.file.name or logging.file.path property (for example, in your application.properties)

docs.spring.io](https://docs.spring.io/spring-boot/reference/features/logging.html#features.logging.file-output)

> 원문: https://gradualprecision.tistory.com/250

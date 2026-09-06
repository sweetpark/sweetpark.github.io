---
title: "Log 설정 및 Logging 사용"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Log 설정 및 Logging 사용

> [!NOTE] 실행 환경
> 버전 명시 없음 — SLF4J/Logback 언급 외 특정 Spring/Boot 버전은 확정하기 어렵다.

Logging

## SLF4J

*   수많은 로그 라이브러리들을 통합해서 인터페이스로 만든 것을 "SLF4J" 라고 함
*   Spring에서는 Logback, Log4J, Log4J2 등 많은 로그들이 있지만, 스프링 부트는 Logback을 대부분 사용함

## Logging 사용

*   Logging 선언

private Logger log = LoggerFactory.getLogger(getClass());  
private static final Logger log = LoggerFactory.getLogger(xxx.class)

*   Logging 호출

log.trace("[내용]");  
log.debug("[내용]");  
log.info("[내용]");  
log.warn("[내용]");  
log.error("[내용]");

*   Logging Level
    *   Trace > Debug > Info > Warn > Error
    *   보통 개발서버의 경우 Debug, 운영서버는 Info를 출력 ( 제일 상위에 있는것이 Trace )
        *   운영 환경에서 Debug/Trace까지 출력하면 로그량이 급격히 늘어 I/O 비용과 디스크 사용량이 커지므로, 문제 추적에 필요한 최소 수준(Info)만 남기고 상세 로그는 개발 단계에서만 켜는 것이 일반적이다
    *   해당 로그레벨에 따라 로그가 보일수도 있고, 안보일수도 있다
    *   "application.properties" 에서 로그레밸 설정 가능
        *   loggin.level.[패키지명]= info (info밑으로 로그 출력)
        *   주의) logging.lever.root로 지정할경우 spring의 모든 부분에 대해 설정하는 것이므로 조심

## Logging 사용시 장점

*   쓰레드 정보, 클래스 이름과 같은 부가 정보 함께 보기 가능
*   출력 모양 조정 가능
*   로그를 상황에 맞게 출력하거나 출력하지 않을 수 있다
*   파일이나 네트워크, 특정 위치등에 남길 수 있다 ( 로그 크기가 커질시 분할도 가능 )
*   성능면에서도 우수하다

## 참고 사이트

SLF4J - http://www.slf4j.org  
Logback - http://logback.qos.ch

## 관련 문서

- [(학습/프로젝트/토이프로젝트/로그) [Log #1] 로그 이해하기](../../프로젝트/토이프로젝트/로그/[Log%20#1]%20로그%20이해하기.md) — 이 노트의 SLF4J/로그레벨 개념을 파사드 패턴 관점에서 더 깊이 다루는 노트
- [(학습/프로젝트/토이프로젝트/로그) [Log #2] LogBack을 이용한 로그 설정](../../프로젝트/토이프로젝트/로그/[Log%20#2]%20LogBack을%20이용한%20로그%20설정.md) — 이 노트가 언급한 Logback을 logback-spring.xml로 실제 설정하는 실습 노트

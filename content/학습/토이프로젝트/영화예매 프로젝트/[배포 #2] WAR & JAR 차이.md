---
title: "[배포 #2] WAR & JAR 차이"
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [배포 #2] WAR & JAR 차이

## WAR 란?

웹 애플리케이션에 필요한 코드, 구성파일, 정적리소스, 라이브러리등을 패키징한 배포 파일.  
단, 내부의 tomcat이 없기에 WAR파일은 WAS에서 실행시켜야함 (독립적으로 실행 불가능)  
  
특징으로는, WEB-INF의 내부의 파일들의 경우 외부에서 직접적으로 접근하는 것을 차단할 수 있다. JAR파일의 경우 웹서버가 아닌 JVM에서 실행하는 것이어서 따로 spring security나 다른 방식으로 보완해야하지만 WAR의 경우 웹서버를 이용하므로 WEB-INF에 포함된 파일들의 외부 접근을 막을 수 있다.

## WAR 파일 내부구조

WEB-INF  
- classes : 자바파일 및 클래스 파일  
- lib : 프로젝트에서 사용된 모든 jar 파일 위치  
  
META-INF  
- MANIFAST.MF : 메인 클래스 정보 및 스프링부트 버전 , 자바 버전등 메타데이터 정보  
  
static  
- css, javascript, 이미지 정적 파일들  
  
templates  
- thymeleaf와 같은 템플릿 엔진 파일

## WAR 파일 빌드 설정

*   build.gradle 수정
    *   플러그인 추가
    *   bootWar 작성
    *   tomcat 설정
*   MainClass 설정
    *   SpringBootServletInitializer 상속
*   application properties
    *   컨텍스트 경로 설정

```java
1. [Build.gradle]
plugins {
    id 'java'
    id 'war'
    ..
}

bootWar {
    mainClass = 'XXX'
    archiveFileName = "ROOT.war"
}

//...

providedRuntime 'org.springframework.boot:spring-boot-starter-tomcat'
//implementation...

2. [Main.class]
@SpringBootApplication
public class MainApplication extends SpringBootServletInitializer {

	public static void main(String[] args) {
		SpringApplication.run(MainApplication.class, args);
	}

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(MainApplication.class);
	}

}

3. [application.properties] 

(WAR 배포시 기본 URL 경로)
server.servlet.context-path=/
```

## WAR 빌드 방법

1. 기존 파일 삭제 후 bootWar 빌드  
**./gradlew clean bootWar**  
  
2. 일반적인 빌드  
**./gradlew build**  
  
3. 테스트 없이 빌드  
**./gradlew build -x test**

war 실행방법)  
  
ex) Tomcat일경우, tomcat에 해당하는 위치에 war파일 넣기 ( /path/to/tomcat/webapps/ROOT.war )

* * *

## JAR 란?

모든 파일을 압축하여 단일 파일로 제공하고, 플랫폼의 영향에 상관없이 독립적으로 실행이 가능한 특징을 지니고 있다.  
스프링 부트에서의 tomcat또한 내장을 하고 있어서 JAR파일 하나라도 충분히 application을 실행시킬 수 있는 특징이 있다.  
  
또한, 모든 파일을 관리하고 있으며 zip 파일로 만들어서 손쉽게 내부에 있는 파일 내용들을 확인할 수 있는 장점이 존재한다.  
  
하지만 파일이 의존성 규모에 따라 비대해질 수 있으며, 업데이트시마다 애플리케이션을 다시 로딩하는데에 시간 소요가 있을 수 있으며, zip파일로 디컴파일이 손쉽기 때문에 보안상의 이슈가 존재할 수 있다  
(대규모 프로젝트의 경우 적합하지 않을 수 있음)

## JAR 파일 내부구조

BOOT-INF  
- classes : 자바파일 및 클래스 파일  
- lib : 애플리케이션이 의존하는 모든 jar 라이브러리 파일 모음  
  
META-INF  
- MANIFAST.MF : 메인 클래스 정보 및 스프링부트 버전 , 자바 버전등 메타데이터 정보  
  
org   
- springframework : 스프링 부트 로더 클래스 포함

## JAR 파일 빌드 설정

*   build.gradle
    *   bootJar 추가
    *   tomcat 내장 설정

```java
1. [build.gradle]

bootJar {
    mainClass = 'XXX'
    archiveFileName = 'application.jar'
}

//...
implementation 'org.springframework.boot:spring-boot-starter-tomcat'
//...
```

## JAR 빌드방법

1. bootJar 빌드  
**./gradlew bootJar**  
  
2. test 없이 빌드  
**./gradlew build -x test**  
  
3. 기존파일 삭제후 빌드 .  
**/gradlew clean build**  
  
4. 일반적인 빌드  
**./gradlew build**

JAR 실행)  
  
java -jar [jar파일 이름].jar

* * *

## 결론

JAR VS WAR  
- 자체적으로 웹서버를 두어서 애플리케이션을 구동하고 싶다 (WAR)  
- JVM위에서 애플리케이션을 구동해도 상관없다 (JAR)  
- JSP를 사용해야할 경우 (WAR)  
(TOMCAT 표준은 JSP를 지원하지만, spring boot의 tomcat의 경우 추가적인 설정이 필요하며 WAR파일로 배포해야 jsp처리를 할 수 있다)

> 원문: https://gradualprecision.tistory.com/220

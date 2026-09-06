---
title: "@Component에 관하여..."
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# @Component에 관하여...

> [!NOTE] 실행 환경
> 버전 명시 없음 — import 구문이 생략되어 있고 @Component/@Autowired/@ComponentScan 등 Spring 공통 문법만 사용되어 특정 버전을 확정하기 어렵다. Servlet API를 직접 다루는 인접 노트(Cookie 사용법, Servlet Filter)와 작성 스타일이 유사한 것으로 보아 Spring Boot 2.x대 학습 자료로 추정.

@Component는 클래스에 붙이면 별도로 @Configuration 클래스에서 @Bean으로 수동 등록하지 않아도 컴포넌트 스캔을 통해 스프링이 자동으로 빈으로 등록해주는 애노테이션이다. 매 클래스마다 수동으로 빈을 등록하는 번거로움과 등록 누락 실수를 줄이기 위해 사용한다.

### 컴포넌트 스캔

*   @Component 를 지정해주면, 따로 Config에 작성해서 @Bean 으로 등록해주지 않아도, 자동으로 spring이 bean으로 등록해준다.

```java
@Component
public class BeanTest implements BeanInterface{}

@Component
public class BeanTestImpl{
    
    private final BeanInterface beanInterface;
    
    // 자동으로 @COMPONENT가 붙은 정보가 주입됨
    // BeanTest 클래스가 beanInterface에 주입됨
    @Autowired
    public BeanTestImpl(BeanInterface beanInterface){
        return this.beanInterface;
    }
}
```

### @Component 스캔 대상 설정

*   @ComponentScan( basePackages = "프로젝트명" )
*   basePackages 하위 폴더에 있는 @Component를 긁음
*   관례) CoreApplication 실행 메인 메서드가 있는 위치에 AppConfig를 설정

```java
@Configuration
@ComponentScan( basePackges = "프로젝트명.core" )
public class AppConfig{

}
```

### @ComponentScan 옵션 정보

*   basePacages : Component 스캔 시작 지점 설정
*   IncludeFilters : Component 스캔을 해야하는 클래스 및 파일 지정
*   ExcludeFilters : Component 스캔을 하지말아야하는 클래스 및 파일 지정
*   lazyInit : 빈을 먼저 생성후 추후 초기화
*   nameGenerator : 등록하려는 빈의 이름을 지정
*   scopeResolver : 스캔에서 감지된 빈에 사용자 정의 범위 확인자 지정
*   scopedProxy : 감지된 Bean에 대한 프록시를 생성하는 방법 정의

```java
@Configuration
@ComponentScan(
    basePackages = "com.example.app",
    includeFilters = @Filter(type = FilterType.ANNOTATION, classes = MyCustomAnnotation.class),
    excludeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = UnwantedComponent.class),
    lazyInit = true
)

public class AppConfig {
    // Configuration beans
}
```

### Bean 충돌

*   Bean 등록 방법 
    *   자동 Bean
        *   @Component 
    *   수동 Bean
        *   @Bean (name = ?) // name 생략 가능
*   자동 Bean VS 수동 Bean
    *   수동 Bean이 우선권을 가진다
*   자동 Bean Vs 자동 Bean
    *   충돌이 일어나, 오류를 내뱉음

### 컴포넌트 스캔 대상

*   @Component : 컴포넌트 스캔에서 사용
*   @Controller : @Component가 포함되어있음 + 스프링에서 MVC 컨트롤러에서 사용
*   @Service : @Component가 포함되어있음 + 비즈니스 로직으로 사용
*   @Repository : @Component가 포함되어있음 + 데이터 접근 계층에서 사용
*   @Configuration : @Component가 포함되어있음 + 스프링 설정정보에서 사용 (ex AppConfig.class )
    *   ex) AppConfig의 경우 basePackges를 사용하지 않고, Application실행 계층에 동일하게 위치시킴

## 관련 문서

- [(Spring) 회원 등급별 상품 할인 적용 - 핵심 개념 및 특징 정리](실습_스프링MVC/회원%20등급별%20상품%20할인%20적용/[Spring]%20회원%20등급별%20상품%20할인%20적용%20-%20핵심%20개념%20및%20특징%20정리.md) — 자동/수동 Bean 등록과 컴포넌트 스캔을 실제로 적용한 미니 프로젝트

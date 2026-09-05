---
title: @Component에 관하여...
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# @Component에 관하여...

@Component

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

> 원문: https://gradualprecision.tistory.com/58

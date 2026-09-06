---
title: "빈 생성시 값 초기화 방법 ( init() )"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# 빈 생성시 값 초기화 방법 ( init() )

Spring bean LifeCycle

## 스프링 빈의 라이프 사이클

1.  스프링 컨테이너 생성
2.  스프링 빈 생성
3.  의존관계 주입
4.  초기화 콜백
5.  사용
6.  소멸전 콜백
7.  스프링 종료

*   스프링 빈의 생명주기에서 객체 생성과 초기화가 각기 다른 단계에서 이루어지므로 분리해서 생각해야한다.

## 스프링 빈의 초기화 방법 (콜백 지원 방법)

세 방식 모두 초기화·소멸 시점에 콜백을 실행한다는 결과는 같지만, 코드 결합도와 적용 가능 범위가 달라 상황에 따라 골라야 한다.

*   인터페이스
    *   InitializingBean, DisposableBean

```java
public class TestBean implements InitalizingBean, DisposableBean{
   
    public TestBean(){}
    
    public void init(){
      // init 작업
    }
    
    
    public void close(){
       // close 
   }
   
   @Override
   public void afterPropertiesSet() throws Exception{
        init();
   }
   
   @Override
   public void destory() throws Exception{
       close();
   }
}
```

*   설정 정보에 초기화 메서드, 종료메서드
    *   @Configuration (initMethod = "[init함수]", destoryMethod = "[close 함수]")

```java
public class TestBean{
   
    public TestBean(){}
    
    public void init(){
      // init 작업
    }
    
    
    public void close(){
       // close 작업
   }
}

@Configuration
static class LifeCycleConfig{
    
    @Bean(initMethod = "init", destoryMethod = "close")
    public TestBean testBean(){
        TestBean testBean = new TestBean();
        return testBean;
    }
}
```

*   어노테이션 초기화 방법
    *   @PostConstruct , @PreDestory

```java
public class TestBean{
   
    public TestBean(){}
    
    @PostConstruct
    public void init(){
      // init 작업
    }
    
    @PreDestory
    public void close(){
       // close 작업
   }
  
}
```

### 선택 기준

*   인터페이스(InitializingBean/DisposableBean) 방식은 스프링 전용 인터페이스에 직접 의존하게 되어 코드가 스프링에 강하게 결합되고, 메서드명도 afterPropertiesSet/destroy로 고정된다는 제약이 있다.
*   설정 정보(@Bean initMethod/destroyMethod) 방식은 소스 코드를 수정할 수 없는 외부 라이브러리 클래스에도 적용할 수 있다는 것이 가장 큰 장점이며, 메서드명도 자유롭게 지정할 수 있다.
*   애노테이션(@PostConstruct/@PreDestroy) 방식은 스프링이 아닌 자바 표준(JSR-250) 애노테이션이라 특정 프레임워크에 종속되지 않고 코드도 간결하므로, 외부 라이브러리를 다루는 경우가 아니라면 일반적으로 가장 권장되는 방식이다.

## 관련 문서

- [(학습/프레임워크/Spring Framework) Bean ( @Scope , Provider )](Bean%20(%20@Scope%20,%20Provider%20).md) — 동일한 스프링 빈 생명주기(컨테이너 생성→DI→초기화 콜백)를 스코프 관점에서 보충 설명하는 노트

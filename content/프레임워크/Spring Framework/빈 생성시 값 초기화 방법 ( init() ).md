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

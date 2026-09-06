---
title: "Bean ( @Scope , Provider )"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Bean ( @Scope , Provider )

> [!NOTE] 실행 환경
> 버전 명시 없음 — `ObjectProvider`, `@Scope(proxyMode=...)` 등 Spring 표준 API만 사용되어 특정 버전은 확정하기 어렵다.

## 빈 스코프란?

*   Bean이 존재할 수 있는 범위
*   종류
    *   싱글톤 스코프
    *   프로토타입 스코프
    *   웹 관련 스코프

## 스코프 지정 방법

```java
//Component 등록
@Scope("[스코프 지정]")
@Component
public class Test(){}

// 수동 등록
@Scope("[스코프 지정]")
@Bean
public class Test(){
    return new Test();
}
```

*   scope
    *   singleton
    *   prototype
    *   request
    *   session
    *   application

## 스코프 특징

*   싱글톤 빈
    *   객체 생성 -> 의존관계 주입 -> 초기화 -> 사용 -> 소멸전 콜백 -> 소멸
*   프로토타입 빈
    *   객체 생성 -> 의존관계 주입 -> 초기화
    *   프로토타입의 경우 1) 초기화 진행 후 클라이언트 코드에게 관리 위임
    *   프로토타입의 경우 2) 프로토타입 빈 요청이 올때마다 새로운 객체를 생성하게 됨\ 
*   웹 스코프
    *   웹 요청 -> 객체 생성 -> 의존관계 주입 -> 초기화 -> 웹 응답 -> 소멸전 콜백
    *   웹 스코프 종류 : Request, application, session, websocket  
        *   Request : 웹 요청이 들어왔을때 객체생성
        *   application : application이 시작 될때 객체 생성
        *   session : session 연결이 시작될때 객체 생성
        *   websocket : 웹 소켓 세션이 시작될때 객체 생성

## 싱글톤 + 프로토타입

*   싱글톤 객체 생성 후 프로토타입 빈을 호출하는 경우
    *    싱글톤 객체는 한번 생성 후 공유해서 사용하므로 딱 1개만 생성되게 된다
    *   하지만, 프로토타입의 경우 싱글톤에서 호출이 될뿐 새롭게 요청이 오는게 아니므로 싱글톤처럼 사용되게 된다.

```java
public class Test{
    
    @Test
    void testExample(){
        AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(SingletonBean.class, PrototypeBean.class);
        
        SingletonBean singletonBean1 = ac.getBean(SingletonBean.class);
        int count1 = singletonBean1.logic();
        
        
        SingletonBean singletonBean2 = ac.getBean(SingletonBean.class);
        int count2 = singletonBean2.logic();
    
    }
    
    
    static class SingletonBean {
       private final PrototypeBean prototypeBean;
         
       @Autowired
       //여기서 Prototype이 싱글톤 생성시 같이 생성됨 (의존관계 주입)
       public ClientBean(PrototypeBean prototypeBean) {
            this.prototypeBean = prototypeBean;
       }
       
       public int logic() {
           prototypeBean.addCount();
           int count = prototypeBean.getCount();
           return count;
       }
       
    }

    @Scope("prototype")
    static class PrototypeBean {
        private int count = 0;
         
        public void addCount() {
            count++;
        }

    }
}
```

*   logic()이 호출되어서, prototype을 사용하는건 처음 싱글톤 객체 생성시 만들어졌던 프로토타입 빈을 사용한것이다.
*   따라서, 결과가 count1 = 1, count2 = 2 가 되게된다 (원래는 프로토타입이 계속 새로 생성되기를 원함)

*   해결1) logic이 호출될때마다, Prototype Bean을 조회해서 사용 (Dependency Lookup)

```java
public class Test{
    
    @Test
    void testExample(){
        AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(SingletonBean.class, PrototypeBean.class);
        
        SingletonBean singletonBean1 = ac.getBean(SingletonBean.class);
        int count1 = singletonBean1.logic();
        
        
        SingletonBean singletonBean2 = ac.getBean(SingletonBean.class);
        int count2 = singletonBean2.logic();
    
    }
    
    
    static class SingletonBean {
       
       @Autowired
       private ApplicationContext ac;
        
       
       public int logic() {
           //DL (조회를 통한 Bean get)
           PrototypeBean prototypeBean = ac.getBean(PrototypeBean.class);
           prototypeBean.addCount();
           int count = prototypeBean.getCount();
           return count;
       }
       
    }

    @Scope("prototype")
    static class PrototypeBean {
        private int count = 0;
         
        public void addCount() {
            count++;
        }

    }
}
```

*   해결2) ObjectProvider , ObjectFactory
    *   ObjectProvider : 스프링에서 지원하는 provider (다른 컨테이너를 사용하지 않는다면 기능이 다양한 해당 provider 추천)
    *   Provider  : java에서 지원하는 provider ( spring 컨테이너 이외의 컨테이너에서도 사용할 수 있음, 스프링에 종속적이지 않음)

```java
public class Test{
    
    @Test
    void testExample(){
        AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(SingletonBean.class, PrototypeBean.class);
        
        SingletonBean singletonBean1 = ac.getBean(SingletonBean.class);
        int count1 = singletonBean1.logic();
        
        
        SingletonBean singletonBean2 = ac.getBean(SingletonBean.class);
        int count2 = singletonBean2.logic();
    
    }
    
    
    static class SingletonBean {
       
       /*
       // java 지원 provider
       
       private Provider<PrototypeBean> provider;
       
       */
       
       // spring 지원 provider
       @Autowired
       private ObjectProvider<PrototypeBean> prototypeBeanProvider;
        
       
       public int logic() {
           //DL (조회를 통한 Bean get)
           // PrototypeBean prototypeBean = provider.get();
           PrototypeBean prototypeBean = prototypeBeanProvider.getObject();
           prototypeBean.addCount();
           int count = prototypeBean.getCount();
           return count;
       }
       
    }

    @Scope("prototype")
    static class PrototypeBean {
        private int count = 0;
         
        public void addCount() {
            count++;
        }

    }
}
```

## Web Scope

*   Web Scope 생명주기
    *   웹 관련 스코프의 경우 해당 요청이 들어왔을 때 생성되고, 응답 후 소멸하게 되는 생명주기를 가지게 된다.
    *   하지만, 스프링 컨테이너의 경우 싱글톤 빈으로 관리하게 되고 application 시작시 생성되고 application이 종료될때까지 생명주기를 가지게 된다.
    *   생명주기 : web Scope < spring container singleton Scope
*   Proxy 사용
    *   싱글톤 생명주기를 맞추기 위해서 , Proxy를 사용해서 Web Scope를 맞추게 됨
    *   웹 요청이 오기전에 spring에서 미리 생성하게됨

```java
public class TestExample{

    @Test
    public void testExample(){
        AnnotaionConfigApplicationContext ac = new AnnotaionConfigApplicationContext(AppConfig.class);
        
        RequestBean requestBean = ac.getBean(RequestBean.class);
        System.out.println("Request Count up" + requestBean.incrementAndGet());
        
        ac.close();
    }
    
    
    
    @Configuration
    static class AppConfig{
         
         @Bean
         // "value=" 의 경우, 파라미터가 2개이상일때는 value를 지정해서 작성해야함
         // 파라미터를 한개만 넘길경우 value 생략가능
         @Scope(value = "request" , proxyMode = ScopedProxyMode.TARGET_CLASS)
         public RequestBean requestBean(){
              return new RequestBean();
         }
         
    }
    
    
    
    static class RequestBean{
         privage int count = 0;
         
         public int incrementAndGet(){
             count++;
             
             return count;
        }
    }
    
    
 }
```

## 관련 문서

- [(학습/프레임워크/Spring Framework) 빈 생성시 값 초기화 방법 ( init() )](빈%20생성시%20값%20초기화%20방법%20(%20init()%20).md) — 이 노트에서 다루는 빈 생명주기의 초기화/소멸 콜백 부분을 상세히 다루는 노트
- [(학습/프레임워크/Spring Framework) 싱글톤 컨테이너](싱글톤%20컨테이너.md) — 이 노트가 다루는 @Scope(prototype/web scope)가 필요한 이유인 싱글톤 컨테이너의 상태 관리 문제를 다루는 노트

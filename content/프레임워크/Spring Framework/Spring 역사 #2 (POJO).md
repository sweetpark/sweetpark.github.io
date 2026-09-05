---
title: "Spring 역사 #2 (POJO)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring 역사 #2 (POJO)

POJO

## POJO ?

*   Plain Old Java Object
*   말그대로 , 순수 자바 객체를 이용한 프로그래밍 방법을 의미한다.
*   EJB와 같은 **프레임워크에 종속된 객체(상속, 인터페이스)**가 아닌 **순수 JAVA 객체**를 이용하자는 뜻에서 생기게 됨  
    *   (여러가지 종속된 객체의 경우 간단한 객체더라도 무거운 객체로 변경이 되기 때문에 비효율적이라고 판단)
    *   쓸데없는 부분들은 제거하고, 필요한 부분에만 사용하자 -> 의존성 주입 이용 (어노테이션)

## POJO 위반 사례

*    1. 미리 정의된 클래스의 확장

```java
public class Test extends javax.servlet.http.HttpServlet {...
```

*   2. 미리 정의된 인터페이스의 구현

```java
public class Test implements javax.ejb.EntityBean{ ...
```

*   3. 미리 정의된 애너테이션을 포함

```java
@javax.persistence.Entity public class Test{...
```

## POJO 예시

*   getter, setter를 이용한 순수 자바 객체 (종속적이지 않음)
    *   상속, 인터페이스 x

```java
ublic class HelloService {
    private String message;

    public GreetingService(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void hello() {
        System.out.println("info: " + message);
    }
}
```

## Spring과 POJO

*   Spring 은 POJO 프로그래밍을 작성하기 위해서 IoC (Inversion Of Control) / DI (Dependency Injection) , AOP, PSA를 지원함

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean
    public HelloService helloService() {
    	//DI ( = 생성자 주입)
        return new HelloService("Hello, Spring!");
    }
}
```

*   @AppConfig 는 스프링의 설정 클래스
*   @Bean 을 이용해서 HelloService 빈을 생성
*   IOC (제어의 역전)을 통해 HelloService의 객체 관리를 spring에게 위임

```java
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class MainApp {
    public static void main(String[] args) {
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        HelloService helloService = context.getBean(HelloService.class);
        helloService.hello();
    }
}
```

*   Main 메서드에서 HelloService의 빈을 가지고와서 원하는 메서드를 호출함
*   이로써, Spring은 POJO를 지키며 프로그래밍을 가능하게 만듬

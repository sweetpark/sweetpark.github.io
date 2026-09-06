---
title: "Spring 컨테이너"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring 컨테이너

> [!NOTE] 실행 환경
> Spring Framework 6.1.12 공식 문서(AnnotationConfigApplicationContext, ClassPathXmlApplicationContext javadoc)를 직접 인용하고 있어, Spring 6.x대(Spring Boot 3.x) 학습 자료로 확인됨.

Spring Container

## Spring Container

*   spring 컨테이너는 Config를 담당하는 역할
*   spring 컨테이너는 Config 방식으로 "어노테이션 기반 config" 와  "xml기반 Config"로 구성가능  
    *   AnnotationContext
        *   [https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/context/annotation/AnnotationConfigApplicationContext.html](https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/context/annotation/AnnotationConfigApplicationContext.html)
    *   ClassPathXmlApplicationContext
        *   [https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/context/support/ClassPathXmlApplicationContext.html](https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/context/support/ClassPathXmlApplicationContext.html)
*   Spring Container를 생성하면, 그 안에 Bean 을 등록할 수 있게 된다

실무에서는 XML 기반 설정보다 애노테이션 기반(@Configuration + @Bean, 컴포넌트 스캔) 설정이 압도적으로 많이 쓰인다. 자바 코드로 작성하므로 컴파일 타임에 오탈자를 잡을 수 있고, XML 고유 문법을 따로 배울 필요가 없어 생산성이 높기 때문이다. 다만 스프링 이전 EJB/레거시 시절 코드와의 호환을 위해 XML 방식도 여전히 지원된다.

## Annotaion 기반 Context

*   AppConfig 구성 ( Spring Container 생성 )

```java
@Configuration
public class AppConfig {

    // 생성자 주입
    @Bean
    public MemberService memberService(){
        //return new MemberServiceImpl(new MemoryMemberRepository());
        return new MemberServiceImpl(new DbMemberRepository());
    }
    
    
}
```

*   Context 구현 (ApplicationContext)
    *   ApplicationContext는 최상위의 인터페이스이고, Annotaion 또는 XmlConfig의 경우 구현체

```java
public static void main(String []args){
    
    //Annotaion Config 생성
    ApplicationContext applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);
    applicationContext.getBean("memberService", MemberService.class);
    
    Member member = new Member(1L, "memberA", Grade.VIP);
    memberService.join(member);
    
    Member findMember = memberService.findMember(1L);
    System.out.println("new member = "+ member.getName());
    System.out.println("find member = "+ findMember.getName());
}
```

## Spring Contatiner 싱글톤

*   Spring Containter는 Config의 정보를 이용해서, Bean들을 싱글톤으로 관리하게 된다
*   자원을 효율적으로 이용하게 되고, 무분별한 생성을 방지할 수 있다

## 관련 문서

- [(학습/프레임워크/Spring Framework) 싱글톤 컨테이너](싱글톤%20컨테이너.md) — Spring 컨테이너가 빈을 싱글톤으로 관리하면서 발생하는 문제와 해결책을 다루는 후속 노트
- [(학습/프레임워크/Spring Framework) Spring Bean (+ Bean Factory)](Spring%20Bean%20(+%20Bean%20Factory).md) — 이 노트에서 다루는 ApplicationContext의 상위 인터페이스인 BeanFactory와 BeanDefinition 메타데이터를 다루는 노트

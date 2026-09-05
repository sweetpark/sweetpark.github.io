---
title: "Spring 컨테이너"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring 컨테이너

Spring Container

## Spring Container

*   spring 컨테이너는 Config를 담당하는 역할
*   spring 컨테이너는 Config 방식으로 "어노테이션 기반 config" 와  "xml기반 Config"로 구성가능  
    *   AnnotationContext
        *   [https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/context/annotation/AnnotationConfigApplicationContext.html](https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/context/annotation/AnnotationConfigApplicationContext.html)
    *   ClassPathXmlApplicationContext
        *   [https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/context/support/ClassPathXmlApplicationContext.html](https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/context/support/ClassPathXmlApplicationContext.html)
*   Spring Container를 생성하면, 그 안에 Bean 을 등록할 수 있게 된다

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

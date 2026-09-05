---
title: Spring Bean (+ Bean Factory)
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring Bean (+ Bean Factory)

Spring Bean

## Bean Factory

*   Bean의 최상위 계층의 인터페이스 
    *   [순서] 
    *   1. Bean Factory
    *   2. ApplicationContext
    *   3. AnnotationConfigApplicationContext
*   대부분 bean에 있어 Bean Factory 내부에 기능들이 존재
*   Bean Factory 또는 기능을 상속받은 ApplicationContext를 "스프링 컨테이너"라고 일컫음

## Bean 확인 메서드

AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);

*   전체 조회
*   조회
*   타입 조회

```java
public static void main(String [] args){
        
        AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext("AppConfig.class");		
		
        // 1. Bean 전체 조회
        String [] beanDefinitionNames = ac.getBeanDefinitionNames();
		
        for (String beanDefinitionName : beanDefinitionNames) {
			Object bean = ac.getBean(beanDefinitionName);
			System.out.println("bean = " + bean);
		}
        
        
        // 2. 직접 등록한 bean 조회
         String [] beanDefinitionNames = ac.getBeanDefinitionNames();
		
        for (String beanDefinitionName : beanDefinitionNames) {
            
            //Bean 이름을 통한 조회
            BeanDefinition beanDifinition = ac.getBeanDefinition(beanDefinitionName);
            
            if (beanDefinition.getRole() == BeanDefinition.ROLE_APPLICATION){
			    
                Object bean = ac.getBean(beanDefinitionName);
			    System.out.println("bean = " + bean);
                
		    }    
        }
        
        // 3. 빈이름으로 조회 (타입 조회)
        // * Assertions -> import org.assertj.core.api.Assertions;
        MemberRepository memberRepository = ac.getBean("memberRepository", MemberRepository.class);
        Assertions.assertThat(memberRepository).isInstanceOf(MemberRepository.class);
}
```

## Bean Definition

*   Bean의 메타정보를 이용해서 여러 개의 Xml, AnnotationConfigContext 등을 스프링이 이해할 수 있게 도와준다.
*   Bean Reader가 존재
*   Bean 메타정보
    *   BeanClassName : 생성할 빈의 클래스 명
    *   factoryBeanName : 팩토리 역할의 빈을 사용할 경우 이름
    *   factoryMethodName : 빈을 생성할 팩토리 메서드 지정
    *   Scope : 싱글톤 (기본값)
    *   lazyInit : 스프링 컨테이너를 생성할 때 빈을 생성하는 것이 아니라, 실제 빈을 사용할 때 까지 최대한 생성을 지연처리 하는지 여부
    *   InitMethodName : 빈을 생성하고, 의존관계를 적용한 뒤에 호출되는 초기화 메서드 명
    *   DestoryMethodName : 빈의 생명주기가 끝나서 제거하기 직전에 호출되는 메서드 명
    *   Constructor arguments, Properties : 의존관계 주입에서 사용

```java
void beanDefenition() {
        
        String[] beanDefinitionNames = ac.getBeanDefinitionNames();
        
        for (String beanDefinitionName : beanDefinitionNames) {
                BeanDefinition beanDefinition = ac.getBeanDefinition(beanDefinitionName);
            
                if (beanDefinition.getRole() == BeanDefinition.ROLE_APPLICATION) {
            
                    System.out.println(" beanDefinition = " + beanDefinition);
                } 
            }
            
}
```

> 원문: https://gradualprecision.tistory.com/56

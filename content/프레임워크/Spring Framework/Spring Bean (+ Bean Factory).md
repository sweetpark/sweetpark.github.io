---
title: "Spring Bean (+ Bean Factory)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring Bean (+ Bean Factory)

> [!NOTE] 실행 환경
> 버전 명시 없음 — `AnnotationConfigApplicationContext`, `BeanDefinition` 등 Spring 공통 API만 사용되어 특정 버전 확정은 어려움.

Spring Bean

## Bean Factory

*   Bean의 최상위 계층의 인터페이스 
    *   [순서] 
    *   1. Bean Factory
    *   2. ApplicationContext
    *   3. AnnotationConfigApplicationContext
*   대부분 bean에 있어 Bean Factory 내부에 기능들이 존재
*   Bean Factory 또는 기능을 상속받은 ApplicationContext를 "스프링 컨테이너"라고 일컫음

실무에서는 BeanFactory를 직접 쓰기보다 이를 상속한 ApplicationContext를 사용한다. BeanFactory는 빈을 등록·조회하는 최소 기능만 제공하는 반면, ApplicationContext는 메시지소스를 이용한 국제화, 이벤트 발행, 환경변수(Environment) 처리 등 실무 애플리케이션에 필요한 부가 기능까지 함께 제공하기 때문이다.

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

BeanDefinition이라는 공통 메타정보 포맷을 두는 이유는, XML 설정과 애노테이션(@Configuration) 기반 설정처럼 서로 다른 설정 방식을 스프링 컨테이너가 동일한 내부 표현으로 다루기 위해서다. 설정 방식이 무엇이든 결국 BeanDefinition으로 변환되므로, 컨테이너의 빈 생성·조회 로직은 설정 방식에 관계없이 동일하게 동작할 수 있다.

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

## 관련 문서

- [(학습/프레임워크/Spring Framework) Spring 컨테이너](Spring%20컨테이너.md) — BeanFactory를 구현하는 AnnotationConfigApplicationContext 등 실제 컨테이너 종류를 다루는 노트
- [(학습/프레임워크/Spring Framework) JAVA 정리]([Java]%20JAVA%20정리%20-%20핵심%20개념%20및%20특징%20정리.md) — "DI의 본질(구성과 사용의 분리)"을 순수 자바 코드로 직접 구현해보며 BeanFactory가 자동화하는 조립 과정을 이해하는 노트

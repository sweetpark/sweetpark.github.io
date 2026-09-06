---
title: "스프링 핵심원리"
tags: [학습, 개발-CS, CS-기초, Spring-Framework, 개발, Spring]
created: 2026년 2월 4일 오전 10:12
modified: 2026-09-05
---

# 스프링 핵심원리

> [!NOTE]
> 좋은 객체지향 설계(SOLID), IoC/DI 컨테이너, 스프링 빈 등록(컴포넌트 스캔), 의존관계 주입 방법, 싱글톤·프로토타입·웹 스코프, 빈 생명주기 콜백 등 김영한 스프링 핵심 원리를 정리한다.

> [!NOTE] 실행 환경
> 본문 코드에 `jakarta.annotation.PostConstruct`/`PreDestroy`, `jakarta.inject:jakarta.inject-api:2.0.1` 의존성이 등장하는 것으로 보아 Spring Boot 3.x(Spring 6.x, jakarta 네임스페이스) 환경으로 확인된다.

## 📌 개념

## 스프링 단축키

> [!NOTE]
> 1. 오류 밑줄 바로가기
> - F2
> 
> 2. method 자동 넣기
> - alt + insert
> - 옵션 개수 드래그 → Shift 이용
> 
> 3. 자동 줄 완서
> - shift + ctrl + Enter
> 
> 4. 왼값 자동 완성 ( 오른값에 따른 )
>  - ctrl + alt + v
> 
> 5. static import
> - alt + enter
> 
> 6. 히스토리 ( 파일 및 클래스 )
> - ctrl  + e
> 
> 7. 리펙토링
> - ctrl + alt + m
> 
> 8. 복사
> - ctrl + d
> 
> 9. 테스트 만들기
> - ctrl + shift + T

> [!NOTE]
> 중요점)
> - 스프링 객체지향은 인터페이스 기준 설계이다 ( 자식 클래스에서 상속받아 확장된 것은 이용하기 어렵다 - 생성자 주입으로는 )
> -

### EJB

- JAVA 표준 기술
- 객체지향 설계 지원
- 다루기가 어렵다
    - ORM 기술 : EJB엔터티빈 → 하이버네이트 → JPA

### SPRING

- EJB는 너무 의존적으로 설계하게됨 → 좋은 객체지향을 할 수 없음
    - EJB → 차라리 순수 자바로 돌아가자 (POJO)
    - 순수 자바 기능개발 어려움
    - 스프링 탄생 시점
- EJB라는 겨울이 지나, 봄이 왔다는 의미에서 스프링이라고 지어짐
- spring boot전까지는 설정을 많이해야하는 이슈가 있었음
    - 스프링 부트 장점
        - tomcat이 내장되어있음
        - 손쉬운 빌드 구성 → starter 종속성 제공
        - 외부라이브러리 (3rd parth) 와 자동 구성
- 스프링 이란?
    - DI 컨테이너 기술 → 스프링 빈 관리
    - 스프링 프레임워크
    - 스프링 부트, 스프링 프레임웍을 모두 모함한 스프링 생태계
- 스프링을 왜 만들었을까?
    - 자바 언어 기반의 프레임워크
    - 객체 지향으로 만들수 있도록 도와주는 스프링
- 

### 좋은 객체지향이란?

- 객체 지향 특징
    - 추상화
    - 캡슐화
    - 상속성
    - 다형성
- “객체”들의 모임
    - 객체 지향 프로그래밍은 유연하고 변경을 용이
- 가장 중요한 부분은 다형성의 활용
    - 역할 (인터페이스) 과 구현으로 나뉜다
        - A역할과 B역할은 구현이 바뀐다고 해서 영향을 주지 않는다
        - 역할은 고정
        - 구현이 여러개로 구현할 수 있어도 상관이 없다 (대체 가능)
        - ex) 자동차 → k3, k5 , 아반떼, 테슬라 …
    - 자버 언어의 다형성
        - 역할 = 인터페이스
            - (물론, 상속으로도 다형성 역할을 줄 수 있지만, 인터페이스를 이용하는 것이 더 좋다)
        - 구현 = 인터페이스를 구현한 클래스 혹은 객체
    - 다형성 구현 방법
        - 오버라이딩 ( 상속 혹은 인터페이스)
        - 부모 객체 ←  new 자식 객체
- 역할과 구현을 분리할 경우
    - 클라이언트는 변경할 필요없다 (사람 - 자동차 // 자동차 모델이 바뀐다고 해서 사람이 변경되거나, 자동차 역할이 바뀌는 것이 없다 )
        - 원래 인터페이스 = new [새로운 객체] // 이런식으로 교체
    - 확장 가능한 설계
    - 유연하고 변경이 용이
    - 인터페이스를 안정적으로 설계하는 것이 중요
        - 인터페이스가 깨지면, 다 수정해야한다.

### spring과 객체지향 #1

- 스프링은 다형성을 극대화해서 이용
    - 제어의 역전 (IOC) , 의존관계 주입 (DI)
- 좋은 객체 지향 설계의 5가지 원칙 (면접에 자주 출현)
    - SOLID
        - SRP
            - 단일 책임 원칙 (한 클래스는 하나의 책임만 가져야한다)
            - 변경이 있을때, 한 범위만 고치면 된다
        - OCP
            - 개방-폐쇄 원칙 ( 확장에는 열려 있으나, 변경에는 닫혀 있다 )
            - 다형성을 활용 (”인터페이스 - 구현” 관계에서 구현을 수정하는 부분)
                - 하지만, 구현부를 만들면 조립하는 과정에서 client부분을 수정해야함( 변경에 닫혀있지 않음 → OCP가 안지켜짐)
                - 그래서, 스프링 탄생 ( IOC, DI를 이용하여 중간 조립자가 필요)
        - LSP
            - 리스코프 치환 원칙
            - 인터페이스 규약을 맞춘다 (컴파일을 넘어선 ,인터페이스 의도에 맞게 설계)
                - ex) 자동차 인터페이스의 엑셀 → 앞으로가야한다 ( 뒤로가게끔하면 LSP 위반)
        - ISP
            - 인터페이스 분리 원칙
            - 특정 클라이언트를 위한 인터페이스 여러개가 범용 인터페이스 하나보다 낫다
        - DIP
            - 의존관계 역전 원칙
            - 구현부에 의존하지 말고, 인터페이스에 의존해야한다 (추상화에 의존)
                - 구현부는 알 필요가 없다
                - ex) 운전자는 k3, 아반떼, 테슬라든 상관없이 자동차 역할에만 알면 된다
            - 의존한다는 것은 그 코드를 알고있는 것
                - memberRepository m = new MemoryMeberRepository();
                - Memory(구현) 와 memberRepository(인터페이스)를 둘다 알고 있는 상황
                - DIP 위반
    - 다형성 만으로는 → OCP , DIP 를 지킬수 없다

### spring과 객체지향#2

- DI (의존관계 인젝션) 지원
    - 다형성 + OCP/DIP 를 지키게 할 수 있다
    - client 코드를 변경하자 않아도 됨

### 스프링 예제

- 설계방법
    1. 회원 도메인 협력 관계 (기획자들도 봄)
    2. 회원 클래스 다이어그램
        1. 개발자가 주로 사용
        2. 클래스 관계 다이어그램
    3. 회원 객체 다이어그램
        1. 개발자가 주로 사용
        2. 서버가 실제 사용하는 객체들 다이어그램
- 비즈니스 요구사항 설계
    - 회원
        - 회원 가입
        - 회원 조회
        - 회원 등급 존재 (일반 , VIP)
        - 회원데이터 DB구축 or 외부 시스템과 연동 가능성 (미확정)
    - 주문과 할인 정책
        - 회원 상품 주문 가능
        - 회원 등급에 따라 할인 정책 적용 가능
        - 할인 정책은 모든 VIP는 1000원 할인 , 고정 금액 할인 적용 (나중에 변경 가능성 있다)
        - 할인 정책은 변경 가능성이 높다 (미확정)
- 회원 도메인 설계
    - 회원 서비스
        - 회원가입
        - 회원 조회
    - 회원 저장소
        - 메모리 회원 저장소
        - DB 회원 저장소
        - 외부 시스템 연동 회원 저장소

- 기능을 만들면 - > 테스트 진행
- 

### IOC, DI, 컨테이너

- IOC란 ?
    - 제어 흐름을 직접 제어하는 것이 아니라 외부에서 관리하는 것인 선택(주입)해주는 것
    - 프레임 워크 vs 라이브러리
        - 프레임워크란?
            - 프레임워크가 내가 작성한 코드를 대신 실행시켜주고, 해당 프레임워크의 라이프사이클에 의존한다
        - 라이브러리란?
            - 코드를 짤때 직접 이용하여 함수처럼 사용 하는 것을 의미 (직접 제어)
- DI란?
    - 애플레이케이션(웹) 실행중일 때 , 외부에서 실제 구현 객체를 생성하고 클라이언트에 전달해서 의존관계가 연결되는 것을 “의존관계 주입” 이라고 한다.
    - ex) AppConfig
- IOC 컨테이너 와 DI 컨테이너
    - 둘다 같은 의미
    - 외부에서 객체를 생성해서 클라이언트에게 전달해주는 역할을 하는 컨테이너
    - 또다른 이름으로는 “어셈블러” or “오브젝트 팩토리”로도 불린다.
    - ex) AppConfig
    

### JAVA 순수 코드 → spring 코드

- AppConfig → @Configuration
    - @Configuration을 통해서 스프링에 config 정보라고 인지시킴
- AppConfig 객체 대신해서 스프링 컨테이너에 등록 후 사용

```java
ApplicationContext applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);

MemberService memberService = applicationContext.getBean("memberService", MemberService.class);
OrderService orderService = applicationContext.getBean("orderService", OrderService.class)
```

- config 작성 방법
    - XML 기반 config 생성
    - JAVA 기반 annotaion 기반 생성

### bean 찾기

- getBean
- 부모에서 조회시 자식 Bean도 모두 찾게 된다.

### ApplicationContext 부가기능

- BeanFactory 최상위 인터페이스
- 메시지 소스 인터페이스
    - 국제화 기능 ( 한국권이면 한글, 영어권이면 영어 등..)
- 환경변수 인터페이스
    - 로컬환경, 개발환경, 운영환경에 맞춘 환경변수 설정 지원
- 어플리케이션 이벤트 퍼블리셔
    - 이벤트를 발행하고 구독하는 모델을 편리하게 지원
- 리소스 로더
    - 파일, 클래스 패스, 외부 등에서 리소를 편리하게 조회

### XML 설정 형식 (bean 설정)

- GenericXmlApplicationContext 클래스 사용

```xml
<!-- ../appConfig.xml -->

<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="http://www.springframework.org/schema/beans http://
www.springframework.org/schema/beans/spring-beans.xsd">
 <bean id="memberService" class="hello.core.member.MemberServiceImpl">
 <constructor-arg name="memberRepository" ref="memberRepository" />
 </bean>
 <bean id="memberRepository"
class="hello.core.member.MemoryMemberRepository" />
 <bean id="orderService" class="hello.core.order.OrderServiceImpl">
 <constructor-arg name="memberRepository" ref="memberRepository" />
 <constructor-arg name="discountPolicy" ref="discountPolicy" />
 </bean>
 <bean id="discountPolicy" class="hello.core.discount.RateDiscountPolicy" />
</beans>
```

- AppConfig.class 와 동일한 내용이므로, 최근에 잘 사용하지 않으므로 필요할 때 사용

### 싱글톤

```java
private static final [class] [instance] = new [class];

private [class](){} // 생성자 막기

public static [class] getInstance(){
	return [intance];
}
```

- 장점
    - 객체를 한개만 만들어서 공유하게 됨
    - 스프링 컨테이너(DI)의 경우 자동으로 처리해줌 (싱글톤으로 관리)
- 단점
    - 역할에 의존하게 아닌 구체에 의존하게 됨 (→ DIP 위반 )
    - 클라이언트가 구체클래스에 의존해서 OCP위반할 가능성이 높음
    - 테스트하기가 어렵다
    - 내부속성을 변경하거나 초기화 하기 어렵다
    - private 생성자로 자식클래스를 만들기 어렵다
    - 결론적으로, 유연성이 떨어진다.
- 스프링의 역할
    - 단점을 모두 보완한다.
    - 싱글톤으로 구성을 하지 않아도, @bean에서 자동으로 싱글톤으로 객체 생성을 관리하게 된다.
- 싱글톤 방식의 주의점
    - 싱글톤은 객체를 공유한다
        - 공유하는 필드의 값변경으로 인해 처리오류가 발생한다 ( 공유 필드 문제 )
        - stateful 문제
        - 웹 요청이 올때마다 쓰레드가 생성되어 공유 객체를 이용하게 된다
    - stateless상태로 만들어야한다 (클래스 내부 필드를 이용하기 보다는 return을 이용해서 지역변수로 사용해야한다.)
        
        ```java
        /*
        public class StatefulService {
        
            private int price; // 상태를 유지하는 필드
        
            public void order(String name, int price){
                System.out.println("name + \" price = \" + price = " + name + " price = " + price);
                this.price = price;// 여기가 문제
            }
        
            public int getPrice(){
                return price;
            }
        
        }
        */
        //======================
        
        //stateless
        public class StatelessService {
        
            private int price; // 상태를 유지하는 필드
        
            public void order(String name, int price){
                System.out.println("name + \" price = \" + price = " + name + " price = " + price);
                //this.price = price;// 여기가 문제
                return price;
            }
        }
        
        // Test code
        
        public static void main(String [] args){
        
        	void statefulServiceSingleton(){
                ApplicationContext ac = new AnnotationConfigApplicationContext(TestConfig.class);
                StatefulService statefulService1 = ac.getBean(StatefulService.class);
                StatefulService statefulService2 = ac.getBean(StatefulService.class);
        
                //ThreadA : A사용자가 10000원 주문
                userAPrice = statefulService1.order("userA", 10000);
                //ThreadB : B사용자가 20000원 주문
                userBPrice = statefulService2.order("userB", 20000);
            
                //ThreadA : 사용자A가 주문금액 조회
                
                System.out.println("price = " + userAPrice);
        
            }
        
        	statefulServiceSingleton();
        }
        	
        ```
        

### @Configuration 과 싱글톤

- configuration에서 자동으로 싱글톤 관리가 이루어지게 해준다.
- 객체 공유 → 무분별한 new 호출이 되지 않는다.
    - 추측…
    - @bean이 붙어있는 메서드가 호출 될때 (스프링의 동작)
        - 있으면, 컨테이너에 등록되어있으면 가지고 있던 값 반환
        - 없으면, 로직 실현 후 가지고 있던 값 반환
        - → 그래서 이미 등록된 것은 로직이 실행되지 않으므로 코드가 실행되지 않는다.
- @Configuation을 작성하지 않으면 싱글톤이 보장되지 않는다.

### Component & Autowired

```java
@Configuration
@ComponentScan(
        //appConfig를 제외시킨다. ( 이미 수동으로 등록해줬으므로 )
        basePackages = "hello.core", // 패키지 하위 컴포넌트 스캔 시작 위치 지정
        basePackageClasses = AutoAppConfig.class, // 해당 클래스 패키지 하위부터 스캔
        // 디폴트값 : @componentScan 붙은 어노테이션 패키지하위를 스캔한다. -> 관례 : 디폴트로 설정한다 ( 해당 AutoAppConfig는 패키지의 최상단에 파일을 위치시킨다.)
        excludeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Configuration.class)
) // 컴포넌트 스캔 ( 스프링 기능 , bean 등록 )
public class AutoAppConfig {
    
}
```

- Component
    - 컴포넌트 스캔 어노테이션이 붙어있는 것을 , 스프링이 자동으로 bean으로 등록해준다.
    - AppConfig.class를 수동으로 작성해주지 않아도 된다.
- 의존성 자동 주입
    - @Autowired
    - component 스캔에 따로 의존성 주입을 해주지 않으므로, @Autowired를 이용해서 작성해줘야한다.
- Component Scan 대상
    - @Component : 컴포넌트 스캔에서 사용
    - @Controller : MVC컨트롤러에서 사용 (컨트롤러로서 사용한다는 것을 스프링에게 알림)
    - @Service : 비즈니스 로직에서 사용 (딱히 별 역할은 없지만, 개발자가 인지할 수  있도록 사용)
    - @Repository : 데이터 접근계층으로 사용 (데이터 접근계층으로서 나머지 패턴이 흔들리지 않도록 예외를 추상화해서 알려주는 역할)
    - @Configuration : 설정정보로서 사용 (싱글톤을 유지하도록 도와주는 메커니즘)

### Component Filter

```java
@ComponentScan(
            includeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = MyIncludeComponent.class),
            excludeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = MyExcludeComponent.class)
    )
    // excludeFilters는 class를 컴포넌트 스캔에서 제외, includeFilters는 class를 컴포넌트 스캔에 사용
```

- 대부분 includeFilter의 경우는 사용하지 않고 (기본 component 스캔에서 처리하기 때문) 가끔씩 excludeFilter의 경우 간혹 사용된다

### 중복 bean 등록 (충돌)

- 자동 bean VS 자동 bean
    - bean 중복 오류를 일으킨다.
- 수동 bean VS 자동 bean
    - 수동 bean이 우선권을 가진다 (overriding 됨)

> [!NOTE]
> 요즘 스프링부트에서는 디폴트값으로, 수동 bean VS 자동 bean을 오류로 내뱉는다
> 
> - Test 코드에서는 가능 → spring을 타서 돌면 오류발생

```java
Parameter 0 of constructor in hello.core.member.MemberServiceImpl required a single bean, but 2 were found:
	- memoryMemberRepository: defined in file [C:\SourceCode\backend\inflearn\springFinishRoadmap\springCoreLecture#1\core\core\out\production\classes\hello\core\member\MemoryMemberRepository.class]
	- memberRepository: defined by method 'getMemberRepository' in class path resource [hello/core/AppConfig.class]

-> 수동 Bean VS 자동 Bean 충돌
```

### 의존관계 자동 주입 방법

- 주입방법
    - 생성자 주입
    - 수정자 주입 (setter)
    - 필드 주입
    - 일반 메서드 주입
- 생성자 주입 특징
    - 생성자 호출시점에 딱 1번만 호출되는 것이 보장됨
    - 불변 , 필수 의존관계에 사용
        - 불변 → private (setter x)
        - 필수 → final ( 생성 시점에 초기화 )
    - 클래스 내부에 생성자 1개인경우에 사용
        - 여러개인 경우에 @Autowired를 사용해야한다.
        - 생성자가 1개인 경우에는 @Autowired가 생략된다.
- 수정자 (setter) 주입 특징
    - 선택적으로 주입 가능 (@Autowired (required =  false))
        - final 지시어를 사용하면 안됨
    - 변경적으로 주입 가능 ( public setter() )
    - 스프링 사이클
        1. 스프링 빈 등록
        2. 스프링 빈 의존성 주입
    - setter가 이루어지는 구간은 의존성 주입시에 이루어진다.
    - @Autowired를 사용해야한다
        
        > [!NOTE]
        > 수정자 주입 예시: `@Autowired public void setXXX() { this.memoryRepository = memoryRepository; }`
        
- 필드 주입 특징
    
    ```java
    @Autowired private MemberRepository memberRepository;
    ```
    
    - 따로 memberRepository를 접근할 방법이 없다
    - 스프링 DI 프레임워크가 없으면 사용할 수 없다 (Test 코드 (순수한 자바)로 테스트가 불가능하다)
        - setter 가 필요해진다 (→ 이러면 수정자 주입을 사용하는게 낫다)
    - 왠만하면 사용하지 말자
- 일반 메서드 주입 특징
    - 한번에 여러 필드를 주입을 할 수 있다
    - 하지만, 생성자 주입과 수정자 주입으로 대체가능하므로 거의 사용하지 않는다.

> [!NOTE]
> 참고)
> 
> - 스프링 빈으로 등록되어있어야만, @Autowired를 사용할 수 있다. (순수 JAVA에서는 사용 불가능)

### 옵션처리

- Member 는 스프링 빈이 아니다.

```java
static class TestBean{
        @Autowired(required = false)
        public void setNoBean1(Member noBean1){
            System.out.println("noBean1 = " + noBean1);
        }

        @Autowired(required = false)
        public void setNoBean2(@Nullable Member noBean2){
            System.out.println("noBean2 = " + noBean2);
        }

        @Autowired
        public void setNobean3(Optional<Member> noBean3){
            System.out.println("noBean3 = " + noBean3);
        }
			//result
			/*
				noBean1은 메서드 자체가 호출이 안됨
				noBean2 = null
				noBean3 = Optional.empty
			*/

    }
```

### 롬복과 최신트랜드

- 롬복 (라이브러리)
    - 사용법
    
    ```java
    @Getter
    @Setter
    @RequiredArgsConstructor
    ```
    
    - getter
    - setter
    - 생성자 자동 생성 ( final 멤버 필드 )
- 최근에는 생성자를 딱 1개를 두고, @Autowired를 생략하는 방법을 주로 사용
- Lombok라이브러리를 사용하면 생성자를 따로 만들지 않아도 되므로, 코드가 간결해진다

### 조회할 빈이 2개 이상

- @Autowired
    
    ```java
    [origin]
    
    @Autowired
    private final DiscountPolicy discountPolicy;
    
    [After]
    
    @Autowired
    private DiscountPolicy rateDiscountPolicy
    // RateDiscountPolicy를 사용하도록 변수명을 위와 같이 지정해준다 ( Autowired가 알아서 값을 넣어줌 )
    ```
    
- @Qulifer
    - 구체화에서 같은 계층의 여러개 클래스중에서 @Autowired가 매칭해줘야하는 것을 선언
    
    ```java
    @Qualifier("fixDiscountPolicy")
    public class FixDiscountPolicy implements DiscountPolicy{
    	//...
    }
    
    @Qualifier("mainDiscountPolicy")
    public class RateDiscountPolicy implements DiscountPolicy{
    	//...
    }
    
     public OrderServiceImpl(MemberRepository memberRepository, @Qualifier("mainDiscountPolicy") DiscountPolicy discountPolicy){
            this.memberRepository = memberRepository;
            this.discountPolicy = discountPolicy;
        }
    ```
    
- @Primary
    
    ```java
    @Primary
    public class RateDiscountPolicy implements DiscountPolicy{
    	//...
    }
    
    public class FixDiscountPolicy implements DiscountPolicy{
    	//...
    }
    
    // RateDiscountPolicy 가 들어가짐
     public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy){
            this.memberRepository = memberRepository;
            this.discountPolicy = discountPolicy;
        }
    ```
    
    - 자주 사용됨
    - 기본값 처럼 사용됨
- Primary VS Qulifier 우선 순위
    - Qulifier가 더 우선권을 가진다.

### Annotation 직접 만들기

- @Qulifier(”문자열”) 의 경우 문자열은 컴파일타임에서 체크가 안되므로 단어 실패를 알 수가없다
- 커스텀한 Qulifier 만들기

```java
@Target({ElementType.CONSTRUCTOR, ElementType.METHOD, ElementType.PARAMETER, ElementType.FIELD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
@Qualifier("mainDiscountPolicy")
public @interface MainDiscountPolicy {
}

[origin]
public OrderServiceImpl(MemberRepository memberRepository, @Qualifier("mainDiscountPolicy") DiscountPolicy discountPolicy){
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
    
[after]

public OrderServiceImpl(MemberRepository memberRepository, @MainDiscountPolicy DiscountPolicy discountPolicy){
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
```

### 조회한 빈이 모두 필요할 때, List , Map

- 테스트 코드 사용시 빈을 조회해서 원하는 빈을 선택할 수 있도록 할 수 있다.

```java
public class AllBeanTest {

    @Test
    void findAllBean(){

        ApplicationContext ac = new AnnotationConfigApplicationContext(AutoAppConfig.class,DiscountService.class);
        DiscountService discountService = ac.getBean(DiscountService.class);
        Member member = new Member(1L, "userA", Grade.VIP);
        int discountPrice = discountService.discount(member, 10000, "rateDiscountPolicy");
        Assertions.assertThat(discountPrice).isEqualTo(1000);
    }

    static class DiscountService{
        private final Map<String, DiscountPolicy> policyMap;
        private final List<DiscountPolicy> policies;
				// MAP과 LIST를 이용하여 빈을 조회
        public DiscountService(Map<String, DiscountPolicy> policyMap, List<DiscountPolicy> policies){
            this.policyMap = policyMap;
            this.policies = policies;
            System.out.println("policies = " + policies);
            System.out.println("policyMap = " + policyMap);
        }

        //빈을 자유자재로 사용할 수 있다 (빈을 조회해서 사용)
        public int discount(Member member, int i, String discountCode) {
        //discountCode 값에 있는 빈의 이름을 policyMap에서 찾아서 해당 구현 클래스를 사용
            DiscountPolicy discountPolicy = policyMap.get(discountCode);
            return discountPolicy.discount(member,i); 
        }
    }
}

```

### 수동 bean VS 자동 bean

- 업무로직 ( 서비스 , 컨트롤러, 리포지토리)
    - 업무로직인 경우 명확하므로 자동 bean( @Component)를 사용한다
    - 너무 많은 구현체들이 있다면, 수동 bean을 등록하는 것도 나쁘지않다. (확실하게 한눈에 확인하기 좋음)
- 수동로직 (기술 지원 로직)
    - 로그 , 데이터베이스 연결 로직등의 경우 애플리케이션에 전반적으로 영향을 끼치므로 수동으로 bean을 등록하는 것이 명확하게 확인할 수 있다
    - 보통 Config파일은 전체 패키지 바로 하위에 작성한다 (AppConfig)

### 빈 생명주기 콜백

- 데이터베이스 커넥션 풀, 네트워크 소켓 연결 등을 빈이 생성되고 소멸할때 특정 메소드를 호출
    - 해당 메서드에서 커넥션풀이나 소켓등을 연결하고 연결을 끊어주는 작업을 함
- 스프링빈 라이프사이클
    - 스프링 컨테이너 생성 → 스프링 빈 생성 → 의존관계 주입 → 초기화 콜백 → 사용 → 소멸전 콜백 → 스프링 종료
        - 초기화 콜백 : 빈이 생성되고, 의존관계 주입이 완료된 후 호출
        - 소멸전 콜백 : 빈이 소멸되기 직전에 호출
- 초기화 콜백 및 소멸 콜백 방법
    - 인터페이스 활용
        - InitializingBean, DisposableBean
            - 해당 인터페이스의 경우 스프링 전용 인터페이스이므로 의존적이다.
            - 외부라이브러리와 호환이 좋지 못하다
    
    ```java
    public class NetworkClient implements InitializingBean , DisposableBean {
    
    ///....
    
    @Override
        public void afterPropertiesSet() throws Exception {
            connect();
            call(" 초기화 연결 메세지 ");
        }
    
        @Override
        public void destroy() throws Exception {
            disconnect();
        }
    }
    ```
    
    - 빈을 활용한 콜백
        - 메서드 이름을 자유롭게 줄 수 있다
        - 스프링에 의존적이지 않음
        - 설정 정보를 사용하기에, 외부라이브러리에도 가능
        - 종료메서드 추론 ( destoryMethod의 경우 기본값으로 close()를 지칭하도록 설계됨) → 나중에 다시 공부하는 쪽으로 (AutoCloseAble())
        
        ```java
        @Configuration
            static class LifeCycleConfig{
                @Bean(initMethod = "init", destroyMethod = "close")
                public NetworkClient networkClient(){
                    NetworkClient networkClient = new NetworkClient();
                    networkClient.setUrl("http://hello-spring.dev");
                    return networkClient;
                }
            }
        ```
        
    
    - Annotaion을 활용한 콜백
        - @PostConstruct
            - 생성자 전 콜백 호출
        - @PreDestory
            - 소멸전 콜백 호출
        
        ```java
         	  @PostConstruct
            public void init() throws Exception {
                connect();
                call(" 초기화 연결 메세지 ");
            }
            @PreDestroy
            public void close() throws Exception {
                disconnect();
            }
        ```
        
        - 단점
            - 외부라이브러리에는 사용을 못한다 → bean을 활용한 콜백방법 사용

### 프로토타입 스코프

- 싱글톤 스코프 빈
    - 요청이 들어오면 싱글톤으로 관리하던 같은 스프링 빈을 반환한다
- 프로토타입 스코프 빈
    - 요청이 들어올때마다 새로운 인스턴스를 생성해 제공해준다
    - 그리고 스프링은 해당 빈을 관리하지 않는다
    - (빈 생성 → 의존관계주입 → 초기화 까지 하고 관리하지 않음)
    - 종료 메서드같은 경우 (@preDestory) 가 실행되지 않는다
    
    ```java
    public class PrototypeTest {
    
        @Test
        void prototypeBeanFind(){
            AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(PrototypeBean.class);
    
            System.out.println("find prototypeBean1");
            PrototypeBean prototypeBean1 = ac.getBean(PrototypeBean.class);
            System.out.println("find prototypeBean2");
            PrototypeBean prototypeBean2 = ac.getBean(PrototypeBean.class);
            System.out.println("prototypeBean1 = " + prototypeBean1);
            System.out.println("prototypeBean2 = " + prototypeBean2);
            Assertions.assertThat(prototypeBean1).isNotSameAs(prototypeBean2);
    
            ac.close();
        }
    
        @Scope("prototype")
        static class PrototypeBean{
            @PostConstruct
            public void init(){
                System.out.println("PrototypeBean.init");
            }
    
            @PreDestroy
            public void destory(){
                System.out.println("PrototypeBean.end");
            }
        }
    }
    
    ```
    
- 싱글톤과 프로토타입을 같이 사용할 때에 문제점
    
    ```java
    package hello.core.scope;
    
    import jakarta.annotation.PostConstruct;
    import jakarta.annotation.PreDestroy;
    import org.assertj.core.api.Assertions;
    import org.junit.jupiter.api.Test;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.context.annotation.AnnotationConfigApplicationContext;
    import org.springframework.context.annotation.Scope;
    
    public class SingletonWithPrototypeTest1 {
    
        @Test
        void prototypeFind(){
            AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(PrototypeBean.class);
            PrototypeBean prototypeBean1 = ac.getBean(PrototypeBean.class);
            prototypeBean1.addCount();
            Assertions.assertThat(prototypeBean1.getCount()).isEqualTo(1);
    
            PrototypeBean prototypeBean2 = ac.getBean(PrototypeBean.class);
            prototypeBean2.addCount();
            Assertions.assertThat(prototypeBean2.getCount()).isEqualTo(1);
        }
    
        @Test
        void singletonClientUsePrototype(){
            AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(ClientBean.class,PrototypeBean.class);
            //ClientBean을 호출할때마다 같은 프로토타입빈이 호출됨
            ClientBean clientBean1 = ac.getBean(ClientBean.class);
            int count1 = clientBean1.logic();
            Assertions.assertThat(count1).isEqualTo(1);
    
            ClientBean clientBean2 = ac.getBean(ClientBean.class);
            int count2 = clientBean2.logic();
            Assertions.assertThat(count2).isEqualTo(2);
        }
    
        @Scope("singleton")
        static class ClientBean{
            private final PrototypeBean prototypeBean; // 생성 시점에 주입됨
            
    
            @Autowired
            public ClientBean(PrototypeBean prototypeBean){
                this.prototypeBean = prototypeBean;
            }
    
            public int logic(){
                prototypeBean.addCount();
                int count = prototypeBean.getCount();
                return count;
            }
    
        }
    
        @Scope("prototype")
        static class PrototypeBean {
            private int count = 0;
    
            public void addCount(){
                count++;
            }
    
            public int getCount(){
                return count;
            }
    
            @PostConstruct
            public void init(){
                System.out.println("PrototypeBean.init " + this);
            }
    
            @PreDestroy
            public void destroy(){
                System.out.println("PrototypeBean.destory");
    
            }
        }
    }
    
    ```
    

### 프로토타입과 싱글톤을 같이 사용하는 방법

- 프로토타입을 사용하는이유는 , 사용할때마다 새로운 인스턴스를 받으려고 하는 것이기 때문에 싱글톤과 분리되게 코드를 작성해야한다.
- 의존관계를 찾는( Dependency Lookup // DL) 것을 알아야한다.
1. ProtypeBeanProvider
    
    ```java
        @Test
        void singletonClientUsePrototype(){
            AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(ClientBean.class,PrototypeBean.class);
            ClientBean clientBean1 = ac.getBean(ClientBean.class);
            int count1 = clientBean1.logic();
            Assertions.assertThat(count1).isEqualTo(1);
    
            ClientBean clientBean2 = ac.getBean(ClientBean.class);
            int count2 = clientBean2.logic();
            Assertions.assertThat(count2).isEqualTo(1);
        }
    
        @Scope("singleton")
        static class ClientBean{
    //        private final PrototypeBean prototypeBean; // 생성 시점에 주입됨
    				
    				// 생성자 주입으로 하면됨 (간단하게 하기위해서 필드 주입을 사용 )
            @Autowired
            private ObjectProvider<PrototypeBean> prototypeBeanProvider;
    				// ObjectProvider와 동일 기능 ( 기능이 단순하다 )
    				//private ObjectFactory<PrototypeBean> prototypeBeanProvider;
    
    //        @Autowired
    //        public ClientBean(PrototypeBean prototypeBean){
    //            this.prototypeBean = prototypeBean;
    //        }
    
            public int logic(){
                PrototypeBean prototypeBean = prototypeBeanProvider.getObject();
                prototypeBean.addCount();
                int count = prototypeBean.getCount();
                return count;
            }
    
        }
    
    ```
    
2. 자바 표준 DL
    - gradle 추가
    
    ```java
    implementation 'jakarta.inject:jakarta.inject-api:2.0.1'
    ```
    
    - 코드 작성
    
    ```java
    import jakarta.inject.Provider;
    
    @Test
        void singletonClientUsePrototype(){
            AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(ClientBean.class,PrototypeBean.class);
            ClientBean clientBean1 = ac.getBean(ClientBean.class);
            int count1 = clientBean1.logic();
            Assertions.assertThat(count1).isEqualTo(1);
    
            ClientBean clientBean2 = ac.getBean(ClientBean.class);
            int count2 = clientBean2.logic();
            Assertions.assertThat(count2).isEqualTo(1);
        }
    
        @Scope("singleton")
        static class ClientBean{
    //        private final PrototypeBean prototypeBean; // 생성 시점에 주입됨
    
            @Autowired
            private Provider<PrototypeBean> prototypeBeanProvider;
    
    //        @Autowired
    //        public ClientBean(PrototypeBean prototypeBean){
    //            this.prototypeBean = prototypeBean;
    //        }
    
            public int logic(){
                PrototypeBean prototypeBean = prototypeBeanProvider.get();
                prototypeBean.addCount();
                int count = prototypeBean.getCount();
                return count;
            }
    
        }
    ```
    

### 웹 스코프

- Request 스코프
    - request 요청 시점부터 ~ 응답 종료까지 유지
    - HTTP 요청당 각각 구분해서 인스턴스를 생성 (request 생성주기 동안에)
    - UUID 값으로 구분 가능
- 컨트롤러 생성시 request 클래스 의존관계 주입 실패
    
    ```java
    @Controller
    @RequiredArgsConstructor
    public class LogDemoController {
    
        private final LogDemoSerivce logDemoSerivce;
        // request 스코프이므로 , 컨트롤러 생성 당시에는 request 스코프가 없으므로 
        // MyLogger를 의존관계 주입을 할 수가 없다.
        private final MyLogger myLogger;
    
        @RequestMapping("log-demo")
        @ResponseBody
        public String logDemo(HttpServletRequest request){
            String requestURL = request.getRequestURL().toString();
            myLogger.setRequestURL(requestURL);
    
            myLogger.log("controller test");
            logDemoSerivce.logic("testId");
            return "Ok";
        }
    }
    ```
    
- 의존관계 주입을 위한 해결방안
    - Provider
        
        ```java
        @Controller
        @RequiredArgsConstructor
        public class LogDemoController {
        
            private final LogDemoSerivce logDemoSerivce;
            // request 스코프이므로 , 컨트롤러 생성 당시에는 request 스코프가 없으므로 MyLogger를 의존관계 주입을 할 수가 없다.
            private final ObjectProvider<MyLogger> myLoggerProvider;
        
            @RequestMapping("log-demo")
            @ResponseBody
            public String logDemo(HttpServletRequest request){
                MyLogger myLogger = myLoggerProvider.getObject();
                String requestURL = request.getRequestURL().toString();
                myLogger.setRequestURL(requestURL);
        
                myLogger.log("controller test");
                logDemoSerivce.logic("testId");
                return "Ok";
            }
        }
        ```
        
    - Proxy 모드
        
        ```java
        @Component
        @Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
        // "value = "을 안해주면 proxyMode 파라미터를 넣을수가 없다
        public class MyLogger {
        
            private String uuid;
            private String requestURL;
        
            public void setRequestURL(String requestURL) {
                this.requestURL = requestURL;
            }
        
            public void log(String message){
                System.out.println("[" + uuid + "]" + "[" + requestURL + "] " + message );
            }
        
            @PostConstruct
            public void init(){
                String uuid = UUID.randomUUID().toString();
                System.out.println("[" + uuid + "] request scope bean create : " + this);
            }
        
            @PreDestroy
            public void close(){
                System.out.println("[" + uuid + "] request scope bean close : " + this);
            }
        
        }
        ```
        
        - 가짜 객체를 생성해서 진짜 객체 조회가 꼭 필요한 시점까지 지연처리한다는 점
        - 주의점
            - 싱글톤처럼 선언되어있지만, 요청마다 객체를 생성하는 것이기 때문에 주의해야한다.
            - @Scope는 정말 필요한 곳에서만 사용 ( 테스트하기가 어렵다 )

## 관련 문서

- [(Spring) 회원 등급별 상품 할인 적용 - 핵심 개념 및 특징 정리](실습_스프링MVC/회원%20등급별%20상품%20할인%20적용/[Spring]%20회원%20등급별%20상품%20할인%20적용%20-%20핵심%20개념%20및%20특징%20정리.md) — SOLID·IoC/DI·싱글톤 컨테이너 개념을 실제로 적용한 미니 프로젝트
- [(학습/프레임워크/Spring Framework) 의존관계 자동 주입 방법](의존관계%20자동%20주입%20방법.md) — 같은 DiscountPolicy/AutoAppConfig 예제의 생성자·수정자·필드·일반메서드 주입 방식과 @Qualifier/@Primary 우선순위를 간결하게 정리한 노트

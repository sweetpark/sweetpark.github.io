---
title: "[기능구현#5] AppConfig 구성"
tags: [프로젝트, 게시판 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [기능구현#5] AppConfig 구성

## Repository 구성

```text
        <<interface>>
        MemberRepository                    BoardRepository
        (findByLoginId 등)                   (save, findById 등)
             ▲   ▲                                ▲   ▲
             │   │                                │   │
   ┌─────────┘   └─────────┐          ┌───────────┘   └───────────┐
MemberMemRepository   MemberDBRepository   BoardMemRepository   BoardDBRepository
   (In-Memory 구현)      (DB 구현)             (In-Memory 구현)      (DB 구현)

  → AppConfig에서 @Bean으로 어떤 구현체를 사용할지 선택하여 주입
```

*   Repository로 의존성을 Interface로 두고, Memory 버전과 DB버전을 나누어서 진행
*   Memory 버전으로 빠르게 개발하고, 후에 DB를 연결시켜서 필요한 부분만 Repository로 진행
*   OCP / DI를 지켜가며 개발 구성

## AppConfig

```java
@Configuration
@ComponentScan
public class AppConfig implements WebMvcConfigurer {

    @Bean
    public MemberRepository getMemberRepository() {
//        return new MemberMemRespository();
         return new MemberDBRepository(DataSourceConfig.dataSource());
    }

    @Bean
    public BoardRepository boardRepository() {
//        return new BoardMemRepository();
         return new BoardDBRepository(DataSourceConfig.dataSource());
    }
}
```

*   구현체와 인터페이스의 분리로 객체지향적으로 작성
*   코드의 변경 없이 @Bean 등록으로 바꿔치기 가능

## AppConfig의 기능

대부분 spring에서는 어노테이션을 이용하여, 수동으로 bean등록이 아닌 자동으로 bean을 구성할 수 있게끔 지원한다  
(ex : @Component / @Service / @Controller ....)  
하지만, 위와같이 중복된 기능을 하는 bean의 경우 AppConfig를 이용해서 수동을 bean을 등록할 수 있으며,  
객체지향적으로 구현하기가 수월한 장점이 있다

*   자동 Bean  VS 수동 Bean
    *   spring은 수동으로 구현한 것을 우선적으로 처리하기에, 수동 Bean이 등록이 되게 된다
    *   자동 Bean과 수동Bean을 동시에 작성해서 사용해도 큰 상관은 없지만, 확실한 구분을 위해서 수동으로 등록한 Bean이 있을경우 자동 Bean은 사용하지 않는 편이 좋다

> 원문: https://gradualprecision.tistory.com/209

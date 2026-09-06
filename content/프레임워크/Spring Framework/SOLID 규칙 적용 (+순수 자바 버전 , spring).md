---
title: "SOLID 규칙 적용 (+순수 자바 버전 , spring)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# SOLID 규칙 적용 (+순수 자바 버전 , spring)

> [!NOTE] 실행 환경
> 버전 명시 없음 — `@Configuration`/`@Bean`, `AnnotationConfigApplicationContext` 등 Spring 표준 API만 사용되어 특정 버전은 확정하기 어렵다.

회원 예제

## 기획

*   회원 저장 로직
    1.  회원 저장
    2.  회원 조회
*   저장 방법
    1.  메모리 저장
    2.  DB 저장

## 구조도

```text
                (역할, interface)
Client  --->  MemberService  <----- 구현 -----  MemberServiceImpl
                                                       |
                                                       | 의존
                                                       v
                (역할, interface)
              MemberRepository  <----- 구현 -----  MemoryMemberRepository
                                  <----- 구현 -----  DbMemberRepository

AppConfig : MemberServiceImpl 에 어떤 MemberRepository 구현체를 주입할지 결정 (생성자 주입)
```

## SOLID 규칙 적용

*   멤버

```java
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Member {
    private Long id;
    private String name;
    private Grade grade;

    public Member(Long id, String name, Grade grade){
        this.id = id;
        this.name = name;
        this.grade = grade;
    }

}
```

*   멤버서비스 인터페이스

```java
public interface MemberService {
    void join(Member member);

    Member findMember(Long memberId);
}
```

*   멤버 저장소 인터페이스

```java
public interface MemberRepository {
    void save(Member member);

    Member findById(Long memberId);
}
```

*   멤버와 멤버 저장소 연결 객체

```java
public class MemberServiceImpl implements MemberService{

    private final MemberRepository memberRepository;

    public MemberServiceImpl(MemberRepository memberRepository){
        this.memberRepository = memberRepository;
    }

    @Override
    public void join(Member member) {
        memberRepository.save(member);
    }
    
    @Override
    public Member findMember(Long memberId) {
        return memberRepository.findById(memberId);
    }
}
```

*   멤버 구현체 주입 객체 (Config)

```java
public class AppConfig {

    // 생성자 주입
    public MemberService memberService(){
        //return new MemberServiceImpl(new MemoryMemberRepository());
        return new MemberServiceImpl(new DbMemberRepository());
    }
    
    
}
```

*   멤버 저장소 구현체

```java
public class DbMemberRepository implements MemberRepository{

    @Override
    public void save(Member member) {
        //db 전용 save 구현
    }

    @Override
    public Member findById(Long memberId) {
        //db 전용 findByid 구현
        return null;
    }
}

public class MemoryMemberRepository implements MemberRepository{

    //memory에 저장
    private static Map<Long, Member> store = new HashMap<>();

    @Override
    public void save(Member member) {
        store.put(member.getId(), member);
    }

    @Override
    public Member findById(Long memberId) {
        return store.get(memberId);
    }
}
```

## 테스트

```java
public static void main(String []args){
    AppConfig appConfig = new AppConfig();
    MemberService memberService = appConfig.memberService();
    
    Member member = new Member(1L, "memberA", Grade.VIP);
    memberService.join(member);
    
    Member findMember = memberService.findMember(1L);
    System.out.println("new member = "+ member.getName());
    System.out.println("find member = "+ findMember.getName());
}
```

## 순수 자버 버전 SOLID

*   역할과 구현부를 분리하였다
    *   역할 -> MemberServiceImpl (MemberRepository)
    *   구현 -> MemoryMemberRepository,  DBMemberRepository
*   역할에서 실행할 구현부의 부분
    *   AppConfig를 이용해서 생성자 주입 (다형성)
    *   추후) 스프링에서 @Configuration을 이용해서 관리하게 됨
    *   클라이언트(MemberServiceImpl)가 구체 클래스(DbMemberRepository 등)를 직접 생성하지 않고 AppConfig가 대신 생성해 주입하므로, 저장소 구현을 교체(Memory ↔ DB)해도 클라이언트 코드는 수정할 필요가 없다 — 이것이 DIP/OCP를 만족시키는 지점이다

## Spring (+ @Configuration)

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

*   bean 객체를 이용해서 스프링이 관리
*   @Configuration을 지정함으로써, 스프링이 config 파일을 인식

## Spring 테스트

```java
public static void main(String []args){
    //AppConfig appConfig = new AppConfig();
    //MemberService memberService = appConfig.memberService();
    
    ApplicationContext applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);
    applicationContext.getBean("memberService", MemberService.class); // 인터페이스에 의존 (Bean으로 관리)
    
    Member member = new Member(1L, "memberA", Grade.VIP);
    memberService.join(member);
    
    Member findMember = memberService.findMember(1L);
    System.out.println("new member = "+ member.getName());
    System.out.println("find member = "+ findMember.getName());
}
```

## 관련 문서

- [(학습/프레임워크/Spring Framework) Spring 역사 #3 (Spring의 탄생)](Spring%20역사%20%233%20(Spring의%20탄생).md) — 이 실습 코드가 구현하는 SOLID 5원칙 이론과 객체지향 배경 설명

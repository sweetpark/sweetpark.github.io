---
title: "Spring Type Converter (타입 형변환)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring Type Converter (타입 형변환)

> [!NOTE] 실행 환경
> 버전 명시 없음 — `Converter<S, T>`, `WebMvcConfigurer#addFormatters` 등 Spring 표준 API만 사용되어 특정 버전 확정은 어려움.

HTTP 요청 파라미터나 `@Value`로 읽어오는 프로퍼티 값은 기본적으로 문자열(String)로 들어오기 때문에, 이를 Integer·LocalDate·사용자 정의 객체 등 원하는 타입으로 변환하는 과정이 필요하다. Spring Type Converter는 이 문자열 ↔ 타입 간 변환을 표준화된 방식으로 처리해준다.

## 타입 변환 필요 예시

*   스프링 MVC 요청 파라미터
    *   @RequestParam
    *   @ModelAttribute
    *   @PathVariable
*   @Value 등으로 YML 정보 읽기
*   XML에 넣은 스프링 빈 정보 변환
*   View를 렌더링할 때

## Converter Interface

```java
public interface Converter<S, T> {
    @Nullable
    T convert(S source);
}
```

*   S -> T 로 변환
*   원하는 타입에 맞추어서 변환 가능

```java
// Member.class

@Getter
@AllArgsConstructor
public class Member{
    private String memberName;
    private Integer memberNum;
}

// StringToMemberConverter.class
public class StringToMemberConverter implements Converter<String, Member>{
    
    @Override
    public Member converter(String source){
        // Spring:10
        String[] split = source.split(":");
        String name = split[0]
        Integer num = Integer.parseInt(split[1]);
        
        return new Member(name, num);
    }
}

// MemberToStringConverter.class
public class StringToMemberConverter implements Converter<Member, String>{
    
    @Override
    public String converter(Member source){
        // Spring:10
        return source.getMemberName() + ":" + source.getMemberNum();
    }
}
```

*   Conversion Service를 이용한 테스트
    *   DefaultConverSionService 는 .addConverter로 등록이 가능하게 해줌
    *   또한, 사용자의 입장에서 구체적인 구현 요소를 몰라도 됨 **(ISP 원칙 준수)**

```java
public class ConversionServiceTest {
    
    @Test
    void conversionService() {
        DefaultConversionService conversionService = new DefaultConversionService();
        
        conversionService.addConverter(new StringToMemberConverter());
        conversionService.addConverter(new MemberToStringConverter());
    }
    
    Member member = conversionService.convert("Spring:10",Member.class);
    
    Assertions.assertThat(member).isEqualTo(new Member("Spring",10));
    
}
```

## Conversion Service (Converter 등록)

*   Converter를 만든 것을 Conversion을 이용해서 등록하고 손쉽게 사용할 수 있도록 하는 서비스
*   @Configuration을 이용해서 등록

DefaultConversionService를 직접 생성해서 쓰기보다 WebMvcConfigurer의 addFormatters()를 통해 등록하면, 스프링 MVC가 내부적으로 사용하는 conversionService에 자동으로 통합되어 @RequestParam, @ModelAttribute, @PathVariable 등 모든 파라미터 바인딩 시점에 컨버터가 일괄 적용된다.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
     
     @Override
     public void addFormatters(FormatterRegistry registry) {
         
         registry.addConverter(new StringToMemberConverter());
         registry.addConverter(new MemberToStringConverter());
     
     }
}
```

## 관련 문서

- [(학습/프레임워크/Spring Framework) Formatter (포맷터)](Formatter%20(포맷터).md) — 이 노트의 Converter를 문자열 표현 형식(Locale 등)까지 다루도록 확장한 심화 버전 노트

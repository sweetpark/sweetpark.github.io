---
title: Spring Type Converter (타입 형변환)
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring Type Converter (타입 형변환)

spring type converter..

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

> 원문: https://gradualprecision.tistory.com/97

---
title: "Formatter (포맷터)"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Formatter (포맷터)

Formatter...

## Formatter 란?

*   Converter의 심화 버전
*   Converter의 경우 제한이 없는 변환이 가능 (ex 문자 <-> 객체 , 숫자 <-> 객체  등등..)
*   Formatter의 경우 문자를 기준으로 변경하는 것을 의미 ( 문자 <-> 객체 , 문자 <-> 숫자 , 문자를 기준으로 변경)

## Formatter 인터페이스

```java
public interface Formatter<T> extends Printer<T>, Parser<T> {
}

public interface Printer<T> {
    String print(T object, Locale locale);
}

public interface Parser<T> {
    T parse(String text, Locale locale) throws ParseException;
}
```

*   Formatter 숫자 구현 ( 문자 <-> 숫자 )
    *   1000 -> 1,000 형식으로 변경
    *   NumberFormat 자바에서 기본으로 제공해주는 클래스
    *   Integer, Long 과 같은 숫자타입의 부모 Number 객체 사용

```java
public class MyNumberFormatter implements Formatter<Number> {
    
    @Override
    public Number parse(String text, Locale locale) throws ParseException {
        NumberFormat format = NumberFormat.getInstance(locale);
        return format.parse(text);
    }
    
    @Override
    public String print(Number object, Locale locale) {
        return NumberFormat.getInstance(locale).format(object);     
    }
}
```

## Formatter 등록

```java
@Configuration
 public class WebConfig implements WebMvcConfigurer {
     
     @Override
     public void addFormatters(FormatterRegistry registry) {
         registry.addConverter(new MyNumberFormatter());
     }
}
```

*   Convert 등록과 동일
*   단, converter도 등록이 동일하기에 우선적으로 converter가 적용된다 ( 동일 기능에 있어서는 converter가 우선적용 )

## 스프링이 제공하는 포맷터

*   @NumberFormat
    *   숫자 관련 형식 지정 포멧터 사용
*   @DateTimeFormat
    *   날짜 관련 형식 지정 포멧터 사용

```java
@Controller
public class FormatterController{
     
     @Data
     static class Form{
         
         @NumberFormat(pattern = "###,###")
         private Integer number;
         
         @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
         private LocalDateTime localDateTime;
     }
     
     @GetMapping("/formatter")
     public String formGetMethod(Model model){
         Form form = new Form();
         
         form.setNumber(10000);
         form.setLocalDateTime(LocalDateTime.now());
         
         model.addAttribute("form", form);
         return "formatter-form";
    }
    
    @PostMapping("/formatter")
    public String formPostMethod(@ModelAttribute Form form){
        return "formatter-view";
    }
}
```

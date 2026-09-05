---
title: "[기능구현#2] 스프링 검증 어노테이션 생성 (Spring bean validation)"
tags: [프로젝트, 게시판 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [기능구현#2] 스프링 검증 어노테이션 생성 (Spring bean validation)

1. 스프링 어노테이션 만들기  
2. 검증 관련 어노테이션 클래스 구현  
3. 패스워드 유효성 검사 예제

## 스프링 어노테이션 만들기

*   **@Constraint**
    *   validation을 하기위한 구현체 연결 어노테이션
*   @Target
    *   어노테이션을 사용할 곳
    *   default 값은 모든 대상
        *   Type 종류 

| 타입 | 설명 |
| --- | --- |
| ElementType.FIELD | 필드 |
| ElementType.METHOD | 함수 |
| ElementType.PARAMETER | 파라미터 |
| ElementType.CONSTRUCTOR | 생성자 |
| ElementType.LOCAL_VARIABLE | 지역변수 |
| ElementType.PACAGE | 패키지 |
| ElementType.ANNOTAION_TYPE | 다른 어노테이션 |

*   @RETENTION
    *   어노테이션의 지속 시간
        *   종류

| 타입 | 설명 |
| --- | --- |
| RetentionPolicy.SOURCE | 컴파일 후에 해당 어노테이션이 사라짐 (컴파일 이후에는 의미가 없기에 바이트코드에 기록되지 않음) |
| RetentionPolicy.CLASS | Default값 , 컴파일때만 .class파일에 존재하고 runtime때는 사라짐 |
| RetentionPolicy.RUNTIME | 런타임시에도 어노테이션이 존재 (주로 사용됨) |

*   어노테이션 만들기
    *   groups()와 payload()는 검증에 더욱 복잡한 부분도 해결이 가능

```java
@Constraint(validatedBy = PasswordValidator.class) // Validator 연결
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {

    String message() default "비밀번호는 문자, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
```

## 검증관련  구현 클래스

*   ConstriantValidator를 implement하기
    *   initialize() : 어노테이션 초기화 시 사용
    *   **isValid() : 검증 구현 부분 (주로 사용)**

```java
public interface ConstraintValidator<A extends Annotation, T> {
    default void initialize(A constraintAnnotation) {
    }

    boolean isValid(T var1, ConstraintValidatorContext var2);
}
```

*   구현
    *   disableDefaultConstraintViolation() : 검증 실패시 사용될 기본 오류 메시지 값 끄기
    *   buildConstraintViolationWithTemplate(String messageTemplate) : 검증 실패시 사용할 메시지 표현
    *   addConstraintViolation() : 오류메시지 최종 적용

```java
public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
    }

    @Override
    public boolean isValid(String passwd, ConstraintValidatorContext context) {
        if (passwd == null || passwd.length() < 8) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("비밀번호는 8자 이상이어야 합니다.")
                    .addConstraintViolation();
            return false;
        }

        // 문자만 포함
        if (passwd.matches("[a-zA-Z]+")) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("비밀번호는 숫자와 특수문자를 포함해야합니다.")
                    .addConstraintViolation();
            return false;
        }

        // 숫자만 포함
        if (passwd.matches("[0-9]+")) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("비밀번호는 문자와 특수문자를 포함해야합니다.")
                    .addConstraintViolation();
            return false;
        }

        // 문자와 숫자만 포함
        if (passwd.matches("[a-zA-Z0-9]+")) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("비밀번호는 특수문자를 포함해야합니다.")
                    .addConstraintViolation();
            return false;
        }

        // 모든 조건을 만족
        return true;
    }
}
```

## 패스워드 유효성검사 적용

*   **@ValidPassword 사용**

```java
@Getter
@Setter
public class memberUpdateForm {

    private String loginId;
    @NotBlank(message="이름은 필수로 입력하여야 합니다.")
    private String name;
    @ValidPassword
    private String passwd;
    private String address;
}
```

> 원문: https://gradualprecision.tistory.com/140

---
title: "[유효성검증 #2] Bean Validation를 이용한 유효성 검증"
tags: [토이프로젝트, 유효성검사 (Validation)]
created: 2026-09-05
modified: 2026-09-05
---

# [유효성검증 #2] Bean Validation를 이용한 유효성 검증

# Spring Bean Validation과 커스텀 어노테이션

Spring Boot에서 사용자 입력값을 검증할 때 가장 많이 사용하는 방식은 **Bean Validation**이다. 간단한 유효성 조건은 어노테이션 한 줄로 처리할 수 있고, 복잡한 로직이 필요한 경우에는 **커스텀 유효성 어노테이션**을 직접 만들어 적용할 수 있다.
이 글에서는 Bean Validation의 기본 사용법과 함께 **@PasswordValidate**라는 커스텀 어노테이션을 만들어서 비밀번호 조건을 검사하는 과정을 정리해본다.

* * *

## 1. DTO에 유효성 어노테이션 적용

```
public static class TestV2Dto {

    // spring bean validation (기본)
    @NotBlank
    private String name;

    // bean validation custom (커스텀 유효성 검사)
    @PasswordValidate
    private String password;

    // spring bean validation (기본 제공 : 맞춤 유효성 검사 제공)
    @Pattern(regexp = "^([0-9]{0,3})-([0-9]{0,4})-([0-9]{0,4})$")
    private String phone;

    // getter/setter 생략
}
```

*   `@NotBlank` - null, 빈 문자열, 공백 문자열 모두 허용하지 않음
*   `@PasswordValidate` - 직접 만든 비밀번호 유효성 검사 어노테이션
*   `@Pattern` - 전화번호는 하이픈 포함된 형식으로 입력해야 함

## 2. 컨트롤러에서 검증 적용

```
@PostMapping("/api/v2/test")
public ResponseEntity<?> validateTestV2(@Validated @RequestBody TestV2Dto testDto,
                                        BindingResult bindingResult) {
    if (bindingResult.hasErrors()) {
        return new ResponseEntity<>(bindingResult.getFieldError().getDefaultMessage(),
                                    HttpStatus.BAD_REQUEST);
    }
    return new ResponseEntity<>(HttpStatus.OK);
}
```

**`@Validated`**를 통해 DTO에 선언된 유효성 어노테이션들이 동작하게 되며,

`BindingResult`를 통해 에러가 존재하는지 검사할 수 있다.

사실 BindingResult는 생략해도 된다. 생략하면 유효성 실패 시 MethodArgumentNotValidException이 발생하고, Spring이 자동으로 400 에러를 내려준다.

* * *

## 3. 커스텀 어노테이션 `@PasswordValidate` 구현

어노테이션 정의

```
@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordValidate {
    String message() default "비밀번호 형식이 유효하지 않습니다.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

*   필수 선언 메서드
    *   **message** () : 유효성 검사 실패시 나오게 될 메시지
    *   groups () : 그룹별 유효성 검사 지정을 위한 메서드 ( 유효성 검사를 위한 group을 지정할 떄 구현 )
    *   payload() : 메타데이터 관련 spring framework 내부적으로 사용되는 메서드 ( 주로 사용되지 않음 )

Validator 클래스 구현

```
public class PasswordValidator implements ConstraintValidator<PasswordValidate, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        String regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$";
        return value != null && value.matches(regex);
    }
}
```

*   Spring에서 추상화한 ConstraintValidator 를 이용하여 PasswordValidate 어노테이션을 지정 (Spring에서 가져다 사용할 수 있도록)
*   **isValid()**를 오버라이딩 하여, 유효성 검증 구현 로직 추가

위 정규식은 아래 조건을 만족한다:  
- 8자 이상  
- 소문자 1개 이상  
- 대문자 1개 이상  
- 숫자 1개 이상

* * *

## 4. 테스트 예시

### 요청 (잘못된 입력)

```
{
  "name": "",
  "password": "1234",
  "phone": "01012345678"
}
```

### 응답 예시

```
HTTP/1.1 400 Bad Request
"비밀번호 형식이 유효하지 않습니다."
```

* * *

## 5. 마무리

Spring Bean Validation을 활용하면 복잡한 로직 없이도 사용자 입력 검증을 손쉽게 적용할 수 있다. @NotBlank, @Pattern 등 기본 제공 어노테이션만으로 충분한 경우도 많지만, 직접 비즈니스에 맞는 커스텀 어노테이션을 만들어 사용하는 것도 매우 유용하다.
다음 글에서는 유효성 검사를 더욱 체계적으로 관리하기 위해 Validator 인터페이스, @InitBinder, AOP와 어노테이션 기반 유효성 검사 확장 전략에 대해 소개할 예정이다.

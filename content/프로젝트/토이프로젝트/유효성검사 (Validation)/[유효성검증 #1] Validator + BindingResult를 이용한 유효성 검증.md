---
title: "[유효성검증 #1] Validator + BindingResult를 이용한 유효성 검증"
tags: [토이프로젝트, 유효성검사 (Validation)]
created: 2026-09-05
modified: 2026-09-05
---

# [유효성검증 #1] Validator + BindingResult를 이용한 유효성 검증

Spring에서 Validator를 이용한 커스텀 유효성 검사와 BindingResult 활용
Spring에서는 사용자 입력 값을 검증하기 위해 Bean Validation(JSR-380)을 많이 사용하지만, 더 복잡한 조건이 있거나 커스터마이징이 필요한 경우에는 org.springframework.validation.Validator를 직접 구현하여 사용할 수 있다. 이 포스팅에서는 Validator를 이용한 유효성 검사와 BindingResult를 통해 검증 결과를 처리하는 방법을 소개한다.

* * *

## 1. Validator 인터페이스 구현하기

Spring의 Validator 인터페이스는 두 가지 메서드를 구현해야 한다:

*   `supports(Class<?> clazz)`: 이 Validator가 어떤 클래스 타입을 지원하는지 명시
*   `validate(Object target, Errors errors)`: 실제 유효성 검사 로직 구현

Ex) 이름(name), 비밀번호(password), 전화번호(phone) 세 가지 필드를 가진 DTO를 검증하도록 구현했다.

```
@Component
public class TestV1Validate implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
    	// TestDto에 대한 Validator라는 것을 의미
        return clazz.isAssignableFrom(V1Controller.TestDto.class);
    }

    @Override
    public void validate(Object target, Errors errors) {
        V1Controller.TestDto testDto = (V1Controller.TestDto) target;
        String regex = "^([0-9]{0,3})-([0-9]{0,4})-([0-9]{0,4})$";

        if (testDto.getName() == null || testDto.getName().trim().equals("")) {
            errors.rejectValue("name", "name.required");
        }
        if (testDto.getPassword() == null || testDto.getPassword().trim().equals("")) {
            errors.rejectValue("password", "password.required");
        }
        if (testDto.getPhone() == null || testDto.getPhone().trim().equals("")) {
            errors.rejectValue("phone", "phone.required");
        } else if (!testDto.getPhone().matches(regex)) {
            errors.rejectValue("phone", "phone.invalid");
        }
    }
}
```

* * *

## 2. DTO 클래스 정의

```
@Data
public static class TestDto {
    private String name;
    private String password;
    private String phone;
}
```

## 3. Validator 등록: @InitBinder 사용

*   해당 testValidate는 아직 **Spring에 등록된 상태가 아니므로**, InitBinder를 통해 특정 Controller 혹은 객체에 등록을 해줘야한다
*   **@InitBinder 대신해서 전역적으로 적용할경우, 해당 validator가 자동으로 검증 단계에 사용될 수 있음 (주의)**

```
@InitBinder
public void initBinder(WebDataBinder binder) {
    binder.addValidators([CustomValidator]);
}
```

## 4. 컨트롤러에서 BindingResult 처리하기

```
@PostMapping("/api/v1/test")
public ResponseEntity<?> TestDtoVersion1(@Validated @RequestBody TestDto testDto, BindingResult bindingResult) {
    if (bindingResult.hasErrors()) {
        return new ResponseEntity<>(
            bindingResult.getFieldError().getCodes(),
            HttpStatus.BAD_REQUEST
        );
    }
    return new ResponseEntity<>(testDto, HttpStatus.OK);
}
```

`@Validated`는 `Validator`와 연계되어 동작하며, 내부적으로 `WebDataBinder`가 등록된 Validator를 사용하게 된다. `BindingResult`를 바로 옆 파라미터로 선언하면 Spring이 자동으로 유효성 검사 결과를 바인딩해준다.

* * *

## 5. 응답 결과

### 요청:

```
POST /api/v1/test
Content-Type: application/json

{
  "name": "admin",
  "password": "1234",
  "phone": "010-1234"
}
```

### 응답:

```
[
  "phone.invalid"
]
```

## 6.  마무리

이번 포스팅에서는 Spring의 Validator 인터페이스를 직접 구현하고, `BindingResult`를 통해 검증 결과를 처리하는 기본 흐름을 살펴보았다. 이를 통해 개발자는 단순한 필드 검사 외에도 복잡한 조건문, 데이터베이스 중복 검사, 특정 필드 간 상호관계 등 자유로운 검증 로직을 구현할 수 있다.

**다음 포스팅**에서는 보다 널리 쓰이는 방식인 `@NotNull`, `@Pattern` 등으로 대표되는 **Bean Validation**을 소개할 예정이다.  
그 이후에는 Validator와 Bean Validation을 조합하고, **AOP 및 사용자 정의 어노테이션을 활용한 유효성 검사 아키텍처의 확장** 방법을 다룰 계획이다.

## 관련 문서

- [(학습/프로젝트/토이프로젝트/유효성검사 (Validation)) [유효성검증 #2] Bean Validation를 이용한 유효성 검증]([유효성검증%20#2]%20Bean%20Validation를%20이용한%20유효성%20검증.md) — Validator+BindingResult 방식에 이어 Bean Validation(어노테이션 기반) 검증을 다루는 후속 편
- [(학습/프레임워크/Spring Framework) Validation (BindingResult, Validator) + @Validated](../../../프레임워크/Spring%20Framework/Validation%20(BindingResult,%20Validator)%20+%20@Validated.md) — Validator 인터페이스와 BindingResult를 이용한 검증 방식을 다루는 강의 노트와 동일한 주제

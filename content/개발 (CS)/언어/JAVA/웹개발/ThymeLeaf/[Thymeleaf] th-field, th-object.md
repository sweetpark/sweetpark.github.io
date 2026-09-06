---
title: "[Thymeleaf] th:field, th:object"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] th:field, th:object

Thymeleaf로 폼과 모델 객체를 바인딩하는 `th:object`, `th:field`를 정리한 노트다. `th:object`는 폼이 사용할 모델 객체(컨트롤러가 추가한 이름)를 지정하고, `th:field="*{속성명}"`은 그 객체를 기준으로 `id`·`name` 속성을 자동 생성해 폼 요소와 필드를 바인딩한다. `th:object` 없이도 `${...}`로 표현할 수 있지만, 함께 쓰는 방식이 권장된다.

> [!NOTE] 실행 환경
> `<html xmlns:th="http://www.thymeleaf.org">` 선언 외에 구체적인 Thymeleaf 버전을 특정할 근거는 없다. `th:object`/`th:field`는 Spring MVC의 폼 바인딩(커맨드 객체)과 연동되는 기능이라 thymeleaf-spring 의존성이 필요하며, 구체적인 버전은 명시되어 있지 않다.

1. th:object  
2. th:field

## th:object

*   사용할 모델 객체를 설정
*   Controller 에서 모델에 추가한 객체의 이름을 의미

```html
<form th:action="@{/submit}" th:object="${user}" method="post">
...
</form>
```

## th:field

*   속성값인, id와 name을 자동으로 생성해준다.
*   폼 요소와 모델 객체를 바인딩하는 역할을 한다.

```html
<form th:action="@{/submit}" th:object="${user}" method="post">
    <input type="text" th:field="*{username}" />
    <!-- 출력 결과 : <input type="text" id="username" name="username" /> --> 
    
    <!-- th:object가 없을 경우, 표현하는 방법 (하지만, th:object를 사용하는 것을 권장) -->
    <!-- <input type="text" th:field="${user.username}" /> -->
    
   
    <button type="submit"> Submit </button>
</form>
```

*   **th:object와 같이 사용하는 경우를 권장하며**, 어떤 모델 객체를 의미하는지 알 수 있으므로 "*"로 표현해도 된다 (권장)

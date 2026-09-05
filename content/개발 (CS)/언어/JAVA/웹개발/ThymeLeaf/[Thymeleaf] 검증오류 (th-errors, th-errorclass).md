---
title: "[Thymeleaf] 검증오류 (th:errors, th:errorclass)"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 검증오류 (th:errors, th:errorclass)

## th:errors

*   모델의 속성이 유효성 검사를 통과하지 못했을경우, html에 표현됨
*   #fields.hasErrors('속성') 을 이용해서, 유효성 검사의 유무를 파악 (오류가 있을경우, fields에 지정해둔 msg가 출력 )
*   **주로, 오류 메시지를 표시하는 역할**

```html
<head>
<!-- ... -->

<style>
 .field-error{
      color : red;
 }   
</style>
</head>
<body>

<form th:action="@{/validation}" th:object="${user}" method="post">
    <label for="username"> 이름 </label>
    <input type="text" th:field="*{username}" />
    <span class="field-error" th:if=${#fields.hasErrors('username')}" th:errors="*{username}"></span>
</form>

</body>
```

## th:errorclass

*   유효성 검사 오류시, css 를 적용시키기 위한 속성값
*   **주로, 시각적으로 오류가 나타남을 표시하는 역할**
*   **th:errors 와 th:errorclass는 같이 사용되는 경우가 많다**

```html
<!-- form.html -->

<head>
<!-- ... -->

<style>
 .field-error{
      color : red;
 }   
</style>
</head>
<body>

<form th:action="@{/validation}" th:object="${user}" method="post">
    <label for="username"> 이름 </label>
    <input type="text" th:field="*{username}" th:errorclass="field-error" class="form-control" />
    <span class="field-error" th:if=${#fields.hasErrors('username')}" th:errors="*{username}"></span>
</form>

</body>
```

검증의 경우,  
  
spring과 연계되어 작업되는 경우가 많으므로, spring controller의 작성도 중요시여기게 된다  
fields와 같은 역할도 결국, 서버에서 지정해줘야한다. (BindingResult)
```html
// Controller

@PostMapping("/validation")
public String validate(@ModelAttribute("user") User user, BindingResult bindingResult){
     if (user.getUsername() == null || user.getUsername().isEmpty()){
         bindingResult.rejectValue("username", "error.username", "이름은 필수입니다");
     }
     
     if (bindingResult.hasErrors()) {
            return "form"; // 폼 뷰를 다시 렌더링
        }
     
     return "redirect:/home";
     
}

@GetMapping("/form")
public String form(){
   return "form";
}

@Data
public static class User{
    private String username;
}
```

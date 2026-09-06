---
title: "[Thymeleaf] 지역변수 선언 (th:with)"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 지역변수 선언 (th:with)

Thymeleaf `th:with`로 지역변수를 선언하는 방법을 정리한 노트다. `th:with="first=${users[0]}"`처럼 해당 태그(및 하위 태그) 범위에서만 유효한 변수를 만들어, 반복되는 표현식을 줄이고 가독성을 높이는 데 쓴다.

> [!NOTE] 실행 환경
> `<html xmlns:th="http://www.thymeleaf.org">` 선언 외에 구체적인 Thymeleaf 버전을 특정할 근거는 없다. Spring MVC의 `model.attribute(...)`로 값을 전달하는 코드로 보아 Spring 연동 환경을 전제로 하며, 구체적인 버전은 명시되어 있지 않다.

## 지역변수 선언

public class User{  
     private String username;  
      
     public String getUsername(){  
              return this.username;  
     }  
}
@Controller  
List<User>users = new ArrayList<>();  
users.add(userA);  
model.attribute("users", list);
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Thymeleaf 테스트 </title>
</head>
<body>
  <div th:with="first=${users[0]}">
    <p><span th:text="${first.username}"></span></p>
  </div>
</body>
</html>
```

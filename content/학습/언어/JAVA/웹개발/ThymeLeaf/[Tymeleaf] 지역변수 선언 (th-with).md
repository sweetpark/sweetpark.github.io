---
title: "[Tymeleaf] 지역변수 선언 (th:with)"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Tymeleaf] 지역변수 선언 (th:with)

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

> 원문: https://gradualprecision.tistory.com/111

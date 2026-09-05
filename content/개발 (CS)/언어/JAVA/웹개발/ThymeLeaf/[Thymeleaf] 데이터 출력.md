---
title: "[Thymeleaf] 데이터 출력"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 데이터 출력

## Model Attribute 출력

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Thymeleaf 테스트 </title>
</head>
<body>
  <ul>
    <li>th:text 출력: <span th:text="${data}"></span></li>
    <li> 컨텐츠 직접 출력 = [[${data}]]</li>
  </ul>
</body>
</html>
```

*   속성에서 출력
    *   ${data} 이용하여 Model.attribute("data", [data값]) 출력 
*   컨텐츠 내부 직접 출력
    *   "[[]]" 을 이용하여 직접 출력 가능

## 객체 출력

**** 사전 준비 ****  
  
public class User{  
     private String username;  
     public String getUsername(){  
              return this.username;  
     }  
}  
  
List<User> list = new ArrayList<>();  
Map<String, User> map = new HashMap<>();  
  
list.add(userA);  
map.put('userA', userA);  
  
  
**model.addAttribute("user", userA);**  
**model.addAttribute("users", list);**  
**model.addAttribute("userMap", map);**

*   객체 한개 출력 **("user")**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Thymeleaf 테스트 </title>
</head>
<body>
  <div>
    <ul>
      <!-- Object : user ( private String username ; ) -->
      <li> username : <span th:text="${user.username}"></span></li>
      <li> username : <span th:text="${user['username']}"></span></li>
      <li> username : <span th:text="${user.getUsername()}"></span></li>
    </ul>
  </div>
</body>
</html>
```

*   리스트 출력 **("users")**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Thymeleaf 테스트 </title>
</head>
<body>
  <div>
    <ul>
      <!-- List User users; --> 
      <li><span th:text="${users[0].username}"></span></li>
      <li><span th:text="${users[0]['username']"></span></li>
      <li><span th:text="${users[0].getUsername()}"</span></li>
    </ul>
  </div>
</body>
</html>
```

*   Map 출력 **("userMap")**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Thymeleaf 테스트 </title>
</head>
<body>
  <div>
    <ul>
      <!-- Map User userMap; --> 
      <li><span th:text="${userMap['userA'].username}"></span></li>
      <li><span th:text="${userMap['userA']['username']"></span></li>
      <li><span th:text="${userMap['userA'].getUsername()}"</span></li>
    </ul>
  </div>
</body>
</html>
```

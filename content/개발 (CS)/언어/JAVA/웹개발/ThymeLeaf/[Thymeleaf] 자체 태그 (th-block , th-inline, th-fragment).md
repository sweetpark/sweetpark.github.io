---
title: "[Thymeleaf] 자체 태그 (th:block , th:inline, th:fragment)"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 자체 태그 (th:block , th:inline, th:fragment)

1. th:block  
2. th:inline  
3. th:fragment

## th:block

*   <div> 태그와 같이 블록단위로 묶는 역할
*   th:block와 th:each를 활용하여, 반복적으로 작성이 가능하다
*   또는 th:if를 활용하여, 조건부로도 사용이 가능하다

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thymeleaf Example</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    
    <th:block th:if="${user != null}">
      <p> User : <span th:text="${user.username}"></span></p>
    </th:block>
    
    <th:block th:each="user : ${users}">
      <p> User : <span th:text="${user.username}"></span></p>
    </th:block>
  
      
  </body>
</html>
```

## th:inline

*   javascript, css ,text 을 이스케이프 처리가 되어, 안전하게 렌더링을 진행한다
*   th:inline="javascript" 의 경우 변수명과 값에 **"(큰따옴표)** , **json 자동 변환** 등을 지원한다
    *   th:inline 이 없을경우, (출력결과)
        *   **var username = userA**
        *   **var user =Controller.User(username=userA, customColor=blue)**
*   안전한 타임리프 렌더링을 이용하기 위해서 사용된다

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thymeleaf Example</title>
    <link rel="stylesheet" href="styles.css" />
    
    <style th:inline="css">
      .test{
        color="red"; /*[[${user.customColor}]]*/
      }
    </style>
    
    
  </head>
  <body>
  
    <script th:inline="javascript">
      var username = [[${user.username}]]; //"userA" 출력 
      // javascript 내추럴 템플릿
      var username2 = /*[[${user.username}]]*/ "test user";
      
      var user = [[${user}]] // {"username": "userA", "customColor" : "blue"} 출력
    </script>
  	
    <p th:inline="text">welcome! [[${user.username}]]</p>
  </body>
</html>
```

## th:fragment

*   공통 처리를 위한 기능
*   html 문서중 공통으로 처리할 부분을 따로 저장하여 불러서 사용하는 용도
*   insert 와 replace 를 이용하여, 삽입하거나 대체할 수 있다 (<div> 안에 삽입하거나, <div> 를 대체하여 넣거나)
*   param 값을 전달하여 표현할 수 있다

파일경로 : /templates/fragment/fragmentTest.html  
  
<body>  
        <header th:fragment="fragmentTest">  
                헤더 자리.  
        </header>  
  
         <header th:fragment="fragmentParamTest (param1, param2)">  
                 <p> 파라미터 </p>  
                <p th:text="${param1}"></p>  
                <p th:text="${param2}"></p>  
        </header>  
</body>
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thymeleaf Example</title>
    <link rel="stylesheet" href="styles.css" />
    
  </head>
  <body>
  
    <div th:insert="~{fragment/fragmentTest :: fragmentTest}"></div>
    <!-- 출력결과
    <div>
        <header>
            헤더자리
        </header>
    </div>
    -->
    
    
    <div th:replace="~{fragment/fragmentTest :: fragmentTest}"></div>
    <!-- 출력결과
        <header>
            헤더자리
        </header>
    -->
    
    
    <div th:replace="~{fragment/fragmentTest :: fragmentParamTest ('data1', 'data2')}"></div>
    <!-- 출력결과
        <header>
            파라미터
            data1
            data2
        </header>
    -->
    
    
  </body>
</html>
```

---
title: "[Thymeleaf] 속성, 반복, 조건 (th:*, th:each,th:if)"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 속성, 반복, 조건 (th:*, th:each,th:if)

## 속성 덮어쓰기

*   기존, html 속성을 th:~ 로 표현할경우 th로 설정한 값으로 대체된다
*   ex)
    *   <input type="text" name="loginId" th:name="id">
    *   타임리프 렌더링 후 -> <input type="text" name="id"> 로 렌더링

## 반복

*   th:each=" [변수] : ${[넘어온 값]}"
*   userStat
    *   thymeleaf에서 제공해주는 상태값 확인
    *   index, count, size, event, odd, first, last ,current 지원

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"
    <title>Thymeleaf Example</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    
      <table border=1>
        <tr>
          <th>username</th>
          <th>age</th>
        </tr>  
        <tr th:each="user, userStat: ${users}">
          <td th:text="${user.username}">username</td>
          <td th:text="${user.age}">0</td>
          <td>
            index= <span th:text="|${userStat.index} 번째,|">null,</span>
            count= <span th:text="|${userStat.count} 번째,|">null,</span>  
            size= <span th:text="|${userStat.size} 개,|">null,</span>
            even= <span th:text="|${userStat.even} 짝수번째,|">null,</span>
            odd= <span th:text="|${userStat.odd} 홀수번째,|">null,</span>
            first= <span th:text="|${userStat.first} 첫번째위치,|">null,</span>
            last= <span th:text="|${userStat.last} 마지막위치,|">null,</span>
            current= <span th:text="|${userStat.current} 현재위치|">null</span>
          </td>
        </tr>
      </table>
      
  </body>
</html>
```

## 조건

*   if / unless
    *   종류
        *   th:if="[조건]" : 조건이 참일 때, 실행
        *   th:unless="[조건]" : 조건이 거짓일 때, 실행
    *   사용법
        *   <span th:text="조건참일때 결과" th:if="{[조건]}"></span>
        *   <span th:text="조건 거짓일때 " th:unless="{[조건]}"></span>
*   switch  
    *   종류
        *   th:switch = "${[값]}"
        *   th:case="[값]"
    *   사용법  
        *   밑의 코드 참고

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
    
    <!-- IF / Unless 예시 -->
      <table border=1>
        <tr>
          <th>count</th>
          <th>username</th>
          <th>age</th>
        </tr>  
        <tr th:each="user, userStat: ${users}">
          <td th:text="${userStat.count}">1</td>
          <td th:text="${user.username}">username</td>
          <td>
            <span th:text="${user.age}">0</span>
            <span th:text="'미성년자'" th:if="${user.age lt 20}"></span>
            <span th:text="'성인'" th:unless="${user.age lt 20}"></span>
          </td>
        </tr>
      </table>
      <hr size=10 color=red>
      
      <!-- Switch 예시 -->
      <table border=1>
        <tr>
          <th>count</th>
          <th>username</th>
          <th>age</th>
        </tr>
        <tr>
          <td th:text="${userStat.count}">1</td>
          <td th:text="${user.username}">username</td>
          <td th:switch="${user.age}">
            <span th:case="10">10살</span>
            <span th:case="20">20살</span>
            <span th:case="*">기타</span>
          </td>
        </tr>
      
  </body>
</html>
```

> 원문: https://gradualprecision.tistory.com/115

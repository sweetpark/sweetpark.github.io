---
title: [Thymeleaf] 주석
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 주석

## 표준 html 주석

*   <!-- [내용] -->
    *   thymeleaf가 렌더링하지 않고, 그대로 남겨둔다.
    *   주석 부분이 html에 그대로 남겨져 있다

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
    
    <!-- 이게 Html 주석 -->
    <!-- <span th:text="${data}">Example</span> -->
      
  </body>
</html>
```

## Thymeleaf 주석

*   <!--/*--> [내용] <!--*/-->  
    *   thymeleaf가 렌더링할시, 해당 부분을 제거한다
    *   주석 부분이 html에 남아있지 않게 된다
    *   **주로 thymeleaf 주석으로 사용됨**

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
    
    <!--/*-->
    <span th:text="${data}">Example</span> -> 이부분이 타임리프 렌더링시 삭제됨
    <!--*/-->
      
  </body>
</html>
```

## Thymeleaf 프로토타입 주석

*   <!--/*/ [내용] /*/-->
    *   일반적인 html 렌더링시에는 주석으로 처리
    *   thymeleaf로 렌더링시에 보이게 된다.

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
    
    <!--/*/
    <span th:text="${data}">Example</span> -> 타임리프 렌더링에서만 실행됨
    /*/-->
      
  </body>
</html>
```

> 원문: https://gradualprecision.tistory.com/116

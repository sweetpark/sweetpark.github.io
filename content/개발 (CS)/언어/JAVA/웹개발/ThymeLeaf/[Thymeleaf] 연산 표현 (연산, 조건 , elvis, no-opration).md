---
title: "[Thymeleaf] 연산 표현 (연산, 조건 , elvis, no-opration)"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 연산 표현 (연산, 조건 , elvis, no-opration)

## Thymeleaf 연산 표현

*   Html Entity의 경우, & ; 를 하지 않으면 그대로 문자로 출력되는 것을 주의해야함

## 비교 연산

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
    <li>1 > 10 = <span th:text="1 > 10"></span></li>
    <li> 1 > 10 = <span th:text="1 > 10"></span></li>
    <li> 1 == 10 = <span th:text=" 1 == 10 "></span></li>
    <li> 10 == 10 = <span th:text=" 10 &eq; 10"></span></li>
    
    <!-- true / false -->
    <li> true = <span th:text="${10 == 10}"></span></li>
  </ul>
</body>
</html>
```

*   Html Entity를 주의
*   th:text="${1 > 10} " 를 하게 되면, true / false의 결과가 표현됨

## 조건식 / Elvis / no-opration

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
    <!-- 조건 -->
    <li>(10 % 2 == 0)? '짝수':'홀수' = <span th:text="${(10 % 2 == 0) ? '짝수' : '홀수'}"></span></li>
    
    <!-- Elvis -->
    <li><span th:text="${data}?:'데이터가 없습니다'"></span></li>
    
    <!-- no operation --> 
    <li>${data}?: _ = <span th:text="${data}?: _">데이터가 없습니다.</span></li>
  </ul>
</body>
</html>
```

*   조건식
    *   [조건] ? true : false
*   Elvis
    *   ${data}?:false
    *   data가 없으면, false 출력
    *   data가 있으면, data 값 출력
*   no-operation
    *   _ : ${data}가 없으면, th:text가 무시됨 (결국, 데이터가 없습니다 출력)
    *   data가 있으면 ,data 출력

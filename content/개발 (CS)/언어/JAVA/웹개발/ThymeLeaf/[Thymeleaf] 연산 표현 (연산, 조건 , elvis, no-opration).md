---
title: "[Thymeleaf] 연산 표현 (연산, 조건 , elvis, no-opration)"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 연산 표현 (연산, 조건 , elvis, no-opration)

Thymeleaf 표현식 안에서 쓰는 비교 연산, 삼항 조건식, Elvis 연산자, no-operation(`_`)을 정리한 노트다. 핵심은 `>` 같은 HTML Entity 문자는 `&gt;`로 escape하지 않으면 그대로 문자로 출력되어버린다는 점, 그리고 Elvis(`${data}?:'기본값'`)와 no-operation(`${data}?: _`)이 값이 없을 때 각각 기본값 출력 또는 `th:text` 자체를 무시하는 방식으로 다르게 동작한다는 점이다.

> [!NOTE] 실행 환경
> `<html xmlns:th="http://www.thymeleaf.org">` 선언 외에 구체적인 Thymeleaf 버전을 특정할 근거는 없다. Tomcat/Spring Boot 등 Thymeleaf를 지원하는 서버 환경이 필요하며, 구체적인 버전은 명시되어 있지 않다.

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

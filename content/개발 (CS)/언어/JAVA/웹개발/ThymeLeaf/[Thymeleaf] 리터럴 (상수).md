---
title: "[Thymeleaf] 리터럴 (상수)"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 리터럴 (상수)

Thymeleaf 표현식 안에서 쓰는 리터럴(문자·숫자·boolean·null) 표기법을 정리한 노트다. 문자 리터럴은 원칙적으로 작은따옴표(`'`)로 감싸야 하고, 공백이 있으면 `+` 연산이나 리터럴 대체 문법(`|...|`)을 써야 한다는 점이 핵심이다.

> [!NOTE] 실행 환경
> `<html xmlns:th="http://www.thymeleaf.org">` 선언 외에 구체적인 Thymeleaf 버전을 특정할 근거는 없다. Spring MVC의 `model.addAttribute(...)`로 값을 전달하는 코드로 보아 Spring 연동 환경을 전제로 하며, 구체적인 버전은 명시되어 있지 않다.

## 리터럴

*   소스 코드 상에 고정된 값을 의미

문자 : 'hello'  
숫자 : 10  
boolean : true, false  
null : null

*   문자리터럴의 경우 원칙상 '(작은 따옴표)로 감싸야한다
*   하지만, 공백이 없을경우 "(큰따옴표)도 인식해서 적용한다 (다만 공백이 있으면 다른 처리를 해줘야함)

## 문자 리터럴 ( 공백 )

String data = "world";  
...  
model.addAttribute("data", data);  
...
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
    <li>'hello' + 'world' = <span th:text=" 'hello' + 'world!' "></span></li>
    <li> 'hello world!' = <span th:text=" ' hello world ' "></span></li>
    <li>'hello' + ${data} = <span th:text=" ' hello ' + ${data} "></span></li>
    <li>리터럴 대체 |hello ${data}| = <span th:text="|hello ${data}|"></span></li>
  </ul>
</body>
</html>
```

1.  작은 따옴표(')와 더하기(+) 를 사용하여 공백이 있는 문자 리터럴 표현
2.  또는, 작은따옴표(')를 이용하여 표현
3.  작은따옴표(') 와 객체 출력을 이용하여 표현
4.  리터럴 대체문법 ( "|" ) 사용

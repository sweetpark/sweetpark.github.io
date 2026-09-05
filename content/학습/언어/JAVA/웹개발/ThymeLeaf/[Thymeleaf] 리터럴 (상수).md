---
title: [Thymeleaf] 리터럴 (상수)
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 리터럴 (상수)

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

> 원문: https://gradualprecision.tistory.com/113

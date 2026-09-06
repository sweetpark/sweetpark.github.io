---
title: "[Thymeleaf] URL 링크 ( th:href=\"@~\" )"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] URL 링크 ( th:href="@~" )

Thymeleaf의 `@{...}` URL 표현식으로 링크를 만드는 방법을 정리한 노트다. 핵심은 `@{/hello}`처럼 경로만 쓰거나, 괄호 안에 파라미터를 넣어 쿼리 스트링(`?param=`)으로 붙이거나, `{param}` 형태의 경로 변수로 URL 자체에 값을 끼워 넣을 수 있다는 점이며, 경로 변수와 쿼리 파라미터를 섞어 쓸 수도 있다.

> [!NOTE] 실행 환경
> `<html xmlns:th="http://www.thymeleaf.org">` 선언 외에 구체적인 Thymeleaf 버전을 특정할 근거는 없다. Spring MVC의 `Model`을 통해 값을 전달하는 컨트롤러 코드로 보아 Spring MVC 연동(thymeleaf-spring) 환경을 전제로 하며, 구체적인 버전은 명시되어 있지 않다.

## URL 링크

public String link(Model model){  
    model.addAttribute("param1", "data1");  
    model.addAttribute("param2", "data2");  
    return "basic/link";  
}
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
    <li><a th:href="@{/hello}"> /hello </a></li>
    <li><a th:href="@{/hello(param1=${param1}, param2=${param2})}"> /hello?param1=data1&param2=data2</a></li>
    <li><a th:href="@{/hello/{param1}/{param2}(param1=${param1}, param2=${param2}">/hello/data1/data2 </a></li>
    <li><a th:href="@{/hello/{param1}(param1=${param1} ,param2=${param2})}"> /hello/data1?param2=data2</a></li>
  </ul>
</body>
</html>
```

*   @를 이용하여, URL을 표현
    *   @{/hello}
        *   /hello
    *   @{/hello(param1=${param1}, param2=${param2})}
        *   /hello ? param1=data1 & param2=data2
    *   @{/hello/{param1}/{param2}(param1=${param1}, param2=${param2}"  
        *   /hello/data1/data2
    *   @{/hello/{param1}(param1=${param1} ,param2=${param2})}
        *   /hello/data1?param2=data2

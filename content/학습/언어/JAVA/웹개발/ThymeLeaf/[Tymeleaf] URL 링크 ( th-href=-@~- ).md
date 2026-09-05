---
title: [Tymeleaf] URL 링크 ( th:href="@~" )
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Tymeleaf] URL 링크 ( th:href="@~" )

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

> 원문: https://gradualprecision.tistory.com/112

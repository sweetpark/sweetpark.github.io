---
title: "[Thymeleaf] 템플릿 레이아웃"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 템플릿 레이아웃

Thymeleaf로 공통 레이아웃을 만들고 페이지마다 일부만 갈아 끼우는 템플릿 레이아웃 기법을 정리한 노트다. 레이아웃 쪽에서 `th:fragment="layout(title, content)"`로 틀을 정의해두고, 각 페이지는 `th:replace="~{layout/layoutMain :: layout(~{::title}, ~{::section})}"`처럼 자신의 `title`·`section` 태그 내용을 인자로 넘겨 레이아웃에 끼워 넣는 방식이 핵심이다.

> [!NOTE] 실행 환경
> `~{layout/layoutMain :: layout(~{::title}, ~{::section})}` 형태의 프래그먼트 표현식(`~{...}`, 파라미터 전달 포함)이 사용되고 있어 Thymeleaf 3.x 문법 기준으로 작성된 것으로 추정된다(해당 표현식 문법은 Thymeleaf 3.0에서 도입됨). 구체적인 마이너 버전은 명시되어 있지 않다.

## 템플릿 레이아웃

*   레이아웃을 만들어서, 기본 틀을 만들고 재사용함으로써 코드의 중복과 유지보수성을 높인다
*   ~{::태그} 를 이용하여 해당 태그 부분을 레이아웃에 넘길 수 있다

#### 레이아웃

```html
<!-- [templates/layout/layoutMain.html] -->

<html th:fragment="layout (title, content)" xmlns:th="http://www.thymeleaf.org">
    <head>
        <title th:replace="${title}"> 기본 타이틀 명칭 </title>
    </head>
    
    <body>
        <div th:replace="${content}">
          <p> 컨텐츠 </p>
        </div>
        
    </body>

</html>
```

#### 레이아웃 적용

```html
<!DOCTYPE html>

<html th:replace="~{layout/layoutMain :: layout(~{::title}, ~{::section})}" xmlns:th="http://www.thymeleaf.org">
<head>
   <title>test</title> 
</head>

<body>

    <section>
        <p>메인 페이지 컨텐츠</p>
        <div>메인 페이지 포함 내용</div> 
    </section>

</body>

</html>
```

*   설명
    *   title 정보와 section 부분을 레이아웃에 적용
    *   ~{::title} : 현재 html 파일 내부 title 태그 내용 전달
    *   ~{::section} : 현재 html 파일 내부 section 태그 내용 전달
    *   th:replace : 전달받은 내용으로 대체하여 적용 (<div> 없어짐)
*   th:insert로도 받을 수 있다

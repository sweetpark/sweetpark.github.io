---
title: "[Thymeleaf] 템플릿 레이아웃"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# [Thymeleaf] 템플릿 레이아웃

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

## 직접 적용

*   추후, 직접 구조화하여 적용을 해봐야겠다... (아직 제대로된 적용을 안해봐서 어색..)
*   잘못된 정보와 수정해야할부분 있으면 댓글 부탁드립니다..!

![](https://t1.daumcdn.net/keditor/emoticon/friends1/large/021.gif)

> 원문: https://gradualprecision.tistory.com/118

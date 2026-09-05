---
title: "시멘틱 태그(<section>,<header>,<footer>,<aside>,<nav>)"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# 시멘틱 태그(`<section>`,`<header>`,`<footer>`,`<aside>`,`<nav>`)

1. 시멘틱 태그란?  
2. 시멘틱 태그 종류

## 시멘틱 태그란?

*   "의미론적 태그"를 의미한다
*   해당 태그를 추가한다고 해서 웹페이지의 화면 표시가 바뀌는 것은 아니다 (`<div>`로 대체해도 화면은 동일)
*   대신 태그 자체가 콘텐츠의 역할을 드러내므로 가독성이 높아지고, 구조가 구분되어 있어 html 유지보수가 쉬워진다
*   또한 검색엔진이 문서 구조를 이해하는 데 도움을 준다 (SEO)

## 시멘틱 태그 종류

*   `<section>` : 콘텐츠 구분, `<div>`와 유사하지만 의미 있는 단위로 묶을 때 사용
*   `<article>` : 콘텐츠 구분, `<section>`보다 더 독립적이고 구체적인 콘텐츠 단위 (예: 블로그 글 하나)
*   `<aside>` : 보조 정보 (본문과 직접 관련 없는 부분), 광고/배너/사이드바가 이에 해당
*   `<header>` : 내비게이션 또는 본문 상단에 위치하는 영역
*   `<nav>` : 웹페이지 상단 등에 위치하는 내비게이션 메뉴
*   `<footer>` : 웹페이지 하단 영역

```html
<body>
    <header>
        <nav>메뉴 영역</nav>
    </header>
    <section>
        <article>본문 콘텐츠</article>
        <aside>광고/사이드바</aside>
    </section>
    <footer>저작권 정보 등</footer>
</body>
```

*   위 예시처럼 시멘틱 태그는 화면 표시에는 영향을 주지 않지만, 유지보수 편의성과 검색엔진 최적화 효과가 있다

> 원문: https://gradualprecision.tistory.com/109

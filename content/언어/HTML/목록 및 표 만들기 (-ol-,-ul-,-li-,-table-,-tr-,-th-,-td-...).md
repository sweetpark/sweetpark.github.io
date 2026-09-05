---
title: "목록 및 표 만들기 (<ol>,<ul>,<li>,<table>,<tr>,<th>,<td>...)"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# 목록 및 표 만들기 (`<ol>`,`<ul>`,`<li>`,`<table>`,`<tr>`,`<th>`,`<td>`...)

1. 목록 만들기  
2. 테이블 만들기

## 목록 만들기 ( `<ol>` , `<ul>` )

*   Ordered List
    *   `<ol>`
        *   start : 순서의 시작 표시
        *   type : a, 1 .. 등 순서 표기를 위한 형식 지정
*   Unordered List
    *   `<ul>`
        *   순서가 없는 리스트
*   `<li>` : `<ol>`, `<ul>` 안에서 각 항목을 나타냄

```html
<ol start="3" type="a">
    <li>세 번째</li>
    <li>네 번째</li>
</ol>

<ul>
    <li>사과</li>
    <li>바나나</li>
</ul>
```

## 테이블 만들기

*   `<table>`
    *   border : 표 둘레 두께 지정
*   `<caption>`
    *   표 제목 지정
*   `<thead>` , `<tbody>`, `<tfoot>` : 시각적으로 html 문서에서 구조를 나타내기 위한 용도 (생략 가능)
    *   `<thead>` : 표의 첫 번째 행 (표의 제목에 해당하는 부분)
    *   `<tbody>` : 표의 내용 부분
    *   `<tfoot>` : 표 마지막 요약 부분 (없는 경우도 많음)
*   `<tr>`
    *   행 (가로)을 나타냄
*   `<th>`
    *   행 안에서 제목을 나타내는 부분 (주로 첫 번째 행)
*   `<td>`
    *   행 안에서 값을 나타내는 부분

```html
<table border="1">
    <caption>과일 목록</caption>
    <thead>
        <tr>
            <th>이름</th>
            <th>가격</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>사과</td>
            <td>1000원</td>
        </tr>
    </tbody>
</table>
```

> 원문: https://gradualprecision.tistory.com/105

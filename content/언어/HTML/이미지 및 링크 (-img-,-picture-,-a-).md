---
title: "이미지 및 링크 (<img>,<picture>,<a>)"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# 이미지 및 링크 (`<img>`,`<picture>`,`<a>`)

1. 이미지 `<img>`  
2. HTML5 이미지 태그 `<picture>`  
3. 링크 태그 `<a>`

## 이미지

*   `<img>`
    *   src : 이미지 파일 경로 (상대 경로 / 절대 경로)
    *   alt : 이미지를 불러올 수 없을 때 표시되는 대체 문구
    *   width, height : 이미지 크기 지정 (가로/세로)

```html
<img src="/images/logo.png" alt="로고 이미지" width="200" height="80">
```

## HTML5 전용 이미지

*   `<picture>`
    *   여러 이미지 후보를 하나로 묶어, 화면 크기 등 조건에 맞는 이미지를 선택하게 하는 역할
    *   `<source>` 태그를 이용해 조건별(media, 크기 등)로 다른 이미지를 지정할 수 있음
*   `<figcaption>`
    *   이미지 다음 줄에 자동으로 개행되어, 이미지에 대한 설명 문단을 표현 (보통 `<figure>`와 함께 사용)

```html
<picture>
    <source media="(min-width: 600px)" srcset="large.jpg">
    <source media="(max-width: 599px)" srcset="small.jpg">
    <img src="default.jpg" alt="예시 이미지">
</picture>

<figure>
    <img src="chart.png" alt="차트">
    <figcaption>2026년 방문자 추이</figcaption>
</figure>
```

## 링크

*   `<a>`
    *   `<a>` 태그를 이용해 원하는 URL로 이동시킬 수 있음
    *   target 속성
        *   `_self` : 현재 탭에서 해당 링크로 이동
        *   `_blank` : 새 탭에서 해당 링크로 이동

```html
<a href="https://example.com" target="_blank">새 탭에서 열기</a>
```

> 원문: https://gradualprecision.tistory.com/104

---
title: "컨테이너 태그, 텍스트 강조(<div>,<span>,<strong>,<em>,<mark>)"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# 컨테이너 태그, 텍스트 강조(`<div>`,`<span>`,`<strong>`,`<em>`,`<mark>`)

1. 텍스트 강조 (strong, em, mark)  
2. 컨테이너 태그 (div, span)

## 텍스트 강조

*   `<strong>` : 텍스트를 굵게 표시 (의미상 중요도를 나타냄)
*   `<em>` : 텍스트를 기울임꼴로 표시 (의미상 강조를 나타냄)
*   `<mark>` : 텍스트를 형광펜처럼 강조 표시

```html
<p><strong>중요한 문장</strong>과 <em>강조하는 문장</em>, 그리고 <mark>하이라이트된 문장</mark></p>
```

## 컨테이너 태그

*   `<div>`
    *   "컨테이너 태그"라고 불림 (블록 레벨)
    *   요소들을 그룹으로 묶는 역할, 그 자체로는 화면에 별도로 표시되지 않음
    *   속성
        *   id
            *   스크립트 및 스타일 적용 시 특정 요소를 식별하는 값
            *   한 html 문서 내에서 한 번만 사용해야 함
        *   class
            *   요소를 그룹별로 묶는 식별자 역할
            *   html 문서 내에서 여러 번 사용 가능
*   `<span>`
    *   스크립트 및 스타일 적용 가능 (인라인 레벨)
    *   문장 안 일부 텍스트만 감쌀 때 사용
    *   "인라인 컨테이너"라고 불림

```html
<div id="header" class="wrapper">
    <span class="highlight">일부 텍스트만 강조</span>
</div>
```

> 원문: https://gradualprecision.tistory.com/103

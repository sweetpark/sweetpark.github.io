---
title: "제목과 문단 ( <h1~6> , <p>, <hr>)"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# 제목과 문단 ( `<h1>`~`<h6>` , `<p>`, `<hr>`)

1. 제목 표현  
2. 문단 표시  
3. 인용구 표시  
4. 수평선 표시

## **제목 표시하기**

*   `<h1>` ~ `<h6>` : 숫자가 작을수록 중요도가 높은 제목 (한 문서에 `<h1>`은 보통 하나만 사용)

```html
<h1>제목 1</h1>
<h2>제목 2</h2>
```

## **문단 표시**

*   `<p>` 태그를 이용해 문단을 나누어 쓸 수 있음

```html
<p>첫 번째 문단입니다.</p>
<p>두 번째 문단입니다.</p>
```

## **인용구 표시**

*   `<blockquote>`를 이용해 인용구 표시 가능
    *   cite 속성을 이용해 인용 출처 URL을 명시할 수 있음
    *   `<blockquote>` 사용 시 들여쓰기되어 표현됨

```html
<blockquote cite="https://example.com/source">
    인용된 문장이 여기에 들어간다.
</blockquote>
```

## **수평선 표시**

*   `<hr>` 태그를 이용해 수평선(구분선)을 표시
    *   CSS로 color, height 등을 지정해 스타일을 꾸밀 수 있음

```html
<hr style="border: 1px solid #ccc;">
```

> 원문: https://gradualprecision.tistory.com/101

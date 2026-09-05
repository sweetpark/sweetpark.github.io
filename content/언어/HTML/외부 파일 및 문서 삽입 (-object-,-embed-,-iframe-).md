---
title: "외부 파일 및 문서 삽입 (<object>,<embed>,<iframe>)"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# 외부 파일 및 문서 삽입 (`<object>`,`<embed>`,`<iframe>`)

1. `<object>`  
2. `<embed>`  
3. `<iframe>`

## 외부 리소스 삽입 태그

*   `<object>`
    *   PDF 등 외부 파일을 가져와서 표현
    *   type : "application/pdf" 등 형식 지정
    *   data : 파일 경로
    *   width, height : 크기 설정
*   `<embed>`
    *   비디오 등 미디어 파일을 표현
    *   type : "video/mp4" 등 형식 지정
    *   src : 파일 경로
    *   width, height : 크기 설정
*   `<iframe>`
    *   다른 페이지의 내용을 현재 문서 안에 가져와 표시
    *   src : 가져올 URL
    *   width, height : 크기 설정

```html
<object type="application/pdf" data="doc.pdf" width="600" height="400"></object>

<embed type="video/mp4" src="movie.mp4" width="480" height="270">

<iframe src="https://example.com" width="600" height="400"></iframe>
```

## 주의할 점

*   `<object>`, `<embed>`는 브라우저나 플러그인 지원 여부에 따라 동작하지 않을 수 있어, 최근에는 미디어 삽입 시 `<video>`/`<audio>` 태그가 더 널리 쓰인다

> 원문: https://gradualprecision.tistory.com/108

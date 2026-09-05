---
title: "미디어 태그 (<audio>, <video>)"
tags: [프로그래밍 언어, HTML]
created: 2026-09-05
modified: 2026-09-05
---

# 미디어 태그 (`<audio>`, `<video>`)

1. 오디오  
2. 비디오

## 오디오

*   `<audio>`
    *   src : audio 파일 경로 입력
    *   autoplay, loop : 자동 재생 / 반복 재생
    *   controls : 컨트롤 패널 표시
    *   `<source>` : 여러 형식의 audio 중 웹브라우저가 지원하는 형식을 순서대로 찾아서 사용 (지원하는 형식을 찾으면 나머지는 무시됨)

```html
<audio controls>
    <source src="audio.ogg" type="audio/ogg">
    <source src="audio.mp3" type="audio/mpeg">
    브라우저가 audio 태그를 지원하지 않습니다.
</audio>
```

## 비디오

*   `<video>`
    *   src : 비디오 파일 경로
    *   muted : 음소거
    *   autoplay : 자동 재생
    *   controls : 컨트롤 패널 표시
    *   `<source>` : audio와 동일하게 지원하는 형식을 순서대로 탐색 (나머지는 무시됨)

```html
<video width="480" controls muted>
    <source src="movie.mp4" type="video/mp4">
    <source src="movie.ogg" type="video/ogg">
    브라우저가 video 태그를 지원하지 않습니다.
</video>
```

> 원문: https://gradualprecision.tistory.com/107

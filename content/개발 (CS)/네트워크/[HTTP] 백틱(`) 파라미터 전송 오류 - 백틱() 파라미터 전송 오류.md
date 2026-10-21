---
title: "백틱(`) 파라미터 전송 오류"
description: "URL 파라미터에 백틱 문자가 들어가 HTTP 규약 위반으로 요청이 거부되던 문제의 원인과 해결책을 정리했습니다."
tags: [학습, 개발-CS, 네트워크, HTTP]
modified: 2026-09-05
---

# 백틱(`) 파라미터 전송 오류

## 📌 개념

증상:

```jsx
java.lang.IllegalArgumentException:
Invalid character found in the request target
[/member/info?username=g6003&page=1&userid=`1598 ]

```

원인: 백틱(`)이 URL 요청 대상(request target)에 그대로 포함되어, 프로토콜 규약에 어긋나 예외로 처리됨.

해결: 백틱(`)을 URL 인코딩(`%60`)한 뒤 요청.

```jsx
/member/info?username=g6003&page=1&userid=%601598
```

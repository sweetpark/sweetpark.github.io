---
title: "백틱(`) 파라미터 전송 오류"
tags: [학습, 개발-CS, 네트워크, HTTP]
modified: 2026-09-05
---

# 백틱(`) 파라미터 전송 오류

> [!NOTE]
> URL 파라미터에 백틱(`)이 포함되어 HTTP 프로토콜 규약 위반으로 요청이 거부되던 문제와 해결책.

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

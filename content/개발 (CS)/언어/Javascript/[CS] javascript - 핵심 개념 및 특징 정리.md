---
title: "javascript"
tags: [학습, 개발-CS, 언어, 개발, JavaScript]
created: 2026-09-05
modified: 2026-09-05
---

# javascript

## 자료형

- 문자 + 숫자
    - var, let
- 고정값
    - const

```jsx
let a = 1;
var b = "test";
const TEST = "test";

TEST = "good; // 불가능 error
```

## 변수명 ($, _)

- 변수명으로 $,_ 표현 가능

## 중괄호

- 중괄호는 새로운 script 환경이라고 생각하면됨

```jsx
let x = 10;//Allowed

{
   let x = 20; //Allowed
}

{
   let x = 30;
   let x = 40; // Not Allowed
}

```

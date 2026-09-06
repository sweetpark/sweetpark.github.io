---
title: "Spring 프레임워크 제작"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
created: 2026-02-04
modified: 2026-09-05
---

# Spring 프레임워크 제작

> [!NOTE]
> Servlet + JSP 기반의 간단한 MVC 프레임워크를 직접 제작해보는 미니 프로젝트
> Spring 기초(김영한) 강의 실습 프로젝트에서 이관.

## 🧱 기술 스택
- Servlet
- JSP (View)

## ⚙️ 구현
- 요구사항
    1. 회원 저장
    2. 회원 목록 조회
- 특징
    - Spring 처리 로직 이해
    - Spring에서 Servlet을 사용하는 구간
    - Spring에서 Adapter의 역할

Servlet을 각 URL마다 여러 개 만들면 파라미터 처리·뷰 포워딩 같은 공통 로직이 서블릿마다 중복된다. 이를 막기 위해 하나의 FrontController가 모든 요청을 받아 적절한 핸들러로 위임하는 구조를 만들고, 핸들러마다 메서드 시그니처가 달라 FrontController가 직접 호출할 수 없는 문제는 Adapter 패턴으로 해결한다 — 이는 실제 Spring MVC의 DispatcherServlet과 HandlerAdapter가 쓰는 구조와 동일하며, 이 프로젝트는 그 원리를 직접 만들어보며 이해하는 것이 목적이다.

![image.png](assets/image.png)

### 구현 이미지
![image.png](assets/image-1.png)

### 참고
- GitSource: [sweetpark/Servlet_Ex](https://github.com/sweetpark/Servlet_Ex)
- 블로그
    - Servlet + JSP MVC 적용 — [MVC 패턴 (Servlet + JSP)](https://gradualprecision.tistory.com/76)
    - FrontController 도입 — [Spring 예제#1 (+Servlet, JSP, FrontController)](https://gradualprecision.tistory.com/77)
    - FrontController + Adapter 패턴 적용 — [Spring 예제#2 (Adapter Handler, FrontController)](https://gradualprecision.tistory.com/78)

## 관련 문서

- [(Spring) Spring 구현 프로젝트 - 핵심 개념 및 특징 정리](../Spring%20구현%20프로젝트/[Spring]%20Spring%20구현%20프로젝트%20-%20핵심%20개념%20및%20특징%20정리.md) — 동일한 FrontController+Adapter 진행 과정을 순수 Servlet부터 Spring MVC까지 더 상세한 버전별 코드로 다루는 후속 노트

---
title: "회원 등급별 상품 할인 적용"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
created: 2026-02-04
modified: 2026-09-05
---

# 회원 등급별 상품 할인 적용

> [!NOTE]
> AppConfig 기반 수동/자동 Bean 등록과 OCP·DIP, 싱글톤을 활용한 회원 등급별 상품 할인 미니 프로젝트
> Spring 기초(김영한) 강의 실습 프로젝트에서 이관.

> [!NOTE] 실행 환경
> 버전 명시 없음 — `@ComponentScan` 등 Spring 공통 API만 사용되어 특정 버전은 확정하기 어렵다.

## 🧱 기술 스택
- Spring `@ComponentScan`, 수동/자동 Bean 등록
- OCP(개방-폐쇄 원칙), DIP(의존관계 역전 원칙)
- Spring 싱글톤 컨테이너

## ⚙️ 구현
- 요구사항
    - 회원 저장
    - 회원 목록 조회
    - 상품 주문
    - 주문된 상품 조회 및 최종 가격확인

할인 정책을 특정 등급에 고정하지 않고 인터페이스(DiscountPolicy 등)에 의존하도록 DIP를 적용해 설계한 이유는, 이후 정률 할인 → 정액 할인처럼 정책이 바뀌어도 AppConfig에서 구현체를 갈아끼우는 것만으로 대응할 수 있고 클라이언트 코드(OrderServiceImpl)는 전혀 수정하지 않아도 되기 때문이다(OCP 준수). 회원/주문 데이터를 싱글톤 빈으로 관리하는 것도 요청마다 리포지토리 객체를 새로 생성하는 비용을 없애기 위함이다.

- 주문 도메인 클래스 다이어그램

![image.png](assets/image.png)

### 구현 이미지
- 멤버 조회

![image.png](assets/image-1.png)

- 주문 조회

![image.png](assets/image-2.png)

### 참고
- GitSource: [sweetpark/SpringBasic](https://github.com/sweetpark/SpringBasic)
- 블로그
    - component Scan — [gradualprecision.tistory.com/58](https://gradualprecision.tistory.com/58)
    - SOLID 규칙 — [gradualprecision.tistory.com/54](https://gradualprecision.tistory.com/54)
    - Spring 컨테이너 — [gradualprecision.tistory.com/55](https://gradualprecision.tistory.com/55)
    - 의존관계 자동주입(@Autowired) — [gradualprecision.tistory.com/59](https://gradualprecision.tistory.com/59)

## 관련 문서

- [(Spring Framework) 스프링 핵심원리 - 핵심 개념 및 특징 정리](../../[Spring]%20스프링%20핵심원리%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 프로젝트가 구현하는 SOLID·IoC/DI·싱글톤 컨테이너 개념을 정리한 노트
- [(Spring Framework) @Component에 관하여...](../../@Component에%20관하여....md) — 이 프로젝트의 자동/수동 Bean 등록·컴포넌트 스캔 구현이 기반하는 개념 노트

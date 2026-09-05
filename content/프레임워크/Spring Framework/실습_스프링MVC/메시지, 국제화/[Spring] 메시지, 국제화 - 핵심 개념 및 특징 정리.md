---
title: "메시지, 국제화"
tags: [학습, 개발-CS, 언어, Spring, 김영한]
created: 2026-02-04
modified: 2026-09-05
---

# 메시지, 국제화

> [!NOTE]
> 메시지 Bean 적용 및 국제화(i18n) — `.properties` 파일 기반 message/international 처리
> Spring 기초(김영한) 강의 실습 프로젝트에서 이관.

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 🧱 기술 스택
- Spring MessageSource (메시지 Bean)
- Java 국제화(i18n) — `messages.properties` / `messages_en.properties` 등 로케일별 프로퍼티 파일
- Thymeleaf (`#{...}` 메시지 표현식)

## ⚙️ 구현
- 메시지 Bean 적용
- message, international 적용 방법
- `.properties` file 작성

### 구현 이미지
![image.png](assets/image.png)

![image.png](assets/image-1.png)

### 참고
- GitSource: [sweetpark/SpringThymeleaf (MessageInternational)](https://github.com/sweetpark/SpringThymeleaf/tree/MessageInternational)
- 블로그: [gradualprecision.tistory.com/88](https://gradualprecision.tistory.com/88)

---
title: "[실기] (PART 5) 인터페이스 구현"
tags: [학습, 자격증, 정보처리기사]
modified: 2026-09-05
---

# [실기] (PART 5) 인터페이스 구현

> [!NOTE]
> 정보처리기사 실기 PART 5 — JSON/XML 등 인터페이스 기능 구현과 관련 개념 정리.

## 📌 개념

- 인터페이스 기능 구현
    - JSON
        - 속성 - 값 (키 - 값 쌍)
        - 개방형 표준 포맷
    - JSON의 특징
        - AJAX에서 많이 사용되고 XML을 대체하는 주요 데이터 포맷
        - 언어 독립형 데이터 포맷
    - XML
        - SGML의 단점 보안, HTML 단점 보완
    - AJAX
        - 자바스크립트를 이용하여 비동기적으로 XML 교환
        - XMLHttpRequest 객체 이용
        - AJAX주요기술
            - XMLHttpRequest : 비동기 통신
            - JavaScript
            - XML : 마크업언어 (HTML, SGML 단점 보안)
            - HTML : 인터넷웹(www) 표현하는 마크업 언어
            - CSS : 스타일 시트
            - DOM : XML 문서 트리 구조
            - XSLT :XML 문서를 다른 XML문서로 변환
    - REST
        - 웹과 같은 분산 하이퍼미디어에서 HTTP메서드로 주고받는 웹 아키텍처
        - ROY Fielding
        - REST 기본 구조 : 리소스, 메서드, 메시지
        - CRUD 메서드 사용 : POST(생성), GET (조회), Put(업데이트), Delete(삭제)
    
    ---
    
- 인터페이스 보안기능 적용
    - 시큐어코딩가이드
        - 입력데이터 검증 및 표현
        - 보안 기능
        - 시간 및 상태
        - 에러 처리
        - 코드 오류
        - 캡슐화
        - API 오용
    - 데이터베이스 암호화 기법
        - API 방식 : 애플리케이션에서 암,복호화
        - Plug-in 방식 : DB서버에 설치
        - TDE방식 : DBMS 커널 자체에 암복호화
        - Hybrid 방식 : API 방식과 Plug-in 방식을 혼합
    - 중요 인터페이스 데이터 암호화 전송
        - IPSEC : AH헤더와 기밀성 보장하는 암호화를 제공하는 터널링 프로토콜 (3계층)
        - SSL/TLS : 웹 데이터 암호화, client-server 간에 상호인증 (4계층, 7계층)
        - S-HTTP : shttp:// 형태, HTTP 보안, 웹상 트래픽 암호화

---

- 인터페이스 구현 검증 도구
    - xunit : 다양한 언어 지원, 서로 다른 원소 테스트 가능
    - STAF : 컴포넌트 재사용 테스트
    - FitNesse : 웹 기반 테스트 케이스 설계, 실행, 결과확인
    - NTAF : FitNesse + STAF
    - Selenium : 다양한 언어 + 다양한 브라우저 지원 (테스트 스크립트언어 학습 x)
    - watir : 루비 기반 웹 테스트
- 인터페이스 감시도구
    - 스카우터 : 애플리케이션 감시기능
    - 제니퍼 : 개발과정부터 애플리케이션 감시

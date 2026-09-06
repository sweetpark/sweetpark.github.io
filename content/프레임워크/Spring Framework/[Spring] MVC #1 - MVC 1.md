---
title: "MVC #1"
tags: [학습, 개발-CS, CS-기초, Spring-Framework, 개발, Spring]
created: 2025년 3월 12일 오후 2:14
modified: 2026-09-05
---

# MVC #1

> [!NOTE]
> 웹 서버/WAS 구성, 서블릿과 서블릿 컨테이너, 멀티스레드 처리, SSR/CSR, 자바 웹 기술의 역사, 그리고 MVC 패턴(Servlet + JSP) 적용까지 정리한다.

## 📌 개념

### 웹서버 구성

- web server ( apache )
    - 정적 리소스를 주는 용도
- was server ( tomcat )
    - 애플리케이션 로직을 처리할 수 있는 동적 처리 서버
    - 정적 리소스도 처리할 수 있지만, web server 를 활용한다
    
    > [!NOTE]
    > web server를 사용하는 이유
    > - WAS는 장애가 있을 시 오류 화면조차 제대로 보여주지 못할 수 있다
    > - WAS는 비즈니스 로직을 다루므로 상대적으로 에러가 잦다

- DB
    - 비즈니스 로직을 실행하기 위해 데이터를 저장하는 역할

### 서블릿

- 서블릿의 역할
    - TCP/IP 통신 연결
    - HTTP 요청 파싱
    - HTTP 응답 메시지 생성 및 전달
    - 비즈니스 로직 외 모든 통신 역할 담당
- 서블릿 사용 방법
    - HttpServelet 클래스 상속
        - service 메서드 오버라이딩 (재정의)
        - request & response 객체를 파라미터로 사용
        - 본문에 애플리케이션 로직을 구현
- WAS 에서 서블릿을 이용해 HTTP 요청 & 응답 정보를 파싱 및 생성함
- 서블릿 컨테이너
    - 서블릿을 지원하는 WAS를 서블릿 컨테이너라고 함
    - 서블릿 객체의 생성/초기화/호출/종료의 생명주기 관리
    - 서블릿은 싱글톤으로 관리된다 ( 공유되어 사용 )
        - 공유변수 사용 주의 (싱글톤의 주의할점)
    - 동시 요청을 위한 멀티쓰레드 처리 지원
    - 쓰레드가 서블릿 컨테이너를 호출

### 동시요청 (멀티쓰레드)

1. 쓰레드 마다 서블릿 컨테이너를 호출하므로, 호출이 있을때마다 쓰레드 생성 (?)
    - 쓰레드 호출시 생성 장점
        - 동시 요청 처리 가능
        - 리소스 제한 내에 처리 가능
        - 병렬 처리 가능
    - 쓰레드 호출시 생성 단점
        - 쓰레드 컨텍스트 스위칭 비용이 발생
        - 쓰레드 생성에 제한이 없음 (리소스 제한을 넘길 수 있음)
2. 쓰레드 풀 사용
    - 쓰레드 개수를 지정
        - 장점
            - 리소스 제한 범위를 넘지 못한다
            - 쓰레드가 미리 생성되어있으므로, 생성 및 소멸 비용을 줄일 수 있다.
    - 톰캣의경우 default 값으로 쓰레드 개수가 200개 이다. (변경 가능)
    - 쓰레드 풀 적정 숫자
        - 성능 테스트 툴
            - 아파치 ab
            - 제이미터
            - nGrinder
    - WAS의 멀티 쓰레드 지원
        - 개발자가 멀티 쓰레드 관련 코드를 신경쓰지 않아도 됨
        - 멀티쓰레드 환경이므로 싱글톤 객체(서블릿, 스프링 빈)는 주의해서 사용
        - 이건 한번 직접 짜봐야징

### HTML, HTTP, API, CSR, SSR

- 정적 리소스
    - CSS
    - JS
    - 이미지
    - 영상
    - 고정된 html
- 동적 HTML
    - View template 을 사용
    - WAS에서 동적으로 생성된 html을 보여줌
- HTTP API
    - html을 전달하는 것이 아닌 데이터를 전송
    - 주로 json을 사용
    - HTTP API 사용 시기
        - UI 화면이 필요하다면 클라이언트가 별도 처리
            - 웹 클라이언트 : vue, react
        - 데이터만 필요한 경우 사용
        - 사용 목적
            - 앱 클라리언트 to 서버
            - 웹 클라이언트 to 서버
            - 서버 to 서버
- 서바사이드 렌더링 (SSR)
    - JSP, Thymeleaf 같은 것을 이용하여 동적으로 html 을 생성
    - 서버에서 html을 생성해서 웹 브라우저에 전달
- 클라이언트 사이드 렌더링 (CSR)
    - html을 받는 것이 아닌, javascript를 받아서 클라이언트 쪽에서 렌더링
    - 부분 변경이 가능 → html DOM
    - 주로 동적인 화면에서 사용
    - 동작 구성
        - 클라이언트
            1. HTML 요청 → 본문 내용은 없음
            2. 자바스크립트 요청
            3. HTTP API를 이용하여 데이터 요청
            4. js + 클라이언트 로직 + 데이터 를 이용하여 렌더링
        - 서버
            1. 요청받은 HTML에 JS 링크 응답
            2. 클라이언트 로직 + HTML 렌더링 코드 응답
            3. JSON 형태로 데이터 응답
- UI 학습 방향성
    - 백엔드
        - SSR은 필수적으로 할 줄 알아야 한다
        - JSP, Thymeleaf를 이용 (요즘 추세는 JSP는 사장되고, Thymeleaf가 뜨고 있음 → thymeleaf는 spring이 밀고 있음)
        - 화면이 복잡하지 않을 때 사용
    - 프론트엔드
        - 복잡하고 동적인 UI 사용
        - React, Vue.js ( 요즘 추세는 React 이다)
        - 백엔드 개발자의 경우, 웹프론트앤드 쪽을 배우는 것은 옵션이다

### 자바 웹 기술 역사

- 서블릿
    - HTML 생성이 어려움 ( JAVA코드로 구현해야하므로 )
- JSP
    - HTML생성이 편리, 비즈니스 로직 까지 많은 역할 담당
    - 너무 많은 것을 담당하는게 독이됨 (유지보수에 어려움)
    - → MVC 탄생 배경
    - 서블릿 + JSP 를 조합하여 MVC 패턴 사용
- MVC 프레임워크 춘추 전국 시대
    - 스트럿츠 ( 그때의 강세 프레임워크 )
    - 웹워크
    - 스프링 MVC (과거 버전)
- 애노테이션 기반 MVC
    - 웹 프레임워크의 정점을 찍음
    - 이후, 스프링 부트의 등장
        - 스프링 부트는 WAS를 내장하고 있어서 편리한 빌드 배포 과정을 가짐
- 최신 기술
    - Web Servlet - Spring MVC
    - Web Reactive - WebFlux
        - WebFlux
            - 특징
                1. 비동기 , 논블럭 처리
                2. 최소 쓰레드 최대 성능 → 컨테스트 스위칭 비용 최소화
                3. 함수형 스타일로 개발 → 동시처리 코드 효율화
                4. 서블릿 기술을 사용하지 않음 → 다른 웹 프레임워크를 사용
                5. Node.js 처럼 사용 가능
                6. 성능을 중요시하거나, 로직 자체가 무거우면 사용
            - 단점
                1. RDB 지원이 부족하다
                2. 실무에서 아직 많이 사용하지는 않음

### 자바 뷰 템플릿 역사

- HTML 을 편리하게 생성하는 뷰 기능
- 종류
    - JSP
        - 속도 느림, 기능 부족
    - 프리마커, 벨로시티
        - 속도 문제해결 ,다양한 기능
        - 업데이트를 잘 안함
    - Thymeleaf
        - HTML 모양을 유지하면서 뷰 템플릿 적용 가능
        - 스프링 MVC와 호환이 좋음
        - 성능의 경우, 프리마커/벨로시티가 좋음

### Spring initializer

- JSP를 사용하려면 패키징을 War로 사용해야한다
- dependency
    - spring web
    - lombok

### 서블릿

- spring boot 에서 servlet 등록 방법
    1. @WebServlet 으로 서블릿 등록
        - urlPattern 으로 해당 url 정보 파싱 가능 (http 요청 / 응답)
    2. service 메서드 오버라이딩
- request, response
    - request : 요청 받은 정보 파싱
    - response : 응답을 보냄
- get 방식 값 추출
    - request.getParameter(”필드”);
- post 방식 값 추출
    - request.getParameter(”필드”);

### 요청/응답 방식

1. GET 방식
2. POST - html Form
    1. content-Type : x-www-form-urlencoded
3. HTTP message body (API 형태)
    1. content-Type : application/json

### 응답 헤더

- 상태 응답 코드
- 쿠키값
- content -type
- redirect

### 서블릿의 단점

- 자바를 이용하여 동적인 html을 만들 수 있으나, html을 작성하는게 너무 귀찮다 ( java 코드에 html을 넣는 것)
    - → 템플릿 엔진 사용 (ex : JSP, ThymeLeaf)
    - 템플릿 엔진은 html문서에 java 코드를 넣는 것

### JSP

- <% ~~ %> : JSP파일 내부에서 JAVA코드 입력
- <%= ~~ %> : JSP 파일 내부에서 JAVA 코드 출력 결과 출력

### MVC ( Servlet + JSP )

- MVC 적용 이유
    - 유지보수의 어려움 ( 한 파일에 다 몰아져있기에 찾기가 힘들다 )
    - 변경주기의 다름 (변경주기가 다르다면 분리하는 것이 맞음)
- MVC 구성
    - Controller ( 비즈니스 로직 ) → Model ( 컨트롤에서 나온 데이터를 담아둠 ) → View ( 모델에 있는 데이터를 활용해서 화면 구성 )
    - Controller 세부 구성
        - 컨트롤러는 말 그대로 제어하는 역할 ( 서비스 + 리포지토리을 호출해서 사용)
        - 서비스 : controller가 서비스를 통해 비즈니스 로직 구현
        - 리포지토리 : 비즈니스 로직에 필요한 데이터를 저장하고 호출하는 역할

### MVC 적용

- 구성
    - Controller : Servlet
        - setAttribute로 전달
    - View : JSP
        - getAttribute로 view 템플릿에서 값 사용
        - 템플릿 엔진에서 따로 제공해주는 것을 이용해서 편리하게 값을 꺼내 쓸수 있음
- WEB-INF 디렉토리 밑에 있는 jsp 는 클라이언트가 url로 호출할 수 없음
    - Controller에서 호출해야 view 가능

## 관련 문서

- [(학습/개발 (CS)/언어/JAVA/웹개발/SERVLET & JSP) Servlet 기초](../../개발 (CS)/언어/JAVA/웹개발/SERVLET%20&%20JSP/Servlet%20기초.md) — 이 노트의 "서블릿" 절에서 다룬 HttpServlet 상속·생명주기를 코드 예제로 더 상세히 다루는 노트
- [(학습/개발 (CS)/언어/JAVA/웹개발/SERVLET & JSP) MVC 패턴 ( Servlet + JSP )](../../개발 (CS)/언어/JAVA/웹개발/SERVLET%20&%20JSP/MVC%20패턴%20(%20Servlet%20+%20JSP%20).md) — 이 노트의 "MVC ( Servlet + JSP )" 절을 실제 코드 구현으로 확장한 노트
- [(학습/개발 (CS)/언어/JAVA/웹개발/SERVLET & JSP) JSP 이론 및 기초 문법](../../개발 (CS)/언어/JAVA/웹개발/SERVLET%20&%20JSP/JSP%20이론%20및%20기초%20문법.md) — 이 노트의 "JSP" 절에서 다룬 <% %>, <%= %> 문법을 더 상세히 다루는 노트

---
title: "Thymeleaf 기본"
tags: [JAVA 기반 웹개발, ThymeLeaf]
created: 2026-09-05
modified: 2026-09-05
---

# Thymeleaf 기본

Thymeleaf 문법 전반을 한 번에 훑는 기초 노트다. 텍스트/객체/리스트/맵을 `th:text`로 출력하는 방법, `th:with`로 지역변수를 선언하는 방법, `@{...}` URL 표현식, 작은따옴표·`|...|` 리터럴 대체 문법, `th:each` 반복과 상태 변수(index, count 등), `th:if`/`th:unless`/`th:switch` 조건문, 그리고 파서 주석·프로토타입 주석까지 핵심 문법을 요약한다.

> [!NOTE] 실행 환경
> `<html xmlns:th="http://www.thymeleaf.org">` 선언만으로는 구체적인 Thymeleaf 버전을 특정할 근거가 없다. Spring Boot 프로젝트라면 thymeleaf-spring 연동 스타터가 필요하며, 구체적인 Thymeleaf/Spring Boot 버전은 문서에 명시되어 있지 않다.

## Thymeleaf 선언

<html xmlns:th="http://www.thymeleaf.org">

*   html 문서에 해당 문구를 적어야, thymeleaf 템플릿을 사용해야하는 것을 인지할 수 있다

## Text 출력

*   Model Attribute 값 출력
    *   ${data}
*   html 이스케이프 회피
    *   th:utext

## Object 출력

*   th:text="${user.username}"
*   th:text="${user['username']}"
*   th:text="${user.getUsername()}"

## List 출력

*   th:text="${users[0].username}"
*   th:text="${users[0]['username']}"
*   th:text="${users[0].getUsername()}"

## Map 출력

*   th:text="${userMap['userA'].username}"
*   th:text="${userMap['userA']['username']}"
*   th:text="${userMap['userA'].getUsername()}"

## 지역변수 선언

*   th:with="first=${users[0]}"
    *   ${first.username}

## URL 표현

*   th:href="@{/hello}"  
    *   /hello
*   th:href="@{/hello/{param1}/{param2}(param1=${param1}, param2=${param2})}"
    *   /hello/[param1 데이터값]/[param2 데이터값]
*   th:href="@{/hello/(param1=${param1})}"
    *   /hello?param1=[param1 데이터값]
*   th:href="@{/hello/{param1}(param1=${param1}, param2=${param2})}"
    *   /hellp/[param1 데이터값]?param2=[param2 데이터값]

## 문자표현

*   Thymeleaf에서는 문자의 경우 무조건 ' (작은따옴표)를 붙여줘야한다
    *   th:text="'hello world'"
*   작은따옴표 대신해서, | 를 사용하기도 한다 (주로 사용함)
    *   th:text="|hello ${data}|"

## 반복문

*   사용법
    *   th:each="user : ${users}"
*   반복상태 유지 기능 사용 가능
    *   유지 기능
        *   Index : 0 부터 시작하는 값
        *   count : 1 부터 시작하는 값
        *   size : 전체 크기
        *   even, odd : 홀수/짝수
        *   first : 반복문 첫번째
        *   last : 반복문 마지막
        *   current : 현재 객체
    *   유직기능 파라미터 생략하지 않을경우
        *   th:each="user, userStat :${users}"
        *   userStat을 이용하여 반복문때 사용하가능한 유지기능 사용이 가능
    *   유지기능 파라미터 생략할경우
        *   th:each"member:${members}"
        *   지정한 변수 + (Stat) 으로 자동 생성됨
            *   ex) memberStat

## 조건문

*   사용법  
    *   if
        *   th:if="${[조건식]}"
        *   ex) th:if="${user.age lt 20}"
    *   unless (if 반대)
        *   th:unless="${[조건식]}"
    *   switch

th:switch="${[변수]}"  
    th:case="값1"  
    th:case="값2"  
    th:case="*"

## 타임리프 주석

*   타임리프 파서 주석 (타임리프에 진짜 주석, 렌더링에서 주석부분 제거)
    *   <!--/* [[${data}]] */-->
    *   <!--/*-->
*   타임리프 프로토타입 주석
    *   html파일을 그대로 열면 주석처리, 타임리프를 렌더링하면 보이는 기능 
    *   <!--/*/ ~~ /*/-->

---
title: "[JDBC#1] JDBC의 기본 설명 및 구조 이해하기"
tags: [데이터베이스, JDBC]
created: 2026-09-05
modified: 2026-09-05
---

# [JDBC#1] JDBC의 기본 설명 및 구조 이해하기

## _JDBC 란?_

자바에서 데이터베이스에 접속할 수 있도록 하는 자바 API를 의미함.  
JDBC는 데이터베이스에서 자료를 쿼리하거나 업데이트하는 방법을 제공한다

* * *

## _JDBC 이해_

요청 흐름

![](https://blog.kakaocdn.net/dna/FW7Qk/btsKr4iVXBf/AAAAAAAAAAAAAAAAAAAAAHpO5LkJfmlm9ZoGCVNOx_uGGF_W_FSbqF7Vq86dIo_n/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=lqI5pLfzc2sgibBzl2o4zVBZwz8%3D)

*   클라이언트 (APP, WEB)의 요청이 들어오면, Application Server에서 요청을 분석하고 필요한 데이터를 DB를 통해 가지고 오게된다

DB 커넥션 과정

![](https://blog.kakaocdn.net/dna/lYINf/btsKq2sIXR7/AAAAAAAAAAAAAAAAAAAAAASDP2Stiis4zR7E6IqqKW4daQp0-eOf6xCs3sybVd1O/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=A%2BckUPTLRTKL6uxkaHzOSQGGxNQ%3D)

*   Application은 필요한 데이터가 있을 때, 3가지 절차를 지나게 된다
    1.  커넥션 연결 : DB 와 연결을 하기위해 커넥션 설정을 한다
    2.  SQL 전달 : DB에 쿼리를 하기 위해서, SQL을 전달하게 된다
    3.  결과 응답 : SQL 결과를 응답을 통해, Application Server에 전달하게 된다  
          
        

DB 커넥션 세부 과정

![](https://blog.kakaocdn.net/dna/bCROEk/btsKrLxeO6w/AAAAAAAAAAAAAAAAAAAAADDJ0VbvlbzFKqv9eA1v-EJuAmt0VilBfjw-zVY0X0EA/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=%2Fwt%2Bt5EzPkmAmlPcim%2B6yrrZ0TA%3D)

*   **JDBC == 인터페이스**  
    *   DB의 경우, 여러 회사(Mysql, Oracle, H2 ...)들에 따라 접근하는 방식 및  결과 포멧들이 다르게 되어있다.
        *   **JDBC) 각각의 DB에 맞춰 개발하게 되면, 동일한 기능인데 사용법이 다르게 되는 불편함이 생긴다. 따라서, 서로다른 방식들을 통일 시키고자, JAVA에서 JDBC(인터페이스) 를 이용하여 통일화를 이룸**
    *   해당 JDBC로 포맷을 맞추고, Spring은 해당 DB에 맞춰서 드라이버를 연결하여 통신을 하게 된다.

* * *

## _JDBC 주로 사용되는 파라미터_

java.sql.Connection : 커넥션 연결  
java.sql.statement : SQL을 담은 내용 (prepareStatement로서 파라미터를 담는걸로 사용)  
java.sql.ResultSet : SQL 결과 내용

> 원문: https://gradualprecision.tistory.com/154

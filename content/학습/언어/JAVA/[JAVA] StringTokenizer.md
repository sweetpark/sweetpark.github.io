---
title: "[JAVA] StringTokenizer"
tags: [프로그래밍 언어, JAVA]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA] StringTokenizer

1. StringTokenizer 란?  
2. 생성자  
3. 주요 메서드

## StringTokenizer

JAVA에서 문자열을 분리하기 위한 유틸리티 클래스.

*   각각 나눠진 문자열은 토큰(token)으로 취급함
*   구분자(delimiter)를 기준으로 여러부분으로 나누는 역할

## 생성자

*   기본 구분자 (공백, 탭, 줄바꿈)을 사용하여 분리하는 생성자

StringTokenizer(String str)

*   지정한 구분자(delimiter)를 기준으로 문자열을 분리하는 생성자

StringTokenizer(String str, String delimiter)

*   delimiter를 기준으로 문자열을 나눔, 거기에 returnDelimiter가 true일경우, 구분자도 토큰으로 반환

StringTokenizer(String str, String delimiter, Boolean returnDelimiter)

## 주요 메서드

*   hasMoreTokens()
    *   더이상 읽을 토큰이 없을때까지 true를 반환
*   nextToken()
    *   다음 토큰을 반환
    *   더이상 토큰이 없으면, NoSuchElementException을 발생
*   countTokens()
    *   남은 토큰의 개수를 반환

## 예제

```java
public class test{
    
    public static void main( String []args ) throws Exception{
        
        BufferedReader buf = new BufferedReader(new InputStreamReader(System.in) );
        
        StringTokenizer st = new StringTokenizer(buf.readLine());
        
        while(st.hasMoreTokens()){
            System.out.println(st.nextToken());
        }
        
        buf.close();
    }
}
```

> 원문: https://gradualprecision.tistory.com/136

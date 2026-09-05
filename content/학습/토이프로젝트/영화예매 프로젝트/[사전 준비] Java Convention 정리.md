---
title: [사전 준비] Java Convention 정리
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [사전 준비] Java Convention 정리

## Java Convention을 작성하는 이유..

컨벤션은 상호간의 협의이다.. 코드를 구현할 때 어떻게 기능을 구현할 것인가도 중요하지만, 혼자 개발하는 것이 아니라면 통일성을 갖춰서 사용해야한다고 생각이 들었다.. 누군가는 3칸을 띄우고 누군가는 개행을 진행하고 이렇게 된다면 통일감이 없는 코드가 될것이고, 그 코드는 결국에는 더미코드가 될 가능성이 농후하다는 것이 개발하면서 느낀점이었다..  
  
 그래서 시작부터 기본적인 규칙은 지정해두어야 통일감이 있을거고 쓸데없는 시간을 낭비하는 일을 방지할 수 있을거라고 생각이 들었다. 하위에는 "그래도 이것만큼은 지키자"라는 명목하에 밑의 기준들을 팀원들과 공유하게 되었다

Convention

## Indent 규칙

*   공백 (space bar) 4칸
*   중괄호는 같은 줄에 열고, 코드 블록이 끝나는 부분에 닫기

```java
if ( [조건] ) {
(4칸)// body
}
```

## 클래스 규칙

*   파스칼 케이스 적용

파스칼 케이스 (Pascal Case)  
- 클래스명은 대문자로 시작하고 각 단어의 첫글자도 대문자로 표기  
- 인터페이스 이름은 형용사 형태로 짓기 가능  
Ex) UserAccount

## 네이밍 규칙

*   카멜케이스 적용 (변수이름, 메서드 ... )

카멜 케이스 (Camel Case)  
- 맨 앞 단어의 첫 철자를 소문자로 시작하되, 그 다음 이어지는 단어의 첫 철자를 대문자로 표기하는 방식  
Ex) autoHandle

## 상수 규칙

*   상수의 경우 모두 대문자로 설정
*   매직넘버 사용 금지 ( 숫자나, 문자열과 같은 리터럴 값을 바로 사용하는 것 피하기, 의미있는 이름을 가진 상수로 대체 )

```java
public static final double PI = 3.14;
```

## 문장 길이

*   한 줄의 최대 길이는 100자 이내로 작성 (넘을경우, 적절한 위치에서 줄바꿈)

```java
@GetMapping("/test")
public String func1 ( 
        @RequestParam("test1") String test,
        @RequestParam("test2") String test2,
        @RequestParam("test3") String test3) {

       //body
       return "[테스트페이지]";
}
```

> 원문: https://gradualprecision.tistory.com/160

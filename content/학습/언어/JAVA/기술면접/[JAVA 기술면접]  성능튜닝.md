---
title: "[JAVA 기술면접]  성능튜닝"
tags: [기술면접, JAVA 관련 기술면접]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA 기술면접]  성능튜닝

## 자바 애플리케이션, JVM 실행과정

JVM 이란?  
- 스택 기반의 가상 머신  
- OS에 구애받지 않고 재사용 가능하게 함  
- 자바 바이트코드를 실행할 수 있는 주체

*   자바 실행과정
    1.  JVM은 OS로부터 프로그램이 필요로하는 메모리를 할당 받음
    2.  javac(자바 컴파일러)가 .java코드를 읽어 .class로 변환시킨다 (.java -> .class)
    3.  Class Loader를 통해 class 파일들을 JVM으로 로딩
    4.  로딩된 class 파일들은 Execution Engine을 통해 해석
    5.  해석된 바이트코드는, Runtime Data Area에 배치됨 (JVM은 필요에따라 실행중간에, 스레드 동기화와 GC 작업을 수행)

클래스 로더란?  
- 자바는 런타임 도중에 로드하고 링크하는 특징이 있다  
- 런타임 도중에 (동적) 로드를 담당하는 부분이 JVM의 클래스로더이다  
( 만약 클래스 못찾으면 , ClassNotFoundException 발생 -> classPath 확인)    
- 클래스 로더에는 로딩/ 링크 / 초기화 단계로 나뉘어져 있다  
  
로딩 : .class 를 method Area에 저장 (클래스 정보, 인터페이스 정보, 변수나 메서드 등의 정보)  
링크 : 클래스가 필요로 하는 메모리 할당 (필드, 메서드, 인터페이스 공간 구조 확보)  
초기화 : static 필드들이 설정된 값으로 초기화 됨

## 자바 메모리 구조

*   Method Area
    *   Class 정보, 전역변수 정보, static 정보 저장
    *   상수 정보가 저장
*   Heap
    *   new 연산자로 생긴 객체
    *   Array와 같은 동적으로 생성된 데이터 저장 공간
    *   GC가 처리하지 않는 한 소멸하지 않음
*   Stack
    *   지역변수, 메서드 매개변수 저장
    *   LIFO 구조
    *   스레드마다 하나씩 존재
*   PC Register
    *   JVM이 실행하고 있는 현재 위치 저장
    *   스레드가 어느 명령어를 처리하고 있는지 주소 등록
*   Native Method Stack
    *   JAVA가 아닌 다른언어(c , c++)로 구성된 메서드를 실행이 필요할 때 사용되는 공간

## GC (Garbage Collection)

*   유효하지 않은 메모리를 정리하는 역할
*   내부적으로 참조되지 않는 객체가 있다면 찾아서 정리하는 역할
*   GC의 종류에 맞춰서 사용하게 된다면 성능에 큰 향상이 존재

GC 종류  
- Serial GC : 하나의 스레드가 메모리 관리를 순차적으로 수행 (느림 )  
- Parallel GC : 여러개의 스레드가 메모리관리 수행 (약간 빨라짐)  
- Concurrent Mark Sweep(CMS) GC : 애플리케이션 스레드와 동시에 진행되서 일시중지 이벤트를 최소화 할 수 있음  
- G1 GC : 여러 영역으로 나누어진 힙을 관리 (cms GC 대체하기 위한 용도)  
- Z GC : 낮은 지연시간과 높은 스케일링을 목표로함

## 문자열 처리

String Vs StringBuffer Vs StringBuilder

*   String
    *   문자열을 저장하는 객체
    *   문자열 자체가 메모리에 박힘 (상수처럼)
    *   문자열 변경을 하면 수정이 되는 것이 아닌 새로운값으로 대체되는 부분 (성능 저하)
*   StringBuilder
    *   문자열을 변경할 수 있는 가변 객체
    *   스레드의 경우 안정성이 높지않아, 싱글스레드 환경에 적합
*   StringBuffer
    *   문자열을  변경할 수 있는 가변 객체
    *   스레드의 안정성이 높아 , 멀티스레드 환경에 적합 (하지만, 스레드의 안정성을 높이느라 성능은 저하됨)

## 불변 객체 

*   불변객체 사용이유
    *   코드의 안정성을 높임
    *   변경할 수 없기에, 데이터 무결성 및 스레드의 안정성이 올라감
*   불변객체 사용 방법
    *   Setter함수 금지
    *   생성자에서만 초기화를 진행하고, 접근을 위해서 Getter함수 생성
    *   final로 필드를 선언하여, 초기화 이후 변경할 수 없도록 사용

```java
public final class Test{

     // 초기화 후 변경할 수 없도록 final 키워드 사용
     private final String const_test;
     
     //생성자 초기화
     public Test(String const_test){
         this.const_test = const_test;
     }
     
     //Getter함수를 이용하여 접근
     public String getConstTest(){
         return const_test;
     }
     
     //새로운 불변 객체 생성
     public Test newTest(String name){
          return new Test(name);
      }
}
```

> 원문: https://gradualprecision.tistory.com/144

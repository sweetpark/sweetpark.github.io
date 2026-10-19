---
title: "[JAVA 기술면접] 예외"
tags: [기술면접, JAVA 관련 기술면접]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA 기술면접] 예외

"자바 예외 처리"를 묻는 기술면접 정리 노트다. 핵심은 Error와 Exception의 구분, 그리고 Exception 안에서도 컴파일 시점에 체크되는 일반예외(Checked, 예: ClassNotFoundException)와 런타임에만 드러나는 런타임예외(Unchecked, 예: NullPointerException)의 차이를 아는 것이다. 여기에 try-catch-finally 처리, catch 블록은 하위 예외 클래스부터 순서대로 잡아야 한다는 점, throws로 예외를 호출부에 떠넘기는 방법, throw로 직접 예외를 발생시키는 방법까지 코드 예제로 정리한다.

## 예외와 예외클래스

*   Error / Exception
    *   Error
        *   에러는 응용프로그램 실행 오류
    *   Exception
        *   **일반예외 ( Check 예외 )**
            *   ClassNotFoundException
            *   InterruptedException
        *   **런타임예외 (UnCheck 예외)**
            *   NullPointerException
            *   ArrayIndexOutOfBoundsException
            *   NumberFormatException

Check 예외 : 컴파일 당시에 오류가 발생  
UnCheck 예외 : 런타임 당시에 오류가 발생 ( 컴파일 단계 이상 없음 )

## 예외 처리 코드

*    예외 처리 문법
    *   try ~ catch ~ finally
*   예외 메시지 출력
    *   .getMessage()
    *   .toString()
    *   .printStackTrace()

```java
try{
        String data;
        data = null;
        int result = data.length(); // NullPointerException 발생
    } catch (NullPointerException e){
        System.out.println(e.getMessage());
        // System.out.println(e.toString());
        // e.printStackTrace();
    }finally{
        System.out.println("마무리 실행");
    }
```

## 예외 클래스 catch 순서

*   상위 예외 클래스 일경우, 제일 마지막에 잡아야함 (우선적으로 잡히는 순으로 catch 됨)

```java
try{
        String data;
        data = null;
        int result = data.length(); // NullPointerException 발생
    } 
    catch (NullPointerException e){
        System.out.println(e.getMessage());
        // System.out.println(e.toString());
        // e.printStackTrace();
    }
    catch (Exception e){
        //... 제일 마지막에 예외로 잡힘 (상위클래스)
    }
    finally{
        System.out.println("마무리 실행");
    }
```

## 예외 떠넘기기

```java
리턴타입 메서드명(매개변수,...) throws 예외클래스1, 예외클래스2, ... {}
```

*   메서드를 호출한 곳으로, 예외를 떠넘김

```java
public void method1(){
    try{
        method2();
    }catch (ClassNotFoundException e){
        //.. 호출됨
    }
}

//예외 떠넘기기
public void method2() throws ClassNotFoundException{
    }
```

## 예외 발생시키기

*   throw new [예외]

```java
public void method() throws RuntimeException{
    try{
        throw new RuntimeException();
    }
    //..
}
```

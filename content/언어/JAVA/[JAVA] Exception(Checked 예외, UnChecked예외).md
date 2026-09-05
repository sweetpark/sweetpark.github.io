---
title: "[JAVA] Exception(Checked 예외, UnChecked예외)"
tags: [프로그래밍 언어, JAVA]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA] Exception(Checked 예외, UnChecked예외)

## 예외 계층

```text
Object
 └── Throwable
       ├── Error                    (시스템 레벨 심각한 오류, 처리 대상 아님)
       │      ex) OutOfMemoryError, StackOverflowError
       │
       └── Exception                (Checked 예외 - RuntimeException 제외 전부)
              ├── IOException
              ├── SQLException
              ├── ...
              │
              └── RuntimeException  (UnChecked 예외)
                     ├── NullPointerException
                     ├── IllegalArgumentException
                     ├── IndexOutOfBoundsException
                     └── ...
```

1. 예외계층은 최상위 계층의 Object 하위에 속한다  
2. Exception과 Error로 나뉘게 되는데, 흔히 말하는 예외는 Exception을 말한다  
3. RuntimeException(하위 자식 포함)은 실행도중에 잡히는 예외이며, 나머지 예외는 컴파일단계에서 예외로 잡히게된다  
(RuntimeException과 하위계층은 UnChecked예외라고 불리며, 나머지 예외는 Checked예외로 불린다)

## 예외처리

*   예외 잡아서 처리하기 
    *   Exception으로 catch할 경우 모든 예외가 다 잡힌다
    *   **계층의 위치에 따라 하위 예외들은 모두 포함되게 된다 (주의 : Exception을 남발할경우, 의도치 않게 모든 예외가 처리될 수 도 있음)**

```java
public void func(){
    
    try{
        logic();
    }catch (Exception e){
         e.printStackTrace();
    }
}
```
```java
public void func() throws Exception{
    logic();
}
```

## Checked 예외

*   Exception을 상속받은 예외는 Checked예외에 속한다
*   Checked예외의 경우 컴파일단계에서 검증되므로, catch하거나 밖으로 던져야한다
    *   **무조건 처리를 해줘야하기에, 예외처리를 놓치지 않는 장점이 있다**

```java
/*
예외 처리
*/

try{
    logic();
}catch(SQLException e){
    e.printStackTrace();
}

/*
예외 던지기
*/
public void func() throws SQLException{
    logic();
}
```

## UnChecked 예외

*   RuntimeException을 상속받은 예외는 UnChecked예외에 속한다
*   런타임(실행도중)에 검증되므로, 예외처리를 따로 하지 않아도 자동으로 예외를 던진다

```java
/*
예외 처리
*/

//필요하면 잡아서 처리할 수 있다
try{
    logic();
}catch(RuntimeException e){
    e.printStackTrace();
}

/*
예외 던지기
*/
//따로 안해줘도 상위로 알아서 던져진다 (throws 생략 가능)
```

## UnChecked 예외 사용하기

```text
[ Checked 예외를 그대로 던질 경우 ]

Controller  --- throws SQLException --->  Service  --- throws SQLException --->  Repository
   (모든 계층에 SQLException을 알고 있어야 함, 즉 throws 명시 필요)


[ UnChecked 예외로 변환해서 던질 경우 ]

Controller  <-----------------------  Service  <-----------------------  Repository
  (throws 선언 불필요)                 (throws 선언 불필요)          catch(SQLException e) {
                                                                        throw new RuntimeException(e);
                                                                    }
```

*   위 그림을 보면, checked예외의 경우 throws를 통해 Controller, Service구간에도 명시를 해줘야한다
    *   단점1) 만약 Checked예외가 바뀌게 된다면,  모든 소스코드에서 수정이 이루어져야하는 번거로움이 존재
    *   단점2) Checked예외의 경우, 런타임도중 수정 불가능하기에 그 즉시 catch하여 처리하는것에 어려움이 존재
*   UnChecked예외로 변경할경우, 이러한 번거로움들과 예외처리를 효율적으로 할 수 있다
    *   Checked예외를 catch하여 잡고, UnChecked 예외로 바꾸어서 전달
    *   **중요!) RuntimeException(e) 의 경우, "e" 부분을 추가해주지 않으면 SQLException이 터진 이유를 알수가 없어짐**

```java
public void func(){
    try{
        logic();
    }catch (SQLException e){
        throw new RuntimeException(e);
    }
}
```

## 예외 stack trace

```java
// 1 (무조건 이걸로 사용)
public void func(){
    try{
        logic();
    }catch (SQLException e){
        throw new RuntimeException(e);
    }
}

// 2
public void func(){
    try{
        logic();
    }catch (SQLException e){
        throw new RuntimeException();
    }
}
```

*   **1번의 경우, SQLException의 예외정보까지 같이 나온다**
*   2번의 경우, SQLException의 예외정보는 날아가고, RuntimeException 부분만 표시된다

> 원문: https://gradualprecision.tistory.com/177

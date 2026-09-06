---
title: "[JAVA 기술면접] 라이브러리 (라이브러리, 모듈)"
tags: [기술면접, JAVA 관련 기술면접]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA 기술면접] 라이브러리 (라이브러리, 모듈)

"자바 라이브러리와 모듈"의 차이를 묻는 기술면접 질문 정리 노트다. 라이브러리는 클래스/인터페이스를 모아 .jar로 배포하고 CLASSPATH로 가져다 쓰는 것인 반면, 모듈은 module-info.java(모듈 기술자)로 exports/requires를 명시해 공개 범위를 통제할 수 있다는 점이 핵심 차이다. 여기에 전이 모듈(requires transitive), 집합 모듈, 그리고 opens로 은닉된 패키지의 리플렉션 접근을 허용하는 방법까지 다룬다.

## 라이브러리

*   클래스와 인터페이스를 모아 둔 것을 라이브러리라고 함
*   대개 .jar파일로서 보관하게 된다
*   CLASSPATH에 지정하여, 해당 라이브러리를 사용하게 된다

import [패키지명].[클래스명];

## 모듈

*   라이브러리 처럼 가져다 사용할 수 있다
*   공개와 은닉이 존재한다
*   module-info.java인 모듈기술자를 정의해야한다

[키워드]  
외부로 노출 : exports  
module 가져다 쓰기 : requires

*   모듈 선언 및 저장

```java
package pack1;
public class B{
    public void method(){
         System.out.println("B");
    }
}

package pack2;
public class A{
    public void method(){
         System.out.println("A");
    }
}

[module-info.java]

module my_module_a{
    exports pack1;
    exports pack2;
}
```

*   모듈 가져다 사용

```java
[module-info.java]
module my_application_2{
     requires my_module_a;
}
```
```java
import pack1.A;
import pack2.B;

public class Main{
    public static void main(String[] args){
        //...
     }
}
```

## 전이 모듈

*   모듈간의 의존관계 설정방법
*   transitive 사용

```java
[module-info.java]
module my_module_a{
    exports pack1;
    requires transitive my_module_b; // 의존 설정 (따로 my_module_b를 require하지 않아도 됨)
}
```

## 집합 모듈

*   모듈들을 집합으로 묶어놓는 역할
*   모듈들을 requires

```java
[module-info.java]
module my_module{
    requires transitive my_module_a;
    requires transitive my_module_b;
}
```

## 리플렉션 허용

*   리플렉션
    *   실행 도중에 타입 (클래스, 인터페이스 등)을 검사하고 구성멤버를 조사하는 것
    *   opens를 통해 은닉된 패키지를 열고 확인할 수 있음

```java
//모듈 전체 허용
open module 모듈명{
}

// 지정된 패키지 리플렉션 허용
module 모듈명{
    opens 패키지1;
    opens 패키지2;
    //..   
}

// 지정된 패키지 특정 모듈
module 모듈명{
    opens 패키지1 to 외부모듈명1, 외부모듈명2...
    opens 패키지2 to 외부모듈명1, 외부모듈명2...
    //...
}
```

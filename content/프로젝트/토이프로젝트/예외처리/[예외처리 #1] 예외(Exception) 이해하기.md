---
title: "[예외처리 #1] 예외(Exception) 이해하기"
tags: [토이프로젝트, 예외처리]
created: 2026-09-05
modified: 2026-09-05
---

# [예외처리 #1] 예외(Exception) 이해하기

## 예외(Exception)가 왜 필요할까?

( 개인적인 경험 )  
'예외'라는 단어는 사전적으로 "일반적인 규칙이나 통례에서 벗어나는 것"을 의미합니다. 개발을 하다 보면 "예외를 처리해야 한다"는 말을 자주 듣게 됩니다. 누구나 처음에는 자신이 생각한 방향대로 코드를 작성하지만, 모든 것이 계획대로만 흘러가지는 않습니다. 처음에는 "100% 문제가 발생하지 않을 것"이라는 막연한 자신감으로 예외 처리를 깊이 고민하지 않았습니다.  
  
하지만, Java에서 기본적으로 제공하는 예외 처리 기능 덕분에 지금까지 큰 불편 없이 개발할 수 있었습니다. 예외가 발생하면 함수 호출 스택과 예외가 발생한 위치, 상세한 예외 정보를 쉽게 확인할 수 있었습니다. 만약 Java가 이런 기능을 제공하지 않았다면, 코드가 어디서, 왜 제대로 동작하지 않는지 찾는 일이 무척이나 어려웠을 것입니다. 다행히 발전된 기술 덕분에, 우리는 이러한 비극을 겪지 않아도 됩니다. 그래서인지 초반에는 예외 처리가 얼마나 중요한지 크게 와닿지 않았던 것 같습니다..  
  
최근 프로젝트를 진행하면서, API 응답 값을 공통된 형식으로 반환해야 하는 요구사항이 있었습니다. 오류가 발생했을 때도 동일한 형식으로 오류 메시지를 전달해야 했기 때문에, 예외 처리에 대해 더욱 깊이 고민하게 되었습니다. 예외를 통해 우리는 다음과 같은 이점을 얻을 수 있습니다.

*   정리
    *   오류가 발생한 지점을 정확히 파악할 수 있다.
    *   오류에 대한 정보를 알 수 있다.
    *   예외가 발생하기까지의 코드 흐름을 파악 할 수 있다.
    *   정해진 규격을 통해 일관성 있는 예외처리 구현이 가능해진다.

## 예외(Exception) 는 어떤식으로 처리되는가?

예외는 여러 가지 이유로 발생하게되는데,  
  
예를 들어:  
- 잘못된 값이 입력되었을 때  
- 범위를 초과한 값이 들어올 때  
- 잘못된 메모리 접근이 발생할 때  
- null 값을 참조할 때  
  
이러한 상황에서 예외가 발생하며, 이를 처리하는 방법은 크게 두 가지로 나눌 수 있습니다.  
  
 첫번째, 예외 잡아서 처리하기  
프로그램이 실행되는 동안 예외가 발생할 수 있으며, 이를 "잡아서 처리"할 수 있습니다. 즉, 예외가 발생하는 즉시 특정한 방식으로 대응하는 것입니다.  
예를 들어, 어떤 메서드에서 0으로 나눌 수 없는 연산이 발생했을 경우, 이를 try-catch 블록을 이용해 처리할 수 있습니다.  
  
 두번째, 예외 던지기  
때로는 예외를 즉시 처리하는 대신, 호출한 메서드로 예외를 넘겨야 할 수도 있습니다. Java에서는 throws 키워드를 사용하여 예외를 호출한 곳으로 던질 수 있습니다.  
예를 들어, 비즈니스 로직상 특정 조건에서 예외를 발생시키고 싶을 때 사용할 수 있습니다.

## 예외의 종류

예외에 대해서 아는것만 토대로 말하자면, RuntimeException, IllegalArgumentException, NullPointerException, ClassNotFoundException, InterruptedException 등등... 많은 예외들이 존재하고 이것들을 전부다 외우는 건 불가능에 가깝다고 생각이 든다.. (글쓴이 기준..)  
  
Java에서는 다양한 예외가 존재하며, 모든 예외를 전부 외우는 것은 사실상 불가능하다. 하지만 예외를 분류별로 이해하고 있으면, 필요할 때 적절하게 활용할 수 있다. 이에 따라 예외를 정리해보고자 한다.  
  
**1. Checked Exception (체크 예외)**  
  
체크 예외는 컴파일 단계에서 반드시 처리해야 하는 예외이다. 즉, 개발자가 명시적으로 예외 처리를 하지 않으면 컴파일 자체가 불가능하다. 주로 외부 시스템과의 연결(파일 입출력, 네트워크 통신, 데이터베이스 연결 등)에서 발생할 가능성이 높은 예외들이 포함된다.  
  
대표적인 체크 예외:  
- IOException  
- SQLException  
- ClassNotFoundException  
- InterruptedException  
  
체크 예외의 장점은 개발자가 예외를 강제로 처리하게 함으로써, 예외 발생 시 적절한 대처를 할 가능성을 높여준다는 것이다. 하지만 반대로, 불필요하게 예외 처리를 강제하다 보면 코드가 복잡해질 수 있고, 예외 처리가 오히려 부담이 될 수도 있다.  
  
**2. Unchecked Exception (언체크 예외)**  
언체크 예외는 컴파일러가 예외 처리를 강제하지 않는 예외이다. 주로 프로그램 실행 중에 발생하며, 런타임 환경에서 확인되는 예외들이다.  
  
대표적인 언체크 예외:  
- NullPointerException  
- IllegalArgumentException  
- ArrayIndexOutOfBoundsException  
- ArithmeticException  
  
언체크 예외는 주로 프로그래밍 실수에서 비롯되며, 개발자가 직접 방지하는 것이 중요하다. 예를 들어, NullPointerException은 객체가 null인지 확인하는 등의 방어적인 코드를 작성함으로써 예방할 수 있다.  
  
**3. Checked 예외 vs Unchecked 예외**  
처음에는 체크 예외가 모든 예외를 개발자가 직접 처리하게 강제하므로, 안정성을 높여줄 것처럼 보인다. 하지만 실제 개발에서는 불필요한 예외 처리가 코드의 복잡도를 증가시키는 문제가 발생할 수 있다.  
  
예를 들어, 간단한 로그만 남기면 되는 예외라도 반드시 try-catch를 사용해야 하고, 호출하는 모든 메서드에서 throws를 선언해야 하는 등의 번거로움이 생길 수 있다. 반면, 언체크 예외는 반드시 예외 처리를 강제하지 않기 때문에, 필요할 때만 예외를 잡고 처리하면 된다.  
  
**4. 예외 처리 전략**  
예상 가능한 예외(예: 네트워크 오류, 파일 접근 오류 등) → 체크 예외로 처리 프로그래밍 실수로 발생하는 예외(예: NullPointerException, IndexOutOfBoundsException) → 언체크 예외로 두고, 방어적인 코드 작성  
  
결론적으로, 체크 예외와 언체크 예외를 적절히 구분해서 사용하는 것이 중요하다. 불필요한 예외 처리는 피하면서도, 필요한 경우 적절하게 예외를 다루는 것이 유지보수성과 안정성을 높이는 데 도움이 된다.

## 예외 상속 관계

```text
Throwable
├── Error (시스템 레벨 오류, 복구 불가능)
└── Exception
    ├── Checked Exception (Exception 직접 상속)
    │   ├── IOException
    │   ├── SQLException
    │   ├── ClassNotFoundException
    │   └── InterruptedException
    └── RuntimeException (Unchecked Exception)
        ├── NullPointerException
        ├── IllegalArgumentException
        ├── ArrayIndexOutOfBoundsException
        └── ArithmeticException
```

Java의 예외는 Exception 클래스를 기반으로 두 가지 유형, Checked Exception과 Unchecked Exception으로 나뉜다.  
  
**Checked Exception은 Exception 클래스를 직접 상속받은 예외로, 반드시 예외 처리를 해야 한다.**  
예외 처리를 하지 않으면 컴파일 오류가 발생하며, try-catch 또는 throws를 사용하여 처리해야 한다. 체크 예외를 커스텀하려면 Exception을 상속받아 새로운 예외 클래스를 만들면 된다.  
대표적인 예: IOException, SQLException, ClassNotFoundException 등.  
  
**Unchecked Exception은 RuntimeException 클래스를 상속받은 예외로, 컴파일러가 예외 처리를 강제하지 않는다.**  
프로그램이 실행되는 동안 발생할 수 있으며, 예외 처리를 하지 않더라도 실행이 가능하다. 약간 느슨한 예외 처리 방식이며, 런타임 중 발생하는 예외를 의미한다. 커스텀 Unchecked Exception을 만들려면 RuntimeException을 상속받으면 된다.  
대표적인 예: NullPointerException, IllegalArgumentException, IndexOutOfBoundsException 등.

## 예외 처리 코드

```java
// 1. try~catch 처리
try{
	// body
}catch(Exception e){
 	e.printStackTrace();
}

// 2. 예외 던지기
public void method() throws RuntimeException{
	throw new RuntimeException("Exception 발생!");
}

// 3. 예외 만들기
public class CustomException extends Exception{
	//CheckedException
}

public class CustomException extends RuntimeException{
	//UnCheckedException
}
```

*   java 1.7 이상부터는 try~catch 문 대신해서 , try~with~resources가 사용되는 추세이다
    *   catch를 잡게되면 프로그램이 종료되거나, 메서드가 로직 중간에 끝나기 때문에, I/O나 소켓등 로직 중간에 닫아주지 않으면 남게되는 리소스들을 정리할 수 있도록 도와주는 기능이다.
    *   (원래는 try~catch~finally 를 이용했지만, resources 도입으로 편하게 정리할 수 있게 되었다.)

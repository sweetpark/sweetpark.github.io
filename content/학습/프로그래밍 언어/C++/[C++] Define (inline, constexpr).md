---
title: Define (inline, constexpr)
tags: [C++, define, inline, constexpr]
created: 2026-09-05
modified: 2026-09-05
---

# Define (inline, constexpr)

Define ( + inline , constexpr)

## Define

#DEFINE [변수명] (기능)  
- 변수명 : 왠만하면 대문자로 표기 ( ex) #define TEST_COUNT 0 )  
- 기능 : 해당 부분은 상수값을 표현한다기 보다는 기능을 랩핑하는쪽에 가까움  
( ex) #define TEST_FUNC std::cout << " Test 입니다 "  << std::endl;

#### 1. 상수 정의기

*   const를 사용하듯, 상수를 전처리 단계에서 설정함 ( 매크로를 이용하여 )

#define MAX_SIZE 100

#### 2. 함수 형태의 매크로  

*   함수형태의 매크로를 사용시에 괄호 ( "()" )를 사용하지 않아도 되나, 안정성을 높이기 위해 사용한다
*   c++11이상의 경우 상수표현은 constexpr , 함수 표현은 inline으로 대체 가능

#define MAX(a,b)  ( (a) > (b) ? (a) : (b) )

#### 3. 조건적인 매크로

*   define은 전처리기 지시자로, 컴파일 이전에 코드의 특정 부분을 다른 내용으로 대체 (-> 조건적으로 구성 가능)
*   조건적인 매크로 종류 : #ifdef, #ifndef ~ #endif  
    
    *   #ifdef MAX 일 경우 , MAX가 매크로로 정의되어있으면 참(#ifdef ~ #endif 구간 실행) 아니면  해당 부분 건너뜀
    *   #ifndef MAX 일경우 , MAX가 매크로로 정의되어있으면 건너뛰고, 아니면 (#ifndef ~ #endif) 해당부분 실행

```cpp
// header.h 파일 내용

#ifndef HEADER_H  // 만약 HEADER_H 매크로가 정의되지 않았다면 아래 코드 실행
#define HEADER_H  // HEADER_H 매크로를 정의함 (이를 통해 중복 포함 방지)

// 여기에 헤더 파일의 내용을 작성합니다

#endif  // ifndef 종료
```

*   #if , #elif, #else , #endif  
    *   조건식을 이용하여 해당부분 사용할지 말지 여부
    *   #if 조건식 ~ #endif ( #elif, #else를 추가하여 사용해도 됨

```cpp
#define VALUE 100

#if VALUE > 50
    // VALUE가 50보다 크면 이 부분의 코드가 컴파일됨
#endif
```

## C++11이후 Define 대체제

*   Constexpr
*   Inline

| 구분 | 장점 | 단점 |
| --- | --- | --- |
| Define | 간결하다 | 가독성이 떨어진다 |
| Define | 컴파일시 대체된다 | 부작용의 가능성이 있다 (단순한 텍스트 대체로 작동하기 때문에 기능상 오류가 있을 수 있다) |
| Define | 조건부 컴파일이 가능하다 | 타입 안정성이 떨어진다 (타입을 따로 체크하지 않기 때문에) |
| Inline | 함수호출을 부르지 않고 실행할 수 있다 | 컴파일시 추가되기에, 사용 크기에 따라 메모리 사용에 영향을 미칠 수 있음 |
| Inline | 함수의 복사본이 호출지점에 삽입되므로, 컴파일러는 최적화를 할 수 있다 | 인라인 함수의 최적화는 컴파일러마다 다르다 |
| Constexpr | 컴파일 시간에 평가 (런타임 x) | 상수표현식으로 나타낼수 있어야 사용이 가능 |
| Constexpr | 상수 표현식 및 상수를 나타내기에 유용 | 일부 복잡한 함수 코드 구현 어려움 |
| Constexpr |  | 인자값도 컴파일시 정의가 내려져야 constexpr로 사용될 수 있다 (아닐경우, 일반함수처럼 호출된다) |

## 실습 구현 (+ Define , Inline, Constexpr )

```cpp
#include <iostream>
using namespace std;

#define MAX(a,b) ( (a) > (b) ? (a) : (b) )
inline int inline_max(int a, int b) { return (a > b) ? a : b; }

constexpr int expr_max(int a, int b) { return (a > b) ? a : b; }

int main()
{
	// [ Define ] 
    
    int num1 = 10;
    int num2 = 20;

    int result = MAX(num1, num2);
	std::cout << result << std::endl; // result : 20

    
    
    // [ Inline ] 
    
    int result2 = inline_max(num1, num2);
    /*
    max 부분이 { return (a>b) ? a : b; } 로 대체됨
    */
    std::cout << result2 << std::endl;
	
    
    
    
    // [Constexpr]
    
    //int num ~ 으로 작성할경우 런타임에서 인자값이 결정되므로 constexpr로 선언해야한다.
    // constexpr을 선언하면 컴파일 하는 시점에 값이 결정된다.
    constexpr int num3 = 5;
    constexpr int num4 = 10;
	//반환값의 경우 런타임시에 결정되어도 상관없다
    // expr_max(num3, num4) 가 상수처럼 사용된다
    int result3 = expr_max(num3, num4);

    std::cout << result3 << std::endl;

    

    return 0;
}
```

> 원문: https://gradualprecision.tistory.com/28

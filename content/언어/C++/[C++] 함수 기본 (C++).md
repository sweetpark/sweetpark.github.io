---
title: "함수 기본 (C++)"
tags: [C++, 함수]
created: 2026-09-05
modified: 2026-09-05
---

# 함수 기본 (C++)

1. 함수 형식                      
2. 함수 오버로딩               
3. 함수 호출 스택

## 함수 형식

[반환값] [함수이름] ( [ 인자값 ], ... )    
{  
      
    [ 함수 몸체 ]      
      
    return [반환값];  
  
}

*   반환값 : int, double, string, 클래스 등.. , 함수의 계산 결과에 따른 결과값 반환
*   함수이름 : 함수의 이름 ( 같은 함수를 재정의 하려면, 오버라이딩 혹은 오버로딩을 해야함 )
    *   오버로딩 : 서로다른 인자를 가진 같은 이름을 가진 함수
    *   오버라이딩 : 상위 클래스 존재하며, 해당 클래스의 함수를 재정의 ( 함수이름, 인자 동일 -> 함수 본체 내용만 다름 )
*   인자값 : int, double, string, 클래스, 포인터, 참조 등.. , 함수 본체에서 사용될 값을 호출을 받은 부분에서 값을 받는 역할

## 함수 오버로딩

*   함수 이름이 같아야한다. 
*   인자 개수가 달라야한다. ( 만약 같을경우, 자료형이 달라야함 )
*   + 반환값 형태의 경우 영향 없음 (같아도 되고, 달라도 됨)

```cpp
// 1. Test (int, int) 함수 기준
int Test(int number1, int number2)
{
    number1 = 5;
    number2 = -5;

    return number1 + number2;
}

// 2. int -> double 자료형 변환
double Test(double number1, int number2)
{
    number1 = 2;
    number2 = 2;
    return number1 + number2;

}

// 3. 인자의 순서가 다름 ( <double,int> -> <int, double> )
double Test(int number1, double number2)
{
    number1 = 4;
    number2 = 4;
    return number1 + number2;

}

// 안되는 경우
// 1. 자료형으로 나뉘므로 참조값은 관계없다.
/*
int Test(int& number1, int& number2)
{
    number1 = 5;
    number2 = -5;

    return number1 + number2;
}
*/

//2. 반환값의 경우 오버로딩과는 무관하다
/*
double Test(int number1, int number2)
{
    number1 = 5;
    number2 = -5;

    return number1 + number2;
}
*/
```

## 함수 호출 스택

*   Stack 메모리의 경우, 함수 호출과 관련된 지역변수와 매개변수가 저장되는 영역
*   LIFO(Last In First Out) 구조를 가짐

| 메모리 주소 | 영역 | 구조 | 내용 |
| --- | --- | --- | --- |
| 높은 주소 | RAM | 스택영역 | 컴파일시(기계어 코드로 변환)에 크기가 결정됨- 함수와 관련된 지역변수, 매개변수 저장되는 영역( main() 함수도 포함됨 ) |
| ~ | RAM | 힙영역 | 런타임시(프로그램 구동시) 크기가 결정됨 |
| ~ | RAM | BSS | 초기화 하지 않은 변수 |
| ~ | RAM | Data | 초기화되어있는 변수 |
| ~ | ROM | 데이터영역 | 전역변수, 정적변수(static) |
| 낮은 주소 | ROM | 코드영역 ( = 텍스트 영역) | 실행할 프로그램의 코드 내용 |

*   LIFO 구조에 따라,  마지막에 불린 Func3 -> Func2 -> Func1 순으로 스택에서 제거됨
*   Func3(){}의 result 지역변수의 경우 해당 {} ("중괄호") 내부에서만 사용가능한 변수
    *   (함수스택이 제거될경우 해당 지역변수도 사라짐)

```cpp
#include <iostream>
using namespace std;

void Func3()
{
	int result = 10; // 해당 result라는 변수는 Func3() {}안에서만 유효함

    cout << "F3" << endl;
    cout << "Finish" << endl;
}

void Func2()
{
    cout << "F2" << endl;
    Func3();

}
void Func1()
{

    cout << "F1" << endl;
    Func2();
}

int main()
{
	Func1();
    
    return 0;
}
```

```text
[ 스택 쌓이는 순서 (호출) ]      [ 스택 제거 순서 (LIFO) ]
   main()                          Func3()  -> 제거
     └ Func1()                     Func2()  -> 제거
         └ Func2()                 Func1()  -> 제거
             └ Func3()             main()   -> 제거

높은 주소 ┌─────────┐
         │ Func3() │  result = 10
         ├─────────┤
         │ Func2() │
         ├─────────┤
         │ Func1() │
         ├─────────┤
         │ main()  │
낮은 주소 └─────────┘
```

함수 호출 스택

## 함수 스택 오버플로우

*   스택의 크기의 경우, 한계가 있기에 너무 많은 함수가 호출되고, 제거되지 않는다면 오버플로우가 발생함
*   전형적으로, 재귀함수의 경우 오버플로우가 빈번하게 발생할 수 있음

```cpp
#include <iostream>
using namespace std;

int Factorial(int num)
{
    if (num < 1)
        return 1;

    return num * Factorial(num-1);
}

int main()
{
    Factorial(1000); // 스택 오버플로우 발생
    return 0;
}
```

```text
[ 재귀 호출로 계속 쌓이는 스택 프레임 ]

높은 주소 ┌───────────────────┐
         │ Factorial(1000)   │
         ├───────────────────┤
         │ Factorial(999)    │
         ├───────────────────┤
         │        ...        │  <- 재귀 호출마다 스택 프레임 추가
         ├───────────────────┤
         │ Factorial(2)      │
         ├───────────────────┤
         │ Factorial(1)      │
         ├───────────────────┤
         │ main()            │
낮은 주소 └───────────────────┘
             ↑
     스택 한계 초과 시 Stack Overflow 발생 (프로세스 비정상 종료)
```

스택 오버플로우

*   호출 깊이가 스택 크기 한계를 넘으면, 더 이상 쌓을 공간이 없어 프로그램이 강제 종료(크래시)됨

> 원문: https://gradualprecision.tistory.com/30

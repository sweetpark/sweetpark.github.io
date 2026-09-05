---
title: "연산 (산술, 사칙, 증감, 비교, 논리)"
tags: [C++, 연산자]
created: 2026-09-05
modified: 2026-09-05
---

# 연산 (산술, 사칙, 증감, 비교, 논리)

대입연산, 사칙연산, 증감연산, 비교연산, 논리연산

## 대입연산

*   오른값을 왼값으로 넣어주는 과정

```cpp
int main(void)
{
	int a = 2;
    // 왼값 : a ,  오른값 : b
}
```

## 사칙연산

*   덧셈 , 뺄셈, 곱셈, 나눗셈 (몫), 나머지

```cpp
int main(void)
{
	int a = 1;
    int b= 2;
    
	a = b + 3; // result : 5
    a = b - 3; // result : -1
    a = b * 3; // result : 6
    a = b / 3; // result : 0 (* a가 int 값이므로 소수점이 나오지 않는다.)
    a = b % 3 // result : 2 (* a가 나누는값보다 작으므로 2가 나온다 (3보다 크지 않는 수는 그대로 출력) )
}
```

## 증감연산

*   ++ , -- 를 이용하여 빠르게 해당 값에 1을 더해주는 역할

```cpp
int main(void)
{
	int a = 1;
    
    a = a + 1; // 이와 동일한 표현
    a++;
    ++a;
    
   	a = a - 1; // 이와 동일한 표현
    a--;
    --a;
    
    
    //전위 증가와 후위증가 중요포인트
    // 전위 증가 연산자
    /*
    Counter& operator++() {
        ++value;
        return *this;
    }
    */

    // 후위 증가 연산자
    /*
    Counter operator++(int) {
        Counter temp = *this;
        ++value;
        return temp;
    }
    */
    
}
```

*   주의)
    *   ++a와 a++은 같은 것으로 보이지만, 해당 순서가 다름
    *   ++a  (전위연산자)
        *    a값의 1을 더한채로 반환
    *   a++ (후위연산자)
        *   a값의 1을 더하지 않은채로 반환 후, a값에 1을 더함
        *   추가적으로, a값을 temp에 저장하는 구조가 있다보니, 메모리 사용에 있어서 약간의 손해가 존재함

## 비교연산

*    >, < , <=, >= , ==

```cpp
#include <iostream>
using namespace std;

// 1 : true , 0 : false

int main()
{
    int a = 1;
    int b = 1;

    //비교연산
    bool equal = (a == b); // result :  1
    bool n_equal = (a != b); // result : 0
    a = 2; 
    bool LB_num = (a > b); // result : 1
    bool RB_num = (a < b); // result : 0
    bool LB_Eq_num = (a >= b); // result : 1
    bool RB_Eq_num = (a <= b); // result : 0
    
 }
```

## 논리연산

*   부정, and , or

```cpp
int main (void){
 
 // 부정, and (둘 다 true 일치) , or (둘 중 하나 true)
    a = true;
    b = false;
    if (!a) // a가 true -> !a 는 false
    {
        cout << "True" << endl; // if문 실행되지 않음
    }

    bool and_test = (a && b); // result : 0
    bool or_test = (a || b); // result : 1
    

}
```

> 원문: https://gradualprecision.tistory.com/23

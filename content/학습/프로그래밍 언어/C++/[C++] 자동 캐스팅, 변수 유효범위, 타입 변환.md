---
title: 자동 캐스팅, 변수 유효범위, 타입 변환
tags: [C++, 캐스팅, 변수유효범위]
created: 2026-09-05
modified: 2026-09-05
---

# 자동 캐스팅, 변수 유효범위, 타입 변환

자동 캐스팅(타입변환), 변수 생존 범위

## 자동 캐스팅

*   int 와 float/double이 계산 될 경우, 더 큰 데이터 자료형으로 자동 캐스팅 된다.
*   하지만, 컴파일에게 자동으로 맡기는 것이아닌, 직접 추가해줄 수 있는 방법이 있다.

```cpp
int main(void)
{
	int a = 1;
    float b = 2.2f;
    int result;
    
    
    result = a + b; // a가 1.0 으로 자동 캐스팅됨
    
    result = (float)a + b; // 직접 (float)을 통해 캐스팅해줄 수 있다
    
}
```

*   자동 캐스팅의 경우 의도치 않은 결과값이 나올 수 있기에, 캐스팅 해주는 것이 바람직하다 (* 의도치 않은 코드는 버그를 일으킴)

## 변수 생존 범위

*   중괄호 (for문, 함수(main(), 일반함수() .. ), 그냥 중괄호 ... )
    *   해당 중괄호 안에서 선언된 경우, 해당 중괄호 안에서만 유효하다
    *   for (int i =0; i < 10; ++i) {} => 이후 과정에서는 int i 는 존재하지 않는다.
*   지역변수
    *   해당 지역에 한해, 변수 생존이 가능함 (중괄호와 연관된 의미)
*   전역변수
    *   프로그램이 실행하는 동안에는 계속해서 유효하다
*   정적 지역 변수
    *   함수 내에서 static 으로 선언된 변수로, 해당 함수가 호출할 때 초기화 되고, 함수가 끝나도 변수가 유지된다.
*   클래스 멤버변수
    *   클래스 인스턴스가 유효할 때까지 존재

```cpp
#include <iostream>

int global_ = 10; // 프로그램 종료시까지 유지

void Test()
{
	int b = 10;
} // b 소멸

voit staticTest()
{
	static int num = 10; // 함수 호출시 생성
} // num 유지

class Myclass
{

public:
	int memberValue = 10;

};

int main()
{
	Test();
    staticTest();
    
    for (int i =0; i < 10; ++i)
    { ... } // i 소멸
    
    
    Myclass *instance = new Myclass();
    
    ...
    
    delete instance; // memberValue 소멸
    
    
    //static -> num 과 global_ 제외 소멸
    
	

}
```

> 원문: https://gradualprecision.tistory.com/26

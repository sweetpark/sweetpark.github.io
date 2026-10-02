---
title: "함수포인터 (C++)"
tags: [C++, 함수포인터]
created: 2026-09-05
modified: 2026-09-05
---

# 함수포인터 (C++)

이 노트는 C++ 함수 포인터의 선언 형식과 `typedef`를 이용한 표기, 그리고 특징(함수 이름이 곧 주소, 전역/정적 함수만 가리킬 수 있음, 반환형·인자가 정확히 일치해야 함, 상태를 저장할 수 없음)을 정리한다. 반환형과 인자가 같은 함수들 사이에서는 함수 포인터를 바꿔치기해 동작을 유연하게 교체할 수 있다는 활용법과, 멤버 함수를 가리키려면 `&`와 클래스 범위 지정이 필요하다는 점도 예제로 보여준다.

1. 함수포인터 형태  
2. 함수포인터 특징  
3. 함수포인터와 멤버변수

## 함수 포인터 형태

[반환TYPE] (*[함수포인터이름]) ([인자],..)  
ex)  
int (*intPtr) (int num1,int num2);

```cpp
typedef int(FUNC_)(int, int);
typedef int(*FUNC_PTR)(int, int);

int Add(int a, int b)
{
	return a + b;
}

int main()
{
    FUNC_* a = Add;
    cout << a(1, 2) << endl;

    FUNC_PTR b = Add;
    cout << b(1, 2) << endl;
    
}
```

*   Typedef 연관
    *   일반적인 typedef
        *   typedef int INT; // int를 INT로 사용하겠다 
    *   typedef int (FUNC) (int num1, int num2);
        *   FUNC : int의 반환타입을 가지고, 인자 num1, num2를 가지는 함수
    *   typedef int (*FUNC_PTR) (int num1, int num2);
        *   FUNC_PTR : int의 반환타입을 가지고, 인자 num1, num2를 가지는 포인터 함수  
*   **일반적인 함수포인터 (주로 사용됨)**
    *   typedef를 사용하지 않고 바로 사용

int main()  
{  
     int (*fn)(int ,int);  
     fn = Add;  
     fn();  
}

## 함수 포인터 특징

*   함수의 이름은 함수의 주소를 나타낸다
    *   int ADD(int,int) 에서 "ADD"는 함수의 이름이면서, 주소를 가리킴
    *   FUNC_PTR b = ADD 와 FUNC_PTR b= &ADD 는 동일한 표현
    *   ADD 와 (*ADD) 는 동일하게 함수 주소를 가리킴
*   전역 함수 및 정적함수만 가능하다
    *   전역함수 : 함수 외부에 정의되어있는 함수
    *   정적함수 : static으로 사용되는 함수
        *   객체와 무관하게 독립적으로 작동하는 멤버함수
*   함수 포인터의 반환타입, 인자 개수와 타입형태는 동일해야함
    *   서로 다른 타입들
        *   int (*FUNC)(int ,int)
        *   double (*FUNC)(int, int)
        *   int (*FUNC)(double, int)
        *   int (*FUNC) (int, int ,int)
*   상태를 저장할 수 없다
    *   함수의 포인터는 단지 함수의 주소를 가지는 역할 
    *   클래스처럼 멤버변수가 없어서, 인자값으로만 작성
    *    함수 객체의 필요성

## 함수 포인터 사용

*   함수 포인터는 가리키는 주소이므로, 코드 수정시 용이하다

```cpp
typedef int(*FUNC_PTR)(int, int);

int Add(int a, int b)
{
	return a + b;
}

int Sub(int a, int b)
{
	return a - b;
}

int main()
{
    // Add와 Sub을 자유자재로 변경할 수 있다 (반환, 인자타입 및 개수가 동일하므로)
    //FUNC_* a = Add;
    FUNC_* a = Sub;
    
    cout << a(1, 2) << endl;
    
    int result = a(1,2);

}
```

## 함수 포인터와 멤버함수

*   기본적으로 함수포인터는 정적함수 및 전역함수만 가능하지만, 멤버함수도 가능하게 할 수 있다.
    *   정적함수
        *   static을 사용하여 멤버함수를 생성 ( 인스턴스가 생성되지 않아도 사용할 수 있다.)
        *   멤버함수를 포인터에 초기화 해줄때, "&"연산자가 필수로 들어가야한다.
    *   멤버함수
        *   인스턴스 생성 후에 함수포인터를 사용할 수 있다.
        *   멤버함수를 포인터에 초기화 해줄때, "&"연산자가 필수로 들어가야한다.
*   예시

```cpp
typedef void(*FUNC)();
typedef void(Base::*MEMFUNC)();

class Base
{
public:
	static void Print()
	{ 
		cout << "Print()" << endl;
	 }
	void GetHp()
	{
		cout << _hp << endl;
	}

public:
	int _hp = 10;

};

int main()
{
    FUNC a = &Base::Print; // static함수 함수포인터
    a();
   
    
    MEMFUNC mfn;
    
    mfn = &Base::GetHp; //멤버 함수의 경우 "&" 주소연산자를 필수로 붙여야한다
    
    Base b1; // 인스턴스 생성
    
    (b1.*mfn)(); // b1.mfn이라 할 경우, 컴파일러입장에서는 멤버변수인지 멤버함수포인터인지 알 수없으므로
    // "*"를 이용하여 함수포인터라는 힌트를 줘야한다

}
```

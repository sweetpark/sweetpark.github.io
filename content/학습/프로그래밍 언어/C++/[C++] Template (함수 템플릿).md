---
title: Template (함수 템플릿)
tags: [C++, 템플릿, 함수템플릿]
created: 2026-09-05
modified: 2026-09-05
---

# Template (함수 템플릿)

1. 함수 템플릿 형태     
2. 함수 템플릿 특징     
3. 함수 템플릿 특수화

## 함수 템플릿 형태

```cpp
//template<typename T>
template<class T>
void Print(T a)
{
	cout << a << endl;
}

int main()
{
	// 여러 타입을 받을 수 있다 (함수 템플릿)
	Print(50);
	Print<int>(50.f); //명시적으로도 가능
	Print(50.f);
	Print(50.0);
	Print("Hello");
}
```

*   템플릿이 사용되는 함수 위에 template 정의
*   template<class [템플릿타입이름]>  또는 template<typename [템플릿타입이름]>
*   다양한 타입을 받을 수 있는 형태
    *   template<typename A, typename B, typename C>
    *   서로다른 A,B,C 타입 3개를 받을 수 있다

```cpp
template<class T, class A, class B>
void Print(T t, A a, B b)
{
	cout << t << endl;
	cout << a << endl;
	cout << b << endl;
	
}

int main()
{
	// 여러 타입을 받을 수 있다 (함수 템플릿)
	Print(50,"Hello",12.3);
	Print<int, double, float>(3.f, 50, 50.f); //명시적으로도 가능
	
}
```

## 함수 템플릿 특징

*   장점
    *   코드 재사용성이 높다
    *   타입 안정성
    *   유연하게 코드 작성 가능
*   단점
    *   복잡성 증가
    *   가독성 문제
    *   컴파일 시간 증가

## 함수 템플릿 특수화

*   템플릿은 어느 타입이든 받을 수 있으므로, 정의되어있는 함수 및 클래스를 이용하게 된다.
*   이럴때 원하는 인자 타입이 들어올때는 다른 함수를 호출하게 하기 위해서 템플릿 특수화 기능 사용

```cpp
class Knight
{
public:
	int _hp = 15;

};

template<typename T>
void Print(T a)
{
	cout << a << endl;
}

// 템플릿 특수화 (Knight 인자가 들어오면 밑에 구현된 Print가 호출됨)
template<>
void Print(Knight a)
{
	cout << "Knight!!!!" << endl;
	cout << a._hp << endl;

}

int main()
{
	Knight k1;	
	Print(k1);
	return 0;
}
```

> 원문: https://gradualprecision.tistory.com/48

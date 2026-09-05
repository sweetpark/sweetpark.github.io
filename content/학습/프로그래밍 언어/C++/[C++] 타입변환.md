---
title: 타입변환
tags: [C++, 타입변환]
created: 2026-09-05
modified: 2026-09-05
---

# 타입변환

1. 일반적인 값& 참조타입 변환  
2. 업캐스팅 & 다운캐스팅         
3. 암시적 변환 & 명시적 변환    
4. 아무 관계없는 클래스 사이의 변환  
5. 상속관계의 클래스 타입 변환

## 일반적인 값& 참조타입 변환

*   값 타입 변환
    *   원본 객체와 다른 비트열 재구성

int a = 1234567;  
float b = (float)a; // 비트열 재구성 -> 값의 오류가 생길 수 있음

*   참조 타입 변환
    *   비트열 재구성 x , 관점만 변환

int a = 1234567;  
float b = (float&)a; // a의 주소값을 float으로 이해하겠다라는 의미 (값의 변형이 존재)  
// float b = *(float*)&a; // 동일한 표현

## 업캐스팅 & 다운캐스팅

*   업캐스팅
    *   작은 것 -> 큰 것으로 변경
    *   더 많은 범위를 표현할 수 있는 타입으로 변경하기에 문제가 되지 않는다

int a = 1234567; // int = 4바이트  
__int64 b = a; // __int64 = 8바이트  
doublc c = a; // double = 8바이트

*   다운캐스팅
    *   큰 것 -> 작은 것으로 변경
    *   값의 범위를 초과하므로 제대로된 값을 표현하지 못할 수 있다.

int a = 12345678;  
short b = a; // short = 1바이트

## 암시적 변환 & 명시적 변환

*   암시적 변환
    *   컴파일러가 알아서 캐스팅해주는 변환

*   명시적 변환
    *   프로그래머의 의도에 따라 캐스팅해주는 변환

## 아무 관계없는 클래스 사이의 변환

```cpp
class Knight
{
public:
	int _hp;
	int _attack;
};

class Dog
{
public:
	Dog()
	{

	}
	Dog(const Knight& knight)
	{
		_hp = knight._hp;
	}

	operator Knight()
	{
		return (Knight)(*this);
	}
public:

	int listen;
	int _hp;
	int _mp;
};
```

*   타입 변환 생성자  
    *   Dog(const Knight& knight)
        *   타입변환 생성자를 이용하여 Dog를 생성할 수 있도록 명시
*   타입 변환 연산자
    *   operator Knight()
        *   타입변환 연산자를 이용하여 return 값으로 Knight로 명시적 캐스팅하여 전달

```cpp
{
	Knight knight;
	Dog dog(knight); // 타입변환 생성자
	//Dog dog = knight; // 타입변환 생성자 또다른 선언

	Knight knight2 = dog; // 타입변환 연산자

}

// [2] 연관없는 클래스 사이의 참조 타입 변환 (주소이므로, 명시적으로 하면 일단은 통과는 한다)
{
	Knight knight;
	Dog& dog = (Dog&)knight;
	dog.listen = 2; // 이상한 메모리를 건들게 된다
}
```

## 상속관계의 클래스 타입 변환

```cpp
class Dog
{
public:
	Dog()
	{

	}
	
public:

	int listen;
	int _hp;
	int _mp;
};

class BullDog : public Dog
{
public:
	bool _french;
};
```

*   각 클래스가 가지고 있는 메모리 크기

| BullDog | listen , _hp, _mp , _french |
| --- | --- |
| Dog | listen, _hp, _mp |

*   *   상속관계 클래스의 값 타입 변환
        *   부모 -> 자식 
            *   BullDog bulldog = (BullDog)dog; //캐스팅 불가
            *   개는 불독이다 ( 개는 불독일수도 있고 , 아닐수도 있기에)
            *   Dog에는 _french라는 변수가 없으므로 1:1 대응이 되지 않아 암시적/명시적 캐스팅 불가능 
        *   자식  -> 부모
            *   Dog dog = bulldog; // 캐스팅 가능
            *   불독은 개이다 (불독은 개가 맞음)
            *   1:1 매칭 가능
    *   상속관계 클래스의 참조 타입 변환
        *   부모 -> 자식
            *   BullDog& bulldog = (BullDog&) dog; // 캐스팅 가능
            *   참조타입으로 넘기므로, 캐스팅은 가능하나 메모리 침범이 일어날 수 있다.
        *   자식 -> 부모
            *   Dog& dog = bulldog; // 캐스팅 가능
            *   참조타입으로 넘기더라도, BullDog메모리에 Dog영역을 가지고 있기에 문제가 없다

> 원문: https://gradualprecision.tistory.com/42

---
title: 객체 지향 (다형성)
tags: [C++, 객체지향, 다형성]
created: 2026-09-05
modified: 2026-09-05
---

# 객체 지향 (다형성)

다형성

## 다형성

*   같은 메서드(멤버함수)가 다른 객체에서는 다르게 동작하는 것을 의미
*   동일한 인터페이스를 통해 서로 다른 구현 가능
*   코드의 유연성 및 확장성

## 다형성의 종류

*   다형성
    *   같은 인터페이스를 통해, 여러가지 다른 형태의 객체를 다룰 수 있게 해주는 특성
*    오버로딩
    *   함수이름은 동일하되 인자를 다르게하여 재정의
    *   일반적으로 일반함수 생성에서도 많이 사용되는 기법
    *   인자형태에 따라 다르게 함수 호출

오버로딩  
class Player  
{  
    void Test()  
    {  
        cout << "test" << endl;  
    }  
};  
  
class Archer : public Player  
{  
    void Test(int hp) // Test() 오버로딩  
    {  
         _hp = hp;  
         cout << "test2" << endl;  
     }  
};

*   오버라이딩
    *   똑같은 함수이름과 동일한 인자형태를 가진 메서드가, 객체에 따라 다르게 동작
    *   가상함수 사용 (virtual)
    *   c++11에서 도입된 override키워드를 통해, 가상 함수의 메서드가 다를시 에러를 내뱉음
    *   (즉, override는 virtual함수의 재정의 함수라는 것을 컴파일러에게 알리기 위해 사용)
*   연산자 오버로딩
    *   다음 블로그 주제로...
*   순수 가상함수

virtual [반환타입] [가상함수이름]([인자]) = 0;

*   > 순수 가상함수를 사용할 경우, 해당 클래스는 추상화클래스가 되어 인스턴스 생성이 불가능하다

```cpp
#include <iostream>
using namespace std;

class Player
{
public:
	Player()
	{
	}

	virtual void VTest() = 0; // 순수 가상함수
	virtual void VSpeek()
	{
		cout << "Player" << endl;
	}

};

class Archer : public Player
{
public:
	Archer()
	{
		_hp = 0;
		_attack = 0;
	}
	void VTest() override // 필수
	{
		cout << "순수 가상함수 archer! " << endl;
	}
	void VSpeek() override // 재정의 키워드 추가 "override"
	{
		cout << "Archer" << endl;
	}
	

public:
	int _hp;
	int _attack;
};

void VirtualTest(Player* player)
{
//player->VSpeek()를 호출했지만, Archer->VSpeek()함수가 호출됨
	// player라는 같은 인터페이스 이용
    player->VSpeek();
}

int main()
{
  
	//Player p1; // 순수 가상함수가 있다는 것은 추상화 클래스 이므로, 인스턴스 사용 불가
	Archer ar; // 순수 가상함수의 재정의는 필수값
	VirtualTest(&ar);

}
```

> 원문: https://gradualprecision.tistory.com/37

---
title: 얕은 복사, 깊은 복사
tags: [C++, 얕은복사, 깊은복사]
created: 2026-09-05
modified: 2026-09-05
---

# 얕은 복사, 깊은 복사

1. 얕은 복사  
2. 깊은 복사  
3. 상속에 따른 복사 테스트

## 얕은 복사

*   컴파일러가 자동으로 해준다
*   데이터의 값 복사와 포인터가 있을경우 해당 주소 그대로 복사
    *   주소 복사가 이루어질 때 문제가 될 여지가 존재

class Pet  
{};  
  
class Player  
{  
  
public:  
         int _hp;  
         Pet* _pet;  
};  
  
Pet* pet = new Pet;  
Player p1;  
p1._pet = pet;  
Player p3 = p1; // 복사 생성자  
  
  
p1._pet->_hp = 200; // p3의 _pet도 동일하게 변경됨 (주소 복사가 이루어짐 = 얕은 복사)

## 깊은 복사

*   "명시적"으로 지정해서 의도적으로 깊은복사가 이루어지도록 진행
    *   컴파일러의 의존도 낮춤
*   **복사 생성자**   
    *   생성자와 유사하지만 자기 자신을 인자로 받아 복사하는 형태
    *   동적할당을 진행하여, 해당 주소안의 값을 새로운 주소에 값을 복사

```cpp
** 깊은 복사 **

[클래스명] (const [클래스명]& [객체이름] )

ex)
Player (const Player& player)
{
     _hp = player._hp; // 일반적인 값대입
     _pet = new Pet(); //  동적할당 (새로운 공간)
     _pet = player._pet;  // (주소안의 해당하는 )값 대입

/* 또는
//  Pet(const Pet& pet) 복사생성자
// pet은 참조값이므로, 주소가 아닌 값이 들어가야함
// 그래서 *(player._pet)을 사용
     _pet = new Pet(*(player._pet)); // Pet의 복사생성자를 이용
*/

}
```

*   **복사 대입 연산자**
    *   복사생성자와 유사한 역할
    *   복사생성자는 객체를 생성할때 사용하지만, 복사대입 연산자는 "=" 대입 연산시 사용
    *   동적할당을 진행하여 깊은 복사 진행

```cpp
** 깊은 복사 **

[클래스명]& operator+(const [클래스명]& [객체이름] )

ex)
Player& operator=(const Player& player)
{
     _hp = player._hp; // 일반적인 값대입
     _pet = new Pet(); //  동적할당 (새로운 공간)
     _pet = player._pet;  // (주소안의 해당하는 )값 대입

/* 또는
//  Pet(const Pet& pet) 복사생성자
// pet은 참조값이므로, 주소가 아닌 값이 들어가야함
// 그래서 *(player._pet)을 사용
     _pet = new Pet(*(player._pet)); // Pet의 복사생성자를 이용
*/

}
```

## 상속에 따른 복사 테스트

*   암시적 복사 생성자 단계
    1.  부모 클래스의 복사 생성자 호출
    2.  자식 클래스의 복사 생성자 호출
    3.  자식이 기본 타입(int, double...)일 경우 메모리 복사 (얕은 복사)

```cpp
// [복사 생성자] //
#include <iostream>
using namespace std;

class Player
{
public:
	Player()
	{
		cout << "Player()" << endl;
	}
	virtual ~Player()
	{
		cout << "~Player()" << endl;
	}
public:
	int _id;
};

class Human : public Player
{
public: 
	Human()
	{
		cout << "Human()" << endl;
	}
	Human(int face)
	{
		cout << "Human (int)" << endl;
		_face = face;
	}
	~Human()
	{
		cout << "~Human()" << endl;
	}
public:
	int _face;
};

int main()
{
	Human h(10);
	//복사생성자
    Human h2 = h; //컴파일러가 암시적으로 복사생성자 호출 (부모 + 자식)
	
    //복사대입연산자
    h2 = h;
	cout << h2._face << endl; // 10 호출 (얕은 복사)

}
```

*   명시적 복사 생성자 단계
    1.  부모 클래스의 기본 생성자 호출
    2.  자식 클래스의 기본 생성자 호출
*   주의)
    *   명시적 복사를 진행할경우,
        *   복사 생성자 + 복사 대입 연산자 자식에 상속받은 부모의 복사 생성자/복사 대입연산자 지정해줘야함
    *   복사 대입 연산자의 경우, (암시적으로 진행될 경우 얕은 복사가 이루어짐)
        1.   부모 클래스의 복사대입 연산자 호출
        2.  자식 클래스의 복사 대입 연산자 호출

(즉, 명시적 복사 생성자 단계에서는 직접 정의를 통해 복사생성자를 구현 해줘야함)

```cpp
// [복사 생성자] //
#include <iostream>
using namespace std;

class Player
{
public:
	Player()
	{
		cout << "Player()" << endl;
	}
    // 따로 설정 안해놓으면, 컴파일러가 암시적으로 복사생성자를 생성해 호출함
	/*Player(const Player& player)
	{
		_id = player._id;
		cout << "Player(const Player&) " << endl;
	}*/
	virtual ~Player()
	{
		cout << "~Player()" << endl;
	}
public:
	int _id;
};

class Human : public Player
{
public: 
	Human()
	{
		cout << "Human()" << endl;
	}
	Human(int face)
	{
		cout << "Human (int)" << endl;
		_face = face;
	}
	Human(const Human& human): Player(human)
	{
		_face = human._face;
		cout << "Human(const Human&) " << endl;
	}
	~Human()
	{
		cout << "~Human()" << endl;
	}
public:
	int _face;
};

int main()
{
	Human h(10);
	h._id = 20;
	//Human(const Human& human) // Player을 따로 지정안할경우
	//Human h2 = h; // Human의 복사생성자 호출 , Player의 기본생성자 호출

	//Human(const Human& human) : Player(human)
	Human h2 = h; // Human의 복사 생성자 호출, Player의 복사생성자 호출
	cout << h2._face << endl;
	cout << h2._id << endl;

}
```

```cpp
// 복사 대입 연산자 //

#include <iostream>
using namespace std;

class Player
{
public:
	Player()
	{
		cout << "Player()" << endl;
	}
	Player& operator=(const Player& player)
	{
		_id = player._id;
		cout << "Player& oper" << endl;

		return *this;
	}
	virtual ~Player()
	{
		cout << "~Player()" << endl;
	}
public:
	int _id;
};

class Human : public Player
{
public: 
	Human()
	{
		cout << "Human()" << endl;
	}
	Human(int face)
	{
		cout << "Human (int)" << endl;
		_face = face;
	}

	Human& operator=(const Human& human)
	{
		// Player::operator= 를 안해주면, 컴파일러가 임의로 복사대입연산자를 생성하여 값대입이루어짐
		Player::operator=(human);
		_face = human._face;
		cout << "Human& oper" << endl;
		
		return *this;
	}

	~Human()
	{
		cout << "~Human()" << endl;
	}
public:
	int _face;
};

int main()
{
	Human h(10);
	h._id = 20;

	Human h2(30); 
	h2 = h; // Human 복사 대입 연산자 + Player 복사 대입 연산자 호출 
	cout << h2._face << endl;
	cout << h2._id << endl;

}
```

> 원문: https://gradualprecision.tistory.com/44

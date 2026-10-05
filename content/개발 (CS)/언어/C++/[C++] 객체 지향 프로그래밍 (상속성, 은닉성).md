---
title: "객체 지향 프로그래밍 (상속성, 은닉성)"
tags: [C++, 객체지향, 상속성, 은닉성]
created: 2026-09-05
modified: 2026-09-05
---

# 객체 지향 프로그래밍 (상속성, 은닉성)

이 노트는 C++의 상속성과 은닉성을 다룬다. 상속은 코드 재사용과 계층 구조 구현을 위해, 은닉은 `public`/`protected`/`private` 접근 제어자로 데이터 무결성과 안정성을 지키기 위해 사용하며, 특히 자식 클래스가 상속받을 때 지정하는 '상속 접근 지정자'(public/private/protected 상속)에 따라 부모 멤버의 접근 범위가 어떻게 재조정되는지를 예제로 보여준다.

상속성과 은닉성

## 상속성 & 은닉성

*   상속을 하는 이유?  
    *   코드의 재사용성을 줄이기 위해서
    *   계층적인 관계를 쉽게 구현하기 위해
*   은닉을 하는 이유?
    *   객체의 데이터 및 메소드를 외부로부터 숨기고, 클래스 내부에서만 가능하게 하기 위해
    *   데이터의 무결성 유지, 객체의 인터페이스만을 통해 상호 작용
    *   안정성을 높이기 위해서
    *   접근 제어자 활용 : public / protected / private
        *   public : 공용, 외부로 열려있는 접근 제어자
        *   protected : 클래스 내부에서 사용, 자식들까지 (연관된 클래스) 사용 가능
        *   private : 클래스 내부에서 사용, 자신 혼자만 사용 (상속되지 않음)
*   부모가 자식에게 물려주는 멤버함수 & 멤버변수
    *   부모 클래스는 private를 제외한 protected , public을 상속할 수 있음 
    *   클래스 내부 접근지정자에 따라 상속되는 것이 다름
    *   클래스 내부 접근 지정자
        *   public: 멤버(멤버함수 & 멤버변수)가 어디서든 접근이 가능
        *   private: 멤버가 클래스 내에서만 가능
        *   protected: 멤버가 클래스 및 파생 클래스 내에서 접근 가능
*   자식은 "상속접근지정자"를 통해 부모의 상속의 승계를 변경할 수 있다.
    *   상속 접근 지정자
        *   public : 부모 그대로를 물려받음 ( public, protected )
        *   private: 부모의 그대로를 물려받음. 하지만 private으로 변경함 ( public -> private, protected -> private)
        *   protected: 부모의 그대로를 물려받음. 하지만 protected으로 변경함 ( public -> protected , protected -> protected)
    *   상속승계의 변경을 통해 상속을 받은 클래스가, 다른 클래스로 상속할시에 접근권한을 조절할 수 있다.

```cpp
#include <iostream>
using namespace std;

class Monster
{
public:
	Monster() : _hp(10), _attack(100)
	{

	}
	~Monster()
	{

	}

	void Move() { cout << "Move!" << endl; }

protected:
	int _monsterId;

private: // 공통 멤버변수로 사용하기 위해서는 protected 내지는 public으로 설정해야함
	int _hp;
	int _attack;
};

class SuperSkeleton : private Monster
{
public:
	
	void SetMonsterId()
	{
		_monsterId = 10; // protected 이어서 접근 가능 ( public도 접근 가능 )
	}

protected:
	int test;
public:
	int _bigSize;

private:
	int _hp;
	int _attack;
};

class Skeleton : public SuperSkeleton
{
	void SetMonsterId()
	{
		_monsterId = 10; // SuperSkeleton에서 private으로 Monster을 받았으므로 불가능
	}

private:
	int _hp;
	int _attack;
};

class Org : public Monster
{
	void SetMonsterId()
	{
		_monsterId = 10;
	}
private:
	int _hp;
	int _attack;
};

int main()
{
	Monster m1;
	// 외부에서는 public만 접근 가능
	//m1._monsterId = 10;

	SuperSkeleton s1;
	
	// 외부에서는 public만 접근 가능
	//s1._hp; 
	//s1._monsterId = 20;
	//s1.test = 30;

	Skeleton s2;

}
```

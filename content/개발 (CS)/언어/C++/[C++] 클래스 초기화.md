---
title: "클래스 초기화"
tags: [C++, 클래스, 초기화]
created: 2026-09-05
modified: 2026-09-05
---

# 클래스 초기화

이 노트는 C++ 클래스의 다양한 초기화 방법 — 단일 클래스의 멤버 초기화 리스트, 상속 관계에서 부모 생성자를 호출하는 방법, C++11의 클래스 내 기본값 초기화, 클래스 포함(composition) 관계의 초기화 — 를 정리한다. 특히 참조(`&`) 멤버나 `const` 멤버는 생성자 몸체 안에서 나중에 값을 대입할 수 없고 반드시 초기화 리스트에서 생성 시점에 초기화해야 한다는 제약을 핵심으로 짚는다.

클래스 초기화

## 클래스 초기화

*   클래스 단일

class Knight  
{  
public:  
    Knight()  
    {  
         _hp = 100;  
     }  
...  
public:  
    int _hp;  
  
}

*   클래스 상속

class Player  
{  
public  
    Player(int id)  
     {     _id = id;     }  
...  
  
public:  
     int _id;  
}  
  
  
class Knight : public Player  
{  
public:  
    Knight() : Player(1) // Player 기본생성자(명시적)를 이용하여 초기화 , 암시적으로도 가능  
    {  
         _hp = 100;  
     }  
     or   
    Knight() : _hp(100), Player(1) // 멤버변수 초기화  
    {}  
  
...  
public:  
    int _hp;  
  
}

*   c++11 클래스 초기화

class Knight : public Player  
{  
public:  
    Knight() : Player(1)   
    {}  
     or   
    Knight() : _hp(100), Player(1)   
    {}  
  
...  
public:  
    int _hp=200; // c++11 초기화 방법  
  
}

*   포함관계
    *   포함되어지는 클래스의 생성자를 이용해서 초기화 가능
    *   암시적으로, 기본생성자를 통해서 초기화 가능

class Object  
{  
    Object()  
     {}  
     Object(int id)  
      { _id = id; }  
...  
public:  
     int _id = 1;  
}  
  
  
class Knight : public Player  
{  
public:  
    Knight() : Player(1)   
    {  
  
         // _obj = Object(10);  //명시적으로도 생성자를 유도해서 초기화할 수 있음  
     }  
     or   
    Knight() : _hp(100), Player(1)   
    {}  
  
...  
public:  
    int _hp=200;  
    Object _obj; // 기본 생성자 생성시, Object 클래스 기본생성자도 같이 호출됨  
}

*   참조 or const
    *   참조의 경우, 생성당시 가리키고 있어야하므로 초기화가 필요
    *   const 역시, 생성 당시 값을 가지고 있어야 하므로 초기화가 필요

class Knight  
{  
public:  
     Knight() : _hpRef(_hp), number(3) // 1. 이렇게 생성자가 호출 당시 바로 초기화할 수 있도록 진행  
     {     
           // 둘다 컴파일 불가능 -> 이미 생성된 이후에 값을 대입하는 것이기에 초기화가 진행되지 않아서 불가능  
           //_hpRef =_hp;  
            //number = 3;  
      }  
  
  
public:  
     int _hp;  
     int& _hpRef; // int& _hpRef = _hp; // 이런식으로 멤버변수 생성당시 바로 초기화를 진행 (C++11 이후)  
     const int number; // 위와 동일  
}

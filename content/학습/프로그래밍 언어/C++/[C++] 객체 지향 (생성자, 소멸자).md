---
title: 객체 지향 (생성자, 소멸자)
tags: [C++, 객체지향, 생성자, 소멸자]
created: 2026-09-05
modified: 2026-09-05
---

# 객체 지향 (생성자, 소멸자)

1. 클래스  
2. 생성자  
3. 소멸자

## 클래스

class Player  
{  
public : // 접근지정자  
  
              void Test(); //  멤버 함수  
  
public :    
              int _hp; // 멤버 변수   
              int _attack; // 멤버 변수  
  
};

*   객체
    *   동작 및 데이터를 표현하는 설계도 역할
    *   객체의 분류
        *   클래스 : 설계도
        *   인스턴스(객체) : 클래스를 사용하기 위해 만든 객체 ( 클래스 변수 선언 했다고 생각...)
*   클래스 구성
    *   멤버 함수 : 일반적인 함수랑 유사하나, 클래스에 속해 있다는 차이점이 존재
    *   멤버 변수 : 해당 클래스 내부에서 사용되는 지역변수와 유사한 변수
    *   (지역변수 : 중괄호 or 함수 내부 변수 ,  멤버변수 : 해당 클래스 객체 내부에서 사용되는 변수)

## 생성자

*   생성자
    *   생성자는 한개의 클래스안에 여러개의 생성자를 가질 수 있다
    *   생성자의 초기화 방법 

class Player  
{  
    Player() **: 멤버변수 (값), 멤버변수 (값) , ....**  
    {}  
  
}

*   생성자 종류  
    *   **기본생성자**
        *   기본생성자의 경우, 다른 종류의 생성자를 생성하지 않으면 암시적으로 기본생성자가 생성됨
        *   (단, 다른 생성자가 있을시, 암시적으로 생성되지 않으므로 명시적으로 기본생성자를 생성 요구) 
    *   **타입 변환 생성자**
        *   인자를 1개 받는 생성자
        *   일반적으로, 생산자로서도 사용되지만 lvalue값이 타입과 같다면 암시적으로 호출됨
    *   **복사 생성자**
        *   자신의 클래스 참조타입을 인자로 받아, 객체를 복사하여 생성하는 역할
        *   주의) 멤버변수중 동적할당이 있을경우 주의가 필요함
            *   주소와 값 모두 복사하기에, 다른 객체에서 수정할경우 복사할 당시 사용했던 객체에도 영향이 끼침

멤버변수 동적할당  
class Player  
{  
public:  
      Player(const Player& player)  
      {  
           arr = new int[5] // 새로운 동적할당 (주소값을 다르게 하기 위해서)  
           for (int i =0 ; i< 5; i++)  
           { arr[i] = player.arr[i]; } // 값 복사  
      }  
public:  
      int *arr;  
}

*   기타 생성자
*   일반적으로, 여러 인자들을 받을 수 있는 생성자들을 기타 생성자라고 명명함

*   생성자 형태

```cpp
class Player
{
public:
     // 기본 생성자
     Player() : _hp(10), _attack(100) // 초기화 진행
     {
     
     }
     
     // 타입변환 생성자
     Player(int hp)
     {
        _hp = hp;
     }
     
     // 복사 생성자
     Player(const Player& player)
     {
         _hp = player._hp;
         _attack = player._attack;
     }
     
     //기타 생성자
     Player(int hp, int attack)
     {
         _hp = hp;
         _attack = attack;
     }
     
     // 소멸자
     ~Player() 
     {
     }
     
     
public:
     int _hp;
     int _attack;
};

int main()
{
     // 기본 생성자
     Player p1; 
     
     //타입변환 생성자
     //Player p2(10);
     Player p2 = 10; // 암시적으로 _hp 값에 10이 들어감
    
     // 복사 생성자
     Player p3 = p1;

     // 기타 생성자
     Player p4(10, 100);
     
}
```

## 소멸자

*   생성된 인스턴스가 해제될 때, 마지막으로 불리는 함수
*   소멸자 형식

class Player{  
public:  
        ~Player() {   [원하는 동작]  }  
...  
}

> 원문: https://gradualprecision.tistory.com/35

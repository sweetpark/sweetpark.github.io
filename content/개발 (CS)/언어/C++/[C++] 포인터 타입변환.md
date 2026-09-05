---
title: "포인터 타입변환"
tags: [C++, 포인터, 타입변환]
created: 2026-09-05
modified: 2026-09-05
---

# 포인터 타입변환

1. 포인터 생성자/소멸자  
2. 타입변환을 위한 클래스 생성  
3. 연관성이 없는 클래스 사이의 포인터 변환  
4. 상속관계 클래스 사이의 포인터 변환

## 포인터 생성자/ 소멸자

*   포인터를 이용하여 동적할당을 할 때, 생성자와 소멸자가 호출될 수 있다.
*   단순한, 포인터 선언은 생성자와 소멸자를 호출하지 않는다.

```cpp
class Player
{};

class Knight : public Player
{};

int main()
{
    Knight* knight; // 생성자, 소멸자 호출 x
    Player* player; // 생성자, 소멸자 호출 x
    
    knight = new Knight(); // 생성자, 소멸자 호출 o
    player = new Player(); // 생성자, 소멸자 호출 o
    
    Player* player2 = knight; // 생성자, 소멸자 호출 x
}
```

## 타입변환을 위한 클래스 생성

```cpp
class Item
{
public:
    Item()
    {
        cout << " Item() 생성 " << endl;
    }

    virtual ~Item()
    {
        cout << "Item() 소멸" << endl;
    }

public:
    int _ItemId;
    int _sword;
};

class Knight
{
public:
    int _hp;

};

class Weapon : public Item
{
public:

    Weapon()
    {
        _ItemId = 1;
        cout << "Weapon()" << endl;
    
    }
    ~Weapon()
    {
        _ItemId = 1;
        cout << "~Weapon()" << endl;

    }
};

class Armor : public Item
{
public:
    Armor()
    {
        _ItemId = 2;
        cout << "Armor()" << endl;
    }

    ~Armor()
    {
        _ItemId = 2;
        cout << "~Armor()" << endl;
    }
};
```

## 연관성이 없는 클래스 사이의 포인터 변환

*   명시적/ 암시적 변환 가능
*   단, 메모리 침범이 일어날 수 있음

Knight* knight = new Knight;  
Item * item = (Item*)knight; // 명시적 변환 (knight를 Item으로 생각하겠다)  
//Item * item = knight; // 암시적 변환

## 상속관계 클래스 사이의 포인터 변환

*   부모 -> 자식
    *   암시적으로는 불가능
    *   명시적으로는 가능
        *   단, 포함되지 않는 영역이 있으므로 , 메모리 침범이 발생할 수 있음

Item* item = new Item;  
//Weapon* weapon = item; // 암시적으로 불가능  
Weapon* weapon = (Weapon*)item; // 명시적으로 가능

*   자식 -> 부모
    *   암시적 / 명시적으로 가능

Weapon* weapon = new Weapon;  
Item* item = weapon; // item으로 생각하겠다 (암시적)  
Item* item = (Item*)weapon; // item으로 생각하겠다 (명시적)

*   최상위 클래스를 이용하여 자식클래스 생성
    *   주의) 소멸자의 경우 virtual로 하지않으면, delete시에 부모 소멸자만 호출될 수 있다.
        *   해결방법1) 특정 자식을 delete 해줘서 , 자식과 부모 둘다 해제할 수 있도록 한다.
        *   **해결방법2) virtual을 사용하여, 캐스팅 되어있는 자식을 찾아서 소멸할 수 있도록 한다.** 
            *   **최상위 클래스의 소멸자의 경우 virtual을 사용하는 것을 습관화하자!**

```cpp
class Item
{
public:
    Item()
    {
        cout << " Item() 생성 " << endl;
    }

/* 해결방법1
    ~Item()
    {
        cout << "Item() 소멸" << endl;
    }
    
*/
    // 해결방법2
    virtual ~Item()
    {
        cout << "Item() 소멸" << endl;
    }

public:
    int _ItemId;
    int _sword;
};

class Weapon : public Item
{
public:

    Weapon()
    {
        _ItemId = 1;
        cout << "Weapon()" << endl;
    
    }
    ~Weapon()
    {
        _ItemId = 1;
        cout << "~Weapon()" << endl;

    }
};

class Armor : public Item
{
public:
    Armor()
    {
        _ItemId = 2;
        cout << "Armor()" << endl;
    }

    ~Armor()
    {
        _ItemId = 2;
        cout << "~Armor()" << endl;
    }
};

 
 // ... int main() ...
 
 for (int i = 0; i < 20; i++)
 {
     Item* item = inventory[i];

     if (item == nullptr)
         continue;
     /* 해결방법1
     if (item->_ItemId == 1)
     {
         Weapon* weapon = (Weapon*)item;
         delete weapon;
     }
     else if (item->_ItemId == 2)
     {
         Armor* armor = (Armor*)item;
         delete armor;
     }
     */
     delete item // 해결방법2
    
 }
```

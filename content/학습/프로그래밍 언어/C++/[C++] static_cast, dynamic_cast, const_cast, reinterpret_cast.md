---
title: "static_cast, dynamic_cast, const_cast, reinterpret_cast"
tags: [C++, 형변환, cast]
created: 2026-09-05
modified: 2026-09-05
---

# static_cast, dynamic_cast, const_cast, reinterpret_cast

1. static_cast  
2. dynamic_cast  
3. const_cast  
4. reinterpret_cast

## Static_cast

*   일반적으로 많이 사용되는 캐스팅
*   C스타일 ( (double) num; ) "()" 보다 안전한 타입변환 방법

## Static_cast 종류

*   기본 타입 간 변화

```cpp
int i = 10;
double b = static_cast<double> i;
```

*   포인터 간의 변화 (** 주로 많이 사용)

```cpp
class Base
{};
class Child : public Base
{};

Base* basePtr = new Child;
Child* childPtr = static_cast<Child*>(basePtr);
```

*   void 포인터 특정 포인터로 변환

```cpp
void *ptr = &i;
int* intPtr = static_cast<int*>(ptr);
```

*   열거형과 정수형 간의 변환

```cpp
enum Player { Human, Monster };
Player player = Human;
int playerInt = static_cast<int>(player);
```

## Dynamic_cast

*   RTTI사용 : Run Time Type Information
*   virtual을 사용해서 RTTI를 사용해야함 ( virtual을 사용하면 가상 테이블이 생성 == RTTI 정보 )
    *   소멸자에 virtual을 사용

## Dynamic_cast 종류

*   부모 -> 자식으로 가능 캐스팅 (다운캐스팅)

```cpp
class Base
{
public:
     virtual ~Base()
     {};
}

class Player : public Base
{}

int main
{
    Base* basePtr = new Player(); // Player기본생성자 호출
    
    Player* playerPtr = dynamic_cast<Player*>(basePtr);
    // 실패하면 -> playerPtr에 nullptr이 반환됨 (안정성)
    return 0;
}
```

*   참조 타입 캐스팅

```cpp
class Base
{
public:
     virtual ~Base()
     {};
}

class Player : public Base
{}

int main
{
    Base* basePtr = new Player(); // Player기본생성자 호출
    
    
    try 
    {
        Player& player = dynamic_cast<Player&>(*basePtr);
        // 실패하면 std::bad_cast 반환
    } catch (const std::bad_cast& e)
    {
        std::cout << "dynamic_cast to Derived1& failed: " << e.what() << std::endl;
    }    
    
    
    return 0;
}
```

## Const_cast

*   const 를 뺴거나 추가할 때 사용

```cpp
void Print(char* str)
{
    cout << str << endl;
}

int main()
{
   //Print("Hello"); // 불가능 "Hello"는 <const char*>
   Print(const_cast<char *>("Hello"));
   
}
```

## Reinterpret_cast

*   가장 위험하고, 강력한 캐스팅
*   안전하지 않은 캐스팅도 가능하게 한다

```cpp
int *ptr;
__int8 num = reinterpret_cast<__int8>(ptr); // 주소값을 __int8 (1바이트)로 캐스팅
// 말도안되지만,가능하게 해준다.
```

> 원문: https://gradualprecision.tistory.com/45

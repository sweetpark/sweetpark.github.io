---
title: enum
tags: [C++, enum]
created: 2026-09-05
modified: 2026-09-05
---

# enum

enum (열거형)

## 열거형

*   상수를 정의하고, (default 값) 순차적으로 정의되어있는 수들을 그룹화하는 방법
*   원하는 숫자를 지정할 수도 있다.

enum class  
- 일반 enum 과는 다른 점이 있다. (C++11 이후)  
- 일반 enum의 경우, int 범위 내의 상수를 가진다 (이름만으로 상수에 접근이 가능하다)  
- enum class의 경우, 열거형 상수는 '[enumName]::[상수Name] 형식으로 접근해야하며 명확히 구분된다  
(같은 상수 이름을 가지더라도 문제가 되지 않는다)
```cpp
enum Color
{
    RED, // 0
    GREEN, // 1
    BLUE // 2
};

//숫자 지정 가능
enum Status
{
    ACTIVE =1,
    INACTIVE = 4,
    PENDING = 2
};

//타입 지정 가능
enum Size : short {
    SMALL = 1,
    MEDIUM, // 2
    LARGE // 3
};

// class로 설정하면 전역으로 설정되는 enum과 충돌이 나지 않는다 (겹치지 않음)
enum class Direction{
    UP,
    DOWN,
    LEFT,
    RIGHT
};

int main()
{
    // Direction을 지정해서 사용해야한다. (범위 지정)
    Direction dir = Direction::UP;
    
    int status = ACTIVE;
}
```

> 원문: https://gradualprecision.tistory.com/29

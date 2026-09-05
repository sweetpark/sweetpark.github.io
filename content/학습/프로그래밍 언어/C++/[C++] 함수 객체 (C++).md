---
title: "함수 객체 (C++)"
tags: [C++, 함수객체]
created: 2026-09-05
modified: 2026-09-05
---

# 함수 객체 (C++)

1. 함수객체 형태  
2. 함수객체 특징

## 함수 객체 형태

```cpp
//class [함수객체이름]
class Functor
{
public:

    //[반환타입] oprator()([인자],..) { //TODO }

    void operator()()
    { cout << "test" << endl; }
   
    bool operator()(int num)
   { _value = num; return true; }

public:
    int _value = 0; // 상태 저장
}

int main()
{
    Functor func; // 인스턴스 생성
    func(); // void operator()() 호출

    bool ret = func(10); // bool operator(int num)() 호출 (_value 상태값 저장)
}
```

*   클래스와 동일하다
*   연산자 오버로딩을 통해서 클래스가 함수로서 사용할 수 있도록 한다.

## 함수 객체 특징

*   연산자 오버로딩을 통해 여러종류의 반환타입, 인자타입 및 개수를 생성할 수 있다.
*   상태값을 가질 수 있다 ( ex) _value )

> 원문: https://gradualprecision.tistory.com/47

---
title: "생성자/소멸자"
tags: [학습, 개발-CS, 언어, C++, 개발, 생성자, 소멸자]
created: 2026-09-05
modified: 2026-09-05
---

# 생성자/소멸자

> [!NOTE]
> C++ 생성자 오버로딩, 디폴트 생성자, 소멸자 개념과 예시.

## 📌 개념

### 다양한 생성자 (오버로딩)

```cpp
#include <iostream>
using namespace std;

class SimpleClass
{
private:
    int num1;
    int num2;
public:
    SimpleClass() // 기본생성자1 ( 생략 가능 )
    {
          num1=0;
          num2=0;
    }
    SimpleClass( int n) // 생성자 2
    {
           num1 = n;
           num2 = 0;
     }
     SimpleClass(int n1, int n2) // 생성자 3
     {
            num1 = n1;
            num2 = n2;
      }
};
int main (void){
      SimpleClass sc1; // 생성자1 호출
      SimpleClass sc2(3); // 생성자 2 호출
      SimpleClass sc3(3,4) // 생성자 3 호출
}
```

### default 생성자 (기본값 매개변수)

```cpp
#include <iostream>
using namespace std;

class SimpleClass
{
private:
    int num1;
    int num2;
public:
    SimpleClass(int n1=0, int n2=0) // 생성자
    {
          num1=n1;
          num2=n2;
    }
int main (void){
      SimpleClass sc1; // 생성자1 호출 ⇒ num1=0 / num2=0
}
```

### 소멸자

- 동적 배열을 삭제하는 역할 (동적 할당 해제)
- main 함수 끝에서 소멸자 실행됨 (객체가 없어질 때)

```cpp
public:
    IntArray(int length)
    {
     m_Array= new int[static_cast<size_t>(length)]; // 동적배열할당
     m_Length = length;
     }

     ~IntArray()
     {
       delete[] m_Array; //동적 배열 할당 해제
     }
```

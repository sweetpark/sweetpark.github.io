---
title: "연산자 오버로딩 (대입연산자, 전위-후위연산자)"
tags: [C++, 연산자오버로딩]
created: 2026-09-05
modified: 2026-09-05
---

# 연산자 오버로딩 (대입연산자, 전위-후위연산자)

1. 연산자 오버로딩 형태  
2. 대입 연산자               
3. 전위/후위 연산자

## 연산자 오버로딩 형태

**[반환값]operator[연산자]([인자])**  
ex) int operator+(const int& number)  
> int b = (int)a + 2;

*   전역 연산자든 멤버함수 연산자 오버로딩이든 **사용자 정의 연산자 정의**이기에 클래스를 통해서 이뤄짐
    *   int operator(int a, int b) {} // 컴파일러 오류
    *   **기본 타입에 대한 전역 연산자 오버로딩의 경우 표준 라이브러리 호환성 유지를 위해 오류를 내보냄**
*   **전역 연산자 오버로딩**
    *   [반환값]operator[연산자]([인자1], [인자2])
        *   인자1 : 왼쪽 피연산자
        *   인자2 : 오른쪽 피연산자
            *   ex) 반환값 = a(왼쪽 피연산자) + b (오른쪽 피연산자)
                *   인자1 : a , 인자2 : b
*   **멤버함수 연산자 오버로딩**
    *   해당 클래스 자기자신을 기준으로 인자값을 연산함
        *   왼쪽 피연산자가 자기자신이 아닌경우 -> 전역 연산자 오버로딩으로 매개변수 위치 설정
    *   [반환값]operator[연산자]([인자])
        *   왼쪽피연산자는 자기자신  
            
            *   클래스 자기자신 지칭 : *this
        *   인자 : 오른쪽 피연산자
    *   ex) 반환값 = a(왼쪽 피연산자) + b (오른쪽 피연산자);
        *   a : 클래스 자기 자신
        *   b : 더해질 값 (클래스 , 상수 ...)

```cpp
class Position
{
public:
    //(0)
    //복사 대입 연산자
    Position& operator= (const Position& arg)
    {
	    pos_x = arg.pos_x;
	    pos_y = arg.pos_y;

	    return *this;
    }
    
	Position operator+ (const Position& pos2)
	{
		Position pos;
		pos.pos_x = pos_x + pos2.pos_x;
		pos.pos_y = pos_y + pos2.pos_y;
		return pos;
	}
	
    // (1)
	Position operator+ (int arg)
	{
		Position pos;
		pos.pos_x = pos_x + arg;
		pos.pos_y = pos_y + arg;
		return pos;
	}
public:
	int pos_x = 0;
	int pos_y = 0;
};

// 전역 연산자 오버로딩 (클래스 내부 (1) oprator+와 동일의미)
//Position operator+ (const Position a, int b)
//{
//	Position c;
//	c.pos_x = a.pos_x + b;
//	return c;
//}

//(2)
//전역 연산자 오버로딩
Position operator+ (int a, const Position & b)
{
	Position ret;

	ret.pos_x = b.pos_x + a;
	ret.pos_y = b.pos_y + a;

	return ret;
}

int main()
{
    int a =1;
    Position pos;
    Position pos2;

    pos = (pos + 1); // pos+1 :(1)연산 ,  pos = (pos+1) : (0)연산
    pos = (1 + pos); // 1+pos :(2)연산 ,  pos = (1+pos) : (0)연산

}
```

## 대입 연산자 오버로딩

*   **대입 연산자 오버로딩**
    *   [반환값] operator([인자])
        *   인자 : 오른쪽 피연산자
        *   ex) (Myclass) a = (int) b
            *   a: 클래스 자기 자신
            *   b: 대입할 오른쪽 매개변수

```cpp
class Myclass
{
public:
    Myclass& operator=(int num)
    {
        _id = num; // 대입 연산 진행
        return *this; // 자기자신 return
    }

public:
    int _id = 0;
};

int main()
{
    Myclass m;
    m = 2; // 연산자 오버로딩

    return 0;
}
```

*   **복사 대입 연산자 오버로딩**
    *   [반환값] operator([인자])
        *   자기 자신을 인자로 받는경우 예외처리 필요
        *   대부분 인자로 같은 클래스를 받는 경우가 대부분
    *   기본적으로 얕은 복사가 이루어짐 (컴파일러가 자동으로 생성해줌)
        *   포인터일경우 주소값도 동일하게 복사됨 (주소를 그대로 복사하기에 문제가 될 수 있음)
        *   데이터도 일반적으로 복사됨
    *   포인터가 있을 경우, 해당 부분의 깊은 복사를 진행해야함
        *   깊은 복사를 하지 않을경우, 대입때 사용된 other 클래스 객체 값 변경시 같이 변경됨

```cpp
#define _CRT_SECURE_NO_WARNINGS
#include <iostream>
using namespace std;

class Myclass
{
public:

    Myclass(const char* str = "")
    {
        data = new char[strlen(str) + 1];
        strcpy(data, str);
    }
    
    // 일반적인 값 대입 연산
    Myclass& operator=(int num)
    {
        _id = num;

        return *this;
    }
    
    // 복사대입연산자 ( 깊은 복사 )
    Myclass& operator=(const Myclass& m)
    {
        // 자기자신 대입 방지
        if (this == &m)
            return *this;

        // 주소값 복사되는 얕은복사 방지 (깊은복사 진행)
        _id = m._id;
        data = new char[strlen(m.data) + 1];
        strcpy(data, m.data);

        //data = m.data;
        return *this;
    }
    
    // 복사대입 연산자 (얕은 복사)
    /*
     Myclass& operator=(const Myclass& m)
    {
        // 자기자신 대입 방지
        if (this == &m)
            return *this;

        _id = m._id;
        data = m.data; // 얕은복사 진행 (주소 + 데이터)
        
        return *this;
    }
    */

    void setData(const char* _data)
    {
        strcpy(data,_data);
    }

public:
    int _id = 0;
    char* data;
};

int main()
{
    Myclass m("Hello");
    Myclass m2("Bye");

    m2 = 2;
    m = m2;
    
    // 얕은 복사의 경우
    // m.data =="qqqq"
    // m2.data == "qqqq" 로 변경됨
    m2.setData("qqqq");

    //깊은 복사의 경우
    // m2.data == "qqqq" 변경
    // m.data 변경 없음

    
    
    return 0;
}
```

*   이동 대입 연산자
    *   인자로 받은 값을 연산하는 클래스로 값을 옮기고 초기화 해주는 역할
    *   Other 데이터 -> 자기자신
        *   복사대입연산자와 다르게 주소를 그대로 사용해도 되므로 얕은복사 진행
        *   리소스 절약 가능

Myclass  
{  
...  
  MyString& operator = (MyString&& other) noexcept  
  {  
         // 자기자신일 경우 패스  
         if (this== &other)   
              return*this;  
  
         // 기존 자원 해제  
         delete[] data;  
       
          // data 옮기기  
         data = other.data;  
       
         // 다른 객체의 자원 포인터를 nullptr로 설정  
          other.data = nullptr;  
       
          return *this;  
     }  
...  
  
public:  
    char *data;  
}

## 전위 / 후위 연산자 오버로딩

*   전위 연산자 오버로딩
    *   ++a 형태
    *   "++" 연산을 진행한 후 바로 적용
    *   [반환값] operator++() 으로 생성

```cpp
class Position
{
public:
	// 전위형 (++a)
	Position& operator++()
	{
		pos_x++;
		pos_y++;
		return *this; // 연산 후 바로 적용
	}

public:
	int pos_x = 0;
	int pos_y = 0;
};
```

*   후위 연산자 오버로딩
    *   a++ 형태
    *   "++"연산은 이후에 적용되고, 원본값이 결과에 반환되어야함
    *   [반환값] operator++(int) 으로 생성

```cpp
class Position
{
public:
	// 후위형 (a++)
	Position operator++(int)
	{
        // 원본값 저장
		Position ret = *this; 
		
        // 1 증가
        pos_x++;
		pos_y++;
        
		// 원본값 return 
        return ret; 
	}

public:
	int pos_x = 0;
	int pos_y = 0;
};
```

> 원문: https://gradualprecision.tistory.com/39

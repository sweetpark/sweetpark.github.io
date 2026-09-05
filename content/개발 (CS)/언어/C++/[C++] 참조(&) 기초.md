---
title: "참조(&) 기초"
tags: [C++, 참조]
created: 2026-09-05
modified: 2026-09-05
---

# 참조(&) 기초

1. 참조 형식                                
2. 참조 특징                               
3. pointer (*) vs reference (&)

## 참조 형식

[TYPE]& [참조 이름]= [참조할 변수];

*   참조(Reference) 또한 포인터와 어셈블리어 연산 과정은 동일하다 (**포인터가 주소를 가리키는 부분이 추가** 되어있는 것 뿐...)
*   어셈블리어 (값 변경 과정)
    *   [Pointer]
    *   1. pointer 저장된 주소로 이동 **(int *ptr)**
    *   2. 이동된 주소의 값을 수정 **(*ptr = [원하는 값] )**
    *   [Reference]
    *   1. 참조할 변수의 주소를 타고 이동
    *   2. 이동된 주소의 값을 수정 **(int &ref = [참조할 변수] )**
    *   **3. ref = 10; // 참조할 변수의 값 변경**
*   참조 변수의 크기 : 4바이트 (32bit) / 8바이트 (64bit)

## 참조 특징

*    null 값이 존재하지 않음 ( 초기화가 필요함 )
    *   포인터와 다르게 홀로 사용 불가 ( int &ref; // 불가능)
*   참조하는 변수의 다른이름(=별칭) 처럼 사용 가능
*   함수 인자로서 사용하기에 편리하다

## Pointer(포인터) vs Reference(참조)

*   pointer
    *   초기화 없이 사용이 가능하다 (* nullptr 존재 )
    *   주의) null 체크하는 부분은 사용하는 것이 권장
    *   const의 다양한 활용 (주소 방지, 값 변경 방지)
        *   1. 값 변경 방지
            *   **const** [TYPE] * [ptr이름]  = [주소값];
        *   2. 주소 변경 방지
            *   [TYPE] * **const** [ptr이름]  = [주소값];
*   Reference 
    *   초기화가 가능해야 사용할 수 있다 ( null 없음 )
    *   const의 경우 값 변경 불가능 기능 ( 일반적인 변수의 const 활용과 동일 )

*   Pointer < - > Reference

```cpp
//[Pointer] <-> [Reference]

int num = 10;
int *ptr= &num; // pointer 초기화

int& ref = *ptr; // ref에 pointer 값 저장

void ptr2RefTest(int* ptr)
{
	cout << "PtrTest" << endl;
}
ptr2RefTest(&ref);

void ref2PtrTest(int& ref)
{
	cout << "RefTest" << endl;
}
ref2PtrTest(*ptr);
```

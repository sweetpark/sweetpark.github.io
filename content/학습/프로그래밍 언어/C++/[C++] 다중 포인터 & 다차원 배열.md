---
title: 다중 포인터 & 다차원 배열
tags: [C++, 포인터, 배열]
created: 2026-09-05
modified: 2026-09-05
---

# 다중 포인터 & 다차원 배열

1. 다중 포인터  
2. 다차원 배열

## 다중 포인터

[Type] **[포인터이름] = [주소값];
```cpp
void SetMessage(const char* a)
{
	a = "Bye"; // 새롭게 .rdata에 저장된 것을 새롭게 가리키게 됨
	cout << a << endl;
}

void SetMessageDoublePointer(const char** a)
{
	*a = "Bye";// string에 가리키던 주소(.rdata :Hello주소) 를 바꿈 (.rdata : Bye 주소로)
} 

int main()
{
    const char* string = "Hello";
    
    SetMessage(string);
    
    SetMessageDoublePointer(&string);

    return 0;

}
```

*   SetMessage(const char * a)

| 순서 | 포인터 | stack 영역 | 값 |
| --- | --- | --- | --- |
| 1 | string | .rdata#1영역 | Hello |
| 2 | ~ SetMessasge() ~ | ~ SetMessasge() ~ | ~ SetMessasge() ~ |
| 3 | a (지역변수) | .rdata#2영역 | Bye |
| 4 | main()영역 | main()영역 | main()영역 |
| 5 | string | .rdata#1영역 | Hello |

*   3번 순서에서, Bye라는 값이 새롭게 stack영역에 저장됨 (해당 값을 a 가 가리키게 됨)
*   따라서, string 포인터의 변화는 존재하지 않게 됨

*   SetMessageDoublePointer(const char ** a)

| 순서 | 포인터 | stack영역 | 값 |
| --- | --- | --- | --- |
| 1 | string | .rdata#1영역 | Hello |
| 2 | ~SetMessageDoublePointer()~ | ~SetMessageDoublePointer()~ | ~SetMessageDoublePointer()~ |
| 3 | a (지역변수) | .rdata#2영역 | Bye |
| 4 | main()영역 | main()영역 | main()영역 |
| 5 | string | .rdata#2영역 | Bye |

## 다차원 배열

[Type] [배열이름] [행][열] = {[값]};

*   값 초기화 방법
    *   int arr [2][4] = { {1,2,3,4} , {5,6,7,8} };
    *   int arr[2][4] = {1,2,3,4,5,6,7,8};
*   2차원 배열은 평면상의 행열을 채우는 것과 유사하다 (ex 아파트 동/호수)

*   포인터로 배열 표현
    *   배열 : int (?) [4] , 여기서 개당 int 크기의 4개의 값 공간을 가지고 있다는 것을 의미 (== 배열)
    *   (?) : 배열이름 혹은 포인터 사용
        *   배열이름 사용시, 1차원 배열 ( int arr[4] )
        *   포인터 사용시, 2차원 배열 ( int *arr[4]  == int arr [?][4])
            *   한 행에 4개의 값의 공간크기를 가진 배열을 가리키는 *arr 생성

int arr[2][4] = { {1,2,3,4} , {5,6,7,8} };  
int(*pp)[4] = arr; //[ pp 주소는 arr 주소 ]   
~int(**ptr)[4] = (int **)arr;~  // arr은 주소값(==&arr)이기에, 다중 포인터를 할시에 **값을 타고 가게 된다** .  
//( (int**)arr == 0x0f ) -> 0x0f: 0001 (*ptr) -> **0x0001 : ? 오류 (**ptr)**

![](https://blog.kakaocdn.net/dna/oADkP/btsIkehzstV/AAAAAAAAAAAAAAAAAAAAADTgWu7VCjwHk7qjtZ5Cm5MVWRT6uj4Tp3xzKzq5G14Q/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=%2FMS9dByyxFjWNKRosXM%2BOBsoQWc%3D)

> 원문: https://gradualprecision.tistory.com/34

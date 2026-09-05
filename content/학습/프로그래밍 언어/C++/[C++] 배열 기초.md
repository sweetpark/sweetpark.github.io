---
title: 배열 기초
tags: [C++, 배열]
created: 2026-09-05
modified: 2026-09-05
---

# 배열 기초

1. 배열 형식          
2. 배열 특징          
3. 포인터 vs 배열  
4. 배열 함수 인자

## 배열 형식

[TYPE] [배열이름][개수] // int arr[10];

*   배열의 크기는 상수
    *   배열의 크기를 지정해주거나 초기화를 진행하여 사이즈를 알려주어야 함

## 배열 특징

*   배열의 이름 == 배열의 시작 주소
*   배열은 순차적으로 저장되어있음 (인덱스)
*   배열의 연산 또한 포인터와 유사하게 한칸의 차지하고 있는 바이트만큼 이동
*   포인터와 참조를 이용한 배열의 표현

int arr[10] = **{}; // 배열의 초기화 ( 모든 인덱스에 해당하는 수를 0으로 초기화 )**  
  
**int& ref = *(arr + 2);** // (0, 1, 2, 3...) ->3번째 인덱스로 이동   
ref = 10; // arr[2] = 10 과 동일한 표현

*    배열의 선언 방법
    *   개수 지정 : int arr[10] = {};
        *   10개의 각 int 크기(4Byte)를 가진 배열 생성
    *   값으로 초기화 : int arr[] = {1,2,3,4,5};
        *   5개의 각 int 크기(4Byte)를 가진 배열 생성

## 포인터 vs 배열

1. 포인터  
const char * ptr = "Hello World"  
  
2. 배열  
char test[] = "Hello World";

*   포인터
    *   .data영역에 "Hello World" 저장된 값을 가리키는 ptr 생성
    *   따라서, 해당 값의 인덱싱도 불가능하며, 수정또한 불가능하다 (const  값)
*   배열
    *   "Hello World"를 값을 저장하는 것은 동일하지만, 해당 값을 직접 저장하고 있음
    *   따라서, 해당 값의 수정이 가능

## 함수 인자

void Test (char a[]) // 컴파일러가 알아서 포인터로 변환해서 사용  
{  
    a[2] = 'A';  
}  
  
/*  
void Test (char * a) // 컴파일러가 알아서 포인터로 변환해서 사용  
{  
    a[2] = 'A';  
}  
*/  
  
//반환값 존재  
char * RetTest( char a[] )  
{  
    a[2] = 'X';  
      
    return a;  
}  
  
char test[] = "Hello World";  
Test(test); // 배열의 이름은 포인터  
  
cout << test; // HeAlo World  출력  
  
char *retTest = RetTest(test);

*   배열의 경우 함수인자로 넘겨질 경우 표현 방법이 2개이다.
    *   1. void Test ( char a [] )
    *   2. void Test ( char * a )
*   배열을 반환할경우
    *   포인터를 사용
    *   char* Test( char *a)

> 원문: https://gradualprecision.tistory.com/33

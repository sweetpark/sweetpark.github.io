---
title: "조건문과 반복문"
tags: [C++, 조건문, 반복문]
created: 2026-09-05
modified: 2026-09-05
---

# 조건문과 반복문

조건문, 반복문

조건문에 들어갈 수 있는 형식  
  
1. bool  
2. 비교연산  
3. 논리연산  
4. 함수호출  
5. 문자열 비교  
6. 포인터 검사  
7. 컴마(,)연산자  
8. 삼항연산자

## 조건문

*   조건문에 들어갈 수 있는 형식

| bool | if (true) {} |
| --- | --- |
| 비교연산 | if ( a > b ) {} |
| 논리연산 | if ( a ==1 && b ==2 ) {} |
| 함수호출 | if (TEST()) {} // bool TEST{ return true; } |
| 문자열비교 | if ("compare" == "fail" ) {} |
| 포인터검사 | if(ptr) { // ptr이 null이 아닐때 } // if (!ptr) {// ptr이 null 일때} |
| 컴마(,)연산자 | if ( (a= b+1), a>20 ) {} // b+1이 a에 대입되고, a가 20보다 크면 수행 |
| 삼항연산자 | if ( (a > b) ? true : false ) {} |

*   if - else 구문
    *   if  ( 조건문 )  { //TODO }  + else if ( 조건문 )  { // TODO }  + else { // TODO}
    *   조건에 해당하는 부분이 성공하면 TODO 진행 아니면, 뛰어넘음
*   switch 구문
    *   switch 조건 : 정수 or enum (열거형 값)
    *   case 별로 break를 하지 않으면 switch문을 탈출하지 못하고 다음 case를 진행하게 된다 (주의)
    *   default: 의 경우 case에 처리되지 않으면 마지막에 처리하게 되는 부분 (else 부분과 유사하다)

```cpp
#include <iostream>
#include <cstdlib>
#include <ctime>
#include <algorithm>

using namespace std;

enum
{
    ROCK = 0,
    SISSORS,
    PAPER,
    END
};

int main()
{
    srand(static_cast<unsigned int>(time(nullptr)));
    

  
    string input;
    cout << "(1)ROCK (2)SISSORS (3)PAPER" << endl;
    cout << "Enter Your Choice : ";
    cin >> input;

    // 소문자 변환
    transform(input.begin(), input.end(), input.begin(), ::tolower);

    int choice;
    if (input == "rock" || input == "1")
        choice = 1;
    else if (input == "sissors" || input == "2")
        choice = 2;
    else if (input == "paper" || input == "3")
        choice = 3;
    else
    {
        cout << "Invalid Choice, sorry program end!";
        return 1;
    }
     
    //상대방
    int random = rand() % 3;

    //switch ( 값 ) => 값 : 정수 혹은 enum 형식
    switch (random)
    {
    case ROCK:
        cout << "상대방 : ROCK" << endl;
        if (choice == 3)
        {
            cout << "이겼습니다." << endl;
        }
        else if (choice == 2)
        {
            cout << "졌습니다" << endl;
        }
        else
        {
            cout << "비겼습니다" << endl;
        }
        break;
    case SISSORS:
        cout << "상대방 : SISSORS" << endl;
        if (choice == 3)
        {
            cout << "졌습니다." << endl;
        }
        else if (choice == 2)
        {
            cout << "비겼습니다" << endl;
        }
        else
        {
            cout << "이겼습니다" << endl;
        }
        break;
    case PAPER:
        cout << "상대방 : PAPER" << endl;
        if (choice == 3)
        {
            cout << "비겼습니다." << endl;
        }
        else if (choice == 2)
        {
            cout << "이겼습니다" << endl;
        }
        else
        {
            cout << "졌습니다" << endl;
        }
        break;
    default:
        break;
    }

    cout << "가위 바위 보를 종료합니다 \n" << endl;

    return 0;

}
```

## 반복문

*   반복문의 종류
    *   for문 : 초기화, 조건 검사, 증감식을 포함하는 반복문
    *   while문 : 조건이 true이면, 반복하는 반복문
    *   do-while문 : 한번은 무조건 실행되고, 이후 조건에 따라 반복하는 반복문
    *   범위기만 for문 (C+11) : 모든 요소를 순회하는 반복문
*   반복문의 형태
    *   for문
        *   for ( [초기화] ;  [조건식];  증감식 ) { // TODO}
        *   for문의 경우 초기화, 조건식, 증감식을 모두 선택적으로 넣을 수 있다
        *   ex) for ( ; ; ) {} , for (int a= 0; ; ) {} , for( int num =0; ; ++num) { }
    *   while문
        *   while (조건식) {}
        *   while문의 경우 조건식이 필수로 필요함
        *   ex) while (true) { // 무한 루프} , while (a>b) {}
    *   do-while문
        *   do { } while(조건식)
        *   최소 한번은 실행되는 특징을 가지고, 이후 작업은 while과 동일하다
    *   범위기반 for문
        *   for (type element : container)  {}
        *    컨테이너에 가지고 있는 data값을 element로 하나씩 순회하여 사용
        *   자세한 사항은 아래 링크 참고

```cpp
int iter_test()
{
#define MAX_STAR_COUNT 7
#define HEIGHT 4
#define REVERSE  HEIGHT -2

    for (int j = 0; j < HEIGHT; ++j)
    {
        for (int i = MAX_STAR_COUNT; i > j; --i) // j 인덱스에 따라 값이 달라짐
        {
            cout << " "; // 7까지 밀어내기
        }

        for (int i = 0; i < 2*j +1; ++i)
        {
            cout << "*"; // " "이후 *찍기
        }
        cout << endl;
    }

	// 위와 반대로
    for (int j = REVERSE; j >=0 ; --j)
    {
        for (int i = MAX_STAR_COUNT; i > j; --i)
        {
            cout << " ";
        }

            
        for (int i = 0; i < 2 * j + 1; ++i)
        {
            cout << "*";
        }
        cout << endl;
    }
    
    

    return 0;
}

/*
result

       *
      ***
     *****
    *******
     *****
      ***
       *

*/
```

> 원문: https://gradualprecision.tistory.com/27

---
title: 문자와 문자열
tags: [C++, 문자, 문자열]
created: 2026-09-05
modified: 2026-09-05
---

# 문자와 문자열

문자 자료형

## 문자 자료형

*    1 BYTE = 8 bit (256개 표현 가능)

| 자료형 | 자료형 | 크기 | 범위 |
| --- | --- | --- | --- |
| char | signed char, __int8 | 1 BYTE | -128 ~ 127 |
| unsigned char | - | 1 BYTE | 0 ~ 255 |
| wchar_t | __wchar_t | 2 BYTE | 0 ~ 65,535 |
| char8_t (C++20) | - | 1 BYTE | UTF-8 유니코드 저장 가능 |
| char16_t | - | 2 BYTE | UTF-16 유니코드 저장 가능 |
| char32_t | - | 4 BYTE | UTF-32 유니코드 저장 가능 |

*   char : 알파벳 / 숫자 문자를 나타냄
*   wchar_t : 와이드 문자 형식 또는 멀티바이트 문자를 지원함 (유니코드 지원)
    *   wchar_t인 경우 문자형식이 다르기 때문에, std:: cout 이 아닌 std::wcout을 사용해야한다.
    *   #include <cwchar> -> wcslen()

```cpp
#include <iostream>
#include <cwchar>
#include <locale>

using namespace std;

int main(void){
	char a = 'A';
    
    // char 변수 출력
    cout << a << endl;
//result : A
//-----------------------------------------------------------    
    wchar_t ws[] = L"프로그래밍!";

    // 로케일 설정 (UTF-8 사용)
    locale::global(locale("ko_KR.UTF-8"));

    // 와이드 문자열 출력
    wcout.imbue(locale("ko_KR.UTF-8"));

    for (int i = 0; i < wcslen(ws); i++) {
        std::wcout << ws[i];
    }
    std::wcout << std::endl;

//result : 프로그래밍!
//-----------------------------------------------------------

    return 0;
}
```

## 접두어 / 접미어

| 구분 | 자료형 | 선언 | 값 표현 |
| --- | --- | --- | --- |
| 접미어 | long | l | L |
| 접미어 | unsigned short | u | u |
| 접미어 | unsigned long | ul | UL |
| 접미어 | long long | ll | LL |
| 접미어 | unsigned long long | ull | ULL |
| 진수표현 | 16진수 | - | 0x |
| 진수표현 | 8진수 | - | 0 |
| 진수표현 | 2진수 | - | 0b |
| 접두어 | 배열 | a / arr | - |
| 접두어 | bool | b | - |
| 접두어 | char | c | - |
| 접두어 | double | d | - |
| 접두어 | float | f | f |
| 접두어 | 파일 기술자 | fd | - |
| 접두어 | 파일 포인터 | fp | - |
| 접두어 | int | i | - |
| 접두어 | 포인터 | p | - |
| 접두어 | 함수포인터 | fpn | - |
| 접두어 | 참조형 변수 | r | - |
| 접두어 | 문자열 | str | - |
| 접두어 | unsigned int | u / w |  |
| 접두어 | wchar_t | - | L |
| 접두어 | const char* | - | u8 / R"(값)" (대부분 생략) |
| 접두어 | char16_t | - | u |
| 접두어 | char32_t | - | U |

```cpp
#include <iostream>
#include <string>
#include <cstdio>
#include <fcntl.h>

using namespace std;

int main(void)
{  

    // 접미어 사용 예제
    
    long lValue = 100L;
    unsigned int uValue = 200u;
    unsigned long ulValue = 300ul;
    long long llValue = 400ll;
    unsigned long long ullValue = 500ull;
    
    //[진수 표현]
    int hex = 0x1A; // 16진수 1A (10진수 26)
    int oct = 075; // 8진수 75 (10진수 61)
    int bin = 0b1010; // 2진수 1010 (10진수 10)

    

    // 접두어 사용 예제
    
    int arrNumbers[5] = { 1, 2, 3, 4, 5 };
    bool bIsValid = true;
    char cGrade = 'A';
    double dRate = 4.5;
    long double x = 42.0L;
    float fHeight = 5.9f;
    /*int fdFile = open("example.txt", O_RDONLY);*/ // Linux
    FILE* fpFile = fopen("example.txt", "r");
    int iCounter = 10;
    int* pNumber = &iCounter;
    void (*pfnFunction)() = nullptr;
    int& rReference = iCounter;
    std::string strName = "Alice";
    unsigned int uAge = 30;
    unsigned int wWeight = 70;

    wchar_t ws[] = L"Hello, World!";
    const char* utf8 = u8"Hello, World!";
    char16_t utf16[] = u"Hello, World!";
    char32_t utf32[] = U"Hello, World!";
    const char* raw = R"(Hello, "World"!)"; // C++ 11이상

}
```

> 원문: https://gradualprecision.tistory.com/22

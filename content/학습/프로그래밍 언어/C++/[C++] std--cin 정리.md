---
title: "std::cin 정리"
tags: [C++, cin]
created: 2026-09-05
modified: 2026-09-05
---

# std::cin 정리

## std::cin이란?

*   C++ 에서 입력을 받을 수 있도록 하는 기능 ( #import istream )
*   std::cin은 기본적으로 공백을 기준으로 입력을 받는다
    *   공백 : 개행 ( \n ) , 공백 (space bar) , 탭 (tap)

```cpp
#import <istream>

int main(void)
{
	int num;
    string str;
    
    std::cin >> num >> str;
    // 입력 : 2 string
    std::cout >> num >> endl >> str >> endl;
    //출력
    // 2 \n  string
    
    return 0;
 }
```

## 주의할점 

1. 입력버퍼와 입력 상태값을 가진다 ( cin 은 하나의 객체 )

2. 잘못 입력값이 들어갔을 경우 위의 2가지를 변경시켜주어야 한다.

*   상태 값 변경하는 방법
    *   std::cin.clear()
*   입력 버퍼 비우는 방법
    *   std::cin.get()
    *   혹은
    *   std::cin.ignore(size, 원하는 문자가 나올때까지)  // 디폴트 값 : std::cin.ignore(1, EOF)

```cpp
#include <iostream>

int main(void)
{
	int num;
    std::cin >> num;
    
    while(std::cin.fail())
    {
    	std::cin.clear();
        
        while (std::cin.get() != '\n')
        {
        	continue;
        }
        // 혹은 std::cin.ignore(size, '\n');
        // size 의 경우는 : constexpr auto max_size = std::numeric_limits<std::streamsize>::max();
        // 스트림 사이즈의 최대값을 size로 설정 (전체 버퍼값중에서 '\n' 찾기 -> 해당 부분까지 무시)
    	
        std::cin >> num;
    }
    
    std::cout << num;

}
```

> 원문: https://gradualprecision.tistory.com/10

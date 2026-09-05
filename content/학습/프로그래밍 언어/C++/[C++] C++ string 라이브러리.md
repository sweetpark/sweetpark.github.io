---
title: "C++ string 라이브러리"
tags: [C++, string]
created: 2026-09-05
modified: 2026-09-05
---

# C++ string 라이브러리

STRING 문자열 라이브러리  
  
#include <string>

코딩테스트를 준비하며, 문자열 기반 문제들이 있는 것 같아 준비를 해보았다.

기본적인 string 라이브러리를 통해 손쉽게 문자열을 파싱하고, 조작하기가 편리하게 되어있었다.

하지만, 문득 string 라이브러리를 사용하지 않고 하려다보니 막막해서 찾아보게 되었다...

## 동적할당

. 물론, 처음 초기화한 값을 그대로 상수처럼 사용한다면 상관은 없겠지만, 문자열끼리 더하거나 없애거나 복사하거나 등의 기능을 하기위해서는 동적할당 개념이 들어가야한다고 생각했다.

동적할당이란?  
  
 - 한정된 메모리를 효율적으로 사용하기 위해서 컴파일 시점이 아닌 프로그램 런타임 시점에 메모리를 할당하고 다 사용하면 해제해줌으로써 메모리를 효율적으로 사용하는 것을 말한다.

*   문자열과 동적할당간의 연관성?

문자열 또한 정수처럼 초기화를 하여 그 값을 적절한 곳에 사용하면 된다. 하지만 문자열을 조작하기 위해서는 문자열을 연산할 수 있는 기능이 필요한데, 이를 하기 위해서는 특정 함수 및 제공되는 라이브러리가 필요하고, 이를 통해 편리하게 문자열을 조작하도록 만들어두었다.

(ex_ str**시리즈 , string 라이브러리 등.. )

문득, 이런 라이브러리를 사용하지 않고 어떻게 구현해야할까를 고민하던 도중 직접 해보기로 마음을 먹었었다.

2개의 문자열을 합치는 예제를 이용해 시도를 해보았다.

 정적할당이든 동적할당이든 첫 문자열에 대한 할당을 마치고 나면, 이후 두개의 문자열을 합치기 위한 작업이 들어가야하는데, 막상 하려고 하니 블랙아웃된 듯이 아무런 생각이 나지 않았다..

그러던 도중 런타임에 메모리 공간을 할당해주는 동적할당이 생각이 났고, 새로운 문자열을 공간을 만들어 해당 공간에 2개의 문자열을 합치는 코드를 구현했고, 마지막에 NULL 문자를 통해 문자열의 끝을 제공해주니  두개의 문자열이 합쳐질 수 있었다. 

```cpp
char string1[] = "test";
char string2[] = "!!!!";

size_t capacity = strlen(string1) + 1;
char* sum_string = new char[capacity];
strcpy(sum_string, string1);

int str1_end_position = strlen(string1);
int str2_position = 0;

for (int str2_position = 0 ; string2[str2_position] != '\0'; str2_position++)
{
	if (str1_end_position +1 >= capacity)
	{
		capacity *= 2;
		char* new_string = new char[capacity];
		strcpy(new_string, sum_string);
		delete[]sum_string;
		sum_string = new_string;
	}
	sum_string[str1_end_position++] = string2[str2_position];
	sum_string[str1_end_position] = '\0';
	cout << sum_string << endl; 
}
cout << strlen(sum_string) << endl;
delete[] sum_string;
```

## 마무리

*   현 코드의 경우 재할당의 부분은 임의로 한 것이니 안정성이 높은 특정 라이브러리를 사용하도록 해야겠다.
*   왠지 뻘짓 같았지만, 좋은 시간이었다~

![](https://t1.daumcdn.net/keditor/emoticon/friends1/large/008.gif)

> 원문: https://gradualprecision.tistory.com/7

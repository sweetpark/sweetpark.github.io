---
title: "C++ string 라이브러리"
tags: [C++, string]
created: 2026-09-05
modified: 2026-09-05
---

# C++ string 라이브러리

이 노트는 C++ 표준 `string` 라이브러리를 다룬다. `#include <string>`으로 제공되는 문자열 타입을 쓰면 문자열 연결·복사 같은 조작을 손쉽게 할 수 있는데, 그 내부 동작을 이해하기 위해 라이브러리 없이 두 문자열을 동적할당으로 직접 이어붙이는 예제를 보여준다. 결론적으로 이런 수동 구현은 원리 학습용이며, 실무에서는 안정성이 검증된 `std::string`을 쓰는 것이 바람직하다.

STRING 문자열 라이브러리  
  
#include <string>

기본 제공되는 string 라이브러리를 사용하면 문자열을 손쉽게 파싱하고 조작할 수 있다. 라이브러리 없이 문자열을 직접 다뤄보면 내부 동작 원리를 이해하는 데 도움이 된다.

## 동적할당

초기화한 값을 그대로 상수처럼 사용한다면 상관없지만, 문자열끼리 더하거나 없애거나 복사하는 등의 기능을 구현하려면 동적할당 개념이 필요하다.

동적할당이란?  
  
 - 한정된 메모리를 효율적으로 사용하기 위해서 컴파일 시점이 아닌 프로그램 런타임 시점에 메모리를 할당하고 다 사용하면 해제해줌으로써 메모리를 효율적으로 사용하는 것을 말한다.

*   문자열과 동적할당간의 연관성?

문자열 또한 정수처럼 초기화를 하여 그 값을 적절한 곳에 사용하면 된다. 하지만 문자열을 조작하기 위해서는 문자열을 연산할 수 있는 기능이 필요한데, 이를 하기 위해서는 특정 함수 및 제공되는 라이브러리가 필요하고, 이를 통해 편리하게 문자열을 조작하도록 만들어두었다.

(ex_ str**시리즈 , string 라이브러리 등.. )

라이브러리를 사용하지 않고 두 개의 문자열을 합치는 예제로 동작 방식을 살펴본다.

정적할당이든 동적할당이든 첫 문자열에 대한 할당을 마친 뒤, 두 번째 문자열을 이어 붙이는 작업이 필요하다. 런타임에 메모리 공간을 할당하는 동적할당을 이용해 새로운 문자열 공간을 만들고, 그 공간에 두 문자열을 순서대로 복사한 뒤 마지막에 NULL 문자로 끝을 표시하면 두 문자열이 합쳐진다.

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

*   위 코드의 재할당 로직은 간략화한 예시이며, 실제로는 안정성이 검증된 표준 라이브러리(std::string)를 사용하는 것이 바람직하다.

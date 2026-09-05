---
title: "배열"
tags: [C++, 배열, 백준]
created: 2026-09-05
modified: 2026-09-05
---

# 배열

백준 10807번 문제  
https://www.acmicpc.net/problem/10807  
(size에 맞는 배열 생성 후 일치한 정수 개수 찾기 문제)

## Vector 접근법 

*   장점
    *   동적으로 배열 생성 가능
    *   삽입 / 삭제가 간편하다

```cpp
#include <iostream>
#include <vector>

int main()
{
	std::vector<int> list_vector;
	int push_num = 0;
	int size = 0;
	std::cin >> size;

	for (int i = 0; i < size; i++)
	{
		std::cin >> push_num;
		list_vector.push_back(push_num);
	}
	
	int match_num = 0;
	int count = 0;
	std::cin >> match_num;
	
	for (int i : list_vector)
	{
		if (i == match_num)
			count++;
	}
	std::cout << count;

}
```

## Array 접근법

*   장점
    *   순차적 접근 가능
    *   인덱싱 활용가능 

```cpp
#include <iostream>

int main()
{
	int size = 0;
	int count = 0;
	std::cin >> size;

	int*  array_ptr = new int[size+1];
	for (int i = 0; i < size; i++)
	{
		std::cin >> array_ptr[i];
	}

	int match_num = 0;
	std::cin >> match_num;

	for (int i = 0; i < size; i++)
	{
		if (match_num == array_ptr[i])
			count++;
	}
	

	std::cout << count;

	delete[]array_ptr;

	

}
```

> 원문: https://gradualprecision.tistory.com/12

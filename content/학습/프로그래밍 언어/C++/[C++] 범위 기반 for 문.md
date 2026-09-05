---
title: 범위 기반 for 문
tags: [C++, 범위기반for문]
created: 2026-09-05
modified: 2026-09-05
---

# 범위 기반 for 문

**범위기반 for 문 이란?**

*   배열과 같은 iterator 구문에 있어서 값을 가져오는데 편의성을 주고자 C++11 에서 추가된 기능

```cpp
vector<int> vec_ = {1,2,3,4};

for (int value : vec_)
{
	std::cout << value << " ";
}
```

이러한 형태를 가진다.

**범위기반 for문 왜 사용하는가?**

*   장점
    *   처음과 끝을 지정해주지 않아도 순차적으로 iterator를 돌며 값을 가져올 수 있다.
    *   값을 순차적으로 가져오기에는 유용하다
*   단점
    *   인덱싱이 불편하다 ( 인덱싱을 줄이고자 가져온 형태이므로.. 일반적인 for문 추천...)
    *   값을 변경하기가 까다롭다 (값을 변경하려면 포인터 혹은 참조자를 사용해야한다.)

**끄저끄적 간단한 예제**

*   일반적인 for문 형태

```cpp
vector<int> vec_ = { 1,2,3,4,5 };

for (int i = 0; i < vec_.size(); i++)
{
	cout << vec_[i] << " ";
}
```

*   범위기반 for문 형태

```cpp
vector<int> vec_ = { 1,2,3,4,5 };

for (int value : vec_)
{
	cout << value << " ";
}
```

*   범위기반 for문 (값 변경 - pointer)

```cpp
int* test_ptr[4];

int test[4] = { 1,2,3,4 };

for (int i = 0; i < 4; i++)
{
	test_ptr[i] = &test[i];
}

vector<string> vec_string = { "abc", "cde" };

for (int* value : test_ptr)
{
	(*value)++;
}

for (int value : test)
{
	cout << value << " ";
}
```

*   범위기반 for문 (값 변경 - reference)

```cpp
vector<double> test_ = { 1.1, 1.2, 1.3, 1.4 };

for (double& value : test_)
{
	value++;
}

for (double change_value : test_)
{
	cout << change_value << " ";
}
```

후기..  
  
 순차적으로 어떠한 값들을 확인하는 용도로 사용할 때 주로 사용하고, 아닌 경우에는 굳이 사용하지 않을 거 같은 느낌이 든다... (아직까지는 일반적인 for 문 형태가 편한 느낌 (?)... 적응해야지...)  
  

![](https://t1.daumcdn.net/keditor/emoticon/friends1/large/021.gif)

> 원문: https://gradualprecision.tistory.com/3

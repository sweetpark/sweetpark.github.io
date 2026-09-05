---
title: "Template (클래스 템플릿)"
tags: [C++, 템플릿, 클래스템플릿]
created: 2026-09-05
modified: 2026-09-05
---

# Template (클래스 템플릿)

1. 클래스 템플릿                 
2. 클래스 템플릿 특수화      
3. 클래스 템플릿 다중 인자

## 클래스 템플릿

```cpp
template<typename T>
class RandomBox
{
public:
	T GetRandomData()
	{
		int idx = rand() % 10;
		return _data[idx];
	}
public:
	T _data[10];
};

int main()
{
    RandomBox<int> rb1;
}
```

*   class 선언 위에 템플릿 선언
*   class 내부에서 아직 미정된 타입인 부분에 템플릿 사용
*   인스턴스 생성시, <int> 처럼 타입 지정

## 클래스 템플릿 특수화

```cpp
template<typename T>
class RandomBox
{
public:
	T GetRandomData()
	{
		int idx = rand() % 10;
		return _data[idx];
	}
public:
	T _data[10];
};

// 템플릿 특수화 (double일 경우, 밑의 클래스가 호출됨)
template<>
class RandomBox<double> // 템플릿 특수화
{
public:
    //타입 double 지정
	double GetRandomData()
	{
		int idx = rand() % 10;
		return _data[idx];
	}
public:
    //타입 double 지정
	double _data[10];
};

int main()
{
    RandomBax<double> rb2;
}
```

1.  "template<>" 으로 템플릿 특수화 선언
2.  클래스 옆에 원하는 타입 지정 ( ex) class RandomBox<double> )
3.  원하는 타입으로 클래스 생성

## 클래스 템플릿 다중 인자

```cpp
template<typename T, int SIZE>
class RandomBox
{
public:
	T GetRandomData()
	{
		int idx = rand() % 10;
		return _data[idx];
	}
public:
	T _data[SIZE];
};

// 템플릿 특수화 (double일 경우, 밑의 클래스가 호출됨)
template<int SIZE> // SIZE는 인자로 사용됨
class RandomBox<double, SIZE> // 템플릿 특수화할경우 T가 double로 지정한 것이므로 <double, SIZE>를 해줘야한다
{
public:
	double GetRandomData()
	{
		int idx = rand() % 10;
		return _data[idx];
	}
public:
	double _data[SIZE];
};

int main()
{
	srand(static_cast<unsigned int>(time(nullptr)));
	
	// 타입을 지정 해줘야함 + template 인자값이 있다면 넣어줘야함
	RandomBox<int, 10> rb1;
	for (int i = 0; i < 10; i++)
	{
		rb1._data[i] = i;
	}

	RandomBox<float, 10> rb1;
	for (int i = 0; i < 10; i++)
	{
		rb1._data[i] = i;
	}

	RandomBox<double, 20> rb1;
	for (int i = 0; i < 20; i++)
	{
		rb1._data[i] = i + 0.5;
	}

	return 0;
}
```

*   템플릿으로 사용될 경우, 클래스는 인스턴스 생성시 어떤 타입으로 할지 지정해줘야함
*   템플릿 초기화가 무조건 <>이 아닌, 다중 인자일경우 원하는 타입 제외하고 나머지는 그대로 다시 작성해줘야함
    *   template<int SIZE>
    *   class RandomBax<double, SIZE> ...

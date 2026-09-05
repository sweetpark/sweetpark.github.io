---
title: "static"
tags: [C++, static]
created: 2026-09-05
modified: 2026-09-05
---

# static

static

## Static

*   생존시기 
    *   프로그램 시작 ~ 종료까지
    *   해당 데이터를 그대로 유지
*   접근 방법
    *   클래스 내부에서 static을 사용했을 시, 클래스 이름을 통해 호출 가능
        *   멤버함수 , 멤버 변수에 적용 가능
    *   일반 함수에 static을 사용했을 시, 해당 함수 범위내에서 접근 가능
    *   전역으로 사용했을 시, 해당 파일 내에서 접근 가능
*   사용이유
    *   메모리에 유지해야하는 값이 존재해야할 경우 사용
    *   클래스에서 모든 객체에 동일하게 사용되어야할경우 사용
*   static 사용 종류
    *   함수 내 정적 변수
    *   클래스 내 정적 변수
    *   클래스 내 정적 함수
    *   정적 전역 변수 및 함수

```cpp
class StaticTest
{
public:
	//정적 멤버 함수
	void static Print()
	{
		cout << "StaticTest class()" << endl;
	}

public:
	// 정적 멤버 변수
	static int _fix_count;
};

// 정적 함수 
int Test()
{
	// 정적함수 내 변수
	// 해당 Test()함수 내부에서만 사용 가능
	static int s_id = 1;
	return s_id++;
}

// 정적 함수 static
// 해당 파일 내부에서만 사용 가능
static void ExternTest()
{
	cout << "ExternTest() " << endl;
}

//전역으로 초기화 진행 (클래스외부에서 정의해야함)
// main 함수내부에서 초기화를 진행할경우 오류

int StaticTest::_fix_count;

int main()
{
	StaticTest::_fix_count = 5;
	StaticTest::Print();

	StaticTest s;
	cout << s._fix_count << endl;

	for (int i = 0; i < 5; i++)
	{
		cout << Test() << endl;
	}
}
```

> 원문: https://gradualprecision.tistory.com/40

---
title: "C++, C언어와의 유사성"
tags: [학습, 개발-CS, 언어, C++, 개발, namespace, 참조자]
created: 2026-09-05
modified: 2026-09-05
---

# C++, C언어와의 유사성

> [!NOTE]
> C++ 환경 구성, namespace, C언어와의 공통점, 참조자(Reference), 리터럴, new/delete.

## 📌 개념

### 환경 구성

- g++ 설치: `g++ -o [실행파일명] [코드명.cpp]` → `./[실행파일명]`
- vscode 설치
- ssh open

### namespace (class와 유사)

- 이름 공간 (클래스처럼 사용 가능)
- 해당 공간에 이름을 지정하여 작성하면 클래스 효과가 부여됨
- 이름을 작성하여 어느 부분에 속해 있는지 확인

```cpp
#include <iostream>

namespace test{
	int num=3;

	int sum(){
			num =num+3;
			return num;
	}
}
/* 이름을 지정안할경우 static 처럼 사용 가능 */
namespace {
	int static_num=0;

	int sum(){
		static_num=static_num+4;
		return static_num;
	}
}

int main(){
	int sum_=test::sum();
	std::cout << sum_ << std::endl;

	std::cout << sum() << std::endl;
	return 0;
}
```

- 중첩 namespace 예시

```cpp
namespace FOO
{
    int doSomething(int x, int y)
    {
          return x-y;
    }
    namespace HOO
    {
          int doSomething(int x, int y)
          {
                return x*y;
          }
    }
    namespace GOO
    {
        int doSomething(int x, int y)
        {
             return x+y;
        }
    }
}

int main(){
     std::cout << FOO::doSomething(4,3); // output ⇒ 1
     std::cout << FOO::HOO::doSomething(4,3); //output =12
     return 0;
}
```

- `std::[함수]` ⇒ std에 저장된 함수를 쓰겠다는 의미
- `::` (namespace)를 통해 객체지향적으로 코딩 가능
- `using namespace std;` ⇒ `std::` 생략 가능 (예: `cout << "이름 : ";`)

### C언어와의 공통점

- 자료형

```cpp
int i;
float a;
double c;
char s;
//c언어와 동일
```

- 변수/함수 명명 방법
    - 변수: 밑줄 (예: `number_of_people`)
    - 함수: 대문자 (예: `NumberOfPeople`)
- 포인터

```cpp
int arr[10];
int *parr = arr;
// int *parr = &arr[2] ## "arr +2" 동일한 표현

int i;
int *pi = &i;
//C언어와 동일
```

- 반복문 / 조건문: `for` / `while`, `if~else` / `switch`, `continue` / `break` 사용법 동일

### 참조자 (Reference)

- 참조자란?
    - 해당 변수의 또 다른 이름 (같은 것)
    - 별명 같은 느낌 (새로 만들지 않는 한 바뀌지 않음)
    - 원래 값이 소멸하면 다른 참조자들도 없어지지만, `const`를 사용하면 참조자가 없어지지 않음
- 사용 방법: `자료형& 변수명 = 초기화;`

```cpp
int a = 10;
int & another_a = a;

int *p = &a;
int*& another_p = p;
```

- 주의 사항
    - 참조자는 선언과 동시에 초기화(별명 선언)해야 함
    - 한 번 지정하면 변경 불가능
    - 참조 받는 변수가 지역변수일 경우, 소멸되면 error 발생 (`const`로 고정값 예외 처리 가능)

- 참조자 매개변수

```cpp
int change_val(int &p){ // int &p = num 과 동일한 표현 (함수가 호출될 때 선언되기 때문에)
    p = 3;
    return p;
}

int main(){
    int num = 10;

    std::cout << change_val(num) << std::endl;
}
```

### 리터럴 (literal)

- 리터럴이란? 소스코드 상에서 고정된 값
- 상수 리터럴

```cpp
int &ref=4; // error
//만약 된다면 ref=5 를 이행할시 리터럴값이 바뀌게되는 결과를 초래함
//4라는 숫자가 컴퓨터에서 사라짐 ㅋ

//but,
const int &ref =4; //상수 참조자로 사용할 경우 가능
int a = ref;
```

- 문자열 리터럴: C언어의 `""` 따옴표로 묶인 문자열이 대표적
- 배열 참조자
    - 불가능한 경우

```cpp
int& arr[2] {1,2};//불가능하다
=> 이유 : arr[0], arr[1] == *(arr+1) , *(arr+2)
=> 해당하는 값은 주소가 있다는 전제하에 값의 대입이 가능하므로,
참조자의 경우 주소가 존재하지 않아(메모리상에 존재하지 않아) 불가능
```

    - 가능한 경우

```cpp
int arr[3] = {1,2,3};
int& ref[3] = arr; //배열의 시작주소이기도 하지만, 배열의 이름이기도 함.
```

> [!NOTE]
> `int& ref[3] = arr;`에서 arr은 주소값을 준 것이라기보다는 배열의 이름을 지정했다고 생각하는 것이 나아 보임.

- reference를 리턴하는 함수

> [!NOTE]
> reference를 리턴으로 사용하는 이유
> - 구조체의 경우 값 복사 시 전체 복사를 해야 하므로 시간이 많이 소요됨 (새 주소를 가진 변수가 공간 차지)
> - 참조자를 사용하면 공간을 사용하지 않고 해당 주소만 바라보므로 연산 속도가 빠르고 공간도 차지하지 않는 이점이 있음

    - reference 리턴 오류 (지역변수 반환)

```cpp
int& function(){
	int a = 2;
	return a;
}

int main(){
	int b = function(); // int& a를 return
//function() ==> int&ref = a;
// int b = ref;
// a가 사라짐 (?)

	return 0;
}
//error (segment fault)
// function return 시에 a(지역변수) 가 사라지므로 참조를 할수가 없다
```

    - reference 리턴 정상 (매개변수 참조 반환)

```cpp
int& function (int& a){ // int& ref = b;
	a=5; // b=5;
	return a;
}

int main(){
	int b =2;
	int c = function(b);
// int& ref2=a;
// int  c= ref2;

	return 0;
}
```

    - const로 생명 연장

```cpp
int function(){
	int a =5;
	return a;
}
int main(){
	const int& c = function(); // 원래 초기화 했던 변수 값이 사라짐 (because of 지역변수)
	// 하지만 const를 사용하여 생명연장함
	std::cout << " c :  " << c << std::endl;
	return 0;
}
```

> [!NOTE]
> const 생명 연장 — 최초의 변수가 사라져도 해당 reference가 없어질 때까지 유지됨

### New / Delete

- `new` (malloc과 유사): 메모리 할당
- `delete` (free와 유사): 메모리 해제
    - new로 생성된 공간만 해제 가능 (Heap 영역)
    - `delete [포인터변수명]` / `delete &[변수명];`

```cpp
#include <iostream>

int main(){
	int *p = new int; // new int ( int 라는 공간 생성 후 주소값을 p 에 넣음 )
	*p =10;

	std::cout << *p << std::endl;

	delete p;
	return 0;
}
```

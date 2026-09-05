---
title: "C++ 객체"
tags: [학습, 개발-CS, 언어, C++, 개발, 참조자, 복사]
created: 2026-09-05
modified: 2026-09-05
---

# C++ 객체

> [!NOTE]
> 참조 변수, 접근지정자, 객체 동적 할당, 얕은 복사 vs 깊은 복사 정리.

## 📌 개념

### 참조 변수

- `&`를 사용하여 주소를 접근하여 사용하는 변수
- 실제 변수와 동일한 주소값을 가짐 (실제 변수의 별칭)
- 매개변수로 많이 사용

> [!NOTE]
> 인자 vs 매개변수
> - 인자(argument): 함수를 호출할 때 주는 값
> - 매개변수(parameter): 함수를 생성할 때 인자를 받는 형식을 정의하는 곳

```cpp
int func(int x , int y){ // int x , int y 매개변수
	...
}

int main(){
...
	func(10,20); //10, 20 => 인자
...
}
```

### 접근지정자

- default 접근지정자: `private`
- 접근지정자 범위: 인스턴스 기준 X, 클래스 기준 O

```cpp
인스턴스

- Point point (1,2); // heap 저장 ( 생성자 / 소멸자 존재)
- Point point = new Point(1,2); // stack 저장
=> point 가 인스턴스 하나를 의미

클래스
class Point{
	...
	private :
		int x;
	...
	...
};

class Geometry{
	...
	Point point;
	point.x // 접근 불가
	...
	...
};
```

### 여러 개의 객체 생성 → 배열 (동적 할당 new)

```cpp
int main(){
	Marine * marines[100];

	marines[1] = new marine(3,5);
	marine[0] = new Marine(2,3);

	delete marine[0]
	delete marine[1]
```

- 문자열 동적 할당

```cpp
void func ( ... , char *marine_name);
name = new char[strlen(marine_name) +1];
// new (동적배열 자료형)[(배열 개수)];
strcpy(name, marine_name);
// char * => 주소를 저장하기 때문에 값을 대입할 때는 strcpy 처럼 주소 복사를 이용해야함

Marine::~Marine(){
		if (name!=NULL){
			delete [] name; // delete [] 인 이유는 name 문자열을 동적배열로 할당했기 때문
		}
}
```

- 객체를 동적 할당(`new`)하면 ⇒ 소멸자는 따라와야 함 (습관적으로)

```cpp
class Test{
	private:
		char c;

	public:
		Test(char c){
			c= _c;
			std::cout << "생성자 호출" << c <<std::endl;
		}

		~Test(){
			std::cout << "소멸자 호출" << c <<std::endl;
		}

		void print();
};

void Test::print(){
			....
	}

int main(){
	Test test('a'); // 생성자 출력
	} //소멸자 출력
```

### 얕은 복사 vs 깊은 복사

- **얕은 복사**
    - 값을 복사
    - 주소를 가리키는 포인터의 경우 ⇒ 같은 주소를 가리키게 됨 (여기서 문제 발생 가능)

> [!NOTE]
> 복사 생성자와 얕은 복사의 문제
> - 문자열을 동적배열로 할당한 것을 복사 생성자가 같은 주소로만 복사하면,
> - 소멸 시 문제가 발생: 이미 다른 객체의 소멸로 해당 주소가 해제되었는데, 같은 주소를 바라보던 객체도 소멸 시 또 해제하려 해서 런타임 오류 발생!

- **깊은 복사**
    - 해당 주소를 복사하는 것이 아닌, 주소 안의 값을 복사함 (value 복사)
    - 동적 배열 같은 경우 깊은 복사를 이용해야 함

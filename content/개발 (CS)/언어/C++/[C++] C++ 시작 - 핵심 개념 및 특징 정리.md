---
title: "C++ 시작"
tags: [학습, 개발-CS, 언어, C++, 개발, 객체지향, 생성자]
created: 2026-09-05
modified: 2026-09-05
---

# C++ 시작

> [!NOTE]
> 객체·인스턴스·추상화·캡슐화·오버로딩·생성자·소멸자 등 C++ 객체지향 기초 개념.

## 📌 개념

### 객체란?

- 설계도와 같은 의미 (아직 세상에 나오지 못한 것)
- 인스턴스를 불러야 사용이 되는 것

```cpp
// 객체
class Animal{
	int boat;
	char star;
	//ANIMAL의 멤버함수
	public:
		void setDate(int date);
		void AddDay(int inc);
};

int main(){
	// "animal" 인스턴스 생성
	Animal animal;
	int date=10;
	int num=20231011;

	// animal 인스턴스 함수 (ANIMAL의 멤버함수를 실제로 사용하는 경우 => 인스턴스 함수라고 불름)
	animal.setDate(num);
	animal.AddDay(date);

//중요
// CLASS (ANIMAL) 은 빈껍데기
// 인스턴스 (animal)이 빈껍데기를 가져와다가 속을 채워넣어주는 역할 (진정한 사용가능)
```

### 클래스 안의 멤버함수 작성법

- 클래스 내부에서는 함수를 선언하기만 하고, 본문은 따로 작성

```cpp
class Date(){

	void ShowDate();
};

void Date::ShowDate(){
	...
	int date;
	...
}
```

- 단, 예외적으로 템플릿 클래스의 경우 클래스 내부에 함수 작성함

### 추상화 (멤버변수와 멤버함수를 만드는 행위)

- 현실 세계에 있는 행동 혹은 말을 컴퓨터에 주입하는 역할
- 예시
    - 핸드폰을 본다 / 전화를 한다 → 핸드폰이 하는 것 → 함수로 추상화
    - 휴대폰 배터리 잔량, 자기 자신 휴대폰 번호 → 핸드폰 상태 → 변수로 추상화
    - ⇒ 멤버 함수, 멤버 변수 생성

### 캡슐화

- 객체의 멤버변수를 외부에서 함부로 접근하지 못하도록 보호하는 행위
- 멤버변수 직접 접근 방지
- `private`(default 값) / `public`

**캡슐화 장점**

- 멤버함수만 알고 있으면 내부 로직을 굳이 알 필요 없는 장점이 존재
- 예시: 노트북 키보드 'a'를 입력하면 a가 눌린다. 장치 안에서 일어나는 행위를 알 필요 없음 → 캡슐화

### 인스턴스란?

- 객체를 세상 밖으로 꺼내어 사용하는 것 (껍데기에 영혼을 불어넣음)
- 모체(객체) - 자식(인스턴스) 간의 관계

```cpp
class Animal{
	~
};

int main(){
	Animal animal; // Animal : 객체 , animal : 인스턴스

	...

	return 0;
}
```

### 함수의 오버로딩

- 오버로딩이란? 같은 이름의 함수를 여러 개 생성할 수 있음 ("과적하다")
- 오버로딩 가능 조건: 함수 이름은 같으나 매개변수 인자값이 다를 경우

**매개변수가 함수를 찾아가는 단계** (예: char 인자 → int?)

1. 자신과 타입이 정확히 일치하는 함수를 찾아감
2. 승격 변환
    - char / unsigned char / short ⇒ int
    - unsigned short → int or unsigned int
    - float → double
    - enum → int
3. 임의 변환
    - 임의의 숫자 타입 → 다른 숫자 타입 (예: float → int)
    - enum → 임의의 숫자 타입 (예: enum → double)
    - 0은 포인터 타입이나 숫자 타입으로 변환
    - 포인터 → void 포인터
4. 유저 정의 타입으로 일치하는 것을 찾음

### 생성자

- 사용 이유
    - 클래스 내부 초기화 역할
    - 객체 생성 시 자동으로 호출되는 함수
- 방식
    - 암시적 방법 (선호): `Date day(2023, 'a');`
    - 명시적 방법: `Date day = Date(2023, 'a');`

```cpp
Class Date{
	int num1;
	char test;

	Date (int num, char test_char){
		num1 = num;
		test = test_char;
	}
	void Create(){};
};

void Date::Create(int num, char test_char){
		num1 = num;
		test = test_char;
}

int main(){

	Date day(2023, 'a');

	day.Create(2023,'b');

	return 0;
}
```

- 디폴트 생성자
    - 사용자가 생성자를 만들지 않으면 컴파일러가 자동으로 만듦 (매개변수 없는 빈 생성자)
    - 사용자가 생성자를 만들면 → 디폴트 생성자는 생성되지 않음
    - 명시적으로 디폴트 생성자 만들기 (C++11 이후)

```cpp
class Test {
	public:
		Test() = default;
	};
```

- 생성자 오버로딩: 인자값을 다르게 하여 여러 생성자 생성 가능

```cpp
class Date{
	int year;
	int month;
	int day;

	Date() {
		year=10;
		month=5;
		day=1;
	}

	Date(int year, int month, int day){
		year=year;
		month = month;
		day = day;
	}

};
```

- new / delete
    - `new` : 동적 배열과 동시에 생성자를 자동 호출. `변수명 = new [자료형] [크기]`
    - `delete` : 동적 할당 받은 것은 소멸 시 메모리 해제 필요. `delete 변수명`

- 복사 생성자: 오직 '생성'시에 호출됨

```cpp
Mairn::marin(const Marin& marin1){
	//생성자
	hp = marin1.hp;
	coord_x = marin1.coord_x;
	...
}
// const 작성으로 인해 상수화가 진행되어 원래값 변경 불가
```

### 소멸자

- 동적 배열을 해제하는 일
- 쓰레드의 lock을 푸는 역할
- `delete [] name` : name을 char 배열로 선언했기 때문에 delete 시 `[]`를 써줘야 함

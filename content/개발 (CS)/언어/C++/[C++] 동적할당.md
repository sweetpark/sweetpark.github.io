---
title: "동적할당"
tags: [C++, 동적할당]
created: 2026-09-05
modified: 2026-09-05
---

# 동적할당

1. malloc / free              
2. new / delete               
3. new [] / delete[]         
4. malloc과 new의 차이

## Malloc / Free

[MALLOC]  
  
[반환타입]* [포인터이름] = malloc([사이즈])  
ex) void* pointer = malloc(sizeof([Class]))  
  
[Free]  
free([포인터이름])  
ex) free(pointer);

*   특징
    *   사이즈 지정 가능
    *   생성자와 소멸자 호출 x
    *   void* 포인터형을 사용할경우 class국한되지 않고 캐스팅을 통해 사용할 수 있다.
*   주의
    *   HeapOverFlow 주의
        *   사이즈를 지정해줘서 사용하므로, 해당 사이즈를 넘어가는 주소공간에 접근할 위험이 존재 (힙오버플로우)
    *   Double Free
        *   이미 해제된 pointer의 경우, 한번 더 free를 해주면 크래쉬가 발생
    *   Use After Free
        *   이미 해제된 영역을 사용할경우 메모리 침법위반으로 인해 크래쉬가 발생
        *   사용되지 않는 메모리공간일경우 바로 크래쉬가 발생하지 않을 수 있음

```cpp
class Monster
{

public:
	int _hp;
	int _attack;
	int _test;
};

int main()
{
	// malloc , free의 경우 생성자, 소멸자를 호출하지 않는다!
	void* pointer = malloc(sizeof(Monster));

				// void형이기에 캐스팅을 통해서 어떤 포인터인지 알려준다.
	Monster* m1 = (Monster*)pointer;

	m1->_hp = 100;
	m1->_attack = 1;

	//HeapOverFlow
	// - 유효한 힙 범위를 초과해서 사용하는 문제
    // - 4 바이트 할당
	void* pointer4 = malloc(4);
	Monster* m2 = (Monster*)pointer4;

	// 다른 영역의 경우 할당받은 size가 아니기에, _attack or _test에서 크래쉬 남
	m2->_hp = 4;
	m2->_attack = 2;
	m2->_test = 4;

	free(pointer);
	free(pointer4);

	//Use After Free
	//이미 free된 공간이라서, 나중에 크래쉬가 날 수 있다.
	m1->_hp = 100;
    
}
```

## New / Delete

[NEW]  
  
[Type]* [포인터이름] = new [Type];  
ex) Monster* pointer = new Monster;  
  
[DELETE]  
delete [포인터이름];  
ex) delete pointer;

*   특징
    *   Type의 크기를 통해 사이즈 선정 가능 (int, double, class, ....)
    *   생성자와 소멸자를 호출
*   주의
    *   Double Delete
        *   이미 해제된 영역을 한번더 해제할 경우 크래쉬 발생
    *   Use Aftrer Delete
        *   이미 해제된 영역을 접근할경우 메모리 침범이 발생해 크래쉬가 발생

```cpp
class Monster
{

public:
	int _hp;
	int _attack;
	int _test;
};

int main()
{
	// new / delet
	//[Type]* [포인터이름] = new [Type]
	Monster* m3 = new Monster; // Monster Type
	m3->_hp = 100;
	m3->_attack = 10;
	m3->_test = 2;

	delete m3;
	//delete m3; // Double Delete
	//m3->_hp = 10; // delete된 영역 메모리 침범

	

}
```

## New [] / Delete[]

[NEW []]  
  
[Type]* [포인터이름] = new [Type] [[개수]];  
ex) Monster* pointer = new Monster [5];  
  
[DELETE []]  
delete[] [포인터이름];  
ex) delete[] pointer;

*   기본적으로 new/delete와 유사
*   배열처럼 동적할당이 가능

```cpp
class Monster
{

public:
	int _hp;
	int _attack;
	int _test;
};

int main()
{

	// new [] / delete[]
	// [Type] [포인터이름] = new [Type] [개수]
	Monster* m4 = new Monster[5];
	m4->_hp = 100;

	delete[] m4;

}
```

## Malloc과 New의 차이

*   Malloc
    *   포인터를 통해서 생성하고 싶을 때 사용
    *   사이즈를 직접 지정하고 싶을때 사용
*   New
    *   생성자와 소멸자를 이용하고 싶을 때 사용

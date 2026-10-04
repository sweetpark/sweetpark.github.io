---
title: "자료형"
tags: [학습, 개발-CS, 언어, C언어, 개발, 구조체, 자료형]
created: 2026-09-05
modified: 2026-09-05
---

# 자료형

> [!NOTE]
> C 언어의 구조체(struct), 문자열, size_t/ssize_t, extern, typedef, enum 등 자료형 정리.

## 📌 개념

### Struct (구조체)

- 구조체 형식

```c
struct point
{
	//멤버변수
	int x;
	char *name;
	int y;
};
```

- 구조체 선언

```c
//1.
struct point p1,p2,p3; // 구조체 만든 후 변수 선언

//2.
struct point{
	int x;
	int y;
}p1,p2,p3; // 구조체 만듬과 동시에 선언
```

- 구조체 초기화

```c
//선언과 동시에 초기화 가능
struct point p1 = {1,"park",3};

//선언 후 따로 초기화 불가능
struct point p1;
p1= {1,"park",3};
```

- 구조체 대입 (다른 사칙 연산자 사용 불가)

```c
struct point{
	int x;
	char*name;
	int y;
};

struct point pos;

pos.x = 1;
pos.name="park";
pos.y = 2;
```

- 구조체 연산 불가

```c
struct point{
	int x;
	char*name;
	int y;
};

struct point2{
	int x;
	char* name;
	int y;
};

struct point pos = {10,"park",20};
struct point2 pos1 = {10,"park",20};

pos == pos1  // 불가능 (자료형이 서로 다르기 때문에)
```

- 중첩 구조체

```c
#include <stdio.h>

struct class{
	int grade; //학년
	int class; //반
};

struct student{
	char * name;
//중첩된 구조체 선언
	struct class s; //구조체 변수 s를 구조체 student의 멤버 변수로 사용 (=중첩 구조체)
};


int main(){
	struct student s1;
	s1.name = "홍길동";
	s1.s.grade = 2; //2학년
	s1.s.class = 3;  //3반

	printf("%s은 %d학년 %d반 입니다.", s1.name, s1.s.grade, s1.s.class);

	return 0;
}
```

- 중첩구조체 초기화

```c
struct student s1 = {"홍길동",{2,3}};

// or

struct student s1 = {"홍길동",2,3}; //컴퓨터는 입력값을 순서대로 넣기 떄문에
```

- 구조체 배열 (멤버변수로 배열 사용 가능. 단, 배열 대입 연산 시 주의)

```c
#include <stdio.h>

struct student
{
	char name[100]; //구조체 멤버 변수에 배열을 사용해도 무관함.
	int code; //학번
	int grade; //학년
	int class; //반

}; //student 구조체를 Student로 쓴다.

int main(){
	struct student stu;
	stu.name = "홍길동"; //오류 발생
	strcpy(stu.name, "홍길동");
	return 0;
}
/*
오류발생 이유
- name이 배열 이름이므로 값을 할당할 수 없음
( 배열이름 == 주소값 // 배열이름 = 시작주소)
=> strcpy 사용 해야함
*/
```

- 구조체 포인터
    - `*` 연산은 `p`보다 나중이므로 괄호 `()`를 사용해야 함
    - 접근: `(*p).name` == `p->name`
    - `p->name`에서 `->` 화살표는 구조체 포인터에서만 사용 가능 (`struct student *p = &stu`)

```c
#include <stdio.h>

struct student
{
	char * no;
	char * name;
	int grade;
	int class;
};

int main(){
	struct student stu = {"20210000", "Hong", 1, 3};
	struct student * p = &stu; //구조체 포인터로 구조체 변수 stu 주소 가리키기.

	printf("학번 : %s 이름 : %s %d학년 %d반\n", stu.no, stu.name, stu.grade, stu.class); //구조체 변수로 일반적인 접근
	printf("학번 : %s 이름 : %s %d학년 %d반\n", (*p).no, (*p).name, (*p).grade, (*p).class); //구조체 포인터로 간접 접근 (*p 로 접근해야 함을 유의.)
	printf("학번 : %s 이름 : %s %d학년 %d반\n", p->no, p->name, p->grade, p->class);

	return 0;
}
```

> [!NOTE]
> 구조체의 주소 = 첫 멤버변수의 주소 (예: `&stu` == `&stu.no`)

- 자기참조 구조체 (자기 자신(구조체)을 다시 지칭) ⇒ 연결리스트에서 사용

```c
struct student
{
	char * no;
	char * name;
	int grade;
	int class;
	struct student * p;
};
```

- 외부참조 구조체 (외부의 다른 구조체를 지칭) ⇒ 중첩구조체

```c
struct student
{
	char * no;
	char * name;
	int grade;
	int class;
	struct score * p;
};
```

- 구조체 크기: 멤버변수의 크기만큼 구조체 크기가 결정됨

> [!NOTE]
> 패딩(Padding) 기법
> - 의미 없는 공간 ⇒ Padding
> - 메모리 정렬로 인해 4byte 단위로 컴파일하는 컴퓨터는 4byte 단위로 메모리를 구획하고 그 안에 멤버변수를 넣음
> - 예) 멤버변수 `int x; char a;` → int(4byte) | 3byte(Padding) + char(1byte)

### String (문자열)

- 배열 ← 문자열 저장: `strcpy(배열변수, "저장할 문자" or 문자열이 저장된 변수);`
- `char *` 사용: `char *test="hello"` → `printf("%s", test);`

### size_t / ssize_t

- `size_t` : unsigned int — `sizeof()` 연산자 사용 시 반환하는 타입
- `ssize_t` : signed int — I/O(입출력)의 read/write에 사용. 실패 시 -1 반환 (성공 시 양수)

> [!NOTE]
> ssize_t는 I/O가 일어날 때 반환값에 따라 error 처리를 할 수 있음

### Extern (외부 변수 선언)

- 외부에 정의된 변수를 가져다 쓰겠다는 의미 (다른 파일에 정의되어 있음)

### Typedef (구조체 별칭)

- 자료형 재정의

```c
// 1. 기본 struct 선언
struct test{
    int num;
    char *name;
};
// 선언: struct test [변수];

// 2. typedef 사용
typedef struct test{
    int num;
    char *name;
}new_test;
// 선언: new_test [변수];

// 3. (2와 동일한 결과)
struct test{
    int num;
    char *name;
}typedef GG;
// 선언: GG [변수];
```

### Typedef enum

- 특징
    - 중복된 값 사용 불가
    - 1로 정의 쉽게 가능
    - 굳이 `#define` 사용 안 해도 됨

```c
typedef enum{
    APP_NONE,
    APP_SCENE_1,
    APP_SCENE_2
}app_id_t;
```

### 구조체 심화 (도트 vs 화살표)

> [!NOTE]
> 1. 구조체 포인터: 화살표(→) 접근
> 2. 구조체 멤버변수: 도트(.) 접근
> 3. list 구조: 배열의 경우 인덱스 번호에 따라 포인터가 움직이는 형태
>    - 예) `test.test_plus[i].name` == `test.(*test_plus + i).name`

- 구조체 배열의 인덱스 접근 정리 (예: `struct Arr *arr` 멤버를 가진 구조체의 배열)
    - `arr[0]`, `arr[1]`, `arr[2]` ... 는 각각 `{name, price}`를 가진 원소를 가리킴
    - `test.arr[i].name` == `test.(*(arr + i)).name` (인덱스 `i`만큼 포인터를 이동시켜 역참조 후 멤버 접근)

- 중첩구조체

```c
struct Test{
	char * test;
	struct Test *test_plus;
}

struct Test test;
test.test_plus->name // test.(*test_plus).name 동일한 표현
```

- 구조체 배열 (리스트)

```c
struct Test{
	char *name;
	struct Arr_test *test_plus;
}

struct Arr_test{
	int x;
}

struct Test test;

struct Test arr_test[10];
malloc(arr_test,sizeof(Test)*10)

//  A -> B == (*A멤버변수).B멤버변수
// test_plus[i] == *(test_plus + i)
// test_plus[i].x == *(test_plus + i).x
printf("%d",test.test_plus[i].x);
```

- 구조체 포인터 (구조체 포인터 = &구조체)

```c
struct Test{
	char *name;
	struct Test * test_plus;
};

int main(){
	struct Test test;

	test.name = "new";

	test.test_plus = &test;
	printf("%s",test.test_plus->name) // new 출력

	retrun 0;
}
```

- 도트(.) vs 화살표(→)
    - 도트연산자 `.` : 구조체 원소 접근
    - 화살표연산자 `->` : 포인터를 사용하여 구조체 원소 접근

```c
struct Test{
	char * name
	int year;
	int price;
	char *company;

	struct Test * test_plus;
}

int main (void){
	struct Test test;

	// 구조체 사용 도트 (test)
	test.name = "game"
	test.year = 1998;
	test.price = 10000;
	test.company = "JSC";

	//구조체 사용 화살표 (test_plus)
	test.test_plus->name = "new_game";
	test.test_plus->year = 2023;
	test.test_plus->price = 5000;
	test.test_plus->company = "JS";

	//구조체 포인터
	stuct Test * test_pointer; //구조체 Test 포인터 생성
	test_pointer = &test; //구조체 변수 test 주소

	test_pointer->name = "pointer";
	test_pointer->year = 2020;
	test_pointer->price = 20000;
	test_pointer->company = "Anlab";

	//구조체 포인터 안에 구조체
	test_pointer->test_plus->name = "new_pointer";
	test_pointer->test_plus->year = 2021;
	test_pointer->test_plus->price = 0;
	test_pointer->test_plus->company = "friend jiran";
```

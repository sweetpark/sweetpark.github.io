---
title: "C언어 인프런"
tags: 
created: 2026-09-05
modified: 2026-09-05
---
---
## 문자(배)열

- Window VS Linux
	- puts : Window 입력
	- fgets : Linux 입력
	- gets : Window 출력
	- 

---
## Call By Value VS Call By Reference

- Call By Value
	- 값 복사
- Call By Reference
	- 포인터를 이용한 값 복사 (원본 주소에 기입)
```


// Call By Reference
void add_1(int* num)
{
	*num = *num + 1;
}

int main(void)
{
	int num = 10;
	add_1(&num);
	// num = 11 출력
}
```


---
## Caller VS Callee

- 권장
	- Caller에서 동적 할당을 하고 넘겨야, 안전함
	- 포인터는 가리키는 원본 주소만 알뿐, 크기를 알 수 없음 (Callee 에서 동적할당하게 되면, size정보도 caller쪽으로 넘겨줘야함)
```

#include <stdio.h>
#include <stdlib.h> // 1. malloc, free를 쓰기 위해 필수 

void Print(char* str) 
{ 
	printf("%s\n", str); 
}

char* create(void)
{
	 // 2. malloc 문법 오류 수정: malloc은 바이트 크기(숫자) 1개만 인자로 받습니다.
	 char* ptr = (char*)malloc(12 * sizeof(char)); // 또는 malloc(12);
	if (ptr == NULL) return NULL; // 메모리 할당 실패 검사 
	
	ptr[0] = 'H';
	ptr[1] = 'E';
	ptr[2] = '\0'; // 3. 문자열 끝을 알리는 널 문자(\0) 필수! 
	return ptr;
} 


int main(void) 
{ 
	char str[12] = "Hello world";
	char* ptr = NULL; 
	
	Print(str); 
	ptr = create(); 
	if (ptr != NULL) 
	{ 
		Print(ptr); // HE 출력 
		free(ptr); // 동적 할당 해제 
		ptr = NULL; // 댕글링 포인터 방지 
	} 
	return 0; 
}
```

- Callee  동적할당 사용시 해결방법 
	- size 같이 보내기
```

char* create_with_size(int* size)
{
	char* ptr = (char*) malloc(sizeof(char) * 12);
	ptr[1] = 'H';
	ptr[2] = 'e';
	ptr[3] = \0;
	
	*size = 12;
	
	return ptr;
}

int main(void)
{
	int size = 0;
	char* ptr = create_with_size(&size);

	// ...
	
	return 0;
}
```


---

## L-Value VS R-Value
- L-Value
	- 변수 (담는 공간)
- R-Value
	- 실제 값 (상수, 변수에 저장된 실제 값)

---
## struct
- struct 구조 안에, 자기 참조 포인터를 사용시 struct를 사용해야함
```
typedef struct USER()
{
	char name[32];
	unsigned int age;
	struct USER* pNext;
}USER;

// USER 가 typedef로 정의되기전에 구조체 안에서 자기참조 포인터가 사용되므로 "struct USER*" 사용 
```


---
## 공용체

# [C언어] 공용체(Union) 완벽 정리: IP 주소 예제로 이해하기

## 1. 공용체(Union)란?

- 구조체(`struct`)는 각 멤버 변수가 **독립적인 메모리 공간**을 차지합니다.
    
- 공용체(`union`)는 모든 멤버 변수가 동일한 메모리 시작 주소를 공유(Overlap)합니다.
    
- **메모리 크기:** 멤버 변수 중 **가장 크기가 큰 타입의 크기**로 결정됩니다.
    

> [!NOTE]
> 
> **언제 사용할까?**
> 
> 하나의 메모리 공간을 상황에 따라 다양한 관점(전체 4바이트 정수로 보거나, 1바이트 4개로 쪼개서 볼 때 등)으로 다룰 때 사용합니다. (예: 네트워크 패킷 파싱, 하드웨어 레지스터 제어)
> 
>   

## 2. 예제: IP 주소와 4바이트 정수 매핑

IPv4 주소(`192.168.0.1`)는 점으로 구분된 1바이트 크기의 숫자 4개이면서, 동시에 하나의 32비트(4바이트) 정수입니다.


```
#include <stdio.h>
#include <stdint.h>

// 4바이트 크기의 공용체 정의
typedef union _IP_ADDR 
{
    uint32_t number;        // 4바이트 부호 없는 정수 관점
    unsigned char ip[4];    // 1바이트 단위 4개 배열 관점
} IP_ADDR;

int main(void)
{
    IP_ADDR data = {0};

    // 1. 1바이트 배열(ip)로 값 대입
    data.ip[0] = 192; // 0xC0
    data.ip[1] = 168; // 0xA8
    data.ip[2] = 0;   // 0x00
    data.ip[3] = 1;   // 0x01

    // 2. 출력하여 메모리 공유 확인
    printf("IP 주소 표기  : %d.%d.%d.%d\n", data.ip[0], data.ip[1], data.ip[2], data.ip[3]);
    printf("정수 10진수 표기: %u\n", data.number);
    printf("정수 16진수 표기: 0x%08X\n", data.number);

    return 0;
}
```

### 실행 결과

```
IP 주소 표기  : 192.168.0.1
정수 10진수 표기: 16820416
정수 16진수 표기: 0x0100A8C0
```

## 3. 메모리 구조 및 바이트 순서 (Endianness)

위 실행 결과에서 `0xC0A80001`이 아니라 `0x0100A8C0`으로 출력되는 이유는 x86/x64 환경의 **리틀 엔디안(Little-Endian)** 방식 때문입니다.

  

```
[메모리 주소 낮은 쪽] ──────────────────────────► [메모리 주소 높은 쪽]
┌──────────────┬──────────────┬──────────────┬──────────────┐
│    ip[0]     │    ip[1]     │    ip[2]     │    ip[3]     │
├──────────────┼──────────────┼──────────────┼──────────────┤
│  192 (0xC0)  │  168 (0xA8)  │   0 (0x00)   │   1 (0x01)   │
└──────────────┴──────────────┴──────────────┴──────────────┘
 ▲ LSB (최하위 바이트)                         ▲ MSB (최상위 바이트)
 
 ──► uint32_t number로 읽을 때: 0x01 00 A8 C0 (16,820,416)
```

|**구분**|**바이트 0**|**바이트 1**|**바이트 2**|**바이트 3**|
|---|---|---|---|---|
|**`ip` 배열**|`ip[0]` (`0xC0`)|`ip[1]` (`0xA8`)|`ip[2]` (`0x00`)|`ip[3]` (`0x01`)|
|**리틀 엔디안 기준**|LSB (최하위)|||MSB (최상위)|
|**`number` 변수**|\multicolumn{4}{c|}{**`0x0100A8C0`**}|||

## 4. 핵심 포인트 요약

1. **메모리 절약 및 다중 관점 접근**: `sizeof(IP_ADDR)`는 8바이트가 아닌 **4바이트**입니다.
    
2. **타입 안전성(`uint32_t`)**: `int` 대신 `uint32_t`나 `unsigned int`를 사용하여 부호 비트(MSB)로 인한 원치 않는 음수 처리를 방지합니다.
    
3. **엔디안 주의**: 하드웨어/OS 아키텍처에 따라 바이트 배치 순서(빅 엔디안 vs 리틀 엔디안)가 달라질 수 있습니다.


---
## 구조체 메모리 할당 (+ 전처리기 pragma)

# [C언어] 구조체 메모리 정렬(Padding) 및 1바이트 패킹 요약

## 1. 기본 정렬 원리: `struct DATA`

구조체 크기는 단순 합산(`4 + 1 + 5 = 10바이트`)이 아니라, **가장 큰 멤버 자료형(`int` = 4바이트)의 배수**에 맞춰 끝에 패딩이 붙습니다.

  

Plaintext

```
[ 0 ][ 1 ][ 2 ][ 3 ]  --> int num (4B)
[ 4 ]                  --> char ch (1B)
[ 5 ][ 6 ][ 7 ][ 8 ][ 9 ]  --> char list[5] (5B)
[10 ][11 ]             --> [패딩 2B] (4의 배수 맞춤용)
─────────────────────────────────────────────────
총 크기: 12바이트
```

> [!TIP]
> 
> `ch`와 `list[5]` 사이에 패딩이 없는 이유: `char`는 1바이트 단위 정렬이므로 오프셋 5번 자리에서 바로 시작해도 CPU 접근에 문제가 없기 때문입니다.
> 
>   

## 2. 1바이트 단위 패킹 (`#pragma pack`)

패딩 없이 **데이터 원본 크기 그대로(10바이트)** 정렬하려면 `#pragma pack(push, 1)`과 `#pragma pack(pop)`을 사용합니다.

  

### 핵심 전처리기 사용법

- `#pragma pack(push, 1)` : 이전 정렬 상태를 백업하고 1바이트 정렬 적용
    
- `#pragma pack(pop)` : 원래 정렬 상태로 복원 (**다른 코드/헤더 오염 방지**)
    

## 3. 비교 코드 및 실행 결과

C

```
#include <stdio.h>
#include <stddef.h>

// 1. 기본 정렬 (4바이트 기준 패딩 삽입 -> 12바이트)
struct DATA {
    int num;        // 4B (offset: 0)
    char ch;        // 1B (offset: 4)
    char list[5];   // 5B (offset: 5)
                    // 2B 패딩 (offset: 10~11)
};

// 2. 1바이트 패킹 (패딩 제거 -> 10바이트)
#pragma pack(push, 1)
struct PACKED_DATA {
    int num;        // 4B (offset: 0)
    char ch;        // 1B (offset: 4)
    char list[5];   // 5B (offset: 5)
};
#pragma pack(pop)

int main(void)
{
    printf("[기본 정렬] struct DATA 크기        : %zu 바이트\n", sizeof(struct DATA));
    printf("  └ offset -> num:%zu, ch:%zu, list:%zu\n\n", 
           offsetof(struct DATA, num), offsetof(struct DATA, ch), offsetof(struct DATA, list));

    printf("[1바이트 패킹] struct PACKED_DATA 크기: %zu 바이트\n", sizeof(struct PACKED_DATA));
    printf("  └ offset -> num:%zu, ch:%zu, list:%zu\n", 
           offsetof(struct PACKED_DATA, num), offsetof(struct PACKED_DATA, ch), offsetof(struct PACKED_DATA, list));

    return 0;
}
```

### 실행 결과

Plaintext

```
[기본 정렬] struct DATA 크기        : 12 바이트
  └ offset -> num:0, ch:4, list:5

[1바이트 패킹] struct PACKED_DATA 크기: 10 바이트
  └ offset -> num:0, ch:4, list:5
```
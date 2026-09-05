---
title: 비트연산
tags: [C++, 비트연산]
created: 2026-09-05
modified: 2026-09-05
---

# 비트연산

비트연산

## 비트란?

- 0 과 1로서 숫자를 표현 하기 위해 사용되는 것을 비트라고 함.  
(이진수 체계에서 0 또는 1의 값을 가질 수 있는 최소한의 데이터 단위)  
ex) 0000 0010 => 256(2^8) 128(2^7) 64(2^6) 32(2^5) 16(2^4) 8(2^3) 4(2^2) 2(2^1) 1(2^0)

*   숫자 , 문자, 이미지 ,오디오 등 모든 형태의 데이터는 이진수로 변환되어 저장 및 처리됨
*   효울적인 데이터 처리와 저장을 가능하게함 (최소한의 단위로 표현하므로, 사람이 아는 숫자 체계보다 리소스 투입이 적다)

## 비트 연산

*   AND 연산
    *   두개의 비트가 1로 같으면 1,
    *   다르면 0 을 출력
    *   [예제]
    *   1 + 1 -> 1
    *   1 + 0 -> 0
    *   0 + 1 -> 0
    *   0 + 0 -> 0
*   OR 연산
    *   두개의 비트 중 한개라도 1이면 1,
    *   서로 0 일경우 0
    *   [예제]
    *   1 + 1 = 1
    *   1 + 0 = 1
    *   0 + 1 = 1
    *   0 + 0 = 0
*   XOR 연산
    *   두개의 비트가 같으면 1,
    *   아니면 0
    *   [예제]
    *   1 + 1 = 1
    *   1 + 0 = 0
    *   0 + 1 = 0
    *   0 + 0 = 1
*   NOT 연산
    *   1이면 0, 0 이면 1
    *    [예제]
    *   1 -> 0
    *   0 -> 1

```cpp
#include <iostream>
using namespace std;

void printBits(unsigned int flag)
{
	for (int i = 0; i <8; ++i)
	{
		// flag & (1u << i ) 도 가능 =>  0000 0001에서 1을 i만큼 왼쪽으로 이동
		if (flag &(128u >> i)) // 1000 0000 -> 0100 0000 -> 0010 0000 -> ... (1000 0000에서 1을 i만큼 오른쪽으로 이동)
			cout << "1";
		else
			cout << "0";
		if (i == 3)
			cout << " "; // 중간에 비트를 띄위기 위해 사용
	}
	cout << endl;
}

int main()
{

	unsigned char flag;
	unsigned char flag1  = 8u; // 1Byte = 8bit ( 0000 1000 )
	unsigned char flag2 = 10u; // (0000 1010)

	flag = ~flag1;
	printBits(flag); // result : 1111 0111

	flag = flag1 & flag2;	// result : 0000 1000
	printBits(flag);
	
	flag = flag1 | flag2; // result : 0000 1010
	printBits(flag);

	flag = flag1 ^ flag2; // result : 0000 0010
	printBits(flag);

}
```

> 원문: https://gradualprecision.tistory.com/24

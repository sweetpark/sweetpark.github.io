---
title: "메모리 구조 및 const"
tags: [C++, 메모리구조, const]
created: 2026-09-05
modified: 2026-09-05
---

# 메모리 구조 및 const

메모리 구조, const

## 메모리구조

| 메모리구조 | 역할 |
| --- | --- |
| Code 영역 | 실행할 프로그램의 코드 (Text 영역이라고도 불림) |
| Data 영역 | rodata 영역 : 읽기전용 영역 (ex_ 상수, 상수형 문자열, printf의 중괄호 부분) |
| Data 영역 | .data 영역 : 초기값이 있는 경우, 정적변수(static), 전역변수 |
| Data 영역 | .bss 영역 : 초기값 없는 경우, 읽기/쓰기 가능 |
| Heap 영역 | 동적할당 공간 |
| Heap 영역 | 메모리의 낮은 주소에서 높은 주소로 저장 |
| stack 영역 | 지역변수와 매개변수 저장 |
| stack 영역 | 메모리의 높은 주소에서 낮은 주소로 할당 |

*   Heap 과 Stack은 서로 공간을 공유
*   OverFlow
    *   일정한 공간을 공유하기에, 둘다 많이 할당하여 더이상 채울 수 없을경우 overflow 오류를 일으킴
    *   먼저 도달한 쪽의 이름을 따서, Heap Overflow, Stack OverFlow라고 불림
*   .bss와 .data의 차이점
    *   .bss의 경우 main이 실행되기 전에 .data영역으로 전역변수들이 0으로 할당되서 들어감

## Const

*   상수값처럼 고정된 값으로 사용하기 위해서 사용
*   어떠한 고정값을 수정할 시 일일이 찾아가서 수정하는 것이 아닌, 한번에 수정할 수 있음
*   어떠한 값이 일반적인 값이 아니라, 상수화 되서 관리되고 있는 것을 알아차릴 수 있음 (가독성이 좋다)

```cpp
const int PERFECT_SCORE = 100;

int main(void)
{
	int studentScore = 100;
    
    if (studentScore == PERFECT_SCORE)
    	cout << "만점이다!" << endl;
    
    return 0;
}
```

*   const 는 상수처럼 사용되며, 컴파일 도중에 값이 변경되거나, PERFECT_SCORE라는 변수에 값을 넣을 수가 없다.
*   따라서, 읽기모드 영역인 .rodata에 들어갈거라고 예상되지만 그렇지 않다.
*   (* C++ 표준에도 해당 부분은 언급되어있지 않으며, 컴파일러에 따라 다른 영역에 처리가 된다)

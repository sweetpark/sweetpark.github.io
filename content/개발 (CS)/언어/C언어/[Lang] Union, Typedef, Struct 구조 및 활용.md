---
title: "Union, Typedef, Struct 구조 및 활용"
tags: 
created: 2026-09-05
modified: 2026-09-05
---

> [!NOTE]
> C언어의 Union 구조와 특징, Struct와의 메모리 차이, Typedef를 이용한 별칭 부여, 그리고 실무 활용 사례 정리.
> (Struct/Typedef 기본 문법은 [(CS) 자료형](%5BCS%5D%20자료형%20-%20핵심%20개념%20및%20특징%20정리.md) 참고, 본 문서는 Union 중심 + 3개 개념의 구조적 비교에 집중)

## 📌 개념

## Union 이란?

- 여러 개의 멤버 변수가 **동일한 메모리 공간을 공유**하는 자료형
- Struct와 선언 문법은 동일하지만, 멤버들이 각자의 메모리를 갖는 Struct와 달리 Union은 **가장 큰 멤버의 크기만큼만 메모리를 할당**하고 모든 멤버가 그 공간을 겹쳐서 사용함
- 따라서 **한 시점에는 오직 하나의 멤버만 유효한 값**을 가짐 (다른 멤버에 값을 쓰면 이전 멤버 값은 덮어써짐)

```c
union Data {
    int i;
    float f;
    char str[20];
};

int main() {
    union Data data;

    data.i = 10;
    printf("%d\n", data.i);      // 10

    data.f = 220.5;
    printf("%f\n", data.f);      // 220.500000
    printf("%d\n", data.i);      // 쓰레기값 (data.i는 이미 덮어써짐)

    return 0;
}
```

## Struct vs Union 메모리 비교

| 구분 | Struct | Union |
| --- | --- | --- |
| 메모리 할당 | 멤버별로 각각 할당 (합산) | 가장 큰 멤버 크기만큼만 할당 (공유) |
| `sizeof` | 모든 멤버 크기의 합 (+ 패딩) | 가장 큰 멤버의 크기 (+ 패딩) |
| 동시 유효 값 | 모든 멤버 동시 사용 가능 | 한 번에 하나의 멤버만 유효 |
| 용도 | 서로 다른 데이터를 묶어서 관리 | 메모리 절약, 타입 재해석(Type Punning) |

```c
struct S { int i; float f; char str[20]; };
union  U { int i; float f; char str[20]; };

printf("%lu\n", sizeof(struct S)); // 4 + 4 + 20 = 28 (+ 패딩)
printf("%lu\n", sizeof(union U));  // 20 (가장 큰 멤버 str[20] 기준)
```

## Typedef로 Union 별칭 만들기

Struct와 동일하게 `typedef`를 붙여 `union` 키워드 없이 사용할 수 있음.

```c
// 1. 기본 union 선언
union Data {
    int i;
    float f;
};
// 사용: union Data d;

// 2. typedef 사용
typedef union Data {
    int i;
    float f;
} Data_t;
// 사용: Data_t d; (union 키워드 생략 가능)
```

## Union 활용 사례

- **메모리 절약**: 동시에 사용되지 않는 여러 타입 중 하나만 저장하면 되는 경우 (예: 상태값에 따라 int/float 중 하나만 쓰는 상황)
- **타입 펀닝 (Type Punning)**: 동일한 메모리를 다른 타입으로 해석 (예: `float`의 비트 패턴을 `int`로 읽어 IEEE754 구조 분석)

```c
union FloatBits {
    float f;
    unsigned int u;
};

union FloatBits fb;
fb.f = 3.14f;
printf("%u\n", fb.u); // 3.14f의 비트 패턴을 정수로 해석
```

- **통신 프로토콜 / 패킷 파싱**: 동일한 바이트 배열을 헤더 구조체(Struct)와 raw byte 배열(Union 멤버) 양쪽으로 접근할 때 사용
- **Tagged Union (태그 붙은 유니온)**: Union 만으로는 현재 어떤 멤버가 유효한지 알 수 없으므로, 별도의 `enum` 타입 필드를 Struct로 함께 묶어 "지금 어떤 멤버가 유효한지"를 표시

```c
typedef enum { TYPE_INT, TYPE_FLOAT } DataType;

typedef struct {
    DataType type; // 태그: 현재 유효한 멤버가 무엇인지 표시
    union {
        int i;
        float f;
    } value;
} TaggedData;

TaggedData d;
d.type = TYPE_FLOAT;
d.value.f = 3.14f;

if (d.type == TYPE_FLOAT) {
    printf("%f\n", d.value.f);
}
```

> [!NOTE]
> 주의사항
> - Union의 멤버 중 마지막으로 쓴 것 외의 값을 읽으면 **정의되지 않은 동작(undefined behavior)** 이 될 수 있음 (컴파일러/플랫폼에 따라 다르게 동작)
> - 멤버 간 크기 차이가 크면 작은 멤버 쪽에 패딩이 생길 수 있어 `sizeof` 값이 예상과 다를 수 있음
> - 멀티바이트 타입(`int`, `float` 등)을 바이트 단위(`char[]`)로 재해석할 때는 시스템의 엔디안(Endian)에 따라 결과가 달라짐

## 🔗 참고

- [(CS) 자료형 - 핵심 개념 및 특징 정리](%5BCS%5D%20자료형%20-%20핵심%20개념%20및%20특징%20정리.md)

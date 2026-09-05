---
title: 자료형
tags: [C++, 자료형]
created: 2026-09-05
modified: 2026-09-05
---

# 자료형

자료형 (정수형, 소수형)

## 자료형

*   1 BYTE = 8bit (256개를 표현 가능)
*   1bit => 0 또는 1로 이루어짐

| 구분 | 자료형 | 자료형 | 크기 | 범위 |
| --- | --- | --- | --- | --- |
| 기본형 | void | - | - (빈값) | - (빈값) |
| 정수형 | bool | - | 1 Byte | false(=0) / true(=1) |
| 정수형 | short | __int16 | 2 Byte | (약) -32000 ~ +32000 |
| 정수형 | unsigned short | unsigned __int16 | 2 Byte | (약) 0 ~ +64000 |
| 정수형 | int | __int32, long | 4 Byte | (약) -21억 ~ +21억 |
| 정수형 | unsigned int | unsigned __int32 | 4 Byte | (약) 0 ~ +42억 |
| 정수형 | long long | __int64 | 8 Byte | ( 약) -922경 ~ +922경 |
| 실수형 | float | - | 4 Byte | (약) 3.4E +/- 38 (7자리 숫자) |
| 실수형 | double | - | 8 Byte | (약) 1.7E +/-308 (15자리 숫자) |

## 자료형 오버플로우 

```cpp
int main()
{
    using namespace std;

    __int16 num1 = 33000; // short
    cout << num1 << endl;
}

// result : -32536
```

*   해당 범위 : -32000 ~ 32000
*   해당 범위를 (+)넘어서는 숫자를 입력할 경우 오버플로우 오류가 발생함

## 자료형 언더플로우

```cpp
int main()
{
    using namespace std;

    __int32 num1 = -22222222222222222; // int
    cout << num1 << endl;
}

//result : -1303176078
```

*   해당 범위 : 약 -21억 ~ 21억
*   해당범위에서 (-)넘어서는 숫자를 입력할 경우 언더플로우 오류가 발생함

정수형 주의점  
  
1.  메모리는 한정되어있으므로 너무 큰 값을 담으려는 자료형을 남발하면 안됨  
2.  오버플로우 / 언더플로우를 주의하며, 값의 오류가 일어나지 않도록 주의하며 사용

> 원문: https://gradualprecision.tistory.com/21

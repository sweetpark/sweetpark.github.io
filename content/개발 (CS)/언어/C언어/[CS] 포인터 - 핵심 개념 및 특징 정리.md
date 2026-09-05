---
title: "포인터"
tags: [학습, 개발-CS, 언어, C언어, 개발, 포인터]
created: 2026-09-05
modified: 2026-09-05
---

# 포인터

> [!NOTE]
> C 포인터 기본(배열 포인터, 포인터 연산)과 함수 포인터.

## 📌 개념

### 배열 포인터

- `char a[10] = {a,b,c,d,e,f,g,i,j,k};`
- 포인터 선언
    - `char *ptr;`
    - `ptr = a;`
    - 원래는 `ptr = &a` 이지만 배열이므로 `a`로 선언
- 포인터 위치 변경: `ptr = ptr + 3;`

> [!NOTE]
> 현재 ptr은 'd'를 가리키고 있음
>
> 응용)
> ```c
> char *test = "string";
> char *ptr = test;
> ptr += 3;
> printf("%s", ptr); // → "ing" 출력 (주의: 움직여진 위치부터 문자열 출력)
> ```

- `*ptr = 'W';`

> [!NOTE]
> 'd'의 값이 → 'W'로 변경
> `a → {a,b,c,W,e,f,g,h,i,j,k};`

### 함수 포인터

- 형태: `[함수 return 자료형] (*[포인터변수명])([인자 자료형]);`

## 💻 예시

```c
#include <stdio.h>

char* name_func(char* name){
    char *name_tmp=name;

    return name_tmp;
}

int main(void){

		char* (*name_func_p)(char* name);
    char *name="pwy";

    name_func_p=name_func;

    printf("%s\n",name_func(name));

    return 0;
}
```

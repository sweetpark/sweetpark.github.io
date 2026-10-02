---
title: "함수"
tags: [학습, 개발-CS, 언어, C언어, 개발, 문자열, 매크로]
created: 2026-09-05
modified: 2026-09-05
---

# 함수

> [!NOTE]
> C 표준 문자열 함수(string.h), 동적 할당, 권한 체크, 매크로 정리.

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 문자열 함수 (String)

#### sprintf / snprintf (버퍼에 값 저장 → output 지정 가능)

- `sprintf(char str1[], "%d", num);` — 정수형을 문자열로 바꾸어 저장

> [!NOTE]
> str1은 사이즈가 지정되어 있는 편이 좋음 (`char *str1`은 지양)

- `snprintf(버퍼, 크기, "넣을값 + %?", %에 들어갈 변수);` — 버퍼에 해당 값 저장
    - 예) `char cmd[128] = {0, }; snprintf(cmd, 128, "kill -9 %d\n", getppid());`

> [!NOTE]
> `system(char *cmd)` — 쉘을 호출하여 cmd 명령어를 실행
> ⇒ snprintf로 버퍼에 명령을 만든 뒤 `system(buffer);`로 쉘에서 명령 실행 가능

#### strcat (문자 이어 붙이기)

- `strcat([배열1], [배열2]);` — string1 + string2
- 예) `strcat(const char *string1, const char *string2);`

> [!NOTE]
> 인자가 `const char *`이므로 배열 사이즈가 지정되어 있어야 함수를 사용할 수 있음

```c
#include <stdio.h>
#include <string.h>

int main(void){
    char str_plus[10];

    for(int i=1; i<73; i++){
        char str_[10]="U-2021-";
        sprintf(str_plus,"%02d,",i);
        strcat(str_,str_plus);
        printf("%s",str_);
    }

    return 0;
}
```

#### strcpy (문자 복사)

- `strcpy([배열1], [배열2]);` — 배열2 → 배열1로 복사
- 예) `strcpy(char *string1, char *string2);`

#### strcmp / strcasecmp (문자 비교)

- `strcmp(char *string1, char *string2);` — 배열1, 배열2 비교
    - 배열이 같으면: 0
    - 배열1이 크면: 1 (양수)
    - 배열2가 크면: -1 (음수)

#### strlen (문자 개수 출력)

- `strlen(char *string);` — 문자 개수 세기 (NULL 제외)

#### strchr (원하는 문자 이후로 출력)

- `strchr(char *string, '[원하는문자]');` — 2번째 인자로 주어진 문자 이후 출력
- 예) `printf("%s", strchr(name, 'a'));`

#### strtok_r (구분자를 이용한 파싱)

- `strtok_r(data, 구분자, 지칭할 포인터);`

### memset

- 동적 배열의 값을 초기화하는 용도

```c
col_action = (COL_ACTION *)malloc(sizeof(COL_ACTION) *col_action_cnt)
memset(col_action, 0 ,sizeof(COL_ACTION)*col_action_cnt);
//memset ( 시작 주소, 바꿀문자, 크기 )
```

- 주의: `memset`의 바꿀 문자는 char 형이므로, 다른 자료형으로 초기화하는 경우 잘못된 값을 추출할 수 있음 (웬만하면 초기화 용도로만 사용할 것)

### malloc (동적 할당)

```c
int n;
int *arr;
scanf("%d", &n);
arr= (int*)malloc(sizeof(int) * n);
```

- `arr` → int 형 배열을 n개 만든다. (⇒ `int arr[n]`와 동일한 결과)

### 권한 체크 함수 - access()

- `R_OK` : 파일 존재 여부, 읽기 권한
- `W_OK` : 파일 존재 여부, 쓰기 권한
- `X_OK` : 파일 존재 여부, 실행 권한
- `F_OK` : 파일 존재 여부
- 예) `access(errlog, R_OK)` ⇒ 1 or 0

### 매크로 (내장 매크로 / 매크로 함수)

- Error 활용 매크로 (변수처럼 사용)
    - `__FILE__` : 파일 이름
    - `__FUNCTION__` : 함수 이름
    - `__LINE__` : 줄번호
    - 예) `printf("%s \n", __FILE__);`

| 매크로 | 타입 | 내용 |
| --- | --- | --- |
| `__func__` | 문자열(%s) | 매크로가 호출된 함수를 출력함 |
| `__LINE__` | 정수(%d) | 매크로가 출력된 라인번호 출력 |
| `__FILE__` | 문자열(%s) | 매크로가 출력된 파일을 출력함 |
| `__DATE__` | 문자열(%s) | 빌드가 이뤄진 날짜 출력 |
| `__TIME__` | 문자열(%s) | 빌드가 이뤄진 시간을 출력 |

- 매크로 함수 (`#define`)

```c
#define ADD(x,y) x+y
```

- 문자열로 바꿔주는 연산자 `#`
    - `#define ADD(x,y) #x "+" #y`

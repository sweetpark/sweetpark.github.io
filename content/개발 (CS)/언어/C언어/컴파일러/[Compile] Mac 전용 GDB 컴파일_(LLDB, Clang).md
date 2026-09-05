---
title: "Mac 전용 GDB 컴파일 (LLDB, Clang)"
tags: 
created: 2026-09-05
modified: 2026-09-05
---

#  Clang & LLDB 

---

## 1. Clang 컴파일러 (Compile & Link)

### 1.1 필수 플래그 (Flags)
| 플래그 | 설명 |
| :--- | :--- |
| `-g` | **디버그 심볼 포함** (LLDB/GDB 디버깅을 위한 필수 옵션) |
| `-Wall` | **모든 주요 경고(Warning) 활성화** (잠재적 버그 사전 탐지) |
| `-Wextra` | 추가적인 상세 경고 옵션 활성화 |
| `-c` | 링킹을 하지 않고 **오브젝트 파일(`.o`)만 생성** |
| `-o <이름>` | 출력 실행 파일(또는 바이너리) 이름 지정 |
| `-I <경로>` | 헤더 파일(`.h`) 탐색 디렉터리 경로 추가 |

---

### 1.2 단일 및 멀티 파일 빌드 명령어

#### ① 단일 파일 컴파일 & 디버그 빌드
```bash
clang -g -Wall main.c -o app
````

#### ② 멀티 파일 수동 분할 빌드 (추천 훈련 방식)

Bash

```
# 1단계: .c 파일들을 오브젝트 파일(.o)로 각각 컴파일
clang -g -Wall -c main.c -o main.o
clang -g -Wall -c utils.c -o utils.o

# 2단계: 오브젝트 파일들을 하나로 링크하여 실행 파일 생성
clang main.o utils.o -o app
```

#### ③ 디렉터리 내 모든 .c 파일 한 번에 빌드

Bash

```
clang -g -Wall *.c -o app
```

## 2. LLDB 디버거 (CLI Debugging)

### 2.1 디버거 세션 시작 및 종료

Bash

```
lldb ./app    # 디버거 실행 및 대상 바이너리 로드
(lldb) q      # 디버거 종료 (quit)
```

### 2.2 중단점 (Breakpoint) 설정 및 관리

|**기능**|**LLDB 명령어**|**단축어**|
|---|---|---|
|**함수 이름으로 중단점**|`breakpoint set --name main`|`b main`|
|**특정 파일의 줄 번호**|`breakpoint set --file main.c --line 15`|`b main.c:15`|
|**특정 파일의 함수**|`breakpoint set --file utils.c --name add`|`b utils.c:add`|
|**중단점 목록 확인**|`breakpoint list`|`br li`|
|**중단점 삭제**|`breakpoint delete <번호>`|`br del 1`|

### 2.3 실행 제어 (Execution Control)

|**기능**|**LLDB 명령어**|**단축어**|**설명**|
|---|---|---|---|
|**프로그램 실행**|`run`|`r`|중단점까지 프로그램 실행|
|**다음 줄 실행**|`next`|`n`|Step Over (함수 내부 들어가지 않음)|
|**함수 내부 진입**|`step`|`s`|Step Into (호출되는 함수 안으로 이동)|
|**계속 진행**|`continue`|`c`|다음 중단점을 만날 때까지 계속 실행|
|**함수 탈출**|`finish`|`finish`|현재 함수를 끝까지 실행하고 바깥으로 빠져나옴|

### 2.4 변수 및 메모리 주소 검사 (Inspection)

#### ① 변수 값 및 주소 출력 (`print` / `p`)

Plaintext

```
(lldb) p input           # 변수 input의 값 출력
(lldb) p &input          # 변수 input의 메모리 주소 출력 (0x7fff...)
(lldb) p ptr             # 포인터 변수 ptr이 가리키는 주소 출력
(lldb) p *ptr            # 포인터 ptr이 가리키는 실제 메모리 값 출력 (역참조)
(lldb) frame variable    # 현재 스택 프레임의 모든 지역 변수 출력 (줄여서: frame var)
```

#### ② 메모리 덤프 (`examine` / `x`)

명령어 형식: `x/[개수][포맷][단위] [주소]`

  

- **포맷:** 
	- `x`(16진수) : 주로 16진수로 표현
	- `d`(10진수)
	- `s`(문자열)
	- `i`(기계어)
    
      
    
- **단위:** `
	- b`(1byte)
	- `h`(2byte)
	- `w`(4byte) -> 32 bit  주소 체제
	- `g`(8byte) -> 64 bit 주소 체제
    

Plaintext

```
(lldb) x/4xw &input      # &input 주소부터 4바이트(w) 16진수(x) 4개 덤프
(lldb) x/5wd ptr         # ptr 주소부터 4바이트(w) 10진수(d) 5개 덤프 (배열 추적)
(lldb) x/s str_ptr       # str_ptr 주소의 문자열 출력
```

#### ③ 값 변경 감시 (`watchpoint`)

Plaintext

```
(lldb) watchpoint set variable finalResult   # finalResult 값이 변경될 때 정지
(lldb) watchpoint set expression -- &input  # 해당 메모리 주소의 값이 변경될 때 정지
```

### 2.5 함수 스택 추적 (Call Stack)

Plaintext

```
(lldb) bt                # 현재 콜 스택(함수 호출 경로) 전체 출력 (backtrace)
(lldb) frame select 0    # 현재 스택 프레임으로 이동
(lldb) frame select 1    # 나를 호출한 상위 함수 스택 프레임으로 이동
(lldb) p $sp             # Stack Pointer 레지스터 주소 확인
(lldb) p $fp             # Frame Pointer 레지스터 주소 확인
```

## 3. Clang/LLDB (Mac) $\leftrightarrow$ GCC/GDB (Linux) 매핑표

|**구분**|**Mac (LLDB / Clang)**|**Linux (GDB / GCC)**|**비고**|
|---|---|---|---|
|**컴파일러**|`clang`|`gcc`|옵션 거의 동일 (`-g`, `-Wall`, `-c`)|
|**디버거 실행**|`lldb ./app`|`gdb ./app`|CLI 구동 방식 동일|
|**중단점 설정**|`b main`|`b main`|동일|
|**실행 / 진행**|`r`, `n`, `s`, `c`|`r`, `n`, `s`, `c`|동일|
|**콜 스택 추적**|`bt`|`bt`|동일|
|**변수 출력**|`p var`, `p &var`|`p var`, `p &var`|동일|
|**메모리 덤프**|`x/4xw &var`|`x/4xw &var`|동일|

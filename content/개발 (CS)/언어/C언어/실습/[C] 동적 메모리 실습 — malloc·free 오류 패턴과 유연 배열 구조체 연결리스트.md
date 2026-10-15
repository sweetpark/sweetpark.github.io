---
title: "(C) 동적 메모리 실습 — malloc·free 오류 패턴과 유연 배열 구조체 연결리스트"
tags: 
created: 2026-10-13
modified: 2026-10-15
---

# 동적 메모리 실습 — malloc·free 오류 패턴과 유연 배열 구조체 연결리스트

> [!NOTE]
> C 기초 강의의 동적 메모리 실습(9-01 ~ 9-11)에서 만난 오류 패턴을 정리하고, 이를 바탕으로 `realloc` 기반 문자열 배열과 **유연 배열 멤버(flexible array member) 노드를 쓰는 연결리스트**를 직접 만들어 본다. 환경은 Linux 컨테이너, `gcc -g -O0 -Wall -Wextra`.

> [!IMPORTANT]
> 코드는 컨테이너에서 컴파일·실행해 확인했고, 설명은 AI(Claude)와 함께 코드 리뷰하며 정리했다.

> [!TIP]
> **📂 원본 소스 (GitHub)**
> - `realloc` + 이중 포인터: [`mem/mem_ex.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/mem/mem_ex.c)
> - 연결리스트(node + list 구조체): [`mem/linkedlist.c`](https://github.com/sweetpark/c-playgound/blob/main/c_basic/mem/linkedlist.c)
> - 강의 코드 9-01 ~ 9-11: [`lecture/mem/`](https://github.com/sweetpark/c-playgound/tree/main/c_basic/lecture/mem)
> - 빌드: `make -C c_basic` ([README](https://github.com/sweetpark/c-playgound/blob/main/c_basic/README.md))

## 📌 한눈에 보기

| 실습 | 문제 | 처방 |
|---|---|---|
| 9-01 | 같은 포인터를 두 곳에서 `free` (double free) | 해제 책임자를 한 곳으로, `free` 후 `NULL` 대입 |
| 9-03 | 잘못된 타입 크기로 할당 | `malloc(sizeof(*p))` |
| 9-04 | `malloc(0)`·음수 크기 | 크기는 `size_t`, 0 허용 여부를 명시적으로 처리 |
| 9-05 | `calloc` 개수×크기 오버플로, `free` 누락 | 곱셈 한계 검사, 반드시 해제 |
| 9-06 | `malloc` 직후 쓰레기값 | `calloc` 또는 `memset`, 읽는 크기는 할당 크기 이내 |
| 9-07 | 에러 경로마다 해제 코드가 흩어짐 | `goto` 한 곳으로 모으는 정리 패턴 |
| 9-08 | `free(p)` 후 `p->next` 참조 | 다음 노드를 먼저 저장 |
| 9-09 | 에러·정상 경로에서 `free` 누락 | 단일 출구 정리 |
| 9-10 | 유연 배열 구조체 복사·스택 선언·값 전달 | `memcpy`로 전체 크기 복사, 포인터로 전달 |
| 9-11 | 구조체 포인터의 크기로 할당 | `sizeof(*tmb)` |

---

## 1. free 관련 오류

### double free — 9-01

```c
int verify_size(char *list, size_t size) {
	if (size < MIN_SIZE_ALLOWED) {
		free(list);          // 여기서 해제하고
		return -1;
	}
	return 0;
}

void process_list(size_t number) {
	char *list = (char *)malloc(number);
	...
	if (verify_size(list, number) == -1) {
		free(list);          // 여기서 또 해제 → double free
		return;
	}
	free(list);
}
```

- **해제 책임자는 할당한 쪽 하나**로 둔다. 검증 함수는 판단만 하고 해제하지 않는다.
- 권장: `free` 후 `NULL`을 대입하고, `free` 전에 `NULL`을 검사한다. `free(NULL)`은 안전하다.

```c
#define FREE(ptr) do { if ((ptr) != NULL) { free(ptr); (ptr) = NULL; } } while (0)
```

- **같은 모듈·같은 추상화 수준에서 할당하고 해제한다** (교육자료 9-1). 다른 함수·모듈이 해제하면 "누가 언제 해제했는지"를 알 수 없어서 leak, double free, 해제 후 접근이 생긴다.
- 해제 직후 `NULL`을 대입하는 이유는 같은 포인터가 **나중에 한 번 더 쓰일 수 있기 때문**이다. 교육자료의 예: `message_type & bitmask_1`일 때 한 번, `& bitmask_2`일 때 또 `free(message)`를 하면 두 비트가 모두 켜진 메시지에서 double free가 난다. 반대로 **지역(non-static) 포인터가 `free` 직후 곧바로 스코프를 벗어나면** 더 쓸 수 없으니 `NULL` 대입은 생략해도 된다.
- 교육자료의 `FREE`는 `if (...) { ... }`로만 정의돼 있다. `if (c) FREE(p); else ...`처럼 쓰면 `}` 뒤의 `;`가 `if`문을 끝내서 `else`가 짝을 잃고 컴파일 에러가 난다. 위 `do { ... } while (0)` 형태로 감싸는 이유다.

### free 후 참조 — 9-08 (치명적)

```c
for (p = head; p != NULL; p = p->next) {   // free(p) 이후 p->next를 읽는다
	free(p);
}
```

```c
struct node *next;
for (p = head; p != NULL; p = next) {
	next = p->next;     // 해제 전에 다음 노드를 저장
	free(p);
}
```

> [!WARNING]
> 교육자료(9-8)는 이 패턴이 실제 운영 장애로 이어진 사례를 함께 싣고 있다 (고객사·티켓 정보는 생략). 연결리스트를 해제하는 함수가 `free(p)` 뒤에 `p->next`를 읽어서 **해제된 메모리를 읽은** 채 동작하다가 프로세스 블록이 재기동됐다. 테스트에서는 해제된 메모리에 우연히 이전 값이 남아 있어서 통과하기 쉽다는 점이 이 결함의 위험이다.

### 해제 누락 — 9-05, 9-09

`malloc`/`calloc` 후 정상 경로, 에러 경로 어디서든 빠져나가기 전에 `free`가 있어야 한다. 9-09는 `fopen`/`fgets` 실패 경로에서 `text_buffer`를 해제하지 않았다. 아래 `goto` 패턴으로 한 곳에 모으면 누락이 사라진다.

---

## 2. 할당 크기 관련 오류

### 타입을 잘못 계산 — 9-03, 9-11

```c
widget *p;                       // 20 + 4 + 8 바이트 구조체
p = malloc(sizeof(gadget));      // 더 작은 구조체 크기로 할당 → 쓰는 순간 힙 오버플로

struct tm *tmb = malloc(sizeof(tmb));   // sizeof(포인터) = 8바이트, struct tm은 훨씬 크다
```

```c
p   = malloc(sizeof(*p));        // 타입이 바뀌어도 따라가는 관용구
tmb = malloc(sizeof(*tmb));
```

교육자료(9-3)는 `sizeof(*p)` 대신 **할당 함수의 반환값을 대상 타입으로 바로 cast**하는 방법을 권한다. C에서 `void *`는 어떤 포인터로도 암시적 변환되므로 `widget *p = malloc(sizeof(gadget))`는 경고 없이 통과하지만, `p = (widget *)malloc(sizeof(widget))`처럼 타입을 쓰면 `sizeof(...)`와 대입 대상의 **타입이 어긋날 때 컴파일러가 잡을 여지**가 생긴다. 이를 매크로로 묶으면 타입을 한 번만 쓴다.

```c
#define MALLOC(type)                  ((type *)malloc(sizeof(type)))
#define MALLOC_ARRAY(number, type)    ((type *)malloc((number) * sizeof(type)))
#define MALLOC_FLEX(stype, number, etype) \
        ((stype *)malloc(sizeof(stype) + (number) * sizeof(etype)))   // 유연 배열 구조체
#define CALLOC(number, type)          ((type *)calloc(number, sizeof(type)))
#define REALLOC_ARRAY(pointer, number, type) \
        ((type *)realloc(pointer, (number) * sizeof(type)))
#define REALLOC_FLEX(pointer, stype, number, etype) \
        ((stype *)realloc(pointer, sizeof(stype) + (number) * sizeof(etype)))

widget *p = MALLOC(widget);                    // 타입 불일치면 "incompatible pointer" 경고
```

> [!NOTE]
> 두 방식 모두 **한 곳에서 타입을 맞추는** 장치이고, 장단이 다르다. `sizeof(*p)`는 매크로 없이 쓸 수 있고 변수 타입이 바뀌어도 따라간다. 타입 매크로는 `widget *p = MALLOC(gadget)`처럼 **서로 다른 타입을 쓰면 경고**로 알려 준다. 어느 쪽이든 `(number) * sizeof(type)`의 **곱셈 오버플로**는 막아 주지 않으므로 개수가 외부 값이면 `n > SIZE_MAX / sizeof(type)`을 먼저 확인한다 (아래 `calloc`). 또한 cast를 쓰면 `<stdlib.h>`를 빼먹었을 때 `malloc`의 암묵적 선언(`int` 반환)을 cast가 가려 버릴 수 있어서, 헤더 포함을 반드시 확인한다. 이 저장소의 `mem.h`는 `XNEW(p)`/`XNEWN(p, n)`처럼 `sizeof(*p)` 방식으로 같은 목적(타입 크기 실수 방지 + 곱셈 오버플로 검사)을 이미 해결하고 있어서, 위의 타입 매크로는 따로 넣지 않았다.

9-11은 `sizeof(tmb)`가 **포인터 크기(8바이트)** 라서, 뒤이은 `*tmb = (struct tm){ ... }`가 할당된 영역보다 큰 구조체를 써 넣는다. 덤으로 `struct tm`의 `tm_year`는 **1900년 기준 연도**, `tm_mon`은 **0~11**이라 `2023`, `7`을 그대로 넣으면 `mktime`에서 엉뚱한 날짜가 된다.

### 0과 음수 — 9-04, 9-05

- `malloc(0)`의 결과는 **구현 정의**다. `NULL`을 줄 수도 있고, 유일한 포인터를 줄 수도 있다. 어느 쪽이든 **역참조하면 안 된다**. "NULL이면 실패"라는 판정이 0바이트 요청에서 틀릴 수 있다.
- 크기 변수가 `int`면 음수가 `size_t`로 변환되며 거대한 값이 된다. 크기 인자는 `size_t`로 받고 호출 전에 범위를 검사한다.
- `calloc(n, size)`는 `n * size` 곱셈이 한계를 넘는지 검사해야 한다. 많은 구현이 오버플로 시 `NULL`을 돌려주지만, 표준이 보장하는 동작이 아니므로 직접 곱하는 코드라면 `n > SIZE_MAX / size`를 먼저 확인한다.

### 초기화와 읽기 범위 — 9-06

`malloc`은 **초기화하지 않는다**. 이전에 쓰이다 해제된 메모리의 잔여 값이 그대로 남는다.

```c
buf = (char *)malloc(MAX_BUF_SIZE);   // 32바이트
strcpy(buf, "Hello");                 // "Hello\0" 6바이트만 채워짐
prt_mem(buf, 50);                     // 나머지는 쓰레기값, 게다가 32바이트를 넘겨 읽음
```

필요하면 `calloc`이나 `memset`을 쓰고, **읽는 크기는 할당 크기를 넘지 않게** 맞춘다. 비밀번호·키 같은 값을 담았다 해제하는 버퍼는 해제 전에 지우는 것도 방법이다.

---

## 3. goto로 자원 정리 — 9-07

에러가 날 때마다 `free`·`fclose`를 직접 쓰면 경로가 늘수록 하나를 빼먹는다. 초기값을 `NULL`로 잡고 **정리 구간 하나**로 모은다.

```c
int do_something(void) {
	FILE *fin1 = NULL, *fin2 = NULL;
	object_t *obj = NULL;
	int ret_val = NOERR;

	obj = malloc(sizeof(*obj));
	if (obj == NULL) { ret_val = errno; goto CLEAN; }

	fin1 = fopen("some_file", "r");
	if (fin1 == NULL) { ret_val = errno; goto CLEAN; }

	fin2 = fopen("some_other_file", "r");
	if (fin2 == NULL) { ret_val = errno; goto CLEAN; }

	/* ... More code ... */

CLEAN:
	if (fin2) fclose(fin2);
	if (fin1) fclose(fin1);
	free(obj);
	return ret_val;
}
```

- **`errno`는 실패 직후 바로 저장**한다. 그 사이에 `printf`, `fclose`, `free`가 `errno`를 바꿀 수 있다.
- 정리 순서는 **획득의 역순**.
- `goto`를 쓰는 건 정리 지점으로의 점프에 한정한다.

---

## 4. 유연 배열 멤버(Flexible Array Member) — 9-10

```c
struct flex_array_struct {
	size_t num;
	int data[];          // 크기가 없는 마지막 멤버
};
```

`sizeof(struct flex_array_struct)`는 **`data`를 뺀 헤더 크기**(여기서는 8)다. 데이터 공간은 할당할 때 따로 붙인다.

```c
fas = malloc(sizeof(struct flex_array_struct) + sizeof(int) * 4);
```

### a. 구조체 대입은 헤더만 복사한다

```c
*struct_b = *struct_a;      // num만 복사되고 data[]는 복사되지 않는다
```

```c
size_t bytes = sizeof(*struct_a) + sizeof(int) * struct_a->num;
memcpy(struct_b, struct_a, bytes);     // b에도 같은 크기가 할당돼 있어야 한다
```

### b. 스택 변수로 선언하면 data[]의 공간이 없다

```c
struct flex_array_struct flex_struct;     // 8바이트뿐
flex_struct.data[i] = 0;                  // 이후 스택 메모리를 덮어씀 (스택 오염)
```

유연 배열 멤버를 가진 구조체는 **반드시 `malloc` 등으로 크기를 계산해 할당**한다.

### c. 값으로 전달하면 data[]가 사라진다

```c
void print_array(struct flex_array_struct struct_p) { ... struct_p.data[i] ... }   // 복사본엔 data 없음
print_array(*fas_a);
```

```c
void print_array(const struct flex_array_struct *p) { ... p->data[i] ... }
print_array(fas_a);
```

---

## 5. 직접 만들기 1 — realloc과 이중 포인터

고정 크기 문자열 버퍼를 **유연 배열 구조체**로 만들고, 모자라면 `realloc`으로 늘리는 `append`를 구현했다. 핵심은 **`realloc`이 주소를 바꿀 수 있다**는 점이라, 호출자의 포인터를 갱신하려면 **이중 포인터**로 받아야 한다는 것이다.

```c
typedef struct array {
	int size;            // str_chr에 할당된 크기
	char str_chr[];
} Array;

#define MAX_SIZE 20

int append(Array **plist, const char *src) {
	Array *list = *plist;
	int dst_len = getDstStrlen(list);
	int src_len = (int)strlen(src);
	int need = dst_len + src_len + 1;          // 널 문자 포함

	if (need > MAX_SIZE) { printf("MAX size over\n"); return -1; }

	if (list->size < need) {
		Array *tmp = (Array *)realloc(list, sizeof(Array) + need);
		if (tmp == NULL) { printf("realloc failed\n"); return -1; }   // list는 그대로 유효
		list = tmp;
		list->size = need;
		*plist = list;                          // 호출자 포인터 갱신
	}

	memcpy(&list->str_chr[dst_len], src, src_len + 1);   // 널 문자까지 복사
	return 0;
}
```

사용할 때는 `append(&list, "test");`로 주소를 넘긴다.

고치면서 알게 된 버그들은 다음과 같다.

1. `realloc`의 반환값을 **원래 포인터에 바로 대입하면** 실패(`NULL`) 시 원본을 잃어버려 누수가 난다. 임시 변수로 받아서 확인한 뒤 대입한다.
2. 문자열 길이 함수의 루프 조건을 `i < size || str_chr[i] == '\0'`처럼 `||`로 쓰면 널 문자를 만나도 멈추지 않는다. `count < size && str_chr[count] != '\0'`.
3. 이어 붙일 위치는 **할당 크기(size)가 아니라 현재 문자열 길이(dst_len)**.
4. 초기 상태가 **빈 문자열**이어야 한다: `list->str_chr[0] = '\0'`.

---

## 6. 직접 만들기 2 — 연결리스트 (node + list 구조체)

노드는 **유연 배열 멤버**로 가변 길이 데이터를 한 번의 `malloc`에 담고, 별도의 **list 구조체**가 `head`·`tail`·`count`를 관리하는 구조다.

```c
typedef struct msg_node {
	struct msg_node *next;
	size_t len;                // 데이터 길이 (널 문자 제외)
	unsigned char data[];      // 가변 길이, 항상 '\0'으로 끝남
} msg_node_t;

typedef struct msg_list {
	msg_node_t *head;
	msg_node_t *tail;
	int count;
} msg_list_t;
```

### insert — tail 덕분에 O(1)

```c
int insert(msg_list_t *list, const char *src, size_t len) {
	if (list == NULL || src == NULL) return -1;
	if (list->count >= MAX_SIZE) { printf("list full\n"); return -1; }

	msg_node_t *new_ptr = malloc(sizeof(msg_node_t) + len + 1);   // 구조체 + 데이터 + 널 문자
	if (new_ptr == NULL) return -1;

	new_ptr->next = NULL;
	new_ptr->len = len;
	memcpy(new_ptr->data, src, len);
	new_ptr->data[len] = '\0';

	if (list->tail == NULL) list->head = new_ptr;      // 빈 리스트
	else                    list->tail->next = new_ptr;
	list->tail = new_ptr;
	list->count++;
	return 1;
}
```

### delete — head/tail까지 갱신

```c
int delete(msg_list_t *list, int index) {          // index는 1부터
	msg_node_t *pre_node = NULL, *target;

	if (list == NULL || list->head == NULL) return -1;
	if (index <= 0 || index > list->count) return -1;

	target = list->head;
	for (int i = 1; i < index; i++) { pre_node = target; target = target->next; }

	if (pre_node == NULL) list->head = target->next;   // 첫 노드 삭제
	else                  pre_node->next = target->next;
	if (target == list->tail) list->tail = pre_node;   // 마지막 노드 삭제

	free(target);
	list->count--;
	return 1;
}
```

### free_list

```c
void free_list(msg_list_t *list) {
	msg_node_t *cur, *next;
	if (list == NULL) return;
	for (cur = list->head; cur != NULL; cur = next) {
		next = cur->next;          // 해제 전에 저장 (9-08의 교훈)
		free(cur);
	}
	free(list);
}
```

### 처음 짠 연결리스트에서 고친 점

| 처음 코드 | 문제 | 고친 코드 |
|---|---|---|
| `malloc(sizeof(msg_node_t) * sizeof(char) * len)` | 과도한 할당, 유연 배열 크기 계산이 틀림 | `sizeof(msg_node_t) + len + 1` |
| 새 노드의 `next` 미초기화 | 쓰레기 포인터가 리스트에 연결됨 | `new_ptr->next = NULL` |
| `strlen(src)`와 `len`을 섞어 사용 | 길이 불일치 | `memcpy(len)` + 널 종료로 통일 |
| `pre_node` 초기화 없이 사용, 첫·마지막 삭제 처리 오류 | 미정의 동작·누수 | `pre_node = NULL` 시작, 경우 분기 |
| `free_list` 없음 | 누수 | 노드 + list 전체 해제 |
| 더미 head 노드 + 끝까지 순회해 삽입 | 삽입이 O(n) | list 구조체의 `tail` 사용 |

### 실행 결과

```
count=3
[0x34c5f030, 1, 4, test]
[0x34c5f050, 2, 6, second]
[0x34c5f070, 3, 5, third]
-- delete(1) (첫 노드)
count=2
...
-- delete(9) (없는 index)
size error
```

---

## ✅ 정리 — 동적 메모리 점검 체크리스트

- [ ] `malloc(sizeof(*p))`로 **포인터가 가리키는 타입**의 크기를 썼는가
- [ ] 크기는 `size_t`, 곱셈은 오버플로를 검사했는가
- [ ] `malloc`/`calloc`/`realloc` 반환값을 `NULL` 검사했는가
- [ ] `realloc`은 **임시 포인터**로 받고, 주소가 바뀌므로 이중 포인터나 반환값으로 전달했는가
- [ ] 초기화되지 않은 메모리를 읽지 않는가 (`calloc`/`memset`)
- [ ] 모든 경로(정상·에러)에서 **한 번만** `free`하는가 (해제 후 `NULL`)
- [ ] 해제한 포인터의 멤버(`p->next`)를 읽지 않는가
- [ ] 에러 경로가 많으면 `goto CLEAN` 한 곳으로 모았는가, `errno`는 먼저 저장했는가
- [ ] 유연 배열 구조체는 **헤더 + 데이터**로 할당하고, 복사는 `memcpy`, 전달은 포인터로 하는가

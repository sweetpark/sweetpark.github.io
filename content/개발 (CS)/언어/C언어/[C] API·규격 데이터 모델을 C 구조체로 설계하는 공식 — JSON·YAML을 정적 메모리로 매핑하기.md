---
title: "API·규격 데이터 모델을 C 구조체로 설계하는 공식 — JSON·YAML을 정적 메모리로 매핑하기"
tags: [학습, 개발-CS, 언어, C언어, 데이터모델, 구조체설계, API, 직렬화, 메모리패턴]
created: 2026-09-18
modified: 2026-09-18
---

# API·규격 데이터 모델을 C 구조체로 설계하는 공식 — JSON·YAML을 정적 메모리로 매핑하기

> [!NOTE]
> REST API, OpenAPI(Swagger), 3GPP, IETF RFC 등 규격서나 스키마(JSON/YAML)에 정의된 **데이터 모델(Data Model)**을 고성능·저지연 C 언어 구조체로 옮겨 담을 때 사용하는 **5대 핵심 설계 패턴과 메모리 관리 공식**을 정리한다.

---

## 0. 왜 스펙의 Data Model을 C로 옮기는 공식이 필요한가?

현대의 거의 모든 API와 프로토콜 규격(Web REST, 5G Core, 클라우드 시스템)은 **JSON 또는 YAML(OpenAPI 3.0)**로 데이터 모델을 정의한다. JSON 데이터 모델의 본질은 다음과 같다:
- **동적 타입 & 가변 크기**: 문자열 길이가 정해져 있지 않고, 배열 원소 수도 요청마다 다름.
- **계층적 트리 구조**: 객체 안에 객체가 끝없이 중첩(Nesting)됨.
- **다형성(Polymorphism)**: `oneOf`, `anyOf`처럼 여러 타입 중 하나가 들어옴.

반면 **C 언어**에는 C++의 `std::vector`, `std::string`, Java/Python의 `List`, `Map` 같은 동적 컬렉션 클래스가 없다. 오직 **컴파일 타임에 크기가 확정되는 정적 메모리 블록(struct)과 원시 포인터(Pointer)**만 존재한다.

```
[규격서 세계 (JSON/YAML)]                        [C 시스템 프로그래밍 세계]
동적 문자열, 가변 배열              ───────▶      고정 크기 버퍼(sz_) vs 힙 포인터(pst_)
객체 중첩 (Nested Objects)         변환 공식      값 내장(Inline struct) vs 포인터 참조
다형성 (oneOf, anyOf)                             판별 공용체 (Tagged Union: enum + union)
옵셔널/조건부 속성 (0..1)                         유효성 비트마스크 플래그 (un_flag)
```

이 간극을 주먹구구식으로 메우면(예: 모든 필드를 `malloc` 포인터로 도배하거나, 반대로 전부 고정 크기 거대 배열로 선언), **메모리 단편화(Fragmentation), 잦은 캐시 미스(Cache Miss), 널 포인터 크래시(Crash), 심각한 메모리 누수**가 터진다. 

따라서 대규모 트래픽을 다루는 실무 C 프로젝트(통신망, 고성능 네트워크 데몬 등)에서는 **수십 년간 정제된 5대 매핑 공식**을 정석으로 사용한다.

---

## 1. 3대 네이밍 및 타입 선언 관례

코드를 읽고 작성하기 전, 실무 C 프로젝트에서 변수명과 구조체명만 보고도 메모리 구조를 즉시 파악할 수 있도록 돕는 표기법이다.

### 1.1 구조체 선언: `_st_..._t`
```c
typedef struct _st_user_profile_t {
    ...
} st_user_profile_t;
```
- **`st_`**: Structure(구조체)의 축약어.
- **맨 앞 `_`**: C 문법상 `struct 태그명`과 `typedef 별칭`이 네임스페이스를 공유할 때의 충돌을 방지.
- **`_t`**: POSIX 표준(`size_t`, `time_t`) 관례로, `typedef`로 새로 정의된 **사용자 정의 자료형(Type)**임을 명시.

### 1.2 멤버 변수 헝가리안(Hungarian) 접두어
변수명 앞에 붙은 접두어는 해당 변수가 **"스택/값(Value)"**인지 **"힙/포인터(Pointer)"**인지를 즉시 알려준다:
- **`st_`**: 구조체 인스턴스 (값 형태, 상위 메모리에 인라인 포함) → `st_address`
- **`pst_`**: 구조체 포인터 (힙 메모리 주소를 가리킴, 8바이트) → `pst_items`
- **`sz_`**: `\0`으로 끝나는 고정 버퍼 문자열 (String Zero) → `sz_name[32]`
- **`n_`**: 정수형 숫자 / 카운트 (Number) → `n_count`, `n_age`
- **`c_`**: 1바이트 문자 또는 플래그 (char) → `c_status`
- **`un_`**: 부호 없는 정수 (주로 비트마스크용) → `un_valid_flag`
- **`e_`**: 열거형 (Enum) → `e_type`

---

## 2. 규격 스키마 ↔ C 구조체 5대 매핑 공식

---

### 공식 ① 단일 기본형 (Primitive Type: string, integer, boolean)

#### [스펙 정의 (YAML)]
```yaml
userId:
  type: string
  maxLength: 36
age:
  type: integer
isActive:
  type: boolean
```

#### [C 구조체 설계]
```c
#define MAX_USER_ID_LEN   37   /* 36자 + null 종단문자 1자 */

typedef struct _st_user_t {
    char    sz_user_id[MAX_USER_ID_LEN];  /* 고정 길이 버퍼 */
    int     n_age;                        /* 정수 */
    char    c_is_active;                  /* 1바이트 boolean (0 or 1) */
} st_user_t;
```

#### 💡 왜 `char *` 대신 고정 버퍼(`sz_`)를 쓰는가?
1. **메모리 단편화 0**: 문자열 하나마다 `malloc()`을 부르면 힙이 16~32바이트 조각으로 파편화된다. 고정 버퍼는 부모 구조체가 할당될 때 단 1번의 연속 메모리로 끝난다.
2. **CPU 캐시 적중률**: 포인터를 타고 힙으로 점프할 필요 없이, CPU 캐시 라인(64바이트)에 데이터가 한 번에 로드된다.

---

### 공식 ② 기본형의 가변 배열 (Array of Primitives: `array of string`, `array of integer`)

#### [스펙 정의 (YAML)]
```yaml
# 문자열 가변 배열
ipAddresses:
  type: array
  items:
    type: string

# 정수 가변 배열
portList:
  type: array
  items:
    type: integer
```

#### [C 구조체 설계 핵심 원칙: 포인터 차수(Pointer Degree) 결정 규칙]
C언어에서 가변 동적 배열의 포인터 차수는 항상 **`원소 타입(T) *`** 공식에 의해 결정된다:
- **`string` 배열 (`char **`)**: C언어에는 string 기본 타입이 없고 문자열 1개가 이미 `char *`이다. 따라서 `(char *) *`가 되어 **이중 포인터(`char **`)**를 사용한다.
- **`integer` 배열 (`int *`)**: 정수는 그 자체가 기본형 값(`int`)이므로 **이중 포인터를 쓸 필요가 전혀 없으며, 단일 포인터(`int *`)**로 충분하다!

| 원소 타입 (`T`) | 원소 1개 타입 | 동적 배열 포인터 선언 (`T *`) | 메모리 할당 / 해제 횟수 |
| :--- | :--- | :--- | :--- |
| **`string`** | `char *` | **`char **ppc_strings`** (이중 포인터) | 포인터 배열 1회 + 각 문자열 n회 (총 n+1회) |
| **`integer`** | `int` | **`int *pn_values`** (단일 포인터) | 단 1회 할당 / 1회 해제 |

---

#### 1) `array of string`: 공통 문자열 리스트 컨테이너 (`st_string_list_t`)
문자열 배열마다 구조체를 새로 만들지 않고, 시스템 공통 컨테이너인 **`st_string_list_t`**를 선언해 재사용한다.

```c
typedef struct _st_string_list_t {
    int     n_cnt;          /* 배열에 담긴 문자열 개수 */
    char  **ppc_strings;    /* 문자열 포인터들의 동적 배열 (char* []) */
} st_string_list_t;

// 상위 구조체에서 사용:
typedef struct _st_host_info_t {
    st_string_list_t  st_ip_addresses;  /* 리스트 헤더를 값으로 포함 */
} st_host_info_t;
```

#### 2) `array of integer`: 정수 배열 설계 (단일 포인터 vs 1차원 고정 배열)

**방법 A: 단일 포인터 동적 배열 (`int *`)**
개수 변동이 크고 상한을 알 수 없을 때 사용:
```c
typedef struct _st_int_list_t {
    int   n_cnt;        /* 담긴 정수 개수 */
    int  *pn_values;    /* int들의 1차원 동적 배열 (단일 포인터로 충분!) */
} st_int_list_t;

// 할당 및 해제: 루프 없이 1번으로 끝남
list.pn_values = (int *)malloc(sizeof(int) * list.n_cnt);
free(list.pn_values);
```

**방법 B: 1차원 고정 배열 + 카운트 (시스템 프로그래밍 권장)**
API 스펙에 `maxItems: 16`처럼 상한이 명시되어 있는 경우, 동적 할당 오버헤드와 힙 파편화를 피하기 위해 고정 크기로 인라인 선언:
```c
#define MAX_PORT_CNT 16

typedef struct _st_port_list_t {
    int  n_cnt;
    int  an_ports[MAX_PORT_CNT];   /* 1차원 고정 배열 */
} st_port_list_t;
```

---

#### [메모리 레이아웃 비교]
```text
[ array of integer : 단일 포인터 (int *) ]
pn_values ───▶ [ 8080 | 8081 | 9000 ]  (연속된 int 메모리 블록 1개)

[ array of string : 이중 포인터 (char **) ]
ppc_strings ──▶ [ ptr 0 | ptr 1 | ptr 2 ] (포인터들의 연속 배열)
                    │       │       │
                    ▼       ▼       ▼
                 "strA"  "strB"  "strC"   (각각 개별 힙 블록)
```

---

### 공식 ③ 단일 복합 객체 (Complex Object, `0..1` 또는 `1`)

객체 안에 다른 객체가 하나 포함되는 경우다.

#### [스펙 정의 (YAML)]
```yaml
# User 객체 안에 DeliveryAddress 객체가 0..1(선택)로 포함됨
deliveryAddress:
  $ref: '#/components/schemas/Address'
```

#### [C 구조체 설계: 값 내장 + 유효성 플래그(Bit Flag) 패턴]
포인터(`*pst_delivery_address`)로 분리하지 않고, 구조체 멤버(`st_delivery_address`)로 **값 자체를 인라인 내장**하되, **유효성 플래그(`un_valid_flag`)**를 세트로 둔다.

```c
#define FLAG_DELIVERY_ADDR_VALID   (1 << 0)

typedef struct _st_user_profile_t {
    char                sz_name[32];
    unsigned int        un_valid_flag;       /* 어떤 하위 객체가 유효한지 비트마스크 */
    st_address_t        st_delivery_address; /* 값 형태로 내장 */
} st_user_profile_t;
```

#### 💡 실무적 이점
- **원터치 초기화**: `memset(pst_user, 0x00, sizeof(st_user_profile_t))` 한 번으로 `un_valid_flag = 0`이 되어 하위 객체 전체가 안전하게 "비어 있음" 상태가 된다.
- **초고속 검사**: `if (pst_user->un_valid_flag & FLAG_DELIVERY_ADDR_VALID)` 비트 연산 단 1클럭($O(1)$)으로 존재 여부를 판단한다.

---

### 공식 ④ 복합 객체의 가변 배열 (Array of Objects, `1..N`) — ★가장 중요한 핵심 공식

스펙에서 **`array of Object`** (예: 주문 내 상품 목록, 통신 규격의 `guamiList`, `nfServices`)가 나오면, C 언어에서는 예외 없이 **`[단일 원소 구조체]` + `[리스트 컨테이너 구조체]` 쌍**으로 설계한다.

#### [스펙 정의 (YAML)]
```yaml
items:
  type: array
  items:
    $ref: '#/components/schemas/OrderItem'
  minItems: 1
```

#### [C 구조체 설계 3단계 공식]

```c
/* [1단계] 개별 원소(Item) 구조체 */
typedef struct _st_order_item_t {
    char    sz_item_id[16];
    int     n_price;
    int     n_quantity;
} st_order_item_t;

/* [2단계] 가변 개수를 관리하는 리스트(List) 컨테이너 구조체 */
typedef struct _st_order_item_list_t {
    int                n_cnt;       /* 현재 원소 개수 (JSON 배열의 length) */
    st_order_item_t   *pst_items;   /* 힙(Heap)에 할당된 연속 원소 배열의 시작 주소 */
} st_order_item_list_t;

/* [3단계] 상위 구조체(Order)에 리스트 헤더를 '값'으로 내장 */
typedef struct _st_order_t {
    char                  sz_order_id[32];
    st_order_item_list_t  st_item_list;  /* <--- 2단계 리스트 헤더를 값으로 포함 */
} st_order_t;
```

#### 💡 왜 `st_order_item_list_t` 헤더 자체를 포인터가 아닌 '값'으로 내장하는가?
초보 개발자들은 `st_order_item_list_t *pst_item_list;`처럼 헤더까지 포인터로 선언하기 쉽다. 하지만 값으로 내장하면 엄청난 차이가 생긴다:

| 구분 | 헤더를 포인터(`*pst_list`)로 둘 때 | 헤더를 값(`st_list`)으로 내장할 때 (공식) |
| :--- | :--- | :--- |
| **`malloc` 횟수** | 2회 (헤더 1회 + 실제 배열 1회) | **1회 (실제 배열만 1회 할당)** |
| **2중 널 검사** | `if (p->list != NULL && p->list->items != NULL)` | `if (p->st_list.n_cnt > 0)` (널 크래시 없음) |
| **메모리 단편화** | 16바이트짜리 작은 껍데기가 힙을 파편화시킴 | 상위 구조체 내부에 깔끔하게 인라인 포함됨 |
| **캐시 효율** | 포인터를 2번 타고 가야 함 (L1 캐시 미스) | 헤더가 상위 구조체와 같은 캐시 라인에 로드됨 |

---

### 공식 ⑤ 다형성 및 복합 조건 (OneOf / AnyOf / Tagged Union)

여러 스키마 중 **정확히 하나만(oneOf)** 들어올 수 있는 경우다.

#### [스펙 정의 (YAML)]
```yaml
# 결제 수단: 신용카드 정보 or 계좌이체 정보 중 택1
PaymentMethod:
  oneOf:
    - $ref: '#/components/schemas/CreditCard'
    - $ref: '#/components/schemas/BankTransfer'
```

#### [C 구조체 설계: Tagged Union (판별 공용체) 패턴]
어떤 타입인지 식별하는 `enum`과, 메모리 공간을 공유하는 `union`을 결합한다.

```c
typedef enum _en_payment_type_t {
    PAYMENT_NONE = 0,
    PAYMENT_CREDIT_CARD,
    PAYMENT_BANK_TRANSFER
} en_payment_type_t;

typedef struct _st_payment_method_t {
    /* 1. 공통 필드 (struct 영역): 모든 결제 수단에 공통으로 필요한 데이터 (독립 메모리) */
    char                sz_transaction_id[32];
    int                 n_amount;
    en_payment_type_t   e_type;     /* 판별 태그(Tag) */

    /* 2. 선택적 필드 (union 영역): 결제 수단에 따라 '택 1'로 골라 쓰는 데이터 (메모리 공유) */
    union {
        st_credit_card_t    st_card;
        st_bank_transfer_t  st_bank;
    } u_data;
} st_payment_method_t;
```

#### 💡 공용체(Union) 설계 핵심 원칙: "공통 필드는 struct에, 가변 필드는 union에"
- **오프셋 공유(Offset 0 Overlap)**: `union` 내부의 모든 멤버는 동일한 시작 주소를 공유하므로 **동시에 여러 멤버를 쓰는 것은 물리적으로 불가능**하다. 한 멤버에 값을 쓰면 다른 멤버 데이터는 즉시 덮어써져 파괴된다.
- **공통 필드 분리**: 어떤 조건이든 항상 유지되어야 하는 공통 정보(ID, 금액, 태그 등)는 반드시 `union` 밖인 바깥 `struct` 멤버로 선언해야 안전하게 보존된다.
- **메모리 절약**: `union`은 내부 멤버 중 가장 큰 멤버 1개의 크기만 차지하므로 메모리 낭비가 없다.
- **분기 성능**: `switch (pst_pay->e_type)` 한 번으로 즉시 해당 타입의 핸들러로 $O(1)$ 분기할 수 있다.

---

## 3. 런타임 메모리 레이아웃 및 라이프사이클

위 공식대로 설계된 구조체가 실제 메모리에서 어떻게 생성되고, 읽히고, 해제되는지 라이프사이클을 추적한다.

### 3.1 메모리 레이아웃 구조도

`Order` 안에 아이템이 2개 들어왔을 때의 메모리 모습:

```
[ 스택 또는 캐시 영역 : 연속된 정적 메모리 블록 ]
st_order_t (0x1000)
┌────────────────────────────────────────────────────────┐
│ sz_order_id : "ORD-2026-001"                           │
│ st_item_list                                           │
│   ├── n_cnt     : 2                                    │
│   └── pst_items : 0x5000 ─────────────────────┐        │
└───────────────────────────────────────────────┼────────┘
                                                │
                                                ▼ [ 힙(Heap) 동적 할당 영역 ]
                                        0x5000 ┌────────────────────────────────────────┐
                                         [0]   │ sz_item_id: "ITEM_A", price: 1000, ... │
                                               ├────────────────────────────────────────┤
                                         [1]   │ sz_item_id: "ITEM_B", price: 2500, ... │
                                               └────────────────────────────────────────┘
```

---

### 3.2 4단계 라이프사이클 코드 관용구

#### 1단계: 초기화 (Allocation & Zeroing)
```c
st_order_t st_order;
memset(&st_order, 0x00, sizeof(st_order_t));
// 결과: st_item_list.n_cnt = 0, pst_items = NULL 상태가 되어 댕글링 포인터 방지
```

#### 2단계: JSON 역직렬화 (Decode: cJSON 라이브러리 예시)
```c
int decode_order_items(cJSON *json_root, st_order_t *pst_order)
{
    cJSON *json_arr = cJSON_GetObjectItem(json_root, "items");
    if (!json_arr || !cJSON_IsArray(json_arr)) return -1;

    int count = cJSON_GetArraySize(json_arr);
    if (count <= 0) return 0;

    // 핵심: 원소 개수만큼 딱 1번만 calloc!
    pst_order->st_item_list.pst_items = (st_order_item_t *)calloc(count, sizeof(st_order_item_t));
    if (!pst_order->st_item_list.pst_items) return -1;

    pst_order->st_item_list.n_cnt = count;

    for (int i = 0; i < count; i++) {
        cJSON *item = cJSON_GetArrayItem(json_arr, i);
        // pst_order->st_item_list.pst_items[i] 에 필드 파싱 및 대입
    }
    return 0;
}
```

#### 3단계: 읽기 및 깊은 복사 (Read & Deep Copy)
포인터를 단순 대입(`dst = src`)하면 얕은 복사(Shallow Copy)가 되어 원본 해제 시 세그폴트가 난다. 가변 배열은 항상 전용 복사 함수를 둔다:
```c
int copy_order_item_list(st_order_item_list_t *pst_dst, const st_order_item_list_t *pst_src)
{
    if (pst_src->n_cnt <= 0 || !pst_src->pst_items) return 0;

    pst_dst->pst_items = (st_order_item_t *)calloc(pst_src->n_cnt, sizeof(st_order_item_t));
    if (!pst_dst->pst_items) return -1;

    pst_dst->n_cnt = pst_src->n_cnt;
    memcpy(pst_dst->pst_items, pst_src->pst_items, sizeof(st_order_item_t) * pst_src->n_cnt);
    return 0;
}
```

#### 4단계: 계층적 자원 해제 (Hierarchical Free)
부모 구조체를 해제하기 전에 반드시 **내부 동적 배열 포인터부터 먼저 해제**해야 누수가 없다:
```c
void free_order(st_order_t *pst_order)
{
    if (!pst_order) return;

    // 내부 동적 힙 메모리 해제
    if (pst_order->st_item_list.pst_items != NULL) {
        free(pst_order->st_item_list.pst_items);
        pst_order->st_item_list.pst_items = NULL;  // B2 관례: free 후 즉시 NULL
        pst_order->st_item_list.n_cnt = 0;
    }
}
```

---

### 3.3 [실전 관용구] "응답으로 배열이 왔을 때, 어떤 순서로 받아내야 하는가?"

API 응답으로 리스트(배열) JSON이 도착했을 때, C 언어로 안전하게 수신하는 **6단계 정석 파이프라인**이다.

```
[1. 구조체 스택/세션 선언] ──▶ [2. memset으로 0 클리어] ──▶ [3. JSON 배열 크기(n_cnt) 확인]
                                                                     │
[6. 사용 후 계층적 free] ◀── [5. 루프 돌며 원소값 대입] ◀── [4. n_cnt만큼 일괄 malloc]
```

```c
/* ====================================================================
 * [Step 1] 부모 구조체를 스택(또는 세션 버퍼)에 선언
 * ==================================================================== */
st_order_t st_order;

/* ====================================================================
 * [Step 2] memset으로 깨끗하게 0으로 초기화
 * --------------------------------------------------------------------
 * 이 한 줄로 st_item_list.n_cnt = 0, pst_items = NULL 세팅 완료!
 * 쓰레기 포인터로 인한 와일드 포인터 버그 원천 차단.
 * ==================================================================== */
memset(&st_order, 0x00, sizeof(st_order_t));

/* ====================================================================
 * [Step 3] 응답으로 들어온 JSON 배열의 원소 개수(Size) 확인
 * ==================================================================== */
int n_cnt = cJSON_GetArraySize(json_items_array);
if (n_cnt <= 0) {
    // 빈 배열이면 malloc할 필요 없이 정상 종료 (n_cnt=0, pst_items=NULL 유지)
    return 0;
}

/* ====================================================================
 * [Step 4] 개수(n_cnt)만큼 내부 포인터에 한 번에 malloc!
 * ==================================================================== */
st_order.st_item_list.pst_items = 
    (st_order_item_t *)malloc(sizeof(st_order_item_t) * n_cnt);

// 메모리 고갈 방어 (NULL 검사)
if (st_order.st_item_list.pst_items == NULL) {
    return -1;  // Out of Memory
}

/* ====================================================================
 * [Step 5] for 루프를 돌며 각 원소에 필드값 대입
 * ==================================================================== */
for (int i = 0; i < n_cnt; i++) {
    cJSON *item_json = cJSON_GetArrayItem(json_items_array, i);

    // [i]번째 원소의 메모리에 직접 접근하여 대입!
    cJSON *id_obj = cJSON_GetObjectItem(item_json, "itemId");
    cJSON *pr_obj = cJSON_GetObjectItem(item_json, "price");

    if (id_obj && id_obj->valuestring) {
        strlcpy(st_order.st_item_list.pst_items[i].sz_item_id, id_obj->valuestring,
                sizeof(st_order.st_item_list.pst_items[i].sz_item_id));
    }
    if (pr_obj) {
        st_order.st_item_list.pst_items[i].n_price = pr_obj->valueint;
    }
}
st_order.st_item_list.n_cnt = n_cnt;  // 유효한 원소 개수 확정

/* ====================================================================
 * [Step 6] 데이터 사용 완료 후 반드시 메모리 해제 (자원 회수)
 * --------------------------------------------------------------------
 * 스택 변수(st_order)는 자동 소멸하지만, 4단계에서 할당한 
 * 힙 메모리(pst_items)는 수동 해제하지 않으면 즉시 메모리 누수가 됨!
 * ==================================================================== */
if (st_order.st_item_list.pst_items != NULL) {
    free(st_order.st_item_list.pst_items);
    st_order.st_item_list.pst_items = NULL;  // free 후 즉시 NULL
    st_order.st_item_list.n_cnt = 0;
}
```

---

### 3.4 [실무 핵심 원리] 구조체 멤버는 값(`st_`)인데, 왜 수정 함수 인자는 포인터(`pst_`)인가?

C 언어 프로젝트를 읽을 때 초심자가 가장 많이 혼동하는 포인트 중 하나다:
- **구조체 선언**: 상위 구조체 안에는 껍데기를 값 형태(`st_item_list`)로 내장해 두었다.
- **수정 함수 정의**: 그런데 이를 업데이트하는 함수는 포인터(`st_order_item_list_t *pst_dst`)로 받는다!

```c
// 1. 선언: 껍데기 헤더를 값(st_)으로 내장
typedef struct _st_order_t {
    ...
    st_order_item_list_t  st_item_list;  /* 값 타입 */
} st_order_t;

// 2. 호출부: 수정하기 위해 주소(&)를 넘김!
update_order_items(&pst_current_order->st_item_list, &st_new_items);

// 3. 정의부: 외부 데이터를 직접 수정해야 하므로 포인터(pst_)로 받음!
int update_order_items(st_order_item_list_t *pst_dst, const st_order_item_list_t *pst_src)
```

#### ① 왜 함수 인자는 포인터인가? (Call by Reference)
- C 언어에서 함수가 **외부 구조체의 내부 값(`n_cnt`, `pst_items`)을 직접 변경(Update)**하려면 반드시 그 구조체의 **주소(Pointer)**를 넘겨받아야 한다.
- 만약 값(`st_dst`)으로 받으면 C 언어는 복사본(Call by Value)을 전달하므로, 함수 내부에서 아무리 멤버를 바꿔도 함수 종료 시 원본은 전혀 바뀌지 않는다.
- 즉, **"메모리 상에는 1회 할당/인라인을 위해 값(`st_`)으로 배치하고, 다른 함수에서 내용을 수정할 때는 주소(`&`)를 따서 포인터(`pst_`)로 조작한다"**가 정답이다.

#### ② `pst_dst` vs `pst_src`의 의미
- **`pst_dst` (Destination, 목적지)**: 현재 시스템/캐시에 이미 저장되어 있는 **기존 데이터 원본** (수정 반영 대상).
- **`pst_src` (Source, 출발지)**: 이번 API 요청(PATCH/PUT)으로 새로 들어온 **수정할 데이터**.

#### ③ 실무의 핵심 관용구: "배열 통째 교체(Replace) 스왑"
기존 리스트를 새 리스트로 덮어쓸 때 메모리 누수 없이 단 3줄로 끝내는 관용구:

```c
// 1. 기존 데이터의 힙 메모리를 깨끗하게 free!
free_order_item_list(pst_dst);

// 2. 새로 파싱한 임시 리스트의 힙 주소와 개수를 통째로 연결(Swap)
pst_dst->n_cnt = st_new_item_list.n_cnt;
pst_dst->pst_items = st_new_item_list.pst_items;  // 힙 주소 덮어쓰기!
```

`pst_dst`가 원본 구조체의 주소를 가리키는 포인터이므로, `pst_dst->pst_items = ...` 로 힙 주소를 갈아 끼우면 **함수가 끝난 뒤에도 바깥의 원본 구조체 내용이 새 배열로 즉시 교체**된다.

---

## 4. 요약: 데이터 모델 설계 체크리스트

새로운 규격서나 API 스펙을 받아 C 구조체로 설계할 때는 아래 순서도에 따라 타입을 결정한다:

```
[규격서 필드 확인]
  │
  ├─ 문자열인가? ─────────▶ 고정 버퍼 `char sz_name[MAX_LEN]` (스펙 길이 + 1)
  │
  ├─ 기본형의 배열인가? ──▶ 공통 컨테이너 `st_string_list_t` (`n_cnt` + `char**`)
  │
  ├─ 단일 객체인가? ──────▶ 값 내장 `st_sub_t st_sub;` + 유효성 플래그 `un_flag`
  │
  ├─ 객체의 배열인가? ────▶ ★ `st_item_t` (원소) + `st_item_list_t` (`n_cnt` + `*pst_items`)
  │
  └─ 여러 객체 중 택1? ───▶ Tagged Union: `enum e_type` + `union { ... }`
```

---

## 관련 문서
- [실무 C 코드 관례와 UB 함정 정리]([C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)
- [Hungarian 표기법 접두어 해독표 — 변수 이름만 보고 타입·스코프 짐작하기]([C]%20Hungarian%20표기법%20접두어%20해독표%20—%20변수%20이름만%20보고%20타입·스코프%20짐작하기.md)
- [개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기]([C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md)
- [가변 길이 구조체(Struct Hack)와 필러 필드 — 헤더 뒤에 매달리는 가변 payload]([C]%20가변%20길이%20구조체(Struct%20Hack)와%20필러%20필드%20—%20헤더%20뒤에%20매달리는%20가변%20payload.md)

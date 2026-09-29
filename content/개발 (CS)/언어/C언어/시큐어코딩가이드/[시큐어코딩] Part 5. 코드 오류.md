---
title: "Part 5. 코드 오류"
tags: 
created: 2026-09-28
modified: 2026-09-29
---

# Part 5. 코드 오류

> 58개 중 **9개**. 타입변환 오류, 자원(메모리 등)의 부적절한 반환 등과 같이 개발자가 범할 수 있는 코딩오류로 유발되는 보안약점.
> **관통 질문**: 이 포인터와 이 자원의 "수명"은 어디까지인가? 4개 소분류(포인터/자원/정수/코드정확성)로 나눠 보되, 가이드 원문 번호(교육 순번 = 원문 번호) 순서로 적는다.

---

## 포인터 계열

### 1. 널(Null)포인터 역참조 `CWE-476`

> **신뢰 경계**: `getenv()`/`malloc()` 등 실패 시 NULL 반환 → 검사 없이 → 포인터 역참조
> ⚠️ "반환값이 NULL일 수 있는 함수 목록"을 팀 표준으로 정하고, 역참조 직전에 무조건 검사하도록 습관화하라.

**공격 시나리오**: 서비스 거부(DoS)로 직결되며, 공격자가 의도적으로 역참조를 유발해 발생하는 예외 상황을 추후 공격 계획에 이용할 수 있다.

❌ **Bad**
```c
p = getenv("CGI_HOME");                     /* 미설정 시 NULL 반환 */
strncpy(cgi_home, p, BUFSIZE-1);            /* NULL 역참조 */
```

✅ **Good**
```c
p = getenv("CGI_HOME");
if (p == NULL) { exit(1); }                 /* 사용 전 NULL 검사 */
strncpy(cgi_home, p, BUFSIZE-1);
```

**치환 규칙**: 변경될 수 있는 모든 포인터·함수 입력 인자·구조체 멤버 포인터는 사용 전 NULL 검사.

---

### 5. 스택 변수 주소 리턴 `CWE-562`

> **신뢰 경계**: 함수 종료 → 지역 변수 소멸 → 반환된 포인터가 여전히 유효하다는 착각
> ⚠️ 반환하는 포인터가 가리키는 메모리의 "수명"을 항상 함수 계약(주석)으로 명시하라.

**공격 시나리오**: 해제된 스택 영역 접근은 예측 불가능한 값 변조·크래시를 유발하고, 증상이 즉시 나타나지 않아 디버깅이 매우 어렵다.

❌ **Bad**
```c
char *rpl() {
    char p[10];          /* 스택 지역 배열 */
    return p;            /* 함수 종료 시 소멸되는 주소 */
}
```

✅ **Good**
```c
char *rpl() {
    char p[10];
    char *buf = (char *)malloc(10);      /* 힙에 할당 */
    if (!buf) exit(1);
    memcpy(buf, p, 10);
    return buf;                          /* 함수 종료 후에도 유효, 호출자가 free */
}
```

**치환 규칙**: 지역변수 주소 반환 금지 → `malloc()` 힙 할당 후 반환(호출자 free 책임) 또는 호출자 제공 버퍼에 채워 넣는 방식.

> [!NOTE]- 보충 — 구조체는 "값으로 반환"도 유효한 선택지다
> 위 Bad 예시는 배열(`char p[10]`)의 **주소**를 반환하는 패턴이다. 배열은 포인터로 decay하므로 반환하는 순간 이미 죽은 스택 주소를 넘기는 셈이라 이 방식 자체가 성립하지 않는다. 하지만 **구조체(struct)는 다르다** — C는 구조체를 "값"으로 반환하는 것을 언어 차원에서 지원한다. `return p;` 에서 `p` 가 구조체 지역변수면, 컴파일러가 `p` 의 내용을 통째로 복사해서 호출자에게 넘긴다. 넘어가는 건 `p` 의 주소가 아니라 `p` 의 **복사본**이므로 함수가 끝나 `p` 가 소멸해도 문제가 없다.
>
> ```c
> typedef struct { int x, y; char tag[16]; } Point;
>
> Point make_point(int x, int y) {
>     Point p = { x, y, "origin" };   /* 지역 변수 */
>     return p;                        /* 구조체는 값으로 복사되어 반환된다 — p의 주소가 아니다 */
> }
>
> Point pt = make_point(1, 2);        /* 호출자 스택에 통째로 복사됨. free 불필요, 소유권 문제 없음 */
> ```
>
> - **작은 구조체(레지스터 몇 개, 십수 바이트 이내)** 는 값 복사 반환이 낫다 — `malloc`/`free` 짝을 맞출 필요가 없고, 실패 시 NULL 체크·소유권 이전 같은 부가 로직이 통째로 사라진다.
> - **구조체가 커질수록(배열 멤버가 크거나 중첩이 깊을 때)** 값 복사 비용(스택 복사·caller 프레임 크기)이 커지므로, 이 노트의 Good 예시처럼 **힙에 할당해 포인터로 반환**하는 편이 맞다.
> - 기준은 "포인터 하나보다 확실히 싼가"다 — 애매하면 일단 값 복사로 시작하고, 프로파일링에서 복사 비용이 드러날 때 힙+포인터로 바꿔도 늦지 않다.

---

## 자원 계열

### 2. 부적절한 자원 해제 `CWE-404`

> **신뢰 경계**: 정상 종료 경로 → 에러/예외 경로에서는 검증 없이 → 자원(핸들·소켓) 미반환
> ⚠️ 자원 해제는 "정상 경로"가 아니라 "에러 경로"에서 빠진다. `goto cleanup` 같은 단일 해제 지점을 설계하라.

**공격 시나리오**: 누적된 미반환 자원이 메모리·핸들 고갈을 일으켜 시스템 전체가 서비스 불능(DoS) 상태에 빠진다.

❌ **Bad**
```c
SQLAllocHandle(SQL_HANDLE_ENV, SQL_NULL_HANDLE, &env_hd);
SQLAllocHandle(SQL_HANDLE_DBC, env_hd, &con_hd);
/* 핸들을 반환하지 않고 함수 종료 -> 자원 누수 */
```

✅ **Good**
```c
SQLAllocHandle(SQL_HANDLE_ENV, SQL_NULL_HANDLE, &env_hd);
SQLAllocHandle(SQL_HANDLE_DBC, env_hd, &con_hd);
SQLFreeHandle(SQL_HANDLE_DBC, con_hd);      /* 할당 역순 반환 */
SQLFreeHandle(SQL_HANDLE_ENV, env_hd);
```

**치환 규칙**: 할당-반환 함수를 모든 코드 경로(정상+에러)에서 쌍으로, 핸들 변수를 -1/NULL로 초기화해 유효할 때만 해제.

---

### 9. 무한 자원 할당 `CWE-770`

> **신뢰 경계**: 요청 메시지 길이/접속 수 → 상한 없이 → 메모리·스레드·소켓 할당
> ⚠️ "요청당 무제한 할당"은 곧 공격자에게 준 무료 DoS 버튼이다. 상한과 Pool이 답이다.

**공격 시나리오**: 공격자가 소수의 요청만으로 메모리·스레드·소켓을 소진시켜 시스템 전체를 서비스 거부 상태로 만들 수 있다.

❌ **Bad**
```c
while (TRUE) {                              /* 접속마다 무제한 생성 */
    connectionSocket = accept(listenSocket, &cli_addr, &len);
    pthread_create(&thread, NULL, communication, &connectionSocket);
}
```

✅ **Good**
```c
while (TRUE) {
    connectionSocket = accept(listenSocket, &cli_addr, &len);
    if (threadPool.alloc(communication, &connectionSocket))
        connectionSocket = -1;
    else close(connectionSocket);           /* Pool 초과 시 반환 */
}
```

**치환 규칙**: 메시지 길이·총 연결 수에 `unsigned` + `MAX` 상한, Thread Pool/Connection Pool로 재사용.

---

## 정수 계열

### 3. 부호 정수를 무부호 정수로 타입 변환 오류 `CWE-195`

> **신뢰 경계**: 에러 표시 `-1`(signed) → 부호 확인 없이 → `unsigned` 길이 인자
> ⚠️ size_t/unsigned 인자를 받는 API에 -1이 흘러들어가는 순간이 곧 오버플로우 지점이다.

**공격 시나리오**: `-1` 을 4바이트 `unsigned int` 로 변환하면 `4,294,967,295` 가 되어, 배열 인덱스·길이 인자로 쓰이면 범위를 크게 넘어 접근한다.

❌ **Bad**
```c
unsigned int len(char *s) {
    if (s == NULL) return -1;      /* -1 -> 4294967295 */
    return strnlen(s, BUFSIZE-1);
}
```

✅ **Good**
```c
unsigned int len(char *s) {
    if (s == NULL) return 0;       /* 무부호에 안전한 0 반환 */
    return strnlen(s, BUFSIZE-1);
}
```

**치환 규칙**: 무부호 반환 함수의 에러 표시는 `-1` 대신 `0` 등 무부호에 안전한 값으로 설계, 외부 길이 값은 사용 전 범위 검사.

---

### 4. 정수를 문자로 변환 `CWE-398`

> **신뢰 경계**: 4바이트 오프셋 값 → 크기 검사 없이 → 1바이트 `char` 배열에 저장
> ⚠️ char는 "문자"일 때만 쓰고, "숫자"를 담는 순간 잘림 사고가 시작된다.

**공격 시나리오**: 잘린 값이 오프셋·카운터·길이로 재사용되면 잘못된 메모리 위치 접근이나 논리 우회로 이어진다.

❌ **Bad**
```c
struct DocumentInfo { char lineStartOffset[1024]; };   /* 오프셋을 char 배열에 */
lineStartOffset[lineCount] = lineOffset;               /* 255 초과 시 잘림 */
```

✅ **Good**
```c
struct DocumentInfo { int lineStartOffset[1024]; };    /* 용도에 맞는 int 배열 */
lineStartOffset[lineCount] = lineOffset;
if (lineOffset >= INT_MAX) return NULL;                /* 최대치 검사 */
```

**치환 규칙**: 정수를 담을 저장소는 용도에 맞는 정확한 타입(`int` 등)으로 선언, 타입 최대치 초과 값은 에러 처리.

---

## 코드 정확성 계열

### 6. 매크로의 잘못된 사용 `CWE-730`

> **신뢰 경계**: (해당 없음 — 짝 매크로 누락 자체가 결함)
> ⚠️ 쌍(pair) 매크로는 "먼저 두 줄 다 쓰고 그 사이를 채운다"가 유일한 안전 습관이다.

**공격 시나리오**: `pthread_cleanup_push()`/`pthread_cleanup_pop()` 처럼 짝으로 써야 하는 매크로를 하나만 쓰면 스택 불균형, 정리(cleanup) 핸들러 미실행에 의한 자원 누수·서비스 거부가 발생한다.

❌ **Bad**
```c
pthread_cleanup_push(routine, ((void*)&a));    /* pop 없음 */
```

✅ **Good**
```c
pthread_cleanup_push(routine, ((void*)&a));
pthread_cleanup_pop(1);                        /* 같은 스코프에서 짝으로 */
```

**치환 규칙**: push/pop, START/END 같은 쌍 매크로는 작성 즉시 짝을 함께 기술한다.

---

### 7. 코드정확성: 스택 주소 해제 `CWE-730`

> **신뢰 경계**: (해당 없음 — free 대상 오분류가 결함)
> ⚠️ free()의 유일한 정당한 인자는 "내가 malloc 계열로 받은 포인터"뿐이다.

**공격 시나리오**: 스택 변수나 `strtok()` 반환값처럼 힙에 할당되지 않은 주소를 `free()` 하면 힙 메타데이터가 손상되어 즉시 abort 되거나 임의 코드 실행으로 악용될 수 있다.

❌ **Bad**
```c
char p[10];
free(p);                          /* 스택 주소 해제 -> 비정상 동작 */
char *pch = strtok(str, " ,.-");
free(pch);                        /* strtok 은 할당하지 않음 */
```

✅ **Good**
```c
char p[10];                       /* 스택 변수는 자동 반환 */
char *pch = strtok(str, " ,.-");
while (pch != NULL) {
    printf("%s\n", pch);
    pch = strtok(NULL, " ,.-");   /* free 호출 없음 */
}
```

**치환 규칙**: `malloc`/`calloc`/`realloc` 으로 얻은 포인터만 `free()` 대상. 라이브러리 함수 반환값은 "할당 여부"를 문서에서 먼저 확인.

---

### 8. 코드 정확성: 스레드 조기 종료 `CWE-730`

> **신뢰 경계**: (해당 없음 — join/detach 결정 누락이 결함)
> ⚠️ 스레드는 만드는 순간 "join할 것인가 detach할 것인가"를 반드시 함께 결정하라.

**공격 시나리오**: 부모 스레드가 자식보다 먼저 종료되어 자원을 회수하지 못하면, 스레드를 반복 생성하는 서버에서 누수가 누적되어 메모리 고갈과 서비스 거부로 이어진다.

❌ **Bad**
```c
pthread_create(&th, NULL, th_worker, (void *)&a);
return 0;                          /* join/detach 없이 부모 종료 */
```

✅ **Good**
```c
pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
pthread_create(&thread, &attr, _MakeEstimate, names[i]);
pthread_attr_destroy(&attr);       /* 또는 pthread_join(th, ...) */
```

**치환 규칙**: 부모가 자식을 기다려야 하면 `pthread_join()`, 먼저 끝나야 하면 `pthread_detach()`/`PTHREAD_CREATE_DETACHED` 를 명시적으로 선택.

---

## Part 5 미니 체크리스트

- [ ] `getenv`/`malloc` 등 NULL을 반환할 수 있는 함수의 결과를 검사 없이 역참조하는가
- [ ] 지역 변수(스택)의 주소나 구조체를 함수 밖으로 반환하는 코드가 있는가
- [ ] 자원 할당·해제가 에러 경로를 포함한 모든 경로에서 짝을 이루는가, 단일 해제 지점(`goto cleanup`)이 있는가
- [ ] 요청당 자원(메시지 길이·스레드·소켓)에 상한이 없는가
- [ ] 무부호 함수의 에러 표시가 `-1` 인가(0 등 안전한 값으로 바꿔야 함)
- [ ] 정수를 `char` 배열에 저장해 잘림이 발생할 수 있는가
- [ ] push/pop 짝 매크로 중 하나가 누락된 곳이 있는가
- [ ] `free()` 인자가 항상 `malloc` 계열 반환값인지 확인했는가
- [ ] 생성한 스레드마다 join 또는 detach 여부를 명시적으로 결정했는가

---

## 관련 노트

- [시큐어코딩가이드 목록](시큐어코딩가이드%20목록.md)
- [Part 4. 에러 처리](%5B시큐어코딩%5D%20Part%204.%20에러%20처리.md)
- [Part 6. 캡슐화](%5B시큐어코딩%5D%20Part%206.%20캡슐화.md)
- [동적 할당 소유권 — caller free vs callee create·destroy 쌍](../%5BC%5D%20동적%20할당%20소유권%20—%20caller%20free%20vs%20callee%20create·destroy%20쌍.md)

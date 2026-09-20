---
title: "C언어 시스템 프로그래밍 단계별 실습 가이드"
tags: 
created: 2026-09-19
modified: 2026-09-19
---

# C언어 시스템 프로그래밍 단계별 실습 가이드 & 마스터 로드맵

> [!NOTE]
> 본 실습은 상위 폴더(`../`)에 정리된 C언어 기초 문법, 저수준 메모리 조작, 실무 C 관례(UB 방지), 멀티스레드 동시성 및 소켓/네트워크 프로그래밍 이론을 레고 블록처럼 단계별로 직접 구현해보는 핸즈온(Hands-on) 실습 프로젝트입니다.
> 
> 각 단계(Stage)별로 독립된 소스코드를 작성하고 테스트할 수 있으며, 최종적으로는 모든 부품이 결합된 **고성능 비동기 패킷/메시지 프로세싱 엔진**으로 완성됩니다.

---

## 🗺️ 전체 실습 아키텍처

```text
[Stage 1: 저수준 기반] ────► [Stage 2: 실무 관례 & 파서] ────► [Stage 3: 캡슐화 & 자료구조]
- 정수형 바이트/엔디안        - do-while(0) 안전 로거           - Opaque Pointer 링버퍼
- 인터넷 체크섬 알고리즘      - goto cleanup 단일 출구          - Struct Hack 가변 패킷
- 비트 패킹/언패킹            - strtok_r & URL 디코더           - 함수 포인터 디스패처
- 메모리 정렬/1바이트 패킹     - char** 2단계 동적 할당
                                                                       │
                                                                       ▼
[Stage 5: 동시성 & 네트워크 엔진] ◄────────────────────── [Stage 4: 영속성 & 시간 안정성]
- intptr_t 스레드 인자 전달                                - 바이너리 저널 I/O (fseek/락)
- C11 Atomic 무락 카운터                                    - 64비트 time_t 오버플로 방어
- Check-in/out 비동기 타임아웃 감시                        - Coverity 정적 분석 대응
- 세션 해시 샤딩 워커 큐
- 소켓 통신 & select/epoll 다중화
```

---

## 📊 단계별 실습 개요 요약표

| 단계 | 실습 모듈 | 핵심 연계 노트 (개념) | 최종 구현 목표 |
| :--- | :--- | :--- | :--- |
| **Stage 1** | **저수준 바이트·비트 & 메모리 정렬** | `uint16_t` 바이트 저장, 엔디안/체크섬, Union, 비트플래그, 필드 패킹, 메모리 정렬 | 바이너리 프로토콜 헤더 인코더/디코더 |
| **Stage 2** | **실무 C 관례 & 안전한 문자열 처리** | `do-while(0)`, 가변인자 로거, UB 방어/단일출구, `snprintf`/`sscanf`, URL 디코딩, `char**` 2중포인터 | 안전한 로깅 프레임워크 & 프로토콜 텍스트 파서 |
| **Stage 3** | **캡슐화 & 모듈형 자료구조 설계** | 불투명 포인터(Opaque), 공개/코어 분리, Struct Hack, 디스패치 테이블, Ring Buffer | 불투명 원형 큐 & 가변 패킷 디스패처 |
| **Stage 4** | **파일 영속성 & 64비트 시간 대응** | 파일 락, 버퍼링, `fseek`, 64비트 `time_t`(2038년/Coverity) | 트랜잭션 저널 로거 & 오버플로 방어 타이머 |
| **Stage 5** | **동시성 & 비동기 I/O 네트워크 엔진** | `pthread`+`intptr_t`, C11 Atomic, Check-in/out 타임아웃, 해시 샤딩 큐, `select`/`epoll`, 소켓 | 락 경합 없는 이벤트 기반 에코/메시지 서버 |

---

## 🛠️ 실습 환경 및 빌드 가이드

### 디렉터리 구성
```text
실습/
├── README.md                 # 본 실습 가이드 문서
├── Makefile                  # 전체 단계 통합 빌드/실행 스크립트
├── stage1_lowlevel/          # 1단계: 비트, 엔디안, 정렬, 헤더 패킹
│   ├── step1_endian_checksum.c
│   ├── step2_bit_packing.c
│   └── step3_alignment.c
├── stage2_robust/            # 2단계: 실무 C 관례, 안전한 문자열, 2차원 배열
│   ├── step1_logger.c
│   ├── step2_parser.c
│   └── step3_str_list.c
├── stage3_architecture/      # 3단계: Opaque Pointer, Struct Hack, Ring Buffer
│   ├── ring_buffer.h
│   ├── ring_buffer.c
│   ├── dispatcher.c
│   └── struct_hack.c
├── stage4_persistence/       # 4단계: 바이너리 I/O, 파일 락, 64비트 time_t
│   ├── journal_logger.c
│   └── safe_timer.c
└── stage5_concurrency/       # 5단계: pthread, atomic, 샤딩 큐, 소켓/select
    ├── worker_sharding.c
    ├── timeout_watcher.c
    └── event_server.c
```

### 권장 컴파일러 옵션 (Mac Clang 기준)
```bash
clang -Wall -Wextra -Werror -pedantic -std=c11 -g -fsanitize=address,undefined <source.c> -o <binary>
```
* `-Wall -Wextra -pedantic`: 사소한 문법적 실수와 암시적 형변환 경고를 최대로 활성화
* `-fsanitize=address,undefined`: 메모리 누수, Out-of-bounds, 댕글링 포인터(`use-after-free`), 정수 오버플로 등 UB를 런타임 즉시 검출

---

# 🚀 단계별 상세 구현 명세서

## [Stage 1] 저수준 바이트·비트 조작 & 패킷 헤더 엔진

### Step 1-1. 바이트 순서(Endianness) 변환 및 인터넷 체크섬 계산기
* **파일 위치**: `stage1_lowlevel/step1_endian_checksum.c`
* **연계 학습 노트**:
  * [[Lang] 정수형 크기(uint16_t)와 비트·바이트 메모리 저장 원리](../[Lang]%20정수형%20크기(uint16_t)와%20비트·바이트%20메모리%20저장%20원리.md)
  * [[C] 엔디안(바이트 순서)과 인터넷 체크섬](../[C]%20엔디안(바이트%20순서)과%20인터넷%20체크섬%20—%20LSB·MSB와%20htons를%20직접%20만들어보기.md)
  * [[Lang] Union, Typedef, Struct 구조 및 활용](../[Lang]%20Union,%20Typedef,%20Struct%20구조%20및%20활용.md)
* **구현 미션**:
  1. `union`을 활용하여 시스템이 리틀 엔디안인지 빅 엔디안인지 판별하는 함수 `is_little_endian()` 작성.
  2. 시스템 라이브러리(`htons`, `ntohs`) 대신 비트 시프트(`<<`, `>>`)와 마스킹(`&`)만으로 동작하는 `my_htons()`, `my_ntohs()`, `my_htonl()`, `my_ntohl()` 구현.
  3. IP/ICMP 표준 16비트 One's Complement 인터넷 체크섬 알고리즘(`uint16_t calc_checksum(const void *buf, size_t len)`) 구현.
* **검증 시나리오**:
  * `0x12345678` 정수를 변환하여 바이트 배열 `[0x12, 0x34, 0x56, 0x78]`로 출력되는지 확인.
  * 계산된 체크섬을 포함한 패킷 전체를 다시 체크섬 계산 시 `0x0000` (또는 `0xFFFF`)가 나오는지 무결성 검증.

---

### Step 1-2. 비트 플래그 연산 및 비트 필드 패킹(Bit Packing)
* **파일 위치**: `stage1_lowlevel/step2_bit_packing.c`
* **연계 학습 노트**:
  * [[C] 비트플래그(Bit Flag) 연산](../[C]%20비트플래그(Bit%20Flag)%20연산.md)
  * [[C] 시프트로 여러 필드를 하나의 정수에 조합하기 — 필드 패킹](../[C]%20시프트로%20여러%20필드를%20하나의%20정수에%20조합하기%20—%20필드%20패킹.md)
* **구현 미션**:
  1. 다음 비트 플래그 enum 정의:
     * `FLAG_COMPRESSED = 1 << 0` (0x01)
     * `FLAG_ENCRYPTED  = 1 << 1` (0x02)
     * `FLAG_RETRY      = 1 << 2` (0x04)
     * `FLAG_KEEP_ALIVE = 1 << 3` (0x08)
  2. 하나의 32비트 정수(`uint32_t`) 안에 복합 필드를 패킹/언패킹하는 함수 작성:
     * `version` (4비트, bits 28~31)
     * `type` (4비트, bits 24~27)
     * `flags` (8비트, bits 16~23)
     * `seq_id` (16비트, bits 0~15)
* **검증 시나리오**:
  * 임의의 필드 값을 채워 넣고 `pack_header()` 후 `unpack_header()`로 복원했을 때 원본 값과 100% 일치함을 `assert()`로 검증.

---

### Step 1-3. 메모리 정렬(Alignment)과 1바이트 패킹 구조체
* **파일 위치**: `stage1_lowlevel/step3_alignment.c`
* **연계 학습 노트**:
  * [[CS] C언어 교육 (구조체 패딩 및 pragma pack)](../[CS]%20C언어%20교육.md)
  * [[C] 메모리 정렬과 aligned_alloc](../[C]%20메모리%20정렬(Memory%20Alignment)과%20aligned_alloc%20—%20CPU%20워드%20경계와%20안전한%20할당%20래퍼.md)
* **구현 미션**:
  1. 동일한 멤버(`uint8_t`, `uint32_t`, `uint16_t`, `char[5]`)를 갖는 두 구조체 정의:
     * `struct DefaultHeader` (컴파일러 기본 정렬)
     * `struct PackedHeader` (`#pragma pack(push, 1)` 적용)
  2. `sizeof` 및 `offsetof()` 매크로로 각 필드의 실제 오프셋과 패딩 바이트 크기를 계산하여 콘솔에 시각화 출력.
  3. POSIX `posix_memalign()` 또는 C11 `aligned_alloc()`을 안전하게 래핑한 `safe_aligned_alloc(size_t alignment, size_t size)` 작성.
* **검증 시나리오**:
  * 반환된 주소가 지정한 정렬 단위(예: 64바이트 캐시 라인)의 배수인지 확인 (`((uintptr_t)ptr % 64) == 0`).

---

## [Stage 2] 실무 C 코딩 관례 & 안전한 메모리/문자열 조작

### Step 2-1. 안전한 로깅 매크로 & 단일 출구(Single Exit) 에러 정리기
* **파일 위치**: `stage2_robust/step1_logger.c`
* **연계 학습 노트**:
  * [[C] 매크로를 do-while(0)으로 감싸는 이유](../[C]%20매크로를%20do-while(0)%EC%9C%BC%EB%A1%9C%20%EA%B0%90%EC%82%B0%EB%8A%94%20%EC%9D%B4%EC%9C%A0%20%E2%80%94%20%EC%97%AC%EB%9F%AC%20%EB%AC%B8%EC%9E%A5%EC%9D%84%20%EC%95%88%EC%A0%84%ED%95%9C%20%ED%95%98%EB%82%98%EB%A1%9C%20%EB%AC%B6%EA%B8%B0.md)
  * [[C] 가변 인자 함수 — stdarg.h로 나만의 printf 만들기](../[C]%20가변%20인자%20함수%20—%20stdarg.h로%20나만의%20printf%20만들기.md)
  * [[C] 실무 C 코드 관례와 UB 함정 정리 (1급: 생성/소멸 쌍, 단일출구 goto cleanup)](../[C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)
* **구현 미션**:
  1. `do { ... } while(0)` 기반 `LOG_INFO(fmt, ...)`, `LOG_WARN(fmt, ...)`, `LOG_ERROR(fmt, ...)` 매크로 구현.
  2. `vsnprintf`를 활용하여 `[YYYY-MM-DD HH:MM:SS] [LEVEL] [file.c:line] 메시지` 형식 출력 함수 `log_write()` 구현.
  3. 리소스 A(메모리), 리소스 B(소켓 핸들), 리소스 C(파일 포인터)를 순차적으로 획득하다가 중간에 실패했을 때, **획득에 성공한 리소스만 정확히 역순으로 해제**하는 `goto cleanup` 패턴 함수 구현.
* **검증 시나리오**:
  * 리소스 B 할당 실패를 고의로 유발했을 때 리소스 A만 정상 해제되고 메모리/FD 누수가 없는지 검증.

---

### Step 2-2. 안전한 프로토콜 문자열 파서 & URL 퍼센트 디코더
* **파일 위치**: `stage2_robust/step2_parser.c`
* **연계 학습 노트**:
  * [[C] 문자열 배열 재대입과 복사 — strncpy·snprintf·sscanf 비교](../[C]%20문자열%20배열%20재대입과%20복사%20—%20strncpy·snprintf·sscanf%20비교.md)
  * [[C] 문자열 비교와 strcasecmp](../[C]%20문자열%20비교와%20strcasecmp%20%E2%80%94%20strcmp%20%EC%B0%A8%EC%9D%B4,%20%EB%8C%80%EC%86%8C%EB%AC%B8%EC%9E%90%20%EB%AC%B4%EC%8B%9C%20%EB%B0%8F%20%EC%BB%B4%ED%8C%8C%EC%9D%BC%EB%9F%AC%20%EC%86%8D%EC%84%B1%20%ED%95%B4%EB%8F%85.md)
  * [[Lang] strtok_r과 sscanf 문자열 파싱 원리 및 &save 동작 분석](../[Lang]%20strtok_r과%20sscanf%20문자열%20파싱%20원리%20및%20&save%20동작%20분석.md)
  * [[C] 퍼센트 인코딩(URL Encoding)](../[C]%20퍼센트%20인코딩(URL%20Encoding)%20—%20문자를%20%25XX로%20바꾸고%20되돌리기.md)
* **구현 미션**:
  1. `POST /submit?user=alice%20kim&action=run HTTP/1.1` 문자열 파싱:
     * `sscanf(..., "%15s %255s %15s", ...)` 너비 지정자를 사용해 버퍼 오버플로 방어.
     * `strtok_r`의 재진입 가능(Thread-safe) 특성을 이용해 쿼리 파라미터(`user=...`, `action=...`) 분리.
     * `strcasecmp`로 대소문자 무관 HTTP 메서드/헤더 키 비교.
  2. `%XX` 16진수 문자열을 원본 문자로 복원하는 `url_decode(char *dst, size_t dst_sz, const char *src)` 구현.
* **검증 시나리오**:
  * `alice%20kim`이 `alice kim`으로 정확히 디코딩되는지 확인 및 잘못된 `%ZZ` 입력 시 에러 반환 검증.

---

### Step 2-3. 동적 2차원 문자열 리스트 관리자 (`char**`)
* **파일 위치**: `stage2_robust/step3_str_list.c`
* **연계 학습 노트**:
  * [[C] 개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기](../[C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md)
  * [[CS] C언어 교육 (Caller vs Callee 동적할당 원칙)](../[CS]%20C언어%20교육.md)
* **구현 미션**:
  1. 문자열 리스트 구조체 정의:
     ```c
     typedef struct {
         size_t count;
         size_t capacity;
         char **items;
     } StringList;
     ```
  2. 생성/추가/해제 API 구현:
     * `StringList* str_list_create(size_t initial_cap);`
     * `int str_list_add(StringList *list, const char *str);` (내부에서 strdup/malloc 수행)
     * `void str_list_destroy(StringList *list);` (각 원소 free 후 items 배열 free, 마지막에 list 구조체 free)
* **검증 시나리오**:
  * 다수의 문자열을 추가/해제한 후 AddressSanitizer 누수 검사 통과.

---

## [Stage 3] 캡슐화 & 모듈형 자료구조 설계

### Step 3-1. 불투명 포인터(Opaque Pointer) & 공개/코어 분리
* **파일 위치**: `stage3_architecture/ring_buffer.h`, `stage3_architecture/ring_buffer.c`
* **연계 학습 노트**:
  * [[C] 불투명 포인터(Opaque Pointer)](../[C]%20불투명%20포인터(Opaque%20Pointer)%20—%20헤더는%20선언만,%20구현은%20숨기기.md)
  * [[C] 공개 래퍼(Wrapper)와 내부 코어(Core) 분리 패턴](../[C]%20공개%20래퍼(Wrapper)와%20내부%20코어(Core)%20분리%20패턴%20—%20언더스코어(__)%20관행과%20C%20표준%20예약어.md)
  * [[C] extern과 static — 링키지와 다중 파일 공유](../[C]%20extern과%20static%20—%20링키지와%20다중%20파일%20공유.md)
  * [[C] 배열 기반 원형 큐(Ring Buffer)](../[C]%20배열%20기반%20원형%20큐(Ring%20Buffer)%20—%20front·back%20인덱스로%20만드는%20큐.md)
* **구현 미션**:
  1. `ring_buffer.h`에는 불완전 타입 `typedef struct RingBuffer RingBuffer;`와 함수 프로토타입만 노출.
  2. `ring_buffer.c` 내부에 구조체 멤버(`buffer`, `capacity`, `head`, `tail`, `count`, `mutex`) 정의.
  3. 공개 함수 `rb_push()`는 인자 유효성(NULL 체크)을 수행한 후 `static` 내부 코어 함수 `__rb_push_internal()`을 호출하도록 설계.
* **검증 시나리오**:
  * 외부 `main()` 코드에서 `rb->head` 등에 직접 접근을 시도할 때 컴파일 에러(`incomplete definition`)가 발생하는지 확인.

---

### Step 3-2. 가변 길이 구조체(Struct Hack) 기반 가변 패킷 컨테이너
* **파일 위치**: `stage3_architecture/struct_hack.c`
* **연계 학습 노트**:
  * [[C] 가변 길이 구조체(Struct Hack)와 필러 필드](../[C]%20가변%20길이%20구조체(Struct%20Hack)와%20필러%20필드%20—%20헤더%20뒤에%20매달리는%20가변%20payload.md)
  * [[C] API·규격 데이터 모델을 C 구조체로 설계하는 공식](../[C]%20API·규격%20데이터%20모델을%20C%20구조체로%20설계하는%20공식%20—%20JSON·YAML을%20정적%20메모리로%20매핑하기.md)
* **구현 미션**:
  1. C99 유연 배열 멤버(Flexible Array Member) 구조체 정의:
     ```c
     typedef struct {
         uint32_t magic;
         uint16_t cmd_type;
         uint16_t payload_len;
         uint8_t  payload[]; /* Struct Hack: 헤더 뒤에 연속 할당 */
     } Packet;
     ```
  2. `packet_create(uint16_t cmd, const void *data, uint16_t len)` 함수 작성:
     * `malloc(sizeof(Packet) + len)` 단 한 번의 호출로 헤더와 페이로드를 단일 메모리 블록에 생성.
* **검증 시나리오**:
  * `&packet->payload[0]`의 메모리 주소가 `(uint8_t*)packet + sizeof(Packet)`와 완전히 일치함을 확인.

---

### Step 3-3. 함수 포인터 디스패치 테이블 (Command Handler)
* **파일 위치**: `stage3_architecture/dispatcher.c`
* **연계 학습 노트**:
  * [[C] 함수 포인터와 디스패치 테이블 — switch 대신 테이블로 분기하기](../[C]%20함수%20포인터와%20디스패치%20테이블%20—%20switch%20대신%20테이블로%20분기하기.md)
* **구현 미션**:
  1. 핸들러 함수 포인터 타입 정의: `typedef int (*CommandHandler)(const Packet *pkt);`
  2. 명령 코드와 함수 포인터를 매핑한 디스패치 테이블 구조체 배열 작성:
     ```c
     typedef struct {
         uint16_t cmd;
         const char *name;
         CommandHandler handler;
     } CommandEntry;
     ```
  3. `dispatch_packet(const Packet *pkt)` 함수를 작성하여 명령 코드로 핸들러를 O(1) 인덱싱 또는 테이블 조회 후 호출.
* **검증 시나리오**:
  * 등록되지 않은 명령 코드가 입력되었을 때 안전하게 Fallback 핸들러(`handle_unknown`)가 호출되는지 확인.

---

## [Stage 4] 파일 영속성 & 64비트 시간/정적 분석 대응

### Step 4-1. 바이너리 트랜잭션 저널 로거 & 파일 락(File Locking)
* **파일 위치**: `stage4_persistence/journal_logger.c`
* **연계 학습 노트**:
  * [[CS] 01. 파일 I_O 구조, 콘솔 입출력 및 버퍼링](../파일입출력/[CS]%2001.%20파일%20I_O%20구조,%20콘솔%20입출력%20및%20버퍼링.md)
  * [[CS] 02. 파일 락, 오픈 모드 주의사항 및 바이너리_텍스트 처리](../파일입출력/[CS]%2002.%20파일%20락,%20오픈%20모드%20주의사항%20및%20바이너리_텍스트%20처리.md)
  * [[CS]03. fseek 파일 포인터 제어와 fopen_fclose 자원 관리](../파일입출력/[CS]03.%20fseek%20파일%20포인터%20제어와%20fopen_fclose%20자원%20관리.md)
* **구현 미션**:
  1. 고정 크기 트랜잭션 레코드 구조체(`TxRecord`: 타임스탬프, 트랜잭션ID, 상태코드, 금액) 바이너리 기록.
  2. `fcntl()` 또는 `flock()`을 사용해 파일에 쓰기 락(`F_WRLCK`)을 획득한 후 `fwrite()` 및 `fflush()` 수행.
  3. `fseek()`와 `ftell()`을 이용해 파일 끝에 새 레코드를 추가하고, 레코드 번호(`index * sizeof(TxRecord)`)로 즉시 점프하여 특정 트랜잭션의 상태만 갱신.
* **검증 시나리오**:
  * 100개의 레코드를 기록한 뒤, 임의의 50번째 레코드 상태를 읽고 수정한 후 파일 크기와 데이터 정합성 검증.

---

### Step 4-2. 2038년 문제 대응 및 정적 분석(Coverity) 호환 타이머
* **파일 위치**: `stage4_persistence/safe_timer.c`
* **연계 학습 노트**:
  * [[C] 64비트 time_t와 32비트 int 변환 — 2038년 문제와 Coverity 정적 분석 대응](../[C]%2064비트%20time_t와%2032비트%20int%20변환%20—%202038년%20문제와%20Coverity%20정적%20분석%20대응.md)
* **구현 미션**:
  1. 64비트 `time_t` 값을 32비트 정수 시스템에 전달하거나 연산할 때 발생하는 Y2038 오버플로를 방지하는 모듈러 연산(`% INT_MAX`) 구현.
  2. Coverity High 등급 결함(정수 절삭 경고)을 방지하는 안전한 경과 시간(Elapsed Delta) 계산 함수 작성:
     ```c
     uint32_t safe_elapsed_seconds(time_t start, time_t now);
     ```
* **검증 시나리오**:
  * 2038년 1월 19일 이후의 미래 타임스탬프(`time_t` > 0x7FFFFFFF) 입력 시 음수 변환 버그 없이 안전하게 처리되는지 확인.

---

## [Stage 5] 동시성 & 비동기 I/O 네트워크 엔진

### Step 5-1. `pthread` 인자 전달(`intptr_t`) & C11 Atomic 무락 통계 카운터
* **파일 위치**: `stage5_concurrency/worker_sharding.c`
* **연계 학습 노트**:
  * [[C] pthread_create에 구조체 포인터 넘기기](../[C]%20pthread_create에%20구조체%20포인터%20넘기기%20—%20void%20포인터와%20이중포인터%20정리.md)
  * [[C] 정수를 void 포인터 인자에 실어 보내기 — intptr_t 캐스팅 관용구](../[C]%20정수를%20void%20포인터%20인자에%20실어%20보내기%20—%20intptr_t%20캐스팅%20관용구.md)
  * [[C] 락 없는 카운터 — GCC 원자적 연산 빌트인과 C11 atomic](../[C]%20락%20없는%20카운터%20—%20GCC%20원자적%20연산%20빌트인과%20C11%20atomic.md)
* **구현 미션**:
  1. 스레드 생성 시 `(void *)(intptr_t)i` 캐스팅으로 워커 인덱스를 전달하여 루프 변수 공유로 인한 Race Condition 차단.
  2. 글로벌 통계 변수(총 패킷 수, 실패 수)를 뮤텍스 없이 C11 `stdatomic.h`의 `atomic_fetch_add_explicit()`으로 원자적 업데이트.
* **검증 시나리오**:
  * 8개 스레드가 각각 100,000번씩 카운터를 증가시켰을 때 최종 값이 정확히 800,000이 되는지 확인.

---

### Step 5-2. 비동기 요청 타임아웃 감시 (Check-in / Check-out 타이머)
* **파일 위치**: `stage5_concurrency/timeout_watcher.c`
* **연계 학습 노트**:
  * [[C] 비동기 요청-응답의 타임아웃 감시 — Check-in과 Check-out 타이머 패턴](../[C]%20비동기%20요청-응답의%20타임아웃%20감시%20—%20Check-in과%20Check-out%20타이머%20패턴.md)
* **구현 미션**:
  1. 요청 슬롯 배열(`TimerSlot slots[MAX_SLOTS]`) 정의 (상태: EMPTY, PENDING, EXPIRED).
  2. `check_in(uint32_t req_id, uint32_t timeout_ms)`: 요청 등록.
  3. `check_out(uint32_t req_id)`: 정상 응답 도착 시 타이머 해제.
  4. 백그라운드 타이머 스레드가 50ms마다 슬롯을 순회하며 만료된 요청 발견 시 `on_timeout()` 콜백 트리거.
* **검증 시나리오**:
  * 300ms 타임아웃으로 등록하고 100ms 시점에 check_out한 요청은 만료되지 않고, 응답이 오지 않은 요청만 정확히 300ms 이후 콜백이 호출되는지 검증.

---

### Step 5-3. 세션 해시 샤딩 워커 큐 (Lock Contention 제거)
* **파일 위치**: `stage5_concurrency/worker_sharding.c`
* **연계 학습 노트**:
  * [[C] 스레드별 전용 큐와 해시 샤딩 — 락 경합 없는 고성능 워커 패턴](../[C]%20스레드별%20전용%20큐와%20해시%20샤딩%20—%20락%20경합%20없는%20고성능%20워커%20패턴.md)
* **구현 미션**:
  1. N개의 워커 스레드마다 독립된 전용 큐(Stage 3의 Ring Buffer) 할당.
  2. 수신된 작업의 `session_id`를 해싱(`hash(session_id) % N`)하여 해당 워커의 전용 큐에만 인큐(Enqueue).
  3. 스레드 간 락 경합 없이 동일 세션의 메시지는 동일 워커가 순차 처리함을 보장.
* **검증 시나리오**:
  * 단일 전역 큐 방식과 해시 샤딩 방식의 100만 건 처리 속도(Throughput) 비교 측정.

---

### Step 5-4. 소켓 통신 & I/O 멀티플렉싱 이벤트 서버 (`select` / `epoll`)
* **파일 위치**: `stage5_concurrency/event_server.c`
* **연계 학습 노트**:
  * [[TCP_IP] Socket 통신 - 핵심 개념 및 특징 정리](../[TCP_IP]%20Socket%20통신%20-%20핵심%20개념%20및%20특징%20정리.md)
  * [[C] select() — 여러 입력과 타임아웃 함께 기다리기](../[C]%20select()%20—%20여러%20입력과%20타임아웃%20함께%20기다리기.md)
  * [[C] epoll — fd가 많아질 때의 대안](../[C]%20epoll%20—%20fd가%20많아질%20때의%20대안.md)
  * [컴파일러: Mac 전용 GDB 컴파일_(LLDB, Clang)](../컴파일러/[Compile]%20Mac%20전용%20GDB%20컴파일_(LLDB,%20Clang).md)
* **구현 미션**:
  1. POSIX 논블로킹(Non-blocking) TCP 소켓 서버 생성 (`socket()`, `bind()`, `listen()`).
  2. `select()` (또는 리눅스 `epoll` / macOS `kqueue`)를 사용하여 다중 클라이언트 동시 접속 처리.
  3. 수신된 데이터를 Stage 1의 체크섬 검증 -> Stage 2의 파서 -> Stage 3의 디스패처로 전달하여 응답을 돌려주는 완전한 이벤트 서버 완성.
  4. `SIGINT`(Ctrl+C) 수신 시 열린 모든 소켓을 안전하게 닫고 메모리를 해제하는 정상 종료(Graceful Shutdown) 처리.
* **검증 시나리오**:
  * `nc localhost 8080` (netcat)으로 3개 이상의 터미널에서 동시 접속 후 메시지 송수신 테스트.

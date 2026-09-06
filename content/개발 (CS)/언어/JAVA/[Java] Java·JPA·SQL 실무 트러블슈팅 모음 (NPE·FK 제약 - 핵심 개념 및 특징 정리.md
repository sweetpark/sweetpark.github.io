---
title: "Java·JPA·SQL 실무 트러블슈팅 모음 (NPE·FK 제약·상수·정규화·영속성 예외)"
tags: [학습, 개발-CS, 언어, JAVA, JPA, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# Java·JPA·SQL 실무 트러블슈팅 모음 (NPE·FK 제약·상수·정규화·영속성 예외)

> [!NOTE]
> 개발 중 실제로 겪은 5가지 이슈(NPE, 외래키 제약, 상수 초기화 오류, 정규화/반정규화, JPA `StaleObjectStateException`)와 해결 기록. Onz(칵테일 플랫폼) 프로젝트의 "트러블 슈팅" 노트에서 재사용 가능한 기술 부분만 추출.

## ⚙️ 1. `Map<String, Object>`에서 값 get() 시 NullPointerException

```java
private Map<String, Test> store = new HashMap<>();

public String getInfo(int id) {
   return store.get(id).getToken(); // NullPointerException
}

@Getter
public static class Test {
    private String name;
    private String token;
}
```

- 없는 id라서 `store.get(id)`가 null인 것 자체는 문제가 아니지만, 이어서 `null.getToken()`을 호출하는 것이 문제.

**해결**
```java
public String getInfo(int id) {
    Test test = store.get(id);
    return test != null ? test.getToken() : null;
}
```

## ⚙️ 2. 외래키(FK) 걸려있는 테이블/컬럼 삭제 순서

1. 외래키 설정 확인
2. 외래키 설정 제거
3. 컬럼 삭제 및 튜플 삭제

```sql
show create table mapping_taste; -- create 된 SQL문 확인
alter table mapping_taste drop foreign KEY FKricjsx9dadp2hayii4tpe6a58; -- 외래키 설정 제거
alter table mapping_taste drop column taste_id; -- 외래키 걸려있는 컬럼 삭제
```

## ⚙️ 3. Wrapper 클래스는 컴파일 타임 상수가 될 수 없다

`public static final`을 붙여도 "must be constant" 오류가 날 수 있다.

```java
public static final Long constant = 10L;
// Long은 Wrapper 클래스라서 초기화 상수로 취급되지 않음 (클래스가 호출되어야 하므로 상수 불가)

public static final long constant = 10L; // 수정: 기본형(long)을 써야 컴파일 타임 상수로 인정됨
```

## ⚙️ 4. 정규화 vs 반정규화 — 데이터 규모에 따른 선택

- 중복 데이터를 줄이기 위해 정규화를 진행했으나, 실제로는 자주 쌓이는 트랜잭션성 데이터가 아니라 정적(참조성) 데이터인 경우 반정규화가 더 적합할 수 있음.
- 정규화가 과도할 때의 문제:
    1. 관리 포인트가 너무 많아짐(단순 정적 데이터를 저장하는 것뿐인데 유지보수 비용이 커짐)
    2. Mapping 테이블을 둬야 하므로 조회 시 JOIN 리소스가 늘어남
- 판단 기준: 데이터가 자주 변하지 않고 조회 위주라면 반정규화로 조회 성능/개발 편의성을 얻는 게 나을 수 있다.

## ⚙️ 5. JPA `StaleObjectStateException` (영속성 컨텍스트 충돌)

같은 트랜잭션/영속성 컨텍스트 내에서 이미 조회한 엔티티를 다른 서비스가 다시 조회해 수정하려 하면, JPA의 낙관적 락(버전 관리) 메커니즘이 충돌을 감지해 예외를 던질 수 있다.

```java
// memberSetService.java
@Transactional
public void setMember() {
    Member member = memberRepository.findById(1L)
        .orElseGet(() -> Member.builder().id(1L).name("park").build());
    memberRepository.save(member);
}

// memberService.java
@Transactional
public void init() {
    Member member = memberRepository.findById(1L);
    initRepository.save(Init.builder().member(member).time(LocalDateTime.now()).build());
}

public class Initialize implements ApplicationRunner {
    private final MemberSetService memberSetService;
    private final MemberService memberService;

    public Initialize(MemberSetService setService, MemberService service) {
        this.memberSetService = setService;
        this.memberService = service;
    }

    @Override
    public void run() {
        // StaleObjectStateException 발생!
        memberSetService.setMember();
        memberService.init();
    }
}
```

**시도한 해결 방법**
1. 아예 분리해버리기 — 다른 초기화 절차에 따로 등록(`data.sql` + init 두 개로 분리) → **성공**
2. 순차 처리(1. setMember → 2. init()) → 실패
3. DB에서 `@Version` 제거 → 실패

**결론**: 동일한 초기화 흐름 안에서 같은 엔티티를 조회·수정하는 로직을 함께 실행하지 말고, 초기화 절차 자체를 물리적으로 분리하는 것이 가장 안전했다.

## 관련 문서

- [(프로젝트) 트러블슈팅 - UTF8mb4 인코딩 이슈 및 개발 중 이슈 모음](../../../프로젝트/토이프로젝트/Onz%20(칵테일%20플랫폼)/[트러블슈팅]%20UTF8mb4%20인코딩%20이슈%20및%20개발%20중%20이슈%20모음.md) — 위 5가지 이슈를 실제로 겪은 Onz 프로젝트의 트러블슈팅 기록

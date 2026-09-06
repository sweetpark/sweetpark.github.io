---
title: "Rule Test"
tags: [학습, 개발-CS, 데이터베이스, 개발, MyBatis, SQL, QualityGate, Gradle]
modified: 2026-09-05
---

# Rule Test

MyBatis Mapper의 SQL 품질을 빌드 시점에 자동 검증하는 "Rule Test / Quality Gate" 설계 노트다. FAIL(빌드 차단)·WARN(로그 경고)·GUIDE(문서 권고) 3단계로 규칙 강제 수준을 나누고, SQL 실행 가능 여부·SQL Injection(`${}`)·트랜잭션 예외 삼킴 패턴을 Gradle 플러그인으로 자동 탐지하는 아키텍처와 실제 빌드 차단 사례를 담고 있다. 핵심은 "비즈니스 로직을 검증하는 단위테스트"가 아니라 "조용히 깨지는 구조적 문제를 조기에 잡는 안전망"이라는 관점이다.

- Governence 테스트
    
    ---
    
    # 📘 Project Quality Rule 정의서 (Draft)
    
    ## 1. 문서 목적
    
    본 문서는
    
    **여러 개발자가 동시에 개발하는 환경에서 발생할 수 있는 구조 붕괴,사이드 이펙트, 암묵지로 인한 오류를 사전에 차단**하기 위해 정의된**프로젝트 공통 Rule 및 자동 검증 기준**을 설명한다.
    
    본 Rule은 다음을 목표로 한다.
    
    - 아키텍처의 **최소한의 일관성 보호**
    - “당연히 되는 줄 알았던 것”이 깨지는 상황 방지
    - 리팩토링 시 **안전망 역할**
    - 가이드가 아닌 **시스템에 의한 1차 검열**
    
    ---
    
    ## 2. Rule 적용 원칙 (중요)
    
    ### ✅ 이 Rule은 무엇을 하지 않는가
    
    - 비즈니스 로직의 정답을 검증하지 않는다
    - 개인 스타일(포맷, 취향)을 강제하지 않는다
    - 모든 예외를 막으려 하지 않는다
    
    ### ✅ 이 Rule이 하는 일
    
    - **조용히 깨지는 구조적 문제**를 조기에 감지한다
    - 팀 내부 합의된 규칙을 **코드 레벨에서 고정**한다
    - “몰랐다 / 까먹었다”를 방지한다
    
    ---
    
    ## 3. Rule Level 정의
    
    Rule은 강제 수준에 따라 다음과 같이 구분된다.
    
    | Level | 의미 |
    | --- | --- |
    | **FAIL** | 위반 시 테스트 실패 (빌드 차단) |
    | **WARN** | 테스트는 통과하되 로그로 경고 |
    | **GUIDE** | 문서/리뷰 가이드 (시스템 강제 없음) |
    
    ---
    
    ## 4. 공통 예외 처리 방식
    
    Rule 적용이 예외적으로 어려운 경우,
    
    **반드시 명시적인 사유와 함께 예외 처리**를 해야 한다.
    
    ### 예외 처리 방법
    
    ```java
    @RuleSkip(reason = "공통 유틸 서비스, 메뉴 단위 서비스 아님")
    
    ```
    
    - `reason`은 필수
    - 사유 없는 예외는 허용하지 않음
    - 예외는 **암묵적 허용이 아니라 명시적 선택**
    
    ---
    
    ## 5. Rule 상세 정의
    
    ---
    
    ### 5.1 Service 명명 규칙 (FAIL)
    
    ### 규칙
    
    - 메뉴 단위 서비스는 반드시 아래 형식을 따른다.
    
    ```
    I_UI_10000.html  →  @Service("I_sv10000")
    
    ```
    
    ### 검증 내용
    
    - 메뉴 ID와 Service Bean Name 불일치
    - 규칙을 벗어난 서비스 네이밍
    
    ### 목적
    
    - 메뉴 ↔ 서비스 매핑의 명확성
    - 구조 탐색 비용 감소
    - 리팩토링 시 영향 범위 추적 용이
    
    ---
    
    ### 5.2 Controller → Service 계층 보호 (FAIL)
    
    ### 규칙
    
    - Controller는 Mapper에 직접 접근할 수 없다.
    - 모든 DB 접근은 Service를 통해 이루어져야 한다.
    
    ### 검증 내용
    
    - Controller에서 Mapper 직접 주입 여부
    
    ### 목적
    
    - 계층 붕괴 방지
    - 트랜잭션 경계 명확화
    - 구조적 리팩토링 가능성 확보
    
    ---
    
    ### 5.3 SQL ID 명명 규칙 (FAIL)
    
    ### 규칙
    
    SQL ID는 반드시 CRUD 성격을 드러내는 Prefix를 가진다.
    
    ```
    selectXXX
    insertXXX
    updateXXX
    deleteXXX
    
    ```
    
    ### 추가 검증
    
    - SQL ID Prefix와 실제 CommandType 일치 여부
    
    ### 목적
    
    - SQL 성격의 즉각적 파악
    - 로그/장애 분석 가독성 향상
    - Mapper 관리 비용 감소
    
    ---
    
    ### 5.4 SQL 실행 가능 여부 검증 (FAIL)
    
    ### 규칙
    
    - 모든 Mapper SQL은 **기본 파라미터 기준으로 실행 가능해야 한다.**
    - 결과 값의 정합성은 검증 대상이 아니다.
    
    ### 목적
    
    - 컬럼/테이블 오타 조기 발견
    - 리팩토링 중 Mapper 깨짐 방지
    - 운영 단계 SQL 오류 차단
    
    ---
    
    ### 5.5 트랜잭션 경계 보호 (FAIL)
    
    ### 규칙
    
    - DB 접근이 발생하는 Service는 트랜잭션 경계를 가져야 한다.
    
    ### 예외
    
    - Read-only 단순 조회
    - 공통 유틸성 서비스 (`@RuleSkip` 필요)
    
    ### 목적
    
    - 데이터 정합성 보호
    - 부분 성공/부분 실패 방지
    - 운영 장애 예방
    
    ---
    
    ### 5.6 SQL 주석 가이드 (WARN)
    
    ### 권장 사항
    
    ```sql
    /* I_userMapper.selectUserList */
    SELECT ...
    
    ```
    
    ### 강제 여부
    
    - ❌ 테스트 실패 조건 아님
    - ⭕ 로그 경고만 출력
    
    ### 목적
    
    - 장애 분석 시 SQL 출처 추적
    - 로그 가독성 개선
    - 개발자 편의성 향상
    
    ---
    
    ### 5.7 Mapper 단독 호출 Service (WARN)
    
    ### 내용
    
    - 하나의 Service가 단순히 하나의 Mapper만 호출하는 경우 경고
    
    ### 목적
    
    - 의미 없는 계층 증가 감지
    - 향후 리팩토링 포인트 제공
    
    ---
    
    ## 6. 이 Rule을 지켜야 하는 이유
    
    - 이 Rule은 **완벽함을 강제하지 않는다**
    - 다만 **“당연히 되는 줄 알았던 것”이 깨지는 상황**을 막는다
    - 테스트는 비즈니스 검증이 아니라 **구조 검증 도구**다
    
    ---
    
    ## 7. 마무리
    
    본 Rule은 **영구적인 정답이 아니다.**
    
    프로젝트 구조 변경, 아키텍처 전환 시 **함께 수정·폐기될 수 있다.**
    
    다만,
    
    > “아무것도 없는 상태로 리팩토링하는 것”보다
    > 
    > 
    > “기준이 있는 상태에서 바꾸는 것”이 훨씬 안전하다.
    > 
    
    이 Rule은 그 **기준점 역할**을 한다.
    
    ---
    
    ### 📌 한 줄 요약 (팀 공유용)
    
    > 이 Rule은 개발을 느리게 하기 위한 것이 아니라
    > 
    > 
    > **조용히 망가지는 것을 빨리 발견하기 위한 장치입니다.**
    > 
    
    ---
    
    원하시면 다음 단계로
    
    - 🔧 **RuleTest 코드 skeleton**
    - 📄 **README용 요약 버전**
    - 🚦 **FAIL/WARN 기준 표만 뽑은 1페이지 버전**
    
    중 하나를 바로 만들어드릴게요.
    
- 테스트 코드 작성 가이드
    
    ---
    
    # ✅ 목표 정의
    
    ## 우리가 가진 현실(전제)
    
    - SI 솔루션 구조: **UI 기반**으로 서비스가 호출되고, 비즈니스 로직은 **SQL(Mapper)에 집중**
    - Service 계층은 대부분 **pass-through / routing / parameter mapping 역할**
    - 트랜잭션(@Transactional)은 프로젝트 내에서 **일관되지 않음**
    - 다수 서비스가 `type` 분기 + try/catch로 **Exception을 삼켜 rollback이 보장되지 않는 경우 존재**
    - 테스트 코드가 거의 없어 개발자가 화면에서 수동 단위테스트를 반복
    
    ## 내가 만들고 싶은 상태(목표)
    
    - “당연히 되어야 하는 것”이 운영에서 깨지지 않게 **자동 검열(1차 안전망)** 확보
    - 리팩토링을 해도 “더 이상 망가지지 않는” 프로젝트
    - 여러 개발자가 가이드만 보고 개발해도 시스템이 **자동으로 규칙 위반/위험 신호를 알려주는 구조**
    - **공통 테스트**로 최대 범위를 커버하고, 예외는 명시적으로 처리(@RuleSkip 등)
    
    ---
    
    # ✅ 설계 결론 (아키텍처 관점)
    
    ## 1) Base Service 개념은 “강제”가 아니라 “소유권(Owner)” 선언
    
    - Base Service는 “이 페이지의 유일한 서비스”가 아니라 **책임의 기준점**
    - 1 HTML → N Service 호출은 현실적으로 자연스러움
        
        → 대신 “최소 1개는 Base Service에 속해야 한다”만 강제하는 방향이 적절
        
    - 여러 HTML이 하나의 Base Service를 공유(N:1)하는 건 괜찮음
        
        → 위험은 “공유”가 아니라 “페이지별 분기 로직”이 Service에 들어갈 때 발생
        
    
    ## 2) type 기반 분기 Service는 객체지향적으로는 별로지만, SI 레거시에서는 흔함
    
    - 지금 시스템은 “Facade/Command”로 한 번에 바꾸기 어려움 (대규모 리팩토링)
    - 따라서 테스트는 “강제(Fail)”가 아니라 **Warn으로 방향을 제시**하는 역할이 적합
    - 핵심은 “아키텍처를 교정”이 아니라 “운영 안정성 확보”와 “사이드이펙트 감지”
    
    ## 3) 트랜잭션 불신 환경에서는 테스트가 ‘보증’이 아니라 ‘경고등’이어야 한다
    
    - Exception을 먹는 구조에서는 @Transactional이 무력화될 수 있음
    - “트랜잭션을 강제”하기보다 **트랜잭션이 깨질 가능성이 큰 코드**를 자동으로 드러내는 방향이 현실적
    
    ---
    
    # ✅ 강제할 Rule의 레벨 전략 (FAIL / WARN / GUIDE)
    
    ## FAIL (무조건 잡아야 하는 것 = 운영에서 터지면 바로 사고)
    
    - **SQL 실행 불가**(테이블/컬럼 오타, 문법 오류 등)
    - Controller가 Mapper 직접 호출 (계층 붕괴)
    - CRUD prefix 규칙 위반 (SQL ID에 select/insert/update/delete 누락)
    
    ## WARN (지금 바로 못 고치지만, 위험 신호를 계속 드러내야 하는 것)
    
    - Service 내부에서 `type` 기반 분기 (UI-driven 트랜잭션 스크립트 신호)
    - try/catch로 Exception을 삼키는 패턴(rollback 불가 가능성)
    - 다중 mapper 호출 + Exception 삼킴(부분 커밋/정합성 붕괴 위험)
    - Base Service에 너무 많은 HTML 매핑(비대해지는 책임 신호)
    - 모호한 SQL ID(ex: check…)는 FAIL 대신 경고(팀 반발 방지)
    
    ## GUIDE (문서/리뷰로만 가져가야 하는 것)
    
    - SQL 내부 주석(`/* mapper.xxx */`) 강제는 반발 가능 → 가이드로만
    - indent/컬럼 한 줄 등 포맷 컨벤션은 테스트로 강제하지 않기
    
    ---
    
    # ✅ 내가 “공통 테스트”로 해야 하는 것들 (To-Do 정리)
    
    ## (A) SQL 안전망 테스트 (최우선, ROI 가장 큼)
    
    ### 목표
    
    - “당연히 되어야 하는데 안 되는 것”을 CI에서 먼저 발견
        
        (테이블/컬럼/문법 오류)
        
    
    ### 방법
    
    - Mapper의 select/insert/update/delete를 **실제 DB에서 실행**
    - 결과 값 검증은 최소(예외 발생 여부만)
    - write 테스트는 @Transactional + @Rollback로 DB 영향 없이 수행(가능한 범위에서)
    
    ---
    
    ## (B) Ajax → Controller → Service 호출 연결 검증 (Blackbox)
    
    ### 목표
    
    - 화면에서 수동으로 눌러보던 테스트를 “호출만이라도 자동화”
    - IFID/oper/type 매칭이 깨졌는지 조기 감지
    
    ### 방법
    
    - Controller 엔드포인트(`/api/payment/send`)를 MockMvc로 호출하거나
    - 최소한 Service Bean을 ctx에서 가져와 executeMap 호출해서 “안 죽는지”만 확인
    
    ---
    
    ## (C) 사이드이펙트 감지용 “시나리오 최소 세트”
    
    ### 목표
    
    - 한 기능 수정이 다른 기능을 깨는 걸 조기 감지
    
    ### 방법(가벼운 방식)
    
    - 대표 메뉴/핵심 기능 몇 개만 골라
        - update → read
        - delete → read
        - insert → read
            
            처럼 “연쇄 호출”을 수행하고 예외 발생 여부만 체크
            
    
    ---
    
    ## (D) 트랜잭션 리스크 자동 경고(WARN) 테스트
    
    ### 목표
    
    - rollback이 보장되지 않는 위험한 Service를 자동 식별
    
    ### 탐지 규칙(예시)
    
    - Service에 `catch (Exception` 존재 + returnMap에 실패코드 세팅 + throw 없음 → WARN
    - mapper 호출이 2개 이상인데 위 패턴 존재 → HIGH WARN
    
    ---
    
    ## (E) Base Service 매핑 규칙(가능하면 “느슨한 강제”)
    
    ### 목표
    
    - “페이지 책임의 기준점”을 잃지 않도록 보호
    - 단, 모든 호출 서비스를 제한하지 않고 **Base만 고정**
    
    ### 구현 아이디어(둘 중 택1)
    
    1. 설정 파일 기반 (가장 현실적)
    - `menu-base-service.yml` 형태로 페이지ID → Base IFID 매핑
    - HTML에서 호출한 IFID 중 Base가 포함되는지 검증
    1. 어노테이션 기반(장기적으로 깔끔)
    - `@MenuGroup({"180103","180103_P01"})` 같은 방식
    - 도입 비용이 있으니 초기엔 설정 파일 추천
    
    ---
    
    # ✅ 단계별 작업 로드맵 (실행 순서)
    
    ## Step 0. “룰 테스트 프레임”부터 만든다
    
    - 공통 테스트 모듈(패키지) 생성
    - FAIL/WARN/INFO를 구분할 Reporter 유틸 작성
        - FAIL: assert로 실패
        - WARN: 로그 + 리포트 누적(빌드는 통과)
    
    > 핵심: “테스트가 팀을 괴롭히지 않게” 먼저 설계
    > 
    
    ---
    
    ## Step 1. SQL 실행 가능성 테스트부터 붙인다 (가장 빨리 효과 나옴)
    
    - Mapper XML 스캔 → SQL ID 목록 수집
    - CRUD prefix 규칙 검사(FAIL)
    - 핵심 Mapper부터 실제 호출 테스트(FAIL)
    - 결과 검증은 하지 말고 “예외 없음”만 체크
    
    ---
    
    ## Step 2. 서비스 호출 스모크 테스트(안 죽는지)
    
    - `SVxxxxxx` Bean 목록 수집
    - 각 서비스에 대해 “대표 파라미터(minParam)” 세트로 executeMap 호출
    - 실패 시 어떤 서비스가 깨졌는지 레포트
    
    > 이 단계만으로 “화면 수동 테스트”를 크게 줄일 수 있음
    > 
    
    ---
    
    ## Step 3. 사이드이펙트 감지 시나리오를 얹는다 (선택 기능부터)
    
    - 중요 메뉴 10개만 뽑아도 충분
    - update→read / delete→read 같은 최소 체인
    - @Rollback으로 안전하게 수행
    
    ---
    
    ## Step 4. TX 위험 감지(WARN) 추가
    
    - try/catch로 Exception 삼키는 서비스 자동 경고
    - multi-mapper + swallow 패턴은 High 위험 경고
    - 리팩토링 “우선순위 리스트”가 자동으로 생성되게 만들기
    
    ---
    
    ## Step 5. Base Service 매핑(느슨한 강제) 도입
    
    - 초기: yml 매핑 방식 추천
    - 목표: 페이지가 “어디에도 속하지 않는 상태”를 방지
    - 예외는 `@RuleSkip(reason=...)`로 명시
    
    ---
    
    ## Step 6. 리포트화 (팀 설득/지속성 확보)
    
    - CI 로그에 WARN 요약 출력
    - “위험 서비스 Top N”, “SQL 실패 목록”을 매번 보여주기
    - 테스트가 단순 실패가 아니라 **품질 대시보드 역할**을 하게 만들기
    
    ---
    
    # ✅ 운영 원칙 (팀 반발 방지용)
    
    - 기존 레거시 패턴은 당장 FAIL로 몰지 않는다 → **WARN으로 시작**
    - 신규 개발부터는 “WARN을 줄이는 방향”으로 유도
    - 강제는 “운영에서 바로 사고나는 것(쿼리 오류)”부터
    - 스타일 강제(주석/indent)는 하지 않는다(팀 갈등 비용이 큼)
    
    ---
    
    # ✅ 최종 한 줄 결론
    
    > 이 프로젝트에서 테스트는 “객체지향을 강제”하는 도구가 아니라“운영 안정성과 리팩토링 안전망”을 만드는 도구다.그래서 FAIL은 최소(치명), WARN은 넓게(방향성) 간다.
    > 
    
    ---
    
    원하면, 다음 단계로 **“공통 테스트 프레임”의 구체 설계**를 바로 잡아드릴 수 있습니다.
    
    - ✅ `RuleReporter`(WARN/FAIL 수집기) 설계
    - ✅ Mapper XML 스캔 방식(리플렉션/리소스 스캔)
    - ✅ “minParam” 생성 전략(서비스별 기본 파라미터 템플릿)
    - ✅ MockMvc 기반 `/api/payment/send` 스모크 테스트 템플릿
    
    원하시는 방식(1) DB 중심 Mapper 테스트부터 / (2) Service 호출 스모크부터 중 어떤 걸 먼저 붙일지 기준만 잡아드릴까요?
    
- 규칙기반테스트 이후 작업
    
    
    **SI·레거시·UI 중심 구조**를 전제로 한 **현실적인 다음 단계 로드맵**
    
    ---
    
    # 0. 지금까지 한 단계의 정체성부터 정리
    
    ### 지금까지 만든 것 = ❌ TDD ❌ 단위테스트
    
    ### 지금까지 만든 것 = ⭕ **Architecture Safety Net**
    
    - 규칙 위반 조기 발견
    - SQL / Service / 매핑 깨짐 방지
    - “당연히 될 줄 알았던 것” 감시
    
    👉 이걸 **1단계(Structural Guard)** 라고 부르자
    
    ---
    
    # 1. 규칙기반 테스트 이후의 큰 그림 (3단계)
    
    ```
    [1] 구조 규칙 테스트 (지금)
            ↓
    [2] 영향 범위 감지 테스트 (Side-effect Detector)
            ↓
    [3] 위험도 기반 테스트 (Risk-based Guard)
    
    ```
    
    이 순서가 **유일하게 지속 가능한 경로**입니다.
    
    ---
    
    # 2. 2단계 — 영향 범위 감지 테스트 (가장 중요한 다음 단계)
    
    ## 🎯 목적
    
    > “이 서비스/SQL을 건드리면
    > 
    > 
    > **어디가 같이 영향을 받는지** 개발자가 바로 알게 한다”
    > 
    
    ### 이 단계에서 절대 하지 말 것
    
    - 결과값 비교 ❌
    - 비즈니스 정합성 검증 ❌
    
    ### 이 단계에서 해야 할 것
    
    - **의존 관계 가시화**
    - **변경 영향 경고**
    
    ---
    
    ## 2-1. 무엇을 수집할까? (자동 가능)
    
    ### ① Service → Mapper
    
    ```
    I_sv180103
     ├─ I_mp180000.updateMenuDesc
     ├─ I_mp180000.getRuleMenuList
     └─ I_mp180000.insertLevelMenu
    
    ```
    
    ### ② Service → SQL ID 목록
    
    - 리플렉션 + Mapper 인터페이스 분석
    - 또는 MyBatis Configuration 기반
    
    ### ③ Page → Service (선택)
    
    - IFID 기반
    - HTML/JS 파싱은 ❌ (너무 무거움)
    - **메뉴 ID 기준만 사용**
    
    ---
    
    ## 2-2. 테스트 결과 예시 (이게 핵심 UX)
    
    ```
    [IMPACT WARNING]
    Service: I_sv180103
    
    This service uses:
     - UI_180000.I_mp180000.updateMenuDesc
     - UI_180000.I_mp180000.getRuleMenuList
     - UI_180000.I_mp180000.insertLevelMenu
    
    ⚠ If modified, review related pages:
     - I_UI_180103.html
     - I_UI_180401.html
    
    ```
    
    👉 **이 한 줄 경고만으로도 사고율 급감**
    
    ---
    
    ## 2-3. 이건 테스트 실패일까?
    
    ❌ FAIL
    
    ⭕ WARN
    
    > “망가졌다는 말”이 아니라
    > 
    > 
    > “조심하라는 신호”여야 함
    > 
    
    ---
    
    # 3. 3단계 — 위험도 기반 테스트 (선택적, 나중에)
    
    이건 **지금 당장 안 해도 됩니다.**
    
    하지만 구조는 미리 열어두는 게 좋아요.
    
    ---
    
    ## 3-1. 위험도란 무엇인가?
    
    | 기준 | 이유 |
    | --- | --- |
    | SQL이 많은 서비스 | 사이드이펙트 큼 |
    | UPDATE / DELETE 비중 | 장애 위험 |
    | 트랜잭션 있음 | 롤백 이슈 |
    | `${}` 사용 | SQL Injection / 파싱 위험 |
    | try-catch swallow | 트랜잭션 무력화 |
    
    ---
    
    ## 3-2. 테스트 표현 방식
    
    ```
    [RISK SCORE] I_sv180103 = HIGH
     - UPDATE/DELETE: 6
     - ${} usage: 1
     - try-catch swallow: YES
    
    ```
    
    ❌ 테스트 실패 아님
    
    ⭕ **기술 부채 가시화**
    
    ---
    
    # 4. 그럼 “진짜 테스트(비즈니스)”는 언제?
    
    ### 정답: **리팩토링을 결정했을 때**
    
    - 지금: 구조 보호
    - 나중: 리팩토링 대상 선정 → 그때 단위테스트
    
    > 지금 TDD 하려고 하면
    > 
    > 
    > **100% 실패하거나 아무도 안 씀**
    > 
    
    ---
    
    # 5. 전체 흐름을 한 장으로 정리
    
    ```
    1. 규칙기반 테스트
       - SQL 실행 가능
       - 명명 규칙
       - 매핑 존재 여부
       - foreach / choose 안전성
    
    2. 영향 범위 감지
       - Service → SQL
       - Service → Page
       - 변경 시 경고
    
    3. 위험도 표시
       - FAIL ❌
       - WARN ⭕
       - SCORE 표시
    
    4. (선택) 리팩토링 시 단위 테스트
    
    ```
    
    ---
    
    # 6. 지금 단계에서 “절대 넘지 말아야 할 선”
    
    ❌ HTML 파싱
    
    ❌ 실제 데이터 검증
    
    ❌ 모든 분기 커버
    
    ❌ 100% 성공률 강요
    
    이 선 넘으면 **오버엔지니어링**입니다.
    
    ---
    
    # 7. 한 문장 결론 (노션에 그대로 써도 됨)
    
    > 규칙기반 테스트 이후에는
    > 
    > 
    > **“정답을 맞추는 테스트”가 아니라“변경 시 위험을 알려주는 테스트”로 확장한다.이 테스트는 실패를 막기 위한 것이 아니라사고를 예방하기 위한 안전벨트다.**
    > 
    
    ---
    
    다음에 이어가기 좋은 주제:
    
    - 영향 범위 그래프를 **어디에 저장할지**
    - WARN → FAIL 승격 조건
    - 이 테스트를 **CI에서 언제 돌릴지**
    
    원하면 다음 단계 바로 설계해줄게요.
    
- 결과물 (가이드라인)
    
    # 🛡 MyBatis Quality Gate 사용자 가이드 & 구축 보고서
    
    ---
    
    ## [1부] MyBatis Quality Gate 사용자 가이드
    
    ---
    
    ## 1. 개요 (Overview)
    
    **MyBatis Quality Gate**는 개발자가 작성한 **MyBatis Mapper XML**의
    
    잠재적인 오류, SQL Injection 취약점, 그리고 실행 불가능한 쿼리를
    
    👉 **빌드 시점(Build Time)** 에 자동으로 탐지하는 **Gradle Plugin 기반 테스트 도구**입니다.
    
    기존에는 런타임에서야 발견되던 SQL 오류를
    
    **Shift-Left Testing** 관점에서 사전에 차단하는 것을 목표로 합니다.
    
    ---
    
    ## 2. 아키텍처 및 동작 원리
    
    본 솔루션은 다음 두 가지 핵심 모듈로 구성됩니다.
    
    ### 2.1 Rule Core (`rule-core`)
    
    - 검증 로직의 **핵심 엔진**
    - 실제 DB 연결(`DataSource`)과
        
        MyBatis 설정(`SqlSessionFactory`)을 주입받아 규칙 수행
        
    - MyBatis 내부 객체(`MappedStatement`, `BoundSql`)를 직접 분석
    
    ### 2.2 Rule Plugin (`rule-plugin`)
    
    - Gradle **빌드 수명주기**에 개입
    - 프로젝트의 **test SourceSet**에
        
        `RuleGateTest.java`를 **자동 생성**
        
    - 사용자는 별도의 테스트 코드 작성 없이
        
        `./gradlew test` 실행만으로 검증 가능
        
    
    ---
    
    ## 3. 설치 및 설정 (Getting Started)
    
    ---
    
    ### 3.1 `settings.gradle` 설정
    
    플러그인 및 라이브러리를 로드하기 위한 저장소 설정입니다.
    
    ```groovy
    pluginManagement {
        repositories {
            mavenCentral()
            gradlePluginPortal()
            maven { url 'https://jitpack.io' } // rule-core 로딩용
        }
    }
    
    ```
    
    ---
    
    ### 3.2 `build.gradle` 설정
    
    프로젝트에 플러그인을 적용합니다.
    
    ```groovy
    plugins {
        id 'com.example.simple-rule' version '0.1.0'
    }
    
    ```
    
    ### (선택 사항) 기본값을 덮어써야 하는 경우
    
    ```groovy
    ruleGate {
        basePackage = "com.mycompany.app"   // 메인 애플리케이션 패키지 (자동 감지 실패 시)
        mapperDirs  = [
            "src/main/resources/mapper",
            "src/main/resources/sql"
        ] // Mapper XML 경로
    }
    
    ```
    
    ---
    
    ## 4. 실행 및 결과 확인
    
    ---
    
    ### 4.1 실행 명령어
    
    표준 Gradle 테스트 명령어를 실행하면 자동으로 Quality Gate가 동작합니다.
    
    ```bash
    ./gradlew cleantest
    
    ```
    
    > ❗ test 단계에서 RuleGateTest가 실행되며
    > 
    > 
    > 규칙 위반 시 **빌드가 실패**합니다.
    > 
    
    ---
    
    ### 4.2 검증 항목 (Rules)
    
    | 규칙 (Rule) | 설명 | 위험도 |
    | --- | --- | --- |
    | **BoundSqlGeneration** | XML 문법 오류, OGNL 표현식 오류, 파라미터 바인딩 실패 검증 | Critical |
    | **NoDollarExpression** | SQL Injection을 유발하는 `${}` 사용 여부 탐지 (주석 포함) | Critical |
    | **WriteSqlStaticRule** | WHERE 절 없는 UPDATE/DELETE 차단, INSERT 컬럼 불일치 검증 | Critical |
    | **SelectExplainRule** | SELECT 쿼리에 대해 EXPLAIN 수행, 문법 및 실행 가능 여부 검증 | Major |
- 결과물 (보고서)
    
    ---
    
    # [2부] MyBatis SQL 품질 검증 자동화 시스템 구축 보고서
    
    ---
    
    ## 1. 프로젝트 개요
    
    ### 1.1 배경 및 목적
    
    SI 및 엔터프라이즈 환경에서 **MyBatis**는 가장 널리 사용되는 SQL 매퍼 프레임워크이다.
    
    그러나 XML 기반 SQL 작성 방식은 다음과 같은 구조적 한계를 가진다.
    
    - **컴파일 타임 검증 불가**
        - SQL 오타, 문법 오류가 런타임(실제 실행 시점)에야 발견됨
    - **SQL Injection 위험**
        - `${param}` 사용 여부가 전적으로 개발자의 주의에 의존
    - **파괴적 쿼리 위험**
        - WHERE 절이 누락된 UPDATE / DELETE로 인한 대량 데이터 손실 가능성
    - **트랜잭션 무효화 패턴**
        - `@Transactional` 메서드 내부에서 예외를 삼켜 rollback이 발생하지 않는 문제
    
    이러한 문제는 대부분 **코드 리뷰나 통합 테스트 단계에서 놓치기 쉬우며**,
    
    운영 장애로 직결되는 경우가 많다.
    
    본 프로젝트의 목적은 이러한 SQL 품질 문제를
    
    **Shift-Left Testing 관점**에서 해결하는 것이다.
    
    > 즉, 개발자가 코드를 커밋하고 빌드하는 시점에
    > 
    > 
    > SQL의 결함을 자동으로 탐지하여
    > 
    > 운영 환경 유입을 사전에 차단하는 것을 목표로 한다.
    > 
    
    ---
    
    ## 2. 시스템 설계 및 구현
    
    ### 2.1 전체 아키텍처 개요
    
    본 시스템은 **확장성과 유지보수성**을 고려하여
    
    Core와 Plugin으로 분리된 구조를 채택하였다.
    
    ### 2.1.1 Rule Core (rule-core)
    
    - **순수 Java 라이브러리**
        - 프레임워크 의존성을 최소화
    - Rule 인터페이스 기반 구조
        - 신규 검증 규칙을 손쉽게 추가 가능
    - MyBatis 내부 메타데이터 직접 분석
        - `MappedStatement`
        - `BoundSql`
        - `Configuration`
    
    ### 주요 역할
    
    - SQL 생성 안정성 검증
    - SQL Injection 위험 탐지
    - 실행 계획(EXPLAIN) 가능 여부 확인
    - 트랜잭션 무효화 코드 패턴 탐지
    
    ---
    
    ### 2.1.2 Rule Plugin (rule-plugin)
    
    - **Gradle Plugin 형태**
    - 빌드 수명주기에 자동 개입
    - 테스트 코드 자동 생성 방식(Code Generation) 채택
    
    ### 동작 방식
    
    1. 프로젝트 빌드 시점에:
        - `RuleGateTest.java` 자동 생성
    2. 해당 테스트를:
        - `test` 소스셋에 동적으로 등록
    3. `./gradlew test` 실행 시:
        - 사용자의 Spring Context를 그대로 사용하여 검증 수행
    
    > 개발자는 별도의 테스트 코드를 작성할 필요 없이
    > 
    > 
    > 플러그인 적용만으로 SQL 품질 검증을 수행할 수 있다.
    > 
    
    ---
    
    ## 2.2 핵심 검증 기술
    
    ### A. 정적 분석 (Static Analysis)
    
    - **파일 시스템 스캔**
        - `Files.walk` 기반 Mapper XML 직접 탐색
    - **패턴 분석**
        - `${}` 사용 여부 탐지
        - 주석 포함 위험 패턴 차단
    - **구조 검증**
        - WHERE 절 없는 UPDATE / DELETE 탐지
        - 컬럼-값 불일치 패턴 탐지
    
    ➡️ DB 연결 없이도 빠른 사전 검증 가능
    
    ---
    
    ### B. 동적 분석 (Dynamic Analysis)
    
    - **MyBatis 메타데이터 활용**
        - `Configuration.getMappedStatements()` 순회
    - **가상 파라미터 바인딩**
        - Dummy 파라미터를 사용해 실제 SQL 생성 시뮬레이션
    - **실행 계획 검증**
        - 완성된 SQL에 `EXPLAIN`을 붙여 실제 DB에 질의
    
    ➡️ “실제로 실행 가능한 SQL인가?”를 빌드 시점에 검증
    
    ---
    
    ## 3. 실제 실패 사례 (Quality Gate 차단 예시)
    
    다음은 **MyBatis Quality Gate가 실제로 빌드를 차단한 사례**이다.
    
    ### 3.1 실행 환경
    
    ```bash
    ./gradlew clean test
    
    ```
    
    - RuleGateTest 자동 생성
    - Spring Boot Context 기동
    - DataSource / SqlSessionFactory 정상 주입
    - 실제 MariaDB 연결
    
    ---
    
    ### 3.2 탐지된 Rule 위반 내역
    
    ### ❌ 1) SQL Injection 위험 탐지
    
    ```
    [RULE] NoDollarExpressionRule
    Found ${} usage in mapper XML (SQL Injection risk)
    
    [FILE] TestMapper.xml : LINE [12]
    >> AND NAME = ${NAME}
    
    ```
    
    - `${}` 사용으로 SQL Injection 가능성 존재
    - 주석 여부와 관계없이 시스템적으로 차단
    
    ---
    
    ### ❌ 2) 트랜잭션 무효화 패턴 탐지
    
    ```
    [RULE] TransactionalSwallowExceptionRule
    @Transactional method swallows exception with catch + return
    
    com.rule.commontest.sample.TransactionTestService.run
    
    ```
    
    - `@Transactional` 메서드 내부에서 예외를 삼켜 rollback이 발생하지 않는 구조
    - 운영 장애로 직결될 수 있는 패턴을 빌드 단계에서 차단
    
    ---
    
    ### ❌ 3) 실행 불가 SQL 탐지 (EXPLAIN 실패)
    
    ```
    [RULE] SelectExplainRule
    EXPLAIN failed: You have an error in your SQL syntax
    
    TestMapper.selectTest
    
    ```
    
    - MyBatis는 SQL을 생성했으나
    - 실제 DB 기준 문법 오류로 실행 불가
    - 단순 XML 파싱이나 BoundSql 검증만으로는 잡을 수 없는 문제
    
    ---
    
    ### 3.3 최종 결과
    
    ```
    === RULE CHECK FAILED ===
    Build failed due to SQL quality violations
    
    ```
    
    ➡️ **배포 차단 (Fail Fast)**
    
    ➡️ 운영 환경 유입 이전에 문제 제거
    
    ---
    
    ## 4. 주요 성과 및 기대 효과
    
    ### 4.1 기술적 성과
    
    - **자동화된 SQL 품질 통제**
        - 수백 개의 Mapper SQL을 일괄 검증
    - **Zero Configuration**
        - 테스트 코드 작성 불필요
    - **실환경 기반 검증**
        - 실제 DB, 실제 MyBatis 설정 사용
    - **확장 가능한 Rule 구조**
        - 신규 규칙 추가 용이
    
    ---
    
    ### 4.2 도입 효과
    
    - 🚫 **운영 장애 사전 차단**
    - 🔐 **SQL Injection 리스크 제거**
    - 🧨 **대량 데이터 손실 방지**
    - 🔁 **CI/CD 파이프라인 안정성 강화**
    
    ---
    
    ## 5. 결론
    
    MyBatis Quality Gate는 단순한 유틸리티가 아니라,
    
    - *데이터 중심 애플리케이션 개발 환경에서 필수적인 안전장치(Safety Net)**이다.
    - Core / Plugin 분리 구조로 확장성 확보
    - 빌드 시점 SQL 품질 검증으로 Shift-Left Testing 실현
    - CI/CD 파이프라인과 자연스럽게 결합 가능
    
    향후 Rule 확장을 통해
    
    **SQL 품질 관리의 표준 도구**로 발전할 수 있는 기반을 마련하였다
    
    ---

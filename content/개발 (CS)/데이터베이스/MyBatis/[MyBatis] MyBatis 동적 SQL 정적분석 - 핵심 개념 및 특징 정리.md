---
title: "MyBatis 동적 SQL 정적분석 - Include 캐싱과 choose 분기 처리"
tags: [학습, 개발-CS, 데이터베이스, MyBatis, 정적분석]
modified: 2026-09-05
---

# MyBatis 동적 SQL 정적분석 - Include 캐싱과 choose 분기 처리

> [!NOTE]
> MyBatis SQL 정적 분석 툴("Mybatis + AI (쿼리 분석 Tool)" 미니프로젝트)에서 내린 두 가지 기술 결정: `<include refid>` 태그를 OOM 없이 빠르게 해석하는 2-Phase 파싱 전략과, `<choose>` 분기를 합쳤을 때 EXPLAIN 실행계획이 왜곡되는 문제의 해법.
> 관련 노트: [(MyBatis) SAX vs DOM Parser - 핵심 개념 및 특징 정리]([MyBatis]%20SAX%20vs%20DOM%20Parser%20-%20핵심%20개념%20및%20특징%20정리.md) — 같은 툴의 파서 선택 배경

## ⚙️ 1. `<include>` 태그 파싱 최적화 — `<sql>` 조각 캐싱 2-Phase 전략

### 배경
MyBatis XML 기반 SQL을 파싱해 정적 분석(테이블 추출, 인덱스 검증 등)을 수행하는 툴에서, 쿼리 재사용을 위한 `<include refid="...">` 태그는 동일 파일 내부 참조뿐 아니라 다른 파일(외부 네임스페이스) 참조도 완벽히 해석해야 한다. 수백~수천 개의 매퍼 파일이 얽혀있는 환경에서, 파싱 시점마다 외부 파일을 동적으로 찾아 여는 방식은 한계가 명확하다.

### 문제 상황
- **File I/O 병목**: 외부 `<include>`를 만날 때마다 파일 시스템을 탐색하고 다시 DOM으로 여는 과정은 막대한 성능 저하를 유발
- **네임스페이스와 경로 불일치**: `namespace` 속성값(예: `com.pay.common.Base`)이 실제 파일의 디렉토리 구조와 100% 일치한다는 보장이 없어 동적 추적이 어려움
- **OOM 리스크**: 파일 탐색을 줄이려고 모든 XML 파일을 DOM(`Document`) 객체로 변환해 통째로 캐싱하면, DOM 객체의 무거운 특성상 대규모 매퍼 환경에서 OOM이 발생할 위험이 매우 높음

### 의사결정 — "DOM 전체 캐싱" 포기, `<sql>` 조각만 String으로 캐싱

MyBatis DTD 스펙상 `<include>`의 `refid`가 가리킬 수 있는 대상은 오직 `<sql>` 태그뿐이다(`<select>`, `<update>` 등은 참조 불가). 따라서 전체 XML 구조를 메모리에 들고 있을 필요 없이, `<sql>` 태그의 내용물만 텍스트로 뽑아내면 목적을 달성할 수 있다 → `SqlSnippetRegistry`(메모리 세이프 캐시) 도입.

### 구현 아키텍처 — 2-Phase(사전 스캔 → 본 파싱)

**Phase 1: Registry 초기화 (Pre-load & Fast Scan)**
1. 툴 구동 시 `Files.walk`로 모든 `.xml` 파일을 한 번씩만 스캔
2. DOM 파서로 XML을 열어 `<sql id="...">` 태그만 색인
3. `Map<String, String> sqlSnippetRegistry`에 저장
    - Key: `namespace` + `.` + `id` (예: `com.pay.common.Base.baseColumnList`)
    - Value: `<sql>` 내부의 순수 쿼리 텍스트 조각
4. 메모리 해제: 추출이 끝난 `Document`(DOM) 객체는 즉시 참조를 끊어 GC가 수거하도록 처리

**Phase 2: 가짜 SQL 조립 (Parsing & Assembler)**
1. 사용자가 선택한 특정 쿼리의 DOM을 순회하며 JSqlParser 통과용 가짜 SQL(Dummy SQL)을 조립
2. `<include>` 태그를 만나면, 파일 시스템 접근 없이 `sqlSnippetRegistry.get(refid)` 호출
3. O(1) 시간 복잡도로 즉시 SQL 텍스트 조각을 반환받아 쿼리 스트링에 병합

### 기대 효과
- **메모리 혁신**: 무거운 객체 트리(DOM) 대신 순수 문자열(String)만 메모리에 적재하므로, 매퍼 파일이 수천 개라도 메모리 점유율이 극히 낮아 OOM을 완벽히 방지
- **초고속 파싱**: 본 파싱 중에는 파일 I/O가 단 한 번도 발생하지 않으며, 캐시 맵에서 값을 꺼내오기만 하므로 분석 속도가 극대화됨
- **유연성과 안정성**: 네임스페이스와 물리적 폴더 경로가 달라도 문제없이 동작하며, 복잡한 외부 참조(Cross-reference)를 깔끔하게 해결

## ⚙️ 2. `<choose>` 분기를 합치면 EXPLAIN이 왜곡되는 문제

### 왜 왜곡되는가

`<choose>` 태그는 Java의 `switch-case`문과 같다. 즉, 상호 배타적인 조건이다.

`DummySqlAssembler`가 모든 분기를 합쳐서 `WHERE 1=1 AND user_name = ? AND email = ? AND status = 'ACTIVE'` 같은 가짜 SQL을 만들면, `EXPLAIN`에 돌렸을 때:
1. "조건이 3개나 동시에 걸려있으니 인덱스 3개를 다 타거나 복합 인덱스를 잘 타겠다" → 원래는 풀 스캔이 날 수도 있는 악성 쿼리인데, 가짜 SQL에서는 인덱스를 아주 잘 타는 착한 쿼리로 둔갑
2. "이 조건 2개는 논리적으로 동시에 성립할 수 없다" → MySQL 등에서 실행 계획이 `Impossible WHERE`를 띄우고 분석 자체를 포기

결국 테이블명 추출용(JSqlParser용)으로는 합치는 게 맞지만, 성능 분석용(`EXPLAIN`용)으로는 합치면 절대 안 된다.

> (참고로 `<trim>`은 여러 개 중 하나를 고르는 분기문이 아니라 prefix/suffix 문자를 다듬어주는 포맷팅 태그라 성격이 다르다. 핵심 문제는 `<choose>-<when>-<otherwise>` 분기문이다.)

### 해결 전략 — 툴의 목적에 따른 선택

**전략 1. 쿼리 파편화(Query Permutation) — 완벽주의**
조건문에 따라 발생할 수 있는 모든 경우의 수의 쿼리를 각각 생성해서 모두 `EXPLAIN`을 돌려보는 방식.
- 방식: `<choose>`를 만나면 쿼리를 여러 갈래로 복제. `<when>` 1번용, `<when>` 2번용, `<otherwise>`용 쿼리...
- 장점: 백오피스 검색 조건에 따라 인덱스를 타는지 못 타는지 100% 완벽하게 검증
- 단점: `<if>`나 `<choose>`가 10개만 있어도 경우의 수가 2^10 = 1024개. 파서 로직이 극도로 복잡해지고 DB에 날려야 할 EXPLAIN 쿼리가 기하급수적으로 늘어남

**전략 2. 대표 쿼리 추출(Representative Path) — 실용주의**
"가장 위험한(인덱스를 안 탈 것 같은) 최악의 경로" 하나만 남기거나, "조건이 아예 없을 때의 기본 경로"만 남기는 방식.
- 방식: `<choose>`를 만나면 첫 번째 `<when>`의 조건만 취하거나, 아예 `<otherwise>`(보통 전체 조회나 기본 조건)만 남기고 나머지는 파싱 과정에서 과감히 버림
- 장점: 구현이 훨씬 단순하고, 분석해야 할 쿼리가 1개로 유지됨
- 단점: 버려진 경로(다른 `<when>` 조건)에 숨어있는 풀 스캔 위험은 잡아내지 못함

### 채택한 타협점 — Two-Track Approach

"개발자가 작성한 쿼리가 최적화되어 있는지 대략적인 가이드를 주는 목적"이라면 완벽한 경우의 수를 다 짤 필요는 없다. "테이블 파싱용 가짜 쿼리"와 "EXPLAIN용 대표 쿼리"를 분리해서 생성하는 구조를 추천한다.
1. **테이블 추출용**: 다 때려 박아서 JSqlParser가 테이블을 전부 찾게 둠
2. **EXPLAIN 검증용**: `<choose>`를 만나면 `<otherwise>` 블록 하나만 살리거나(보통 검색 조건이 없을 때 가장 성능이 떨어지므로), 첫 번째 `<when>`만 살려서 단일 SQL로 만들어 DB에 던짐

> [!NOTE]
> 최종 결정: `<otherwise>`만 살리기.

## 관련 문서

- [(오픈소스) mybatis-sql-tuner-ai - 상세 분석 및 기술 가이드](../../../프로젝트/오픈소스/[오픈소스]%20mybatis-sql-tuner-ai%20-%20상세%20분석%20및%20기술%20가이드.md) — 이 정적분석 기법을 실제로 구현한 "Mybatis + AI (쿼리 분석 Tool)" 오픈소스 프로젝트의 상세 분석
- [[MyBatis] W3C DOM 기반 MyBatis 동적 쿼리 정적 분석과 AST 가짜 SQL 생성기 설계]([MyBatis]%20W3C%20DOM%20기반%20MyBatis%20동적%20쿼리%20정적%20분석과%20AST%20가짜%20SQL%20생성기%20설계.md) — 같은 프로젝트의 `SqlExtractor` 구현 알고리즘을 W3C DOM 순회 관점에서 상세히 다루는 자매 노트

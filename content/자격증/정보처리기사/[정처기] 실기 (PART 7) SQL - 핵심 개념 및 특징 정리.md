---
title: "[실기] (PART 7) SQL"
tags: [학습, 자격증, 정보처리기사]
modified: 2026-09-05
---

# [실기] (PART 7) SQL

> [!NOTE]
> 정보처리기사 실기 PART 7 — 트랜잭션 특성과 SQL(DDL/DML/DCL) 등 데이터베이스·SQL 핵심 정리.

## 📌 개념

- 트랜잭션 (데이터를 보장하기 위해 DBMS가 가져야하는 특성)
- 트랜잭션의 특성
    - 원자성 : 연산 자체가 모두 실행 또는 모두 취소
    - 일관성 : 완료 전과 완료 후가 같아야함
    - 격리성 : 트랜잭션들이 서로 영향을 끼치면 안됨
    - 영속성 : 영속적으로 데이터베이스에 저장
- 트랜잭션 상태 설명
    - 활동 상태 : 트랜잭션 실행중
    - 부분완료상태 : 마지막 명령문 실행후
    - 완료상태 : 트랜잭션 성공적으로 완료
    - 실패 상태 : 정상적 실행 불가
    - 철회 상태 : 트랜잭션 취소되고 트랜잭션 시작 전으로 환원
- 트랜잭션 제어(TCL)
    - 커밋 : 영구적 저장
    - 롤백 : 저장 무효화
    - 체크포인트 : 롤백을 위한 지점
    - 갱신 손실 : 트랜잭션의 결과를 이후에 실행된 트랜잭션이 덮어쓸 때 문제점
- 병행제어 미보장시 문제점
    - 현황 파악오류 : 트랜잭션 수행결과를 다른 트랜잭션이 참조
    - 모순성 : 일관성 결여
    - 연쇄 복귀 : 데이터 공유시 다른 트랜잭션이 처리한 곳의 부분처리 취소 불가
- 병행제어 기법 종류
    - 로킹 : 하나의 트랜잭션이 이용시 다른 트랜잭션 동시 접근 불가
    - 낙관적 검증 : 트랜잭션이 어떠한 검증도 수행 안함
    - 타임 스탬프 순서 : 부여된 시간에 따라 트랜잭션 작업 수행
    - 다중버전 동시성 제어 : 타임스탬프를 비교하여 직렬가능성이 보장되는 것을 선택하여 접근
- 회복 기법 종류
    - REDO : 시작과 완료에 대한 기록들이 있는 트랜잭션들의 작업을 재작업하는 기법
    - UNDO : 시작은 있지만 완료는 되지않는 트랜잭션을 모두 취소하는 기법
    - 로그기반 회복 기법
        - 지연 갱신 회복 기법 : 트랜잭션이 완료되기 전까지 데이터베이스에 기록 x
        - 즉각 갱신 회복 기법 : 트랜잭션 수행중 갱신결과를 데이터베이스에 즉각 기록
    - 체크 포인트 회복 기법 : 장애 발생 이전으로 복원
    - 그림자 페이징 회복 기법 : 복제본을 생성하여 장애 발생시 복제본을 이용하여 회복
- DDL의 대상
    - 도메인 : 원자 값들의 집합 (속성값)
    - 스키마 (데이터베이스 구조, 제약조건 등을 가지고있음)
        - 외부스키마 : 서브 스키마로 불림
        - 개념스키마 : 전체적인 논리적 구조
        - 내부스키마 : 물리적 저장장치 관점
    - 테이블관련용어
        - 카디널리티 : 튜플 (행)
        - 차수 : 속성 (열)
- 인덱스 종류
    - 순서인덱스 : B-Tree 알고리즘 사용
    - 해시인덱스 : 데이터 접근 비용 균일
    - 비트맵 인덱스 : 수정 변경이 적을경우 유용 (컬럼에 적은 개수가 있을 때 사용)
    - 함수기반 인덱스 : 수식이나 함수를 적용하여 만듬
    - 단일 인덱스 : 하나의 컬럼으로만 구성
    - 결합 인덱스 : 두개 이상의 컬럼으로 구성
    - 클러스터드 인덱스 : 기본키 기준으로 레코드를 묶어서 저장
- DDL 문법
    - Create table 테이블명
    - Alter Table 테이블명 add 컬럼명 데이터타입 [제약조건]
    - Alter Table 테이블명 modify  컬럼명 데이터타입
    - Alter Table 테이블명 Drop Column 컬럼명
    - Drop Table 테이블명 [CasCade | Restrict]
    - Truncate Table 테이블명
- View관련 DDL
    - Create View 뷰이름
    - Drop View 뷰이름
- INDEX관련 DDL
    - Create Index 인덱스명 on 테이블명
    - Alter Index 인덱스명 on 테이블명
    - Drop Index 인덱스명
- DML
    - Select
        - Select [ALL | Distinct] 속성명 from 테이블명 [Where 조건][Group By 속성명][Having 그룹조건][Order By 속성 [ASC|DESC]
        - ALL : 전부
        - DISTINCT : 중복 제거
        - ASC : 오름차순
        - DESC : 내림차순
        - Where 절 문법
            - IN() : 포함된 경우 데이터 조회
            - LIKE 패턴
                - % : 0개이상
                - [ ] : 1개 문자와 일치
                - [^] : 1개 문자와 불일치
                - _ : 특정위치 1개와 일치
                
                > [!NOTE]
> ex) where 속성명 LIKE ‘[ABCD]%’; // 첫번째 문자가 A또는 B또는 C또는 D인 문자열과 일치
                
        - Join
            - 내부조인 : 공통 존재 컬럼의 값이 같은 경우 추출
                - Select  From 테이블1 [별칭] (Inner) join 테이블2 B On 조인조건
            - 외부조인
                - 왼쪽 외부 조인 : 왼쪽 테이블의 모든 데이터와 오른쪽 테이블의 동일 데이터 추출
                    - from 테이블1 [별칭] Left (outer) Join 테이블2 B On 조인조건
                - 오른쪽 외부조인
                    - from 테이블1 [별칭] Right (outer) Join 테이블2 B On 조인조건
                - 완전 외부 조인 : 양쪽 모두 추출
                    - from 테이블1 [별칭] Full (outer) Join 테이블2 B On 조인조건
            - 교차 조인 : 조인 조건이 없는 모든 데이터 조합 추출
            - 셀프 조인 : 자기자신 조인
            
            > [!NOTE]
> NULL 값도 조회 되는 것은 외부조인
            
    - 집합연산자
        - UNION : 중복 제거 합집합
        - UNION ALL : 중복 허용 합집합
        - INTERSECT : 교집합
        - MINUS : 차집합
    - INSERT
        - INSERT INTO 테이블명(속성명) VALUES (값)
        - insert into 테이블명 (속성1, 속성2…) values ('값1', '값2', '값3'....)
    - UPDATE
        - UPDATE 테이블명 SET (속성명 = 데이터) WHERE 조건
    - DELETE
        - DELETE FROM 테이블명 WHERE 조건
- DCL
    - 권한부여
        - Grant 권한 ON 테이블 TO 사용자
        - ex) Grant Update ON 학생 TO 정갈산;
    - 권한회수
        - REVOKE 권한 ON 테이블 FROM 사용자
        - ex) REVOKE UPDATE ON 학생 FROM 정갈산;

---

- 다중 행 연산자
    - IN : 리턴되는 값 중에서 해당하는 값
        - select from where 속성 in (서브쿼리)
    - ANY : 서브쿼리에 의해 리턴되는 값과 조건을 비교하여 하나 이상 만족
        - select from where 속성 > any (서브쿼리) // 만족하는 것 중 하나 (1,2,3,4 라면 / 1 or 2 or 3 or 4 )
    - ALL : 서브쿼리에 의해 리턴되는 모든 값과 조건 값을 비교하여 모든 값 만족
        - select from where 속성 > ALL (서브쿼리) // 모든 내용 포함 (1,2,3,4,라면 / 1 and 2 and 3 and 4)
    - EXISTS : 메인 쿼리의 비교 조건이 서브쿼리의 결과 중에서 만족하는 값 하나라도 존재
        - select from where EXISTS (서브쿼리)
- 집계함수
    - Count
    - SUM
    - AVG
    - MAX
    - MIN
    - STDDEV : 표준편차
    - VARIANCE : 분산 계산
    
    ⇒ select SUM(속성) from 테이블
    
- 그룹함수
    - ROLLUP : 그룹별 소계값
        - select ~ from 테이블 [where] Group By [속성] ROLLUP (컬럼1,컬럼2) [having] [order by]
    - CUBE : 다차원 집계값
        - select ~ from 테이블 [where] Group By [속성] CUBE [ 컬럼명1,…]
    - grouping sets : 집계 대상 컬럼들에 대한 개별 집계
        - select ~ from 테이블 [where] Group By [ 컬럼명 ] Grouping Sets [컬럼명1, …]
- 윈도함수 (OLAP)
    - Partition By : 순위 대상 범위 선정
        - select 함수명(파라미터) OVER [partition by 컬럼1,…] [order by 컬럼 A,…] From 테이블명
    - 순위함수
        - rank : 동일 순위이면 동일순위 표현 , 그만큼 다음번 등수는 밀려남 (2등,2등,2등, 5등…)
        - Dense_rank : 동일 순위이면 동일 순위로 표현 (2등,2등,2등,3등…)
        - Row_Number : 동일 순위이어도 연속번호 부여 (2등,3등,4등,5등…)
        
        > [!NOTE]
> select 속성1, 속성2,
>             RANK() OVER (Order by 속성1 DESC),
>             DENSE_RANK() OVER (Order by 속성1 DESC),
>             ROW_NUMBER() OVER (Order by 속성1 DESC),
>         From 테이블;
        

---

- 절차형 SQL 종류
    - 프로시저 : 일련의 쿼리를 하나의 함수처럼 작동
    - 사용자 정의 함수 : 수행결과를 단일값 반환
    - 트리거 : 삽입, 갱신, 삭제 이벤트가 발생할 때 실행
- 옵티마이저 : SQL 최적의 처리 (DBMS 핵심기능)
    - RBO : 규칙기반 옵티마이저
    - CBO : 비용기반 옵티마이저

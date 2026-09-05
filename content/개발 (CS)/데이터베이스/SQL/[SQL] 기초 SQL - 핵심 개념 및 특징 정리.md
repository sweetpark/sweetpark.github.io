---
title: "[기초] SQL"
tags: [학습, 개발-CS, 데이터베이스, 개발, SQL, MySQL, 인덱스, 뷰, 프로시저, 트리거]
modified: 2026-09-05
---

# [기초] SQL

> [!NOTE]
> MySQL 기준 SQL 기초 총정리. DB/DBMS 개념부터 SELECT/INSERT/UPDATE/DELETE, JOIN, 스토어드 프로시저·함수, 제약조건, 뷰, 인덱스(균형 트리), 커서, 트리거까지 문법 예시와 함께 정리한다.

## 📌 개념

### 데이터베이스와 DBMS

- 데이터베이스 : 카카오톡 메세지, 인스타 등록한 사진, 버스/지하철에서 찍은 교통카드 등의 데이터를 모아 두는 것 (= 데이터의 집합)
- DBMS : 데이터베이스를 관리하는 소프트웨어
    - 데이터베이스 여러 개(=대용량) 관리 가능
    - 공유가 가능하다
    - DBMS 종류 : MySQL, MariaDB, Oracle 등
- MySQL 고유 포트 : 3306
- MySQL Workbench : MySQL 서버에 접속해주는 프로그램

### 기초 이론

- 데이터베이스 모델링
    - 현실세계에서 일어나는 일을 데이터로 만드는 설계도
    - 데이터의 테이블을 만드는 과정
    - 예) 데이터베이스 ⇒ 폴더, 테이블 ⇒ 파일
- 데이터베이스 구성도
    - 행의 개수 = 데이터의 개수
    - 기본키의 조건 (열 : 1개 지정)
        1. null 불가
        2. 중복 불가
- 테이블 외의 것들
    - 인덱스 : 데이터를 조회할 때 빠르게 해주는 역할
    - 뷰 : select문의 출력물을 보여줌 (보안상에 사용)
    - 스토어드 프로시저 : 프로그래밍 기능을 할 수 있게 도와준다
        - 저장 프로시저 → call을 이용하여 간단하게 select 가능 (= 약간의 매크로 기능)

### 기본 DML

- **SELECT 문**
    - 데이터를 읽는 것
    - select 문법 순서가 바뀌면 안 됨 (예: where이 from보다 먼저 나오면 안 됨)
    - 내용이 변경되지는 않음
- **INSERT 문** : 데이터를 추가
- **UPDATE 문** : 데이터를 수정
- **DELETE 문** : 데이터를 삭제

### JOIN

- 테이블 간의 연결
- 내부 연결 (두 개의 테이블에 공통된 행만 결과 출력)
    - 1:N : 기본키(PK)와 외래키(FK)로 이어져 있음
    - 예) 회원 테이블 → 구매 테이블 : 하나의 회원이 여러 물품을 구매할 수 있음

```sql
SELECT <열 목록>
FROM <첫 번째 테이블>
     INNER JOIN <두 번째 테이블>
     ON <조인될 조건>
[WHERE 검색 조건]
```

- 외부 연결 (공통된 행이 아니어도 결과 출력됨)
    - 1:N 가능

```sql
SELECT <열 목록>
FROM <첫 번째 테이블(LEFT 테이블)>
     <LEFT | RIGHT | FULL> OUTER JOIN <두 번째 테이블(RIGHT 테이블)>
ON <조인될 조건>
[WHERE 검색 조건];
```

- 기타 조인(CROSS JOIN) : 내용의 의미는 없지만 그냥 연결시켜 줌 (⇒ 대용량 선택할 때 이용)

```sql
SELECT *
FROM 테이블
     CROSS JOIN 테이블;
```

- ⇒ ON 구문 없음
- ⇒ 결과의 내용은 의미가 없다

- self 조인 : 자기 자신을 조인함

```sql
SELECT <열 목록>
FROM <테이블> 별칭 A
     INNER JOIN <테이블> 별칭 B
     ON <조인될 조건>
[WHERE 검색 조건]
-- 별칭 A, 별칭 B는 같은 테이블인데 이름만 다르게 씀
```

- 예) 직속상관의 데이터를 출력하고 싶음 (같은 테이블 안에 존재)

### MySQL 프로그래밍

```sql
DELIMITER $$
CREATE PROCEDURE 스토어드_프로시저_이름()
BEGIN
     -- (이 부분에 SQL 프로그래밍 코딩)
END $$
DELIMITER ;
CALL 스토어드_프로시저_이름();
```

1. 조건문
    - CASE 문 (조건문)

    ```sql
    CASE
        WHEN 조건1 THEN
            SQL문장들1
        WHEN 조건2 THEN
            SQL문장들2
        WHEN 조건3 THEN
            SQL문장들3
    END CASE;
    ```

    - IF 문

    ```sql
    IF <조건식> THEN
        SQL문장들
    END IF;
    ```

2. 반복문
    - WHILE 문

    ```sql
    WHILE (조건식) DO
        SET 조건식
    END WHILE;
    ```

    - `ITERATE`(continue 역할) / `LEAVE`(break 역할)

3. 동적 SQL (21강 20분)

    ```sql
    USE market_db;
    PREPARE myQuery FROM 'SELECT * FROM member WHERE mem_id = "BLK"';
    EXECUTE myQuery;
    DEALLOCATE PREPARE myQuery;
    ```

    - `SET @curDATE = CURRENT_TIMESTAMP();` — 현재 날짜와 시간

### 테이블 만들기

- GUI 환경
    1. DB 생성 (create DB)
    2. DB 선택 (GUI 더블클릭 or use DB)
    3. 테이블 (오른쪽 마우스) → 테이블 create (GUI 환경)
    - 테이블 만들기(GUI)에서 AI → 자동 증가
- PK(기본키) + FK(외래키) ⇒ 1:N
    - 기본키 : 필수로 들어 있어야 함 (1)
    - 외래키 : 중복 가능 (필수 아님) (N)
- SQL 구문 이용

```sql
CREATE TABLE sample_table (변수명(열) 자료형);
```

### 제약조건 (13장)

- 제약조건이란? : 데이터 무결성을 지키기 위해 제한하는 조건 (중복 방지)
- 제약조건 종류
    - primary key(기본키) : 데이터를 구별할 수 있는 식별 키
        - 값 중복 불가
        - null 입력 불가
        - 클러스터형 인덱스가 생성됨

- Primary Key 방식 3가지

```sql
-- 방식 1: 컬럼 정의에 PRIMARY KEY 명시
USE naver_db;
DROP TABLE IF EXISTS buy, member;
CREATE TABLE member
( mem_id     CHAR(8) NOT NULL PRIMARY KEY,
  mem_name   VARCHAR(10) NOT NULL,
  height     TINYINT UNSIGNED NULL
);
```

```sql
-- 방식 2: 컬럼 정의 후 PRIMARY KEY 절
CREATE TABLE member
( mem_id    CHAR(8) NOT NULL,
  mem_name  VARCHAR(10) NOT NULL,
  height    TINYINT UNSIGNED NULL,
  PRIMARY KEY (mem_id)
);
```

```sql
-- 방식 3: ALTER TABLE로 기본키 추가
CREATE TABLE member
( mem_id   CHAR(8) NOT NULL,
  mem_name VARCHAR(10) NOT NULL,
  height   TINYINT UNSIGNED NULL
);
ALTER TABLE member
      ADD CONSTRAINT
      PRIMARY KEY (mem_id);
```

- foreign key(외래키)란? 데이터의 무결성을 가지게 해준다
    - 예) 회원 테이블에 있어야 구매 테이블에 입력 가능
    - 1:N 관계
    - PK(기본키), FK(외래키) : 기본키는 Update 및 Delete 불가 (데이터 무결성 보장)
    - on delete cascade / on update cascade : 기본키 update 및 delete 가능 (외래키 연결 시)
- unique 란?
    - 기본키와 유사하다 (⇒ 중복되지 않는 유일한 값 입력)
- check 란?
    - 입력되는 데이터를 점검하는 기능 (조건 안의 값만 입력 가능)
    - 데이터 무결성 추가
- default 란?
    - 데이터를 입력하지 않으면 자동으로 들어가는 기본 값
- null 값 허용
    - null : 데이터가 빈칸이어도 상관없음
    - not null : 데이터가 빈칸이면 안 됨

### 뷰 (14장)

- 뷰 ⇒ 가상의 테이블 (테이블의 내용이 보임)

```sql
CREATE VIEW 뷰_이름
AS
     SELECT 문;
```

- 뷰를 테이블로 생각해도 됨
- view 테이블은 "v_이름"으로 지정하는 것이 좋음 (실무에서도 사용)
- 뷰를 사용하는 이유
    - 보안에 도움이 됨 (예: 회원 테이블의 필요한 정보만 출력, 주민등록·주소지 등 숨기기 가능)
- 뷰의 사용
    - `DESCRIBE 뷰이름` : 뷰 정보 출력
    - `DROP 뷰이름` : 뷰 삭제
    - ALTER 구문 : 수정

```sql
ALTER VIEW v_이름
AS
     SELECT * FROM member WHERE height >= 167
     WITH CHECK OPTION;
```

- view를 통해 insert는 가능하나, 원래 테이블의 not null 조건이 있는 열이 없는 view일 경우 insert가 안 될 수 있음

### 인덱스 (15장)

- 인덱스란?
    - 필수는 아님
    - 데이터를 빠르게 찾는 데 도움
    - 하지만 인덱스를 무분별하게 사용할 경우 더 늦게 찾아질 수 있음
- 인덱스 종류
    - 클러스터형 인덱스 (= 영어사전, 데이터 순서에 변화, 기본키)
        - 정렬됨
        - 예) 영어사전처럼 저장 (a-z | 0-9 순서대로 인덱스가 되어 있음)
    - 보조 인덱스 (= 일반 책 뒤의 찾아보기 페이지, 데이터 순서 변화 없음, unique 키)
        - 입력된 순서대로 저장
        - 정렬되지 않음
        - 인덱스 페이지가 생길 뿐 내용의 변화는 없다
- 자동으로 생성되는 인덱스
    - 클러스터형 인덱스 : 기본키(primary)가 영어 사전처럼 순서대로 select 됨 (자동으로 인덱스)
        - key name : primary ⇒ 클러스터형 인덱스
        - unique로 지정 ⇒ 보조 인덱스로 생성

> [!NOTE]
> - 클러스터형 인덱스 : 한 개만 가능 (= primary)
> - 보조 인덱스 : 여러 개 가능

    - non_unique : 유일하지 않다 (1 : true, 0 : false)
        - 예) 0일 경우 ⇒ 유일하지 않은 게 아니다 (= 유일함)

### 균형 트리 (16장)

- 균형 트리의 개념
    - 노드 존재 안 함 ⇒ 모든 페이지를 찾아서 읽어야 함
    - 노드 존재 ⇒ 루트 노드(부모), 리프 노드(자식)
        - 빠르게 찾을 수 있음 (루트 노드를 통해 목적지로 이동) = SELECT
        - INSERT, UPDATE, DELETE는 느릴 수 있음 (페이지 분할로 인해 느려짐)

> [!NOTE]
> 페이지 분할
> - 공간 부족으로 인해 데이터가 밀릴 경우 새로운 페이지가 생성됨
> - 페이지 분할로 새로운 페이지가 생길 시 많은 리소스 사용

- 클러스터형 인덱스
    - 기본키 지정 시 기본키 기준으로 정렬됨
- 보조 인덱스
    - unique 키를 지정할 경우 데이터 페이지는 그대로 유지
    - 인덱스 페이지가 새로 생성 (⇒ 구성 : 루트 노드, 리프 노드 생성됨)
- 클러스터형 인덱스 vs 보조 인덱스
    - 클러스터형 인덱스가 평균적으로 조금 더 빠름

### 인덱스 활용 (17장)

- 인덱스 생성

```sql
CREATE [UNIQUE] INDEX 인덱스_이름
   ON 테이블_이름 (열_이름) [ASC | DESC];
```

- UNIQUE ⇒ 중복 불가

- 인덱스 제거

```sql
DROP INDEX idx_테이블명_인덱스적용열 ON 테이블명;
```

- 인덱스 출력

```sql
SHOW INDEX FROM 테이블명;
```

- 인덱스 상세 출력

```sql
SHOW TABLE STATUS LIKE '테이블명';
-- index_length → 인덱스 크기
```

- 인덱스 적용

```sql
ANALYZE TABLE 테이블명;
```

- 중요도
    - `SELECT 열이름 FROM 테이블명 WHERE 조건`
    - WHERE 조건에서 인덱스 사용
    - SELECT 열 이름에서는 인덱스가 사용 안 됨
- 인덱스 열은 가공(= 연산)을 하면 인덱스 적용이 안 됨
    - 예) `mem_num * 2 >= 14`

- 인덱스 삭제

```sql
-- 기본키 삭제
ALTER TABLE 테이블명
      DROP PRIMARY KEY;
```

```sql
-- 외래키 삭제
ALTER TABLE 테이블명
      DROP FOREIGN KEY 열이름;
```

- 외래키 이름 조회

```sql
SELECT table_name, constraint_name
FROM information_schema.referential_constraints
WHERE constraint_schema = 'db명';
```

### 스토어드 프로시저 (18장)

- 프로시저 만들기

```sql
DELIMITER $$
CREATE PROCEDURE 프로시저_이름 (IN 또는 OUT 매개변수)
BEGIN
    -- 프로그래밍 코드
END $$
DELIMITER ;
```

- 프로시저 실행

```sql
CALL 프로시저_이름;
```

- 입력 매개변수
    - 여러 개를 사용해도 상관없음

```sql
IN 입력_매개변수_이름 데이터_형식
```

- 입력 매개변수 사용

```sql
CALL 입력_매개변수_이름('매개변수 값');
```

- 출력 매개변수 (⇒ return 이라 생각하면 쉬움)

```sql
OUT 출력_매개변수_이름 데이터_형식
```

- 출력 매개변수 사용

```sql
CALL 출력_매개변수_이름('매개변수 값', @출력_매개변수);
```

### 스토어드 함수와 커서 (19장)

- 변수 이름 설정

```sql
DECLARE 변수이름 데이터형식;
```

- 사용자 지정 함수 (스토어드 함수)
- 커서
    - 한 행씩 처리하는 방법
- 커서 작동 순서
    1. 커서 선언하기
    2. 반복 조건 선언하기
    3. 커서 열기
    4. 데이터 가져오기 (반복)
    5. 데이터 처리하기 (반복)
    6. 커서 닫기
- 커서 단계별 실습

```sql
-- 행의 끝 변수 설정
DECLARE endOfRow BOOLEAN DEFAULT FALSE;
```

```sql
-- 행의 끝 도달 핸들러
DECLARE CONTINUE HANDLER
        FOR NOT FOUND SET endOfRow = TRUE;
```

```sql
-- 반복 행 빠져나가기
IF endOfRow THEN
     LEAVE cursor_loop;
END IF;
```

- FETCH : 한 행씩 읽어오는 것

### 트리거 (20장)

- 트리거 : INSERT, UPDATE, DELETE 문이 발생하면 실행되는 코드

```sql
DELIMITER $$
CREATE TRIGGER 트리거이름
     AFTER DELETE            -- delete 실행 시 트리거 사용
     ON 트리거를_붙일_테이블이름
     FOR EACH ROW            -- 각 행마다 실행
BEGIN
     SET @msg = '가수 그룹이 삭제됨';
END $$
DELIMITER ;
```

- 트리거 활용

```sql
CREATE TABLE singer (SELECT mem_id, mem_name, mem_number, addr FROM member);

DROP TABLE IF EXISTS backup_singer;
CREATE TABLE backup_singer
( mem_id      CHAR(8) NOT NULL,
  mem_name    VARCHAR(10) NOT NULL,
  mem_number  INT NOT NULL,
  addr        CHAR(2) NOT NULL,
  modType     CHAR(2),      -- 변경된 타입. '수정' 또는 '삭제'
  modDate     DATE,         -- 변경된 날짜
  modUser     VARCHAR(30)   -- 변경한 사용자
);

DROP TRIGGER IF EXISTS singer_updateTrg;
DELIMITER $$
CREATE TRIGGER singer_updateTrg  -- 트리거 이름
     AFTER UPDATE                -- 변경 후에 작동하도록 지정
     ON singer                   -- 트리거를 부착할 테이블
     FOR EACH ROW
BEGIN
     INSERT INTO backup_singer VALUES( OLD.mem_id, OLD.mem_name, OLD.mem_number,
     OLD.addr, '수정', CURDATE(), CURRENT_USER() );
END $$
DELIMITER ;

-- OLD(MySQL 예약어) ⇒ 변경 전의 값이 저장됨
```

- 테이블 데이터 삭제

```sql
TRUNCATE TABLE 테이블명;
```

- TRUNCATE 는 트리거가 실행되지 않음

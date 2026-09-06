---
title: "[SQL] 데이터 타입"
tags: [프로그래밍 언어, SQL]
created: 2026-09-05
modified: 2026-09-05
---

# [SQL] 데이터 타입

1. 문자열 데이터 타입  
2. 숫자 데이터 타입  
3. 날짜 및 시간 데이터 타입  
4. 논리 데이터 타입  
5. 이진 데이터 타입  
6. 기타 데이터 타입

> [!TIP] DB 엔진
> `ENUM`, `BOOLEAN`, `JSON`, `BLOB`, `DATETIME`(날짜+시간을 하나의 타입으로 분리) 등은 MySQL 기준 표기다. Oracle은 문자열에 `VARCHAR2`, 큰 텍스트에 `CLOB`, 논리값에 별도 타입 없이 관례적으로 `CHAR(1)`/`NUMBER(1)`를 쓰고(23c부터 네이티브 `BOOLEAN` 지원), 날짜는 `DATE` 하나로 날짜+시간을 함께 저장한다.

## 문자열 데이터 타입

| 형태 | 설명 | 사용 예 |
| --- | --- | --- |
| CHAR(n) | 고정 길이 문자열 | CHAR(10) |
| VARCHAR(n) | 가변 길이 문자열 | VARCHAR(255) |
| TEXT | 매우 긴 텍스트 데이터 | TEXT |

*   **왜 CHAR와 VARCHAR를 구분하는가**: CHAR(n)은 항상 n자리 고정 공간을 차지하도록 남는 부분을 공백으로 채우는 반면, VARCHAR(n)은 실제 입력된 길이만큼만(+길이 정보) 저장한다. 그래서 우편번호·주민번호처럼 길이가 항상 일정한 값은 CHAR가 공간 낭비 없이 약간 더 빠른 비교가 가능하고, 이름·주소처럼 길이가 들쭉날쭉한 값은 VARCHAR가 공간을 절약한다. TEXT는 매우 큰 데이터를 위해 별도 저장 영역(오프페이지)에 저장되는 경우가 많아, 인덱싱이나 정렬 시 VARCHAR보다 제약이 많다.

```sql
Create Table example_table(
     username VARCHAR(50) NOT NULL,
     password CHAR(64) NOT NULL,
     detail_text TEXT
);
```

## 숫자 데이터 타입

| 형태 | 설명 | 사용 예 |
| --- | --- | --- |
| INT | 정수 값 저장 | INT |
| BIGINT | 더 큰 정수 값 (큰 수) | BIGINT |
| DECIMAL | 정밀한 소수 저장 | DECIMAL(10,2) // 소수점 포함 10자리 (소수점 이하 2자리) |
| FLOAT, DOUBLE | 부동 소수점 숫자 저장 | FLOAT, DOUBLE |

*   **왜 돈 계산엔 DECIMAL을 쓰는가**: FLOAT/DOUBLE은 값을 2진수(이진 부동소수점)로 근사해서 저장하기 때문에 0.1처럼 10진수로는 딱 떨어지는 값도 내부적으로는 근사값이 되어 누적 계산 시 오차가 생길 수 있다. DECIMAL은 10진수 자릿수를 그대로 정확히 저장하는 고정소수점 타입이라 반올림 오차가 없어 금액·정밀 계산에 적합하고, FLOAT/DOUBLE은 오차를 감수할 수 있는 과학/통계 계산에 적합하다.

```sql
Create Table example_table(
     id INT,
     height DECIMAL(5,2),
     weight DOUBLE
);
```

## 날짜 및 시간 데이터 타입

| 형태 | 설명 | 사용 예 |
| --- | --- | --- |
| DATE | 날짜 저장 (포맷 : YYYY-MM-DD) | CREATE TABLE table (...time_column DATE,..); |
| TIME | 시간 저장 (포맷 : HH:MM:SS) | CREATE TABLE table (...date_column TIME,..); |
| DATETIME | 날짜 + 시간 저장 (포맷 :YYYY-MM-DD HH:MM:SS) | CREATE TABLE table (...datetime_column DATETIME,..); |
| TIMESTAMP | 날짜 +시간 저장,자동으로 현재시간 기록 가능 | CREATE TABLE table ( ... timestamp_column TIMESTAMP DEFAULT CURRENT_TIMESTAMP,..); |

*   **왜 DATETIME과 TIMESTAMP를 나누는가 (MySQL 기준)**: TIMESTAMP는 내부적으로 UTC로 저장한 뒤 조회 시 세션 타임존으로 변환해 보여주고, 행 삽입/수정 시 자동으로 현재시간을 기록하는 용도로 자주 쓰이지만 저장 가능 범위가 1970~2038년으로 좁다. DATETIME은 입력한 값을 타임존 변환 없이 그대로 저장하며 범위가 훨씬 넓어(1000~9999년), "생성/수정 시각 자동 기록"에는 TIMESTAMP를, "타임존과 무관한 특정 일시"에는 DATETIME을 쓰는 식으로 구분한다. Oracle은 이 둘을 나누지 않고 `DATE`(초 단위) 또는 `TIMESTAMP`(초 이하 정밀도, 옵션으로 타임존 포함) 타입으로 처리한다.

## 논리 데이터 타입

| 형태 | 설명 | 사용 예 |
| --- | --- | --- |
| BOOLEAN | 참 또는 거짓을 저장 | BOOLEAN |

*   **참고**: MySQL의 `BOOLEAN`은 실제로는 `TINYINT(1)`의 별칭(alias)이라 내부적으로 0/1 정수로 저장·비교된다(진짜 불리언 타입이 아니다). PostgreSQL은 네이티브 `boolean` 타입을 제공하고, Oracle은 23c 이전 버전에서는 별도 논리 타입이 없어 관례적으로 `CHAR(1)`('Y'/'N')이나 `NUMBER(1)`(0/1)로 대체해 사용했다.

```sql
Create Table example_table(
     is_active BOOLEAN
);
```

## 이진 데이터 타입

| 형태 | 설명 | 사용 예 |
| --- | --- | --- |
| BLOB | 이미지, 비디오, 파일 등의 이진 데이터 저장 | BLOB |

```sql
Create Table example_table(
     image BLOB
);
```

## 기타 데이터 타입

| 형태 | 설명 | 사용 예 |
| --- | --- | --- |
| ENUM | 미리 정의된 값 중 하나만 선택할 수 있는 데이터 타입 | ENUM('first', 'second') |
| JSON | JSON형식 저장 가능 | JSON |

*   **왜 ENUM은 주의해서 써야 하는가**: ENUM은 내부적으로 정의된 목록을 정수 인덱스로 저장하기 때문에 저장 공간이 작고 조회도 빠르지만, 허용값 목록 자체가 스키마(테이블 정의)에 박혀 있어 값을 추가/삭제하려면 `ALTER TABLE`이 필요하다. 값의 종류가 자주 바뀌거나 여러 테이블에서 같은 목록을 공유해야 한다면 ENUM 대신 별도의 코드 테이블(FK 참조)을 두는 편이 유연하다.

```sql
Create Table example_table(
     status ENUM('on-line', 'off-line', 'end'),
     preferences JSON
);
```

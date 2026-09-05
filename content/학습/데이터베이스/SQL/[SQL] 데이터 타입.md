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

## 문자열 데이터 타입

| 형태 | 설명 | 사용 예 |
| --- | --- | --- |
| CHAR(n) | 고정 길이 문자열 | CHAR(10) |
| VARCHAR(n) | 가변 길이 문자열 | VARCHAR(255) |
| TEXT | 매우 긴 텍스트 데이터 | TEXT |

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

## 논리 데이터 타입

| 형태 | 설명 | 사용 예 |
| --- | --- | --- |
| BOOLEAN | 참 또는 거짓을 저장 | BOOLEAN |

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

```sql
Create Table example_table(
     status ENUM('on-line', 'off-line', 'end'),
     preferences JSON
);
```

> 원문: https://gradualprecision.tistory.com/125

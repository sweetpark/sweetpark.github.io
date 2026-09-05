---
title: "DB 테이블 용량 증설"
tags: [학습, 개발-CS, 데이터베이스, 개발, SQL, Oracle, 테이블스페이스]
modified: 2026-09-05
---

# DB 테이블 용량 증설

> [!NOTE]
> Oracle 테이블스페이스에 데이터파일을 추가하거나 기존 파일을 resize 하여 용량을 증설한 실무 작업 명령 모음과 작업 순서.

## 📌 개념

### 사용한 명령 (실무 기록)

```sql
ALTER TABLESPACE TS_ONSRES ADD DATAFILE '/onsdata/data2/onsres_data04.dbf' SIZE 10g autoextend on;

ALTER TABLESPACE TS_ONSDCT ADD DATAFILE '/onsdata/data2/onsdct_data06.dbf' SIZE 10g autoextend on;

ALTER DATABASE DATAFILE '/onsdata/data1/onsdct_index01.dbf' resize 10G;

ALTER TABLESPACE IX_ONSRES ADD DATAFILE '/onsdata/data2/onsres_index05.dbf' SIZE 5g autoextend on;

ALTER TABLESPACE TS_ONS ADD DATAFILE '/onsdata/data1/ons_data04.dbf' SIZE 10g autoextend on;

ALTER DATABASE DATAFILE '/onsdata/data2/onslog_data03.dbf' resize 10G;

ALTER DATABASE DATAFILE '/onsdata/data2/onsres_data04.dbf' resize 14G;

ALTER DATABASE DATAFILE '/onsdata/data1/ons_data04.dbf' resize 20G;
```

### 작업 순서

1. 테이블스페이스 용량 확인
2. 데이터 위치 파악 (테이블 용량 바로 밑 위치 파악 가능)
3. `df -gP` 를 통해 해당 용량 여유분 확인
4. 데이터 파일 용량 resize (다시 설정 // 주의: 추가가 아님)
    - 예) 기존 10G에서 10G를 늘리려면 → `resize 20G`

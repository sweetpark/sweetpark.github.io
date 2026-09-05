---
title: "DML 로그 남기기"
tags: [학습, 개발-CS, 데이터베이스, 개발, SQL]
modified: 2026-09-05
---

# DML 로그 남기기

> [!NOTE]
> MySQL general_log를 켜서 INSERT/UPDATE 등 DML 쿼리를 테이블에 기록·조회하는 방법과, 대소문자 구분을 위한 my.ini 설정을 정리한다.

## 📌 개념

- 쿼리 로그 기록 및 확인방법

```sql
-- 로그 기록 시작
SET GLOBAL general_log = 'ON'

-- 로그를 테이블에 저장하도록 설정 (보기 편함)
SET GLOBAL log_output = 'TABLE'

-- 확인하기

SELECT gl.argument 
FROM mysql.general_log gl
WHERE 
    -- 1. 포함할 조건 (INSERT 또는 UPDATE)
    (gl.argument LIKE '%insert into%' OR gl.argument LIKE '%update%')    
    -- 2. 제외할 조건
    AND gl.argument NOT LIKE '%TBLG_IMS_LOG%' 
    AND gl.argument NOT LIKE '%set autocommit%';
```

- my.ini 수정 ( 대소문자 구분하기 )

```bash
[mysqld]
# 0: 대소문자 구분 (Linux 기본값, Windows 사용 비추천)
# 1: 모두 소문자로 저장 (Windows 기본값)
# 2: 입력한 대로 저장하되, 비교는 대소문자 구분 안 함 (추천!)

lower_case_table_names=2
```

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
- **왜 필요한가**: 애플리케이션 로그만으로는 실제로 DB에 어떤 SQL이 날아갔는지(파라미터 바인딩 결과 포함) 확인하기 어려울 때가 많다. `general_log`는 MySQL 서버에 도달한 모든 쿼리를 원문 그대로 기록해, 어떤 코드가 언제 어떤 INSERT/UPDATE를 실행했는지 사후 추적할 수 있게 해준다. 다만 모든 쿼리를 기록하므로 트래픽이 많은 운영 환경에서는 성능 오버헤드가 커서 디버깅 시점에만 켜고 끄는 것이 일반적이다.

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

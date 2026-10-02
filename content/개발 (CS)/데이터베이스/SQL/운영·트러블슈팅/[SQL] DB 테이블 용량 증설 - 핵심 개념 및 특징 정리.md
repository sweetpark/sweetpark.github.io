---
title: "DB 테이블 용량 증설"
tags: [학습, 개발-CS, 데이터베이스, 개발, SQL, Oracle, 테이블스페이스]
modified: 2026-09-05
---

# DB 테이블 용량 증설

> [!NOTE]
> Oracle 테이블스페이스에 데이터파일을 추가하거나 기존 파일을 resize 하여 용량을 증설한 실무 작업 명령 모음과 작업 순서.

## 📌 개념

*   **왜 테이블스페이스에 데이터파일을 추가하는가**: Oracle은 테이블/인덱스 데이터를 논리적 단위인 "테이블스페이스"에 저장하고, 테이블스페이스는 실제로 하나 이상의 물리적 "데이터파일(.dbf)"에 데이터를 나눠 담는다. 기존 데이터파일이 가득 차면 그 안에 더 이상 새 데이터를 넣을 공간이 없으므로, ① 기존 파일을 `RESIZE`로 키우거나 ② 새 데이터파일을 `ADD DATAFILE`로 추가해 테이블스페이스의 전체 용량을 늘려야 한다. `autoextend on`을 주면 파일이 다 차기 전에 OS 디스크 여유 공간이 있는 한 자동으로 파일 크기를 늘려주지만, 디스크 자체가 꽉 차면 이마저도 실패하므로 사전에 `df -gP`로 물리 디스크 여유분을 확인하는 절차가 필요한 것이다.

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
    - **왜 "추가가 아니라 재설정"인가**: `RESIZE`는 파일의 최종 목표 크기를 지정하는 절대값 명령이라, 현재 10G인 파일에 `RESIZE 10G`를 실행하면 아무 변화가 없다(이미 10G이므로). 10G를 더 늘리고 싶다면 반드시 "현재값 + 늘릴 양"인 20G를 지정해야 하며, 이 값을 헷갈려 실수로 더 작은 값을 넣으면 오히려 축소를 시도하다 이미 사용 중인 공간 때문에 에러가 나거나(데이터가 있는 영역이면 축소 불가) 의도치 않게 큰 파일을 만들 위험이 있다.

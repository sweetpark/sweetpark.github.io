---
title: "이벤트처리"
tags: [학습, 개발실무, 저장소-&-데이터베이스]
created: 2026-02-04
modified: 2026-09-05
---

# 이벤트처리

> [!NOTE]
> MySQL 이벤트 스케줄러(EVENT)로 주기적인 작업(예: 파티션 생성)을 예약하는 문법.
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 이벤트 생성 쿼리문

```sql
CREATE EVENT [event명]
ON SCHEDULE [스케줄 주기]          -- 예: EVERY 1 MONTH
STARTS '2025-03-01 00:00:00.000'   -- 이벤트 시작 시간
ENDS   [종료 시간]                  -- 이벤트 종료 시간
ON COMPLETION NOT PRESERVE ENABLE  -- 종료 후 처리 방법(이벤트 유지 여부)
COMMENT '1달 마다 파티션 생성'      -- 코멘트
DO
    -- 실행할 명령어
    -- 예: CALL partition_manage();
;
```

> [!NOTE]
> 종료 시각 키워드는 `END`가 아니라 `ENDS`이다. 이벤트 스케줄러를 쓰려면 `event_scheduler` 시스템 변수가 ON 이어야 한다.

- 이미 만들어져 있을 경우 → `ALTER EVENT` 사용

## 관련 문서

- [(SQL) 파티션 작업 - 핵심 개념 및 특징 정리](./[SQL]%20파티션%20작업%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 이벤트 스케줄러 문법이 실제로 쓰이는 사례(자동 파티션 순환)
- [(MySQL) 프로시저 - 핵심 개념 및 특징 정리](./[MySQL]%20프로시저%20-%20핵심%20개념%20및%20특징%20정리.md) — `CREATE EVENT ... DO CALL partition_manage()`처럼 이벤트가 실제로 호출하는 프로시저 문법을 다루는 자매 노트

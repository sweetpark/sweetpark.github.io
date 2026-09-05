---
title: "MySQL/MariaDB utf8mb4 문자셋 변경 절차"
tags: [학습, 개발-CS, 데이터베이스, MySQL, MariaDB, AWS RDS]
modified: 2026-09-05
---

# MySQL/MariaDB utf8mb4 문자셋 변경 절차

> [!NOTE]
> 한글(과 이모티콘) 저장 깨짐을 해결하기 위해 문자셋을 UTF8mb4로 변경하는 절차. AWS RDS(MariaDB) 파라미터 그룹 변경과, DB에 직접 접속해 컬럼/테이블/DB 단위로 문자셋을 변경하는 SQL을 함께 정리.

## ⚙️ 개념

> [!NOTE]
> UTF-8 : 한글/영어 지원
>
> UTF8mb4 : 한글/영어/이모티콘 지원(멀티바이트 문자 전체 커버)

## ⚙️ RDS 파라미터 그룹에서 변경

1. 파라미터 그룹 > 생성 — 해당 DB 버전에 맞는 파라미터 그룹 생성
2. 파라미터 그룹 편집
    - 파라미터 필터링: `character_set` → 해당 값들을 `utf8mb4`로 수정
    - 파라미터 필터링: `collation` → 해당 값들을 `utf8mb4_general_ci`로 수정
3. 마지막 절차: DB 재부팅

## ⚙️ 재부팅 후에도 적용 안 될 경우 — DB 접속 후 직접 변경

```sql
-- 컬럼 속성 변경
ALTER TABLE member MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 테이블 자체 속성 변경
ALTER TABLE member CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 전체 변경
ALTER DATABASE cocktail CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
```

> [!NOTE]
> 컬럼 → 테이블 → 데이터베이스 순으로 범위를 넓혀가며 변경 가능. 이미 저장된 데이터가 깨진 상태라면 문자셋 변경만으로는 복구되지 않고, 재입력 또는 별도 복구 절차가 필요할 수 있다.

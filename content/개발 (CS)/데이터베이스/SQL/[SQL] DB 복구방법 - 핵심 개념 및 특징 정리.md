---
title: "DB 복구방법"
tags: [학습, 개발-CS, 데이터베이스, 개발, SQL]
modified: 2026-09-05
---

# DB 복구방법

> [!NOTE]
> 논리 백업 도구 `mysqldump`로 스키마+데이터를 SQL 텍스트로 덤프하고, 다시 클라이언트로 주입해 복구하는 방식이다.

> [!IMPORTANT]
> 원본이 간략하여 일반 지식을 AI가 보강함(사실 확인 권장).

*   **왜 이 방식(논리 백업)을 쓰는가**: `mysqldump`는 실제 데이터 파일을 그대로 복사하는 "물리 백업"이 아니라, 테이블을 재생성하고 데이터를 채워 넣는 `CREATE TABLE`/`INSERT` 구문 자체를 텍스트로 뽑아내는 "논리 백업"이다. 그래서 결과 파일이 사람이 읽을 수 있는 SQL이라 특정 테이블만 골라 복원하거나 다른 버전/엔진의 MySQL로 옮기기 쉽다는 장점이 있다. 다만 복원 시 SQL 문을 처음부터 다시 실행해야 하므로, 데이터 파일을 그대로 복사하는 물리 백업(예: `mysqldump` 대신 `Percona XtraBackup`, RDB의 스냅샷 등)보다 대용량 DB에서는 백업·복원 속도가 느리다는 단점이 있다.

## 💻 예시

- dump 생성방법

```bash
	mysqldump -u [계정] -p [DB명] --default-character-set=utf8 > dumpdata.sql
```

- dump 적용 방법

```bash
	mysql -u root -p [DB명] < dumpdata.sql
```

## 관련 문서

- [(개발실무) 데이터베이스 백업](../../../개발%20실무/백엔드·데이터처리/[Bash]%20데이터베이스%20백업%20-%20핵심%20개념%20및%20특징%20정리.md) — mysqldump 명령과 DBeaver 툴을 이용한 백업(덤프 생성) 방법을 다루는 짝 노트

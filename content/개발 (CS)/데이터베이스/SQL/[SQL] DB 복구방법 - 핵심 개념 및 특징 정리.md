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

## 💻 예시

- dump 생성방법

```bash
	mysqldump -u [계정] -p [DB명] --default-character-set=utf8 > dumpdata.sql
```

- dump 적용 방법

```bash
	mysql -u root -p [DB명] < dumpdata.sql
```

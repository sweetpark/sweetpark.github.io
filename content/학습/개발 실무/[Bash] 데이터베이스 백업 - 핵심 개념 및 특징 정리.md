---
title: "데이터베이스 백업"
tags: [학습, 개발실무, 저장소-&-데이터베이스]
created: 2026-02-04
modified: 2026-09-05
---

# 데이터베이스 백업

> [!NOTE]
> mysqldump 명령 또는 DB 툴(DBeaver)을 이용한 데이터베이스 백업 방법.
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 명령어(mysqldump)

```bash
mysqldump -u [계정명] -p [패스워드] [데이터베이스명] > [저장할 파일경로 + 파일이름]
```

> [!NOTE]
> 원문에는 `mysqldumps`로 적혀 있으나 실제 명령은 `mysqldump`이다.

### DB 툴 이용

- (DBeaver) 데이터베이스 우클릭 → 도구 → Dump databases
- 덤프하고 싶은 테이블 선택
- output 파일 위치 지정 후 Start

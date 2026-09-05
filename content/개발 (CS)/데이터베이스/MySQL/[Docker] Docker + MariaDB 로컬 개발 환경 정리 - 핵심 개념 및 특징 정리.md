---
title: "📌 Docker + MariaDB 로컬 개발 환경 정리"
tags: [학습, 개발-CS, 데이터베이스, 개발, MariaDB, Docker, CTE]
modified: 2026-09-05
---

# 📌 Docker + MariaDB 로컬 개발 환경 정리

> [!WARNING]
> 원본에 평문 비밀번호(root/애플리케이션 계정)가 포함되어 있어 마스킹 처리함.

---

> macOS 환경에서 MariaDB 직접 설치 시 발생한 CTE/WITH 오류를 해결하기 위해
> 
> 
> **Docker 기반 MariaDB 서버를 구성**하고,
> 
> **CLI 중심으로 서버 관리·접속·권한 설정·SQL import**를 수행한 과정 정리
> 

---

## 1. Docker CLI를 활용한 MariaDB 서버 기동

### 🔹 목적

- macOS(Homebrew) MariaDB 환경에서 발생한 **CTE(WITH) 테이블 조회 오류 회피**
- 회사 Linux 서버와 **동일한 DB 엔진/동작 환경** 구성

### 🔹 사용 이미지

- `mariadb:10.11.x` (회사와 동일 메이저 버전)

### 🔹 서버 기동 명령어

```bash
docker run -d \
  --name mariadb-local \
  -e MARIADB_ROOT_PASSWORD=<PASSWORD> \
  -p 3306:3306 \
  mariadb:10.11

```

### 🔹 핵심 포인트

- Docker MariaDB는 **완전히 새로운 DB 서버**
- `MARIADB_ROOT_PASSWORD`는 **컨테이너 최초 생성 시에만 적용**
- macOS 환경 제약을 제거하고 **Linux 파일시스템 기준으로 동작**

---

## 2. Docker CLI를 통한 MariaDB 접속 방법

### 🔹 macOS에 MariaDB Client가 없는 경우

- `mysql`, `mariadb` 명령어가 없음 → **정상**
- 서버 문제 아님, **클라이언트 미설치 상태**

### 🔹 권장 접속 방법 (Docker 내부 접속)

```bash
docker exec -it mariadb-local mariadb -u root -p

```

- 비밀번호: `<PASSWORD>` (마스킹됨)
- 가장 안전하고 Docker-only 방식

### 🔹 SQL import 시 주의점

- `docker exec -i` 는 **비대화형**
- 비밀번호 프롬프트 입력 불가

### 올바른 import 방식

```bash
docker exec -i mariadb-local mariadb -u root -p<PASSWORD> DB_NAME < file.sql

```

📌 `-p<PASSWORD>`처럼 **비밀번호를 붙여서** 전달해야 함

---

## 3. MariaDB 사용자 생성 및 권한 부여 (CLI)

### 🔹 목적

- root 계정 대신 **애플리케이션용 계정 사용**
- Spring / 서비스 계정 분리

### 🔹 사용자 생성

```bash
docker exec -it mariadb-local mariadb -u root -p<PASSWORD> -e "
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY '<PASSWORD>';
"

```

### 🔹 전체 DB 권한 부여

```bash
docker exec -it mariadb-local mariadb -u root -p<PASSWORD> -e "
GRANT ALL PRIVILEGES ON *.* TO 'app_user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
"

```

### 🔹 확인

```bash
docker exec -it mariadb-local mariadb -u root -p<PASSWORD> -e "
SHOW GRANTS FOR 'app_user'@'%';
"

```

### 🔹 접속 테스트

```bash
docker exec -it mariadb-local mariadb -u app_user -p<PASSWORD>

```

---

## 4. macOS 환경에서 CTE(WITH) 테이블 조회 실패 원인

### 🔹 증상

- 특정 테이블만:
    
    ```
    Table 'xxx' doesn't exist in engine
    'xxx' is not of type VIEW
    
    ```
    
- 일반 SELECT는 가능
- **WITH / CTE 구문에서만 실패**

---

### 🔹 원인 요약

### ① macOS 파일시스템 특성

- 기본 파일시스템: **case-insensitive**
- MariaDB 내부 테이블/임시 객체 관리와 충돌 가능성 존재

### ② `lower_case_table_names = 2` + macOS 조합

- 테이블 생성 시 대소문자 유지
- 조회 시 대소문자 무시
- **CTE / 임시 테이블 생성 과정에서 이름 정규화 충돌 발생**

### ③ 결과

- InnoDB 엔진 내부에서
    - 임시 테이블 / CTE 결과를
    - 실제 테이블과 혼동하거나
    - 엔진 레벨에서 테이블 미존재로 판단

📌 **SQL 문법 문제가 아니라, OS + FS + DB 조합 문제**

---

### 🔹 Docker(Linux)에서 해결된 이유

- Linux 파일시스템: **case-sensitive**
- MariaDB가 의도한 방식으로
    - 테이블
    - CTE
    - 임시 객체
        
        를 명확히 구분
        

➡ **동일 SQL / 동일 데이터 / 동일 버전**인데도 정상 동작

---

## ✅ 최종 결론

- macOS + Homebrew MariaDB는
    
    **CTE / 대소문자 / 엔진 레벨 동작에서 불안정**
    
- Docker 기반 MariaDB(Linux)는
    
    **회사 서버와 가장 동일한 실행 환경**
    
- 문제의 본질은:
    
    > ❌ SQL
    > 
    > 
    > ❌ MyBatis
    > 
    > ❌ 테이블 손상
    > 
    > ⭕ OS + 파일시스템 + MariaDB 내부 동작 차이
    > 

---

### ✨ 한 줄 요약

> Docker MariaDB는 단순한 대체 수단이 아니라macOS에서 재현 불가능한 서버 환경을 로컬에서 복제하는 유일한 방법이다.
>

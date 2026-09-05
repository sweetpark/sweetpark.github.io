---
title: "함수 명명법"
tags: [학습, 개발-CS, CS-기초, 기초, 개발, 명명법, 코딩컨벤션]
created: 2026-02-03
modified: 2026-09-05
---

# 함수 명명법

> [!NOTE]
> 변수·함수 이름을 짓는 대표 표기법(스네이크/카멜/파스칼/헝가리안)과 각 진영에서 주로 쓰는 관례를 정리한다.

> [!IMPORTANT]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 스네이크 표기법 (snake_case)
- 단어 사이를 `_`(언더스코어)로 이어 붙이는 표기법
- 단어는 모두 소문자로 작성 (예: `user_name`, `get_total_count`)
- 주로 Linux/Unix 계열, C, Python, SQL 컨벤션에서 사용
- 상수는 대문자 스네이크(SNAKE_CASE)로 표기 (예: `MAX_SIZE`)

### 카멜 표기법 (camelCase)
- "낙타 등" 모양처럼 단어 경계마다 대문자를 넣는 표기법
- **첫 단어는 소문자**, 이후 각 단어의 첫 글자는 대문자 (예: `userName`, `getTotalCount`)
- 주로 Java, JavaScript의 변수·메서드 이름에 사용

### 파스칼 표기법 (PascalCase)
- 카멜과 같지만 **첫 글자도 대문자** (예: `UserService`, `MemberRepository`)
- 클래스·인터페이스·타입 이름에 사용

### 헝가리안 표기법 (Hungarian notation)
- 이름 앞에 자료형/용도를 나타내는 접두어를 붙이는 방식
- 예: `pParam`(pointer), `strName`(string), `nCount`(int)
- 과거 Windows/C++ 진영에서 사용했으나 현재는 지양하는 추세

> [!TIP]
> 자바 표준: 클래스는 PascalCase, 메서드·변수는 camelCase, 상수는 SNAKE_CASE, 패키지는 모두 소문자.

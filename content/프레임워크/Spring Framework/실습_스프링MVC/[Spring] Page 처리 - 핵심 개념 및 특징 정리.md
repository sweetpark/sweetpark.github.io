---
title: "Page 처리"
tags: [학습, 개발-CS, 언어, Spring, JPA]
modified: 2026-09-05
---

# Page 처리

> [!NOTE]
> Spring Data의 `Pageable`을 이용한 페이징 처리 메모.

> [!NOTE] 실행 환경
> 버전 명시 없음 — `Pageable`/`PageRequest` 등 Spring Data Commons 표준 API만 사용되어 특정 Spring Boot/Spring Data 버전은 확정하기 어렵다.

## 🧱 기술 스택
Spring Data JPA (`Pageable`, `PageRequest`)

## ⚙️ 구현

- Pageable 추가

```java
//repository
Page<Entity> findAll(Pageable page);
//service
//PageRequest.of(현재페이지, 한 페이지 표시 개수)
PageRequest pageRequest = PageRequest.of(1,10);
Page<Entity> filterResult = repository.findAll(pageRequest);

List<Entity> results = filterResult.getContent(); // list로 변환
```

- spring에서 지원해주는 pageable
- 결국, limit 과 offset 을 쿼리에 날림 ( limit 조회개수 , offset 은 시작 위치)

## 관련 문서

- [(Spring) JPA - 핵심 개념 및 특징 정리]([Spring]%20JPA%20-%20핵심%20개념%20및%20특징%20정리.md) — 같은 Onz 프로젝트에서 JPA 연관관계 매핑을 다루는 자매 노트

---
title: "Page 처리"
tags: [학습, 개발-CS, 언어, Spring, JPA]
modified: 2026-09-05
---

# Page 처리

> [!NOTE]
> Spring Data의 `Pageable`을 이용한 페이징 처리 메모.
> Onz(칵테일 플랫폼) 프로젝트에서 이관.

## 🧱 기술 스택
Spring Data JPA (`Pageable`, `PageRequest`)

## ⚙️ 구현

- Pageable 추가

```java
//repository
Page<Entity> finaAll(Pageable page);
//service
//PageRequest.of(현재페이지, 한 페이지 표시 개수)
PageRequest pageRequest = PageRequest.of(1,10);
Page<Entity> filterResult = repository.findAll(pageRequest);

List<Entity> results = result.getContent(); // list로 변환
```

- spring에서 지원해주는 pageable
- 결국, limit 과 offset 을 쿼리에 날림 ( limit 조회개수 , offset 은 시작 위치)

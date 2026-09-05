---
title: "[Page 처리 #2] JPA 페이징 처리 이해하기 (+ OFFSET, Cursor 기반)"
tags: [토이프로젝트, 페이징 처리]
created: 2026-09-05
modified: 2026-09-05
---

# [Page 처리 #2] JPA 페이징 처리 이해하기 (+ OFFSET, Cursor 기반)

## JPA 페이징 처리

JPA의 페이징 처리 또한, OFFSET 기반 쿼리를 기본으로 한다.  
다만, ORM 기법으로 인한 쿼리 생성 구조로 인해서 애플리케이션 층에서 객체를 이용하여 페이징을 관리하게 된다.

## JPA 페이징 객체

**[ Pageable ]  
**  
- 페이징을 위한 정보 (페이지 번호, 페이지 크기, 정렬 정보..)을 담고 있는 인터페이스  
- 구현체로는 PageRequest가 사용  
ex) PageRequest.of( int page, int size, Sort sort)
**[ Page<T> ]  
**  
- 페이징된 데이터 + 페이징 정보를 담고 있는 객체  
( 데이터 + 전체페이지수 + 전체 데이터 수 + 현재 페이지 번호 + 다음 페이지 여부 등 ...)  
**- DB 쿼리 시, COUNT 쿼리를 진행하여 전체건수를 조회하므로 전체 페이지 계산이 가능  
(주의 : DB 쿼리시마다 COUNT를 진행하기에 무분별한 사용을 방지해야한다)**
**[ Slice<T> ]  
**  
- Page<T>와 유사하지만, 전체 데이터 쿼리를 (COUNT) 별도로 실행하지 않음  
- "다음페이지 여부" 제공  
( 무한 스크롤 기능을 구현하거나, 전체 건수가 필요없는 쿼리의 경우 사용하면 좋음 )

## JPA Pageable 사용방법

```java
pubic interface Repository extends JpaRepository<Test, Long>{
    
    // Pageable : 페이지 정보 , Page : 페이징된 데이터
    Page<Test> findByName(String name, Pageable pageable);
}

@Service
{
    int pageNumber = 0;
    int pageSize = 30;
    
     // PageRequest.of(현쟈페이지, 한 페이지 크기, 데이터 정렬 기준)
    PageRequest pageRequest = PageRequest.of(pageNumber, pageSize, Sort.by("name").descending();
    
    Page<Test> data = repository.findByName("testName", pageRequest);
}

{
    List<Test> content     = data.getContent();    // 실제 데이터
    long totalDataCnt       = data.getTotalElements(); // 전체 개수
    int totalPages            = data.getTotalPages(); // 전체 페이지 수
    boolean hasNext           = data.hasNext();       // 다음 페이지 존재 여부
    boolean isFirst           = data.isFirst();

}
```

## JPA 페이징 처리시 주의할점

1.  **Page<T> 사용 시 매번 Count 쿼리 발생으로 인한 성능 저하**
    *   Page<T>를 통해 페이징하면, 스프링 데이터 JPA에서 내부적으로 **두 번**의 쿼리를 실행
        1.  **실제 데이터 조회 쿼리**
        2.  **전체 건수 조회(count) 쿼리**
    *   따라서 **매 페이지 요청마다 count 쿼리가 수행**되므로, 테이블이 크거나 조인 관계가 복잡할수록 성능에 부담
    *   또한 OFFSET(“몇 번째부터 몇 개 가져오기”) 기반으로 동작하기 때문에, **현재 페이지 번호가 커질수록(OFFSET이 커질수록) 조회 성능**이 하락 가능성 존재    
        *   ( DB가 “OFFSET에 해당하는 로우들을 건너뛰기” 위해 내부적으로 많은 데이터를 스캔하는 과정이 필요하기 때문 )
2.  **N+1 문제와 결합 시, 예상치 못한 쿼리 폭증**
    *   JPA에서 연관 관계가 **지연 로딩(LAZY)로 설정**되어 있을 경우, 데이터를 조회하는 과정에서 **N+1 문제**가 발생 가능성 존재
    *   ( 예를 들어, 페이징으로 메인 엔티티 N개를 가져온 뒤, 각 엔티티의 연관 컬렉션(예: OneToMany)에 접근할 때마다 **추가 쿼리**가 발생하면, 쿼리 횟수가 기하급수적으로 증가)
    *   이때 count 쿼리까지 함께 여러 번 실행되거나, fetch join을 무작정 적용했을 때 **중복 데이터** 문제로 페이징이 꼬이는 상황이 발생
3.  **추가로 고려할 부분**
    *   **Slice<T> 활용**: 전체 건수가 **꼭 필요하지 않은** 무한 스크롤 UI 등에서는 Page<T> 대신 **Slice<T>**를 사용하면 **count 쿼리가 발생하지 않아** 성능상 이점이 있습니다.
    *   **커서 기반 페이징**: OFFSET이 지나치게 커질 때(수십만 건 이상) OFFSET 기반의 성능 저하가 심각하다면, **커서 기반 페이징** 기법을 고려
    *   **별도 count 쿼리 작성**: 만약 fetch join으로 메인 쿼리를 최적화하면서도 정확한 totalCount가 필요하다면, count 쿼리를 **직접 작성**해서(또는 countQuery 속성을 명시해서) “페치 조인을 제거한 버전”으로 수행하는 것이 안전
    *   **Batch Size / EntityGraph 등**: N+1 문제를 완화하기 위해 **BatchSize**(Hibernate 전용), **EntityGraph**(JPA 표준) 등을 활용하여 **필요한 연관 데이터를 한 번에 로딩**하는 전략도 고려 (다만, BatchSize별로 지정되기에 정확하지 않을 수 있다)

## 커서 기반 페이징

커서 기반 페이징의 경우, 커서를 기준으로 삼아서 해당 값보다 큰 값에 대해 정해진 크기만큼 가져오는 역할  
( 정렬 기준이 중요! )  
즉, '어디서부터 더 가져올지'라는 커서를 기준으로 다음 데이터를 조회하는 방식 ("무한 스크롤링에 적합한 기능")
[ 커서 기반 페이징의 장점 ]  
  
- 성능 : "마지막으로 조회한 커서 값보다 큰 데이터"만 가져오므로, 인덱스를 활용하여 조회하면 효율적인 조회가 가능  
- 정합성 : 해당 커서 이후 데이터를 받기 때문에, 중복이나 누락이 줄어듬  
(그래도, 트랜잭션 관리에 따라 봤던 데이터가 그대로 다시 있을 수도 있음)
[ 커서 기반 페이징의 특징 ]  
  
- 랜덤 액세스 불가 : OFFSET 기반의 경우, 시작 지점과 끝지점에 따라서 랜덤적으로 접근이 가능한데에 반해, 매 페이지마다 마지막 정보를 기준으로 다음 커서를 가져오므로 랜덤적인 접근이 불가능하다 (1페이지 -> 10페이지 검색 불가)  
- 정렬 기준이 확실 : 시간 기준 또는 기본 ID 기준으로 정렬하여 가져와야 데이터가 꼬이지않고 제대로 조회가 가능
```java
public class Service{
	
    public List<Test> getPage(Long cusorId){
        PageRequest pageRequest = PageRequest.of(0, Constants.PageSize, Sort.by(Sort.Direction.DESC, "id");
        
       return repository.findByCursorId(cursouId, pageRequst);
    }
}

public interface Repository extends JpaRepository<Test, Long>{
    
    @Query("SELECT t FROM Test t " +
           "WHERE t.id < :cursorId " +
           "ORDER BY t.id DESC")
    List<Test> findByCursorId(@Param("cursorId") Long cursourId, Pageable pageable);
}

/*
[ SQL 쿼리 ]
SELECT t.*
FROM Test t
WHERE t.id < :cursorId // 마지막 cursorId 기준
ORDER BY t.id DESC
LIMIT :pageSize;
*/
```

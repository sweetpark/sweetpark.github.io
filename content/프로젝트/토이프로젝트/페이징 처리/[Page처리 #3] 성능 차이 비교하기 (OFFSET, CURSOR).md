---
title: "[Page처리 #3] 성능 차이 비교하기 (OFFSET, CURSOR)"
tags: [토이프로젝트, 페이징 처리]
created: 2026-09-05
modified: 2026-09-05
---

# [Page처리 #3] 성능 차이 비교하기 (OFFSET, CURSOR)

## 공통 Total Count SQL

```java
@Query(value= "SELECT COUNT(*) "
            + "FROM Temperature t")
    Integer getTotCnt();
```

## 일반적인 OFFSET 계산하기

*   현재 페이지의 데이터 출력
*   Total Count를 이용하여 전체 페이지 수 출력

```java
//Service
public Map<String, Object> findBasicPage(int currentPage, int limit){
        Map<String ,Object> map = new HashMap<>();
        int offset = (currentPage - 1) * limit;

        map.put("content", temperatureRepository.findByPage(limit, offset));
        map.put("totCnt", temperatureRepository.getTotCnt());
        return map;
}

//Repository
@Query(value = "SELECT t.* "
            + "FROM temperature t "
            + "ORDER BY t.update_time DESC "
            + "LIMIT :limit OFFSET :offset",
            nativeQuery = true)
    List<Temperature> findByPage(@Param("limit") int limit,
                                 @Param("offset") int offset);
```

## 전체페이지 쿼리 인메모리

*   Total Count를 주기적으로 업데이트 (@Schedule)
*   현재페이지 데이터 출력

```java
//Service
public Map<String, Object> findPageToSchedule(int currentPage, int limit){
        Map<String, Object> map = new HashMap<>();
        int offset = (currentPage - 1) * limit;
        map.put("totCnt", TOTCNT);
        map.put("content", temperatureRepository.findByPage(limit,offset));

        return map;
    }

//5분당 전체 개수 업데이트
@Scheduled(fixedRate = 5 * 60 * 1000)
    public synchronized void ScheduleTotCnt(){
        TOTCNT = temperatureRepository.getTotCnt();
    }
```

## 범위 기반 페이징 조회

*   Total Count를 일정 범위마다 조회
*   현재페이지 데이터 출력

* 개선점)  
- 첫 시도에는 범위에 해당하는 Total Count를 계산했으나, 오히려 전체 Count를 세는것보다 오래걸리는 문제 발생  
( 데이터가 아주 많다면, 유용할수는 있으나 일반적으로 적은 데이터일경우 오히려 성능이 내려감 )
```java
/* 첫번째 코드 */

/*

public Map<String, Object> findPageToBatch(int currentPage, int limit, int batch){
        Map<String, Object> map = new HashMap();
        int offset = (currentPage - 1) * limit;
       if(currentPage*limit > batch){
            batch += limit * 10;
            map.put("RangePageCnt", temperatureRepository.rangePageCnt(batch, offset));
       }

        map.put("batch", batch);
        map.put("content", temperatureRepository.findByPage(limit, offset));
        return map;
    }

*/

//Service
public Map<String, Object> findPageToBatch(int currentPage, int limit, int batch){
        Map<String, Object> map = new HashMap();
        int offset = (currentPage - 1) * limit;

        if ((currentPage * limit) > batch) {
            batch += limit * 10;
            map.put("RangePageCnt", temperatureRepository.getTotCnt());            
        }

        map.put("batch", batch);
        map.put("content", temperatureRepository.findByPage(limit, offset));
        return map;
 }
 
 
 //Repository
 
 /* RangePageCnt
 @Query(value = "SELECT COUNT(*) "
            + "FROM ( "
            + "  SELECT t.* FROM temperature t "
            + "  ORDER BY t.update_time DESC "
            + "  LIMIT :limit OFFSET :offset "
            + ") AS page_result",
            nativeQuery = true)
    Integer rangePageCnt(@Param("limit") int limit,
                        @Param("offset") int offset);

*/
```

## 커서 기반 페이징

*   마지막 조회한 페이지, " 다음페이지 " 출력

```java
//Service
public Map<String, Object> findPageToCursor(Long lastIndex, int limit) {
        Map<String, Object> map = new HashMap<>();

        if (lastIndex == null) lastIndex = 0L;

        List<Temperature> result = temperatureRepository.cursorPage(lastIndex, limit);
        map.put("content", result);

        if (!result.isEmpty()) {
            Long nextCursor = result.get(result.size() - 1).getId();
            map.put("lastIndex", nextCursor);
        } else {
            map.put("lastIndex", null);
        }

        return map;
    }
    
//Repository
@Query(value = "SELECT * "
            +"FROM temperature t "
            +"WHERE  t.id > :lastIndex "
            +"ORDER BY t.id "
            +"LIMIT :limit",
            nativeQuery = true
        )
    List<Temperature> cursorPage(@Param("lastIndex") Long lastIndex,
                                 @Param("limit") Integer limit);
```

## 정리

[ 빠른 순서 ]  
   
**1. Cursor Paging**   
**2. In-Memory Count**  
**3. Basic**   
**4. Batch**   
  
[테스트]  
- 데이터양 : 10,000  
- 한 페이지 표시 개수 : 30  
- 조회 기준 : 10/20/30/40/50 페이지 조회  
(단, 커서기반 페이징의 경우 다음페이지 조회)
```java
//결과
✅ Basic Time: 77 ms
✅ Scheduled (Pre-counted) Time: 60 ms
▶ Page 1: lastIndex = 30, size = 30
▶ Page 2: lastIndex = 60, size = 30
▶ Page 3: lastIndex = 90, size = 30
▶ Page 4: lastIndex = 120, size = 30
▶ Page 5: lastIndex = 150, size = 30
✅ Cursor Time: 4 ms
✅ Batch Time: 129 ms
```
[테스트]  
여기서 측정한 데이터의 경우, 커서기반 페이징의 경우 다른 조건으로 조회해본 결과이므로 정확하게 성능이 측정된 것은 아니다.  
또한, 커서기반 페이징의 경우 랜덤접근이 가능하지 않으므로 논외로 계산해야한다고 본다.  
  
1. 범위 기반 페이징 사용시 주의  
- 데이터가 아주 많고, 일정량의 데이터만 표시해도 되는 경우에는 범위기반 SQL을 사용하여 일부 전체 페이지만 보여주고, 조회하는 것도 성능상 이점이 존재한다고 생각  
(다만, 데이터가 적거나 굳이 전체페이지를 나누지 않아도 될경우 비효율적일 수 있다)  
  
2. Scheduled Paging (인메모리) 사용시 주의  
- 업데이트 주기가 너무 빈번할경우, 오히려 리소스를 많이 잡아먹을 수 있으므로 주의해야하고 데이터의 정확성이 떨어지므로 유의하여 사용  
  
3. Baisc Paging 사용시 주의  
- OFFSET이 너무 커질수록 비효율적이라는 것은 인지  
- 일반적으로 전체페이지 조회도 같이 진행되므로 데이터가 많아질경우 캐싱 및 범위기반 페이징 고려  
  
4. Cursor 사용시 주의  
- 랜덤 접근 페이지 기능이 필요할경우, 사용하면 안됨  
- 무한 스크롤링 페이징 기능일 경우 유용

코드 정보

[https://github.com/sweetpark/lab](https://github.com/sweetpark/lab)

## 관련 문서

- [(토이프로젝트) [Page 처리 #1] OFFSET 기반 페이징 처리 이해하기]([Page%20처리%20%231]%20OFFSET%20기반%20페이징%20처리%20이해하기.md) — 여기서 성능을 비교한 OFFSET 기반 페이징의 원리를 다루는 시리즈 1편
- [(토이프로젝트) [Page 처리 #2] JPA 페이징 처리 이해하기 (+ OFFSET, Cursor 기반)]([Page%20처리%20%232]%20JPA%20페이징%20처리%20이해하기%20(+%20OFFSET,%20Cursor%20기반).md) — JPA Page/Slice 및 커서 기반 페이징 개념을 다루는 시리즈 2편

---
title: "자료구조"
tags: [학습, 코딩테스트, 알고리즘]
created: 2025년 9월 2일 오후 9:57
modified: 2026-09-05
---

# 자료구조

> [!NOTE]
> 개요
> 코딩테스트용 자료구조 레퍼런스: 배열(`List<Integer>[]` vs `List<List<Integer>>` vs `List<Integer[]>` 비교, `remove()` 오버로딩 함정), 해시테이블(HashMap 정렬·`computeIfAbsent`·List→int[] 변환), HashSet 등.

## 📌 개념

## 배열

- “List<Integer>[] array” VS  “List<List<Integer> array”
    
    # 📌 Java List 구조 정리 — `List<Integer>[]` vs `List<List<Integer>>` vs `List<Integer[]>`
    
    ---
    
    ## 1. `List<Integer>[]` — **리스트 배열 (그래프 인접리스트의 정석 구조)**
    
    ### ✔ 선언
    
    ```java
    List<Integer>[] graph = new ArrayList[n + 1];
    for (int i = 1; i <= n; i++) {
        graph[i] = new ArrayList<>();
    }
    
    ```
    
    ### ✔ 개념
    
    - 길이가 **고정된 배열**을 먼저 만들고
        
        각 칸에 **List<Integer> 객체를 하나씩 넣는 구조**
        
    - index 로 바로 접근 가능 (`graph[1]`, `graph[2]`…)
    
    ### ✔ 특징
    
    - 인덱스를 바로 사용할 수 있어 그래프에 적합
    - 인덱싱 속도가 빠름 (O(1))
    - n개의 노드가 “이미 정해져 있는” 문제에 매우 적합 (ex: 트리/그래프)
    
    ### ✔ 예시 구조
    
    ```
    graph
     ├─ [1] → [2, 4]
     ├─ [2] → [1]
     ├─ [3] → [4]
     └─ [4] → [1, 3]
    
    ```
    
    ---
    
    ## 2. `List<List<Integer>>` — **리스트 안에 리스트를 넣는 동적 2차원 구조**
    
    ### ✔ 선언
    
    ```java
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i <= n; i++) {
        graph.add(new ArrayList<>());
    }
    
    ```
    
    ### ✔ 개념
    
    - 크기가 **가변적인** 2차원 리스트
    - 필요한 만큼 `add()` 해야 index가 생김
    
    ### ✔ 특징
    
    - 초기에는 빈 리스트 → `graph.get(1)`은 초기화해주기 전에는 오류
    - 구조가 유연하지만 인덱스 오류가 나기 쉬움
    - n이 고정된 그래프에서는 배열 버전보다 불편
    
    ### ✔ 예시 구조
    
    ```
    graph (List)
     ├─ [0] → List<Integer>
     ├─ [1] → List<Integer>
     └─ [2] → List<Integer>
    
    ```
    
    ---
    
    ## 3. `List<Integer[]>` — **정수 배열(Integer[])을 원소로 가지는 리스트**
    
    ### ✔ 선언
    
    ```java
    List<Integer[]> list = new ArrayList<>();
    list.add(new Integer[]{1, 3});
    list.add(new Integer[]{2, 4});
    
    ```
    
    ### ✔ 개념
    
    - List 내부 요소가 `int[]` 또는 `Integer[]`
    - `(a, b)` 형태의 쌍(튜플)을 저장하기에 적합
        
        → 예: wires, 좌표 목록, 간선 리스트
        
    
    ### ✔ 특징
    
    - 간선 목록처럼 “쌍”을 보내야 할 때 사용
    - 하지만 **그래프 탐색용 인접 리스트로는 사용 불가**
    
    ### ✔ 예시 구조
    
    ```
    list
     ├─ [0] → [1, 3]
     ├─ [1] → [2, 4]
     └─ [2] → [3, 5]
    
    ```
    
    ---
    
    ## 4. remove() 오버로딩 주의점
    
    ### ✔ 문제 상황
    
    ```java
    graph[a].remove(b);    // 이건 잘못됨!
    
    ```
    
    → remove(int index) 버전이 호출됨
    
    → 우리가 원하는 “값 b 삭제”가 아니라 “index b 삭제”가 됨
    
    ### ✔ 올바른 코드
    
    ```java
    graph[a].remove(Integer.valueOf(b));
    graph[b].remove(Integer.valueOf(a));
    
    ```
    
    ### ✔ 이유
    
    `remove()` 메서드가 인덱스/객체 삭제 두 가지 버전이 있기 때문.
    
    ---
    
    ## 5. 비교 요약표
    
    | 형태 | 구조 | 목적 | 장점 | 단점 |
    | --- | --- | --- | --- | --- |
    | `List<Integer>[]` | 리스트의 배열 | 인접 리스트 | 빠름, index 접근 쉬움 | 배열 크기 고정 |
    | `List<List<Integer>>` | 리스트 안의 리스트 | 동적 2D 리스트 | 유연함 | 초기화 필요, 인덱스 실수 잦음 |
    | `List<Integer[]>` | 배열을 요소로 가지는 List | 튜플/간선 리스트 | (a,b) 형태 저장 쉬움 | 그래프 탐색에는 부적합 |
    
    ---
    
    ## 6. 어떤 상황에서 무엇을 써야 하나?
    
    ### ✔ 그래프/트리(전력망, BFS/DFS 문제)
    
    → **무조건 `List<Integer>[]`가 가장 자연스럽고 안전함**
    
    ### ✔ 쌍 자료 (간선 목록, 좌표 리스트, 범위 리스트)
    
    → `List<Integer[]>`
    
    ### ✔ 크기가 계속 변하는 테이블/행렬 구조
    
    → `List<List<Integer>>`
    
    ```java
    
    /** 서로다른 배열 생성 방법(구조에 따라 다름)  **/
    
    // int가 안에 들어갈 요소
    // [] 외부 배열
    int[] array2 = new int[n+1];
    
    /*
    
    [index]           [value]
      [0]      >    {0,1,2,3,4}
      [1]      >      {2,3} 
    
    */
    
    // List<Integer> 가 안에 들어갈 요소
    // [] 외부가 배열
    
    List<Integer>[] array = new ArrayList[n+1];
    
    /*
    
    [index]        [value]
      [0]    >      [0,1]
      [1]    >      [2,3,4]
      
    */
    // 동적배열 + 동적배열 ==> 2차원 배열
    List<List<Interger>> array = new ArrayList<>();
    
    ```
    

## 해시테이블

- HashMap 기본
    - HashMap
        - 중복이 가능하다
        - 전체 찾기 > Map.Entry<String, Object> entry
        - key로 탐색이 가능하다
    
    ```java
    import java.util.Map
    
    public static void main(String []args){
    	Map<String, Object> map = new HashMap<>();
    	
    	// 삽입
    	map.put("key1", "value1");
    	
    	// 추출
    	map.get("key1");
    	map.getOrDefault("key1", "defaultValue");
    	
    	// 삭제
    	map.remove("keyy1");
    	
    	// 전체 찾기
    	for(Map.Entry<String, Object> entry : map.entrySet()){
    	   // key
    	   entry.getKey();
    	   
    	   // value
    	   entry.getValue();
    	}
    	
    	// key만 찾기
    	for(String key : map.keySet()){//...}
      	
    }
    ```
    
- HashMap 정렬방식
    
    ## 1. 정렬 방식 (`songs.sort(new Comparator ...)`)
    
    ```java
    songs.sort((s1, s2) -> {
        if (s1.plays == s2.plays) {
            return s1.index - s2.index;   // 인덱스 오름차순
        } else {
            return s2.plays - s1.plays;   // 재생 수 내림차순
        }
    });
    
    ```
    
    - **Comparator**: 두 객체를 비교해 순서를 결정하는 함수형 인터페이스
    - 반환 규칙:
        - 음수 → s1이 먼저
        - 양수 → s2가 먼저
        - 0 → 순서 동일
    - 위 코드의 의미:
        - 1차 기준: `plays` (재생 수) 내림차순
        - 2차 기준: `index` (고유 번호) 오름차순
    - 가독성 높인 버전:
    
    ```java
    songs.sort(
        Comparator.comparingInt((Song s) -> s.plays).reversed()
                  .thenComparingInt(s -> s.index)
    );
    
    ```
    
    → `reversed()` : 내림차순
    
    → `thenComparingInt()` : 동점일 때 2차 키로 정렬
    
- Collection value에 추가하기 ( Map<String, List<Song>> //computeIfAbsent() )
    
    ## 2. `computeIfAbsent()`와 `k`의 의미
    
    ```java
    songMap.computeIfAbsent(genres[i], k -> new ArrayList<>())
           .add(new Song(genres[i], plays[i], i));
    
    ```
    
    - **동작**
        - `genres[i]` 키가 없으면 → `new ArrayList<>()` 생성 후 put
        - 있으면 → 기존 리스트 반환
    - **장점**
        1. `containsKey` + `put` + `get` 과정을 한 줄로 처리
        2. 값이 없을 때만 지연(lazy) 생성
        3. `null` 체크 실수 방지
    - **`k`의 의미**
        - 함수 시그니처 `(K → V)` 때문에 필요한 파라미터
        - 여기서는 키(`genres[i]`)를 받지만, 실제 로직에서는 사용하지 않음
        - 키에 따라 다른 초기값을 생성해야 할 경우 활용 가능
    
- Collections.List 를 기본 배열로 변경 ( List > int[] )
    
    ## 3. `List<Integer>` → `int[]` 변환 (Stream 활용)
    
    ```java
    int[] arr = result.stream()
                      .mapToInt(Integer::intValue)
                      .toArray();
    
    ```
    
    - `result` = `List<Integer>` (래퍼 타입)
    - 반환값 요구사항 = `int[]` (원시 타입 배열)
    - 문제: `List#toArray()`는 `Integer[]`만 만들 수 있고, `int[]`는 불가
    - 해결 방법:
        1. **Stream 방식**
            - `.mapToInt(Integer::intValue)` → 언박싱
            - `.toArray()` → `int[]` 생성
        2. **수동 루프 방식**
            
            ```java
            int[] arr = new int[result.size()];
            for (int i = 0; i < result.size(); i++) {
                arr[i] = result.get(i); // 자동 언박싱
            }
            
            ```
            
    - 두 방식 모두 O(n) 시간 복잡도, 성능 차이는 미미
    - **간결성** → Stream, **명시적 제어** → For 루프
- HashSet
    - HashSet
        - 중복이 불가능
        - 배열 (Array)  > set으로 add()하면 중복제거 해서 삽입됨
    
    ```java
    Set<Integer> set = new HashSet<>();
    for(Integer num : nums){
        set.add(num);
    }
    ```
    

## 연결리스트

## 스택

## 큐

## 힙

## 트리&그래프

---
## 🔗 참고
- [(Algorithm) 시간복잡도 - 핵심 개념 및 특징 정리]([Algorithm]%20시간복잡도%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 알고리즘 - 핵심 개념 및 특징 정리]([Algorithm]%20알고리즘%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 람다 + 스트림 (비교정렬, filter, toArray()) - 핵심 개념 및 특징 정리]([Algorithm]%20람다%20+%20스트림%20%28비교정렬,%20filter,%20toArray%28%29%29%20-%20핵심%20개념%20및%20특징%20정리.md)

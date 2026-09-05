---
title: "시간복잡도"
tags: [학습, 코딩테스트, 알고리즘]
created: 2025년 10월 10일 오후 12:00
modified: 2026-09-05
---

# 시간복잡도

> [!NOTE]
> 개요
> 코딩테스트에서 알고리즘을 고르는 기준: N의 크기로 시간복잡도를 예측하고(1초 ≈ 1억 연산), 표기법별 연산 가능량과 자료구조 선택 팁을 표로 정리한 레퍼런스.

## 📌 개념

## 실전 풀이 방법

1. N의크기를 확인
2. 시간 복잡도를 예측 > 정렬 및 알고리즘 방식 선정

## 시간제한에 따른 CPU 계산

- 시간제한 : 1초 == 1억번 연산

## 시간복잡도에 따른 예시

| 표기법 | 설명 | 코딩테스트 예시 | Java 코드 예시 |
| --- | --- | --- | --- |
| **O(1)** | 상수 시간 (입력 크기와 무관) | 배열 인덱스 접근, 해시 조회, push/pop | `java int[] arr = {3,5,7}; int x = arr[1]; // 배열 접근 O(1) Map<String, Integer> map = new HashMap<>(); map.put("a", 1); int v = map.get("a"); // 조회 O(1)` |
| **O(log N)** | 로그 시간 (데이터가 반씩 줄어듦) | 이진탐색, TreeMap, PriorityQueue 삽입/삭제 | `java int[] arr = {1,3,5,7,9}; int idx = Arrays.binarySearch(arr, 7); // 이진탐색 O(logN) PriorityQueue<Integer> pq = new PriorityQueue<>(); pq.add(3); pq.poll(); // 힙 연산 O(logN)` |
| **O(N)** | 선형 시간 (입력 크기에 비례) | 단일 for문 순회, 합계 계산, 배열 탐색 | `java int sum = 0; for (int x : arr) sum += x; // 순회 O(N) List<Integer> list = Arrays.asList(1,2,3,4); if (list.contains(3)) {...} // 탐색 O(N)` |
| **O(N log N)** | 선형 로그 시간 (정렬 기반 연산) | 퀵정렬, 합병정렬, 정렬 후 탐색 | `java int[] arr = {5,2,9,1}; Arrays.sort(arr); // 퀵정렬 O(NlogN) List<Integer> list = Arrays.asList(1,3,5,7,9); Collections.sort(list); // TimSort O(NlogN)` |
| **O(N²)** | 이차 시간 (이중 반복, 완전탐색) | 버블정렬, 브루트포스 탐색, 그래프 인접행렬 탐색 | `java for (int i = 0; i < n; i++) { for (int j = 0; j < n; j++) { if (arr[i] == arr[j]) count++; } } // 이중 for문 O(N²)` |
| **O(2^N)** | 지수 시간 (모든 부분집합/경로 탐색) | 부분집합, 조합, 재귀 DFS | `java void subset(int idx, int[] arr, List<Integer> list){ if (idx == arr.length){ System.out.println(list); return; } subset(idx+1, arr, list); list.add(arr[idx]); subset(idx+1, arr, list); list.remove(list.size()-1); } // 2^N 부분집합` |
| **O(N!)** | 팩토리얼 시간 (모든 순열 탐색) | 순열 생성, TSP 문제 | `java void permute(int depth, int[] arr, boolean[] used, List<Integer> result){ if (depth == arr.length){ System.out.println(result); return; } for (int i=0; i<arr.length; i++){ if(!used[i]){ used[i]=true; result.add(arr[i]); permute(depth+1, arr, used, result); result.remove(result.size()-1); used[i]=false; } } } // N! 순열 생성` |

## 시간복잡도별 연산 가능 횟수

| 시간 복잡도 | 약 1초 기준 연산량 | 실전 예시 | Java 예시 코드 |
| --- | --- | --- | --- |
| **O(1)** | 거의 무제한 (상수시간) | 배열 인덱스 접근, 해시 조회 | `java int[] arr = {1,2,3}; int x = arr[1]; // O(1)` |
| **O(log N)** | 약 3천만 (N≈10⁹까지 가능) | 이진탐색, 힙 연산 | `java int[] arr = {1,3,5,7,9}; int idx = Arrays.binarySearch(arr, 7);` |
| **O(N)** | 약 **1억 (10⁸)** | 단일 for문, 선형탐색 | `java for (int i = 0; i < n; i++) sum += arr[i];` |
| **O(N log N)** | 약 **5백만 (5×10⁶)** | 정렬(퀵/합병), 우선순위큐 | `java Arrays.sort(arr); // O(N log N)` |
| **O(N²)** | 약 **1만 (10⁴)** | 이중 for문 완전탐색 | `java for(int i=0;i<n;i++) for(int j=0;j<n;j++) {...}` |
| **O(N³)** | 약 **500** | 삼중 루프, 플로이드-워셜 | `java for(int i=0;i<n;i++) for(int j=0;j<n;j++) for(int k=0;k<n;k++) {...}` |
| **O(2^N)** | 약 **20** | 부분집합, 백트래킹 DFS | `java void dfs(int depth){ if(depth==N)return; dfs(depth+1); dfs(depth+1); }` |
| **O(N!)** | 약 **10** | 순열 전수 탐색 | `java void permute(int depth){ if(depth==N)return; for(int i=0;i<N;i++) permute(depth+1); }` |

## N의 크기에 따른 전략 (1초기준)

| 입력 크기 N | 제한 시간 1초 기준 가능한 복잡도 |
| --- | --- |
| N ≤ 10 | O(N!) 가능 |
| N ≤ 20 | O(2^N) 가능 |
| N ≤ 100 | O(N³) 가능 |
| N ≤ 1,000 | O(N²) 가능 |
| N ≤ 100,000 | O(N log N) 가능 |
| N ≤ 10⁷  (천만) | O(N) 가능 |
| N ≥ 10⁸ (억) | O(1) ~ O(log N)만 가능 |

## 실전에서 자주 만나는 시간 복잡도

| 연산 또는 함수 | 시간 복잡도 | 설명 |
| --- | --- | --- |
| for loop | O(N) | 단순 순회 |
| 이중 for loop | O(N^2) | 완전 탐색 |
| array.contains() | O(N) | 배열 탐색 |
| set.contains() | O(1) | 해시 기반 탐색 |
| map[key] | O(1) | 키-값 조회 |
| sort() | O(NlogN) | 퀵정렬 |
| binary search | O(logN) | 정렬 배열 탐색 |
| heap.pop() | O(logN) | 우선순위 큐 |
| queue.pop() / stack.pop() | O(1) | 선형 자료구조 |

## 코딩테스트 실전 TIP

| 상황 | 느린 코드 / 자료구조 | 시간 복잡도 | 대체 방법 / 자료구조 | 개선된 복잡도 | 예시 코드 |
| --- | --- | --- | --- | --- | --- |
| ✅ 중복 탐색이 많은 경우 | `List.contains(x)` | O(N) | `HashSet.contains(x)` | O(1) | `if (set.contains(x)) {...}` |
| ✅ 키-값 빠른 조회 | `List<Map.Entry>` 반복문 탐색 | O(N) | `HashMap` | O(1) | `map.get(key)` |
| ✅ 자동 정렬 필요 | `Collections.sort(list)` 매번 호출 | O(N log N) | `TreeSet` / `TreeMap` | O(log N) (삽입 시 정렬 유지) | `set.add(x)` |
| ✅ 빈도 수 세기 | 직접 카운트 루프 | O(N²) | `HashMap.getOrDefault()` | O(N) | `map.put(x, map.getOrDefault(x, 0) + 1)` |
| ✅ 최솟값 / 최댓값 반복 추출 | `Collections.min()` 반복 호출 | O(N²) | `PriorityQueue` | O(N log N) | `pq.add(x); pq.poll();` |
| ✅ 중복 제거 + 정렬 | `List` 후 `sort()` + `distinct()` | O(N log N) | `TreeSet` | O(N log N) | `new TreeSet<>(list)` |
| ✅ BFS / DFS 탐색 | `List`를 큐처럼 사용 | O(N²) | `ArrayDeque` | O(N) | `Deque<Integer> q = new ArrayDeque<>();` |
| ✅ 문자열 반복 연결 | `String += "abc"` | O(N²) | `StringBuilder.append()` | O(N) | `sb.append("abc");` |
| ✅ 배열 복사 | 직접 for문 복사 | O(N) | `Arrays.copyOf()` | O(N) (더 안전) | `int[] copy = Arrays.copyOf(arr, arr.length);` |
| ✅ 중복 없는 순서 유지 | `ArrayList` + 중복 체크 | O(N²) | `LinkedHashSet` | O(N) | `new LinkedHashSet<>(list)` |
| ✅ 정렬 후 이진탐색 | `List.indexOf(x)` | O(N) | `Collections.binarySearch()` | O(log N) | `int idx = Collections.binarySearch(list, x);` |
| ✅ 고정 크기 큐 / 스택 | `LinkedList` | O(1) (but 느림) | `ArrayDeque` | O(1) | `Deque<Integer> dq = new ArrayDeque<>();` |
| ✅ 중복 허용 정렬 구조 | `TreeSet`은 중복 불가 | - | `PriorityQueue` | O(log N) | `pq.offer(x);` |
| ✅ 순열/조합 생성 | 직접 구현 | O(N!) | `Collections.permutations()` 없음 → Stream/백트래킹 최적화 | - | 직접 DFS 구현 |
| ✅ 입력 속도 개선 | `Scanner` | 느림 | `BufferedReader` + `StringTokenizer` | 빠름 | `BufferedReader br = new BufferedReader(new InputStreamReader(System.in));` |
| ✅ 출력 속도 개선 | `System.out.println()` | 느림 | `StringBuilder` + `System.out.print(sb)` | 빠름 |  |

---
## 🔗 참고
- [(Algorithm) 자료구조 - 핵심 개념 및 특징 정리]([Algorithm]%20자료구조%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 알고리즘 - 핵심 개념 및 특징 정리]([Algorithm]%20알고리즘%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 코딩테스트 개요 - 핵심 개념 및 특징 정리]([Algorithm]%20코딩테스트%20개요%20-%20핵심%20개념%20및%20특징%20정리.md)

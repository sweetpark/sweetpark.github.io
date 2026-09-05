---
title: "커리큘럼"
tags: [학습, 코딩테스트, 알고리즘, 커리큘럼]
created: 2026년 2월 4일 오전 10:05
modified: 2026-09-05
---

# 커리큘럼

> [!NOTE]
> 개요
> 코딩테스트 대비 12주 학습 로드맵. 주차별 주제·학습 내용·Java 활용 팁·백준 연습 문제를 한 표로 정리했다.

## 📌 12주 커리큘럼

| 단계 | 주제 | 학습 내용 | Java 활용 팁 | 연습 문제 예시 |
| --- | --- | --- | --- | --- |
| 1주차 | 시간 복잡도 & Java I/O 최적화 | - 알고리즘 성능 지표: 시간 복잡도·공간 복잡도(Big-O)<br>- 자바 표준 입출력: `BufferedReader`, `BufferedWriter`, `StringTokenizer` 활용법 | - `BufferedReader` + `StringBuilder`로 입출력 최소화<br>- `System.nanoTime()`으로 실행 시간 측정 | 백준 2557, 2438 |
| 2주차 | 자료구조 기초: 배열·문자열 | - 배열 탐색 및 조작<br>- `String`, `StringBuilder` 차이<br>- 부분 문자열 검색 (슬라이딩 윈도우 기초) | - `StringBuilder.reverse()`, `toCharArray()` 활용 | 백준 1316, 1676 |
| 3주차 | 선형 자료구조: 스택·큐·덱 | - `Stack`, `Queue`(LinkedList), `Deque`(ArrayDeque) 사용법<br>- 후위표기식·괄호 문자열 검사 | - `ArrayDeque`가 가장 빠른 구현체<br>- 제네릭으로 타입 안정성 확보 | 백준 9012, 10828 |
| 4주차 | 정렬 알고리즘 & 이진 탐색 | - 기본 정렬: 선택·버블·삽입 정렬<br>- 고급 정렬: 병합(Merge), 퀵(Quick) 정렬<br>- 이진 탐색(Binary Search) 원리 | - `Arrays.sort()`의 내부 구현 이해<br>- 직접 구현한 이진 탐색과 `Arrays.binarySearch()` 비교 | 백준 1920, 2751 |
| 5주차 | 투 포인터 & 슬라이딩 윈도우 | - 투 포인터: 정렬된 배열에서 합 찾기, 부분합<br>- 슬라이딩 윈도우: 고정·가변 길이 합 계산 | - 포인터 대신 인덱스 2개 관리<br>- 윈도우 합을 `long`으로 관리 | 백준 2003, 1806 |
| 6주차 | 해시 & 맵(HashMap/HashSet) | - 해시 테이블 원리(충돌 해결)<br>- `HashMap`, `HashSet`, `LinkedHashMap` 활용 | - `Map.getOrDefault()`, `computeIfAbsent()` 활용 | 백준 1764, 1620 |
| 7주차 | 그리디 알고리즘 | - 그리디 설계 기법: 탐욕 선택 특성<br>- 대표 문제 패턴: 활동 선택, 배낭, 동전 거스름돈 | - 우선순위 큐(`PriorityQueue`)를 그리디에 응용 | 백준 11047, 1931 |
| 8주차 | 분할 정복 & 재귀 | - 분할 정복 패러다임<br>- 재귀 함수 설계 시 기저 사례 설정<br>- 병합 정렬, 퀵 정렬 재귀 구현 | - 재귀 깊이 주의(스택 오버플로우 방지)<br>- `Tail Recursion` 최적화 이해 | 백준 11729, 1992 |
| 9주차 | 동적 계획법(DP) 기초 | - 1차원 DP: 피보나치, 계단 오르기, 0-1 배낭 문제<br>- 메모이제이션 vs 태뷸레이션 | - `int[] dp` 초기화와 `Arrays.fill()` 활용 | 백준 2193, 12865 |
| 10주차 | 동적 계획법(DP) 심화 | - 2차원 DP: 최장 공통 부분 수열(LCS), 편집 거리<br>- 최장 증가 부분 수열(LIS) | - `List<Integer> lis` + 이진 탐색 응용 | 백준 9251, 11053 |
| 11주차 | 그래프 기초: BFS·DFS | - 인접리스트 vs 인접행렬<br>- 너비 우선 탐색(BFS), 깊이 우선 탐색(DFS) 구현 | - `boolean[] visited`로 순환 방지<br>- `Queue` vs `Stack` 활용 | 백준 2178, 2606 |
| 12주차 | 그래프 심화: 최단경로·MST | - 가중치 그래프 최단경로: Dijkstra, Bellman-Ford<br>- 최소 신장 트리(MST): Prim, Kruskal + Union-Find | - `PriorityQueue<Node>`로 Dijkstra 최적화<br>- `union-find` 배열 최적화 | 백준 1753, 1197 |

---
## 🔗 참고
- [(Algorithm) 코딩테스트 개요 - 핵심 개념 및 특징 정리]([Algorithm]%20코딩테스트%20개요%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 시간복잡도 - 핵심 개념 및 특징 정리]([Algorithm]%20시간복잡도%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 알고리즘 - 핵심 개념 및 특징 정리]([Algorithm]%20알고리즘%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 자료구조 - 핵심 개념 및 특징 정리]([Algorithm]%20자료구조%20-%20핵심%20개념%20및%20특징%20정리.md)

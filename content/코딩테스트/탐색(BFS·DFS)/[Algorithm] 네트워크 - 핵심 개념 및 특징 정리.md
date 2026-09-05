---
title: "네트워크"
tags: [학습, 코딩테스트, BFSDFS, 프로그래머스, 알고리즘, DFS, 연결요소]
created: 2026-05-07
modified: 2026-09-05
---

# 네트워크

> [!NOTE]
> 프로그래머스 · DFS/BFS(연결 요소 Connected Components)
> "몇 개의 무리가 존재하는가?"를 묻는 그래프 탐색의 만능 틀. 전체 노드를 돌며 미방문 노드를 발견할 때마다 `count++` 하고, 연결된 모든 노드를 방문 처리한다.

## 📝 문제
- `n`개의 컴퓨터와 연결 관계(`computers[i][j] == 1`)가 주어질 때, 서로 연결된 **네트워크의 개수**를 구한다.

## 💡 접근
**핵심 아이디어 = "발견과 전파"**:
- 전체 노드를 순회하며 아직 방문(`visited`)하지 않은 노드를 발견하면 '새로운 덩어리'로 취급(`count++`).
- 즉시 DFS/BFS를 보내 그와 **연결된 모든 곳을 방문 처리**.

**언제 쓰나(키워드)**: "네트워크/섬/덩어리/그룹의 개수를 구하시오", "안전 구역의 개수".

## ⌨️ 풀이

```java
// 1. 상태 관리 변수
int count = 0;      // 덩어리의 개수
boolean[] visited;  // 방문 여부 기록장

public int solution(int n, int[][] computers) {
    visited = new boolean[n]; // 초기화 (모두 false)

    // 2. 전체 탐색 루프 (발견 파트)
    for (int i = 0; i < n; i++) {
        // 아직 방문하지 않은 노드를 발견 → 새로운 네트워크
        if (!visited[i]) {
            count++;
            dfs(i, n, visited, computers); // 연결된 모든 노드 방문 처리
        }
    }
    return count;
}

// 3. 탐색 함수 (전파 파트)
private void dfs(int i, int n, boolean[] visited, int[][] computers) {
    visited[i] = true; // 현재 노드 방문 처리

    for (int j = 0; j < n; j++) {
        // 자기 자신이 아니고, 미방문이며, 연결(값 1)되어 있으면 깊이 탐색
        if (i != j && !visited[j] && computers[i][j] == 1) {
            dfs(j, n, visited, computers);
        }
    }
}
```

## ⏱️ 복잡도
- **시간**: `O(n²)` — 인접 행렬을 사용하므로 각 노드에서 `n`개를 확인.
- **공간**: `O(n)` — 방문 배열 + 재귀 스택.

## 📎 이 패턴이 변형되는 3가지 케이스
- **변형 1 — 2차원 맵(Grid)이 주어질 때(섬의 개수 등)**: `boolean[] visited` → `boolean[][] visited`. DFS 내부 for문이 `0~n` 대신 상하좌우 4방향(`dx`, `dy`) 탐색으로 바뀐다.
- **변형 2 — "가장 큰 네트워크의 크기"를 물을 때**: `count++`를 밖에서 하지 말고, DFS가 방문한 노드 수를 `return`하도록 고쳐 최댓값을 갱신.
- **변형 3 — 연결선에 비용/거리가 있을 때**: DFS 대신 BFS(큐) 또는 다익스트라로 넘어가야 한다(DFS는 최단 거리를 보장하지 않음).

---
## 🔗 관련
- [(Algorithm) 무인도여행 - 핵심 개념 및 특징 정리]([Algorithm]%20무인도여행%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 타겟넘버 - 핵심 개념 및 특징 정리]([Algorithm]%20타겟넘버%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 경주로건설 - 핵심 개념 및 특징 정리]([Algorithm]%20경주로건설%20-%20핵심%20개념%20및%20특징%20정리.md) — BFS/DFS 그래프 탐색 계열

---
title: "무인도여행"
tags: [학습, 코딩테스트, BFSDFS, 프로그래머스, 알고리즘, BFS, 방향벡터]
created: 2026-05-25
modified: 2026-09-05
---

# 무인도여행

> [!NOTE]
> 프로그래머스 · BFS(2차원 격자 연결 영역)
> 격자에서 상하좌우로 연결된 땅(숫자) 덩어리를 찾아 각 무인도의 식량 총합을 오름차순 반환. 방향 배열(`dr`, `dc`)로 4방향 탐색을 `for`문 하나로 압축하는 것이 깔끔하다.

## 📝 문제
- 문자열 배열 `maps`에서 `X`(바다)가 아닌 숫자는 땅(식량). 상하좌우로 이어진 땅이 하나의 무인도.
- 각 무인도의 식량 총합을 **오름차순**으로 반환(무인도 없으면 `[-1]`).

## 💡 접근
이중 for문으로 모든 칸을 순회하다가 미방문 땅을 만나면 BFS를 시작해 연결된 섬 전체의 식량을 합산한다.

## ⌨️ 풀이

```java
import java.util.*;

public class 무인도여행 {

    public int[] solution(String[] maps) {
        List<Integer> resultList = new ArrayList<>();
        int rows = maps.length;
        int cols = maps[0].length();

        // 1. 전체 맵 상태 공유를 위한 방문 배열 초기화
        boolean[][] visited = new boolean[rows][cols];

        // 2. 모든 칸 순회
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                // 바다가 아니고 미방문인 땅에서만 새 BFS 시작
                if (maps[i].charAt(j) != 'X' && !visited[i][j]) {
                    int resultCount = bfs(i, j, maps, visited);
                    resultList.add(resultCount);
                }
            }
        }

        // 3. 무인도가 없으면 -1
        if (resultList.isEmpty()) {
            return new int[]{-1};
        }

        // 4. 오름차순 정렬 후 반환
        return resultList.stream().sorted().mapToInt(i -> i).toArray();
    }

    private int bfs(int startRow, int startCol, String[] maps, boolean[][] visited) {
        Queue<int[]> queue = new ArrayDeque<>();
        queue.offer(new int[]{startRow, startCol});
        visited[startRow][startCol] = true; // 시작점 방문 처리

        int count = 0;
        int rows = maps.length;
        int cols = maps[0].length();

        // 상하좌우 방향 배열 (위, 아래, 왼쪽, 오른쪽)
        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        while (!queue.isEmpty()) {
            int[] position = queue.poll();
            int row = position[0];
            int col = position[1];

            // 꺼낼 때 식량 누적 (중복 연산 방지)
            count += maps[row].charAt(col) - '0';

            for (int i = 0; i < 4; i++) {
                int nextRow = row + dr[i];
                int nextCol = col + dc[i];

                // ① 맵 경계 내부인지
                if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
                    // ② 바다가 아니고 ③ 미방문이면
                    if (maps[nextRow].charAt(nextCol) != 'X' && !visited[nextRow][nextCol]) {
                        visited[nextRow][nextCol] = true; // 큐에 넣기 전에 방문 처리
                        queue.offer(new int[]{nextRow, nextCol});
                    }
                }
            }
        }
        return count;
    }
}
```

## ⏱️ 복잡도
- **시간**: `O(N × M)` — 지도 세로 `N`, 가로 `M`을 순회하며 각 칸은 최대 한 번만 방문.
- **공간**: `O(N × M)` — 방문 배열 + 최악의 경우 큐에 담기는 좌표 수.

## 📎 오답 노트 (BFS 4대 함정)
1. **큐에는 '값'이 아니라 '좌표'를**: 맵 값만 넣으면 위치 추적이 안 돼 상하좌우 탐색 불가. → `Queue<int[]>`에 `[row, col]` 저장.
2. **기준점은 '방금 꺼낸 좌표'**: 매개변수 시작점만 기준으로 하면 제자리걸음으로 무한 루프. → `queue.poll()`로 꺼낸 `row/col` 기준으로 이웃 계산.
3. **`visited`는 전체 탐색 주기 동안 유지**: `bfs` 내부에서 방문 배열을 만들면 섬마다 초기화돼 중복 집계. → `solution`에서 한 번만 만들어 파라미터로 공유.
4. **큐에 넣기 '전'에 검사(메모리 최적화)**: ① 경계 안 ② 바다 아님 ③ 미방문을 모두 만족할 때만 큐에 넣고, 넣는 동시에 방문 처리해 중복 삽입을 막는다.

---
## 🔗 관련
- [(Algorithm) 네트워크 - 핵심 개념 및 특징 정리]([Algorithm]%20네트워크%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 타겟넘버 - 핵심 개념 및 특징 정리]([Algorithm]%20타겟넘버%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 경주로건설 - 핵심 개념 및 특징 정리]([Algorithm]%20경주로건설%20-%20핵심%20개념%20및%20특징%20정리.md) — BFS/DFS 격자 탐색 계열

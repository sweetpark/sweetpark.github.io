---
title: "[BFS] 너비 우선 탐색"
tags: [알고리즘 & 자료구조, 알고리즘]
created: 2026-09-05
modified: 2026-09-05
---

# [BFS] 너비 우선 탐색

## 너비우선탐색(BFS) 이란?

그래프를 완전탐색하는 방법 중 하나로,  
시작 노드에서 시작해 가장 가까운 노드를 먼저 탐색하면서 탐색하는 알고리즘  
FIFO 구조로 탐색을 하며, 목표 노드에 도착하는 경로가 여러개 일 경우 최단경로를 보장한다.  
시간복잡도 O(노드 수 + 에지 수)로 이루어져 있다.

## 너비우선탐색의 핵심이론

DFS와 마찬가지로 방문한 노드의 경우 체크하는 배열이 필요.  
또한, 인접 리스트를 구현하여 에지로 구성되어있는 배열을 구현해야함  
DFS와 다른점이 있다면, 스택으로 제거하는 것이 아닌 큐의 형태로 먼저 들어온 순서부터 제거하며 삽입 및 삭제를 진행.

*   과정
    1.  첫번째 노드부터 큐에 삽입하여, 큐를 시작하고 인접해 있는 노드를 차례대로 큐에 삽입한다
    2.  큐에 먼저 들어간 노드부터 삭제하며, 인접한 노드들이 있다면 차례대로 큐에 삽입
    3.  큐에 맨 앞에있는 노드를 삭제하며, 인접한 노드들이 있다면 차례대로 큐에 삽입
    4.  위의 1~3을 반복하며, 큐에 남은 수가 없을 때까지 진행
    5.  최단경로의 경우의 수를 구현할 수 있음

## 너비 우선 탐색 구현(BFS)

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.StringTokenizer;
import java.util.Queue;

public class App {
    public static void main(String[] args) throws Exception {
        BufferedReader bf = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(bf.readLine());
        

        int nodeSize = Integer.parseInt(st.nextToken())+1;
        int edgeSize = Integer.parseInt(st.nextToken());
        int firstIndex = Integer.parseInt(st.nextToken());

        boolean [] visited = new boolean[nodeSize];
        ArrayList<Integer> [] arr = new ArrayList[nodeSize]; // value 한개당 ArrayList
        for (int i =1; i <nodeSize; i++){
            arr[i] = new ArrayList<>();
            visited[i] = false;
        }

        for(int i =0; i< edgeSize; i++){
            st = new StringTokenizer(bf.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            arr[a].add(b);
            arr[b].add(a);
        }
        bfs(firstIndex, arr, visited);

    }

    private static void bfs(int index, ArrayList<Integer>[] arr, boolean[] visited){
        Queue<Integer> queue = new LinkedList<>();
        queue.add(index);
        visited[index] = true;
        

        while(!queue.isEmpty()){
            int removeIndex = queue.poll();
            System.out.println(removeIndex + " ");
            for (int i : arr[removeIndex]){
                if (!visited[i]){
                    visited[i] = true;
                    queue.add(i);
                }
            }
        }

    }
}
```

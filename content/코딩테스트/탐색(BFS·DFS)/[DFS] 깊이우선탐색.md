---
title: "[DFS] 깊이우선탐색"
tags: [알고리즘 & 자료구조, 알고리즘]
created: 2026-09-05
modified: 2026-09-05
---

# [DFS] 깊이우선탐색

## 깊이 우선 탐색이란?

그래프 완전 탐색 기법 중 하나이며,  
그래프의 시작 노드에서 출발하여 탐색할 한 쪽 분기를 정하여 최대 깊이까지 탐색을 마친 후 다른 쪽 분기로 이동하여 다시 탐색을 진행하는 알고리즘

| 기능 | 특징 | 시간복잡도 |
| --- | --- | --- |
| 그래프완전탐색 | - 재귀함수로 구현- 스택 자료구조 이용 | O(노드 개수 + Edge 개수) |

## 깊이우선 탐색 주의할점

*   재귀함수를 이용하므로, 스택 오버플로우에 주의해아한다
*   주로 사용되는 문제 유형 : 단절점 찾기, 단절선 찾기, 사이클 찾기, 위상정렬

## 깊이우선 탐색 핵심 이론

*   한 번 방문한 노드를 다시 방문하면 안됨
*   후입선출(LIFO) 구조를 가진다 (스택 사용)
*   이론을 이용하기 위해서, 스택으로 구현한 것이며 주로 재귀함수를 이용하여 사용한다

```text
인접 리스트 (아래 구현 코드의 addEdge 기준)
1: [2, 3]
2: [5, 6]
3: [4]
4: [6]
```

연결 상태

*   방문할 스택 + 방문한 곳 저장할 배열
    *   탐색 순서 : 1 -> 3 -> 4 -> 6 -> 2 -> 5

```text
stack: [1]           visited: {}
pop 1  → push 2,3    stack: [2,3]      visited: {1}
pop 3  → push 4       stack: [2,4]      visited: {1,3}
pop 4  → push 6       stack: [2,6]      visited: {1,3,4}
pop 6  → (인접 4 이미 방문)  stack: [2]   visited: {1,3,4,6}
pop 2  → push 5       stack: [5]        visited: {1,3,4,6,2}
pop 5  → (인접 2 이미 방문)  stack: []   visited: {1,3,4,6,2,5}

방문 순서: 1 -> 3 -> 4 -> 6 -> 2 -> 5
```

## 깊이 우선 탐색 구현

*   스택으로 구현

```java
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Stack;
import java.util.ArrayList;

public class App {

    private HashMap<Integer, List<Integer>> map = new HashMap<>();

    private void addEdge(int key, int value){
        map.putIfAbsent(key, new ArrayList<>());
        map.putIfAbsent(value, new ArrayList<>()); 
        map.get(key).add(value);
    }

    private void dfs(HashMap<Integer, List<Integer>> hashMap){
        
        if (hashMap.isEmpty()) {
            System.out.println("그래프가 비어 있습니다.");
            return;
        }
        
        HashMap<Integer, Boolean> visited = new HashMap<>();
        int firstKey = hashMap.keySet().iterator().next();

        for (int key : hashMap.keySet()){
            visited.put(key,false);
        }
        
        Stack<Integer> stack = new Stack();
        stack.push(firstKey);
        visited.put(firstKey, true);

    
        while(!stack.empty()){
            int key = stack.pop();
            for (int value : hashMap.getOrDefault(key, new ArrayList<>())){
                if (visited.containsKey(value) && !visited.get(value)) {
                    System.out.println( key + " 인접 노드 : " + value);
                    stack.push(value);
                    visited.put(value, true);
                }
            }
        }

        boolean isDisconnected = false;
        for (Map.Entry<Integer, Boolean> entry : visited.entrySet()) {
            if (!entry.getValue()) {
                isDisconnected = true;
                System.out.println("\n연결되지 않은 노드: " + entry.getKey());
            }
        }

        if (!isDisconnected) {
            System.out.println("\n모든 노드가 연결되어 있습니다.");
        }
    

    }
    public static void main(String[] args) throws Exception {
        App app = new App();
        app.addEdge(1, 2);
        app.addEdge(1, 3);
        app.addEdge(2, 5);
        app.addEdge(2, 6);
        app.addEdge(3, 4);
        app.addEdge(4, 6);
        
        app.dfs(app.map);
    }
}
```

---
title: [BFS + DFS] 백준 1260번
tags: [개발 서적 리뷰, DoIt 알고리즘 코딩테스트]
created: 2026-09-05
modified: 2026-09-05
---

# [BFS + DFS] 백준 1260번

## 문제

그래프를 DFS로 탐색한 결과와 BFS로 탐색한 결과를 출력하는 프로그램을 작성하시오. 단, 방문할 수 있는 정점이 여러 개인 경우에는 정점 번호가 작은 것을 먼저 방문하고, 더 이상 방문할 수 있는 점이 없는 경우 종료한다. 정점 번호는 1번부터 N번까지이다.  
  
첫째 줄에 정점의 개수 N(1 ≤ N ≤ 1,000), 간선의 개수 M(1 ≤ M ≤ 10,000), 탐색을 시작할 정점의 번호 V가 주어진다. 다음 M개의 줄에는 간선이 연결하는 두 정점의 번호가 주어진다. 어떤 두 정점 사이에 여러 개의 간선이 있을 수 있다. 입력으로 주어지는 간선은 양방향이다.

## 문제분석

DFS와 BFS를 차례대로 구현하면 된다.  
주의할점은 정점번호가 작은 것을 먼저 방문하므로, 인접 인덱스를 정렬을 해서 방문할 순서를 정해야한다.
DFS  
- visited와 인접인덱스를 이용하여, 방문한 곳은 재방문 없이 재귀함수를 이용하여 구현
BFS  
- visited와 인접인덱스를 이용하여, 방문하는 곳은 재방문 없이 큐를 이용하여 인접인덱스를 먼저 방문한 후 depth를 진행하는 방향으로 구현

## 슈도코드

```java
N(노드 개수)
E(에지 개수)
num (첫번째 인덱스)

visited( 방문 배열 )
ArrayList<Integer> arr ( 인접 인덱스 )

visited + arr 초기화

//양방향 조건이므로
for(관계 수){
    a <-> b 관계 설정
}

for(노드 수){
    배열로 담겨있는 인접 인덱스 정렬
}

Dfs() 진행
visited 초기화 (false)
Bfs() 진행
종료

Custom정렬 클래스 구현
BFS(){
    queue 생성
    queue.add(index);
    while(큐가 비어있기 전까지){
    
        for( arr배열 인접 인덱스value){
            queue.poll() // 맨앞 원소 제거
            if(방문했는지)
                방문 등록 및 큐 등록
          }
    }
}

DFS(){
    if (depth가 Node 개수까지 갔다면)
       dfs 종료
    
    visited 방문
    
    for( 인접인덱스 개수만큼 반복 ){
        if (방문 하지 않았다면){
            visited 방문
            dfs()
        }
   }
}
```

## 구현

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
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

        for (int i =1; i< nodeSize; i++){
            CustomSort.sort(arr[i]);
        }
        
        dfs(firstIndex, arr, visited, 1);
        System.out.println();
        for (int i = 1; i< nodeSize; i++){
            visited[i] = false;
        }
        bfs(firstIndex, arr, visited);
    }

    private static void bfs(int index, ArrayList<Integer>[] arr, boolean[] visited){
        Queue<Integer> queue = new LinkedList<>();
        queue.add(index);
        visited[index] = true;
        

        while(!queue.isEmpty()){
            int removeIndex = queue.poll();
            System.out.print(removeIndex + " ");
            for (int i : arr[removeIndex]){
                if (!visited[i]){
                    visited[i] = true;
                    queue.add(i);
                }
            }
        }

    }

    private static void dfs (int index, ArrayList<Integer>[] arr, boolean[] visited, int depth ){
        if (depth == arr.length){
            return;
        }        
        visited[index] = true;
        System.out.print(index+ " ");
        for (int i : arr[index]){
            if(!visited[i]){
                visited[i] = true;
                dfs(i,arr, visited,depth+1);
            }
        }
    }

    private static class CustomSort implements Comparator<Integer>{
        public int compare(Integer o1, Integer o2) {
        // Custom logic: Ascending order (can be modified for other orders)
        return Integer.compare(o1, o2);
    }

    public static void sort(ArrayList<Integer> a) {
        Collections.sort(a, new CustomSort());
    }
    }
}
```

> 원문: https://gradualprecision.tistory.com/204

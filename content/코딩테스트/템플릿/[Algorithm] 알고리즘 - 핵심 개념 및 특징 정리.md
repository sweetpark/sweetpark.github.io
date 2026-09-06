---
title: "알고리즘"
tags: [학습, 코딩테스트, 알고리즘]
created: 2025년 9월 2일 오후 9:59
modified: 2026-09-05
---

# 알고리즘

> [!NOTE]
> 개요
> 코딩테스트 알고리즘 분류 노트: 완전탐색(BFS/DFS·백트래킹), 분할정복(이진탐색), 탐욕법, 동적계획법(DP). 대표 예제로 프로그래머스 '의상' 문제의 두 가지 풀이(조합 공식 / 백트래킹)를 담았다.

## 📌 개념

## 완전탐색

- BFS
- DFS + 백트래킹
    
    > [!NOTE]
> 트리구조)
>     
>     - 트리구조를 가지고 있다면, DFS 또는 BFS를 이용해볼 수 있다 (완전탐색)
>     - 서로연결되어있으므로 모든 케이스를 방문해볼 수 있는 장점
    
    - 프로그래머스[알고리즘 고득점 kit] - 의상 ( Lv2 )
    
    > [!NOTE]
> 옷 종류에 따른, 입을 수 있는 경우의 수
>     
>     - 옷 중복 되지 않음
>     - 최소 1종류의 옷은 입어야함
>     - [의상의이름, 의상의종류] 로 나눠져 있음
    
    ```java
    [["yellow_hat", "headgear"], ["blue_sunglasses", "eyewear"], ["green_turban", "headgear"]] > return	5
    [["crow_mask", "face"], ["blue_sunglasses", "face"], ["smoky_makeup", "face"]] > return 3
    ```
    
    ```java
    import java.util.*;
    
    // 기본 전제 : 3가지종류의 나올수 있는 경우의 수 (곱셈) => 3 * 2 * 1
    class Solution {
        
        static int answer = 0;
        static List<Integer> list;
        
        public int solution(String[][] clothes) {
           
            
            // 첫번째 풀이 방법) 독립적 (입는경우+안입는경우) - 1 (모두 벗은 경우)
            
            /***
            Map<String, Integer> map = new HashMap<>();
            for(String[] cloth: clothes){
                map.put(cloth[1], map.getOrDefault(cloth[1], 0) + 1);
            }
            
            List<Integer> counts = new ArrayList<>(map.values());
            int answer = 1;
            
            for(int count : counts){
                answer *= (count + 1);
            }
            
            return answer - 1;
            ***/
             
            
            // 두번째 풀이 방법) 하나의 종류에 대해서 [선택할지/ 선택하지 않을지] + 백트래킹
            
            Map<String, Integer> map = new HashMap<>();
            
            
            for(int i = 0; i < clothes.length; i++){
                map.put(clothes[i][1], map.getOrDefault(clothes[i][1],0) + 1 );
            }
            
            list = new ArrayList<>(map.values());
            int totalSize = list.size();
            
            /*
            1. 선택한 경우 
            2. 선택하지 않은 경우        
            */
    
            backtrace(0, 1, 0, totalSize);
            
            
            return answer;
        }
        
        // backtrace(선택할 옷종류, 지금까지 선택된 옷 경우의 수, 선택된 옷 종류, 전체 개수) 
        private static void backtrace(int idx, int product, int choose, int totalSize){
                if(idx == totalSize){
                    
                    if(choose > 0){ // 최소 1개 이상 선택해야함 (아무것도 입지 않은 경우의 수)
                        answer += product;
                    }
                    
                    return;
                }
                
            
                //idx번째 옷 종류 : 선택한 경우
    // (product(=기존 옷 경우의수) * list.get(idx) (= 해당 옷 종류가 가지고 있는 서로다른 옷의 개수))
                backtrace(idx + 1 , product * list.get(idx), choose + 1, totalSize);
                //idx번째 옷 종류 : 선택하지 않은 경우
                backtrace(idx + 1 , product, choose, totalSize);
                
            }
    }
    ```
    

## 분할정복

- 이진탐색

## 탐욕법

- 탐욕법 (그리디)

## 동적프로그래밍(DP)

- 제한된자원
- 상태와전이

---
## 🔗 참고
- [(Algorithm) 자료구조 - 핵심 개념 및 특징 정리]([Algorithm]%20자료구조%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 시간복잡도 - 핵심 개념 및 특징 정리]([Algorithm]%20시간복잡도%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 완전탐색-조합패턴 - 완전탐색조합패턴]([Algorithm]%20완전탐색-조합패턴%20-%20완전탐색조합패턴.md)
- [(Algorithm) 코딩테스트 개요 - 핵심 개념 및 특징 정리]([Algorithm]%20코딩테스트%20개요%20-%20핵심%20개념%20및%20특징%20정리.md)
- [이진탐색](../이분탐색/이진탐색.md) — 분할정복 분류에서 다루는 이진탐색 개념의 상세 구현
- [그리디 알고리즘](../그리디/그리디%20알고리즘.md) — 탐욕법 분류에서 다루는 그리디 개념의 상세 설명

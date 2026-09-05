---
title: "완전탐색-조합패턴"
tags: [학습, 코딩테스트, 코테템플릿, 템플릿, 알고리즘, 완전탐색, DFS, 백트래킹]
created: 2026-03-16
modified: 2026-09-05
---

# 완전탐색-조합패턴

> [!NOTE]
> 개요
> 완전탐색 문제 대부분을 커버하는 6가지 뼈대: **조합(2개/3개/N개), 순열, 부분집합, 비트마스크**. 이 3대 축(조합·순열·부분집합)만 알아도 완탐 문제의 80%가 풀린다.

## 📌 개념 & 예시

### ① 2개 조합 패턴
배열에서 서로 다른 2개 선택. (두 수의 합/차, Two Sum)

```java
for (int i = 0; i < n - 1; i++) {
    for (int j = i + 1; j < n; j++) {
        // (i, j) 쌍
    }
}
```

### ② 3개 조합 패턴
배열에서 3개 선택. (삼총사, 3Sum)

```java
for (int i = 0; i < n - 2; i++) {
    for (int j = i + 1; j < n - 1; j++) {
        for (int k = j + 1; k < n; k++) {
            // (i, j, k) 조합
        }
    }
}
```

### ③ N개 조합 (DFS 조합)
3개 이상은 DFS가 일반적. 배열에서 r개 선택.

```java
void dfs(int start, int depth) {

    if (depth == r) {
        // 조합 완성
        return;
    }

    for (int i = start; i < n; i++) {
        dfs(i + 1, depth + 1);
    }
}
```

### ④ 순열 패턴
순서가 중요한 경우(`1 2`와 `2 1`이 다름). `visited`로 중복 사용 방지.

```java
boolean[] visited;

void dfs(int depth) {

    if (depth == n) {
        return;
    }

    for (int i = 0; i < n; i++) {

        if (visited[i]) continue;

        visited[i] = true;
        dfs(depth + 1);
        visited[i] = false;
    }
}
```

### ⑤ 부분집합 패턴
각 원소를 포함/미포함으로 분기.

```java
void dfs(int idx) {

    if (idx == n) {
        return;
    }

    dfs(idx + 1); // 선택
    dfs(idx + 1); // 선택 안 함
}
```

### ⑥ 비트마스크 완전탐색
부분집합 탐색을 정수 비트로 빠르게.

```java
for (int i = 0; i < (1 << n); i++) {
    for (int j = 0; j < n; j++) {
        if ((i & (1 << j)) != 0) {
            // 선택된 원소
        }
    }
}
```

## 📎 코테에서 많이 쓰는 순위
```
1위 조합 (for문)   2위 DFS 조합   3위 순열 DFS   4위 부분집합 DFS   5위 비트마스크
```
3대 패턴(조합·순열·부분집합)만 알아도 완탐 문제 80% 해결. N과 M / 소수찾기 / 타겟넘버 계열이 전부 여기서 파생된다.

---
## 🔗 참고
- [(Algorithm) N과 M(1) - 핵심 개념 및 특징 정리](../구현/[Algorithm]%20N과%20M%281%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 소수찾기 - 핵심 개념 및 특징 정리](../구현/[Algorithm]%20소수찾기%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 삼총사 - 핵심 개념 및 특징 정리](../구현/[Algorithm]%20삼총사%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 타겟넘버 - 핵심 개념 및 특징 정리](../탐색%28BFS·DFS%29/[Algorithm]%20타겟넘버%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 패턴을 쓰는 문제

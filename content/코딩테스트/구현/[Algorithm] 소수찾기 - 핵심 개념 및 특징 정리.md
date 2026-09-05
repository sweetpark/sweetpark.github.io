---
title: "소수찾기"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 완전탐색, 순열, DFS, 백트래킹]
created: 2026-03-15
modified: 2026-09-05
---

# 소수찾기

> [!NOTE]
> 프로그래머스 · 완전탐색(순열 DFS + 백트래킹 + 소수 판별)
> 숫자 문자열로 만들 수 있는 **모든 순열 조합**을 DFS로 생성하고, `Set`으로 중복을 제거한 뒤 각 수가 소수인지 판별해 개수를 센다.

## 📝 문제
- 숫자 문자열이 주어지면(예: `"17"` → 1, 7, 17, 71), 만들 수 있는 모든 수 중 **소수의 개수**를 반환.

## 💡 접근
전체 흐름: **① 문자 분리 → ② DFS로 모든 순열 생성 → ③ Set에 저장(중복 제거) → ④ 소수 판별 → ⑤ 개수 반환**.

**1. 소수 판별 — `2 ~ √N`까지만**
`N = a × b`이면 `a ≤ √N ≤ b`이므로 `√N`까지만 나눠보면 충분하다. `O(√N)`.

```java
boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}
```

**2. 순열 생성 — DFS + 백트래킹**
문자를 하나씩 붙여 가며(`append` → 재귀 → `delete`) 모든 자리 조합을 만든다. `visited[]`도 재귀 후 반드시 복구한다.

**3. 중복 제거 — `Set<Integer>`**
`"011"`처럼 중복 숫자가 있으면 같은 값이 여러 번 생기므로 `Set`으로 걸러낸다.

## ⌨️ 풀이

```java
import java.util.HashSet;
import java.util.Set;

class Solution {

    private Set<Integer> numbers = new HashSet<>();

    public int solution(String input) {
        boolean[] visited = new boolean[input.length()];
        dfs("", input, visited);

        int count = 0;
        for (int num : numbers) {
            if (isPrime(num)) {
                count++;
            }
        }
        return count;
    }

    private void dfs(String current, String input, boolean[] visited) {
        if (!current.isEmpty()) {
            numbers.add(Integer.parseInt(current));
        }

        for (int i = 0; i < input.length(); i++) {
            if (visited[i]) continue;

            visited[i] = true;
            dfs(current + input.charAt(i), input, visited);
            visited[i] = false;
        }
    }

    private boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }
}
```

## ⏱️ 복잡도
- **시간**: 순열 생성이 `O(N!)`(N = 문자 길이) 수준 + 각 수의 소수 판별 `O(√M)`. 문자열 길이 제한이 작아 통과.
- **공간**: `O(N)` — 재귀 깊이와 방문 배열, 생성된 수를 담는 Set.

## 📎 DFS 작성 팁 (암기 템플릿)
```
for (모든 선택지) {
    if (이미 사용됨) continue;
    사용 처리 + 상태 변경;
    dfs();
    상태 복구 + 사용 복구;  // ★ 백트래킹
}
```
체크리스트: **① 종료(결과 저장) 위치 → ② 상태 변경 → ③ 재귀 → ④ 상태 복구**.

---
## 🔗 관련
- [(Algorithm) 타겟넘버 - 핵심 개념 및 특징 정리](../탐색%28BFS·DFS%29/[Algorithm]%20타겟넘버%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 완전탐색-조합패턴 - 완전탐색조합패턴](../템플릿/[Algorithm]%20완전탐색-조합패턴%20-%20완전탐색조합패턴.md)
- [(Algorithm) N과 M(1) - 핵심 개념 및 특징 정리]([Algorithm]%20N과%20M%281%29%20-%20핵심%20개념%20및%20특징%20정리.md) — DFS/백트래킹 계열

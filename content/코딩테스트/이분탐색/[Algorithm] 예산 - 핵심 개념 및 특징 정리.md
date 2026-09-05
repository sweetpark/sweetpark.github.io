---
title: "예산"
tags: [학습, 코딩테스트, 이분탐색, 프로그래머스, 알고리즘, 그리디, DP, 배낭문제]
created: 2026-05-27
modified: 2026-09-05
---

# 예산

> [!NOTE]
> 프로그래머스 · 그리디 → (변형) DP
> 한정된 예산으로 **최대 개수**의 부서를 지원하는 그리디 문제. 단, "예산을 **정확히 딱 맞춰야** 한다"는 제약이 붙으면 그리디가 깨지고 **0-1 배낭 DP**로 격상되는 좋은 문제.

## 📝 문제
- **기본 목표**: 한정된 예산 내에서 **최대 개수**의 부서 지원하기.
- **변형 목표(면접 포인트)**: 예산을 남기지 않고 **정확히 딱 맞춰** 지원하기.

## 💡 접근

### 기본 문제 — 그리디
- **유형**: 탐욕법(Greedy), 정렬(Sorting)
- **그리디 선택 속성**: 모든 부서의 가치(카운트 증가량 = 1)가 동일 → 매 순간 **가장 적은 금액**을 요구하는 부서를 고르는 것이 전체 최적해를 보장.
- **로직**: 오름차순 정렬 → 작은 값부터 순차 차감 → 예산 부족 시 종료.

### 변형 문제 — 그리디의 한계와 대안
> "정확히 딱 맞춰야 한다"면 가장 작은 것을 고르는 선택이 예산을 못 맞추는 결과를 낳을 수 있음(그리디 속성 파괴).

- **부서 수 N이 작을 때 (N ≤ 20)**: DFS/백트래킹으로 모든 부분집합 탐색 — `O(2ⁿ)`
- **N·예산이 클 때**: 0-1 Knapsack DP — `O(N × Budget)`
    - `dp[i]` = `i`원을 **정확히** 만들 수 있을 때의 최대 부서 수로 정의.

### 난이도 평가 (변형 문제)
- **프로그래머스**: Level 2(DFS, N≤20) ~ Level 3(DP, N·예산 큼)
- **백준**: Gold V ~ Gold IV — 배낭 대표 문제 '평범한 배낭(12865)'이 Gold V. 정확히 target을 채우는 DP는 초기값 세팅(`-1` 예외 처리)이 까다로워 체감 Gold IV까지.

## ⌨️ 풀이 (변형: 정확히 딱 맞추기, 불가능 시 −1)

### 1. DFS (백트래킹) — N ≤ 20
'선택한다/선택하지 않는다' 2분기를 트리로 탐색.

```java
class BudgetDFS {
    private int maxCount = -1; // 정확히 맞춘 경우 중 최대 부서 수 (불가능하면 -1)

    public int solution(int[] d, int budget) {
        dfs(d, 0, 0, 0, budget);
        return maxCount;
    }

    private void dfs(int[] d, int idx, int currentSum, int count, int target) {
        if (currentSum == target) {                 // 기저 1: 정확히 맞춤
            maxCount = Math.max(maxCount, count);
            return;
        }
        if (idx == d.length || currentSum > target) { // 기저 2: 끝 or 초과(가지치기)
            return;
        }
        dfs(d, idx + 1, currentSum + d[idx], count + 1, target); // 포함
        dfs(d, idx + 1, currentSum, count, target);             // 건너뜀
    }
}
```
- **핵심**: `currentSum > target` 즉시 종료(Pruning)로 무의미한 탐색 제거.
- **복잡도**: `O(2ⁿ)`

### 2. DP (0-1 Knapsack) — N·예산 큼
```java
import java.util.Arrays;

class BudgetDP {
    public int solution(int[] d, int budget) {
        int[] dp = new int[budget + 1];  // dp[i] = i원을 정확히 맞췄을 때 최대 부서 수
        Arrays.fill(dp, -1);             // 정확히 못 맞추는 상태를 -1로 구분
        dp[0] = 0;

        for (int cost : d) {
            for (int j = budget; j >= cost; j--) { // 역순: 같은 부서 중복 선택 방지
                if (dp[j - cost] != -1) {
                    dp[j] = Math.max(dp[j], dp[j - cost] + 1);
                }
            }
        }
        return dp[budget];               // 조합 없으면 -1
    }
}
```
- **핵심**: `dp`를 `-1`로 초기화해야 '못 맞춤'과 '0개로 채움'이 구분됨. 내부 반복문 역순은 0-1 배낭 특성(중복 방지).
- **복잡도**: `O(N × Budget)`

## ⏱️ 복잡도 비교
| 방식 | 복잡도 | 비고 |
|---|---|---|
| 기본(Greedy) | `O(N log N)` | 정렬 비용 지배적 |
| 변형(DFS) | `O(2ⁿ)` | 완전 탐색 |
| 변형(DP) | `O(N × Budget)` | 의사 다항 시간 |

> [!TIP]
> 면접·코테 핵심
> 기본은 Level 1 정렬 문제지만 '예산 일치' 제약 하나로 Gold급 DP로 돌변. **"그리디로 풀 수 없는 이유"와 "DP로의 전환 과정"**을 논리적으로 설명할 수 있어야 한다. 입력이 작으면 DFS, 부서 수가 수백~수천이면 DP로 설계.

---
## 🔗 관련
- [(Algorithm) 순위검색 - 핵심 개념 및 특징 정리]([Algorithm]%20순위검색%20-%20핵심%20개념%20및%20특징%20정리.md) — 이분탐색/파라메트릭 서치 계열
- [(Algorithm) 타겟넘버 - 핵심 개념 및 특징 정리](../탐색%28BFS·DFS%29/[Algorithm]%20타겟넘버%20-%20핵심%20개념%20및%20특징%20정리.md) — DFS 완전탐색 분기

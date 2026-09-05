---
title: "타겟넘버"
tags: [학습, 코딩테스트, BFSDFS, 프로그래머스, 알고리즘, DFS, 완전탐색]
created: 2026-05-06
modified: 2026-09-05
---

# 타겟넘버

> [!NOTE]
> 프로그래머스 · 완전탐색(DFS)
> 각 숫자를 **더하거나 빼서** 타깃을 만드는 **모든 경우의 수**를 세는 문제. 선택지가 2개(±)로 고정된 상태 공간 트리(State-Space Tree) 탐색의 전형.

## 📝 문제
- 음이 아닌 정수 배열 `numbers`의 각 원소 앞에 `+` 또는 `-`를 붙여 순서대로 모두 계산했을 때, 결과가 `target`이 되는 방법의 수를 반환.
- **키워드**: "모든 방법의 수", "더하거나 빼서", "순서를 바꾸지 않고" → 완전탐색/DFS 신호.

## 💡 접근
현재 상태에서 선택지(경우의 수)가 고정되어 있을 때 트리의 가지를 뻗듯 탐색한다. 기계적으로 떠올리는 **DFS 3단계 공식**:

1. **상태값 전달** — 현재 깊이(`index`)와 누적합(`sum`)을 매개변수로 전달
2. **기저 조건(Base Case)** — `index == numbers.length`에서 `sum == target` 여부 판별
3. **상태 분기(Branching)** — 가능한 선택지 수만큼 재귀 호출 (여기선 +/− 2번)

## ⌨️ 풀이

> [!NOTE]
> 원문에 개념·오답노트만 있고 완성 코드가 없어 AI가 표준 DFS 풀이를 보강함(사실 확인 권장).

```java
class Solution {
    int count = 0;

    public int solution(int[] numbers, int target) {
        dfs(numbers, target, 0, 0);
        return count;
    }

    private void dfs(int[] numbers, int target, int index, int sum) {
        // 기저 조건: 모든 숫자를 소진 → 합이 target이면 유효한 경우
        if (index == numbers.length) {
            if (sum == target) {
                count++;
            }
            return;
        }

        // 분기 1: 현재 숫자를 더한다
        dfs(numbers, target, index + 1, sum + numbers[index]);
        // 분기 2: 현재 숫자를 뺀다
        dfs(numbers, target, index + 1, sum - numbers[index]);
    }
}
```

## ⏱️ 복잡도
- **시간**: `O(2ⁿ)` — 원소마다 ± 2갈래로 분기하므로 리프가 `2ⁿ`개 (n = 배열 길이).
- **공간**: `O(n)` — 재귀 호출 깊이.

## 📎 오답 노트 (내가 잘못 생각했던 부분)

**1. 그래프 탐색과 상태 탐색의 혼동 (`visited` 배열)**
- 미로/노드 탐색처럼 재방문 방지용 `visited`를 썼음.
- 이 문제는 "방문할까 말까"가 아니라 "**더할까 뺄까**"의 문제. 항상 0번부터 순서대로 진행되므로 방문 기록이 불필요.
- → `visited` 삭제하고 `index`만 1씩 증가.

**2. 재귀 함수의 분기 누락**
- `for`문 안에서 처리하고 `dfs(index+1, ...)`를 한 번만 호출 → 트리가 한 줄로만 뻗음.
- 숫자마다 선택지가 2개(+/−)이므로 재귀도 2번 호출해 2갈래로 쪼개야 함.

**3. 비효율적인 누적 합계 계산**
- 끝에서 `Arrays.stream(numbers).sum()`으로 전체 합을 구하려 함 → 지나온 경로(+/−)를 반영 못 함.
- → 누적합(`sum`)을 매개변수로 넘겨 즉시 사용.

**4. 자바 언어 특성 간과 (Call by Value & Wrapper)**
- `int count`를 인자로 넘겨 `count++` → 값 복사라 원본 미반영. → 공유 카운터는 **전역 변수**로.
- `Boolean[]` 초기값은 `false`가 아니라 `null` → `NPE`. → 기본형 `boolean[]` 사용.

---
## 🔗 관련
- [(Algorithm) 무인도여행 - 핵심 개념 및 특징 정리]([Algorithm]%20무인도여행%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 네트워크 - 핵심 개념 및 특징 정리]([Algorithm]%20네트워크%20-%20핵심%20개념%20및%20특징%20정리.md) — 같은 DFS/완전탐색 계열
- [(Algorithm) 예산 - 핵심 개념 및 특징 정리](../이분탐색/[Algorithm]%20예산%20-%20핵심%20개념%20및%20특징%20정리.md) — DFS(백트래킹) 분기 응용

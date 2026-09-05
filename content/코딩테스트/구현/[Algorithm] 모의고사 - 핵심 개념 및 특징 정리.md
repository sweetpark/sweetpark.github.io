---
title: "모의고사"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 완전탐색]
created: 2026-02-24
modified: 2026-09-05
---

# 모의고사

> [!NOTE]
> 프로그래머스 · 구현 + 완전탐색(패턴 반복)
> 고정된 찍기 패턴을 가진 세 사람의 점수를 정답과 비교해 최다 정답자를 찾는 문제. 핵심은 **모듈러 반복(`i % pattern.length`)**과 **최댓값 + 동점자 수집**.

## 📝 문제
- 세 수포자는 각자 고정된 패턴으로 답을 찍는다.
- 정답 배열 `answers`와 비교해 가장 많이 맞힌 사람(들)의 번호를 **오름차순**으로 반환.
- 동점이면 모두 포함한다.

## 💡 접근
**패턴 반복 = 모듈러**. 사람 패턴이 5개인데 문제가 100개여도 배열을 늘릴 필요 없이 `i % 5`로 순환시킨다.

- 문제에서 "일정한 패턴으로 반복", "주기적으로", "순환한다"가 나오면 → `i % 길이`.
- 최다 정답 판정은 **① 최댓값 구하기 → ② 최댓값과 같은 사람 모두 수집**의 2단계 구조(자주 나옴).

## ⌨️ 풀이

> [!NOTE]
> 원문에 단계별 코드 조각만 있어 하나의 완성 풀이로 조립함(사실 확인 권장).

```java
import java.util.ArrayList;
import java.util.List;

class Solution {

    public int[] solution(int[] answers) {
        int[][] persons = {
            {1, 2, 3, 4, 5},
            {2, 1, 2, 3, 2, 4, 2, 5},
            {3, 3, 1, 1, 2, 2, 4, 4, 5, 5}
        };

        int[] scores = new int[persons.length];

        // 완전탐색: 문제 순회 × 사람 순회, 패턴은 모듈러로 반복
        for (int i = 0; i < answers.length; i++) {
            for (int j = 0; j < persons.length; j++) {
                if (answers[i] == persons[j][i % persons[j].length]) {
                    scores[j]++;
                }
            }
        }

        // 최댓값 찾기
        int max = 0;
        for (int score : scores) {
            max = Math.max(max, score);
        }

        // 동점자 수집 (번호는 1번부터 → i + 1)
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < scores.length; i++) {
            if (scores[i] == max) {
                result.add(i + 1);
            }
        }

        return result.stream().mapToInt(Integer::intValue).toArray();
    }
}
```

## ⏱️ 복잡도
- **시간**: `O(N)` — 사람 수는 3으로 고정이므로 이중 for문이 `3N`, 사실상 선형.
- **공간**: `O(1)` — 점수 배열 크기가 상수(3).

## 📎 실전 감각 체크
입력 `{1, 3, 2, 4, 2}`를 직접 계산하면 1·2·3번 모두 2개씩 맞아 결과는 `[1, 2, 3]` → 동점 처리가 핵심.

---
## 🔗 관련
- [(Algorithm) 완전탐색-조합패턴 - 완전탐색조합패턴](../템플릿/[Algorithm]%20완전탐색-조합패턴%20-%20완전탐색조합패턴.md)
- [(Algorithm) 삼총사 - 핵심 개념 및 특징 정리]([Algorithm]%20삼총사%20-%20핵심%20개념%20및%20특징%20정리.md) — 완전탐색 계열

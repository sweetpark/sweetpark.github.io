---
title: "삼총사"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 완전탐색, 조합]
created: 2026-03-16
modified: 2026-09-05
---

# 삼총사

> [!NOTE]
> 프로그래머스 · 완전탐색(조합)
> 배열에서 **서로 다른 3명을 골라 합이 0**이 되는 경우의 수를 세는 문제. `i < j < k` 3중 for문으로 중복 없는 조합을 생성하는 전형.

## 📝 문제
- 정수 배열 `number`에서 서로 다른 세 원소를 골라 `number[i] + number[j] + number[k] == 0`을 만족하는 **조합의 개수**를 구한다.

## 💡 접근
- 유형: **완전탐색 + 조합(Combination)**.
- 3개를 **중복 없이** 선택하려면 인덱스가 `i < j < k` 관계를 만족해야 한다 → 3중 for문으로 구현.

```
for (i = 0 ; i < n-2 ; i++)
  for (j = i+1 ; j < n-1 ; j++)
    for (k = j+1 ; k < n ; k++)   // 배열에서 3개 조합 생성
```

## ⌨️ 풀이

```java
public int solution(int[] number) {

    int count = 0;

    for (int i = 0; i < number.length - 2; i++) {
        for (int j = i + 1; j < number.length - 1; j++) {
            for (int k = j + 1; k < number.length; k++) {

                if (number[i] + number[j] + number[k] == 0) {
                    count++;
                }
            }
        }
    }

    return count;
}
```

## ⏱️ 복잡도
- **시간**: `O(N³)` — 3중 for문. 단, 문제 제한이 `N ≤ 13`이라 충분히 통과.
- **공간**: `O(1)`.

## 📎 같은 패턴 문제
배열에서 3개를 뽑는 문제: LeetCode 3Sum, "세 수의 합/곱" 등. 원소 수가 커지면 정렬 + 투 포인터로 `O(N²)` 최적화 가능.

---
## 🔗 관련
- [(Algorithm) 완전탐색-조합패턴 - 완전탐색조합패턴](../템플릿/[Algorithm]%20완전탐색-조합패턴%20-%20완전탐색조합패턴.md)
- [(Algorithm) 모의고사 - 핵심 개념 및 특징 정리]([Algorithm]%20모의고사%20-%20핵심%20개념%20및%20특징%20정리.md) — 완전탐색/조합 계열

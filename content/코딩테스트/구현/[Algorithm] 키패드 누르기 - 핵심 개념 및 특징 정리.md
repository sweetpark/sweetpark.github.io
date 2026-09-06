---
title: "키패드 누르기"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 좌표매핑, 카카오]
created: 2026-03-05
modified: 2026-09-05
---

# 키패드 누르기

> [!NOTE]
> 프로그래머스(카카오) Lv1 · 구현(좌표 매핑 + 맨해튼 거리)
> 키패드를 2차원 배열로 만들지 않고 **숫자를 index → 좌표로 변환**해 맨해튼 거리로 손을 고르는 문제. "값 → 좌표 변환" 패턴의 대표 예.

## 📝 문제
- 키패드에서 `1 4 7`은 왼손, `3 6 9`는 오른손, `2 5 8 0`은 **더 가까운 손**(같으면 `hand`가 우세한 손)으로 누른다.
- 왼손 시작은 `*`, 오른손 시작은 `#`. 누른 손의 순서를 `L`/`R` 문자열로 반환.

## 💡 접근
- **키패드를 배열로 만들지 않는다.** 각 숫자를 0~11 인덱스로 매핑한 뒤 좌표로 변환.

```
index:  0 1 2 / 3 4 5 / 6 7 8 / 9 10 11
매핑:   1→0  2→1  ...  0→10  *→9  #→11
```

- **좌표 계산**: `row = index / 3`, `col = index % 3`.
- **맨해튼 거리**: `|fromRow - toRow| + |fromCol - toCol|` = `Math.abs(from/3 - to/3) + Math.abs(from%3 - to%3)`.

## ⌨️ 풀이

```java
public String solution(int[] numbers, String hand) {

    StringBuilder answer = new StringBuilder();

    int left = 9;   // *
    int right = 11; // #

    for (int num : numbers) {

        int target = (num == 0) ? 10 : num - 1;

        if (target % 3 == 0) {          // 왼쪽 열: 1 4 7 *
            answer.append("L");
            left = target;
        } else if (target % 3 == 2) {   // 오른쪽 열: 3 6 9 #
            answer.append("R");
            right = target;
        } else {                        // 가운데 열: 거리 비교
            int leftDist = distance(left, target);
            int rightDist = distance(right, target);

            if (leftDist < rightDist) {
                answer.append("L");
                left = target;
            } else if (rightDist < leftDist) {
                answer.append("R");
                right = target;
            } else {
                if (hand.equals("left")) {
                    answer.append("L");
                    left = target;
                } else {
                    answer.append("R");
                    right = target;
                }
            }
        }
    }

    return answer.toString();
}

private int distance(int from, int to) {
    return Math.abs(from / 3 - to / 3) + Math.abs(from % 3 - to % 3);
}
```

## ⏱️ 복잡도
- **시간**: `O(N)` — `numbers`를 한 번 순회, 좌표 조회는 계산이라 `O(1)`.
- **공간**: `O(1)` (결과 문자열 제외).

## 📎 오답 노트 (원본 방식과 비교)
원본은 `int[][] keypad` 2차원 배열 + `findXY()` 탐색 + `Map<String,Integer>`로 좌표를 저장하는 방식이었다. 좌표 매핑(계산) 방식과 비교하면:

| 항목 | 원본(배열+Map) | Best Practice(계산) |
| --- | --- | --- |
| 좌표 저장 | Map 객체 | int index |
| 좌표 찾기 | 배열 탐색 | 계산 |
| 좌표 조회 | O(12) | O(1) |
| 메모리 | Map 객체 생성 | primitive |
| 코드 길이 | 길다 | 짧다 |

**교훈**: 키패드를 그대로 배열로 만들기보다 `row = i/3`, `col = i%3`로 **데이터 구조를 단순화**하는 것이 문제 의도. 게임판 이동·최단거리·시뮬레이션에서 재사용된다.

---
## 🔗 관련
- [(Algorithm) 공원산책 - 핵심 개념 및 특징 정리]([Algorithm]%20공원산책%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 무인도여행 - 핵심 개념 및 특징 정리](../탐색%28BFS·DFS%29/[Algorithm]%20무인도여행%20-%20핵심%20개념%20및%20특징%20정리.md) — 좌표/격자 계열
- [(Algorithm) 60일 계획 - 핵심 개념 및 특징 정리](../기획/[Algorithm]%2060일%20계획%20-%20핵심%20개념%20및%20특징%20정리.md) — 1~20일차 학습 커리큘럼에서 참조하는 문제

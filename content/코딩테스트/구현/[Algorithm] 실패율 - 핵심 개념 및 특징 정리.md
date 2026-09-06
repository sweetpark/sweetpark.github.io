---
title: "실패율"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 정렬, 카카오]
created: 2026-03-14
modified: 2026-09-05
---

# 실패율

> [!NOTE]
> 프로그래머스(카카오) · 구현 + 정렬
> 각 스테이지의 실패율을 계산해 **실패율 내림차순, 동률이면 번호 오름차순**으로 정렬하는 문제. "현재 스테이지 이상 인원"을 누적합이 아니라 **남은 인원 차감**으로 관리하면 `O(N)`으로 풀린다.

## 📝 문제
- 실패율 = `현재 스테이지에 머문 사용자 수 / 현재 스테이지 이상에 도달한 사용자 수`.
- 실패율이 높은 순으로 스테이지 번호를 정렬해 반환(동률이면 번호 오름차순).

예시 `stages = [2, 1, 2, 6, 2, 4, 3, 3]`:

| stage | 머문 인원 | 도달 인원 | 실패율 |
| --- | --- | --- | --- |
| 1 | 1 | 8 | 1/8 |
| 2 | 3 | 7 | 3/7 |
| 3 | 2 | 4 | 2/4 |
| 4 | 1 | 2 | 1/2 |
| 5 | 0 | 1 | 0 |

## 💡 접근
1. 각 스테이지에 머문 사람 수 카운트(빈도 배열).
2. 각 스테이지에 도달한 사람 수 계산.
3. 실패율 계산.
4. 실패율 내림차순 + 번호 오름차순 정렬.

**핵심 아이디어**: "현재 스테이지 이상 인원"을 매번 뒤에서부터 더하면 `O(N²)`이 된다. 대신 `players`(도달 인원)를 전체 인원으로 시작해 각 스테이지 처리 후 `players -= stageCount[i]`로 갱신하면 `O(N)`.

## ⌨️ 풀이

```java
private int[] solution(int N, int[] stages) {

    int[] stageCount = new int[N + 2];

    for (int s : stages) {
        stageCount[s]++;
    }

    int players = stages.length;

    Map<Integer, Double> failRate = new HashMap<>();

    for (int i = 1; i <= N; i++) {

        if (players == 0) {
            failRate.put(i, 0.0);
        } else {
            failRate.put(i, (double) stageCount[i] / players);
            players -= stageCount[i];   // 도달 인원 자동 갱신
        }
    }

    return failRate.entrySet()
            .stream()
            .sorted(Map.Entry.<Integer, Double>comparingByValue().reversed()
                    .thenComparing(Map.Entry::getKey))
            .mapToInt(Map.Entry::getKey)
            .toArray();
}
```

- 정렬 조건: **1순위 실패율 내림차순(`comparingByValue().reversed()`)**, **2순위 스테이지 번호 오름차순(`thenComparing(getKey)`)** → 문제 요구사항과 정확히 일치.

## ⏱️ 복잡도 비교
| 방식 | 복잡도 |
| --- | --- |
| 원본 코드 (뒤에서 누적) | `O(N²)` |
| 개선 코드 (남은 인원 차감) | `O(N)` |

## 📎 오답 노트 (원본 코드 분석)
- **잘한 점**: `int[] stageInfos`로 스테이지별 인원을 카운트하고, 스트림 정렬 조건(`comparingByValue().reversed().thenComparing(getKey)`)을 문제 요구대로 정확히 구현.
- **단점 — 시간복잡도**: "현재 스테이지 이상 인원"을 이중 for문으로 뒤에서부터 누적해 `O(N²)`. `players -= stageCount[i]` 방식으로 바꾸면 `O(N)`.
- **핵심 교훈**: "현재 스테이지 이상 인원"을 **누적합이 아니라 남은 인원으로 관리**하는 사고.

---
## 🔗 관련
- [(Algorithm) 자료구조 - 핵심 개념 및 특징 정리](../템플릿/[Algorithm]%20자료구조%20-%20핵심%20개념%20및%20특징%20정리.md) — HashMap/정렬(Comparator) 참고
- [(Algorithm) 60일 계획 - 핵심 개념 및 특징 정리](../기획/[Algorithm]%2060일%20계획%20-%20핵심%20개념%20및%20특징%20정리.md) — 1~20일차 학습 커리큘럼에서 참조하는 문제

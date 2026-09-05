---
title: "순위검색"
tags: [학습, 코딩테스트, 이분탐색, 프로그래머스, 알고리즘, 해시, DFS, LowerBound]
created: 2026-05-31
modified: 2026-09-05
---

# 순위검색

> [!NOTE]
> 프로그래머스 Lv3(카카오) · DFS 조합 + HashMap + 이분탐색(Lower Bound)
> 지원자마다 검색될 수 있는 모든 조건 조합을 미리 만들어 `HashMap`에 점수 리스트로 쌓고, 정렬 후 **Lower Bound**로 "X점 이상 인원"을 빠르게 세는 문제.

## 📝 문제
- 지원자 정보(언어·직군·경력·소울푸드·점수)와 여러 쿼리가 주어질 때, 각 쿼리 조건을 만족하는 지원자 수를 반환.
- [문제 링크](https://school.programmers.co.kr/learn/courses/30/lessons/72412)

## 💡 접근
**완전 탐색의 한계**: 지원자 `N ≤ 50,000`, 쿼리 `M ≤ 100,000`일 때 매번 단순 비교하면 `O(N × M) = 50억` 연산으로 효율성 실패.

**최적화 전략**:
1. **데이터 전처리(DFS 조합)**: 지원자 한 명당 검색될 수 있는 모든 조건 조합(각 항목을 포함/`-` 두 갈래 → `2⁴ = 16`가지)을 미리 만들어, `HashMap`의 Key에는 조합 문자열, Value에는 점수 리스트를 저장.
2. **이분 탐색용 정렬**: 모든 조합을 Map에 넣은 뒤, 각 Key의 점수 리스트를 **오름차순 한 번만** 정렬.
3. **Lower Bound**: 쿼리가 오면 해당 조건의 점수 리스트에서 **기준 점수 이상이 처음 나타나는 위치**를 이분 탐색으로 찾아 개수를 구한다.

## ⌨️ 풀이

```java
import java.util.*;

class Solution {
    // 조건 조합(Key) → 해당 조건에 맞는 지원자 점수 리스트(Value)
    Map<String, List<Integer>> map = new HashMap<>();

    public int[] solution(String[] info, String[] query) {
        // 1. info를 파싱해 16가지 조합을 전부 Map에 누적
        for (String i : info) {
            String[] split = i.split(" ");
            makeSentence(split, "", 0);
        }

        // 2. 이분 탐색을 위해 모든 점수 리스트 오름차순 정렬
        for (String key : map.keySet()) {
            Collections.sort(map.get(key));
        }

        // 3. 각 쿼리를 이분 탐색으로 계산
        int[] result = new int[query.length];
        for (int i = 0; i < query.length; i++) {
            // " and " 제거하여 Map의 Key 구조와 통일
            String[] split = query[i].replaceAll(" and ", "").split(" ");
            String key = split[0];
            int targetScore = Integer.parseInt(split[1]);

            result[i] = binarySearch(key, targetScore);
        }

        return result;
    }

    // DFS로 info 한 건당 16가지 조건 텍스트 조합 생성
    private void makeSentence(String[] arr, String str, int depth) {
        if (depth == 4) {
            int score = Integer.parseInt(arr[4]);
            map.computeIfAbsent(str, k -> new ArrayList<>()).add(score);
            return;
        }
        // 조건을 포함하는 경우
        makeSentence(arr, str + arr[depth], depth + 1);
        // 조건 대신 '-'를 선택하는 경우
        makeSentence(arr, str + "-", depth + 1);
    }

    // Lower Bound: targetScore 이상이 처음 나오는 인덱스를 찾아 개수 계산
    private int binarySearch(String key, int targetScore) {
        if (!map.containsKey(key)) return 0;

        List<Integer> scoreList = map.get(key);
        int left = 0;
        int right = scoreList.size(); // 경계값 처리를 위해 size로 설정

        while (left < right) {
            int mid = (left + right) / 2;

            if (scoreList.get(mid) >= targetScore) {
                right = mid; // 더 작은 인덱스 방향으로 축소
            } else {
                left = mid + 1;
            }
        }

        // 전체 개수 - (targetScore 이상 시작 위치) = 조건 충족 인원수
        return scoreList.size() - left;
    }
}
```

## ⏱️ 복잡도
- **전처리**: `O(N × 16 × log)` — 지원자당 16조합 생성 후 리스트 정렬.
- **쿼리**: `O(M × log N)` — 쿼리마다 이분 탐색.

## 📎 오답 노트 (자주 실수하는 포인트)
- **점수 비교**: "X점 이상"이므로 `.equals()`(정확히 일치)가 아니라 정수 크기 비교(`>=`).
- **정렬 타이밍**: 지원자를 넣을 때마다 매번 정렬하면 다시 시간 초과. **모든 데이터를 넣은 직후, 이분 탐색 전에 한 번만** `Collections.sort()`.
- **Lower Bound 경계**: `right`의 초기값을 `list.size() - 1`이 아니라 `list.size()`로 두어야 모든 원소가 기준보다 작을 때 인덱스 범위를 안전하게 처리.

---
## 🔗 관련
- [(Algorithm) 예산 - 핵심 개념 및 특징 정리]([Algorithm]%20예산%20-%20핵심%20개념%20및%20특징%20정리.md) — 이분탐색/파라메트릭 서치 계열

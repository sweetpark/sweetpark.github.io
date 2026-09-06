---
title: "바탕화면정리"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 완전탐색, 경계상자]
created: 2026-06-24
modified: 2026-09-05
---

# 바탕화면정리

> [!NOTE]
> 프로그래머스 · 구현/완전탐색(경계 상자 Bounding Box)
> 격자에 흩어진 파일(`#`)을 **모두 포함하는 최소 직사각형**을 찾는 문제. 전체를 한 번 훑으며 `Math.min`/`Math.max`로 상·하·좌·우 경계 네 값만 잡으면 끝난다.

## 📝 문제
- 격자(`wallpaper`)에서 파일(`#`)들을 모두 감싸는 가장 작은 직사각형의 좌표를 구한다.
- 반환: `[최소 Row, 최소 Col, 최대 Row + 1, 최대 Col + 1]` (드래그 끝점 오프셋 포함).

## 💡 접근
- 모든 대상을 감싸는 최소 사각형은 결국 **가장 위(최소 Row)·왼쪽(최소 Col)·아래(최대 Row)·오른쪽(최대 Col)** 경계로 결정된다.
- `min`은 배열 크기로, `max`는 0으로 초기화한 뒤 격자를 순회하며 `#`을 만날 때마다 경계를 실시간 갱신.
- **시작점 vs 끝점의 좌표 기준 차이**가 이 문제의 함정:
    - **시작점(Top-Left)**: 칸의 '왼쪽 위' → 최소 인덱스 그대로 (`minRow`, `minColumn`).
    - **끝점(Bottom-Right)**: 칸의 '오른쪽 아래' → 최대 인덱스에 **`+1` 필수** (`maxRow + 1`, `maxColumn + 1`)해야 해당 칸이 사각형에 완전히 포함된다.

## ⌨️ 풀이

```java
// 1. 초기값: min은 최대값으로, max는 최소값으로 세팅
int minRow = wallpaper.length;
int minColumn = wallpaper[0].length();
int maxRow = 0;
int maxColumn = 0;

// 2. 전체 격자 순회
for (int currentRow = 0; currentRow < wallpaper.length; currentRow++) {
    for (int currentCol = 0; currentCol < wallpaper[currentRow].length(); currentCol++) {
        if (wallpaper[currentRow].charAt(currentCol) == '#') {
            // 3. 조건 만족 시 경계값(Boundary) 실시간 갱신
            minRow = Math.min(minRow, currentRow);
            minColumn = Math.min(minColumn, currentCol);
            maxRow = Math.max(maxRow, currentRow);
            maxColumn = Math.max(maxColumn, currentCol);
        }
    }
}

// 4. 오프셋(Offset) 처리 후 반환
return new int[]{minRow, minColumn, maxRow + 1, maxColumn + 1};
```

- **초기화 팁**: `Integer.MAX_VALUE` 대신 문제에서 주어진 최대 격자 크기로 `min`을 초기화하면 더 직관적이다.
- **오프셋 정확성**: 발견된 최대 인덱스에 `+1`을 해야 드래그 끝점(오른쪽 아래 꼭짓점)이 칸을 완전히 감싼다.

## ⏱️ 복잡도
- **시간**: `O(N × M)` — 격자 세로 `N`, 가로 `M`을 한 번 순회. 이 문제의 최적 복잡도.
- **공간**: `O(1)` — 경계값 네 개만 유지.

---
## 🔗 관련
- [(Algorithm) 공원산책 - 핵심 개념 및 특징 정리]([Algorithm]%20공원산책%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 최소직사각형 - 핵심 개념 및 특징 정리]([Algorithm]%20최소직사각형%20-%20핵심%20개념%20및%20특징%20정리.md) — 격자·사각형 경계 계열
- [(Algorithm) 체스판 다시 칠하기 - 핵심 개념 및 특징 정리]([Algorithm]%20체스판%20다시%20칠하기%20-%20핵심%20개념%20및%20특징%20정리.md) — 2차원 격자 완전탐색 계열

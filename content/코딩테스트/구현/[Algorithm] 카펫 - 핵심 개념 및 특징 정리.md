---
title: "카펫"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 완전탐색, 약수]
created: 2026-02-28
modified: 2026-09-05
---

# 카펫

> [!NOTE]
> 프로그래머스 Lv2 · 완전탐색 + 약수 탐색(수식 변형)
> 갈색 테두리가 노란색을 감싸는 직사각형의 가로·세로를 찾는 문제. 전체 면적의 **약수 쌍**을 탐색하면 `O(√N)`으로 끝난다.

## 📝 문제
- 갈색(brown)이 노란색(yellow)을 감싸는 직사각형 카펫. 가로 ≥ 세로.
- 전체 격자 = brown + yellow. 가로·세로 길이를 반환.

```
BBBBBBBB
BYYYYYYB   ← 바깥 테두리 = brown, 안쪽 = yellow
BYYYYYYB
BBBBBBBB
```

## 💡 접근
**수식 유도**:
- 내부 노란색: `yellow = (width - 2) * (height - 2)`
- 전체 면적: `width * height = brown + yellow`

이 두 식을 동시에 만족하는 `(width, height)`를 찾으면 된다.

**약수 기반 탐색(권장 패턴)**: `total = brown + yellow`의 약수 쌍이 곧 `(height, width)` 후보다. `height`를 `3 ~ √total`까지만 돌리면 되므로 2중 for문(`O(N²)`)보다 빠르다.

## ⌨️ 풀이

```java
private int[] solution(int brown, int yellow) {

    int total = brown + yellow;

    for (int height = 3; height <= Math.sqrt(total); height++) {

        if (total % height == 0) {

            int width = total / height;

            if ((width - 2) * (height - 2) == yellow) {
                return new int[]{width, height};
            }
        }
    }

    return new int[]{};
}
```

## ⏱️ 복잡도 비교
| 방법 | 시간복잡도 |
| --- | --- |
| 2중 for문(완전탐색) | `O(N²)` |
| 약수 탐색 | `O(√N)` |

## 📎 실수 포인트
| 실수 | 이유 |
| --- | --- |
| brown 공식 직접 계산 | 실수 유발 (면적 - yellow가 안전) |
| width ≥ height 조건 누락 | 오답 |
| 3 이상 조건 미적용 | 테두리가 성립 안 함 |

**핵심 한 줄**: 직사각형 조건 문제는 "전체 면적 → 약수 탐색"이 1순위다.

---
## 🔗 관련
- [(Algorithm) 최소직사각형 - 핵심 개념 및 특징 정리]([Algorithm]%20최소직사각형%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 완전탐색-조합패턴 - 완전탐색조합패턴](../템플릿/[Algorithm]%20완전탐색-조합패턴%20-%20완전탐색조합패턴.md) — 완전탐색/사각형 계열
- [(Algorithm) 60일 계획 - 핵심 개념 및 특징 정리](../기획/[Algorithm]%2060일%20계획%20-%20핵심%20개념%20및%20특징%20정리.md) — 1~20일차 학습 커리큘럼에서 참조하는 문제

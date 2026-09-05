---
title: "체스판 다시 칠하기"
tags: [학습, 코딩테스트, 구현, 백준, 알고리즘, 완전탐색, 슬라이딩윈도우]
created: 2026-03-28
modified: 2026-09-05
---

# 체스판 다시 칠하기

> [!NOTE]
> 백준 1018 · 완전탐색(8×8 슬라이딩 윈도우)
> N×M 보드에서 모든 8×8 부분판을 훑어 다시 칠할 칸 수의 최솟값을 구하는 문제. 체스판 색이 **2가지(W/B)**이고 두 패턴이 정확히 반대라 `min(count, 64 - count)`로 절반만 계산하면 된다.

## 📝 문제
- N×M 보드(`N, M ≤ 50`)에서 임의의 8×8 영역을 잘라 체스판(칸이 번갈아 칠해진)으로 만들 때, **다시 칠해야 하는 칸 수의 최솟값**을 구한다.

## 💡 접근
- **탐색 범위**: 시작 좌표는 `i: 0 ~ N-8`, `j: 0 ~ M-8` (항상 `배열 크기 - 부분 배열 크기`).
- **이분 상태 활용(핵심)**: 체스판 패턴은 `W`로 시작하는 것과 `B`로 시작하는 것 2가지뿐이고 서로 완전 반대. 따라서 `A 불일치 + B 불일치 = 64`가 항상 성립 → 하나만 계산하고 `64 - count`로 나머지를 얻는다. 탐색량 절반 감소.
- **토글(Toggle) 기법**: `startBlack[][]`, `startWhite[][]` 배열을 하드코딩하지 말고 좌표 합의 홀짝(`(i + j) % 2`) 또는 `flag = !flag`로 기대 색을 판정 → 메모리 절약.
- **즉시 갱신**: 모든 경우를 `List`에 담고 `Stream`으로 최솟값을 구하지 말고, `int min = Integer.MAX_VALUE; min = Math.min(min, count);`로 바로 갱신 → 불필요한 객체/오버헤드 제거. **"모으지 말고 바로 갱신"**.

## ⌨️ 풀이

> [!NOTE]
> 원문에 리팩토링 포인트만 있고 완성 코드가 없어 위 인사이트를 반영한 표준 풀이를 보강함(사실 확인 권장).

```java
import java.io.*;

public class Main {

    static char[][] board;

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nm = br.readLine().split(" ");
        int N = Integer.parseInt(nm[0]);
        int M = Integer.parseInt(nm[1]);

        board = new char[N][M];
        for (int i = 0; i < N; i++) {
            board[i] = br.readLine().toCharArray();
        }

        int answer = Integer.MAX_VALUE;
        for (int i = 0; i + 8 <= N; i++) {
            for (int j = 0; j + 8 <= M; j++) {
                answer = Math.min(answer, count(i, j));
            }
        }

        System.out.println(answer);
    }

    // (startRow, startCol)에서 시작하는 8x8이 'W' 시작 패턴과 다른 칸 수
    static int count(int startRow, int startCol) {
        int cnt = 0;
        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 8; j++) {
                // (i + j)가 짝수면 'W', 홀수면 'B'가 기대값
                char expected = ((i + j) % 2 == 0) ? 'W' : 'B';
                if (board[startRow + i][startCol + j] != expected) {
                    cnt++;
                }
            }
        }
        // 반대 패턴('B' 시작)은 64 - cnt → 둘 중 작은 값
        return Math.min(cnt, 64 - cnt);
    }
}
```

## ⏱️ 복잡도
- **시간**: `O((N - 7) × (M - 7) × 64)` → 사실상 `O(N × M)`. `N, M ≤ 50`이라 완전탐색으로 충분.
- **공간**: `O(N × M)` — 보드 저장.

## 📎 이 패턴이 쓰이는 곳
체스판/색칠 문제, 2차원 배열 부분 탐색, 번갈아 나오는 패턴 문제, "두 가지 상태" 비교 문제.

---
## 🔗 관련
- [(Algorithm) 바탕화면정리 - 핵심 개념 및 특징 정리]([Algorithm]%20바탕화면정리%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 완전탐색-조합패턴 - 완전탐색조합패턴](../템플릿/[Algorithm]%20완전탐색-조합패턴%20-%20완전탐색조합패턴.md) — 2차원 완전탐색 계열

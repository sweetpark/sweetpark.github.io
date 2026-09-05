---
title: "N과 M(1)"
tags: [학습, 코딩테스트, 구현, 백준, 알고리즘, 순열, 백트래킹, DFS]
created: 2026-04-07
modified: 2026-09-05
---

# N과 M(1)

> [!NOTE]
> 백준 · 완전탐색(순열 + 백트래킹)
> 1 ~ N의 수 중 **중복 없이 길이 M의 순열**을 모두 생성하는 문제. `visited[]`로 중복을 막고 DFS로 자리를 채워 나가는 백트래킹의 가장 기본형.

## 📝 문제
- `1 ~ N`까지의 수 중에서 **중복 없이** 고른 **길이 M의 수열(순열)**을 사전 순으로 모두 출력.
- **키워드**: "중복 없이", "M개를 뽑아 나열" → 순열(Permutation) + 백트래킹(DFS) 신호.

## 💡 접근
DFS로 한 자리(`depth`)씩 숫자를 채우고, 되돌아올 때 선택을 취소한다.

1. **DFS + 방문 배열** — 한 번 고른 숫자는 다시 못 쓰므로 `visited[]` 필요.
2. **상태 정의** — `dfs(depth)`, `depth` = 현재까지 채운 숫자의 개수.
3. **종료 조건(Base Case)** — `depth == M`이면 완성된 수열을 출력하고 `return`.
4. **선택 → 재귀 → 되돌리기** — 백트래킹의 본질.

```java
visited[i] = true;
arr[depth] = i;

dfs(depth + 1);

visited[i] = false; // ★ 핵심: 되돌리기
```

## ⌨️ 풀이

```java
import java.io.*;

public class Main {

    static int N, M;
    static boolean[] visited;
    static int[] arr;
    static StringBuilder sb = new StringBuilder();

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] input = br.readLine().split(" ");

        N = Integer.parseInt(input[0]);
        M = Integer.parseInt(input[1]);

        visited = new boolean[N + 1];
        arr = new int[M];

        dfs(0);

        System.out.print(sb);
    }

    static void dfs(int depth) {
        if (depth == M) {
            for (int num : arr) {
                sb.append(num).append(" ");
            }
            sb.append("\n");
            return;
        }

        for (int i = 1; i <= N; i++) {
            if (!visited[i]) {
                visited[i] = true;
                arr[depth] = i;

                dfs(depth + 1);

                visited[i] = false;
            }
        }
    }
}
```

## ⏱️ 복잡도
- **시간**: `O(N × P(N, M))` — 서로 다른 순열의 수 `P(N, M) = N!/(N-M)!`개를 각각 M칸씩 출력.
- **공간**: `O(N + M)` — 방문 배열과 재귀 깊이(=M).
- 출력이 많으므로 `System.out.println` 대신 `StringBuilder` 누적이 필수(안 그러면 시간 초과).

## 📎 실수 포인트
- ❌ `visited`를 되돌리지 않음 → 결과 이상.
- ❌ 자리(`depth`)와 값(`i`)을 혼동 → 로직 꼬임.
- ❌ `StringBuilder` 없이 매번 출력 → 시간 초과.
- 한 줄 감각: **"depth는 자리, i는 숫자, visited는 사용 여부"**.

## 🔗 확장
같은 뼈대에서 조건만 바꿔 확장된다.

| 유형 | 차이점 |
| --- | --- |
| N과 M (2) | 오름차순 조합 → `start` 인덱스 필요 |
| N과 M (3) | 중복 허용 → `visited` 제거 |
| N과 M (4) | 중복 + 비내림차순 |

---
## 🔗 관련
- [(Algorithm) 완전탐색-조합패턴 - 완전탐색조합패턴](../템플릿/[Algorithm]%20완전탐색-조합패턴%20-%20완전탐색조합패턴.md)
- [(Algorithm) 소수찾기 - 핵심 개념 및 특징 정리]([Algorithm]%20소수찾기%20-%20핵심%20개념%20및%20특징%20정리.md) — 순열/조합 DFS 패턴

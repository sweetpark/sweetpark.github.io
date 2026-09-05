---
title: "공원산책"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 시뮬레이션, 방향벡터]
created: 2026-06-22
modified: 2026-09-05
---

# 공원산책

> [!NOTE]
> 프로그래머스 · 구현/시뮬레이션(2D 격자)
> 시작점(`S`)에서 명령(방향, 거리)대로 이동하되, **이동 경로 매 칸마다** 경계·장애물을 검증해야 하는 격자 시뮬레이션. 방향 벡터(`dr`, `dc`)로 분기를 압축하는 것이 핵심.

## 📝 문제
- 공원(2차원 배열)의 시작점 `S`에서 시작해, `routes`의 명령(예: `"E 2"`)을 순서대로 수행한다.
- 이동 경로에 장애물(`X`)이 있거나 공원을 벗어나면 그 명령은 **무시**한다.
- 모든 명령 수행 후 최종 좌표 `[행, 열]`을 반환.

## 💡 접근
- **시작점 찾기** → **명령(방향·거리) 해석** → **이동 경로 내 장애물·경계 검증** → **좌표 업데이트**.
- **방향 벡터 활용**: 동(`E`)·서(`W`)·남(`S`)·북(`N`)을 `if-else`로 나열하는 대신 `dr`, `dc` 단위 이동량으로 정의하면 코드가 1/4로 줄고 실수도 준다.
- **매 걸음 검증(Step-by-step)**: 최종 목적지만이 아니라 **지나가는 경로의 모든 칸**이 유효한지 확인해야 한다.
- **효율**: `boolean[][]`을 새로 만들지 말고 `park[i].charAt(j)`로 장애물(`'X'`)을 직접 검사하는 편이 메모리·시간에 유리하다.

## ⌨️ 풀이

```java
package lab.wy.programmers.구현;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class 공원산책_Refactored {

    @Test
    void test() {
        Assertions.assertArrayEquals(new int[]{2, 1}, solution(new String[]{"SOO", "OOO", "OOO"}, new String[]{"E 2", "S 2", "W 1"}));
        Assertions.assertArrayEquals(new int[]{0, 0}, solution(new String[]{"OSO", "OOO", "OXO", "OOO"}, new String[]{"E 2", "S 3", "W 1"}));
    }

    public int[] solution(String[] park, String[] routes) {
        // 명확한 가로/세로 길이 정의 (H: 행의 개수, W: 열의 개수)
        int H = park.length;
        int W = park[0].length();

        // 시작 위치(r: Row, c: Col) 찾기
        int r = 0, c = 0;
        for (int i = 0; i < H; i++) {
            if (park[i].contains("S")) {
                r = i;
                c = park[i].indexOf("S");
                break;
            }
        }

        for (String route : routes) {
            String[] parts = route.split(" ");
            String dir = parts[0];
            int steps = Integer.parseInt(parts[1]);

            // 방향에 따른 단위 이동량
            int dr = 0, dc = 0;
            switch (dir) {
                case "N": dr = -1; break;
                case "S": dr = 1; break;
                case "W": dc = -1; break;
                case "E": dc = 1; break;
            }

            // 임시 좌표로 이동 경로 전체 검증
            int nr = r;
            int nc = c;
            boolean isValid = true;

            for (int i = 0; i < steps; i++) {
                nr += dr;
                nc += dc;

                // 경계를 벗어나거나 장애물(X)을 만난 경우
                if (nr < 0 || nr >= H || nc < 0 || nc >= W || park[nr].charAt(nc) == 'X') {
                    isValid = false;
                    break;
                }
            }

            // 모든 걸음이 안전했을 때만 실제 좌표 업데이트
            if (isValid) {
                r = nr;
                c = nc;
            }
        }

        return new int[]{r, c};
    }
}
```

> **핵심 개선**
> - **가독성**: `maxWidth`/`maxHeight` 대신 행(Row)·열(Col)을 뜻하는 `H`, `W`, `r`, `c`로 좌표계 오해를 차단.
> - **유지보수**: 4방향 분기를 `switch` 하나로 압축해 중복 제거.
> - **효율**: 추가 `boolean[][]` 없이 `park` 배열에서 `charAt()`으로 직접 검사.

## ⏱️ 복잡도
- **시간**: `O(routes 길이 × 최대 이동 거리)` — 각 명령마다 거리만큼 경로를 훑는다. 격자 크기가 작아 사실상 상수 수준.
- **공간**: `O(1)` — 별도 맵을 만들지 않고 원본 `park`를 직접 참조.

## 📎 오답 노트 (원본 코드에서 짚은 점)
- **행(Row)/열(Column) 명칭 뒤바뀜**: `maxWidth = park.length`(행 개수), `maxHeight = park[0].length()`(열 개수)로 명명했는데, **Width는 열의 개수, Height는 행의 개수**다. 정방형이 아닌 직사각형 배열에서 `IndexOutOfBoundsException`의 주원인이 된다.
- **임시 좌표 변수 일관성**: `E` 방향 검증에서 `!map[currentPointX][tempPointY + 1]`처럼 `current`와 `temp`를 섞어 썼다. `E`는 행이 안 변해 우연히 통과했지만, 임시 좌표를 만들었다면 검증에도 임시 변수(`tempPointX`, `tempPointY`)를 일관되게 써야 안전하다.
- **잘한 점**: 이동 중 실패 여부를 `failFlg`로 추적해 경로 검증을 제대로 구현한 부분.

---
## 🔗 관련
- [(Algorithm) 바탕화면정리 - 핵심 개념 및 특징 정리]([Algorithm]%20바탕화면정리%20-%20핵심%20개념%20및%20특징%20정리.md) — 같은 2차원 격자 탐색 계열

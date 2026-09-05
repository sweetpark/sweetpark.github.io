---
title: "단어변환"
tags: [학습, 코딩테스트, BFSDFS, 프로그래머스, 알고리즘, BFS]
created: 2026-05-26
modified: 2026-09-05
---

# 단어변환

> [!NOTE]
> 프로그래머스 Lv3 · BFS(객체 상태 관리)
> 2차원 지도가 아닌 **문자열(객체) 간 관계**를 탐색하는 BFS. 큐에 인덱스가 아니라 **현재 단어 + 누적 변환 횟수**를 묶은 상태를 넣어야 한다.

## 📝 문제
- `begin`에서 한 번에 한 글자씩 바꿔 `target`으로 변환한다. 단, 중간 단어는 `words` 배열에 있는 것만 사용 가능.
- 최소 변환 횟수를 구한다(불가능하면 0).

## 💡 접근
- 한 글자만 다른 단어끼리 간선이 생기는 **암시적 그래프의 최단 경로** → BFS.
- 큐에 `WordState(String word, int count)` 형태의 상태를 넣는다.
- **방문 처리 타이밍**: 큐에서 꺼낼 때가 아니라 **큐에 넣는 순간** `visited[i] = true` → 같은 단어 중복 삽입 방지.
- BFS는 **딱 한 번만** 호출한다(`begin`에서 시작).

## ⌨️ 풀이

> [!NOTE]
> 원문에 오답노트·체크리스트만 있고 완성 코드가 없어 표준 BFS 풀이를 보강함(사실 확인 권장).

```java
import java.util.ArrayDeque;
import java.util.Queue;

class Solution {

    public int solution(String begin, String target, String[] words) {
        boolean[] visited = new boolean[words.length];
        Queue<Object[]> queue = new ArrayDeque<>();
        queue.offer(new Object[]{begin, 0});

        while (!queue.isEmpty()) {
            Object[] cur = queue.poll();
            String word = (String) cur[0];
            int count = (int) cur[1];

            if (word.equals(target)) {
                return count;
            }

            for (int i = 0; i < words.length; i++) {
                if (!visited[i] && isConvertible(word, words[i])) {
                    visited[i] = true;                       // 큐에 넣는 순간 방문 처리
                    queue.offer(new Object[]{words[i], count + 1});
                }
            }
        }

        return 0; // target 도달 불가
    }

    // 정확히 한 글자만 다른지 검사
    private boolean isConvertible(String a, String b) {
        int diff = 0;
        for (int i = 0; i < a.length(); i++) {
            if (a.charAt(i) != b.charAt(i)) {
                diff++;
            }
        }
        return diff == 1;
    }
}
```

## ⏱️ 복잡도
- **시간**: `O(W² × L)` — 단어 수 `W`, 단어 길이 `L`. 각 단어에서 다른 모든 단어와 글자 비교.
- **공간**: `O(W)` — 방문 배열 + 큐.

## 📎 오답 노트 (내가 놓쳤던 부분)
- **탐색 상태 공유(카운트 섞임)**: `int count`를 `while` 밖에 두고 여러 경로가 공유해, A 경로에서 증가한 값이 B 경로에 영향을 줬다. → 상태(count)를 큐에 함께 넣어야 한다.
- **시작점 오해**: `begin`은 배열에 없는데, 배열 내부 모든 단어에서 무의미한 BFS를 여러 번 시작하려 했다. → BFS는 `begin`에서 1번만.
- **잘못된 비교 대상**: '현재 단어'와 '다음 후보'를 비교해야 하는데 '시작 단어'와 '목표'를 직접 비교해 탐색이 조기 종료됐다.
- **큐 생명주기 실수**: `poll` 직후 `peek()`으로 값을 참조하려 했다(이미 꺼내서 맨 앞엔 다른 경로 데이터). → 헬퍼에 '현재 단어'와 '누적 횟수'를 직접 파라미터로 넘겨 해결.

---
## 🔗 관련
- [(Algorithm) 네트워크 - 핵심 개념 및 특징 정리]([Algorithm]%20네트워크%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 무인도여행 - 핵심 개념 및 특징 정리]([Algorithm]%20무인도여행%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Algorithm) 경주로건설 - 핵심 개념 및 특징 정리]([Algorithm]%20경주로건설%20-%20핵심%20개념%20및%20특징%20정리.md) — BFS 그래프 탐색 계열

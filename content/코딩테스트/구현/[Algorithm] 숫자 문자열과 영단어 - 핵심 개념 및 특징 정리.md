---
title: "숫자 문자열과 영단어"
tags: [학습, 코딩테스트, 구현, 프로그래머스, 알고리즘, 문자열파싱]
created: 2026-03-08
modified: 2026-09-05
---

# 숫자 문자열과 영단어

> [!NOTE]
> 프로그래머스 · 문자열 파싱
> 숫자와 영어 숫자 단어가 섞인 문자열을 숫자로 변환하는 문제(예: `one4seveneight → 1478`). 실전에선 **영단어 → 숫자 치환(replace)** 이 가장 깔끔하다.

## 📝 문제
- 문자열에 포함된 숫자와 영어 숫자 단어(`zero`~`nine`)를 모두 숫자로 바꿔 정수로 반환한다.
- 예: `one4seveneight → 1478`, `23four5six7 → 234567`.

## 💡 접근
세 가지 풀이 패턴이 있다.

| 패턴 | 난이도 | 코테 추천 |
| --- | --- | --- |
| replace 치환 | ⭐ | ⭐⭐⭐⭐⭐ |
| StringBuilder 파싱 | ⭐⭐⭐ | ⭐⭐ |
| Trie / Dictionary parsing | ⭐⭐⭐⭐ | ⭐ |

문자열 길이 제한이 최대 50이라 성능 걱정이 없으므로 **replace 치환이 베스트**다.

## ⌨️ 풀이

**패턴 1 — Replace (Best Practice)**
영단어를 인덱스 숫자로 치환한 뒤 `Integer.parseInt`.

```java
class Solution {

    public int solution(String s) {
        String[] words = {
            "zero", "one", "two", "three", "four",
            "five", "six", "seven", "eight", "nine"
        };

        for (int i = 0; i < words.length; i++) {
            s = s.replace(words[i], String.valueOf(i));
        }

        return Integer.parseInt(s);
    }
}
```

**패턴 2 — Map + 직접 파싱 (원본 작성 방식)**
문자를 하나씩 읽어 숫자는 바로 누적, 문자는 `StringBuilder`에 모으다가 `Map`에 존재하는 단어가 완성되면 숫자로 변환. 일반적인 파서 로직 학습에 좋으나 코드가 길고 가독성은 replace보다 떨어진다.

```java
Map<String, Integer> numberMap = Map.ofEntries(
    Map.entry("zero", 0), Map.entry("one", 1), Map.entry("two", 2),
    Map.entry("three", 3), Map.entry("four", 4), Map.entry("five", 5),
    Map.entry("six", 6), Map.entry("seven", 7), Map.entry("eight", 8),
    Map.entry("nine", 9)
);

StringBuilder result = new StringBuilder();
StringBuilder sb = new StringBuilder();

for (char ch : s.toCharArray()) {

    if (Character.isDigit(ch)) {
        result.append(ch);
        continue;
    }

    sb.append(ch);

    if (numberMap.containsKey(sb.toString())) {
        result.append(numberMap.get(sb.toString()));
        sb.setLength(0);
    }
}

return Integer.parseInt(result.toString());
```

## ⏱️ 복잡도
- **시간**: `O(N)` — 문자열 길이에 비례(정규식/replace 내부도 문자열 길이 기준).
- **공간**: `O(N)`.

## 📎 문자열 파싱 패턴
| 문제 유형 | 패턴 |
| --- | --- |
| 문자 + 숫자 섞임 | StringBuilder |
| 단어 → 숫자 변환 | replace |
| 문자열 계산기 / 괄호 파싱 | Stack |
| 토큰 분석 | Tokenizer |

---
## 🔗 관련
- [(Algorithm) 신규아이디추천 - 핵심 개념 및 특징 정리]([Algorithm]%20신규아이디추천%20-%20핵심%20개념%20및%20특징%20정리.md) — 문자열 정제/변환 계열
- [(Algorithm) 60일 계획 - 핵심 개념 및 특징 정리](../기획/[Algorithm]%2060일%20계획%20-%20핵심%20개념%20및%20특징%20정리.md) — 1~20일차 학습 커리큘럼에서 참조하는 문제

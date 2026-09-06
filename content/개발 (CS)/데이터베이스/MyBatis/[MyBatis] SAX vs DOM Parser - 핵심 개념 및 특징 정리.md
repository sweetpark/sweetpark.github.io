---
title: "SAX vs DOM Parser"
tags: [학습, 개발-CS, 데이터베이스, MyBatis, XML]
modified: 2026-09-05
---

# SAX vs DOM Parser

> [!NOTE]
> MyBatis 동적 쿼리(`<if>`, `<where>`, `<choose>` 등)를 정적 분석할 때 SAX 대신 DOM 파서를 선택한 이유와, JSqlParser 통과용 가짜 SQL(Dummy SQL)을 안전하게 조립하는 전략 정리.
> 같은 도구의 관련 기술 결정은 [(MyBatis) MyBatis 동적 SQL 정적분석 - 핵심 개념 및 특징 정리]([MyBatis]%20MyBatis%20동적%20SQL%20정적분석%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.

## ⚙️ 구현

### 1. 쿼리 뽑아내는 데는 DOM vs SAX?
무조건 DOM 파서가 훨씬 낫다. SAX가 메모리나 속도 면에서 유리한 것은 '단순히 파일 경로만 찾거나 단순 텍스트만 뽑아낼 때'의 이야기이고, 본격적으로 동적 쿼리(`<if>`, `<where>`, `<choose>` 등)를 조작·분석해야 하는 경우에는 DOM이 압도적으로 유리하다.

- **이유 1: MyBatis 파일 크기는 DOM이 버티기에 충분함** — 매퍼 XML 파일이 아무리 커봐야 수천 줄 단위. 기가바이트 단위의 데이터성 XML이 아니기 때문에 DOM으로 한 번에 메모리에 트리 구조로 올려도 성능에 전혀 무리가 없음.
- **이유 2: 중첩 태그(Nested Tags) 처리의 지옥** — MyBatis 쿼리는 `<where>` 안에 `<if>`가 있고, 그 안에 또 `<choose>`가 있는 등 구조가 중첩되어 있음. SAX는 스트림 방식이라 "지금 내가 어느 태그 안에 있지?"라는 상태(State)를 개발자가 일일이 코드로 추적해야 함. 반면 DOM은 이미 트리 구조로 만들어져 있어서 `node.getParentNode()`나 하위 노드 순회(Traverse)를 통해 구조를 파악하고 조작하기가 훨씬 쉬움.

### 2. 정규식(`replaceAll`)으로 동적 쿼리와 문법을 치환하는 게 나을까?
`#{}` 파라미터 변환은 정규식이 최고지만, `<if>`나 `<where>` 같은 XML 태그를 정규식으로 지우는 건 절대 비추천. JSqlParser는 완벽하게 문법이 맞는 순수 SQL(Valid SQL)이 아니면 자비 없이 `ParseException`을 던진다.

- **🟢 정규식이 정답인 곳: 파라미터 바인딩** — `#{userId}`, `${status}` 같은 것들을 JSqlParser가 이해할 수 있는 `?`나 더미 문자열로 치환할 때는 `replaceAll("#\\{[^}]*\\}", "?")` 같은 정규식이 가장 빠르고 정확함.
- **🔴 정규식이 독이 되는 곳: 동적 태그 제거 ('Dangling AND' 문제)** — 정규식이나 DOM의 `getTextContent()`로 XML 태그 껍데기만 싹 날려버리면 문제가 발생한다. 예를 들어:
    ```xml
    SELECT * FROM users
    <where>
        <if test="name != null"> AND name = #{name} </if>
    </where>
    ```
    태그만 날리면 `SELECT  FROM users AND name = ?`가 되어 `WHERE` 키워드는 날아가고 `AND`는 갈 곳을 잃는다. JSqlParser는 이 문장을 보고 파싱 에러를 뱉는다.

### 💡 그럼 어떻게 해결해야 할까? (Best Practice)
가장 추천하는 방식은 "DOM 트리를 순회하면서, JSqlParser가 에러를 뱉지 않는 문법적으로 완벽한(하지만 의미론적으로는 모든 조건을 포함하는) 가짜 SQL을 조립하는 것"이다.
1. `<where>` 태그를 만나면: 무조건 `WHERE 1=1`이라는 텍스트로 치환
2. `<if>` 태그 안의 텍스트를 읽을 때: 맨 앞에 있는 `AND`나 `OR`를 정규식으로 살짝 제거해 주거나, 1=1 뒤에 자연스럽게 붙게 둠
3. `<foreach>` 태그를 만나면: `IN (?, ?, ?)`처럼 JSqlParser가 배열 조건으로 인식할 수 있는 적당한 더미 포맷으로 치환

DOM의 노드 탐색 능력 + 정규식의 텍스트 치환 능력을 섞어 써야만 JSqlParser라는 깐깐한 문지기를 통과할 수 있는 쿼리를 만들어 낼 수 있다.

---
title: "Stream·Generic·Lambda로 중복 코드 제거"
tags: [학습, 토이프로젝트, Java, 리팩토링]
created: 2026-09-05
modified: 2026-09-05
---

# Stream·Generic·Lambda로 중복 코드 제거

> [!NOTE]
> 칵테일 맛/재료/추천 맵핑 리스트를 응답 DTO(Map)로 변환하는 반복 코드를, 제네릭 메서드 + 람다로 통합한 리팩토링 기록.

## Before — 유사 구조가 반복되는 코드

맛(Taste), 재료(Ingredient), 추천(Recommend) 3개 매핑 리스트를 각각 `Map`으로 변환하는 메서드가 거의 동일한 구조로 3번 반복되어 있었다.

```java
private List<Map<String,Object>> getResTastes(List<MappingTaste> tastes){
    Map<String, Object> tasteMap = new HashMap<>();
    List<Map<String, Object>> tastesMaps = new ArrayList<>();
    for (MappingTaste taste : tastes) {
        tasteMap.put("category", taste.getTasteCategory());
        tasteMap.put("tasteDetail", taste.getTasteDetail());
        tastesMaps.add(tasteMap);
    }
    return tastesMaps;
}

private List<Map<String, Object>> getResIngredients(List<MappingIngredient> ingredients){
    List<Map<String,Object>> ingredientMaps = new ArrayList<>();
    Map<String, Object> ingredientMap = new HashMap<>();
    for (MappingIngredient ingredient : ingredients) {
        ingredientMap.put("ingredient", ingredient.getIngredient());
        ingredientMap.put("unit", ingredient.getUnit());
        ingredientMap.put("quantity", ingredient.getQuantity().toString());
        ingredientMaps.add(ingredientMap);
    }
    return ingredientMaps;
}

private List<Map<String ,Object>> getResRecommends(List<MappingRecommend> recommends){
    List<Map<String, Object>> recommendMaps = new ArrayList<>();
    Map<String, Object> recommendMap = new HashMap<>();
    for (MappingRecommend recommend : recommends) {
        recommendMap.put("mood", recommend.getMood());
        recommendMap.put("situation", recommend.getSituation());
        recommendMap.put("season", recommend.getSeason());
        recommendMaps.add(recommendMap);
    }
    return recommendMaps;
}
```

세 메서드 모두 "리스트를 순회하며 각 항목을 Map으로 변환해 리스트에 담는다"는 동일한 골격을 가지고 있어, 공통 부분을 제네릭 메서드로 추출하고 항목별 매핑 로직만 람다로 주입하는 방향으로 리팩토링했다.

## After — 제네릭 + 람다 적용

```java
private <T> List<Map<String, Object>> convertToMapList(List<T> list, Function<T, Map<String,Object>> mapper){
    return list.stream()
            .map(mapper)
            .collect(Collectors.toList());
}

private List<Map<String, Object>> getResTastes(List<MappingTaste> tastes){
    return convertToMapList(tastes, taste -> {
        Map<String, Object> map = new HashMap<>();
        map.put("category", taste.getTasteCategory());
        map.put("tasteDetail", taste.getTasteDetail());
        return map;
    });
}

private List<Map<String, Object>> getResIngredients(List<MappingIngredient> ingredients){
    return convertToMapList(ingredients, ingredient -> {
        Map<String, Object> map = new HashMap<>();
        map.put("ingredient", ingredient.getIngredient());
        map.put("unit", ingredient.getUnit());
        map.put("quantity", ingredient.getQuantity().toString());
        return map;
    });
}

private List<Map<String, Object>> getResRecommends(List<MappingRecommend> recommends){
    return convertToMapList(recommends, recommend -> {
        Map<String, Object> map = new HashMap<>();
        map.put("mood", recommend.getMood());
        map.put("situation", recommend.getSituation());
        map.put("season", recommend.getSeason());
        return map;
    });
}
```

## 정리

- **Stream**: 리스트 순회 + 변환(`map`) + 수집(`collect`)을 선언적으로 표현해 for문 없이 반복 로직을 축약
- **Generic (`<T>`)**: `MappingTaste`, `MappingIngredient`, `MappingRecommend`처럼 타입이 다른 입력에도 하나의 메서드(`convertToMapList`)를 재사용 가능하게 함
- **Lambda (`Function<T, Map<String,Object>>`)**: 타입별로 달라지는 "필드를 Map에 담는 방법"만 호출부에서 주입 — 공통 골격(순회+수집)과 가변 로직(필드 매핑)을 분리

이 리팩토링 이전에는 Provider(Kakao/Naver/Google/Apple)별로 제각각이던 소셜 로그인 로직도 유사한 문제를 안고 있었는데, 그쪽은 Strategy + Factory 패턴으로 해결했다. 자세한 내용은 [[구현] OAuth 소셜 로그인 설계 (code 기반 인증, Strategy+Factory)] 문서 참고.

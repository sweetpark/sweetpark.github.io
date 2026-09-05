---
title: "테스트 (Junit5)"
tags: [학습, 개발-CS, 언어, JUnit5, Mockito]
created: 2026-09-05
modified: 2026-09-05
---

# 테스트 (Junit5)

> [!NOTE]
> Mockito의 `when`/`any`/`thenAnswer`/`verify` 사용법 정리.
> Onz(칵테일 플랫폼) 프로젝트에서 이관.

## 🧱 기술 스택
JUnit5, Mockito

## ⚙️ 구현

> [!IMPORTANT]
> 확인 필요: 원본 노트에 "Mock이란?" 항목 내용이 비어 있음.

- Mock이란?
    -
- when, any
    - **when()**
        - 목 객체의 메서드 호출에 대해 예상되는 행동을 정의합니다.
    - **any()**
        - 특정 타입에 대한 임의의 값을 매칭하여, 인자에 구애받지 않고 스텁을 적용할 수 있습니다.
    - **thenAnswer()**
        - 메서드 호출 시 전달된 인자 등 실행 상황에 따라 동적으로 반환 값을 계산할 때 사용합니다.

```java
// #1. when
// MyService 인터페이스가 있고, 그 안에 getValue(String input) 메서드가 있다고 가정합니다.
MyService myService = mock(MyService.class);

// "hello"라는 인자로 호출되면 "world"를 반환하도록 설정
when(myService.getValue("hello")).thenReturn("world");

// 테스트에서 호출하면, "world"가 반환됩니다.
assertEquals("world", myService.getValue("hello"));

// #2. any
// getValue() 메서드에 대해, String 타입의 어떤 인자라도 "default"를 반환하도록 설정
when(myService.getValue(any(String.class))).thenReturn("default");

// "hello", "test", "anything" 등 어떤 문자열이 전달되더라도 "default"가 반환됩니다.
assertEquals("default", myService.getValue("hello"));
assertEquals("default", myService.getValue("test"));

// #3. thenAnsewer

// anyInt()로 어떤 정수 인자가 전달되더라도, 그 인자를 두 배로 만들어 반환하도록 설정
// 인자가 넘어왔을때 처리되어야하는 값 설정을 위한 람다식
when(myService.calculate(anyInt())).thenAnswer(invocation -> {
    // invocation.getArgument(0)는 메서드에 전달된 첫 번째 인자 값을 가져옵니다.
    int input = invocation.getArgument(0);
    return input * 2;
});

// 테스트: 전달한 값의 두 배가 반환되어야 합니다.
assertEquals(10, myService.calculate(5));   // 5 * 2 = 10
assertEquals(20, myService.calculate(10));  // 10 * 2 = 20
```

- **verify(cocktailRepository, times(1))**
    - `verify`는 목 객체의 특정 메서드 호출이 발생했는지 확인하는 Mockito의 검증 기능입니다.
    - `times(1)`은 해당 메서드가 정확히 한 번 호출되었어야 함을 의미합니다.
- **save(any(Cocktail.class))**
    - `save`는 검증 대상 메서드입니다.
    - `any(Cocktail.class)`는 매처(Matcher)로, save() 메서드에 전달된 인자가 Cocktail 클래스의 어떤 인스턴스라도 상관없음을 의미합니다.

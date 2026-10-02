---
title: "[기초] Annotation"
tags: [학습, 개발-CS, 언어, JAVA, 개발, 어노테이션]
created: 2026-09-05
modified: 2026-09-05
---

# [기초] Annotation

> [!NOTE]
> Java 어노테이션 — 코드에 특별한 의미/기능을 부여하는 메타데이터.

## 📌 개념

- Java에서 의미: 코드 사이에 주석처럼 쓰여서 특별한 의미, 기능을 수행하도록 하는 기술
    - 추가적인 정보를 제공해주는 메타데이터라고 볼 수 있음

> [!NOTE]
> meta data : 데이터를 위한 데이터 (데이터 설명을 위한 데이터)

```java
@Target({ElementType.[적용대상]})
@Retention(RetentionPolicy.[정보유지되는 대상])
public @interface [어노테이션명]{
    public 타입 elementName() [default 값]
    ...
}
```

`@Target`에는 어떠한 값(ex : 클래스, 필드, 메서드 ...)에 어노테이션을 적용할 것인지 나타낼 수 있는데 넣을 수 있는 값은 다음 표와 같다.

| ElementType 열거 상수 | 적용대상 |
| --- | --- |
| TYPE | 클래스, 인터페이스, 열거 타입 |
| ANNOTATION_TYPE | 어노테이션 |
| FIELD | 필드 |
| CONSTRUCTOR | 생성자 |
| METHOD | 메소드 |
| LOCAL_VARIABLE | 로컬 변수 |
| PACKAGE | 패키지 |

`@Retention`에는 어노테이션 값들을 언제까지 유지할 것인지 값을 입력하는데 각 값이 가지는 의미는 다음 표와 같다. 보통 어노테이션은 Runtime시에 많이 사용하므로 대부분의 어노테이션의 Retention 값은 RUNTIME으로 되어있다.

| RetentionPolicy 열거 상수 | 설명 |
| --- | --- |
| SOURCE | 소스상에서만 어노테이션 정보를 유지한다. 소스 코드를 분석할 때만 의미가 있으며, 바이트 코드 파일에는 정보가 남지 않는다. |
| CLASS | 바이트 코드 파일까지 어노테이션 정보를 유지한다. 하지만 리플렉션을 이용해서 어노테이션 정보를 얻을 수는 없다. |
| RUNTIME | 바이트 코드 파일까지 어노테이션 정보를 유지하면서 리플렉션을 이용해서 런타임에 어노테이션 정보를 얻을 수 있다. |


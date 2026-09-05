---
title: "[JAVA] java.util.Arrays"
tags: [프로그래밍 언어, JAVA]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA] java.util.Arrays

1. 유틸리티 설명  
2. 주요 메서드

## 유틸리티 설명

[java.util.Arrays]  
- JAVA에서 배열을 조작하는 유틸리티 메서드를 제공하는 클래스  
- 배열을 정렬하거나, 검색하거나, 복사하거나, 배열의 내용을 비교하는 등의 작업을 간편하게 수행

## 주요메서드

*   sort()
    *   배열을 정렬하는 메서드
    *   오름차순으로 기본 정렬
    *   숫자나 문자열등의 배열을 간판하게 정렬

```java
int[] arr = {5,3,6,1};
Arrays.sort(arr);
```

*   binarySearch()
    *   배열에서 특정 값을 이진탐색으로 찾음
    *   **배열이 이미 정렬되어있어야함**
    *   값이 있는 위치의 인덱스를 반환 (값이 없으면 음수 값 반환)

```java
int index = Arrays.binarySearch(arr,3);
```
```java
boolean isEqual = Arrays.equals(arr1,arr2);
```

*   fill()
    *   배열의 모든 요소를 특정 값으로 채움

```java
Arrays.fill(arr,0);
```

*   copyOf() , copyOfRange()
    *   배열을 복사하는 메서드
    *   copyOf() : 배열 전체 복사
        *   copyOf(복사할 배열, 새로운 배열 크기)
            *   새로운 배열의 크기가 원본값보다 크면, 남은 공간은 0 또는 null로 채워짐
            *   작다면, 일부분만 복사됨
    *   copyOfRange() : 배열 특정범위 복사
        *   copyOfRange(복사할배열, 복사할배열 시작점, 복사할배열 끝지점)

```java
int [] arr = {1,2,3,4,5};

// newArr = {1,2,3,4,5}
int[] newArr = Arrays.copyOf(arr, arr.length);

// newRangeArr = {3,4,5} 인덱스 2부터 4까지 복사
int[] newRangeArr = Arrays.copyOf(arr, 2, 5);
```

*   toString()
    *   배열의 내용을 문자열로 변환하여 반환

```java
System.out.println(Arrays.toString(arr));
```

*   asList()
    *   배열을 List로 변환하는 메서드
    *   배열을 수정할 수 없는 고정크기의 List로 반환

```java
String[] arr = new String[5];
arr[0] = "a";  
arr[1] = "b";  

// 고정 크기 리스트 생성
List<String> list = Arrays.asList(arr);
```

> 원문: https://gradualprecision.tistory.com/137

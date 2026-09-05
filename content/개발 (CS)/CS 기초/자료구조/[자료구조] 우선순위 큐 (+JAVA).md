---
title: "[자료구조] 우선순위 큐 (+JAVA)"
tags: [알고리즘 & 자료구조, 자료구조]
created: 2026-09-05
modified: 2026-09-05
---

# [자료구조] 우선순위 큐 (+JAVA)

## 우선순위 큐

일반적인 큐는 FIFO(First In First Out) 구조로 먼저 삽입된 값이 먼저 나오게 되는 구조이다.  
하지만, 우선순위 큐의 경우 FIFO구조가 아닌 우선순위가 높은 순으로 먼저 나오게 되는 구조를 일컫는다.  
일반적으로 숫자의 경우 오름차순 및 내림차순을 이용하여 우선순위가 높은 순으로 구현을 하게 되고,  
객체의 경우 비교할 값을 설정하여 우선순위를 지정하게 된다.

## 우선순위 큐 선언방법

```java
import java.util.PriortyQueue;

PriortyQueue<객체> pq = new PriorityQueue<>();
```

*   객체
    *   Wrapper 클래스를 이용하여 기본형들을 사용
    *   또는, Custom 객체를 이용하여 사용

| 기본 타입 | Wrapper 클래스 |
| --- | --- |
| byte | Byte |
| short | Short |
| int | Integer |
| long | Long |
| float | Float |
| double | Double |
| char | Character |
| boolean | Boolean |

## 우선순위 큐 (우선순위 설정)

*   오름차순

```java
PriortyQueue<자료형> 변수명 = new PriortyQueue<>();
```

*   내림차순

```java
PriortyQueue<자료형> 변수명 = new PriortyQueue<>(Collections.reverseOrder());
```

*   사용자 정의

```java
PriortyQueue<자료형> 변수명 = new PriortyQueue<>(new Comparator<자료형>(){
     @Override
     public int compare(자료형 o1, 자료형 o2){
         return o1 - o2; // 오름차순
         return o2 - o1; // 내림차순
                                                                   
});
```

*   객체정렬

```java
static class 클래스명 implements Comparable<클래스명>
{
     @Override
     public int compareTo(클래스명 변수명){
           return this.클래스변수 - 변수명.클래스변수;
     }
}

PriorityQueue<클래스명> 변수명 = new PriortyQueue<>();
```

## 우선순위 큐 (Method)

*   삽입
    *   add(값) : true / 실패시 Exception 발생
    *   offer(값) : true / false
*   삭제
    *   remove() : 값 반환 / 실패시 Exception 발생
    *   remove(값) : true / false
    *   poll() : 값 반환 / null
*   큐의 front 값 확인
    *   element() : 값 반환 / 실패시 Exception 발생
    *   peek() : 값 반환 / null
*   큐 초기화
    *   clear()
*   큐 사이즈
    *   size() : size 반환
*   큐에 해당 원소 확인
    *   contains(값) : true / false
*   공백 큐 확인
    *   isEmpty() : true / false

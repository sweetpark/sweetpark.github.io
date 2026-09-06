---
title: "[Queue] 클래스 설명 및 메서드"
tags: [알고리즘 & 자료구조, 자료구조]
created: 2026-09-05
modified: 2026-09-05
---

# [Queue] 클래스 설명 및 메서드

## Queue?

**선입선출 (First In First Out)**  
- 먼저 들어온 값을, 먼저 내보내는 자료구조

```text
[ 삽입(enqueue) ]                         [ 삭제(dequeue) ]
       →  1  2  3  4  →
       Front(head)   Rear(tail)
       (먼저 나감)     (나중에 나감)
```

## Queue 클래스

```java
public interface Queue<E> extends Collection<E> {

    boolean add(E e);

    boolean offer(E e);

    E remove();

    E poll();

    E element();

    E peek();
}
```

| 메서드 | 반환값 | 설명 |
| --- | --- | --- |
| add | 삽입 성공시 (true) / 실패시 (false) | 큐에 삽입 |
| offer | 삽입 성공시 (true) / 실패시 (false) | 큐에 삽입 |
| remove | 삭제된 value 반환,value 없으면 NoSuchElementException 반환 | 큐에서 삭제 |
| poll | 삭제된 value 반환,value 없으면 null 반환 | 큐에서 삭제 |
| element | 큐 헤드에 위치한 value 반환,공백 큐이면 NoSuchElementException 반환 | 큐의 맨앞에 위치한 value 반환 |
| peek | 큐 헤드에 위치한 value 반환,공백 큐이면 null 반환 | 큐의 맨앞에 위치한 value 반환 |

## 추가적인 Queue 메서드

```java
public interface Collection<E> extends Iterable<E>{
    int size(){...};
    boolean isEmpty(){...};
    boolean contains(){...};
}
```

*   size()
    *   큐의 크기 반환
*   isEmpty()
    *   큐가 비어있는지 확인
*   contains()
    *   큐에 포함되어있는지 true/false반환

---
## 관련 문서
- [(큐) 백준 2164번](../../../코딩테스트/큐/[큐]%20백준%202164번.md) — LinkedList 기반 Queue(add/poll)로 카드 문제를 푸는 실전 활용 예

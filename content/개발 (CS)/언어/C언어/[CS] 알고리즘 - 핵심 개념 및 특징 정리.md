---
title: "알고리즘"
tags: [학습, 개발-CS, 언어, C언어, 개발, 연결리스트, 자료구조]
created: 2026-09-05
modified: 2026-09-05
---

# 알고리즘

> [!NOTE]
> C 연결리스트(Linked List) 구조·순회 방법과 리눅스 커널의 `list_for_each_entry()` 매크로.

## 📌 개념

### 연결리스트

- 구조체 특징 (예: `struct node* next`)
    - 구조체 선언 시 해당 구조체 크기만큼 저장 공간이 할당됨
- 재귀적으로 node 구조체가 사용됨
- node 구조체
    - `next`를 가리키는 node 포인터
    - data 영역의 data 값들 존재
    - node ( node, data )

| node1 |  | node2 |
| --- | --- | --- |
| node1→next | ⇒ | node2 |
| data |  | data |

| node2 |  | node3 |
| --- | --- | --- |
| node2→next | ⇒ | node3 |
| data |  | data |

### list_for_each_entry() 함수

> [!NOTE]
> `#include <linux/list.h>`

- linked list의 node를 순서대로 접근
- 파라미터
    - `pos` : 루프 문에 사용할 커서로써 항목을 임시로 저장
    - `head` : 리스트의 헤드로, 연결리스트의 시작 주소
    - `member` : node 링크드 리스트 멤버 변수

## 💻 예시

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct node{
    char *data; //연결리스트 가지고 있는 data 영역
    struct node* next;//연결리스트 다음 공간 할당 (data , node)
}NODE;

int main(){
    NODE* head = NULL; //시작지점 (data시작지점)
    head = (NODE*)malloc(sizeof(NODE));
    head->data = "start";

    NODE* node1=(NODE*)malloc(sizeof(NODE));
    head->next = node1; // 현재위치 -> head
    node1->data = "monday";

    NODE* node2 = (NODE*)malloc(sizeof(NODE));
    node1->next = node2;// 현재위치 -> node1
    node2->data = "tuesday";

    NODE* node3 = (NODE*)malloc(sizeof(NODE));
    node2->next = node3; // 현재위치 -> node2
    node3->data="wendsday";
    node3->next=NULL; // 현재위치 -> node3

    NODE* tmp =head;
    /*
    head <- tmp 시작
    [node영역]
    head -> node1 -> node2 -> node3 -> NULL (반복문 종료)

    [data영역]
    head->data = start
    node1->data = monday
    node2->data = tuesday
    node3->data = wendsday
    node3->NULL = 종료

    */
    while(tmp != NULL){
//*주의 (while ( tmp->next != NULL ) )
// 마지막 node에서 next는 NULL을 가리키므로 마지막 노드의 데이터를 가져오지 못함
// cf : do - while와 반대되는 의미 *(조건을 만족하지 않아도 한번은 수행)
        printf("%s\n",tmp->data);
        tmp= tmp->next;
    }
    return 0;
}
```

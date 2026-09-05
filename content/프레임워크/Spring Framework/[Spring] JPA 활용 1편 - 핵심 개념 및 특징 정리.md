---
title: "JPA 활용 1편"
tags: [학습, 개발-CS, CS-기초, Spring-Framework, 개발, Spring]
created: 2025년 3월 12일 오후 2:14
modified: 2026-09-05
---

# JPA 활용 1편

> [!NOTE]
> JPA 엔티티 설계 시 주의점(연관관계 주인, 지연로딩, 컬렉션 초기화), 변경 감지(Dirty Checking) vs merge, DTO 활용 등 김영한 JPA 활용 강의를 정리한다.

## 📌 개념

- 일대다 관계에서 연관관계의 주인은 “다” 쪽에 있다
- 무조건 사람의 말처럼 회원 또는 자동차를 중점으로 연결 짓는 것이 아닌, N 쪽에 속한 것을 더 중요하게 봐야할 수도 있음 (각각 독립적으로 보는 것이 맞음)

- 엔티티 설계시 주의점
    - setter를 최대한 사용하지 않도록 하자 ( 수정 point가 어딘지 알기가 힘들다.. 유지보수 힘듬…)

- 모든 연관관계는 지연로딩으로 설정
    - 지연로딩(LAZY)
        - 
    - 즉시로딩 (EAGER)
        - 한번 호출하면 관련된 모든 데이터를 가져오게됨 ( 연관된게 많으면 많을수록 쿼리 개수가 비약적으로 많아짐 (N + 1 문제)
        - ManyToOne , OneToOne … (*ToOne)은 기본적으로 “EAGER” 설정이다 (LAZY로 변경해줘야함)

- 컬렉션 초기화
    - 컬렉션은 필드에서 초기화 하는 것이 좋음
        - hibernate가 초기화 이후에 추적을 위해 wrapping하므로 추후에 건드리는 것은 의도치 않은 결과를 나을 수 있다
        - 하여, 아래처럼 초기화에만 사용하고 이후 수정은 못하게 막는게 좋음

```java
private List<Order> orders = new ArrayList<>();
```

### 모델 패턴

- 도메인 모델 패턴
    - 도메인에 비즈니스 로직을 추가하고, service 계층에서 호출정도만 하는 것
    - JPA를 사용시 주로 도메인 모델 패턴을 이용한다.
- 트랜잭션 스크립트 패턴
    - 도메인은 도메인 역할만 하고, service 계층에 비즈니스 로직을 구현

### 변경 감지와 merge

- Dutty Checking
    - 엔티티 값 변경시 JPA는 dutty check를 통해 자동으로 update 쿼리를 진행한다.
    - 데이터베이스의 식별자를 가지고 있는 데이터의 경우 → 준영속성 이라고 불린다
    
    > [!IMPORTANT]
    > 준영속 엔티티의 문제점
    > - JPA가 관리(영속성 컨텍스트)하고 있지 않아, 데이터를 변경해도 Dirty Checking이 일어나지 않아 자동으로 update 쿼리가 실행되지 않는다
    > - 해결(SOL): 변경 감지(병합 대신) 또는 merge 사용
    
- 변경감지
    
    ```java
    @Transactional
        public void updateItem(Long itemId, Book bookParam){
            Item findItem = itemRepository.findOne(itemId);
            findItem.setPrice(bookParam.getPrice());
            findItem.setName(bookParam.getName());
            findItem.setStockQuantity(bookParam.getStockQuantity());
            findItem.setId(bookParam.getId());
            
        }
    ```
    
- 병합 (merge)
    - Id 있는지 check 후 있으면 merge 진행
    
    ```java
    public void save(Item item){
            if (item.getId() == null){
                em.persist(item); // 등록할때까지 id가 생성되지 않으므로, 생성을 해준다
            }else{
                em.merge(item); // 이미 등록되어있어 가져다 사용하는 느낌
            }
        }
    ```
    

- 병합의 문제점
    - 모든 필드를 변경하기에, 필드값이 있지 않다면 null 로 업데이트를 진행할 수 있다 (왠만하면 변경감지를 이용하고, merge를 사용하지 말아야한다)

### DTO

- Data Transfer Object
- 서비스 계층에서 식별자와 변경할 데이터를 명확하게 파라미터로 넘기면 된다 ( 변경할 데이터 → DTO 파라미터 이용 // DTO 서비스계층에 클래스를 만들거나 파라미터 값을 만듬)

```java
@Controller
 @RequiredArgsConstructor
 public class ItemController {
     private final ItemService itemService;
/**
* 상품 수정, 권장 코드 */
     @PostMapping(value = "/items/{itemId}/edit")
     public String updateItem(@PathVariable Long itemId, @ModelAttribute("form")
 BookForm form) {
         itemService.updateItem(itemId, form.getName(), form.getPrice(),
  form.getStockQuantity());
         return "redirect:/items";
} }

/*
 form.getName(), form.getPrice(),
  form.getStockQuantity() 이걸 DTO 파라미터로 만들어도 된다. (ex Dto form)
	 
	 DTO 클래스 -> 서비스 계층에 정의

*/
```

### 문제) Validation 불가능

- Server Side Validation 하는 방법
    - @Valid 없음  → BindingResult result 를 활용할 수 없음
    - 다른 방법을 강구해봐야함

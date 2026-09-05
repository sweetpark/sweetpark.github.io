---
title: [트러블 슈팅]정상적인 update() 불가 (@InitBinder)
tags: [프로젝트, 게시판 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [트러블 슈팅]정상적인 update() 불가 (@InitBinder)

@InitBinder  
@PostConstruct

## @InitBinder

*   **입력 데이터 바인딩**을 담당하기 위한 메서드
*   컨트롤러 요청에 따라서, 해당 부분도 같이 호출됨
*   update로직은 제대로 동작하나, 새로운 url로 맵핑되었을때 @InitBinder도 동작을하여 이전의 값이 그대로 나오는 문제 발생

```java
@InitBinder
    private void init(WebDataBinder webDataBinder){
    
        Member member1 = new Member("admin","admin","admin","admin");
        Member member2 = new Member("test","test","test","seoul");
        Member member3 = new Member("test2","spring","test2","suwon");

        memberRepository.save(member1);
        memberRepository.save(member2);
        memberRepository.save(member3);
        
        //validate 구현체 등록
        webDataBinder.addValidators(bindingResultValidate);
    }
```

## @PostConstruct

*   해당 어노테이션은, 애플리케이션 시작시 딱 한번 호출되는 메서드
*   **초기화 작업으로는 사용하기 적절**
*   **@PostConstruct를 사용한 이후에, update() 정상 동작**

```java
@PostConstruct
    public void initData(){
        Member member1 = new Member("admin","admin","admin","admin");
        Member member2 = new Member("test","test","test","seoul");
        Member member3 = new Member("test2","spring","test2","suwon");

        memberRepository.save(member1);
        memberRepository.save(member2);
        memberRepository.save(member3);

    }
```

> 원문: https://gradualprecision.tistory.com/141

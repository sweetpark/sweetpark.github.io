---
title: "[JAVA 기술면접] 객체지향 특징 (4가지 특징, SOLID)"
tags: [기술면접, JAVA 관련 기술면접]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA 기술면접] 객체지향 특징 (4가지 특징, SOLID)

"자바 객체지향 특징"과 "SOLID 원칙"을 묻는 기술면접 단골 질문 정리 노트다. 핵심은 캡슐화·상속·추상화·다형성이라는 객체지향 4가지 특징이 무엇인지, 그리고 이를 실제 설계에 적용할 때 지켜야 할 SRP·OCP·LSP·ISP·DIP(SOLID) 5대 원칙이 각각 무엇을 요구하는지 설명할 수 있는지다. 즉 "개념을 안다"에서 그치지 않고 코드(예: 인터페이스 분리, 추상화 의존)로 원칙을 증명할 수 있는지가 면접에서 실제로 확인하려는 포인트다.

## 객체지향이란?

*   필요한 데이터를 추상화 시켜서 상태와 행위를 가진 객체를 만들어서 사용
*   절차적인 것과 달리, 객체들을 이용하여 유기적인 상호작용을 통해서 로직을 구성

장점  
- 코드 재사용성 용이  
- 유지보수의 편리함  
- 대형 프로젝트에 적합  
  
단점  
- 처리속도가 상대적으로 느림  
- 객체가 많으면 용량이 커짐  
- 설계시 많은 시간과 노력이 필요

## 객체지향의 4가지 특징

*   캡슐화
    *   접근제어자를 이용하여, 객체 안에 노출되어야할 것과 노출되지 말아야할 것을 정의하고 접근을 제어하여 은닉하는 것이 목적
    *   코드의 수정이 있을때도, 영향범위를 예측할 수 있어 유용함
*   상속
    *   부모 객체의 속성과 기능을 이어받아 사용이 가능
    *   필요에 따라, 자식객체에서만 특정하여 수정이 가능
*   추상화
    *   "공통의" 속성이나 기능을 묶어서 표현
    *   주로 추상화클래스 혹은 인터페이스를 이용하여 구현

추상클래스  
- **추상클래스의 경우,  인스턴스를 생성할 수 없으며** 하나 이상의 추상 메서드를 가질 수 있음  
**- 추상메서드의 경우 자식클래스에서 구현이 되어야함 (필수)  
**

*   **다형성**
    *   하나의 변수명, 함수명 등이 상황에 따라 다른의미로 해석
    *   Override , Overload 을 의미함

**Override : 메소드를 재정의 하는 것**  
**Overload : 매개변수의 타입과 개수를 다르게하여 매개변수에 따라 다르게 호출**

```java
public abstract class Animal{
    
    // 캡슐화 (private 접근제어자 사용)
    private String name;
    
    public Animal(String name){
        this.name =name;
    }
    
    // 추상메서드 (추상화)
    public abstract void makeSound();
    
    // 일반메서드
    public void sleep(){
        System.out.println(name + "is sleep");
    }
    
    // 캡슐화 (name 접근)
    public String getName(){
        return name;
    }
}

// 상속
class Dog extends Animal{
     
     public Dog(String name){
         super(name);
     }
     
     // 다형성
     @Override
     public void makeSound(){
         System.out.println("월월!");
     }
}

// 상속
class Cat extends Animal{
     
     public Cat(String name){
         super(name);
     }
     
     // 다형성
     @Override
     public void makeSound(){
         System.out.println("야옹!");
     }
}

public class Zoo{
    public static void main(String[]args){
        
        // 다형성 : 부모클래스 타입으로 객체 참조
        Animal dog = new Dog("개");
        Animal cat = new Cat("고양이");
        
        dog.makeSound();
        cat.makeSound();
     }
}
```

## 객체 지향 설계 5대 원칙 (SOLID)

*   SRP 단일 책임 원칙(Single Responsibility Principle)
    *   한 클래스는 하나의 책임만 가져야함
    *   여러개의 기능들을 한 클래스 내부에 다 구현한다면 SRP를 위반한 것
*   OCP 개방 폐쇄 원칙(Open/Closed Principle)
    *   확장에는 열려있으나, 변경에는 닫혀있어야함
    *   구현체마다 변경해야할 메서드가 있다면, 인터페이스를 활용하여 변경을 최소화해야함
    *   (새롭게 만드는 것은 변경이 아님)
*   LSP 리스코프 치환 원칙 (Liskov substitution Principle)
    *   자식 클래스가 부모클래스로 완벽하게 대체될 수 있어야함
    *   부모클래스의 구현에 경우 더하는 메서드를 구현을 했는데, 자식클래스에서 동일한 메서드를 빼는 기능을 구현한다면 서로 대체될 수 가없음 (리스코프 위반)
*   ISP 인터페이스 분리 원칙 (Interface segregation principle)
    *   인터페이스 한개로 다 처리하지 말고, 여러개의 인터페이스로 분리
    *   클라이언트들이 꼭 필요한 메서드만 이용이 가능해짐
    *   인터페이스를 분리하게 되면, 대체 가능성이 높아짐
*   DIP 의존관계 원칙 (Dependency inversion principle)
    *   추상화에 의존해야지, 구체화에 의존하면 안됨
    *   구현클래스에 의존하지 말고, 인터페이스에 의존해야함

```java
// ISP : 알림기능만 하는 인터페이스
interface Notifier{
    void send(String message);
}

class Email implements Notifier{
    @Override
    public void send(String message){
         System.out.println("sending email: " +message);
    }
}

class Sns implements Notifier{
    @Override
    public void send(String message){
         System.out.println("sending Sns: " +message);
    }
}

//SRP : 메시지 관리 클래스 (기능 1개)
class Message{
    
    private String content;
    
    public Message(String content){
        this.content = content;
    }
    
    public String getContent(){
        return content;
    }
}

class NotifierService{
     private Notifier notifier;
     
     // DIP 추상화에 의존
     public NotifierService(Notifier notifier){
         this.notifier = notifier;
     }
     
     public void notify(Message message){
         //LSP 원칙: 부모 타입(Notifier)에 의존해 자식 타입(Email, Sns)을 치환 가능
         notifier.send(message.getContent());
     }
}

public class Main{
    public static void main(String[] args){
         Message message = new Message("hello");
         
         Notifier email = new Email(); // OCP 쉽게 확장 가능
         // Notifier sns = new Sns();
         
         NotifierService service = new NotifierService(email);
         service.notify(message);
     }
}
```

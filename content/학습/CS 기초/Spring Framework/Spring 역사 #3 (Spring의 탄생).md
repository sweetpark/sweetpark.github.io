---
title: Spring 역사 #3 (Spring의 탄생)
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# Spring 역사 #3 (Spring의 탄생)

Spring

## Spring

*   프레임워크 계의 봄이 왔다는 의미에서 "Spring"이라 명칭
*   spring은 자바 언어 기반의 프레임워크이다.
*   spring boot의 경우 spring의 초기 설정 및, tomcat이 내장된 상태의 프로젝트를 만들때 사용한다.
*   객체 지향적으로 만들수 있도록 도와주는 역할

## 객체 지향이란?

*   객체지향 특징
    *   추상화
    *   캡슐화
    *   상속성
    *   다형성
*   객체지향 프로그래밍은 "유연하고 변경에 용이함"

## Spring은 객체 지향적으로 작성

*   역할 (Interface) 와 구현 (Instance)를 따로 분리해서 생각해야한다.
*   객체 지향 특징을 지키며 작성해야함
    1.  추상화 : interface를 이용하여 역할(ex 자동차)에 필요한 메서드를 정의한다.
    2.  상속성 : interface (또는 클래스)를 상속받아 구현체(ex 쏘나타, k5.. )를 만든다.
    3.  캡슐화 : 구현체 (클래스)에서 멤버변수의 함부로 접근할 수 없도록 private(접근지정자)를 이용해 접근을 제한한다.
    4.  다형성 : Override를 통해서 메서드를 구현하고, "부모 (인터페이스) = new 자식(구현체)"를 통해서 실행

```java
// 추상화
public interface Car{
	void type();
}
```
```java
//상속
public class Truck implements Car{
	@Override
    public void type(){
    	System.out.println(" 트럭 ");
    }
}

// 상속 + 캡슐화
public class Sonata implements Car{
	
    //캡슐화
    private String name;
    
    public void setName(String name)
    {
    	this.name = name;
    }
    
    @Override
    public void type(){
    	System.out.println("승용차");
    }
}
```
```java
//다형성
public class Info{
	public void findType(Car car){
    	car.type();
    }
}

public class Main{
	public static void main(String []args){
            Car car1 = new Truck();
            Car car2 = new Sonata();
        
            Info info = new Info();
            //다형성
            info.findType(car1);
            info.findType(car2);
  	}
}
```

##   
SOLID 준수하며 코드 작성

*   단일 책임 원칙 (Single Responsibility Principle, SRP)
    *   클래스는 논리적으로 하나의 책임만 가져야함
    *   ex) 파일 로직 , 파일 생성 로직, ... (각기 구분되어 class를 생성)
*   개방 폐쇄 원칙 (Open/Closed Principle , OCP)
    *   소프트웨어 개체는 확장에는 열려 있고, 수정에는 닫혀있음
    *   구현부가 달라진다고해서 인터페이스 또는 부모의 클래스가 수정되지 않아야함

```java
//OCP 준수
public interface Shape {
    int calculate();
}

public class Rectangle implements Shape {
    private int width;
    private int height;
    

    @Override
    public int calculateArea() {
        return width * height;
    }
}

public class AreaCalculator {
	// Shape 모양이 달라지더라도 수정되는 부분이 없음
    public int calculate(Shape shape) {
        return shape.calculate();
    }
}
```

*   리스코프 치환 원칙 (Liskov Substitution Principle, LSP)
    *   자식 클래스는 부모 클래스(인터페이스)의 역할을 대체할 수 있다.
    *   인터페이스 (부모클래스)에 정의되어있는 메서드는 자식클래스에서 구현이 가능해야한다.

```java
// LSP를 위반한 예
public class Bird {
    public void fly() {
        // 비행 로직
    }
    
    /*
    public void move(){
    	// 움직임 로직
    }
    
    
    */
}

public class Dog extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Dog cannot fly");
    }
    
    /*
    @Override
    public void move(){
    	// 움직임 로직 (뛰어다님)
    }
    
    */
}
```

*   인터페이스 분리 원칙 (Interface Segregation Principle, ISP)
    *   자식은 자신이 사용하지 않는 메서드에 의존하지 않아야함

```java
/*
// ISP를 준수하지 않은 예
public interface Workers{
    void work();
    void eat();
}
*/

// ISP를 준수한 예
public interface Workable {
    void work();
}

public interface Eatable {
    void eat();
}

// 다중 상속
public class HumanWorker implements Workable, Eatable {
    @Override
    public void work() {
        // 일하기
    }

    @Override
    public void eat() {
        // 식사하기
    }
}

public class RobotWorker implements Workable {
    @Override
    public void work() {
        // 일하기
    }
}
```

*   의존 역전 원칙 (Dependency Inversion Principle , DIP)
    *   추상화에 의존해야한다.
    *   생성자 주입 / setter 주입 / 필드 주입 으로 사용이 가능

```java
public interface Switchable(){
//...
}

public class LightBulb implements Switchable(){
//...
}

public class Switch{
	private Switchable device;
    
    // 생성자 주입
    public Swich(Switchable device){
        this.device =device;
    }

//...
}
public class Main {
    public static void main(String[] args) {
        
        Switchable lightBulb = new LightBulb(); // LightBulb 객체 생성
        
        // 생성자 주입을 통해 DI 진행
        Switch lightSwitch = new Switch(lightBulb); // LightBulb 객체를 Switch에 주입

        lightSwitch.operate(); // LightBulb의 turnOn 메서드를 호출
    }
}
```

##   
역할과 구현 분리시 주의할 점

*   인터페이스를 안정적으로 설계해야한다. (인터페이스가 잘못되었을 경우 고쳐야할 부분들이 많다...)
*   확장이 용이하게 설계 (ex 새로운 자동차가 추가되더라도 수정할 부분이 거의 없음)
*   유연하고 변경이 용이해야함

> 원문: https://gradualprecision.tistory.com/53

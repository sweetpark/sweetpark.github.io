---
title: "[기초] CLASS"
tags: [학습, 개발-CS, 언어, JAVA, 개발, 클래스, static]
created: 2026-09-05
modified: 2026-09-05
---

# [기초] CLASS

> [!NOTE]
> Java 클래스 정의, this, static, 싱글톤(singleton) 기초.

## 📌 개념

### class 생성

```java
public class 클래스명{
     멤버 변수1
     멤버 변수2
}

// 생성자
public 클래스명(){} // 기본 생성자
public 클래스명(매개변수1, 매개변수2){
     this.멤버변수1 = 매개변수1;
     클래스명.멤버변수2 = 매개변수2;
} // this 와 클래스명은 동일

// 멤버함수
public 반환형 함수명(매개변수){
     함수 본체;
}
```

- 매개변수: 임의의 변수뿐 아니라 클래스 및 클래스 멤버변수도 가능
- 생성자를 따로 지정할 경우 기본 생성자는 생성되지 않음
- `this`는 해당 인스턴스를 뜻함
- 인스턴스: 클래스를 이용하여 만든 객체

### class 이용

- `클래스명 인스턴스명 = new 클래스명();`
- 생성자에 매개변수가 있는 경우: `클래스명 인스턴스명 = new 클래스명(매개변수);`

### this

- `this` : 현재 자기 자신 인스턴스를 뜻함 (가리키는 주소를 가지고 있음)
- 생성자에서 다른 생성자를 부를 때 `this` 사용

```java
class Person(){
     String name;
     int age;

     public Person(){
          this("이름 없음", 1);
     }
     public Person(String name, int age){
          this.name = name;
          this.age = age;
     }

     Person p1 = new Person();
     System.out.println(p1);
     // 이름없음 , 1  출력
```

### 매개변수에 다른 클래스 삽입 가능

```java
public class Bus{
     int busNum;
     int money;

     public Bus(int busNum){
          this.busNum = busNum;
     }
     public void take(int money){
          this.money += money;
     // bus money
     }
```

```java
public class Student{
     String name;
     int money;
     public Student(String name, int money){
          this.name = name;
          this.money = money;
     }

     public void takeBus(Bus bus){
          bus.take(1000);
          money -= 1000;
     // Student money
     }
```

### static

- 모든 인스턴스가 공유하는 변수 (클래스 변수라고도 불림)
- 사용 방법: `static 자료형 변수이름`
- 주의) static을 이용한 함수 내에 멤버변수가 있으면 안 됨

```java
// 인스턴스가 생성되지 않아도 사용할 수 있는 static이므로, static 함수 내에 멤버변수를 사용할 수 없다.
public static int take(){
     studentName = "홍길동"; // 멤버변수 사용불가
     int i; // 지역변수는 사용가능
     return static변수;
}
```

| 변수 종류 | 선언 위치 | 특징 |
| --- | --- | --- |
| 멤버 변수 | 클래스 멤버 변수로 선언 | 인스턴스를 만들 때 생성 |
| static 변수 | 클래스 내부 선언 | 멤버변수보다 먼저 생성됨 (인스턴스 생성 전에 존재) |
| 지역변수 | 함수 내부 선언 | 함수 내부에서 사용 가능 |

### static 응용 (singleton)

- 여러 종류의 인스턴스 생성 방지

```java
public class Company{
     private static Company instance = new Company();
     // 인스턴스를 private하게 만들어 main에서 생성 못하게 함. (static은 공유)
     private Company(){}
     // 클래스 내부에서 인스턴스를 생성해야 함
     public static Company getInstance(){
          if(instance == null)
               instance = new Company();
          return instance;
     // 인스턴스 생성된 것을 반환해줌
     }
}
```

- `Company c1 = Company.getInstance();` : Company의 c1 변수에 클래스 내부에서 만들어진 인스턴스를 삽입
- `Company c2 = Company.getInstance();` : c1과 동일한 주소값을 가짐 (이름은 달라도 내부는 동일한 instance)
- singleton : 한 개의 인스턴스를 이용 (공유되는 인스턴스)

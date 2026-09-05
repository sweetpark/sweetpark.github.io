---
title: "직렬화/역직렬화"
tags: [학습, 개발-CS, CS-기초, 기초, 개발, 직렬화]
created: 2026-02-04
modified: 2026-09-05
---

# 직렬화/역직렬화

> [!NOTE]
> 객체를 바이트 배열로 바꾸는 직렬화와 그 역과정인 역직렬화의 개념, 관련 스트림 클래스, 그리고 실무에서의 의미(객체 ↔ JSON/XML)를 정리한다.

> [!IMPORTANT]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 직렬화

- 객체 → byte[]
    - 다른 시스템에서도 읽을 수 있도록 바이트형태로 바꾸는 작업을  “직렬화” 라고 한다.

### ByteArrayOutputStream

- outputStream으로서 byte로 바꾸어 저장할 수 있는 객체
- 직접 byte[] 배열을 주지않고, byte배열을 쌓을 수 있도록 도와주는 스트림
- byte[]배열을 사용하려면, toByteArray()로 빼야함

> [!NOTE]
> ObjectOutputStream
> 
> - outputStream을 연결하고, 객체를 직렬화하는 클래스
>     - write 메서드
>         - writeObject()를 이용하여 커스텀 클래스 직렬화가능
>         - writeXXX()을 이용하여 기본타입 직렬화 가능

```java
//직렬화 객체
@Component("exSerialize")
public class ExSerialize implements Serializable {
    private int id;
    private String data;
    transient private String password; // 직렬화 제외
    private int age;

    public ExSerialize(){}
    public ExSerialize(int id, String data, String password, int age){
        this.id = id;
        this.data = data;
        this.password = password;
        this.age = age;
    }

    @Override
    public String toString(){
        return "id : " +id + " data : " + data + " password : " + password + " age : " + age;
    }

}
```

```java
// 직렬화
ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
ObjectOutputStream objectOutputStream = new ObjectOutputStream(outputStream);
objectOutputStream.writeObject(new ExSerialize(1, "test", "password", 10));

// byte[] 추출
byte[] seiralize = outputStream.toByteArray();

// Base64로 인코딩
String base64Encode = Base64.getEncoder().encodeToString(seiralize);
```

### 역직렬화

- byte[] → 객체
    - 다른 시스템에서 준 데이터를 사용하기 쉽게 변환하는 작업을 “역직렬화” 라고한다.

### ByteArrayInputStream

- Byte[] 직렬화로 되어있는 값을 받는 stream

> [!NOTE]
> ObjectInputStream
> 
> - ByteArrayInputStream에 저장된 값들을 읽어오는 클래스
> - 해당 readObject()메서드로 변환 가능 (캐스팅 필요)
>     - read 메서드
>         - readObject()를 이용하여 커스텀 클래스 역직렬화가능
>         - readXXX()을 이용하여 기본타입 역직렬화 가능

```java
@Component("exSerialize")
public class ExSerialize implements Serializable {
    private int id;
    private String data;
    transient private String password; // 직렬화 제외
    private int age;

    public ExSerialize(){}
    public ExSerialize(int id, String data, String password, int age){
        this.id = id;
        this.data = data;
        this.password = password;
        this.age = age;
    }

    @Override
    public String toString(){
        return "id : " +id + " data : " + data + " password : " + password + " age : " + age;
    }

}

// 역직렬화
byte[] deserialized = Base64.getDecoder().decode(base64Encode);
ByteArrayInputStream inputStream = new ByteArrayInputStream(deserialized);
ObjectInputStream objectInputStream = new ObjectInputStream(inputStream);
ExSerialize exSerialize = (ExSerialize)objectInputStream.readObject();
System.out.println(exSerialize);
```

## 직렬화/역직렬화와 실무표현

> [!NOTE]
> - 직렬화
>     - 객체 ⇒ JSON/XML/YMAL
> - 역직렬화
>     - JSON/XML/YMAL ⇒ 객체

- 실무에서는 String과 객체 사이의 변환관계를 해당 용어로 많이 사용
    - **전통적 직렬화/역직렬화는 바이트와 객체간의 상호작용임**

> [!TIP]
> - Java 직렬화 대상 객체는 `Serializable`을 구현해야 하고, `transient` 필드는 직렬화에서 제외된다.
> - `serialVersionUID`를 명시하지 않으면 클래스 변경 시 역직렬화에서 `InvalidClassException`이 날 수 있다.
> - 자바 기본 직렬화는 보안·호환성 이슈로 실무에서는 JSON(Jackson) 직렬화를 더 많이 사용한다.

---
title: "[JAVA 기술면접] 라이브러리 활용"
tags: [기술면접, JAVA 관련 기술면접]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA 기술면접] 라이브러리 활용

## java.base 모듈

*   기본으로 가지고 있는 java 모듈

종류  
- java.lang : Java 기본클래스 포함 (Object, String, System ...)  
- java.util : 컬렉션 프레임워크와 유틸리티 (List, Map, Set)  
- java.io : 파일 입출력  
- java.nio : 비동기 입출력, 버퍼 ,채널, 파일경로/복사/이동/삭제 관련  
- java.net : 네트워크 프로그래밍 지원 모듈  
- java.security : 보안 및 암호화 관련 클래스  
- java.math : 대형정수 및 고정 소수점 숫자 다루는 클래스  
- java.time : 시간 및 날짜관련
```java
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.*;

public class App {
    public static void main(String[] args) throws Exception {
        
        String hello = "Hello";
        System.out.println(hello);

        //java.util - List사용
        List<String> list  = Arrays.asList("java", "hello");
        List<String> list2 = new ArrayList<>();

        for (String string : list) {
            System.out.println(string);
        }
        
        //java.time - 현재 날짜 시간
        LocalDateTime now = LocalDateTime.now();
        System.out.println(now);

        //java.nio.file - 파일경로 처리
        Path path= Paths.get("example.txt");
        System.out.println(path.toAbsolutePath());

        // java.io - 파일읽기
        try(BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))){
            String line;
            while ((line = reader.readLine()) != null){
                System.out.println(line);
            }
        }catch(IOException e){
            e.printStackTrace();
        }

        List<String> lines = Files.readAllLines(path);
        for (String string : lines) {
            System.out.println(string);
        }

    }
}
```

## 제네릭

*   컴파일 타임에 타입을 체크한다 (타입 안정성 보장)
*   타입 캐스팅 제거 (타입 변환을 명시적으로 표현할 필요가 없음)
*   다양한 타입을 사용할 수 있음 (유연한 코드 작성)

주의)  
제네릭 타입은 상속관계를 따르지 않음  
List<Object> list = new ArrayList<String>(); // 컴파일 오류 (Object, String 상속관계를 따르지 않음)
```java
public class Test<T>{
     private T item;
     
     public void set(T item){
          this.item = item;
     }
     
     public T get(){
          return item;
     }
}
```

## 멀티스레드

*   스레드 생성은 Runnalbe 과 Thread을 이용

```java
class MyThread extends Thread{
    @Override
    public void run(){
    }
}

class MyRunnable extends Runnable{
    @Override
    public void run(){
    }
}
```

*   스레드 상태
    *   Runnable :실행 가능 상태
    *   Blocked :  차단 상태 (락 해제 대기)
    *   Waiting : 대기 상태 ( Object.wait(), .join()으로 인한 대기)
    *   TIMED_WAITING : 시간 제한 대기 상태 (.sleep(), .wait())
    *   Terminated : 종료상태
*   스레드 제어
    *   start() : 스레드 실행
    *   **sleep**() : 지정 시간동안 스레드 일시 중단 ( 락 해제 x)
    *   join() : 다른 스레드 작업 끝나길 기달림
    *   **wait**() : 스레드 간의 동기화 작업 (중단 , 락 해제 o)
    *   notify() : wait()작업 해제
*   경쟁상태 (race condition 해결)
    *   wait()을 하여 스레드 대기상태
    *   동기화 키워드 (**synchronized**)를 이용하여 보장

```java
public synchronized void method(){
    //...
}
```

## 컬렉션 자료구조

List vs Set  
- List : 순서가 있는 데이터 집합, **중복요소 허용  
-** set : 순서가 없고, **중복된 요소를 허용하지 않음**  
  
[선언]  
List<String> list = new ArrayList<>();  
Set<String> set = new HashSet<>();
HashMap Vs TreeMap  
- HashMap : 순서를 보장하지 않음, **해싱**을 이용 (시간복잡도 : O(1))  
- TreeMap : 키에 대해 정렬된 순서로 저장, **Red-Black Tree 이용** ( 시간 복잡도 : O(logn) )  
  
[선언]  
Map<String, Integer> hashMap = new HashMap<>();  
Map<String,Integer> treeMap = new TreeMap<>();
ArrayList Vs LinkedList  
- ArrayList : 내부적으로 동적 배열 사용, **요소 중간 삽입/삭제 O(n)이 걸림** (**랜덤 접근 빠름**)  
- LinkedList : 이중연결리스트 이용, **요소 중간 삽입/삭제 O(1) 이 걸림** (**랜덤 접근 느림**)  
  
[선언]  
List<String> arrayList = new ArrayList<>();  
List<String> linkedList = new LinkedList<>();
Iterator Vs ListIterator  
- Iterator : 컬렉션의 요소를 순방향으로 순회 **(현재 요소 삭제 가능 / 수정 ,삽입 불가능)**  
- ListIterator : 컬렉션의 요소를 양방향으로 순회 **(요소를 삽입, 수정, 삭제 가능)**  
  
[선언]  
Iterator<String> iterator = list.iterator();  
ListIterator<String> listIterator = list.listIterator();
HashSet Vs TreeSet  
- HashSet : **순서가 없는 컬렉션 ,** 빠른검색과 삽입  
- TreeSet : **정렬된 순서,** 이진검색트리 사용  
  
[선언]  
Set<String> hashSet = new HashSet<>();  
Set<String> treeSet = new TreeSet<>();
동시성 문제 해결 방법  
- ConcurrentHashMap  
- CopyOnWriteArrayList  
- ConcurrentLinkedQueue

## 람다식

*   인터페이스의 추상메서드가 단일일경우, 람다를 이용하여 구현이 가능하다 ( = 함수형 인터페이스)
    *   함수형 인터페이스
        *   단 하나의 추상메서드만을 가지고 있어야함
        *   여러개의 default 메서드나 static 메서드는 포함할 수 있다

Runnable runnable = () -> System.out.println("thread start!");  
// Runnable 인터페이스에는 @Override run() 추상메서드 한개가 있으므로, 람다를 이용해 자동 적용되게 할 수 있다

*   메서드를 간단히 표현할 수 있는 구문
*   가독성, 불변성을 가진다
*   함수를 변수처럼 다룰 수 있다

[람다식 문법]  
  
1. (parameters) -> 표현식 형태  
-> 람다식 결과를 그대로 반환  
  
2. (parameters) -> { 블록형태; }  
-> 명시적으로(return) 반환

## 스트림

*   컬렉션 요소를 처리하기 위한 기능
*   연산과정은 중간연산 + 최종연산이 서로 다른 역할을 한다
    *   중간 연산 : 스트림을 변환하여 새로운 스트림을 반환
    *   최종 연산 : 스트림을 소모하고 결과를 반환한다
*   **람다식과 함께 자주 사용된다**

```java
public class StreamEx{
     public static void main(String[] args) {
          
          List<Integer> numbers = Arrays.asList(1,2,3,4,5,6);
          
          numbers.stream()
                 .filter(n -> n%2 == 0) // 짝수 필터링 
                 .map(n-> n*n) //제곱
                 .forEach(System.out::println); // 결과 출력
          }
     }
}
```

> 원문: https://gradualprecision.tistory.com/147

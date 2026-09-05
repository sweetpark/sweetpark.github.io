---
title: "[기초] 배열"
tags: [학습, 개발-CS, 언어, JAVA, 개발, 배열, ArrayList]
created: 2026-09-05
modified: 2026-09-05
---

# [기초] 배열

> [!NOTE]
> Java 배열 선언·초기화, 객체 배열, 다차원 배열, ArrayList 기초.

> [!NOTE]
> 원문을 AI가 검토·보강함(사실 확인 권장).

## 📌 개념

### 배열의 기초

- 배열의 시작 인덱스는 "0"이다
- Fixed length : 고정된 길이
- 배열은 연속된 구조 (중간에 빈 공간이 있으면 안 됨)
- 배열 공간이 꽉 차면 더 넣을 수 없음 (→ 새로운 더 큰 배열을 만들어야 함)
- `System.out.println(arr.length);` // 배열 공간 개수 출력

### 배열 선언

```java
int[] arr = new int[10];
int[] arr = new int[] {1,2,3}; // 초기화 (3개의 공간이 형성됨)
int[] num = {1,2,3};           // 배열 선언 및 초기화 (3개 공간 형성)
int[] num;
num = new int[3];
// 초기화를 할 경우 배열 개수 지정 X
```

- 문자 배열(char)

```java
char[] alpabet = new char[26];
char ch = 'A';

for(int i=0; i<alpabet.length; i++, ch++){
    alpabet[i] = ch;
} // 알파벳이 순서대로 찍힘

// char 문자도 결국에는 정수임. (ASCII 코드)
```

### 객체 배열 만들기

- `클래스명[] 변수명 = new 클래스명[배열개수];`

```java
변수명[0] = new 클래스명("인자1","인자2");
변수명[1] = new 클래스명("인자1","인자2");
변수명[2] = new 클래스명("인자1","인자2");
```

### setter / getter

- setter : private인 클래스 내부 멤버변수를 수정할 때 사용
- getter : private인 클래스 내부 멤버변수를 출력할 때 사용

### 배열 복사 (깊은 복사 / 얕은 복사)

- `System.arraycopy(원본, 복사 시작지점, 복사본, 복사 시작지점, 복사 개수);`

```java
// 직접 복사 (get/set 이용)
for(int i=0; i< bookArray1.length; i++){
    bookArray2[i].setAuthor(bookArray1[i].getAuthor());
}
```

> [!NOTE]
> `System.arraycopy`는 요소(참조)를 그대로 복사하므로, 객체 배열에서는 **얕은 복사(shallow copy)**에 해당한다(원본과 복사본이 같은 객체를 가리켜 값이 함께 바뀜). 각 요소를 새 객체로 만들어 넣는 방식이 **깊은 복사(deep copy)**다.

### 배열 전체 출력

```java
String[] array = new String[] {"Java", "Good"};
// ⭕ String[] array = {"Java", "Good"};

int[] array1 = new int[] {1,2,3};
// ⭕ int[] array1 = {1,2,3};

for(int i=0; i<array.length; i++){
    System.out.println(array[i]);
}
for(String s : array){
    System.out.println(s);
}
for(int i : array1){
    System.out.println(i);
}
```

### 다차원 배열

- `arr[행][열]`

```java
int[][] array = new int[2][3];
int[][] array = {{1,2,3}, {4,5,6}};

System.out.println(arr.length);     // ➡️ 행의 개수(2)
System.out.println(arr[0].length);  // ⬇️ 열의 개수(3)
```

### ArrayList (Library)

- 배열 클래스에 관하여 많은 기능을 가짐
- `Ctrl + Shift + O` : 자동으로 ArrayList가 import 됨
- 생성: `ArrayList<클래스명> 변수명 = new ArrayList<클래스명>();`

```java
// 🚫 인덱스 연산자 사용 불가능
ArrayList<String> list = new ArrayList<String>();
for(int i=0; i<list.size(); i++){
    System.out.println(list[i]);   // 인덱스 연산 불가능
}

// ⭕ 향상된 for문으로 전체 출력
for(String s : list){
    System.out.println(s);
}

// ⭕ get()으로 인덱스 접근
for(int i=0; i<list.size(); i++){
    System.out.println(list.get(i));
}
```

```java
// 값 넣기
ArrayList<Book> library = new ArrayList<Book>();
library.add(new Book("태백산맥1","조경례"));
library.add(new Book("태백산맥2","조경례"));
library.add(new Book("태백산맥3","조경례"));
```

- 기본 배열: `String[] 리스트변수명 = new String[10];`
- 리스트 추가: `리스트명.add(내용)`, `리스트명.add(위치, 내용)`
- 배열 정보 가져오기: `리스트명.get(위치)`

## 💻 예시

- Student class

```java
package arraylist심화;

import java.util.ArrayList;

public class Student {
	private int studentID;
	private String studentName;
	private ArrayList<subject> subjectList;

	public Student(int studentID, String studentName) {
		this.studentID = studentID;
		this.studentName = studentName;

		subjectList =new ArrayList<subject>();
	}

	public void addSubject(String name, int score) {

		subject subject = new subject();
		subject.setName(name);
		subject.setScorePoint(score);

		subjectList.add(subject);
		//subjectList.add(subject.setName(name),subject.setScorePoint(score));
	}

	public void showStudentInfo(){
		for(subject subject : subjectList) {
			System.out.println("학생" + studentName +"님의" + subject.getName() + " 과목의 성적은 " + subject.getScorePoint() + "점 입니다" );
		}
	}

}
```

- Subject class

```java
package arraylist심화;

public class subject {
	private String name;
	private int scorePoint;
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public int getScorePoint() {
		return scorePoint;
	}
	public void setScorePoint(int scorePoint) {
		this.scorePoint = scorePoint;
	}

}
```

- test

```java
package arraylist심화;

public class test {

	public static void main(String[] args) {
		Student studentLee = new Student(1001,"Lee");
		studentLee.addSubject("국어", 100);
		studentLee.addSubject("수학", 100);
		studentLee.addSubject("영어", 100);

		studentLee.showStudentInfo();

	}

}
```

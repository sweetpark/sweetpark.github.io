---
title: "Class"
tags: [학습, 개발-CS, 언어, C++, 개발, 클래스]
created: 2026-09-05
modified: 2026-09-05
---

# Class

> [!NOTE]
> C++ 클래스의 기본 구조 — 멤버 변수/함수 선언과 인스턴스 생성 방법.

## 📌 개념

- `class` ⇒ 멤버 변수 및 멤버 함수 설정
- `main`에서 객체(인스턴스) 생성 ⇒ `student stu;`
- 멤버 함수 본문은 클래스 외부에서 `클래스명::함수명` 형태로 정의 가능

## 💻 예시

```cpp
class student {
private:
    char * name;
    int age;
public:
    void ShowInfo();
    void SetInfo(char * _name, int _age, char * _hobby);
};

void student::ShowInfo(){
     cout << "이름: " << name << " , 나이 : " << age << endl;
}

int main(){
    student stu;

    stu.SetInfo("김철수", 16, "컴퓨터게임");
    stu.ShowInfo();

    return 0;
}
```

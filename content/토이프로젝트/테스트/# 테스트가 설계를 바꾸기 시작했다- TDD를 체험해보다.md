---
title: "# 테스트가 설계를 바꾸기 시작했다: TDD를 체험해보다"
tags: [토이프로젝트, 테스트]
created: 2026-09-05
modified: 2026-09-05
---

# 테스트가 설계를 바꾸기 시작했다: TDD를 체험해보다

* * *

1편에서 이야기했듯, 나는 초기에 테스트를 잘못 이해한 방식으로 사용하고 있었다.  
테스트에서 기능을 만들어보지만 실제 프로덕션 코드는 다시 처음부터 작성하는 구조였고,  
테스트는 참고용 코드에 불과했다.  
  
**하지만, 이 시행착오를 겪은 덕분에**, 테스트를 제대로 활용하는 방식,  
**즉 테스트 → 설계 → 프로덕션 코드 승격**이라는 진짜 **TDD적 흐름**을 이해하게 되었다.  
  
이 글에서는 내가 테스트를 활용하는 방식을 어떻게 바꿨고,  
그 과정에서 어떤 설계 개선이 이루어졌는지 기록해보려고 한다.

* * *

### # 테스트에서 시작하고, 설계로 이어지는 흐름을 만들다

예전처럼 테스트에서 기능을 만들고 프로덕션에서 처음부터 다시 만드는 대신,  
나는 다음과 같은 흐름으로 개발을 진행하기 시작했다.

1.  **테스트에서 간단한 프로토타입을 작성하고 원하는 동작을 검증한다.**
2.  이 동작이 타당하다고 판단되면
3.  **테스트 안에서 만든 코드를 main으로 ‘승격’시키고**,
4.  해당 기능의 책임을 명확히 나눈다.
5.  이후 @SpringBootTest 기반 DI 테스트로 리팩토링한다.

이 흐름을 사용하자,  
테스트는 단순 검증 도구가 아니라 **설계를 이끄는 도구**가 되기 시작했다.

* * *

#### # 테스트 코드가 설계를 요구하기 시작했다

테스트를 작성하면 자연스럽게 이런 고민이 생긴다.

*   “이 메서드는 너무 많은 일을 하고 있지 않나?”
*   “여기 의존성은 분리해야 테스트하기 쉬울 것 같은데?”
*   “이 로직을 재사용하려면 별도 클래스로 빼는 게 맞겠다.”

즉, **테스트하기 어려운 코드는 설계가 잘못되었다는 신호**였다.

아래는 실제로 내가 겪은 예시다.

Step 1) POJO 스타일로, 테스트 메서드 내부에서 ‘기능을 직접 구현’

아직 프로덕션 코드는 전혀 만들지 않은 상태.  
테스트 메서드 안에서 내가 원하는 기능을 “그냥 작성해보는 단계”다.
```java
@Test
void saveFile_basicPrototype() throws Exception {
    // POJO 스타일, 모든 로직이 여기 들어 있음
    File file = new File("test.txt");
    String content = "Hello";

    boolean result = false;
    try (FileWriter fw = new FileWriter(file)) {
        fw.write(content);
        result = true;
    } catch (Exception e) {
        result = false;
    }

    assertTrue(result);
}
```

*   테스트와 프로덕션을 나누지 않고, 기능을 하나의 테스트 내부에 전부 작성
*   일종의, "기능 프로토타입"

Step 2) 테스트 폴더 내에서 'Method로 1차 분리'
```java
@Test
void saveFile_extractMethod() throws Exception {
    File file = new File("test.txt");
    String content = "Hello";

    boolean result = save(file, content);

    assertTrue(result);
}

private boolean save(File file, String content) {
    try (FileWriter fw = new FileWriter(file)) {
        fw.write(content);
        return true;
    } catch (Exception e) {
        return false;
    }
}
```

*   save()라는 메서드로 분리
*   아직 src/test/ 아래에 메서드 존재

Step 3) 책임을 가진 메서드를 'static 내부 클래스' 로 이동
```java
@Test
void saveFile_withInnerClass() throws Exception {
    File file = new File("test.txt");

    FileStorage storage = new FileStorage();
    boolean result = storage.save(file, "Hello");

    assertTrue(result);
}

static class FileStorage {
    public boolean save(File file, String content) {
        try (FileWriter fw = new FileWriter(file)) {
            fw.write(content);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

해당 단계가 가장 중요!

*   아직 프로덕션 코드로 승격하지 않음 (테스트 내부에 존재)
*   설계 개선을 위해서, **책임을 분리하는 단계**
*   **내부 클래스로 만들어서 객체를 new로 생성하여 이용**

Step 4) 어느정도 구조가 자리를 잡으면, 프로덕션(main)코드로 승격
```java
@Component
public class FileStorage {

    public boolean save(File file, String content) {
        try (FileWriter fw = new FileWriter(file)) {
            fw.write(content);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

*   내부클래스 >> src/main/java/.../FileStorage.java로 이동
*   **테스트에서 만든 내부클래스를 그대로 승격**

Step 5) @SpringbootTest로 전환하여 DI 주입
```java
@SpringBootTest
class FileStorageTest {

    @Autowired
    FileStorage fileStorage;

    @Test
    void givenFile_whenSave_thenSuccess() {
        // Given
        File file = new File("sample.txt");
        String content = "Sample";

        // When
        boolean result = fileStorage.save(file, content);

        // Then
        assertTrue(result);
    }
}
```

*   실제 프로덕션 코드를 주입받아서 검증하는 **단위테스트**가 된다
*   **해당 테스트 코드는 프로타입이 아닌, 구현된 기능**
*   **Given - When - Then 구조만 남음 (깔끔한 테스트 코드 상태)**

Step 6) 리펙토링 내성이 생기고, 생산성이 극적으로 증가

이제 FileStorage를 아래처럼 바꿔도 테스트가 보호해준다

1.  저장 경로 분리
2.  경로 전략 적용
3.  네트워크 저장소로 전환
4.  AWS S3로 변경
5.  예외 정책 변경

그 어떤 구조 변경을 하더라도  
테스트가 실패하지 않으면 “**그대로 동작함**”을 **확신**할 수 있다.

* * *

### # 전체 흐름 다시 요약

| 단계 | 설명 |
| --- | --- |
| 1 | 테스트 메서드 내부에서 POJO 스타일로 기능 구현 |
| 2 | 메서드 분리 (테스트 폴더 내) |
| 3 | static 내부 클래스로 책임 분리 |
| 4 | 충분히 검증되면 프로덕션(main)으로 승격 |
| 5 | @SpringBootTest + DI 기반 테스트로 재정비 |
| 6 | 안전한 리팩토링 가능, 생산성 향상 |

* * *

### # 마무리

TDD에서는  
1. 실패하는 테스트케이스 작성 (RED)  
2. 성공하는 테스트 작성 (GREEN)  
3. 리펙토링 하기 (REFECTOR)  
를 하게되는데, RED작업을 많이 해보면 할수록 많은 예외사항을 처리할 수 있게된다.  
  
많은 시간이 없다면, GREEN과 REFACTOR를 통해서 작성만 해두어도 나중에 많은 시간을 절약할 수 있고 리팩토링을 할 때에도 부담 없이 진행할 수 있게 된다.

### **※ 참고) 리펙토링 방법** 

**▷ 켄트 백(Kent Beck)** 

| 단계 | 내용 |
| --- | --- |
| 1 | 이름 변경 (Rename) |
| 2 | 매직넘버 제거 |
| 3 | 중복 제거 |
| 4 | 함수 추출 (Extract Method) |
| 5 | 조건문 단순화 |
| 6 | 가드절 도입 |
| 7 | 부작용(side-effect) 제거 |
| 8 | 임시 변수 분리 |
| 9 | 책임 분리(Extract Class) |
| 10 | 데이터 구조 개선(파라미터 객체) |
| 11 | 조건문(if)을 반복문(loop) 기반 흐름으로 변환 |
| 12 | 반복문을 재귀(recursion)로 단순화 |
| 13 | 최종 단계: 재귀 제거 → 반복문으로 최적화 (거의 가지 않음) |

> 원문: https://gradualprecision.tistory.com/286

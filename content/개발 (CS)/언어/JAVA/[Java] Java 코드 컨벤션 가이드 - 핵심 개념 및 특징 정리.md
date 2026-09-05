---
title: "**Java 코드 컨벤션 가이드**"
tags: [학습, 개발-CS, 언어, JAVA, 컨벤션]
created: 2026-09-05
modified: 2026-09-05
---

# **Java 코드 컨벤션 가이드**

> [!NOTE]
> 명명 규칙, 포매팅, 주석, 예외 처리·DI·로깅 등 프로그래밍 실천법을 다루는 Java 코드 컨벤션 가이드.
> 실무에서 이관.

## 📌 가이드 내용

### **1. 이름 규칙 (Naming Conventions)**

일관성 있는 이름 규칙은 코드를 이해하는 데 가장 기본적이고 중요한 요소입니다.

### **1.1. 패키지 (Packages)**

- 소문자로만 구성합니다.
- 회사의 도메인을 역순으로 사용합니다. (예: `com.mycompany.projectname.module`)
- 자바 표준 라이브러리나 외부 라이브러리의 이름과 충돌하지 않도록 고유한 이름을 사용합니다.

```java
// Good
package com.example.app.service;

// Bad
package Prepaid;
package com.example.app.service;

```

### **1.2. 클래스 (Classes)**

- 파스칼 케이스(PascalCase)를 사용합니다. (각 단어의 첫 글자를 대문자로)
- 명사를 사용하여 이름을 짓습니다.
- `Service`, `Controller`, `Repository`, `Factory` 등 역할이 명확한 경우 접미사를 붙여줍니다.

```java
// Good
public class PaymentOnlyMthd { ... }
public class CommonPayInParams { ... }

// Bad
public class payment_only_mthd { ... } // 스네이크 케이스 사용
public class Process { ... } // 역할이 불분명함

```

### **1.3. 인터페이스 (Interfaces)**

- 클래스와 동일하게 파스칼 케이스를 사용합니다.
- 이름만으로 인터페이스임을 명확히 알 수 있다면 `I` 접두사나 `able` 접미사를 붙이지 않아도 됩니다. (예: `List`, `Map`)
- 하지만, 구현체와 이름이 겹칠 경우, 구현체에 `Impl` 접미사를 붙이는 것이 일반적입니다.

```java
// Good
public interface ApiInterface { ... }
public class ApiInterfaceImpl implements ApiInterface { ... }

// Bad
public interface IApiInterface { ... } // 'I' 접두사는 지양하는 추세

```

### **1.4. 메소드 (Methods)**

- 카멜 케이스(camelCase)를 사용합니다. (첫 단어는 소문자, 이후 단어의 첫 글자는 대문자)
- 동사 또는 '동사+명사' 조합으로 이름을 짓습니다.
- `get`, `set`, `is` 등 표준적인 접두사를 일관되게 사용합니다.

```java
// Good
public void excute(WTxData wTxData) { ... }
public boolean beforeCheck(WTxData wTxData) { ... }
private boolean validateHash(WTxData wTxData) { ... }

// Bad
public void Execute(WTxData wTxData) { ... } // 파스칼 케이스 사용
public void data_process(WTxData wTxData) { ... } // 스네이크 케이스 사용

```

### **1.5. 변수 (Variables)**

- 카멜 케이스(camelCase)를 사용합니다.
- 변수의 의도를 명확히 알 수 있도록 구체적으로 작성합니다.
- 한두 글자의 축약어는 피합니다. (단, `for` 루프의 `i`, `j`, `k` 등은 예외)

```java
// Good
List<WMap> mthdList = ...;
long maxUseOkAmt = ...;

// Bad
List l; // 너무 축약됨
int a; // 의미를 알 수 없음

```

### **1.6. 상수 (Constants)**

- 모든 글자를 대문자로 작성하며, 단어 사이는 언더스코어(`_`)로 구분합니다. (SNAKE_CASE)
- `static final`로 선언합니다.

```java
// Good
public static final String PP_KEY_TYPE_MTHD = "2";
private static final int MAX_RETRY_COUNT = 3;

// Bad
static final String ppKeyTypeMthd = "2";

```

### **2. 형식 (Formatting)**

### **2.1. 들여쓰기 (Indentation)**

- 탭(Tab) 대신 스페이스(Space) 4개를 사용합니다. (대부분의 IDE에서 자동 설정 가능)

### **2.2. 줄 길이 (Line Length)**

- 한 줄의 길이는 120자를 넘지 않도록 합니다.
- 120자를 넘을 경우, 가독성을 해치지 않는 선에서 줄 바꿈을 합니다.

### **2.3. 중괄호 (Braces)**

- `if`, `else`, `for`, `while` 문에서는 한 줄짜리 코드라도 반드시 중괄호를 사용합니다. 이는 잠재적인 버그를 예방합니다.

```java
// Good
if (useSerial) {
    if (!setPaySerialNoForProcess(wTxData)) {
        return false;
    }
}

// Bad - 중괄호 생략
if (useSerial)
    if (!setPaySerialNoForProcess(wTxData))
        return false;

```

### **2.4. 공백 (Whitespace)**

- 연산자( `+`, , , `/`, `=`, `==` 등) 양옆에 공백을 추가합니다.
- 쉼표(`,`) 뒤에 공백을 추가합니다.

### **2.5. 조건문 및 반환문의 개행 (Line Breaks for Readability)**

- `if`, `for`, `while`, `return` 등 중요한 흐름 제어 키워드 앞뒤에는 한 줄을 띄워 시각적으로 블록의 시작과 끝을 명확히 구분합니다.
- `return` 문은 로직의 종료 지점임을 강조하기 위해 개행을 통해 시각적으로 구분하는 것이 좋습니다.
- 단, 너무 짧은 코드(3줄 이하)나 연속적인 흐름에서는 과도한 개행을 피합니다.

```java
// Good
Object resultObject = null;

if (isHeaderValid) {
    final StopWatch stopWatch = new StopWatch();
    stopWatch.start();
    resultObject = joinPoint.proceed();
    stopWatch.stop();

    final long totalTimeMillis = stopWatch.getTotalTimeMillis();
    final MethodSignature signature = (MethodSignature) joinPoint.getSignature();
    final String methodName = signature.getMethod().getName();
    log.info("실행 메서드: {}, 실행시간 = {}ms", methodName, totalTimeMillis);

    if (totalTimeMillis > 5000) {
        log.warn("slowMethod {}ms", totalTimeMillis);
    }
}

if (TxUtils.isEmpty(resultObject)) {
    final WMap serviceReturn = new WMap();
    serviceReturn.put(Source00.resultCd.name(), "9999");
    serviceReturn.put(Source00.resultMsg.name(), returnErrMsg);
    resultObject = new ResponseEntity<>(serviceReturn, null, HttpStatus.OK);
    log.info("return value = {}", resultObject);
}

return resultObject;

```

### **2.6. 빈 줄(Empty Line) 사용 규칙**

- 의미 있는 코드 블록 사이에는 빈 줄을 추가하여 시각적 구분을 명확하게 합니다.
- 연관된 로직은 빈 줄 없이 묶고, 의미가 전환되는 지점에서는 한 줄을 띄웁니다.

```java
// Good
int total = 0;
for (int i = 0; i < list.size(); i++) {
    total += list.get(i);
}

log.info("합계 = {}", total);

```

### **3. 주석 (Comments)**

- **"무엇을" 하는 코드인지가 아니라, "왜" 그렇게 작성했는지를 설명합니다.**
- 공개 API(public method)에는 Javadoc을 작성하여 파라미터, 반환 값, 발생 가능한 예외를 명시합니다.
- 복잡한 비즈니스 로직, 임시 해결책(workaround), 최적화를 위한 특별한 알고리즘 등에는 주석을 추가합니다.

```java
/**
 * 결제에 사용될 매체 정보를 처리용 데이터(procData)에 설정합니다.
 * ppMthdId 또는 ppMthdIdArray 파라미터를 검증하고 암호화하여 저장합니다.
 *
 * @param wTxData 트랜잭션 데이터 객체
 * @return 처리 성공 시 true, 실패 시 false
 * @throws Exception 암호화 과정에서 예외 발생 가능
 */
private boolean setPayMthdForProcess(WTxData wTxData) throws Exception {
    // ppMthdIdArray와 ppMthdId는 동시에 요청될 수 없으므로 이를 체크합니다.
    if (wTxData.getInParam().containsKey(Source60.ppMthdIdArray.name()) && wTxData.getInParam().containsKey(Source61.ppMthdId.name())) {
        wTxData.putProcData(Source00.noValidateMsg, "ppMthdIdArray, ppMthdId 중 1개만 요청가능합니다.");
        return false;
    }
    // ...
}

```

### **3.1. TODO, FIXME 주석 규칙**

- 개발 중 남겨야 할 작업이나 임시 로직은 `// TODO:`, `// FIXME:` 등의 키워드를 사용하여 명확히 표시합니다.
- `TODO`와 `FIXME`는 IDE에서 검색 및 추적이 가능하므로 유지보수에 매우 유용합니다.

```java
// TODO: 성능 최적화 필요
// FIXME: null 체크 로직 임시 제거됨

```

### **4. 프로그래밍 실천법 (Programming Practices)**

### **4.1. 어노테이션 (Annotations)**

- 상위 클래스의 메소드를 오버라이드할 때는 반드시 `@Override` 어노테이션을 붙여 컴파일 시점에 실수를 잡을 수 있도록 합니다.

### **4.2. 예외 처리 (Exception Handling)**

- `catch` 블록을 비워두지 마세요. 최소한 로그를 남겨서 어떤 예외가 발생했는지 추적할 수 있어야 합니다.
- 너무 광범위한 `Exception`을 잡기보다는, 구체적인 예외(e.g., `IOException`, `IllegalArgumentException`)를 처리하는 것이 좋습니다.

```java
// Good
try {
    encList.add(cryptUtils.encrypt(id));
} catch (Exception e) {
    // 예외를 무시하지 않고, 로그를 남기거나 더 구체적인 예외로 전환하여 던집니다.
    log.error("Failed to encrypt ID: {}", id, e);
    throw new RuntimeException("암호화 실패: " + id, e);
}

// Bad
try {
    // ...
} catch (Exception e) {
    // 예외를 무시하면 디버깅이 매우 어려워집니다.
}

```

### **4.3. `final` 키워드 활용**

- 변경되지 않는 지역 변수나 파라미터에는 `final`을 붙여 불변성을 보장하고 실수를 방지합니다.

### **4.4. `Stream`과 `Lambda` 활용**

- Java 8 이상을 사용한다면, 컬렉션 처리에 `for` 루프 대신 `Stream API`와 `Lambda`를 적극적으로 활용하여 코드를 더 간결하고 선언적으로 만듭니다.

```java
// Good (Stream API)
List<String> encArray = mthdList.stream()
                                .map(m -> (String) m.get(Table61.PP_MTHD_ID_ENC))
                                .collect(Collectors.toList());

// Traditional
List<String> encArray = new ArrayList<>();
for (WMap m : mthdList) {
    encArray.add((String) m.get(Table61.PP_MTHD_ID_ENC));
}

```

### **4.5. 의존성 주입 (Dependency Injection)**

- `@Autowired`는 필드 주입보다 생성자 주입을 기본으로 사용합니다. (테스트와 명시적 의존성 관리가 용이함)

```java
// Good
@RequiredArgsConstructor
@Service
public class PaymentService {
    private final PayMapper payMapper;
}

// Bad
@Autowired
private PayMapper payMapper;

```

### **4.6. 로그 사용 규칙 (Logging)**

- 로그는 반드시 `lombok`의 `@Slf4j`를 사용합니다. (`lombok.extern.slf4j.Slf4j` import 필수)
- `System.out.println()`이나 `e.printStackTrace()`는 절대 사용하지 않습니다.
- 로그 레벨은 상황에 맞게 `info`, `debug`, `warn`, `error`를 구분하여 사용합니다.
- 메시지는 구체적으로 작성하고, `슬래시`로 구분된 코드나 데이터는 피하며, 가독성 좋은 포맷을 유지합니다.

```java
@Slf4j
public class PayService {

    public void execute(String requestId) {
        log.info("결제 요청 수신 - requestId: {}", requestId);

        try {
            // ...
        } catch (Exception e) {
            log.error("결제 처리 중 예외 발생 - requestId: {}", requestId, e);
        }
    }
}

```

### **4.7. Null 처리 원칙**

- Null 체크는 `Objects.requireNonNull()`, `Optional`, `StringUtils.hasText()` 등 표준 유틸을 사용
- 로그 메시지는 명확하고 구체적으로 작성

```java
Optional.ofNullable(user).ifPresent(u -> doSomething(u));

```

### **4.8. Enum 사용 지침**

- 상수 값보다 의미 있는 이름을 가진 Enum을 사용
- 문자열 비교보다는 Enum을 통해 타입 안정성 확보

```java
public enum PayStatus {
    SUCCESS, FAILED, PENDING
}
```

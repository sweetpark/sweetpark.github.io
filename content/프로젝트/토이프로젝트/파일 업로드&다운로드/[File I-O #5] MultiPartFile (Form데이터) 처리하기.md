---
title: "[File I/O #5] MultiPartFile (Form데이터) 처리하기"
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [File I/O #5] MultiPartFile (Form데이터) 처리하기

> [!NOTE] 실행 환경
> 같은 폴더의 "[File I/O] 파일 라이브러리 이해하기" 노트에서 Java 17 기준으로 설명하고 있으나, 이 폴더에는 Spring Boot 버전이 별도로 명시되어 있지 않다.

File I/O #5 — MultipartFile 업로드 처리 흐름

* * *

### _MultipartFile이란?_

Spring MVC에서 클라이언트가 전송한 **파일 업로드 요청**을 다루기 위한 인터페이스입니다.  
HTML의 **`<input type="file">`**에서 전송된 데이터를 서버에서 받기 위해 사용됩니다.

```
public interface MultipartFile {
    String getName();                         // 파라미터 이름
    String getOriginalFilename();             // 업로드된 원본 파일명
    String getContentType();                  // MIME 타입
    boolean isEmpty();                        // 파일이 비어있는지 확인
    long getSize();                           // 파일 크기
    byte[] getBytes() throws IOException;     // 바이트 배열로 읽기
    InputStream getInputStream() throws IOException; // InputStream으로 읽기
    void transferTo(File dest) throws IOException;   // 파일로 저장
}
```

* * *

### _MultipartFile → InputStream 흐름_

```
[HTML 파일 업로드]
       ↓
[Spring Controller: MultipartFile 수신]
       ↓
MultipartFile.getInputStream()
       ↓
InputStream (→ BufferedReader 또는 직접 처리)
```

결국 MultipartFile은 내부에 저장된 파일 내용을 **InputStream으로 꺼내어 읽을 수 있게 해주는 구조**입니다.

### 1.  InputStream으로 읽기

파일 내용을 바이트 스트림으로 처리

```
@PostMapping("/upload")
public String upload(@RequestParam("file") MultipartFile file) {
    try (InputStream is = file.getInputStream()) {
        int data;
        while ((data = is.read()) != -1) {
            System.out.print((char) data);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
    return "업로드 완료";
}
```

### **2. BufferedReader로 줄 단위 읽기 (주로 사용됨)**

텍스트 파일인 경우 가장 자주 사용되는 방식

```
@PostMapping("/upload")
public String upload(@RequestParam("file") MultipartFile file) {
    try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

        String line;
        while ((line = reader.readLine()) != null) {
            System.out.println("줄 내용: " + line);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
    return "업로드 완료";
}
```

### **3. byte[]로 한 번에 읽기 (파일 내용 한번에 읽을 때 유용)**

바이너리 파일이나 전체 내용을 통째로 읽고 싶을 때

```
byte[] data = file.getBytes();
String content = new String(data, StandardCharsets.UTF_8);
System.out.println("파일 전체 내용: " + content);
```

### **4. 파일로 저장하기 (transferTo)**

서버에 파일을 직접 저장하고 싶을 때 사용

```
File targetFile = new File("/tmp/" + file.getOriginalFilename());
file.transferTo(targetFile);
System.out.println("파일 저장 완료: " + targetFile.getAbsolutePath());
```

* * *

### _어떤 방식이 적절할까?_

| 방법 | 설명 | 적합한 상황 |
| --- | --- | --- |
| getInputStream() | 스트림 기반 읽기 (InputStream 가져오기) | 대부분의 파일 처리, 성능 중심 |
| BufferedReader | 줄 단위 텍스트 읽기 | CSV, TXT, 로그 등 텍스트 파일 |
| getBytes() | 전체 내용을 바이트로 한 번에 | 파일 크기가 작을 때, JSON 등 |
| transferTo() | 파일로 저장 (다른이름으로 저장 같은 느낌) | 파일 백업, 임시 저장 필요 시 |

### 정리

- MultipartFile : **업로드된 파일**을 **추상화**한 객체  
- getInputStream() : 파일 내용을 InputStream으로 읽을 수 있음  
- BufferedReader :  **줄 단위**로 쉽게 읽을 수 있음  
- **transferTo()** :  서버에 파일을 저장할 수도 있음 (서버에 **"파일을 다른이름으로 저장"** 같은 느낌으로 저장)

## 관련 문서

- [(학습/프로젝트/토이프로젝트/파일 업로드&다운로드) [File I/O #4] InputStreamReader & BufferedReader 완전 분석]([File%20I-O%20#4]%20InputStreamReader%20&%20BufferedReader%20완전%20분석.md) — InputStreamReader/BufferedReader를 이용해 MultipartFile의 내용을 줄 단위로 읽는 방법을 다룸
- [(학습/프로젝트/토이프로젝트/파일 업로드&다운로드) [File I/O #6] File이외의 I/O Stream 정리 (Object, Audio, Piped 등)]([File%20I-O%20#6]%20File이외의%20I-O%20Stream%20정리%20(Object,%20Audio,%20Piped%20등).md) — MultipartFile 업로드 처리를 다룬 후, ObjectInputStream 등 그 외 I/O 스트림들을 정리하는 시리즈 마지막 편
- [(개발실무) @RequestPart (파일 + json 전송)](../../../개발%20실무/백엔드·데이터처리/[JSON]%20RequestPart%20(파일%20+%20json%20전송)%20-%20핵심%20개념%20및%20특징%20정리.md) — 파일 단독 전송이 아닌 파일+JSON 동시 전송 시 @RequestPart/ObjectMapper로 처리하는 방법을 다루는 자매 노트
- [(학습/프레임워크/Spring Framework/실습_스프링MVC/스프링 파일업로드) 스프링 파일업로드](../../../프레임워크/Spring%20Framework/실습_스프링MVC/스프링%20파일업로드/[Spring]%20스프링%20파일업로드%20-%20핵심%20개념%20및%20특징%20정리.md) — MultipartFile 처리 방식을 다루는 토이프로젝트 노트로, Servlet Part와 Spring MultipartFile을 비교하는 강의 노트와 연결됨

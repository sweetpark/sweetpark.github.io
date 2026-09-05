---
title: [File I/O #5] MultiPartFile (Form데이터) 처리하기
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [File I/O #5] MultiPartFile (Form데이터) 처리하기

목차

[1. Resource와 Stream I/O 이해](https://gradualprecision.tistory.com/266)

[2. Resource 구현체 이해하기](https://gradualprecision.tistory.com/267)

[3. InputStream/OutputStream 이해하기](https://gradualprecision.tistory.com/268)

[4. InputStreamReader, BufferedReader 이해하기](https://gradualprecision.tistory.com/269)

[5. Multipartfile 처리하기](https://gradualprecision.tistory.com/270)

[6. File 이외의 I/O stream 정리](https://gradualprecision.tistory.com/271)

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

> 원문: https://gradualprecision.tistory.com/270

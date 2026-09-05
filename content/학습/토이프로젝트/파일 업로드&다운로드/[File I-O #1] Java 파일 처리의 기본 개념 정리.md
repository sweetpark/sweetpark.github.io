---
title: "[File I/O #1] Java 파일 처리의 기본 개념 정리"
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [File I/O #1] Java 파일 처리의 기본 개념 정리

목차

[1. Resource와 Stream I/O 이해](https://gradualprecision.tistory.com/266)

[2. Resource 구현체 이해하기](https://gradualprecision.tistory.com/267)

[3. InputStream/OutputStream 이해하기](https://gradualprecision.tistory.com/268)

[4. InputStreamReader, BufferedReader 이해하기](https://gradualprecision.tistory.com/269)

[5. Multipartfile 처리하기](https://gradualprecision.tistory.com/270)

[6. File 이외의 I/O stream 정리](https://gradualprecision.tistory.com/271)

* * *

## File I/O #1 — Java 파일 처리의 기본 개념 정리

* * *

### _핵심 개념 요약_

*   **Resource**: 파일의 위치와 상태를 추상화 (파일이 있는지, 읽을 수 있는지 등)
*   **InputStream**: 파일에서 데이터를 읽기 위한 추상 클래스 (바이트 단위)
*   **OutputStream**: 파일에 데이터를 쓰기 위한 추상 클래스 (바이트 단위)

* * *

### _예시 흐름도_

```
[파일 또는 리소스 경로] 
       ↓ (Resource로 추상화)
[Resource] 
       ↓ getInputStream()
[InputStream] → 파일 내용 읽기
       ↓ (원하는 경우)
[OutputStream] → 파일로 저장 또는 출력
```

* * *

###  _Resource란?_

Spring이나 Java에서 다양한 리소스를 접근할 수 있게 해주는 인터페이스입니다.  
파일, URL, 클래스패스 등 다양한 위치의 리소스를 같은 방식으로 처리할 수 있게 도와줍니다.

```
public interface Resource {
    boolean exists();                     // 리소스가 존재하는지 확인
    boolean isReadable();                 // 리소스를 읽을 수 있는지 확인
    InputStream getInputStream();         // 파일 내용을 읽을 수 있는 InputStream 반환
    File getFile();                       // 실제 파일 객체 반환
    String getFilename();                 // 파일 이름 반환
}
```

* * *

### _InputStream이란?_

Java에서 파일이나 네트워크 등에서 **바이트 단위로 데이터를 읽을 때 사용하는 추상 클래스**입니다.

```
int read();                    // 한 바이트 읽기
int read(byte[] b);            // 바이트 배열로 읽기
void close();                  // 스트림 닫기
boolean markSupported();       // mark/reset 기능 지원 여부
```

* * *

### _OutputStream이란?_

Java에서 파일, 네트워크 등으로 **바이트 단위로 데이터를 쓰는 데 사용하는 추상 클래스**입니다.

```
void write(int b);                    // 한 바이트 쓰기
void write(byte[] b);                 // 바이트 배열 쓰기
void flush();                         // 버퍼 비우기 (즉시 출력)
void close();                         // 스트림 닫기
```

* * *

### _간단한 코드 흐름 예시_

```
// 파일 경로를 Resource로 추상화
Resource resource = new FileSystemResource("data.txt");

if (resource.exists()) {
    InputStream is = resource.getInputStream();     // 읽기 스트림
    OutputStream os = new FileOutputStream("copy.txt"); // 쓰기 스트림

    int data;
    while ((data = is.read()) != -1) {
        os.write(data);  // 읽은 바이트를 복사
    }

    is.close();
    os.close();
}
```

## 정리

- Resource : 파일이나 URL 같은 리소스를 추상화한 인터페이스 ( 리소스 접근 인터페이스 )  
- InputStream : 바이트 단위 읽기  
- OutputStream : 바이트 단위로 쓰기  
  
* 일반적 사용법 *  
1. Resource로 위치확인   
2. InputStream으로 읽기  
3. OutputStream으로 쓰기

> 원문: https://gradualprecision.tistory.com/266

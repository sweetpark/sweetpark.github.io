---
title: "[File I/O #2] Resource 구현체 완전 정리"
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [File I/O #2] Resource 구현체 완전 정리

> [!NOTE] 실행 환경
> 같은 폴더의 "[File I/O] 파일 라이브러리 이해하기" 노트에서 Java 17 기준으로 설명하고 있으나, 이 폴더에는 Spring Boot 버전이 별도로 명시되어 있지 않다.

File I/O #2 — Resource 구현체 완전 정리

* * *

### _Resource 인터페이스_

```
public interface Resource extends InputStreamSource {
    InputStream getInputStream();         // 리소스를 읽기 위한 InputStream 반환
    boolean exists();                     // 리소스가 존재하는지 확인
    boolean isReadable();                 // 읽기 가능한지 확인
    File getFile();                       // 실제 File 객체로 반환
    URL getURL();                         // URL 객체 반환
    String getFilename();                 // 파일 이름 반환
}
```

**Resource는 파일 경로, 클래스 경로, URL 등 다양한 위치의 리소스를 하나의 인터페이스로 추상화**합니다.

* * *

### _주요 Resource 구현체 5가지_

#### **1.** `**UrlResource** (자주 사용)`

*   HTTP, FTP, 파일 URL 등 **URL 기반 리소스**를 처리
*   file, https, ftp 프로토콜 모두 지원

```
Resource resource = new UrlResource("https://example.com/data.txt");
if (resource.exists()) {
    InputStream is = resource.getInputStream();
    // 스트림으로 읽기
    is.close();
}
```

#### 2. `ClassPathResource`

*   **클래스패스 경로에 있는 파일**을 읽을 때 사용 (예: src/main/resources)
*   자주 사용되는 설정 파일, 프로퍼티 파일에 적합

```
Resource resource = new ClassPathResource("config.properties");
InputStream is = resource.getInputStream();
```

#### 3. `FileSystemResource`

*   실제 파일 시스템 상의 파일을 **절대경로 또는 상대경로**로 지정
*   파일 직접 접근이 필요한 경우 사용

```
Resource resource = new FileSystemResource("/path/to/file.txt");
InputStream is = resource.getInputStream();
```

#### 4. `ServletContextResource`

*   **웹 애플리케이션 환경에서**, 서블릿 컨텍스트 기반 경로로 파일 접근
*   예: /WEB-INF 아래 리소스를 읽을 때

```
Resource resource = new ServletContextResource(servletContext, "/WEB-INF/config.xml");
InputStream is = resource.getInputStream();
```

#### 5. `ByteArrayResource`

*   **메모리에 있는 바이트 배열 자체를 리소스로 처리**
*   동적으로 생성된 데이터를 스트림으로 처리할 때 유용

```
byte[] data = "Hello Spring".getBytes();
Resource resource = new ByteArrayResource(data);
InputStream is = resource.getInputStream();
```

* * *

### _언제 어떤 Resource를 써야 할까?_

| 구현체 | 용도 | 설명 |
| --- | --- | --- |
| ClassPathResource | 설정 파일, 리소스 파일 | 클래스패스 기준으로 로드 |
| FileSystemResource | 로컬 파일 읽기/쓰기 | 절대 또는 상대경로 |
| UrlResource | HTTP, FTP 등 외부 리소스 | URL 기반으로 접근 |
| ServletContextResource | 웹 컨텍스트 내 리소스 | /WEB-INF 등 내부 파일 |
| ByteArrayResource | 메모리 리소스 처리 | 바이트 배열을 스트림으로 |

* * *

### 정리

*   **Resource**는 다양한 위치에 있는 파일을 하나의 방식으로 처리하게 도와줍니다.
*   상황에 따라 적절한 구현체를 선택하세요:

*   설정 파일 → ClassPathResource
*   사용자 업로드 파일 → FileSystemResource
*   외부 API 파일 → UrlResource

*   모든 Resource는 결국 `getInputStream()`으로 **InputStream으로 변환**해 파일 내용을 읽습니다.

## 관련 문서

- [(학습/프로젝트/토이프로젝트/파일 업로드&다운로드) [File I/O #1] Java 파일 처리의 기본 개념 정리]([File%20I-O%20#1]%20Java%20파일%20처리의%20기본%20개념%20정리.md) — File I/O 시리즈의 기초 개념(Resource, InputStream, OutputStream)을 다루는 선행 편
- [(학습/프로젝트/토이프로젝트/파일 업로드&다운로드) [File I/O #3] InputStream과 OutputStream 완전 정리]([File%20I-O%20#3]%20InputStream과%20OutputStream%20완전%20정리.md) — Resource 구현체를 다룬 후, InputStream/OutputStream 자체를 자세히 정리하는 후속 편
- [(학습/프로젝트/토이프로젝트/파일 업로드&다운로드) [Spring-Resource] 스프링 Resource의 이해 (+ InputStream)]([Spring-Resource]%20스프링%20Resource의%20이해%20(+%20InputStream).md) — 동일한 5가지 Resource 구현체를 다루는 유사 주제의 문서 (InputStream 구현체까지 확장하여 정리)

---
title: "File Download"
tags: [학습, 개발-CS, 언어, JAVA, Spring]
created: 2026-09-05
modified: 2026-09-05
---

# File Download

Spring MVC 환경에서 파일 다운로드를 구현하는 방법을 정리한 노트다. 핵심은 `FileSystemResource`로 대상 파일을 `Resource`로 감싸 응답 바디에 실어 보내고, `Content-Disposition` 헤더를 명시적으로 설정해야 브라우저가 화면에 표시하지 않고 다운로드로 처리한다는 점이다.

> [!NOTE] 실행 환경
> `@GetMapping`, `ContentDisposition.builder(...)` API가 사용되어 Spring Framework 5.0 이상(`ContentDisposition` 클래스는 Spring 5.0에서 도입됨) 환경으로 추정된다. 구체적인 Spring Boot 버전은 코드상 명시되어 있지 않다.

> [!NOTE]
> Spring 기반 파일 다운로드 구현 정리.
> 실무에서 이관.

## 📌 개념

- `FileSystemResource`는 `Resource`의 구현체로, 파일 크기 조회 및 `InputStream` 지원이 가능
- 다운로드 헤더(`Content-Disposition`)를 명시적으로 설정해야 브라우저가 다운로드로 처리함

```java
@GetMapping("/download")
public ResponseEntity<FileSystemResource> download(@RequestParam("filename") String filename) {
    String downloadDir = "/your/upload/path";
    Path path = Paths.get(downloadDir, filename);
    File file = path.toFile();

    if (!file.exists()) {
        return ResponseEntity.notFound().build();
    }

    // 다운로드 헤더 설정
    HttpHeaders headers = new HttpHeaders();
    headers.setContentDisposition(ContentDisposition.builder("attachment")
            .filename(file.getName(), StandardCharsets.UTF_8)
            .build());

    return ResponseEntity.ok()
            .headers(headers)
            .contentLength(file.length())
            .body(new FileSystemResource(file));
}

```

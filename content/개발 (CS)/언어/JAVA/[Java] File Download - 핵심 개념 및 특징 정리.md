---
title: "File Download"
tags: [학습, 개발-CS, 언어, JAVA, Spring]
created: 2026-09-05
modified: 2026-09-05
---

# File Download

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

---
title: "File Upload"
tags: [학습, 개발-CS, 언어, JAVA, Spring]
created: 2026-09-05
modified: 2026-09-05
---

# File Upload

Spring MVC 환경에서 파일 업로드를 구현하는 방법을 정리한 노트다. 핵심은 요청으로 들어온 `MultipartFile`을 `Paths.get(...)`으로 만든 저장 경로의 `File` 객체로 `transferTo()` 호출 한 번에 저장하고, `IOException`을 잡아 실패 시 500 응답을 내려준다는 흐름이다.

> [!NOTE] 실행 환경
> `@PostMapping`, `MultipartFile` API가 사용되어 Spring MVC 4.3 이상(`@PostMapping` 도입 버전) 환경으로 추정된다. 구체적인 Spring Boot 버전은 코드상 명시되어 있지 않다.

> [!NOTE]
> Spring 기반 파일 업로드 구현 정리.

## 📌 개념

- `MultipartFile.transferTo(File file)`로 파일 저장 가능
- `Paths.get("파일경로/파일명")` → `File file = path.toFile()`로 경로 변환

```java
@PostMapping("/upload")
public ResponseEntity<String> upload(@RequestParam("file") MultipartFile multipartFile) {
    try {
        // 저장할 경로 설정
        String uploadDir = "/your/upload/path";
        String fileName = multipartFile.getOriginalFilename();
        Path path = Paths.get(uploadDir, fileName);

        // 파일 저장
        File file = path.toFile();
        multipartFile.transferTo(file);

        return ResponseEntity.ok("Upload successful: " + fileName);
    } catch (IOException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed");
    }
}

```

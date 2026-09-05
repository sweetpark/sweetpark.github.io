---
title: "File Upload"
tags: [학습, 개발-CS, 언어, JAVA, Spring]
created: 2026-09-05
modified: 2026-09-05
---

# File Upload

> [!NOTE]
> Spring 기반 파일 업로드 구현 정리.
> 실무에서 이관.

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

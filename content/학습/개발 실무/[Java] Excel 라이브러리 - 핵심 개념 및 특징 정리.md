---
title: Excel 라이브러리
tags: [학습, 개발실무, 공통]
created: 2026-02-04
modified: 2026-09-05
---

# Excel 라이브러리

> [!NOTE]
> Apache POI를 이용한 Excel 파일 다운로드, 그리고 순수 Java / MultipartFile을 이용한 파일 다운로드·저장 방식 정리.

## 📌 개념

### Excel 파일 다운로드 (Apache POI)

```java
/*
 - HSSFWorkbook : .xls 처리
 - XSSFWorkbook : .xlsx 처리
*/
```

### Java 파일 다운로드

- pure Java version

    ```text
    // 1. input -> stream 형태로 입력 받기
    // 2. File 객체 생성 (파일 저장 위치 지정)
    // 3. 해당 buffer의 정보를 file.write();
    ```

- MultipartFile

    ```text
    // 1. MultipartFile 이라는 스프링 제공 인터페이스 이용
    // 2. MultipartFile을 이용하여 arg 받음 (@RequestParam, @ModelAttribute 바인딩 가능)
    // 3. MultipartFile을 이용하여 원하는 경로에 저장
    ```

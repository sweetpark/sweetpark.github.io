---
title: "@RequestPart (파일 + json 전송)"
tags: [학습, 개발실무, 공통]
created: 2026-02-04
modified: 2026-09-05
---

# @RequestPart (파일 + json 전송)

> [!NOTE]
> 하나의 요청으로 파일과 JSON을 함께 전송할 때(@RequestPart / ObjectMapper) 처리 방법과 Content-Type 이슈.

## 📌 개념

- form-data로 요청 시: JSON 값 + File 을 함께 전송
    - JSON 값 처리
        - `ObjectMapper`로 역직렬화
        - 또는 `@RequestPart`로 DTO 받기

> [!IMPORTANT]
> 문제 발생 상황
> - File과 Text를 함께 전달하면 `application/octet-stream`으로 전달되는 경우가 있음.
> - `@RequestPart`는 form-data에서만 사용 가능 → 이 경우 `ObjectMapper`로 처리해야 함.

## 💻 예시

```java
@PostMapping(value = "/api/v1/s3/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> upload(@RequestPart("file") MultipartFile file,
                                @RequestPart("data") UploadMetaDto data) {
    // ...
}

// ObjectMapper 방식
@RequestMapping(value = "/api/v1/s3/upload", method = RequestMethod.POST)
public ResponseEntity<?> upload(@RequestHeader(value = "sendDate", required = false) String sendDate,
                                @RequestParam(value = "file", required = false) MultipartFile file,
                                @RequestParam(value = "data", required = false) String data) {
    ObjectMapper objectMapper = new ObjectMapper();
    Map<String, Object> dataMap = objectMapper.readValue(data, Map.class);
    // ...
}
```

> [!NOTE]
> octet-stream: 스트림 형태로 값을 전달하는 형태의 Content-Type.

---
title: "[File I/O #4] InputStreamReader & BufferedReader 완전 분석"
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [File I/O #4] InputStreamReader & BufferedReader 완전 분석

> [!NOTE] 실행 환경
> 같은 폴더의 "[File I/O] 파일 라이브러리 이해하기" 노트에서 Java 17 기준으로 설명하고 있으나, 이 폴더에는 Spring Boot 버전이 별도로 명시되어 있지 않다.

File I/O #4 — InputStreamReader & BufferedReader 완전 분석

* * *

### _InputStreamReader란?_

**InputStreamReader**는 바이트 스트림(InputStream)을 문자 스트림(Reader)으로 변환해주는 클래스입니다.  
즉, 파일이나 네트워크에서 읽은 바이트를 UTF-8 같은 문자 인코딩을 고려해서 **문자 단위**로 읽게 해줍니다.

```
InputStream is = new FileInputStream("text.txt");
InputStreamReader reader = new InputStreamReader(is, StandardCharsets.UTF_8);

int ch;
while ((ch = reader.read()) != -1) {
    System.out.print((char) ch);
}

reader.close();
```

### BufferedReader란?

**BufferedReader**는 Reader(예: InputStreamReader)를 감싸서 성능을 높이고, 편하게 줄 단위로 읽을 수 있게 해줍니다.  
가장 많이 사용하는 기능은 `readLine()` 메서드로 한 줄씩 읽는 것입니다.

```
InputStream is = new FileInputStream("text.txt");
BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));

String line;
while ((line = reader.readLine()) != null) {
    System.out.println(line);
}

reader.close();
```

### _InputStreamReader vs BufferedReader 차이_

| 구분 | InputStreamReader | BufferedReader |
| --- | --- | --- |
| 기능 | 바이트 → 문자 변환 (UTF-8 변환) | 문자 스트림 → 줄 단위 처리 |
| 주요 메서드 | read() | readLine() |
| 단독 사용 | O (가능) | O (Reader 기반이면 가능) |
| 함께 사용 | InputStream → InputStreamReader → BufferedReader 조합이 가장 일반적 | InputStream → InputStreamReader → BufferedReader 조합이 가장 일반적 |

### 언제 어떤 걸 써야 할까?

- 파일이 텍스트 파일이고 **줄 단위**로 읽고 싶다 → **BufferedReader**  
- **파일을 문자 단위**로 읽고 싶다 → **InputStreamReader**  
- 파일 내용을 **한 줄씩 읽어서 파싱**하고 싶다 → **둘을 함께 사용**

### _실전 예제: Resource + BufferedReader_

Resource를 통해 파일을 가져오고 줄 단위로 읽는 가장 흔한 패턴입니다.

```
Resource resource = new ClassPathResource("data.txt");

try (BufferedReader reader = new BufferedReader(
         new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
    
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println("읽은 줄: " + line);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

### 정리

- **InputStreamReader**: 바이트 → 문자로 변환해줌  
- **BufferedReader**: 문자 스트림을 줄 단위로 효율적으로 읽기

## 관련 문서

- [(학습/프로젝트/토이프로젝트/파일 업로드&다운로드) [File I/O #3] InputStream과 OutputStream 완전 정리]([File%20I-O%20#3]%20InputStream과%20OutputStream%20완전%20정리.md) — InputStream/OutputStream의 기본 개념을 다루는 선행 편
- [(학습/프로젝트/토이프로젝트/파일 업로드&다운로드) [File I/O #5] MultiPartFile (Form데이터) 처리하기]([File%20I-O%20#5]%20MultiPartFile%20(Form데이터)%20처리하기.md) — Resource+BufferedReader 패턴을 실전 예제인 MultipartFile 업로드 처리에 적용하는 후속 편

---
title: "HTTP Message Converter"
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP Message Converter

> [!NOTE] 실행 환경
> 버전 명시 없음 — `HttpMessageConverter` 인터페이스와 `org.springframework.http.converter` 패키지 등 Spring 공통 API만 사용되어 특정 버전 확정은 어려움.

## HTTP Message Converter 란?

*   HTTP message Converter는 메시지 형식에 따라 맞추어 변환시켜주는 작업
*   주로 HTTP API 및 text 를 message Body에 반환시에 사용됨
*   Controller에 데이터가 들어오고 응답으로 나갈때 message Converter가 작동함

HTTP 메시지 바디는 결국 바이트 스트림이므로, 이를 자바 객체(String, byte[], 커스텀 객체 등)와 상호 변환하는 과정이 필요하다. 스프링은 요청의 Content-Type과 반환 타입에 맞는 컨버터를 canRead()/canWrite()로 판별해 자동으로 선택해주므로, 개발자가 매번 파싱·직렬화 코드를 직접 작성하지 않아도 된다.

## SpringMVC의 message Converter 적용 시기

*   HTTP 요청
    *   @RequestBody
    *   HttpEntity(RequestEntity)
*   HTTP 응답
    *   @ReponseBody
    *   HttpEntity(ResponseEntity)

## Spring boot의 기본 메시지 컨버터

0 = ByteArrayHttpMessageConverter  
1 = StringHttpMessageConverter  
2 = MappingJackson2HttpMessageConverter  
...  
//package org.springframework.http.converter : 여러 종류들이 존재 ( xml, protobuf ... )

*   ByteArrayHttpMessageConverter
    *   클래스 타입 : byte[]
    *   미디어 타입 : */*
    *   예시)
        *   요청 ) @RequestBody byte[] data
        *   응답 ) @ResponseBody return byte[]  ( 미디어 타입 : application/octet-stream )
*   StringHttpMessageConverter
    *   클래스 타입 : String
    *   미디어 타입 : */*
    *   예시)
        *   요청 ) @RequestBody String data
        *   응답 ) @ResponseBody return "ok" ( 미디어 타입 : text/plain )
*   MappingJackson2HttpMessageConverter
    *   클래스 타입 : 객체 or HashMap
    *   미디어 타입 : application/json
    *   예시)
        *   요청 ) @RequestBody HelloData data
        *   응답 ) @ResponseBody return helloData ( 미디어 타입 : application/json )

등록 순서가 ByteArray -> String -> Json 순인 것은, 더 구체적이고 제한적인 타입(byte[], String)을 먼저 확인한 뒤 여기에 해당하지 않는 나머지 객체 타입을 JSON 컨버터로 처리하기 위한 것으로 알려져 있다.

## Message Converter Interface

```java
public interface HttpMessageConverter<T> {
    boolean canRead(Class<?> clazz, @Nullable MediaType mediaType);

    boolean canWrite(Class<?> clazz, @Nullable MediaType mediaType);

    List<MediaType> getSupportedMediaTypes();

    default List<MediaType> getSupportedMediaTypes(Class<?> clazz) {
        return !this.canRead(clazz, (MediaType)null) && !this.canWrite(clazz, (MediaType)null) ? Collections.emptyList() : this.getSupportedMediaTypes();
    }

    T read(Class<? extends T> clazz, HttpInputMessage inputMessage) throws IOException, HttpMessageNotReadableException;

    void write(T t, @Nullable MediaType contentType, HttpOutputMessage outputMessage) throws IOException, HttpMessageNotWritableException;
}
```

*   요청
    *   canRead() 메서드를 이용해서 지원가능한 converter가 있는지 확인
    *   read() 메서드를 이용해서 데이터 값 조회
*   응답
    *   canWrite() 메서드를 이용해서 지원가능한 converter가 있는지 확인
    *   write() 메서드를 이용해서 데이터 값 반환
*   예시)
    *   JSON 형식의 요청 및 응답
    *   요청 ) 요청 -> json converter -> 데이터 읽기
    *   응답 ) 객체 -> json converter -> 데이터 쓰기

## 관련 문서

- [(학습/프레임워크/Spring Framework) Spring MVC (Http 요청 처리)](Spring%20MVC%20(Http%20요청%20처리).md) — @RequestBody/HttpEntity로 이 노트의 메시지 컨버터가 요청을 읽는 과정을 다루는 노트
- [(학습/프레임워크/Spring Framework) SpringMVC ( Http 응답 처리 )](SpringMVC%20(%20Http%20응답%20처리%20).md) — @ResponseBody/ResponseEntity로 이 노트의 메시지 컨버터가 응답을 쓰는 과정을 다루는 노트

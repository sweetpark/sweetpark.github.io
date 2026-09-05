---
title: HTTP Message Converter
tags: [Spring Framework, SPRING]
created: 2026-09-05
modified: 2026-09-05
---

# HTTP Message Converter

## HTTP Message Converter 란?

*   HTTP message Converter는 메시지 형식에 따라 맞추어 변환시켜주는 작업
*   주로 HTTP API 및 text 를 message Body에 반환시에 사용됨
*   Controller에 데이터가 들어오고 응답으로 나갈때 message Converter가 작동함

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

> 원문: https://gradualprecision.tistory.com/86

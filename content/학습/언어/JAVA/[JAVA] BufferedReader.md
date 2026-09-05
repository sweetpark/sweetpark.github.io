---
title: [JAVA] BufferedReader
tags: [프로그래밍 언어, JAVA]
created: 2026-09-05
modified: 2026-09-05
---

# [JAVA] BufferedReader

1. 정의  
2. 사용이유  
3. 예제

## 정의

문자, 배열 및 줄을 효율적으로 읽을 수 있도록 문자를 버퍼링하여,  
문자 입력 스트림에서 텍스트를 읽는 클래스

## Buffered Reader 사용 이유

*   지정된 파일 혹은 입력을 버퍼에 저장하지 않을경우, read() / readline()을 할때마다 파일또는 입력에서 바이트를 읽어 문자로 변환한 후 반환하므로 매우 비효율임
*   buffer를 사용하여 입력 및 파일 읽은 내용을 저장하고, 텍스트로 변환하는 작업을 줄일 수 있다

## 예제

bufferedReader의 경우 Reader객체와 함께 사용됨  
( Reader 객체 : **FileReader, InputStreamReader** 등 )
```java
public class Test{
     public static void main(String[] args) throws Exception{
         
         BufferedReader buffer = new BufferedReader( new InputStreamReader(System.in) );
         //...
         
         
         buf.close() // 사용후에는 리소스를 잡으므로, close() 해줘야함
     }
}
```

> 원문: https://gradualprecision.tistory.com/135

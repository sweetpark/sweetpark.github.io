---
title: "[Spring-Resource] 스프링 Resource의 이해 (+ InputStream)"
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [Spring-Resource] 스프링 Resource의 이해 (+ InputStream)

* 요약 정보 *  
[Resource]  
- Resource는 인터페이스이다.  
- Resource를 사용하여, 기본적인 파일 상태값 또는 파일 여부를 파악이 가능하다  
- Resource 혹은 직접 작성하여 InputStream을 이용하여 제어할 수 있다  
  
[InputStream]  
- InputStream도 추상화된 추상클래스  
- FilterInputStream에서는 감싸기 기능이 추가된 InputStream이며, Resource와 결합하여 사용할 수 있다.  
**- FileInputStream을 이용하여 파일제어가 가능하다.**  
(**이외에도 InputStream 구현체를 이용하여, 바이트 제어 및 오디오, 역직렬화, 스레드간의 통신이 가능)  
  
** 결론) 바이트 및 내용을 수정하는 것은 InputStream 클래스, 경로 및 상태값 확인은 Resource를 이용  
(Resource를 이용하여 체크 후, InputStream으로 변환하여 조작)**

## Resource 인터페이스

*   저수준 리소스에 대한 추상화
*   파일이나 클래스 경로 리소스와 같은 기본 리소스의 실제 유형을 추상화

```java
public interface InputStreamSource {
	
    // 리소스를 찾아서 열고, InputStream을 반환
	InputStream getInputStream() throws IOException;
}
```
```java
public interface Resource extends InputStreamSource {

//리소스가 존재하는지 확인
boolean exists();

//내용을 읽을 수 있는지 확인
boolean isReadable();

//열려있는 스트림을 가진 핸들인지 확인
boolean isOpen();

//파일시스템의 파일을 나타내는지 확인
boolean isFile();

//url 핸들 반환
URL getURL() throws IOException;
//uri 핸들 반환
URI getURI() throws IOException;
//file 핸들 반환
File getFile() throws IOException;

ReadableByteChannel readableChannel() throws IOException;

//콘텐츠 길이 확인
long contentLength() throws IOException;

//마지막 수정된 타임스탬프 확인
long lastModified() throws IOException;

//리소스와 관련된 리소스를 만듬
Resource createRelative(String relativePath) throws IOException;

//파일 이름 결정
String getFilename();

String getDescription();
}
```

## Resource 구현체

**#1 URLResource**

*   파일 시스템 경로 접근하는 경우 ( file : )
*   HTTPS 프로토콜을 이용하는 경우 ( https: )
*   FTP 프로토콜을 이용하는 경우 ( ftp: )
*   java.net.URL파일, HTTPS 대상, FTP 대상 등과 같이 일반적으로 URL로 액세스할 수 있는 모든 개체에 액세스하는 데 사용

```java
// URL 형식의 리소스 지정 (예: HTTP 프로토콜)
Resource resource = new UrlResource("http://example.com/data.txt");

if (resource.exists()) {
    InputStream is = resource.getInputStream();
    // InputStream을 이용한 파일 처리 로직 추가
    System.out.println("리소스를 성공적으로 읽었습니다.");
    is.close();
}
```

#2 ClassPathResource

*    클래스 경로에서 얻어야 하는 리소스
*   스레드 컨텍스트 클래스 로더, 주어진 클래스 로더 또는 주어진 클래스를 사용하여 리소스를 로드
*   클래스를 읽어오기 위한 경우

```java
Resource resource = new ClassPathResource("config.properties");
InputStream inputStream = resource.getInputStream();
```

**#3 FileSystemResource**

*   File들을 직접 반환 ( 상대경로 or 절대경로 )

```java
Resource resource = new FileSystemResource("/path/to/file.txt");
InputStream is = resource.getInputStream();
```

#4 ServletContextResource

*   서블릿 컨테이너로부터 주입받은 ServletContext

```java
Resource resource = new ServletContextResource(servletContext, "/WEB-INF/config.xml");
InputStream is = resource.getInputStream();
```

#5  ByteArrayResource

*   바이트 배열을 Resource로 다룸

```java
byte[] data = "Hello Spring".getBytes();
Resource resource = new ByteArrayResource(data);
InputStream is = resource.getInputStream();
```

## InputStream

*   바이트 입력 스트림을 나타내는 모든 클래스의 슈퍼클래스 (추상클래스)

구현체 : AudioInputStream, ByteArrayInputStream, FileInputStream, FilterInputStream, ObjectInputStream, PipedInputStream, SequenceInputStream
```java
// 읽을 수 있는 바이트수 크기
int available()

// 입력 스트림 닫기
void close()

// 입력 스트림의 현재 위치
void mark(int readlimit)

// mark이 입력 스트림 및 reset메서드를 지원하는지 테스트
boolean	markSupported()

// 다음 데이터 바이트 읽기
abstract int read()

// 특정 수의 바이트를 읽어 b에 저장
int read(byte[] b)

// 입력스트림ㅇ에서 len 바이트크기만큼 데이터를 읽어 배열러 놓기
int read(byte[] b, int off, int len)

// mark 메서드가 마지막으로 호출된 시간의 위치로 다시 배치합니다 .
void reset()

// n만큼 데이터 바이트를 건너뜀 (버림)
long skip(long n)
```

#1 AudioInputStream

*   audio 파일에 대한 입출력

```java
File audioFile = new File("example.wav");
AudioInputStream audioStream = AudioSystem.getAudioInputStream(audioFile);
```

#2 ByteArrayInputStream

*   바이트 배열을 읽기

```java
byte[] data = "Hello, ByteArrayInputStream!".getBytes();
ByteArrayInputStream bais = new ByteArrayInputStream(data);
```

#3 FileInputStream

*   파일 읽기

```java
FileInputStream fis = new FileInputStream("data.txt")
```

#4 FilterInputStream

*   inputstream  감싸서 추가 기능 (wrapper)
*   ex) 버퍼링, 데이터변환 등

```java
Resource resource = new ClassPathResource("data.txt");
InputStream is = resource.getInputStream();
BufferedInputStream bis = new BufferedInputStream(is)
```

#5 ObjectInputStream

*   직렬화한 된 객체데이터를 역직렬화하여 객체로 복원하는 Stream

```java
ObjectInputStream ois = new ObjectInputStream(new FileInputStream("object.dat"))
```

#6 PipedInputStream

*   스레드간의 통신을 위한 스트림

```java
PipedInputStream pipedIn = new PipedInputStream();
PipedOutputStream pipedOut = new PipedOutputStream(pipedIn);

// 데이터 쓰기 스레드
new Thread(() -> {
    try {
        pipedOut.write("데이터 전달".getBytes());
        pipedOut.close();
    } catch (IOException e) {
        e.printStackTrace();
    }
}).start();

// 데이터 읽기 스레드
int data;
while ((data = pipedIn.read()) != -1) {
    System.out.print((char) data);
}
pipedIn.close();
```
#7 SequenceInputStream

*   여러개의 InputStream을 한개로 묶어주는 역할
*   docs 확인

## 참고문헌

[https://docs.oracle.com/javase/8/docs/api/java/io/InputStream.html](https://docs.oracle.com/javase/8/docs/api/java/io/InputStream.html)

 [InputStream (Java Platform SE 8 )

Reads some number of bytes from the input stream and stores them into the buffer array b. The number of bytes actually read is returned as an integer. This method blocks until input data is available, end of file is detected, or an exception is thrown. If

docs.oracle.com](https://docs.oracle.com/javase/8/docs/api/java/io/InputStream.html)

[https://docs.spring.io/spring-framework/reference/core/resources.html](https://docs.spring.io/spring-framework/reference/core/resources.html)

 [Resources :: Spring Framework

Java’s standard java.net.URL class and standard handlers for various URL prefixes, unfortunately, are not quite adequate enough for all access to low-level resources. For example, there is no standardized URL implementation that may be used to access a r

docs.spring.io](https://docs.spring.io/spring-framework/reference/core/resources.html)

[https://docs.spring.io/spring-framework/reference/core/resources.html](https://docs.spring.io/spring-framework/reference/core/resources.html)

 [Resources :: Spring Framework

Java’s standard java.net.URL class and standard handlers for various URL prefixes, unfortunately, are not quite adequate enough for all access to low-level resources. For example, there is no standardized URL implementation that may be used to access a r

docs.spring.io](https://docs.spring.io/spring-framework/reference/core/resources.html)

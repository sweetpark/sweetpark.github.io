---
title: "[File I/O #3] InputStream과 OutputStream 완전 정리"
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [File I/O #3] InputStream과 OutputStream 완전 정리

File I/O #3 — InputStream과 OutputStream 완전 정리

* * *

### _InputStream이란?_

**InputStream**은 Java에서 **바이트 단위**로 데이터를 읽기 위한 추상 클래스입니다.  
파일, 메모리, 네트워크 등 다양한 소스로부터 데이터를 읽을 수 있습니다.

```
int read();                          // 한 바이트 읽기
int read(byte[] b);                  // 바이트 배열로 읽기
int read(byte[] b, int off, int len);// 일부 바이트만 읽기
long skip(long n);                   // n 바이트 건너뛰기
int available();                     // 읽을 수 있는 바이트 수
void close();                        // 스트림 닫기
void mark(int readlimit);           // 현재 위치에 마크 설정
void reset();                        // mark 위치로 되돌리기
boolean markSupported();            // mark/reset 지원 여부
```

#### _주요 구현체_

*   **FileInputStream**: 파일에서 바이트 읽기
*   **ByteArrayInputStream**: 바이트 배열을 읽기
*   **BufferedInputStream**: 버퍼를 사용해 효율적 읽기
*   **ObjectInputStream**: 직렬화된 객체 복원
*   **PipedInputStream**: 스레드 간 데이터 전달
*   **AudioInputStream**: 오디오 파일 읽기
*   **SequenceInputStream**: 여러 InputStream을 하나로 연결

#### InputStream 사용 예시

```
InputStream is = new FileInputStream("data.txt");
int data;
while ((data = is.read()) != -1) {
    System.out.print((char) data);
}
is.close();
```

* * *

### _OutputStream이란?_

**OutputStream**은 Java에서 바이트 단위로 데이터를 쓰기 위한 추상 클래스입니다.  
파일, 메모리, 네트워크 등에 데이터를 출력할 때 사용됩니다.

```
void write(int b);                   // 한 바이트 쓰기
void write(byte[] b);                // 바이트 배열 쓰기
void write(byte[] b, int off, int len); // 일부 바이트만 쓰기
void flush();                        // 버퍼 비우기 (즉시 출력)
void close();                        // 스트림 닫기
```

#### _주요 구현체_

*   **FileOutputStream**: 파일에 바이트 쓰기
*   **ByteArrayOutputStream**: 바이트를 메모리에 저장
*   **BufferedOutputStream**: 버퍼를 이용한 효율적 쓰기
*   **ObjectOutputStream**: 객체를 직렬화하여 저장
*   **PipedOutputStream**: 다른 스레드로 바이트 전달

#### _OutputStream 사용 예시_

```
OutputStream os = new FileOutputStream("output.txt");
String content = "Hello, OutputStream!";
os.write(content.getBytes());
os.close();
```

* * *

### _InputStream과 OutputStream 연동 예제_

파일을 읽어서 다른 파일로 복사하는 기본 구조입니다.

```
InputStream is = new FileInputStream("input.txt");
OutputStream os = new FileOutputStream("output.txt");

int data;
while ((data = is.read()) != -1) {
    os.write(data);
}

is.close();
os.close();
```

###  정리

- InputStream: 바이트 단위 입력 처리 (읽기)  
- OutputStream: 바이트 단위 출력 처리 (쓰기)  
- **BufferedStream**을 함께 사용하면 **성능이 향상**됩니다.  
- **Resource로부터 InputStream**을 받아 처리할 수 있습니다.

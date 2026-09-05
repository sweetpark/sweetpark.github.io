---
title: "[File I/O #6] File이외의 I/O Stream 정리 (Object, Audio, Piped 등)"
tags: [토이프로젝트, 파일 업로드&다운로드]
created: 2026-09-05
modified: 2026-09-05
---

# [File I/O #6] File이외의 I/O Stream 정리 (Object, Audio, Piped 등)

목차

[1. Resource와 Stream I/O 이해](https://gradualprecision.tistory.com/266)

[2. Resource 구현체 이해하기](https://gradualprecision.tistory.com/267)

[3. InputStream/OutputStream 이해하기](https://gradualprecision.tistory.com/268)

[4. InputStreamReader, BufferedReader 이해하기](https://gradualprecision.tistory.com/269)

[5. Multipartfile 처리하기](https://gradualprecision.tistory.com/270)

[6. File 이외의 I/O stream 정리](https://gradualprecision.tistory.com/271)

File I/O #6 — 고급 입출력 스트림 정리 (Object, Audio, Piped 등)

* * *

### 1. ObjectInputStream / ObjectOutputStream

객체를 바이트 형태로 저장하거나 다시 객체로 복원하는 데 사용됩니다.

**직렬화(Serialization)**와 **역직렬화(Deserialization)** 기능을 제공하죠.

```
// 객체 저장 (직렬화 - 바이트로 저장)
ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("object.dat"));
oos.writeObject(new User("홍길동", 30));
oos.close();

// 객체 읽기 (역직렬화 - 바이트 읽기)
ObjectInputStream ois = new ObjectInputStream(new FileInputStream("object.dat"));
User user = (User) ois.readObject();
ois.close();
```

**주의:** 직렬화하려는 클래스는 `implements Serializable` 필요

### 2. AudioInputStream

Java에서 **WAV, AU 등 오디오 파일을 읽고 재생하거나 분석**할 때 사용되는 스트림입니다.  
(Java의 `javax.sound.sampled` 패키지)

```
File audioFile = new File("example.wav");
AudioInputStream audioStream = AudioSystem.getAudioInputStream(audioFile);

// 포맷 확인
AudioFormat format = audioStream.getFormat();
System.out.println("Sample Rate: " + format.getSampleRate());
```

### **3. PipedInputStream / PipedOutputStream**

두 스레드 간에 데이터를 주고받을 수 있게 해주는 스트림입니다.

**한 스레드가 쓰고, 다른 스레드가 읽음**으로써 실시간 통신 구조를 만들 수 있어요.

```
PipedInputStream pipedIn = new PipedInputStream();
PipedOutputStream pipedOut = new PipedOutputStream(pipedIn);

// 쓰기 스레드
new Thread(() -> {
    try {
        pipedOut.write("스레드 간 통신 데이터".getBytes());
        pipedOut.close();
    } catch (IOException e) {
        e.printStackTrace();
    }
}).start();

// 읽기 스레드
new Thread(() -> {
    try {
        int data;
        while ((data = pipedIn.read()) != -1) {
            System.out.print((char) data);
        }
        pipedIn.close();
    } catch (IOException e) {
        e.printStackTrace();
    }
}).start();
```

### 4. SequenceInputStream

**여러 InputStream을 하나로 연결**하여 연속적으로 데이터를 읽을 수 있게 해줍니다.  
예를 들어 여러 파일을 하나의 스트림처럼 처리하고 싶을 때 유용합니다.

```
InputStream input1 = new FileInputStream("file1.txt");
InputStream input2 = new FileInputStream("file2.txt");

SequenceInputStream sis = new SequenceInputStream(input1, input2);
int data;
while ((data = sis.read()) != -1) {
    System.out.print((char) data);
}
sis.close();
```

### 고급 Stream I/O 정리

| 스트림 | 설명 | 사용 예시 |
| --- | --- | --- |
| ObjectInputStreamObjectOutputStream | 객체를 저장하고 불러오기 | 세이브 데이터, 설정 저장 |
| AudioInputStream | 오디오 파일 처리 | 음악 재생, 오디오 분석 |
| PipedInputStreamPipedOutputStream | 읽기/쓰기 스레드 간 실시간 통신 | 실시간 처리 구조 |
| SequenceInputStream | 여러개의 InputStream 연결 | 여러 파일 합치기 |

* * *

### 5. 채널 기반 입출력 (Channel I/O)

Java NIO(New I/O)에서는 기존의 InputStream, OutputStream보다 **더 빠르고 효율적인 입출력 방식**으로 **Channel**을 제공합니다.  
Channel은 읽기와 쓰기가 모두 가능한 이중 구조이며, **버퍼(Buffer)**와 함께 사용됩니다.

#### 주요 채널 인터페이스

*   ReadableByteChannel – 읽기 전용
*   WritableByteChannel – 쓰기 전용
*   FileChannel – 파일 기반 입출력 지원 (읽기/쓰기)

#### FileChannel 사용 예제

```
// 파일에서 읽기
try (FileInputStream fis = new FileInputStream("data.txt");
     FileChannel channel = fis.getChannel()) {

    ByteBuffer buffer = ByteBuffer.allocate(1024);
    while (channel.read(buffer) > 0) {
        buffer.flip(); // 읽을 준비
        while (buffer.hasRemaining()) {
            System.out.print((char) buffer.get());
        }
        buffer.clear(); // 버퍼 비우기
    }
}
```

```
// 파일에 쓰기
try (FileOutputStream fos = new FileOutputStream("output.txt");
     FileChannel channel = fos.getChannel()) {

    String data = "Hello, FileChannel!";
    ByteBuffer buffer = ByteBuffer.wrap(data.getBytes());
    channel.write(buffer);
}
```

#### FileChannel vs Stream 비교

| 항목 | InputStream / OutputStream | Channel (NIO) |
| --- | --- | --- |
| 기반 | 바이트 기반 스트림 | 채널 & 버퍼 기반 |
| 속도 | 상대적으로 느림 | 빠름 (DirectBuffer, OS 지원) |
| 기능 | 순차적 읽기/쓰기 | 랜덤 액세스, 이중 채널, 멀티스레드 효율적 |
| 멀티스레드 | 지원 제한적 | 동기화에 적합 |

#### _Resource와 Channel 함께 사용하기_

Spring의 Resource는 readableChannel() 메서드로 NIO 채널도 지원합니다.

```
Resource resource = new ClassPathResource("data.txt");
ReadableByteChannel channel = Channels.newChannel(resource.getInputStream());

ByteBuffer buffer = ByteBuffer.allocate(1024);
while (channel.read(buffer) > 0) {
    buffer.flip();
    while (buffer.hasRemaining()) {
        System.out.print((char) buffer.get());
    }
    buffer.clear();
}
channel.close();
```

#### Channel I/O 요약

*   **FileChannel**은 파일 입출력을 더 빠르고 효율적으로 처리 가능
*   **ByteBuffer**를 이용해 메모리 직접 제어
*   **Resource + Channel** 조합으로 Spring에서도 활용 가능
*   **대용량 파일 처리**나 **성능 최적화**에 매우 유리

* * *

### 시리즈 마무리

지금까지 총 6편에 걸쳐 Java의 파일 입출력(File I/O)에 대해 알아보았다.

*   **#1** 기본 개념: Resource, InputStream, OutputStream
*   **#2** Resource 구현체
*   **#3** InputStream과 OutputStream
*   **#4** InputStreamReader & BufferedReader
*   **#5** MultipartFile 업로드 처리
*   **#6** File이외의 I/O Stream 정리 (Object, Audio, Piped 등)

> 원문: https://gradualprecision.tistory.com/271

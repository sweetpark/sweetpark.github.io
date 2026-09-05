---
title: [게임서버프로그래밍#4] Client-Server 기본 연결과 통신
tags: [개발 서적 리뷰, 게임서버 프로그래머 책]
created: 2026-09-05
modified: 2026-09-05
---

# [게임서버프로그래밍#4] Client-Server 기본 연결과 통신

![](https://blog.kakaocdn.net/dna/byy7oc/btsNEfVtOPm/AAAAAAAAAAAAAAAAAAAAAE1c6iQRe91e13HT6l5frMGLtLfs2dyxdFvcZJCSUcOF/img.jpg?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=rtL1k9kGZX68%2F3W%2B2BZaVC5jHBE%3D)

이 글에서는 TCP 기반으로 클라이언트-서버 연결을 구현하는 기본 흐름을 설명한다.  
Winsock 초기화, 비동기 소켓 설정(ioctlsocket), select를 통한 이벤트 감지 등  
기본적인 소켓 프로그래밍을 단계별로 다룬다.

* * *

## _기본 통신 구조_

(Client와 Server는 각각 다음과 같은 순서로 동작한다)

### 클라이언트(Client)

1.  소켓 생성 (socket)
2.  서버 주소로 연결 시도 (connect)
3.  데이터 송신 (send)
4.  데이터 수신 (recv)
5.  소켓 종료 (closesocket)

### 서버(Server)

1.  소켓 생성 (socket)
2.  포트 바인딩 (bind)
3.  연결 대기 (listen)
4.  연결 수락 (accept)
5.  데이터 송신/수신 (send/recv)
6.  소켓 종료 (closesocket)

* * *

## _비동기 소켓 설정_

### ioctlsocket()

*   소켓을 **논블로킹(Non-blocking)** 모드로 전환하기 위해 사용한다.
*   FIONBIO 플래그를 설정하면 connect(), send(), recv() 호출 시 대기하지 않고 바로 반환된다.

```cpp
u_long mode = 1;
ioctlsocket(sock, FIONBIO, &mode);
```

**주의:**  
비동기 설정 이후, 각 함수 호출 결과를 select()로 체크하거나, 에러코드를 직접 확인해야 한다.

* * *

## _소켓 상태 확인: getsockopt()_

*   소켓 옵션이나 상태를 조회할 때 사용한다.
*   특히 **SO_ERROR**를 이용하면 connect() 결과를 확인할 수 있다.

```cpp
int error;
socklen_t len = sizeof(error);
getsockopt(sock, SOL_SOCKET, SO_ERROR, (char*)&error, &len);
```

* * *

## 이벤트 감지: select()

select()는 소켓이 읽기, 쓰기 가능 상태가 되었는지 확인하는 함수다.

*   읽기 가능: recv()를 호출할 수 있음
*   쓰기 가능: send()를 호출할 수 있음
*   오류 발생: 소켓에 문제가 생김

```cpp
fd_set readSet, writeSet;
FD_ZERO(&readSet);
FD_ZERO(&writeSet);
FD_SET(sock, &readSet);
FD_SET(sock, &writeSet);

/*
int select(
  int nfds,             // 소켓 최대값 + 1 (Windows에서는 무시 가능)
  fd_set* readfds,      // 읽기 이벤트 감시
  fd_set* writefds,     // 쓰기 이벤트 감시
  fd_set* exceptfds,    // 오류 감시
  const timeval* timeout // 대기 시간 (NULL이면 무한 대기)
);
*/

select(0, &readSet, &writeSet, nullptr, &timeout);

//...

if (FD_ISSET(sock, &readSet)) {
    // sock에서 읽을 데이터가 있음
}
```

### FD_ZERO(fd_set)

*   fd_set을 초기화한다.
*   사용 전에 반드시 FD_ZERO로 초기화해야 한다.

### FD_SET(socket, fd_set)

*   특정 소켓을 fd_set에 등록한다.
*   예를 들어, 소켓 sock이 읽기 가능한지 감시하고 싶으면: FD_SET(sock, &readSet);

### FD_ISSET(socket, fd_set*)

*   select() 호출 이후, 소켓에 이벤트가 발생했는지 확인한다.

* * *

## _통신 흐름 요약_

| 단계 | 클라이언트 | 서버 |
| --- | --- | --- |
| 소켓 생성 | socket() | socket() |
| 비동기 설정 | ioctlsocket(FIONBIO) | ioctlsocket(FIONBIO) |
| 서버 연결 | connect() → select()로 확인 | bind(), listen() |
| 연결 수락 | (생략) | accept() → select()로 확인 |
| 데이터 송수신 | send(), recv() | send(), recv() |
| 종료 | closesocket() | closesocket() |

* 클라이언트

```cpp
Winsock wsa;
ClientSocket socket("localhost", "27015");

socket.send("Hello from client");
std::string response = socket.receive(512);
std::cout << "Response : " << response << std::endl;
```

*   연결 성공 여부는 select()와 getsockopt()로 확인한다.
*   메시지를 보낸 후, 서버의 응답을 기다린다.

* 서버

```cpp
Winsock wsa;
ServerSocket server;

server.accept_connection();
server.socket_recv("Hello from server");
```

*   listen() 상태에서 select()를 이용해 accept() 가능한지 체크한다.
*   클라이언트로부터 메시지를 수신한 후, 응답 메시지를 송신한다.

* 동기적 처리의 주의사항 *  
- connect(), send(), recv(), accept()는 기본적으로 **Blocking** 동작을 한다.  
- 비동기 소켓 설정 후 select()를 사용하지 않으면, 예상치 못한 지연(대기)이 발생할 수 있다.  
- 서버는 다수 클라이언트 요청을 처리해야 하므로, select()를 통한 이벤트 기반 처리가 필수적이다.

* * *

다음 글에서는 Client-Server 구조를 발전시켜 멀티스레드 환경에서  
여러 클라이언트를 동시에 처리하는 방법을 다룬다.  
  
Thread, Mutex, Chrono를 이용한 타임아웃 제어까지 자세히 살펴본다.

> 원문: https://gradualprecision.tistory.com/17

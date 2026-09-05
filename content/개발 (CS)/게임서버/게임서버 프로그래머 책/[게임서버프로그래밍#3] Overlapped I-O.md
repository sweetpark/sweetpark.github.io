---
title: "[게임서버프로그래밍#3] Overlapped I/O"
tags: [개발 서적 리뷰, 게임서버 프로그래머 책]
created: 2026-09-05
modified: 2026-09-05
---

# [게임서버프로그래밍#3] Overlapped I/O

```text
[기존 비동기 방식]                    [Overlapped I/O]

App --send()--> (재시도 반복) -->OS   App --WSASend()--> OS
     실패해도 계속 호출 (CPU 낭비)          |  I/O를 OS에 위임하고
                                          |  즉시 리턴, 다른 작업 수행
                                          v
                                     작업 완료 시 OS가 알림
                                     (이벤트 객체 or 콜백)
                                          |
                                          v
                              WSAGetOverlappedResult()로 결과 확인
```

이 글에서는 Windows 환경에서 고성능 네트워크 통신을 위해 사용되는  
Overlapped I/O를 설명한다.  
  
기존 비동기 방식의 한계를 보완하며, CPU 낭비를 줄이고 I/O 효율을 높이는 방법과  
주의사항까지 구체적으로 다룬다.

* * *

## _비동기 처리 방식의 문제점_

기존 비동기 처리(select + socket + thread)에서는 다음과 같은 문제점이 존재한다.

*   **메모리 복사 비용:**  
    send() 같은 socket 내부 함수 호출 시 메모리 복사가 발생한다.
*   **불필요한 재시도 호출:**  
    송수신 버퍼에 1바이트라도 여유가 있으면 send()나 recv()를 호출하려 하지만, 실제로 데이터를 보내거나 받을 수 없는 경우가 발생한다.
*   **CPU 낭비:**  
    데이터를 보낼 수 없는 상황에서도 API 호출을 반복하면서 CPU 자원을 낭비하게 된다.

### 예시

*   송신 버퍼에 1바이트 여유가 있지만, 5바이트짜리 메시지를 보내려 할 경우:  
    호출은 하지만 데이터는 송신되지 않음 → 불필요한 CPU 낭비 발생

* * *

## _Overlapped I/O란 무엇인가_

**정의:**  
Overlapped I/O는 **운영체제에게 I/O 요청을 맡기고, 작업 완료 시 알림을 받는** 구조이다. 직접 재시도하지 않고, 이벤트가 발생하면 처리하는 방식이다.

### 장점

*   **메모리 복사 절감:**  
    WSASend() 등을 사용하면 메모리 복사 비용을 줄일 수 있다.
*   **재시도 호출 최소화:**  
    소켓이 가능해질 때까지 기다렸다가, 한 번에 결과를 처리할 수 있다.

* * *

## _Overlapped I/O 처리 흐름_

1.  WSASend()나 WSARecv() 같은 Overlapped 함수를 호출한다.
2.  작업이 완료될 때까지 기다리지 않고, 백그라운드에서 작업이 진행된다.
3.  작업 완료 시 운영체제가 알람을 보낸다.
4.  알람을 받아 결과를 확인한다.

* 주의사항  
- Overlapped I/O에서는 전달한 버퍼를 백그라운드에서 사용한다.  
(따라서, I/O 완료 전까지 해당 버퍼 데이터를 수정하거나 삭제하면 안 된다)

* * *

## _Overlapped 전용 주요 함수_

| 함수 | 설명 |
| --- | --- |
| WSASend() | 비동기 송신 요청 |
| WSASendTo() | 비동기 송신 요청(주소 지정) |
| WSARecv() | 비동기 수신 요청 |
| WSARecvFrom() | 비동기 수신 요청(주소 수신) |
| ConnectEx() | 비동기 연결 설정 |
| AcceptEx() | 비동기 연결 수락 |

* * *

## _I/O 완료 알림 처리 방법_

### 방법 1: 이벤트 객체 사용

*   WSACreateEvent()로 이벤트 객체를 생성하고,  
    WSAWaitForMultipleEvents()로 완료 여부를 감시한다.

### 방법 2: 콜백 함수 사용

*   Overlapped 구조체에 콜백 함수를 설정하고,  
    완료 시 콜백이 자동 호출되게 한다.

**완료 확인:**  
→ WSAGetOverlappedResult()를 호출하여 결과를 가져온다.

* * *

## _간단한 클라이언트/서버 구현 예시_

### 1.  클라이언트 흐름

*   WSASocket()으로 소켓 생성 (WSA_FLAG_OVERLAPPED 플래그 사용)
*   WSASend()로 메시지 송신
*   이벤트 알람 수신 후 WSAGetOverlappedResult()로 완료 확인

### 2.  서버 흐름

*   WSASocket()으로 리스닝 소켓 생성
*   AcceptEx()로 클라이언트 연결 비동기 수락
*   WSARecv()로 데이터 비동기 수신

* 주의  
- 클라이언트 연결 종료 처리한다  
- 완료된 I/O 작업을 스레드로 넘겨 효율적으로 처리해야 한다  
- 다중 클라이언트 요청을 처리할 때 race condition에 주의해야 한다

* * *

## _Overlapped I/O와 IOCP 관계_

Overlapped I/O는 단독으로 사용할 수도 있지만,  
**IOCP (I/O Completion Port)** 와 결합하면 다중 I/O를 매우 효율적으로 처리할 수 있다.

*   Overlapped I/O: 비동기 작업을 요청하는 기술
*   IOCP: 완료된 I/O 작업을 효과적으로 관리하고 스레드에 분배하는 시스템

👉 Overlapped I/O는 **IOCP 기반 서버**를 만들기 위한 핵심 기술이다.

* * *

## CLIENT 구현

```cpp
#include <iostream>
#include <winsock2.h>
#include <MSWSock.h>
#include <string>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

class Winsock
{
public:
    Winsock()
    {
        WSADATA wsa;
        int result = WSAStartup(MAKEWORD(2, 2), &wsa);
        if (result != 0)
        {
            throw std::runtime_error("WSAStartup failed with error : " + std::to_string(result));
        }
    }
    
    ~Winsock()
    {
        WSACleanup();
    }
};

class ClientSocket
{
public:
    ClientSocket()
    {
        //socket() => PF_INET 은 프로토콜 패밀리(pf) 약자
        //sendaddr => AF_INET 은 주소 패밀리(af) 약자
        sock = WSASocket(PF_INET, SOCK_STREAM, 0, NULL, 0, WSA_FLAG_OVERLAPPED);

        memset(&sendAddr, 0, sizeof(sendAddr));
        sendAddr.sin_family = AF_INET;
        inet_pton(AF_INET, "127.0.0.1", &sendAddr.sin_addr);
        sendAddr.sin_port = htons(atoi("27015"));

        if (::connect(sock, (SOCKADDR*)&sendAddr, sizeof(sendAddr)) == SOCKET_ERROR)
        {
            throw std::runtime_error("connect failed with error  : " + std::to_string(WSAGetLastError()));
        }

        evObj = WSACreateEvent();
        memset(&overlapped, 0, sizeof(overlapped));
        overlapped.hEvent = evObj;

        char msg[] = "Hello ovelapped I/O hello";
        int sendBytes = 0;

        dataBuf.len = strlen(msg) + 1;
        dataBuf.buf = msg;

        if (WSASend(sock, &dataBuf, 1, (LPDWORD)&sendBytes, 0, &overlapped, NULL) == SOCKET_ERROR)
        {
            if (WSAGetLastError() == WSA_IO_PENDING)
            {
                std::cout << "Background data send" << std::endl;
                WSAWaitForMultipleEvents(1, &evObj, TRUE, WSA_INFINITE, FALSE);
                WSAGetOverlappedResult(sock, &overlapped, (LPDWORD)&sendBytes, FALSE, NULL);
            }
            else
            {
                throw std::runtime_error("WSASend() Error");
            }
        }

        std::cout << "Send data size : " << sendBytes << std::endl;
        

    }
    ~ClientSocket()
    {
        WSACloseEvent(evObj);
        closesocket(sock);
    }
public:
    WSAOVERLAPPED overlapped;
    WSAEVENT evObj;
    WSABUF dataBuf;

    SOCKET sock;
    SOCKADDR_IN sendAddr;

};

int main()
{
    Winsock wsa;
    ClientSocket sock_;

    return 0;
}
```

## Server 구현

```cpp
#include <iostream>
#include <winsock2.h>
#include <string>
#include <ws2tcpip.h>
#include <chrono>
#include <thread>

#pragma comment(lib, "ws2_32.lib")
#define WSAWAITTIMEOUT 0x00000102

class Winsock
{
public:
	Winsock()
	{
		WSADATA wsa;
		int result = WSAStartup(MAKEWORD(2, 2), &wsa);
		if (result != 0 )
		{
			throw std::runtime_error("WSAStartup failed with error : " + std::to_string(result));

		}
	}

	~Winsock()
	{
		WSACleanup();
	}
};

class ServerSock
{

public:
	ServerSock()
	{
		serverSocket = WSASocket(PF_INET, SOCK_STREAM, 0, NULL, 0, WSA_FLAG_OVERLAPPED);

		memset(&listenAddr, 0, sizeof(listenAddr));
		listenAddr.sin_family = AF_INET;
		listenAddr.sin_addr.s_addr = htonl(INADDR_ANY);
		listenAddr.sin_port = htons(atoi("27015"));

		if (bind(serverSocket, (SOCKADDR*)&listenAddr, sizeof(listenAddr)) == SOCKET_ERROR)
		{
			throw std::runtime_error("bind error : " + std::to_string(WSAGetLastError()));
		}

		if (listen(serverSocket, 5) == SOCKET_ERROR)
		{
			throw std::runtime_error("listen error : " + std::to_string(WSAGetLastError()));
		}

		acceptAddrSize = sizeof(acceptAddr);
		acceptSocket = accept(serverSocket, (SOCKADDR*)&acceptAddr, &acceptAddrSize);

		evObj = WSACreateEvent();
		memset(&overlapped, 0, sizeof(overlapped));
		overlapped.hEvent = evObj;
		dataBuf.len = 8192;
		dataBuf.buf = buf;

	
	}

	void receiveData()
	{
		while (true)
		{
			if (WSARecv(acceptSocket, &dataBuf, 1, (LPDWORD)&recvBytes, (LPDWORD)&flags, &overlapped, NULL) == SOCKET_ERROR) {
				if (WSAGetLastError() == WSA_IO_PENDING) {
					std::cout << "Background data receive\n";
					std::chrono::milliseconds timeout(1000); // 1 second timeout
					DWORD dwMilliseconds = timeout.count();
					int waitResult = WSAWaitForMultipleEvents(1, &evObj, TRUE, dwMilliseconds, FALSE);

					if (waitResult == WSAWAITTIMEOUT) {

						std::cout << "Receive operation timed out\n";
					}
					else {
						WSAGetOverlappedResult(acceptSocket, &overlapped, (LPDWORD)&recvBytes, FALSE, NULL);
						
					}
				}
				else {
					throw std::runtime_error("WSARecv() error");
				}
			}
			else
			{
				std::cout << "Received " << recvBytes << " bytes: " << buf << std::endl;

				memset(buf, 0, sizeof(buf));
				recvBytes = 0;
				//break; // 1번만 응답 대기

			}
		}
	}

	void startReceiveThread()
	{
		std::thread receiveThread(&ServerSock::receiveData, this);
		receiveThread.join();
		//receiveThead.detach();
	}
	~ServerSock()
	{
		WSACloseEvent(evObj);
		closesocket(serverSocket);
		closesocket(acceptSocket);
	}

public:
	SOCKET serverSocket, acceptSocket;
	SOCKADDR_IN listenAddr, acceptAddr;
	
	
	int acceptAddrSize;
	
	WSABUF dataBuf;
	WSAEVENT evObj;
	WSAOVERLAPPED overlapped;

	char buf[8192] = "";
	int recvBytes = 0, flags = 0;

};

int main()
{
	Winsock wsa;
	ServerSock serverSocket;

	serverSocket.startReceiveThread();

}
```

## 다음 글 예고

다음 글에서는 Client-Server 구조를 실습하기 위해 "기초적인 소켓 프로그래밍(1편: 기본 연결과 통신)"을 다룬다.  
비동기 소켓 설정(ioctlsocket, select 사용법)까지 함께 알아본다.

---
title: "[게임서버프로그래밍#5] 멀티스레드 Client-Server 구현 (feat: mutex, chrono)"
tags: [개발 서적 리뷰, 게임서버 프로그래머 책]
created: 2026-09-05
modified: 2026-09-05
---

# [게임서버프로그래밍#5] 멀티스레드 Client-Server 구현 (feat: mutex, chrono)

```text
                    Server Process
                +-----------------------+
Client A -----> | Thread A: recv/send   |
Client B -----> | Thread B: recv/send   |  --> 공유 자원 접근 시
Client C -----> | Thread C: recv/send   |      mutex.lock() / unlock()
                +-----------------------+
listen()/accept()가 새 연결마다 스레드를 하나씩 생성해
각 클라이언트를 독립적으로 담당하게 한다.
```


이 글에서는 서버가 여러 클라이언트의 요청을 동시에 처리하기 위해 멀티스레드를 사용하는 방법을 설명한다. 멀티스레드 환경에서 발생하는 자원 충돌 문제를 막기 위해 **mutex(뮤텍스)**를 사용하고,  
통신 타임아웃 처리를 위해 chrono를 적용하는 방법도 함께 다룬다.

* * *

## _멀티스레드가 필요한 이유_

*   하나의 서버 소켓이 다수 클라이언트와 통신할 때, **동시 접속 요청**을 처리하려면 스레드가 필요하다.
*   스레드를 사용하지 않으면 하나의 클라이언트 처리가 끝날 때까지 다른 클라이언트는 대기해야 한다.

* * *

## _Thread 기본 개념_

*   스레드는 하나의 프로세스 안에서 **독립적으로 실행되는 흐름**이다.
*   스레드들은 **Heap 영역, 전역 변수, 파일 핸들** 등을 공유한다.

**문제점:**

*   자원을 공유하기 때문에 **여러 스레드가 동시에 같은 데이터에 접근**하면 충돌(**race condition**)이 발생할 수 있다.

* * *

## _Mutex (뮤텍스)의 역할_

*   뮤텍스는 **서로 다른 스레드가 같은 자원에 동시에 접근하는 것을 막는다**.
*   하나의 스레드만 자원에 접근할 수 있도록 락(Lock)을 걸어주는 장치이다.

### 주의사항

*   너무 큰 범위를 잠그면 → **성능 저하** 발생
*   너무 작은 범위를 잠그면 → **관리 복잡성** 증가
*   필요한 최소 범위만 적절하게 락을 걸어야 한다.

* * *

## _chrono를 이용한 타임아웃 제어_

*   C++의 chrono 라이브러리는 **시간을 정밀하게 측정**하거나 **타임아웃을 설정**할 때 사용한다.
*   서버 통신에서 **수신 대기 시간**을 설정하거나, **연결 시도 제한 시간**을 관리할 때 유용하다.

* * *

## _Client-Server 멀티스레드 통신 흐름_

### 서버(Server)

1.  서버 소켓 생성 후 listen()으로 연결 요청 대기
2.  select()로 새로운 연결 요청 감지
3.  연결 요청이 오면 accept()하여 새로운 소켓 생성
4.  **새로운 스레드를 생성하여** 클라이언트 통신 담당
5.  스레드는 recv()/send()로 데이터 송수신
6.  통신이 끝나면 소켓 종료 및 스레드 종료

### 클라이언트(Client)

1.  서버에 connect()로 연결
2.  여러 클라이언트를 생성할 경우, 각 클라이언트를 스레드로 생성
3.  send()/recv()를 통해 통신
4.  통신 종료 시 소켓 닫기

* 서버

```cpp
while (true) {
    if (select()로 accept 대기) {
        SOCKET clientSock = accept(serverSock, ...);
        std::thread clientThread([clientSock]() {
            // 데이터 수신 및 송신 처리
            recv(clientSock, ...);
            send(clientSock, ...);
            closesocket(clientSock);
        }).detach(); // 스레드 분리
    }
}
```

* 클라이언트

```cpp
for (int i = 0; i < 5; ++i) {
    std::thread([i]() {
        SOCKET sock = socket(...);
        connect(sock, ...);
        send(sock, ...);
        recv(sock, ...);
        closesocket(sock);
    }).detach();
}
```

* * *

## 멀티스레드 주의사항 요약

  

| 문제 | 설명 |
| --- | --- |
| 데이터 충돌 | 여러 스레드가 동시에 같은 자원에 접근하면 충돌 발생 |
| Deadlock | 락 획득 순서가 꼬이면 서로 대기 상태에 빠질 수 있음 |
| 타임아웃 관리 | 연결 대기나 수신 대기 시 타임아웃을 설정해 서버 과부하 방지 |

**⇒ mutex, chrono를 적절히 사용하여 안정적인 멀티스레드 서버를 구현해야 한다.**

* * *

구현 (client - server)

##   
Client

```cpp
#include <winsock2.h>
#include <ws2tcpip.h>
#include <iostream>
#include <chrono>
#include <stdexcept>
#include <string>
#include <vector>
#include <thread>
#include <mutex>

#pragma comment(lib, "Ws2_32.lib")

class Winsock {
public:
	Winsock() {
		WSADATA wsaData;
		int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
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

class ClientSocket {
public:
	// 소켓 생성자
	ClientSocket(const std::string& host, const std::string& port)
	{
		addrinfo hints = {};
		hints.ai_family = AF_INET;
		hints.ai_socktype = SOCK_STREAM;
		hints.ai_protocol = IPPROTO_TCP;

		addrinfo* result = nullptr;
		int addrResult = getaddrinfo(host.c_str(), port.c_str(), &hints, &result);

		if (addrResult != 0)
		{
			throw std::runtime_error("getaddrinfo failed with errro: " + std::to_string(addrResult));
		}

		for (addrinfo* ptr = result; ptr != nullptr; ptr = ptr->ai_next)
		{
			sock = socket(ptr->ai_family, ptr->ai_socktype, ptr->ai_protocol);
			if (sock == INVALID_SOCKET)
			{
				continue;
			}

			u_long mode = 1;
			//ioctlsocket 함수 성공 -> 0 반환
			//NO_ERROR == 0
			if (ioctlsocket(sock, FIONBIO, &mode) != NO_ERROR)
			{
				closesocket(sock);
				sock = INVALID_SOCKET;
				continue;
			}
			if (connect(sock, ptr->ai_addr, (int)ptr->ai_addrlen) == SOCKET_ERROR)
			{
				int error = WSAGetLastError();
				if (error != WSAEWOULDBLOCK)
				{
					closesocket(sock);
					sock = INVALID_SOCKET;
					continue;
				}
			}
			else
			{
				break;
			}

			fd_set writeSet;
			FD_ZERO(&writeSet);
			FD_SET(sock, &writeSet);

			timeval timeout;
			timeout.tv_sec = 10;
			timeout.tv_usec = 0;

			int selectResult = select(0, nullptr, &writeSet, nullptr, &timeout);
			if (selectResult > 0 && FD_ISSET(sock, &writeSet))
			{
				int error;
				int len = sizeof(error);

				if (getsockopt(sock, SOL_SOCKET, SO_ERROR, (char*)&error, &len) == 0)
				{
					if (error == 0)
					{
						break;
					}
					else
					{
						closesocket(sock);
						sock = INVALID_SOCKET;
					}
				}
			}
			else if (selectResult == 0)
			{
				throw std::runtime_error("connect timeout");
			}
			else
			{
				throw std::runtime_error("select failed with error : " + std::to_string(WSAGetLastError()));
			}
		}

		freeaddrinfo(result);

		if (sock == INVALID_SOCKET)
		{
			throw std::runtime_error("Unable to connect to server!");
		}
	}

	~ClientSocket()
	{
		if (sock != INVALID_SOCKET)
		{
			closesocket(sock);
		}
	}

	void send(const std::string& message)
	{
		fd_set writeSet;
		FD_ZERO(&writeSet);
		FD_SET(sock, &writeSet);

		timeval timeout;
		timeout.tv_sec = 1;
		timeout.tv_usec = 0;

		int selectResult = select(0, nullptr, &writeSet, nullptr, &timeout);
		if (selectResult > 0 && FD_ISSET(sock, &writeSet))
		{

			int sendResult = ::send(sock, message.c_str(), (int)message.size(), 0);
			if (sendResult == SOCKET_ERROR)
			{
				throw std::runtime_error("send failed with error : " + std::to_string(WSAGetLastError()));
			}
		}
		else if (selectResult == 0)
		{
			throw std::runtime_error("send timeout");
		}
		else
		{
			throw std::runtime_error("select failed with error : " + std::to_string(WSAGetLastError()));
		}
	}

	std::string receive(size_t size)
	{
		fd_set readSet;
		FD_ZERO(&readSet);
		FD_SET(sock, &readSet);

		timeval timeout;
		timeout.tv_sec = 1;
		timeout.tv_usec = 0;

		int selectResult = select(0, &readSet, nullptr, nullptr, &timeout);
		if (selectResult > 0 && FD_ISSET(sock, &readSet))
		{
			std::string buffer(size, '\0');
			int recvResult = recv(sock, &buffer[0], (int)size, 0);
			if (recvResult > 0)
			{
				buffer.resize(recvResult);
				return buffer;
			}
			else if (recvResult == 0)
			{
				return {};
			}
			else
			{
				throw std::runtime_error("recv failed with error : " + std::to_string(WSAGetLastError()));
			}
		}
		else if (selectResult == 0)
		{
			return {};
		}
		else
		{
			throw std::runtime_error("select failed with error : " + std::to_string(WSAGetLastError()));
		}

	}
private:
	SOCKET sock = INVALID_SOCKET;
};

std::mutex outputMutex;

//쓰레드 사용 ( client 생성을 위한 thread )
void client_thread(int id)
{
	try 
	{
		ClientSocket socket("localhost", "27015");

		std::string message = "Hello from Client" + std::to_string(id);
		socket.send(message);
		
		std::string response = socket.receive(512);

		std::lock_guard<std::mutex> lock(outputMutex);
		std::cout << "Client " << id << " recieved : " << response << std::endl;
	}
	catch (const std::exception& e)
	{
		std::cerr << "Client " << id << " exception: " << e.what() << std::endl;
	}
}
int main()
{

	Winsock winsock;
	
    //여러개의 thread를 생성하기 위해 vector 사용
	std::vector<std::thread> threads;
	for (int i = 0; i < 5; ++i)
	{
    	//thread를 생성하고 vector에 추가
		threads.emplace_back(client_thread, i+1);
        //해당 Sleep부분은 서버의 timeout을 test하기 위해서 사용
		Sleep(4000);
	}

	for (auto& thread : threads)
	{
    	// thread 종료 대기
		thread.join();
	}

	return 0;
}
```

## SERVER 구현

```cpp
#include <iostream>
#include <winsock2.h>
#include <string>
#include <thread>
#include <mutex>
#include <chrono>

#pragma comment(lib, "Ws2_32.lib")

#define PORT 27015
#define BUFFER_SIZE 1024

std::string GetLastErrorAsString() {
    DWORD errorMessageID = ::WSAGetLastError();
    if (errorMessageID == 0) {
        return std::string();
    }

    LPSTR messageBuffer = nullptr;
    size_t size = FormatMessageA(
        FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
        NULL, errorMessageID, MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&messageBuffer, 0, NULL
    );

    std::string message(messageBuffer, size);

    LocalFree(messageBuffer);

    return message;
}

class Winsock
{
public:
    Winsock()
    {
        WSADATA wsaData;
        int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
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

class ServerSocket
{
public:
    ServerSocket()
    {
        serverSocket = socket(AF_INET, SOCK_STREAM, 0);
        if (serverSocket == INVALID_SOCKET)
        {
            WSACleanup();
            throw std::runtime_error("Socket creation failed : " + GetLastErrorAsString());
        }

        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(PORT);

        if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR)
        {
            closesocket(serverSocket);
            throw std::runtime_error("Socket bind failed : " + GetLastErrorAsString());
        }

        if (listen(serverSocket, 100) == SOCKET_ERROR)
        {
            closesocket(serverSocket);
            throw std::runtime_error("Socket listen failed : " + GetLastErrorAsString());
        }

        u_long mode = 1;
        if (ioctlsocket(serverSocket, FIONBIO, &mode) != NO_ERROR)
        {
            closesocket(serverSocket);
            throw std::runtime_error("ioctlsocket failed : " + GetLastErrorAsString());
        }

        std::cout << "Waiting for connection..." << std::endl;

    }

    void accept_connection()
    {
    	// server client 연결 요청 대기 타임아웃 시간 10초 설정
        auto time = std::chrono::steady_clock::now();
        auto timeout_duration = std::chrono::seconds(10); // 10초 타임아웃

        while (true)
        {
            fd_set readSet;
            FD_ZERO(&readSet);
            FD_SET(serverSocket, &readSet);

            timeval timeout;
            timeout.tv_sec = 1;
            timeout.tv_usec = 0;

            int selectResult = select(0, &readSet, nullptr, nullptr, &timeout);
            if (selectResult > 0 && FD_ISSET(serverSocket, &readSet))
            {
                SOCKET acceptSocket = accept(serverSocket, nullptr, nullptr);
                if (acceptSocket == INVALID_SOCKET)
                {

                    int error = WSAGetLastError();
                    if (error != WSAEWOULDBLOCK)
                    {
                        throw std::runtime_error("Socket accept failed : " + GetLastErrorAsString());
                    }
                    continue;

                }
                else
                {
                	//연결 요청이 있을경우, 타임 아웃 시간을 해당 시간부터 계산하기 위해 설정
                    time = std::chrono::steady_clock::now();

                    u_long mode = 1;
                    if (ioctlsocket(acceptSocket, FIONBIO, &mode) != NO_ERROR)
                    {
                        std::cerr << " ioctlsocket for acceptSocket failed : " + GetLastErrorAsString() << std::endl;
                        closesocket(acceptSocket);
                        continue;
                    }
                    //.detach 함수를 이용해 백그라운드에서 thread 실행
                    // handle_client 부분을 수행 후에 자동 종료되지만 그 전에 main 함수가 끝나지 않도록 주의
                    // 회피 방법 : thread 대기 종료  ( main이 먼저 종료될 경우 좀비프로세스가 될 수 있음 )
                    std::thread(&ServerSocket::handle_client, this, acceptSocket).detach();
                }
            }
            else if (selectResult == 0)
            {
            	//타임아웃 종료 매커니즘
                auto current_time = std::chrono::steady_clock::now();
                if (current_time - time >= timeout_duration)
                {
                    std::cout << "No connection attempts within timeout period. Exiting accept loop." << std::endl;
                    break;
                }
                continue;
            }
            else
            {
                throw std::runtime_error("select failed with error : " + std::to_string(WSAGetLastError()));
            }
            
        }
    }

    void handle_client(SOCKET acceptSocket)
    {
        const char* message = "Hello from server";
        char buffer[BUFFER_SIZE] = { 0, };

        while (true)
        {
            fd_set readSet;
            FD_ZERO(&readSet);
            FD_SET(acceptSocket, &readSet);

            timeval timeout;
            timeout.tv_sec = 10;
            timeout.tv_usec = 0;
            int selectResult = select(0, &readSet, nullptr, nullptr, &timeout);
            
            if (selectResult > 0 && FD_ISSET(acceptSocket, &readSet))
            {
                int recvResult = recv(acceptSocket, buffer, BUFFER_SIZE, 0);
                if (recvResult > 0)
                {
                	// recv 및 send 부분을 mutex로 통제하여 순서가 섞이게 출력되지 않도록 설정
                    std::lock_guard<std::mutex> lock(outputMutex);
                    std::cout << "Message from client : " << buffer << std::endl;
                    send(acceptSocket, message, strlen(message), 0);
                    std::cout << "(server-> client) send message" << std::endl;
                }
                else if (recvResult == 0)
                {
                    std::lock_guard<std::mutex> lock(outputMutex);
                    std::cout << "Connection closed" << std::endl;
                    closesocket(acceptSocket);
                    break;
                }
                else
                {
                    std::cerr << "recv failed with error : " << GetLastErrorAsString() << std::endl;
                    closesocket(acceptSocket);
                    break;
                }
            }
            else if (selectResult == 0)
            {
                throw std::runtime_error("recv timeout");
                closesocket(acceptSocket);
                break;
            }
            else
            {
                throw std::runtime_error("select failed with error : " + GetLastErrorAsString());
                closesocket(acceptSocket);
                break;
            }
        }

    }
    ~ServerSocket()
    {
        if (serverSocket != INVALID_SOCKET)
        {
            closesocket(serverSocket);
            serverSocket = INVALID_SOCKET;
        }

    }

private:
    SOCKET serverSocket = INVALID_SOCKET;
    struct sockaddr_in serverAddr;
    static std::mutex outputMutex;

};
//전역으로 mutex 설정
std::mutex ServerSocket::outputMutex;

int main()
{
    try
    {

        Winsock winsock;
        ServerSocket serverSocket;

        serverSocket.accept_connection();
    }
    catch (const std::exception& e)
    {
        std::cerr << "Exception : " << e.what() << std::endl;
    }
    return 0;
}
```

> 원문: https://gradualprecision.tistory.com/15

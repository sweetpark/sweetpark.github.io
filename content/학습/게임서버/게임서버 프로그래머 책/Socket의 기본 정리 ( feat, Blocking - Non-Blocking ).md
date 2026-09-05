---
title: Socket의 기본 정리 ( feat, Blocking / Non-Blocking )
tags: [개발 서적 리뷰, 게임서버 프로그래머 책]
created: 2026-09-05
modified: 2026-09-05
---

# Socket의 기본 정리 ( feat, Blocking / Non-Blocking )

##  소켓

*   소켓의 경우 파일 핸들작업과 유사
    *   파일 핸들 : 파일의 읽고/쓰기를 조작하기 위한 컨트롤
    *   소켓 핸들  : 네트워크 연결을 조작하기 위한 컨트롤
*   소켓의 경우 비동기 처리가 주로 사용됨
    *   비동기처리의 필요성
        *   동기처리일경우, 해당 소켓의 통신과정 동안 사용자 입장에서는 Main 함수가 정지되어있음 (다른 일을 처리하지 못해 멈춰있는것처럼 보임)
    *   비동기 방식
        *   논블로킹 소켓
        *   Overlapped I/O
        *   epoll (linux)
        *   I/O Completion Port (IOCP / Window)

## Blocking 통신 구조

*   클라이언트

```cpp
sock_handle = socket(TCP)
sock_handle.bind(any_port)
sock_handle.connect(server_ip:port)
sock_handle.send()
sock_handle.close()
```

1.  socket(TCP) : 소켓 핸들 생성
2.  bind : 클라이언트 포트 지정
3.  connect : 서버 ip:port로 통신 연결
4.  send : data 송신
5.  close : 소켓 닫기

*   send() 시 일어나는 상황  
    *   송신 버퍼: Queue 구조로서 send를 할 시점에 버퍼에 쌓이고 send함수는 바로 return 된다
        *   단, 송신버퍼가 꽉찰 경우 Blocking이 일어난다  
*   서버

```cpp
sock_handle = socket(TCP)
sock_handle.bind(5959)
sock_handle.listen()
new_sock_handle = sock_handle.accept()
new_sock_handle.recv()
new_sock_handle.close()
```

1.  socket(TCP) : 소켓 핸들 생성
2.  bind : 서버 포트 지정
3.  listen : 클라이언트 연결 받는 용도
4.  accept : 클라이언트의 연결을 받을 때까지 Blocking, 받은 후에 새로운 socket 핸들 생성
5.  recv : 수신 버퍼에서 값을 가져옴 (소켓 닫힐때까지 계속 Blocking )
6.  close : 소켓 닫기

*   recv()시 일어나는 상황
    *   수신 버퍼 : 송신버퍼와 동일한 Queue 형태
        *   단, 송신버퍼와 마찬가지로 꽉차면 Blocking이 일어남

TCP와 UDP의 차이  
  
- TCP는 버퍼가 꽉차면 일시적으로 대기함  
- UDP는 버퍼가 꽉차면 버림 ( 송신 또한 꽉차더라도 계속해서 송신함 )

## Non - Blocking 통신 구조

*   non-Blocking의 경우 소켓을 받는 부분(Blocking)이 일어나는 지점을 while roop를 돌려야한다
*   select 혹은 poll 사용  ( 가능한 I/O가 있을경우 event 혹은 Timeout 설정 )
*   Error : "Would Block" 값이 return 값으로 많이 나옴
    *   WouldBlock 이란?
        *   Blocking 가능한 상황이었다의 return 값

*   클라이언트

```cpp
sock_handle = socket(TCP)
sock_handle.bind(any_port)
1. (setNonblocking(sock_handle))
sock_handle.connect(server_ip:port)
2. (setNonblocking(sock_handle))
sock_handle.send()
sock_handle.close()
```

*   1번 상황의 경우 connect() 가 would Block이라는 값을 내보내기에 아직 connect 가 일어나지 않은 상황이라고 볼 수 있다.
    *   해결책)
        *   connect를 될때까지 시도한다
            *   문제점 :운영체제마다 return값이 다른 문제가 존재 ( 불확실한 방법 )
        *   0바이트를 송신해본다
            *   0바이트를 송신했을 때, 오류값을 돌려받으면 아직 연결받지 못한 상태 / 정상적이면 연결된 상태
*   2번 상황의 경우 지속적 send(), 이럴경우 CPU 사용량이 높아진다 (비동기로 계속해서 처리되기 때문)
    *   클라이언트의 경우 크게 critical 하지 않다
    *   서버의 경우는 CPU사용량이 높으면 원활한 통신을 하지 못할 가능성이 있으므로 제어가 필요 ( select , poll 등...)
*   고려해야할점
    *   UDP의 경우 송신버퍼는 남아있는데 ,보내는 형태가 메시지라서 크기가 부합하지 않을 수 있다 ( select는 I/O가 남아있다고 하는데, 보내질 못하는 상황... ) 해당 처리 로직이 필요해보임

*   서버

```cpp
sock_handle = socket(TCP)
sock_handle.bind(5959)

sock_handle.setNonBlockint(true)

sock_handle.listen()

(select(sock_handle, 100ms))
// sock_handle 값의 이벤트가 발생하면 accept 진행

new_sock_handle = sock_handle.accept()
new_sock_handle.recv()
new_sock_handle.close()
```

*   accept()가 동기적으로 처리가 되었으므로, 이 부분이 Non-Blocking이 되면 이에 대한 처리를 해줘야함 ( wouldBlock 값이 return 되는 경우 )
    *   select를 사용해서 listen 값에 이벤트가 발생했는지 확인
    *   서버의 경우 CPU 효율도 생각해야함 

Non-Blocking 자세한 사항은 다음 장으로...

> 원문: https://gradualprecision.tistory.com/9

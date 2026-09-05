---
title: "인터넷 통신과정 ( + IP, TCP/UDP, PORT, DNS )"
tags: [JAVA 기반 웹개발, HTTP]
created: 2026-09-05
modified: 2026-09-05
---

# 인터넷 통신과정 ( + IP, TCP/UDP, PORT, DNS )

## 네트워크 과정

![](https://blog.kakaocdn.net/dna/7Sn2J/btsJcUWCIxY/AAAAAAAAAAAAAAAAAAAAAH7dNQNmvx3BCrsLOoDZphi8ZEaSOyt5P2I8OdIarhSP/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=KouAfUQJYbZGb1j5JWb8ImYqEo4%3D)

*   컴퓨터 A와 B는 네트워크라는 공간을 통해 서로의 데이터를 주고 받게 된다.
*   컴퓨터는 많이 보급되어 있기에 누구가 누군것인지를 특정할 필요가 있다

## 네트워크에서 구분하는 방법

![](https://blog.kakaocdn.net/dna/4dzgl/btsJc4EXzPP/AAAAAAAAAAAAAAAAAAAAAII3ibHfWCrC2moYIzs66BvcutvgCzfLv6hY3gS4jXuU/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=A9GfktlHUaAGpd%2FRJZr%2B9iW9yv8%3D)

*   해당 컴퓨터는 IP라는 네트워크 주소를 가지고 있게 된다.
*   해당 주소를 통해 서로에게 올바르게 원하는 데이터를 주고받게 된다.

## IP 란?

*   원하는 주소로 데이터를 보내기 위한 네트워크의 절차 중 한 부분
*   데이터를 가장 안쪽에 두고, 포장지를 씌우는 것처럼 "헤더"라는 이름으로 아래 그림이 붙어지게 된다  
    *   중요한 부분!
        *   Source Address
        *   Destination Address
*   데이터와 함께 아래 "헤더"가 같이 보내지게 되고, 받는 쪽에서 이 부분을 보고 자기 것인지 확인 후 데이터를 얻게 된다.

![](https://blog.kakaocdn.net/dna/dyHe6P/btsJcNDyT4r/AAAAAAAAAAAAAAAAAAAAAEqZPIZ8KSIaucNSx9Ge-LOgNygiqyBeyefB8IH141za/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=%2BDJnNo%2FJ31OL5KGYTj0NEUU1hUA%3D)

IP 헤더 정보

## TCP 의 탄생

*   TCP (Transmission Control Protocol)로서 "전송 제어 프로토콜"이다.
*   IP로만 해서 전송하면 되지, 왜 TCP가 나왔을까?  
    *   IP의 한계
        *   상대방이 받을 수 있는 상태인지,아닌지를 확인하지 않고 보냄 ( 비신뢰성 )
        *   네트워크를 거치면서 가다가 유실되더라도 알지를 못함
*   전송을 제어할 무언가가 필요하다 -> TCP
    *   중요한 부분!
        *   Port 정보
        *   이미 IP 헤더로서 상대방 컴퓨터의 정보는 어느정도 알았기에, 세부 주소를 알기 위해서 port 사용
            *   ex) IP 정보 : 아파트 / PORT 정보 : 호수

![](https://blog.kakaocdn.net/dna/obpzG/btsJcMScCAo/AAAAAAAAAAAAAAAAAAAAAGANgEFLgAlHW3uDzI7SgmG8noOc3193A13KN6t8KgA0/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=82Zhlk93oaxN%2F%2BiHUcm2QGDYwFI%3D)

TCP 헤더

*   TCP의 특징
    *   3-way-handshake 라는 연결을 통해 상대방이 데이터를 받을 수 있는 상태인지 check를 한다.
    *   상대방이 맞고, 연결 가능하다면 연결을 통해 상대방과 데이터를 오고가게 된다.
        *   이러한 부분을 "연결 지향적"이라고 한다.
    *   IP의 한계에서 드러났던 문제들을 제어함으로써 원활한 통신이 가능하게 한다.
*   3-way-handshake
    *   클라이언트와 서버는 각각 컴퓨터A, 컴퓨터B로 놓아도 무방하다
    *   컴퓨터A가 연결 요청을 하면, B가 허락을 하고 , A가 허락한 것을 알았다를 보내고 연결시작 과정을 마무리한다
    *   총 3번 왔다갔다 한다해서 "3-way-handshake"이다.

![](https://blog.kakaocdn.net/dna/dDJ4sy/btsJdqVdIz2/AAAAAAAAAAAAAAAAAAAAANP8awo3DEl6-Um_2ONp2LilTyVg9XIlCgeWZGoJowI9/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=dI6Ls468h%2B0RtXx8o72MIrt2VP4%3D)

3-Way-Handshake

## UDP

*   TCP와 같은 층에 존재하지만, 쓰임새는 확연히 다르다.
*   빠른 전송을 위해 연결 지향적이지 않은 채로 데이터를 보내게된다 ( IP만을 이용한 전송과 유사 )
*   신뢰성은 없어도 빠른 데이터 제공을 위해 사용할 때가 있다.

![](https://blog.kakaocdn.net/dna/ba6hnM/btsJc2tKCCw/AAAAAAAAAAAAAAAAAAAAAOuWXYsR6D9UemxuoeYHplx0SbsD9kO5WEQXv3B0FY94/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=MsYUjGOzUR3goS3GLwcqsCq26vs%3D)

UDP 헤더

## PORT

*   PORT는 전송제어 프로토콜에서 사용하는 중요한 부분이다.
*   컴퓨터가 받아드릴 수 있는 통로가 65535개가 존재하고, 해당 통로를 Port라고 일컫는다.
*   통로를 통해서, 게임도하면서 채팅도하고 웹서핑도 즐길 수 있는 것이다.

*   Port 정보
    *   Well-Known 포트 ( 잘 알려진 포트 )
        *   0~1023번 까지는 예약된 포트
            *   DHCP (출발 : 67, 도착 : 68)
            *   DNS (53)
            *   SSH (22)
            *   Telnet (23)
            *   HTTP (80)
            *   HTTPS (443)
        *   1024~65535 까지는 포트를 따로 지정해서 사용해도 괜찮다

## DNS

*   원래 모든 웹페이지든 컴퓨터로의 접속이든지 간에 IP + PORT 조합으로 연결을 해야한다.
*   그래서 검색을 할 때도, 문자가 아닌 상대방의 IP를 직접 검색해서 가야한다.
*   -> 이러한 불편함에 DNS가 나오게 됨

*   DNS
    *   직접 IP를 검색하지 않더라도, domain 명을 통해서 쉽게 검색 가능
    *   ex) www.naver.com

![](https://blog.kakaocdn.net/dna/bjJC1D/btsJdeALiHD/AAAAAAAAAAAAAAAAAAAAAMSKdFXLLyx31-v4g-XwLw-KsanVukeJUv8ZJL_JyYik/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=DZ3cdflOK9ahEPRfutUj%2FeFgH%2BE%3D)

nslookup 명령어 사용 결과

> 원문: https://gradualprecision.tistory.com/62

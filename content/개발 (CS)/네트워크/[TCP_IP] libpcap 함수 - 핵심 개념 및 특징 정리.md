---
title: "libpcap 함수"
tags: [학습, 개발-CS, 네트워크, libpcap, C]
modified: 2026-09-05
---

# libpcap 함수

> [!NOTE]
> libpcap 라이브러리의 주요 함수(pcap_is_swapped, pcap_lookupnet, pcap_lookupdev, pcap_datalink, pcap_open_live/offline, pcap_next, pcap_loop)와 TCP/IP/이더넷 헤더 구조체 레퍼런스.

## ⚙️ 구현

참고: [libpcap을 이용한 프로그래밍](https://www.joinc.co.kr/w/Site/Network_Programing/AdvancedComm/pcap_intro)

### 사용하는 저장 파일과 byte order 값이 같은지 확인
- `int pcap_is_swapped(pcap_t *p)` — 0: 같음, 1: 다름
- 예)
    ```c
    pcap_t *pcap_handle;
    pcap_handle = pcap_open_offline(argv[1], errbuf);
    if (pcap_is_swapped(pcap_handle) == 0) // 같음
    ```

### 디바이스 & 네트워크 정보 관련 (pcap_lookupnet)
- `int pcap_lookupnet(char *device, bpf_u_int32 *netp, bpf_u_int32 *maskp, char *errbuf);`
- `netp`: 네트워크 정보
- `maskp`: mask 정보 기록
- `device`: `pcap_lookupdev`를 통해 얻어온 정보

### 네트워크 이름 정보 (pcap_lookupdev)
- `pcap_open_live()`와 `pcap_lookupnet()`에서 사용하기 위한 네트워크 디바이스에 대한 포인터 제공
- 예) `eth0`, `eth33`

### link layer 타입 정보 (pcap_datalink)
- `int pcap_datalink(pcap_t *p)`
- `DLT_EN10MB`과 같은 정보 출력

### net address 및 mask address 출력 (xxx.xxx.xxx.xxx 형태)
```c
bpf_u_int32 netp;
bpf_u_int32 maskp;
char *net;
char *mask;

ret = pcap_lookupnet(dev, &netp, &maskp, errbuf);
addr.s_addr = netp;
net = inet_ntoa(addr);
addr.s_addr = maskp;
mask = inet_ntoa(addr);
```
→ 넷주소, mask주소 확인 가능

### 네트워크 이름 확인 (eth0, eth33 등)
```c
dev = pcap_lookupdev(errbuf);
printf("DEV : %s", dev);
```

### pcap 캡처 시작 함수 (pcap_t *pcap_open_live)
- `pcap_t *pcap_open_live(char *device, int snaplen, int promisc, int to_ms, char *ebuf)`
- `device`: 네트워크 정보에 대한 패킷 분석 → any, NULL로 지정할 경우 모든 네트워크 패킷 캡처
- `snaplen`: 패킷의 최대 크기(byte)
- `promisc`: "1"로 지정할 경우 → 로컬 네트워크 모든 패킷 캡처, "0"으로 지정할 경우 → 자기에게만 향하는 패킷 캡처(주로 사용)
- `to_ms`: 읽기 시간 초과 지정(time_out)
- `ebuf`: 에러 발생 시 에러 발생 내용 기록 (pcap_open_live 실패 시 기록)

### pcap 파일 캡처 시작 함수 (pcap_t *pcap_open_offline)
- `pcap_t *pcap_open_offline(char *fname, char *ebuf)`
- `fname`: 패킷 파일명

### Header 구조체

**TCP 헤더**
```c
struct tcphdr
{
    u_int16_t th_sport;     /* source port */
    u_int16_t th_dport;     /* destination port */
    tcp_seq   th_seq;       /* sequence number */
    tcp_seq   th_ack;       /* acknowledgement number */

#if __BYTE_ORDER == __LITTLE_ENDIAN
    u_int8_t th_x2:4;       /* (unused) */
    u_int8_t th_off:4;      /* data offset */
#endif
#if __BYTE_ORDER == __BIG_ENDIAN
    u_int8_t th_off:4;      /* data offset */
    u_int8_t th_x2:4;       /* (unused) */
#endif
    u_int8_t th_flags;
#define TH_FIN  0x01
#define TH_SYN  0x02
#define TH_RST  0x04
#define TH_PUSH 0x08
#define TH_ACK  0x10
#define TH_URG  0x20
    u_int16_t th_win;       /* window */
    u_int16_t th_sum;       /* checksum */
    u_int16_t th_urp;       /* urgent pointer */
};
```

**IP 헤더**
```c
struct ip
{
#if __BYTE_ORDER == __LITTLE_ENDIAN
    unsigned int ip_hl:4;       /* header length */
    unsigned int ip_v:4;        /* version */
#endif
#if __BYTE_ORDER == __BIG_ENDIAN
    unsigned int ip_v:4;        /* version */
    unsigned int ip_hl:4;       /* header length */
#endif
    u_int8_t ip_tos;                /* type of service */
    u_short  ip_len;                /* total length */
    u_short  ip_id;                 /* identification */
    u_short  ip_off;                /* fragment offset field */
#define IP_RF 0x8000                /* reserved fragment flag */
#define IP_DF 0x4000                /* dont fragment flag */
#define IP_MF 0x2000                /* more fragments flag */
#define IP_OFFMASK 0x1fff           /* mask for fragmenting bits */
    u_int8_t ip_ttl;                /* time to live */
    u_int8_t ip_p;                  /* protocol */
    u_short  ip_sum;                /* checksum */
    struct in_addr ip_src, ip_dst;  /* source and dest address */
};
```

**이더넷 헤더**
```c
struct ethhdr
{
    unsigned char  h_dest[ETH_ALEN];    /* destination eth addr */
    unsigned char  h_source[ETH_ALEN];  /* source ether addr    */
    unsigned short h_proto;             /* packet type ID field, 상위 패킷 프로토콜 정보 */
};
```

- ip, tcp 헤더파일 → `/usr/include/netinet`
- 이더넷 헤더파일 → `/usr/include/linux/if_ether.h`

### 패킷에 대한 포인터 리턴 (u_char *pcap_next)
- 패킷을 읽음으로써 패킷의 정보 얻어옴
- 실제로 이 함수를 이용해서 캡처와 관련된 모든 일 가능
- pcap 라이브러리에서 꼭 필요한 함수
- `u_char *pcap_next(pcap_t *p, struct pcap_pkthdr *h)`

### 패킷 캡처 (pcap_loop)
- `int pcap_loop(pcap_t *p, int cnt, pcap_handler callback, u_char *user)`
- `p`: 패킷 device 이름
- `cnt`: 패킷 캡처를 몇 번에 걸쳐서 할 것인지 (0일 경우: 계속 패킷을 받아들임)
- `callback`: 일반적으로 패킷 필터링과 관련된 함수 실행 (패킷이 들어왔을 때 실행하는 함수 포인터)
- 유사 함수: `int pcap_dispatch(pcap_t *p, int cnt, pcap_handler callback, u_char *user)`

## 📎 기타
> [!IMPORTANT]
> 확인 필요: "알아봐야 할 것" — `pcap_t *pcap_handle`, `addr.s_addr`가 무엇인지, `ntoa`, `pcap_pkthdr` (원문의 학습 TODO 목록, 미완료 상태로 보존).

## 관련 문서

- [(프로젝트) 패킷 캡처와 분석 - libpcap C 구현과 tshark 활용](../../프로젝트/보안/[프로젝트]%20패킷%20캡처와%20분석%20-%20libpcap%20C%20구현과%20tshark%20활용.md) — 이 함수 레퍼런스를 실제로 사용해 패킷 캡처 프로그램을 구현한 프로젝트 노트

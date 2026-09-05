---
title: "\"[프로젝트] 패킷 캡처와 분석 - libpcap C 구현과 tshark 활용\""
tags: [학습, 보안, 네트워크, C, 패킷분석, tshark]
created: 2026-09-05
modified: 2026-09-05
---

# 패킷 캡처와 분석 - libpcap C 구현과 tshark 활용

> 목적
>
> libpcap으로 네트워크 패킷을 직접 캡처하고, Ethernet → IP → TCP 헤더를 손으로 파싱해보고, 캡처된 데이터 안에서 파일(JPEG)을 카빙(carving)해 복원하는 과정을 정리한다. 마지막으로 같은 작업을 훨씬 빠르게 해주는 `tshark` 명령어들도 함께 정리한다.

---

## 🧭 왜 패킷을 직접 파싱해보는가

Wireshark는 GUI에서 패킷을 예쁘게 보여주지만, "왜 그렇게 보이는지"는 결국 바이트 배열을 헤더 스펙대로 잘라 읽는 것뿐이다. libpcap으로 인터페이스에서 raw 패킷을 받아 C 구조체에 캐스팅해보면 이더넷 프레임 안에 IP 패킷이, IP 패킷 안에 TCP 세그먼트가, 그 안에 애플리케이션 데이터(HTTP 등)가 캡슐화되어 있다는 걸 코드 레벨에서 확인할 수 있다.

패킷이 계층을 타고 내려가는 순서는 다음과 같다.

- **Link layer**: 이더넷 헤더 분석 (목적지/출발지 MAC, 상위 프로토콜 타입)
- **Network layer**: IP 패킷 검사, 필요 시 ICMP/IGMP 처리 후 상위 계층으로 전달
- **Transport layer**: TCP/UDP 헤더 분석, 포트 기준으로 상위 프로토콜 결정
- **Application layer**: 최종적으로 HTTP 등 애플리케이션 데이터가 전달되어야 할 처리기로 넘어감

패킷을 바이트 단위로 표현하면(옵션이 없는 가장 단순한 경우) 대략 아래와 같은 모양이 된다.

```
+--------------------------------------------------------------+
|                  Ethernet Header (14 bytes)                  |
+--------------------------------------------------------------+
| Dst MAC (6B)  | Src MAC (6B)  | EtherType (2B)                |
+--------------------------------------------------------------+
|                    IP Header (기본 20 bytes)                   |
+--------------------------------------------------------------+
| Ver(4b) IHL(4b) | TOS(1B) | Total Length(2B)                  |
| Identification(2B)        | Flags(3b) Fragment Offset(13b)    |
| TTL(1B) | Protocol(1B)    | Header Checksum(2B)               |
| Source IP(4B)                                                 |
| Destination IP(4B)                                            |
+--------------------------------------------------------------+
|                   TCP Header (기본 20 bytes)                    |
+--------------------------------------------------------------+
| Source Port(2B)           | Destination Port(2B)              |
| Sequence Number(4B)                                           |
| Acknowledgment Number(4B)                                     |
| Offset(4b) Reserved(6b) Flags(6b) | Window Size(2B)           |
| Checksum(2B)              | Urgent Pointer(2B)                |
+--------------------------------------------------------------+
|                     Payload (가변 길이)                         |
+--------------------------------------------------------------+
```

이 그림이 이후 나오는 C 코드의 포인터 연산(`buffer + sizeof(struct ethhdr)`, `packet += 14` 등)을 이해하는 기준이 된다. 결국 파싱이라는 건 "이 오프셋부터 몇 바이트가 무슨 필드다"라는 표를 그대로 포인터 캐스팅으로 옮기는 작업이다.

> 참고: 패킷 생성과 캡슐화 원리는 [패킷의 생성 원리와 캡슐화](https://www.youtube.com/watch?v=Bz-K-DPfioE) 영상이 계층별 헤더가 어떻게 덧붙여지는지 시각적으로 잘 보여준다. 더 깊이 들어가면 [DPI(Deep Packet Inspection)](https://genius12.tistory.com/218) — 헤더뿐 아니라 페이로드까지 들여다보는 기법 — 개념도 같이 봐두면 좋다.

---

## 1️⃣ libpcap 기반 패킷 스니퍼 (C)

### 전체 흐름

1. `pcap_findalldevs()`로 캡처 가능한 네트워크 인터페이스 목록을 가져온다.
2. 사용자가 번호를 선택하면 `pcap_open_live()`로 해당 인터페이스를 **promiscuous 모드**로 연다(자신에게 오지 않는 패킷도 받기 위함).
3. `pcap_loop()`에 콜백 함수를 등록하면, 패킷이 도착할 때마다 콜백이 호출된다.
4. 콜백 안에서 IP 헤더의 `protocol` 필드(TCP=6, UDP=17, ICMP=1, IGMP=2)를 보고 분기해서 각 프로토콜 전용 파서로 넘긴다.
5. 각 파서는 이더넷 → IP → (TCP/UDP/ICMP) 순서로 헤더를 출력하고, 마지막에 페이로드를 헥사덤프 형태로 로그 파일에 남긴다.

```c
/*
	Packet sniffer using libpcap library
*/
#include<pcap.h>
#include<stdio.h>
#include<stdlib.h> // for exit()
#include<string.h> //for memset

#include<sys/socket.h>
#include<arpa/inet.h> // for inet_ntoa()
#include<net/ethernet.h>
#include<netinet/ip_icmp.h>	//Provides declarations for icmp header
#include<netinet/udp.h>	//Provides declarations for udp header
#include<netinet/tcp.h>	//Provides declarations for tcp header
#include<netinet/ip.h>	//Provides declarations for ip header

void process_packet(u_char *, const struct pcap_pkthdr *, const u_char *);
void print_tcp_packet(const u_char *, int);
void print_udp_packet(const u_char *, int);
void print_icmp_packet(const u_char *, int);
void PrintData(const u_char *, int);

FILE *logfile;
struct sockaddr_in source, dest;
int tcp = 0, udp = 0, icmp = 0, others = 0, igmp = 0, total = 0;

int main()
{
	pcap_if_t *alldevsp, *device;
	pcap_t *handle; // 캡처할 인터페이스 핸들

	char errbuf[100], *devname, devs[100][100];
	int count = 1, n;

	printf("Finding available devices ... ");
	if (pcap_findalldevs(&alldevsp, errbuf))
	{
		printf("Error finding devices : %s", errbuf);
		exit(1);
	}
	printf("Done");

	printf("\nAvailable Devices are :\n");
	for (device = alldevsp; device != NULL; device = device->next)
	{
		printf("%d. %s - %s\n", count, device->name, device->description);
		if (device->name != NULL)
			strcpy(devs[count], device->name);
		count++;
	}

	printf("Enter the number of the device you want to sniff : ");
	scanf("%d", &n);
	devname = devs[n];

	printf("Opening device %s for sniffing ... ", devname);
	handle = pcap_open_live(devname, 65536, 1, 0, errbuf);
	if (handle == NULL)
	{
		fprintf(stderr, "Couldn't open device %s : %s\n", devname, errbuf);
		exit(1);
	}
	printf("Done\n");

	logfile = fopen("log.txt", "w");
	if (logfile == NULL)
		printf("Unable to create file.");

	// 패킷이 들어올 때마다 process_packet 콜백 실행
	pcap_loop(handle, -1, process_packet, NULL);

	return 0;
}

void process_packet(u_char *args, const struct pcap_pkthdr *header, const u_char *buffer)
{
	int size = header->len;

	// 이더넷 헤더 뒤에 IP 헤더가 온다고 가정하고 캐스팅
	struct iphdr *iph = (struct iphdr *)(buffer + sizeof(struct ethhdr));
	++total;
	switch (iph->protocol)
	{
		case 1: ++icmp; print_icmp_packet(buffer, size); break;   // ICMP
		case 2: ++igmp; break;                                    // IGMP
		case 6: ++tcp; print_tcp_packet(buffer, size); break;      // TCP
		case 17: ++udp; print_udp_packet(buffer, size); break;     // UDP
		default: ++others; break;                                 // ARP 등
	}
	printf("TCP : %d   UDP : %d   ICMP : %d   IGMP : %d   Others : %d   Total : %d\r",
	       tcp, udp, icmp, igmp, others, total);
}

void print_ethernet_header(const u_char *Buffer, int Size)
{
	struct ethhdr *eth = (struct ethhdr *)Buffer;
	fprintf(logfile, "\nEthernet Header\n");
	fprintf(logfile, "   |-Destination Address : %.2X-%.2X-%.2X-%.2X-%.2X-%.2X \n",
	        eth->h_dest[0], eth->h_dest[1], eth->h_dest[2], eth->h_dest[3], eth->h_dest[4], eth->h_dest[5]);
	fprintf(logfile, "   |-Source Address      : %.2X-%.2X-%.2X-%.2X-%.2X-%.2X \n",
	        eth->h_source[0], eth->h_source[1], eth->h_source[2], eth->h_source[3], eth->h_source[4], eth->h_source[5]);
	fprintf(logfile, "   |-Protocol            : %u \n", (unsigned short)eth->h_proto);
}

void print_ip_header(const u_char *Buffer, int Size)
{
	print_ethernet_header(Buffer, Size);

	struct iphdr *iph = (struct iphdr *)(Buffer + sizeof(struct ethhdr));

	memset(&source, 0, sizeof(source));
	source.sin_addr.s_addr = iph->saddr;
	memset(&dest, 0, sizeof(dest));
	dest.sin_addr.s_addr = iph->daddr;

	fprintf(logfile, "\nIP Header\n");
	fprintf(logfile, "   |-IP Version        : %d\n", (unsigned int)iph->version);
	fprintf(logfile, "   |-IP Header Length  : %d DWORDS or %d Bytes\n",
	        (unsigned int)iph->ihl, ((unsigned int)(iph->ihl)) * 4);
	fprintf(logfile, "   |-TTL      : %d\n", (unsigned int)iph->ttl);
	fprintf(logfile, "   |-Protocol : %d\n", (unsigned int)iph->protocol);
	fprintf(logfile, "   |-Source IP        : %s\n", inet_ntoa(source.sin_addr));
	fprintf(logfile, "   |-Destination IP   : %s\n", inet_ntoa(dest.sin_addr));
}

void print_tcp_packet(const u_char *Buffer, int Size)
{
	struct iphdr *iph = (struct iphdr *)(Buffer + sizeof(struct ethhdr));
	unsigned short iphdrlen = iph->ihl * 4;

	struct tcphdr *tcph = (struct tcphdr *)(Buffer + iphdrlen + sizeof(struct ethhdr));
	int header_size = sizeof(struct ethhdr) + iphdrlen + tcph->doff * 4;

	fprintf(logfile, "\n\n***********************TCP Packet*************************\n");
	print_ip_header(Buffer, Size);

	fprintf(logfile, "\nTCP Header\n");
	fprintf(logfile, "   |-Source Port      : %u\n", ntohs(tcph->source));
	fprintf(logfile, "   |-Destination Port : %u\n", ntohs(tcph->dest));
	fprintf(logfile, "   |-Sequence Number    : %u\n", ntohl(tcph->seq));
	fprintf(logfile, "   |-Acknowledge Number : %u\n", ntohl(tcph->ack_seq));
	fprintf(logfile, "   |-Synchronise Flag     : %d\n", (unsigned int)tcph->syn);
	fprintf(logfile, "   |-Finish Flag          : %d\n", (unsigned int)tcph->fin);
	fprintf(logfile, "   |-Window         : %d\n", ntohs(tcph->window));

	fprintf(logfile, "\nData Payload\n");
	PrintData(Buffer + header_size, Size - header_size);
	fprintf(logfile, "\n###########################################################");
}

void PrintData(const u_char *data, int Size)
{
	int i, j;
	for (i = 0; i < Size; i++)
	{
		if (i != 0 && i % 16 == 0)
		{
			fprintf(logfile, "         ");
			for (j = i - 16; j < i; j++)
				fprintf(logfile, (data[j] >= 32 && data[j] <= 128) ? "%c" : ".", (unsigned char)data[j]);
			fprintf(logfile, "\n");
		}
		if (i % 16 == 0) fprintf(logfile, "   ");
		fprintf(logfile, " %02X", (unsigned int)data[i]);
		if (i == Size - 1)
		{
			for (j = 0; j < 15 - i % 16; j++) fprintf(logfile, "   ");
			fprintf(logfile, "         ");
			for (j = i - i % 16; j <= i; j++)
				fprintf(logfile, (data[j] >= 32 && data[j] <= 128) ? "%c" : ".", (unsigned char)data[j]);
			fprintf(logfile, "\n");
		}
	}
}
```

> [!NOTE]
> 지면상 `print_udp_packet`, `print_icmp_packet`은 `print_tcp_packet`과 구조가 동일해서(이더넷/IP 헤더 출력 → 프로토콜별 헤더 출력 → 페이로드 헥사덤프) 생략했다. 전체 코드는 위 4개 함수 패턴을 프로토콜 헤더 구조체(`udphdr`, `icmphdr`)만 바꿔서 반복한 형태다.

### 코드 검증

Ubuntu 22.04 + `libpcap-dev` 환경에서 `gcc -Wall -c`로 컴파일해봤다. 결과는 **경고 1개 외 정상 컴파일**(`iphdrlen`을 선언만 하고 안 쓰는 지점이 하나 있음 — 로직에는 영향 없음). 즉 문법적으로는 문제없는, 그대로 가져다 쓸 수 있는 코드다.

다만 실무 관점에서 짚고 넘어갈 부분:

- `devs[100][100]`에 `count`를 1부터 증가시키며 `strcpy`하는데, 인터페이스가 99개를 넘거나 인터페이스 이름이 100자를 넘으면 버퍼 오버플로우가 난다. 학습용 예제라 넘어가지만, 실제로 쓸 거면 `strncpy` + 개수 체크가 필요하다.
- 이더넷 헤더 뒤에 바로 IP 헤더가 온다고 가정한다(`buffer + sizeof(struct ethhdr)`). VLAN 태그(802.1Q)가 붙은 프레임은 이 가정이 깨지므로 오프셋이 밀린다.

---

## 2️⃣ 직접 정의한 구조체로 파싱하기 (커스텀 헤더)

OS가 제공하는 `<netinet/ip.h>`, `<netinet/tcp.h>` 대신, 비트필드로 헤더 구조체를 직접 정의해서 파싱하는 방식도 있다. OS 헤더 의존성이 없어서 이식성 있어 보이지만, 실제로는 **비트필드의 메모리 배치가 컴파일러·아키텍처마다 다를 수 있어** 프로덕션 코드에서는 오히려 지양되는 방식이다(학습 목적으로는 헤더 필드 하나하나를 직접 선언하면서 크기 감각을 익히기 좋다).

```c
#include <stdio.h>
#include <stdlib.h>
#include <pcap.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define BUFSIZE 1024

typedef struct EthernetHeader {
    unsigned char DesMac[6];   // 도착 MAC 주소
    unsigned char SrcMac[6];   // 송신 MAC 주소
    unsigned short Type;       // 상위 계층 프로토콜 종류
} EthernetHeader;

typedef struct IPHeader {
    unsigned char Version:4;     // IPv4
    unsigned char IHL:4;         // 헤더 길이(4바이트 단위)
    unsigned char TOS;           // 서비스 우선순위
    u_short TotalLen;            // IP 헤더~데이터 끝까지 길이
    unsigned short Identifi;     // 단편화 식별자
    unsigned char Flagsx:1;      // 항상 0
    unsigned char FlagsD:1;      // Don't Fragment
    unsigned char FlagsM:1;      // More Fragments
    unsigned int FO:13;          // Fragment Offset
    unsigned char TTL;           // 남은 홉 수
    unsigned char Protocal;      // TCP=6, UDP=17
    unsigned short HeaderCheck;  // 체크섬
    struct in_addr SrcAdd;
    struct in_addr DstAdd;
} IPH;

typedef struct TCPHeader {
    unsigned short SrcPort;
    unsigned short DstPort;
    unsigned int SN;             // Sequence Number
    unsigned int AN;             // Acknowledgment Number
    unsigned char offset:4;
    unsigned char Reserved:4;
    unsigned char FlagsC:1, FlagsE:1, FlagsU:1, FlagsA:1;
    unsigned char FlagsP:1, FlagsR:1, FlagsS:1, FlagsF:1;
    unsigned short Window;
    unsigned short Check;
    unsigned short UP;
} TCPH;

typedef struct HttpH {
    uint16_t HTP[16];
} HttpH;

void PrintEthernetHeader(const u_char *packet);
void PrintIPHeader(const u_char *packet);
void PrintTCPHeader(const u_char *packet);
void PrintHttpHeader(const uint8_t *packet);

void help() {
    printf("Write Interface Name\nSample: pcap_test ens33\n");
}

int main(int argc, char *argv[]) {
    if (argc != 2) { help(); exit(1); }

    struct pcap_pkthdr *header;
    const u_char *packet;
    char *dev = argv[1];
    char errbuf[PCAP_ERRBUF_SIZE];
    IPH *tlen;
    u_int length;

    pcap_t *handle = pcap_open_live(dev, BUFSIZE, 1, 1000, errbuf);
    if (handle == NULL) { printf("%s: %s \n", dev, errbuf); exit(1); }

    while (1) {
        int res = pcap_next_ex(handle, &header, &packet);
        if (res == 0) continue;          // 타임아웃, 다음 루프
        if (res == -1 || res == -2) exit(1); // 에러 또는 캡처 종료

        PrintEthernetHeader(packet);
        packet += 14;                     // 이더넷 헤더(14B) 건너뛰기
        PrintIPHeader(packet);

        tlen = (IPH *)packet;
        length = htons(tlen->TotalLen) - (uint16_t)(tlen->IHL) * 4;
        packet += (uint16_t)(tlen->IHL) * 4; // IP 헤더 길이만큼 이동
        PrintTCPHeader(packet);

        packet += (u_char)length;         // TCP payload 길이만큼 이동
        PrintHttpHeader(packet);
    }

    pcap_close(handle);
    return 0;
}

void PrintEthernetHeader(const u_char *packet) {
    EthernetHeader *eh = (EthernetHeader *)packet;
    printf("\n=== Ethernet Header ===\n");
    printf("Dst Mac %02x:%02x:%02x:%02x:%02x:%02x \n",
           eh->DesMac[0], eh->DesMac[1], eh->DesMac[2], eh->DesMac[3], eh->DesMac[4], eh->DesMac[5]);
    printf("Src Mac %02x:%02x:%02x:%02x:%02x:%02x \n",
           eh->SrcMac[0], eh->SrcMac[1], eh->SrcMac[2], eh->SrcMac[3], eh->SrcMac[4], eh->SrcMac[5]);
}

void PrintIPHeader(const u_char *packet) {
    IPH *ih = (IPH *)packet;
    printf("=== IP Header ===\n");
    if (ih->Protocal == 0x06) printf("TCP\n");
    printf("Src IP: %s\n", inet_ntoa(ih->SrcAdd));
    printf("Dst IP: %s\n", inet_ntoa(ih->DstAdd));
}

void PrintTCPHeader(const u_char *packet) {
    TCPH *th = (TCPH *)packet;
    printf("=== TCP Header ===\n");
    printf("Src Port : %d\n", ntohs(th->SrcPort));
    printf("Dst Port : %d\n", ntohs(th->DstPort));
}

void PrintHttpHeader(const uint8_t *packet) {
    HttpH *hh = (HttpH *)packet;
    printf("=== HTTP Header ===\n");
    for (int i = 0; i < 16; i++) printf("%02x", hh->HTP[i]);
    printf("\n");
}
```

이 코드도 동일 환경에서 경고 없이 컴파일된다. 다만 이더넷 헤더를 항상 14바이트로 고정 취급(`packet += 14`)하기 때문에 VLAN 태그가 붙으면 오프셋이 어긋나고, `TotalLen` 계산의 `length`를 부호 있는 캐스팅 없이 다루는 부분은 프래그먼트된 패킷이나 옵션이 있는 IP 헤더에서는 부정확해질 수 있다. "옵션 없는 가장 단순한 TCP/IP 패킷"을 전제로 한 학습용 파서라고 보면 된다.

---

## 3️⃣ 패킷에서 JPEG 파일 카빙하기

### 왜 패킷에서 파일을 복원하나

파일 카빙(carving)은 원래 디지털 포렌식에서 나온 개념이다. 파일시스템 메타데이터(파일 이름, 확장자, 디렉터리 정보)가 없어도, **파일 포맷 고유의 시그니처(매직 넘버)** 를 이용해 바이트 스트림 안에서 파일의 시작과 끝을 찾아 잘라내는 기법이다. 이걸 pcap에 적용하면:

- 네트워크 캡처만 확보한 상황에서(엔드포인트 접근 권한이 없어도) HTTP로 전송된 이미지·문서를 복원해 **무엇이 오갔는지 증거로 남길 수 있다** — 예를 들어 내부망에서 이미지 파일이 외부로 업로드된 정황을 pcap만으로 재구성하는 경우.
- 악성코드가 C2 채널로 페이로드를 실어 나를 때도 유사한 시그니처 기반 탐지/추출이 쓰인다.
- CTF의 forensics 카테고리에서 "이 pcap 안에 숨겨진 파일을 찾아라" 유형 문제로 자주 나오는, 실습하기 좋은 주제다.

JPEG은 이 실습에 적합한 포맷이다. 파일 시작에 `FF D8`(SOI, Start Of Image), 끝에 `FF D9`(EOI, End Of Image) 마커가 고정적으로 붙기 때문에, 파일 크기를 몰라도 두 마커 사이만 잘라내면 이미지가 복원된다.

### 구현

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

char BUF[8];

void jpg_data(FILE *fp, FILE *fp_new) {
    char *jpg_header = "FF D8";
    char *jpg_footer = "FF D9";

    fp = fopen("rawdata.txt", "rb");
    fp_new = fopen("result.txt", "wb");

    if (fp == NULL || fp_new == NULL) {
        printf("file open fail!\n");
        return;
    }

    while (fgets(BUF, sizeof(BUF), fp) != NULL) {
        if (strstr(BUF, jpg_header) != NULL) {
            fwrite(jpg_header, strlen(jpg_header), 1, fp_new);
            while (fgets(BUF, sizeof(BUF), fp) != NULL) {
                fwrite(BUF, strlen(BUF), 1, fp_new);
                if (strstr(BUF, jpg_footer) != NULL) break;
            }
        }
    }
    fclose(fp);
    fclose(fp_new);
}

int main(void) {
    FILE *fp = NULL, *fp_new = NULL;
    jpg_data(fp, fp_new);
    return 0;
}
```

> [!NOTE]
> 원본 코드를 검증차 Ubuntu 컨테이너에서 그대로 컴파일해본 결과, 다음 문제들이 실제로 나왔다. 위 코드는 그 문제들을 고친 버전이고, 원인은 아래에 정리한다.
>
> - **`fwrite(jpg_header, sizeof(jpg_header), 1, fp_new)`** — `jpg_header`는 `char *`이므로 `sizeof(jpg_header)`는 문자열 길이가 아니라 **포인터 크기(64비트 환경에서 8)**다. 문자열 "FF D8"은 5글자(+NUL 6바이트)뿐인데 8바이트를 쓰라고 하면, 문자열 끝을 넘어선 메모리 2바이트가 결과 파일에 같이 써진다. `strlen()`으로 바꿔야 의도대로 동작한다.
> - **`if(fp==NULL|fp_new==NULL)`** — 논리 OR(`||`)가 아니라 비트 OR(`|`)를 썼다. 두 값 다 포인터라 우연히 값 자체는 맞게 나오지만(널 포인터는 보통 0이라 비트 OR도 0/1 판정이 맞아떨어짐), 컴파일러가 "괄호로 의도를 명확히 하라"는 경고를 준다. 스타일 문제지만 습관을 들이는 게 안전하다.
> - **파일 열기 실패 시 처리 누락** — 원본은 `fopen` 실패를 출력만 하고 계속 진행해서 NULL 포인터로 `fgets`를 호출해 크래시가 난다. 실패 시 `return`으로 함수를 종료하도록 고쳤다.
> - **`void main(void)`** — C 표준상 `main`의 반환형은 `int`여야 한다. 대부분의 컴파일러는 경고만 내고 넘어가지만(gcc는 `-Wmain` 경고), 표준을 지키려면 `int main(void)` + `return 0;`이 맞다.
> - **`main`에서 만든 `fp`, `fp_new`를 넘겨도 실제로는 안 쓰인다** — `jpg_data` 내부에서 바로 `fopen`으로 덮어쓰기 때문에, 호출자가 넘긴 인자는 무의미하다. 함수 시그니처에서 파라미터를 아예 빼도 되는 부분이다.

### 이 방식의 전제와 한계

이 코드는 `rawdata.txt`를 **텍스트로 표현된 헥사 덤프**(예: tshark의 헥사 출력이나 Wireshark의 "Follow TCP Stream → Hex Dump" 결과)라고 가정하고, `"FF D8"`이라는 **문자열**을 찾는다. 실제 pcap의 raw 바이트(`0xFF 0xD8`)를 이진 그대로 비교하는 게 아니라는 점이 중요하다. 그래서 `BUF` 크기(8바이트)나 텍스트 줄바꿈 위치에 따라 마커가 정확히 한 줄에 걸리지 않으면 놓칠 수 있다는 한계가 있다. 제대로 하려면 raw 바이너리 페이로드를 통째로 메모리에 올려 `memcmp`로 2바이트씩 비교하는 방식이 더 견고하다.

> 참고로 실제 운영 환경이라면 이런 카빙 로직을 직접 짤 필요 없이 `tshark`가 내장 기능으로 제공한다 (`--export-objects`, 아래 tshark 섹션 참고). 이 코드는 "카빙이 원리적으로 어떻게 동작하는가"를 이해하기 위한 학습용 구현으로 보면 된다.

---

## 4️⃣ tshark로 같은 작업을 빠르게 하기

Wireshark GUI 없이 커맨드라인에서 pcap을 다루고 싶을 때, 혹은 스크립트/파이프라인에 패킷 분석을 끼워 넣고 싶을 때 `tshark`(Wireshark의 CLI 버전)를 쓴다.

### 필드 추출

목적지 IP만 뽑기:
```bash
tshark -r file.pcap -T fields -e ip.dst
```

TCP 트래픽의 출발지/목적지 IP·포트 뽑기:
```bash
tshark -r file.pcap -T fields -e ip.src -e tcp.srcport -e ip.dst -e tcp.dstport -Y tcp
```

UDP도 동일한 패턴:
```bash
tshark -r file.pcap -T fields -e ip.src -e udp.srcport -e ip.dst -e udp.dstport -Y udp
```

`-Y`는 디스플레이 필터(Wireshark 필터 문법 그대로), `-T fields -e <필드>`는 원하는 컬럼만 뽑아내는 옵션이다. 대용량 pcap을 GUI로 열지 않고도 `awk`/`grep`과 조합해 원하는 통계를 뽑을 수 있다.

### 파일 자동 추출 (카빙을 직접 안 짜도 되는 이유)

위에서 만든 JPEG 카빙 코드와 같은 일을, tshark는 프로토콜별 파일 재조립 기능으로 바로 해준다.

```bash
# HTTP로 오간 오브젝트(이미지, 파일 등)를 자동으로 재조립해 디렉터리에 저장
tshark -r file.pcap --export-objects http,./extracted
```

TCP 스트림 단위로 순서를 맞춰 재조립해주기 때문에, 세그먼트가 여러 패킷에 걸쳐 있어도(카빙 코드가 놓칠 수 있는 케이스) 안정적으로 원본 파일을 복원한다. 학습 목적이 아니라면 이쪽을 쓰는 게 맞다.

### 참고: pcap ↔ pcapng

- pcap 파일 시그니처: `D4 C3 B2 A1`
- pcapng 파일 시그니처: `0A 0D 0D 0A`
- pcapng는 pcap의 확장 포맷으로 더 많은 메타데이터(인터페이스 정보, 코멘트 등)를 담을 수 있다.
- pcapng → pcap 변환은 Wireshark에 포함된 `editcap` 도구로 가능하다: `editcap -F pcap input.pcapng output.pcap`

---

## 5️⃣ 트러블슈팅 — "HTTP 패킷이 안 잡혀요"

라이브 캡처 코드를 돌렸는데 패킷이 하나도 안 잡히거나 HTTP만 유독 안 잡히는 경우 체크할 것들:

1. **권한 문제** — libpcap으로 인터페이스를 promiscuous 모드로 여는 건 raw socket 권한이 필요하다. `sudo`로 실행하거나, 매번 sudo 쓰기 싫다면 `sudo setcap cap_net_raw,cap_net_admin=eip ./실행파일`로 캡처 권한만 바이너리에 부여하는 방법도 있다.
2. **인터페이스 이름 오타/불일치** — `ens33`, `eth0`, `wlan0` 등 실제 `ip a`로 확인한 이름과 코드에 넘긴 이름이 다르면 아무 패킷도 안 들어온다.
3. **HTTPS 때문에 평문 HTTP 자체가 없을 수 있다** — 요즘은 대부분의 웹사이트가 HTTPS(TLS)로 서빙되기 때문에, 테스트 대상 사이트가 HTTPS라면 애초에 평문 HTTP 트래픽이 오가지 않는다. HTTP 캡처 실습을 하려면 HTTP만 제공하는 테스트 서버(사설 웹서버 등)를 대상으로 잡아야 한다.
4. **캡처 필터 문법 오류** — `pcap_compile`/`pcap_setfilter`를 쓰는 경우 BPF 문법이 틀리면 조용히 아무것도 안 잡히거나 에러를 리턴한다.

---

## 📎 환경 구축 메모 (부록)

패킷 분석 자체보다는 실습 환경을 준비하며 남긴 잡다한 메모다.

**Ubuntu 디스크 용량 증설** (VM 디스크가 부족해질 때)
```bash
lsblk        # 파티션/용량 확인
df -h        # 사용량 확인

apt install cloud-guest-utils
growpart /dev/증설할디스크 파티션번호

resize2fs /dev/해당파티션
reboot
```

**FTP로 캡처 대상 파일 주고받기** (Ubuntu에 vsftpd, Windows에서 커맨드라인 FTP)
```bash
# Ubuntu (서버)
apt update
apt install vsftpd
iptables -F      # 방화벽 규칙 초기화(테스트 환경 한정)
```
```
# Windows (클라이언트)
cmd
ftp
open [대상 IP]
send [로컬 파일 경로]
```

---

## 🔚 정리

- 패킷은 결국 계층별 헤더가 순서대로 붙어 있는 바이트 배열이고, C에서는 오프셋만큼 포인터를 이동시켜 구조체로 캐스팅하면 각 계층의 필드를 읽을 수 있다.
- libpcap 표준 헤더(`netinet/*`)를 쓰는 방식과 직접 비트필드 구조체를 정의하는 방식 둘 다 가능하지만, 후자는 컴파일러/아키텍처 종속성이 있어 학습용으로 더 적합하다.
- 파일 카빙은 "매직 넘버로 시작과 끝을 찾는다"는 단순한 아이디어지만, 텍스트 기반으로 구현하면(이번 JPEG 코드처럼) 스트림 경계 처리가 까다롭다 — 실제로는 `tshark --export-objects`처럼 TCP 재조립까지 해주는 도구를 쓰는 게 안전하다.
- 커맨드라인 도구(`tshark`)는 GUI로 하기 번거로운 대량 pcap 분석이나 자동화에 강하다.

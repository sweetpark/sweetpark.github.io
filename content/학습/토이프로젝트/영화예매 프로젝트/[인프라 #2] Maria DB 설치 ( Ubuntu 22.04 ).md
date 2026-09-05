---
title: [인프라 #2] Maria DB 설치 ( Ubuntu 22.04 )
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [인프라 #2] Maria DB 설치 ( Ubuntu 22.04 )

Ubuntu 22.04 + MariaDB 10.6

## Ubuntu22.04

*   Ubuntu 22.04의 경우, 기본 apt에 속해있는 MariaDB 버전은 10.6이다
*   Springboot와 호환이 되기 위해서는 10.6 이상 필요

> 패키지 검색  
**" apt list [패키지명] "  
**  
> 패키지 설치  
**" apt-get install -y mariadb-server "  
" apt-get install -y mariadb-client "**

## MariaDB 아카이브

*   아카이브에 들어가면, 해당 필요한 버전 및 OS에 맞는 파일이 존재
*   해당 파일 다운로드 후, 서버에서 압축해제

https://archive.mariadb.org/mariadb-11.4.3/bintar-linux-systemd-x86_64/

## Maria 설치 과정 (root 계정으로 진행)

Maria DB 보안 설정
"mysql_secure_isntallation"으로 보안설정

*   첫 질문) 현재 루트 패스워드 입력 (없으면 엔터)
*   두번째 질문) unix_socket으로 인증을 받을 것이냐? 

![](https://blog.kakaocdn.net/dna/c35HwN/btsKvJF7SKm/AAAAAAAAAAAAAAAAAAAAAOHA8-ph_7da42_eYQResjkj9ofG-Lct02KD02xHArRM/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=cxCZZ8NtV0w5Gy1e4%2FZNEFJlZEI%3D)

*   세번째 질문) 패스워드를 바꿀것이냐?

![](https://blog.kakaocdn.net/dna/miaOa/btsKwo9jhzi/AAAAAAAAAAAAAAAAAAAAAI2vP3vY37OlSlxqN-HbmbC1HMJbpqfmjMsW8qTpWPrk/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=MstXwg%2FeWvcn2I33ZjMrIXylQb0%3D)

*   네번째 질문) 익명 계정을 삭제할거냐?

![](https://blog.kakaocdn.net/dna/x1p8P/btsKvBImEIR/AAAAAAAAAAAAAAAAAAAAAJYvH8vvtnjBEzyRwoBF6vhO-tLa6gpDhtcls0cmNg6l/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=%2BDBxYa%2FMuc0zwH%2Fexj%2BqsTCwGJM%3D)

*   다섯번째 질문) 원격 루트 로그인을 막을것이냐?

![](https://blog.kakaocdn.net/dna/Ec6VB/btsKuOaoWGi/AAAAAAAAAAAAAAAAAAAAAEleO7YVXt0fD1IudvphvJvb7tLnkdUT0VH0JmxJnDPh/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=G%2F55CiMIauav9qEfKcCMZPWoXS8%3D)

*   여섯번째 질문) 테스트 데이터베이스를 삭제할것이냐?

![](https://blog.kakaocdn.net/dna/bOCbXg/btsKvo99emG/AAAAAAAAAAAAAAAAAAAAAPlnq1uHn4ojCCPFo69PkJiuonar-TPjzX2tUO5ZijcA/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=htHVuRfTiGUcTb14bCga5JlV6kE%3D)

*   일곱번째 질문) 권한을 다시 설정하시겠습니까?

![](https://blog.kakaocdn.net/dna/bJEW7a/btsKuHJfbBs/AAAAAAAAAAAAAAAAAAAAAHPsDv8TmN8gxincOZt5K9YNkx6OQk7fVQMw3qxekgKx/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=uA4zawap54Z%2FZI8LSZeWX9XhJc0%3D)

*   완료!

![](https://blog.kakaocdn.net/dna/mgTWl/btsKvXqIwal/AAAAAAAAAAAAAAAAAAAAAE_hw4CxAC7ZVXyv0dErWgCOK5Te53lGzCJ-YyfNaiiE/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=GkAOsp9CNHU1m3ENZwFKp3IChzk%3D)

## MariaDB 실행

*   서비스 등록

systemctl enable mariadb

*   서비스 상태확인

systemctl status mariadb

*   서비스 시작

systemctl start mariadb

*   mariaDB 실행

mysql -u root -p  
(패스워드 입력)

> 원문: https://gradualprecision.tistory.com/163

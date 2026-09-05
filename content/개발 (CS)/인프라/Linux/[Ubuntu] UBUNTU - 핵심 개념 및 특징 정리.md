---
title: "UBUNTU"
tags: [학습, 개발-CS, 인프라, Ubuntu]
modified: 2026-09-05
---

# UBUNTU

> [!NOTE]
> Ubuntu 20.04 한글패치, 파일 송수신(FTP), Windows 실행파일 구동(Wine) 설정 정리.

## 🖥️ 시스템/환경
- 대상 OS: Ubuntu 20.04
- 파일 송수신: filezilla(vsftpd), winscp
- Windows 실행: Wine(32bit)

## 📋 작업 내역

### 한글패치
- language install
    - `ibus-setup` → 한국어 적용(korean)
    - settings ⇒ 설치된 언어관리에서 한국어 적용
        - 언어: 한국어
        - 형식: 대한민국
        - 입력소스: 한국어(Hangul)
- 참고: [Ubuntu 20.04 LTS 한글 입력 방법](https://pstudio411.tistory.com/entry/Ubuntu-2004-%ED%95%9C%EA%B8%80-%EC%9E%85%EB%A0%A5-%EB%B0%A9%EB%B2%95)

### 파일 송수신 — filezilla(vsftpd), winscp

**Ubuntu(server 역할) — vsftpd 설치**
- vsftpd 설치: `sudo apt install vsftpd`
- vsftpd 설정변경: `sudo vi /etc/vsftpd.conf`
    - `anonymous_enable=YES`
    - `Write_enable=YES`
- 방화벽 열기: `sudo ufw disable`
- 폴더에 사용자 권한 부여: `sudo chown -R [ftp계정] [해당폴더경로]`
- vsftpd 재시작: `systemctl restart vsftpd`
- 참고: [Windows - Linux FTP 원격 사용(파일 원격전송)](https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=engcang&logNo=221175206149), [(Ubuntu | 에러 해결) FTP 전송 Permission 550 에러](https://funfunit.tistory.com/194)

**Window(Client 역할)**
- filezilla client 설치
- 원격 연결
    - 호스트: 서버 IP
    - 사용자명: `who` 명령어 사용
    - Password: 계정 비밀번호
    - Port: 22(default: 22)

### Ubuntu 윈도우 파일 실행
- 32bit 필요: `sudo dpkg --add-architecture i386`
- Wine 설치
    - `sudo apt-get update`
    - `wget -nc https://dl.winehq.org/wine-builds/winehq.key`
    - `sudo apt-key add winehq.key`
    - `sudo add-apt-repository 'deb https://dl.winehq.org/wine-builds/ubuntu/ focal main'`
    - `sudo apt-get update`
    - `sudo apt-get install --install-recommends winehq-stable`
- wine 설정변경: `winecfg` → 라이브러리 "d3dx11_43" 추가
- 참고: [Ubuntu 20.04 LTS Wine 설치 및 구성](https://itlearningcenter.tistory.com/entry/%E3%80%90Ubuntu-2004-LTS%E3%80%91%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1-%EC%84%A4%EC%B9%98)

## 📌 비고
- 없음.

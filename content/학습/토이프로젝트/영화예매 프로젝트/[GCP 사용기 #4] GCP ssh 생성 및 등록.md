---
title: "[GCP 사용기 #4] GCP ssh 생성 및 등록"
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [GCP 사용기 #4] GCP ssh 생성 및 등록

## Public Key 생성

*   local Pc에서 공개키를 생성

```shell
ssh-keygen -t rsa -b 4096 -f [공개키 파일이름] -C [계정명 또는 계정이메일]
```

*   ~/.ssh 디렉토리 하위에 공개키 생성
    *   해당 공개키 값 복사

```shell
cat ~/.ssh/gcp_rsa_4096.pub
```

## 공개키 등록 (GCP)

*   메타데이터 설정으로 이동
*   sshkey 등록에서 공개키 복사한 값 붙여넣기

![](https://blog.kakaocdn.net/dna/VIzRS/btsKxJZOq1U/AAAAAAAAAAAAAAAAAAAAABiIZiFpN4G6j8T6elBN4xBXx0Ju3jSJRy0a1WGweAOt/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=hA82MfDCFMwiFz1APg%2FPU02Wgtk%3D)

![](https://blog.kakaocdn.net/dna/oqSQg/btsKvYYILmE/AAAAAAAAAAAAAAAAAAAAAIjzSk8wZ2NgVf7qDMBSymjwMhqjq-k_W1tjV_cD0VTw/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=4O%2BU2dB31osb1Pi7a9wtasF%2BrBA%3D)

## SSH 접속

*   원하는 ssh 클라이언트에서 해당 key를 넣고 접속
*   또는, ssh cli를 통해서 접속

```java
ssh -i [개인키파일] [계정명 또는 계정이메일]@[외부IP]
```

> 원문: https://gradualprecision.tistory.com/172

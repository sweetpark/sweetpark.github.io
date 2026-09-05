---
title: [GCP 사용기 #1] GCP 인스턴스 생성 (무료 서버)
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [GCP 사용기 #1] GCP 인스턴스 생성 (무료 서버)

## GCP 로그인 후 VM 생성 이동

![](https://blog.kakaocdn.net/dna/b5iJqA/btsKvaJ9Hti/AAAAAAAAAAAAAAAAAAAAAONldjSa7hzBW__2MV_U9-H5Pu0MAslbZ45kUmdol3Cq/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=cBfvZChEvVKL65a1DgWz8y3hWUM%3D)

## 무료티어 버전 확인

GCP 정책에 의해서, 무료티어 스펙이 존재  
(해당 부분은 주기적으로 업데이트 되므로 확인 요망)

[https://cloud.google.com/free/docs/free-cloud-features?hl=ko#compute](https://cloud.google.com/free/docs/free-cloud-features?hl=ko#compute)

 [Google Cloud 무료 프로그램  |  Google Cloud Free Program

이 페이지는 Cloud Translation API를 통해 번역되었습니다. 의견 보내기 Google Cloud 무료 프로그램 컬렉션을 사용해 정리하기 내 환경설정을 기준으로 콘텐츠를 저장하고 분류하세요. Google Cloud의 기본

cloud.google.com](https://cloud.google.com/free/docs/free-cloud-features?hl=ko#compute)

![](https://blog.kakaocdn.net/dna/QkUd6/btsKuvg7bI0/AAAAAAAAAAAAAAAAAAAAAI_lrr_9vMHH3Zz3g2YWjDQyTu-NCPwN0AOi9S9d_Hm1/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=SaYs4M2nwuKSMYU9CyRoBdWQGmc%3D)

## 서버 설정 ( 리전 )

![](https://blog.kakaocdn.net/dna/OMeoE/btsKuOACLJS/AAAAAAAAAAAAAAAAAAAAADsZ5ly6UF_zotGA8Vcu5PfUqNq-qt1uFHzlKRMZuWx4/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=oTq0b7mBktAok4R7aDNOpvLESj8%3D)

## 서버 설정 ( cpu + mem )

![](https://blog.kakaocdn.net/dna/A3ELD/btsKvd1cfp4/AAAAAAAAAAAAAAAAAAAAAHzK5zgkTBx3lZUNEBlo3Q1VxSIBxPmBMGEaAWjKepm_/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=mHhVGIZMoxKDqPuRaUj3XRDrA5I%3D)

## 서버 설정 ( 코어 설정 )

![](https://blog.kakaocdn.net/dna/cAOoFx/btsKtKzrwkn/AAAAAAAAAAAAAAAAAAAAAMLsMvUexhJCn5OEmncWm68WgfuTypH0DjbbpF4Qqi7r/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=RpatDhpzTKBnsYNLBybcWIOJosU%3D)

##  서버 설정 ( 부팅디스크 )

![](https://blog.kakaocdn.net/dna/MovdP/btsKtRSCxfv/AAAAAAAAAAAAAAAAAAAAABecszh0aZaP1tAgKfwpmu3fZ_6jpZ0wu-k6a9YnT_4Y/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=kc8oLYGEYCJbXwTGDPuaIipdHM4%3D)

## 월별 예상 가격

*   해당 무료티어 버전에 맞게 설정을 맞췄음에도 불구하고, 예상금액이 나오는데 사용한 후에는 과금이 되지 않는다고 한다
*   이 부분은 한달 뒤에 확인해야할듯 하다

![](https://blog.kakaocdn.net/dna/wt61A/btsKtPUWvhS/AAAAAAAAAAAAAAAAAAAAALqBNiBfgbeOlM27yiSfzieEeSjeKCufmzdDCeUEH1Dc/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=WPMWUFTQCFmyn9OeZ6akFB0qhSA%3D)

## 서버 접속

*   SSH를 이용해 브라우저에서 접속

![](https://blog.kakaocdn.net/dna/bXqd7D/btsKt69Rqdj/AAAAAAAAAAAAAAAAAAAAALYSK2Nfg5UwiJOGuWBgj_lZFCAM_EH0L4Dvs6DDHyNy/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=OEukkTTkI4pC6SUtnHFpiiHhjX4%3D)

> 원문: https://gradualprecision.tistory.com/161

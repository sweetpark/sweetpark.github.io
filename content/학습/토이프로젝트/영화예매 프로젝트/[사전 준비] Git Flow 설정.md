---
title: [사전 준비] Git Flow 설정
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [사전 준비] Git Flow 설정

## Git Flow를 사용하면서..

github는 단순히 소스코드를 저장하고, 온라인으로 저장된 형태의 소스코드를 권한이 있다라면 누구라도 쉽게 이용할 수 있으면서 코드의 결합을 할때 도움을 주는 도구라고 생각하고 있었다..  
  
 하지만, 중요한점은 결합을 할때에 방식이 지정되어 있지 않다면 **아직 덜 완성된 코드가 배포가 될수도 있고 Hot Issue로서 올라온 문제에 대해 수정을 할 때에 어떤 부분부터 적용**시킬지에 애매한 결과를 초래할 수 있다는 것을 알 수 있었다..  
  
 이럴 때에 사용하는 것이 Git Flow이다. 굳이 Git Flow라고 말하기 보다는 **소스코드 병합시의 타이밍과 배포를 명확**하게 관리하기 위해서 도입한다고 보는 편이 더 낫다고 생각이 든다..  
  
구글링을 해본다면 여러 종류의 Flow들이 즐비해 있는데, 현재 진행중인 서비스가 아니기에 맨처음 만들때에는 서로의 기능이 완성되고 결합되는 시점만 나누면 된다는 생각하에 하위에 Flow들을 구성해보았다..

## GIT FLOW 란?

GIT Flow 란, 브랜치 전략으로서 코드 관리 및 배포를 체계적으로 진행할 수 있도록 도와주는 역할을 의미합니다.  
대게는 운영서버부터 개발서버 QA를 구간마다 맞춰서 진행을 해야하기에 혼자개발을 하지 않는 이상 GIT FLOW 전략이 필요합니다.

| 브랜치 | 브랜치 목적 |
| --- | --- |
| Main | 안정적인 배포 버전을 관리하는 브랜치.실제 운영되고 있는 버전 |
| Devleop | 개발용 브랜치, 기능 개발이 완료되면 Develop 버전에 통합된다. |
| Feature | 새로운 기능을 개발할 때, 사용하는 브랜치 (개발이 완료되면 develop 브랜치에 병합됨) |
| Release | 해당 브랜치에서는 main 브랜치에 가기전, QA를 통하여 기능들을 테스트하고 수정하는 단계를 거친 후 main브랜치에 통합된다 |
| HotFix | Main브랜치에서 발견된 긴급한 버그를 수정할 때 사용하는 브랜치, 추후 develop브랜치에서 병합 후 main브랜치로 넘어가게 된다 |

## GIT FLOW 적용

*   현재 신 개발을 진행하기에, MAIN / DEVELOP 브랜치를 이용하여 진행할 예정
*   Feature 브랜치를 사용하는 대신해서 , local 에서 각자 기능마다 관리하기로 예정 (기능별로 개발자를 나눔)
*   DEVELOP브랜치에서 병합 및 QA테스트를 진행 후에 MAIN 브랜치에 병합할 예정

![](https://blog.kakaocdn.net/dna/WCdw7/btsKvKDZSGj/AAAAAAAAAAAAAAAAAAAAAK5QzsjhQDFSce3LFtrXuCwadVyFoct9JzLqDjxmqju_/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=alRUXS%2BWHLMPHX00RuedJO5pGYo%3D)

##   
회고

오늘 날짜 : 25/01/04  
 Feature 브랜치를 사용하는 대신해서 로컬에서 기능별로 테스팅하고 develop 브랜치에 저장하게 되었다.. 그런데 문제는 Feature브랜치가 없다보니 세부 기능별로 개발이 진행될때의 로그가 남지 않던 문제가 생겼었다.. 결국에는 develop브랜치는 배포를 진행하지 않아서 Main 브랜치처럼 사용하게 되는 문제가 생기게 되었다  
  
 여기서 느낀점은 새 프로젝트를 진행할 때에는 Main 과 develop로 나누기 보다는 Feature브랜치를 두어 세부 기능들에 대한 로그를 남길 수 있도록 진행하고, develop 브랜치로 큰 기능별로 병합을 진행하고, QA를 거친후 Main으로 병합하는 Flow가 새프로젝트에 적합할 것 같다는 생각이 들었다..  
  
 이렇게 느낀점에 대해서 생각해서 다음에는 Feature브랜치를 추가하여 작업을 진행해야겠다는 생각이 들었다..

> 원문: https://gradualprecision.tistory.com/159

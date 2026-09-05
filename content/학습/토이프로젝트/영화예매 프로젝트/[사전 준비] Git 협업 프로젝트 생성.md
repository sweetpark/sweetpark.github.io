---
title: [사전 준비] Git 협업 프로젝트 생성
tags: [프로젝트, 영화예매 프로젝트]
created: 2026-09-05
modified: 2026-09-05
---

# [사전 준비] Git 협업 프로젝트 생성

## 협업의 시작

소스 저장소 자체를 회사나, 정말 필요로한 일의 경우가 아니라면 사용하는 빈도수가 낮았던 것 같다..  
습관화가 되어있지 않다보니, 팀프로젝트를 위한 repository를 만들어야하는데 어떤 방식으로 만들면 좋을지에 대해 고민하다가 검색을 했더니, 2가지 정도의 방법이 나와서 이유를 생각해보고, 정리를 해놓을겸 작성해보려 한다..

## GIT의 협업 방법

소스 저장소는 git 말고도 여러가지 방식이 존재한다... 회사를 재직할 당시에 git도 사용해보았지만, svn도 사용을 했었다.   
또 다른 경험으로는 오픈 소스 저장소를 사용하는 것이 아닌 회사 자체에서 파일로서 업데이트를 하며 배포파일을 바꾸듯이 소스코드를 교체한다는 회사도 들어봤었다.. 사실 git을 굳이 사용하지 않아도 되지만 무료로 사용이 가능하고 많은 개발자들의 저장소로서 사용을해서 정보의 교류를 많이 얻을 수 있다는 장점이 있는 것 같아 선택하게 되었다  
  
그런데, 회사에서 사용했던 것은 gitlab이었고, 로그인 계정을 통한 권한이 부여되고 작업을 해야하는 repository에서 작업을 수행하고 관리하게 되었는데, 이번에는 github에서 팀프로젝트를 위한 공유 저장소와 권한을 어떻게 부여하면 좋을지에 대해 생각해보다가 2가지 방법에 대해 알 수 있게 되었다.. (물론, 더 좋은 방향이 있을 수 있지만 지금 생각한 방법으로도 충분하다고 생각이 들어 포스팅 하려한다.)  
  
그 방법에 대해서 지금부터 포스팅을 해보려 한다.

## 첫번째 방법)

개인 Github에 팀원들을 기여자로 만들어서 사용하는 방식이다.

Git 리포지토리 생성
1. Github 접속  
2. Repository 카테고리  
3. Repository 생성

![](https://blog.kakaocdn.net/dna/I3TPB/btsKvp1dGgP/AAAAAAAAAAAAAAAAAAAAAL0DsRq992w3lEPepbhI2UXERkNeatZ5YAyP2I8YAw4H/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=N%2BNevutwWp98NpeF2fgCN41M%2F%2Fs%3D)

Git Collaborator 등록
1. Repository 환경 설정  
2. Collaborator 클릭  
3. Collaborator 등록

![](https://blog.kakaocdn.net/dna/bQVVz4/btsKvptmB74/AAAAAAAAAAAAAAAAAAAAAKzJKFFCXrHpcR9qmbpC0uo06Mq8RbW9vDN65cncsBmM/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=%2BbnMn%2FZ4iNNh7%2FVgzan3j%2BrxxSc%3D)

![](https://blog.kakaocdn.net/dna/bPju3F/btsKvF3Onhs/AAAAAAAAAAAAAAAAAAAAABSXiFlnRYZPNcWMtswcGB24Xg32bX2QBkYdnte36GNk/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=RCBvN8LfutvFOKsMuAQtepnybYc%3D)

## 두번째 방법)

Organization을 사용하여, 팀 작업공간을 만들고 해당 프로젝트로 팀원들을 초대하여 협업하는 방식

Organization 만들기

![](https://blog.kakaocdn.net/dna/UMViw/btsLC5V81Vv/AAAAAAAAAAAAAAAAAAAAAIQp5nbDIL7Xus19odFfVcmvYpPJku80paehFmHgJDnV/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=PZI3gUrtTQvzZCf2jBh1rqWOyGs%3D)

Organization 설정 및 팀원 초대

![](https://blog.kakaocdn.net/dna/YoPSI/btsLDJkOBVU/AAAAAAAAAAAAAAAAAAAAAC_Azb9c1cF-GhK7uCqWcqUf7FAgQltjOp8asNHgs7Bc/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1790780399&allow_ip=&allow_referer=&signature=gXff3LGCx3ILinXY1pbWcq2UuCw%3D)

*   Teams의 경우, 팀원들을 하나의 팀으로 그룹을 지정하고 한번에 권한을 설정할 수 있다
*   People의 경우, 팀원들을 추가하고 팀원 개개인에게 권한을 부여할 수 있다
*   Repository는 개인 github에 repository를 만들듯이 진행하면 된다.

[https://docs.github.com/ko/organizations](https://docs.github.com/ko/organizations)

(자세한 사항은 github에서 제공하는 organization을 참고해주세요)

정리)  
 처음에는 단순하게 개인 github에 collaborator를 이용하여 팀원들을 초대하려 하였으나, 팀원들과 다른 프로젝트를 진행할 수 도 있고, 백엔드 말고도 프론트엔드에 관한 repository를 관리해줘야하는 부분도 있어서 organization으로 초대해서 팀들간의 권한을 부여하고, 각자가 맡은 repository에서 작업을 진행하는 것이 더 효율적이라고 생각이들었다..  
  
"한개의 프로젝트에 대해서 개인이 진행하는 것을 피드백한다" 의 경우에서는 굳이 organization을 통해서 초대할 필요는 없겠지만,  
구성원이 많고, 분배해야하는 것이 명확하며, 한명의 관리가 아닌 모두가 관리" 할 수 있는 것을 만들려면 organization을 사용하는 것이 더 바람직하다고 생각이 들었다.

> 원문: https://gradualprecision.tistory.com/157

---
title: "Git·버전관리 용어"
tags: [학습, IT용어집, Git, 버전관리, 협업, 코드리뷰]
created: 2026-10-02
modified: 2026-10-02
---

# Git·버전관리 용어

> 저장소, 브랜치, 되돌리기(revert, reset, rebase), PR/MR, 코드 리뷰 등 Git 협업 용어

- 용어 22개

---

### Git / repository (저장소)

**Git은 소스의 변경 이력을 관리하는 분산 버전 관리 도구, repository(repo)는 파일과 전체 변경 이력을 담은 저장소.**

- 내 PC의 local repository와 GitHub, GitLab 같은 서버의 remote repository로 나뉜다.

### clone

**원격 저장소를 이력까지 통째로 내 PC로 복제하는 것.**

### fork

**다른 사람(원본) 저장소를 내 계정 아래에 서버상의 복사본으로 만드는 것.**

- 원본을 "옮기는" 것이 아니라 복사하는 것이다. 원본에는 영향이 없고, 내 복사본에서 자유롭게 수정할 수 있다.
- 원본에 기여하고 싶을 때는 fork에서 작업한 뒤 PR/MR을 보낸다.
- 용어: upstream = 원본 저장소, origin = 내가 clone한 기본 원격(fork라면 내 복사본).

원본 저장소(upstream) → fork(내 계정의 복사본, origin) → clone(내 PC) → branch에서 작업 → commit → push → PR/MR → 코드 리뷰 → merge

### commit (커밋)

**변경 사항을 이력에 하나의 기록(스냅샷)으로 저장하는 것.**

- 고유한 해시 값과 메시지가 붙는다. 변경 대상을 고르는 준비 영역을 staging(index)이라 하고, `git add`로 담는다.

### push / pull / fetch

**push는 내 commit을 원격에 올리는 것, fetch는 원격 변경을 가져오기만 하는 것(합치지 않음), pull은 fetch 후 현재 브랜치에 합치는 것(merge 또는 rebase).**

### branch (브랜치)

**독립적으로 작업하려고 갈라낸 commit 이력의 한 갈래.**

- "작업 공간"이라고 이해해도 좋지만 파일을 복사해 두는 폴더가 아니다. 특정 commit을 가리키는 이름표(포인터)라서 만들고 지우는 비용이 거의 없다.
- main에 영향을 주지 않고 기능을 개발한 뒤 합친다.

### merge (머지)

**한 브랜치의 변경을 다른 브랜치에 합치는 것.**

- 이력을 그대로 보존하고 합치는 지점에 merge commit이 생기는 방식이 기본이다(변경이 한 줄이면 fast-forward).

### merge conflict (충돌)

**같은 부분을 서로 다르게 고쳐서 자동으로 합칠 수 없는 상태.**

- 사람이 어느 쪽을 쓸지 직접 골라 해결한 뒤 commit한다.

### PR (Pull Request) / MR (Merge Request)

**내 브랜치의 변경을 대상 브랜치에 합쳐 달라고 요청하고 리뷰받는 단위.**

- GitHub는 PR, GitLab은 MR이라고 부른다. 같은 개념이다.

### code review (코드 리뷰)

**다른 사람이 변경된 코드를 검토하는 것.**

- 버그, 설계, 가독성, 규칙 준수를 확인하고, PR/MR 안에서 의견을 주고받은 뒤 승인(approve)한다.

### LGTM (Looks Good To Me)

**"내가 보기엔 괜찮다"는 리뷰 승인 표현.**

### nit (nitpick)

**코드 리뷰에서 "사소한 지적"임을 표시하는 말. 고치면 좋지만 안 고쳐도 머지에 문제가 없는 수준.**

- 결함(bug)이 아니다. 변수명, 띄어쓰기, 주석 표현, 코드 스타일 같은 것이 대상이다. 코멘트 앞에 `nit:`를 붙여 "필수 아님"을 알린다.
- 리뷰 코멘트의 중요도를 구분하는 접두어는 팀마다 다르지만 보통 이런 식이다. `nit:` 사소함, `suggestion:` 제안, `question:` 질문, `blocker:`(또는 필수 수정) 이것이 해결되기 전에는 머지할 수 없음.
- 받는 쪽도 nit는 반영 여부를 스스로 판단할 수 있어서 리뷰 부담이 줄어든다.

### revert (리버트)

**특정 commit의 변경을 취소하는 새 commit을 만드는 것.**

- 이력은 그대로 두고 "취소했다"는 기록이 추가되므로, 이미 push해서 공유된 브랜치에서 되돌릴 때 안전하다.

### reset (리셋)

**브랜치(HEAD)가 가리키는 commit을 지정한 commit으로 옮기는 것.**

- `--soft`: commit만 취소하고 변경은 staging에 남긴다.
- `--mixed`(기본): commit과 staging을 취소하고 파일 변경은 남긴다.
- `--hard`: 파일 변경까지 모두 버린다(복구가 어렵다).
- "commit 취소"는 맞지만 범위가 옵션마다 다르다. 이력이 사라지므로 이미 push한 브랜치에서 쓰면 force push가 필요해 위험하다.

### rebase (리베이스)

**브랜치가 갈라져 나온 기준(base) commit을 다른 commit(보통 최신 main)으로 옮기고, 내 commit들을 그 위에 다시 쌓는 것.**

- "되돌리기"가 아니라 이력을 재배열(재작성)하는 것이다. 결과 이력이 일직선이 된다.
- merge와 비교: merge는 이력 그대로 + merge commit, rebase는 commit을 새로 만들어 쌓아서 해시가 바뀐다.
- 이미 push해 공유한 브랜치에 쓰면 다른 사람과 이력이 어긋나므로 위험하다(force push 필요).
- `rebase -i`(interactive)로 commit 순서 변경, 합치기(squash), 메시지 수정이 가능하다.

### squash (스쿼시)

**여러 commit을 하나로 합치는 것.**

- PR을 머지할 때 "squash and merge"로 이력을 깔끔하게 정리한다.

### cherry-pick (체리픽)

**다른 브랜치의 특정 commit 하나만 골라 현재 브랜치에 가져오는 것.**

- 운영 브랜치에 hotfix commit 하나만 가져올 때 쓴다.

### stash (스태시)

**commit하지 않은 작업 중 변경을 임시로 보관해 두고 작업 폴더를 깨끗하게 만드는 것.**

### tag (태그)

**특정 commit에 붙이는 고정 이름표.**

- 릴리스 버전(v1.0.0)을 표시할 때 주로 쓴다.

### HEAD

**지금 내가 보고 있는 commit(보통 현재 브랜치의 끝)을 가리키는 포인터.**

### diff

**두 상태(파일, commit, 브랜치) 사이의 차이.**

### .gitignore

**Git이 추적하지 않을 파일과 폴더를 적어 두는 파일.**

- 빌드 결과물, 비밀 값 파일, 로컬 설정 등을 올리지 않기 위해 쓴다.

---
title: "SVN"
tags: [학습, 개발-CS, 인프라, 형상관리, 개발]
modified: 2026-09-05
---

# SVN

> [!NOTE]
> Subversion(SVN) 용어와 명령어 정리. 자주 쓰는 status/revert/commit, branch·merge 절차, 기본 명령어 사전, depth 옵션까지 다룬다.

> [!CAUTION]
> 원문에 포함되어 있던 내부 SVN 서버 IP와 개인 계정명은 보안상 플레이스홀더(`<SVN_SERVER_IP>`, `<username>`)로 마스킹했다.

> [!NOTE]
> 원문의 명령어 플래그(스마트 대시 등)를 표준 문법으로 교정하고 구조를 정리함(사실 확인 권장).

## 📌 개념

### SVN 용어

| 용어 | 설명 |
| --- | --- |
| Repository | 파일들이 저장되는 원격 저장소 |
| Revision | 0부터 1씩 증가하는 유일한 값. 저장소에 변경이 발생할 때마다 증가. Merge 기준이 되며, 가장 최근 리비전을 HEAD Revision이라 함 |
| Working Copy | 체크아웃으로 내려받은 개발자 로컬 PC의 복사본 |
| Checkout | 원격 저장소의 파일을 로컬로 내려받음 |
| Add | 로컬 파일을 서브버전이 관리하는 파일로 등록 |
| Update | 로컬 파일을 Repository와 비교해 최신 상태로 갱신. 충돌 시 사용자에게 Merge 위임 |
| Commit | 로컬 변경을 Repository에 저장. 정상 완료 시 Revision 증가 |
| trunk | 보통 운영 중인 안정화 버전의 소스가 보관되는 디렉터리 |
| branches | test 소스를 저장하는 디렉터리. 완료되면 trunk로 병합 |
| tags | 특정 시점의 소스를 보관하는 디렉터리 |
| Merge | branch로 분리된 소스의 변경 내용을 현재 작업에 병합 |
| Locking | 잠금 상태 |

### depth 옵션 (`--set-depth`)

`--set-depth`는 작업 복사(working copy) 범위를 지정하며 `svn update` / `svn checkout`과 함께 사용한다.

| 옵션 | 설명 | 예시 |
| --- | --- | --- |
| `--set-depth empty` | 작업 복사 항목이 빈 형태 | `svn update --set-depth empty` |
| `--set-depth files` | 파일만 적용 | `svn update --set-depth files` |
| `--set-depth infinity` | 디렉터리 전체 포함 | `svn update --set-depth infinity` |

## 💻 예시

### 자주 쓰는 명령어

```bash
svn revert -R .    # 현재 디렉토리 하위 status revert 진행
svn status -q      # Modify 된 파일 리스트 출력
```

### SVN PUSH 절차

1. `svn status -q` — 체크인 확인 (`M` → 현재 focus 맞춰진 파일). 원치 않은 파일은 `svn revert [파일]`
2. `svn ci -m "[BT#(redmine번호)] 수정 내용" --username=<username>` — 체크인된 파일 커밋
3. `svn log | more` — 커밋 로그 확인
4. `svn up` — 커밋 내용 최신화

> [!IMPORTANT]
> `svn ci` 시 에디터가 뜨지 않으면 편집기를 지정한다.
> ```bash
> # ~/.bash_profile
> export SVN_EDITOR=vim
> source ~/.bash_profile
> ```

### SVN branch

```bash
# 1. branch 생성 (trunk 폴더 복사)
svn copy svn://<SVN_SERVER_IP>/VFilter30/collector \
         svn://<SVN_SERVER_IP>/VFilter30/branches/vada3dev \
         -m "Create vada3dev branch" --username=<username>

# 2. branch checkout
svn co svn://<username>@<SVN_SERVER_IP>/VFilter30/branches/vada3dev --username=<username>

# 3. merge (dry-run)
svn merge --dry-run ^/branches/mybranchname
```

branch 생성 스크립트 예시:

```bash
# [branch.sh]
#!/bin/bash
svn copy svn+ssh://svnpath/trunk svn+ssh://svnpath/branches/$1 -m "Create $1 branch"
svn co svn+ssh://<user>@<svn-host>/abr-encryptor/branches/$1
```

### SVN Merge

1. merge할 부분의 Revision 번호 확인
    - 첫 브랜치 작업 시: `svn log --stop-on-copy`
    - 같은 브랜치에서 2번째 이상 merge 시: 이전에 merge한 리비전 번호를 따로 기억해야 함
2. trunk 디렉토리로 이동 후 merge 전 확인(dry-run)

```bash
svn merge --dry-run -r[리비전번호]:HEAD svn://<username>@<SVN_SERVER_IP>/[브랜치주소] ./
# ex)
svn merge --dry-run -r9185:HEAD svn://<username>@<SVN_SERVER_IP>/VFilter30/branches/collectorDev ./
```

> [!IMPORTANT]
> 주소 형식: `svn://[계정명]@[svn주소]/[폴더 주소]`

3. real merge

```bash
svn merge -r[리비전번호]:HEAD svn://[브랜치주소] ./
```

### 기본 명령어 사전

| 명령어 | 설명 | 문법 |
| --- | --- | --- |
| Import | 빈 레포지토리에 처음 파일들을 등록 | `svn import [PATH] URL` |
| checkout (co) | 저장소에서 소스를 받아옴 | `svn checkout 저장소URL [PATH…]` / `svn -r [리비전] checkout [URL] [PATH…]` |
| export | checkout과 달리 버전관리 파일을 뺀 순수 소스만 가져옴 | `svn export URL [PATH..]` |
| commit | 변경 내용을 저장소에 갱신 (Revision +1) | `svn commit [PATH..]` |
| update | 로컬 소스를 서버 최신 버전으로 업데이트 | `svn update [PATH..]` |
| Revert | 로컬 소스를 이전 상태로 되돌림 | `svn revert [PATH..]` |
| copy | 로컬 사본/저장소 내용을 복사 (브랜치 생성용) | `svn copy SRC DST` |
| Log | 변경된 Revision 이력 확인 | `svn log [PATH..]` |
| diff | 예전/현재 소스 차이 비교. N:M 지정 시 두 리비전 비교 | `svn diff [-r N:M] TARGET` |
| blame | 각 행을 어떤 리비전에서 수정했는지 확인 | `svn blame TARGET` |
| lock | lock을 건 사용자만 수정 가능 | `svn lock TARGET` |
| unlock | lock 해제 | `svn unlock TARGET` |
| Add | 새 파일을 추가 | `svn add [PATH..]` |
| status | 수정 중인 파일 상태 확인 | `svn status [PATH…]` |
| mkdir | 새 디렉토리 생성 (commit 시 반영) | `svn mkdir` |
| delete | 파일/디렉토리 삭제 | `svn delete [PATH…(URL)]` |
| move | 파일 이동 (commit 시 반영) | `svn move [SRC] [DST]` |
| rename | 파일 이름 변경 (commit 시 반영) | `svn rename` |
| list | 파일 리스트 확인 | `svn list` |
| switch | 소스 서버 변경 | `svn switch` |
| merge | 두 소스 사이 변경 내용을 작업 경로에 적용 | `svn merge URL1[@N] URL2[@M] [PATH..]` / `svn merge [-r N:M] SOURCE [PATH..]` |
| info | 로컬/원격 저장소 파일·폴더 정보 확인 | `svn info TARGET` |

## 🔗 참고

- [SVN branch and merge 쉽게 활용하기 #2](https://liberalis.tistory.com/13222469)
- [svn merge 방법](https://hoiogi.tistory.com/20)
- [커맨드 라인에서 사용하는 SVN 명령어 정리 | 싸인펜의 Lifelog](https://signpen.net/2515287)
- [Subversion(SVN) 개념 및 명령어 정리](https://hellowoori.tistory.com/57)

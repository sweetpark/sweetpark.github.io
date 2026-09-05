---
title: "GIT"
tags: [학습, 개발-CS, 인프라, 형상관리, 개발]
modified: 2026-09-05
---

# GIT

> [!NOTE]
> Git 기본 명령어, 저장소 등록, 변경 확인·복원, 충돌 해결, commit author 수정(rebase)까지 실무 위주로 정리.

> [!NOTE]
> 원문의 명령어 오타(스마트 대시, `--amend` 등)와 Notion 자동 링크 잡음을 교정함(사실 확인 권장).

## 📌 개념

### Git GUI / 브랜치 전략

- GUI 환경: Source Tree 사용
- flow 전략 3종: GitLab flow / GitHub flow / Git flow

### commit 메시지 컨벤션

- 형식: `[일감 번호 - redmine] "바뀐 부분 요약"`

> [!IMPORTANT]
> 올릴 때 쓸데없는 파일을 함께 올리지 말 것.

## 💻 예시

### 저장소 등록 및 기본 명령어

```bash
git init
git remote add [리모트이름] [URL]   # 삭제: git remote remove [리모트이름]
git remote -v                        # remote 정보 확인
git pull

git branch [브랜치이름]              # 브랜치 생성
git checkout [브랜치이름]            # 브랜치 이동 (git checkout -b [브랜치명] = 생성+이동)

# 커밋 정보 등록 (누가 commit 했는지)
git config --global user.email "you@example.com"
git config --global user.name "Your Name"

git add [파일이름]
git commit -m "커밋 메세지"          # git commit -am "메세지" = add + commit
git push [리모트이름] [브랜치이름]

git log                              # commit 로그 기록 확인
```

### 변경 확인 및 복원

```bash
git status -uno         # 변경된 파일 확인
git checkout [파일명]   # 변경 파일 삭제(복원)
```

### pull 충돌 해결

```bash
git checkout -f "충돌나는파일"   # 충돌 파일만 이전 버전으로 rollback
```

### commit author 수정 (push 후)

```bash
# 1. git user 설정
git config --global user.name "[username]"
git config --global user.email "[email]"

# 2. rebase (되돌릴 커밋 개수 또는 해시 지정)
git rebase -i HEAD~[원하는 개수]
# git rebase -i [commit 해쉬값]^
#   → vi 편집기에서 대상 커밋을 pick → e(edit)로 변경

# 3. author 변경 후 적용
git commit --amend --author="parkwooyeong <<email>>"
git rebase --continue
git push -f origin [branch명]
```

---
title: "[CI/CD] merge 해결"
tags: [학습, 개발-CS, 인프라, CICD, SVN, Git]
modified: 2026-09-05
---

# [CI/CD] merge 해결

> [!NOTE]
> SVN/Git 브랜치 merge 시 conflict 처리 절차. 하나의 팀 안에서도 모듈에 따라 형상관리 도구가 다를 수 있다(예: Git으로 관리되는 모듈과 SVN으로 관리되는 모듈이 공존).

## 📌 개념

### Conflict 발생 시 선택 옵션
```text
Select: (p) postpone, (df) diff-full, (e) edit, (mc) mine-conflict, (tc) theirs-conflict, (s) show all options:
```

### SVN merge 절차
1. trunk 폴더로 이동
2. dry-run으로 먼저 충돌 여부 확인
    ```bash
    svn merge --dry-run -r[리비전번호]:HEAD svn://[계정명]@[svn주소]/[브랜치경로] ./
    ```
    - `-r[리비전 번호]` : 시작 지점(적용하고 싶은 지점 바로 이전 리비전 번호). 예) 9185부터 적용하려면 9184로 지정
    - 예) `svn merge --dry-run -r9185:HEAD svn://devuser@192.168.0.1/repo/branches/dev ./`
3. `--dry-run` 제거 후 실제 merge 진행

### Conflict 처리
- conflict 발생 시 → `e`(edit)로 직접 수정

    ```text
    void main() {
    <<<<<<< .mine
      int abc=0;
    ||||||| .r[Base] (로컬 Base Revision 번호)
    =======
      int i=0;
    >>>>>>> .r[Head] (원격 저장소의 Head Revision 번호)
      printf("");
    }
    ```

- 해결 후 → `r`(resolve)
- 충돌 부분을 일단 넘기려면 → `p`(postpone)

> [!IMPORTANT]
> branch 운영 유의사항
> 1. master와 branch를 상시 동기화해서(master → branch, branch → master 양방향 merge) conflict 발생 가능성 자체를 줄인다.
> 2. Conflict 발생 시 타인의 코드를 최대한 반영하는 방향으로 내 코드를 조정한다(임의로 남의 변경을 덮어쓰지 않음).

### Git 쪽 merge (예: Git으로 관리되는 모듈)
1. 작업 브랜치에서 git 작업 진행
2. git master로 이동 후 `git merge [merge할 branch명]`
3. Git 쪽에서 완료된 변경분을 SVN 쪽으로 반영해야 하는 경우, 대상 파일만 SVN 저장소로 옮겨 commit

### SVN 쪽 merge (예: SVN으로 관리되는 모듈)
1. 스크립트류는 운영 서버의 파일을 직접 이용해 master에 바로 commit하기도 함
2. 소스 파일(`.c` 등) 수정 시에는 `svn merge --dry-run -r[리비전번호]:HEAD svn://[브랜치주소] ./`로 충돌을 먼저 확인한 뒤 실제 merge 진행

## 🔗 참고
- 이종 형상관리(SVN+Git) 환경에서는 "어느 쪽이 진실 소스인가"를 명확히 하고, 한쪽에서 완료된 변경을 다른 쪽으로 옮기는 시점/방향을 팀 규칙으로 고정해두는 것이 conflict를 줄이는 핵심이다.

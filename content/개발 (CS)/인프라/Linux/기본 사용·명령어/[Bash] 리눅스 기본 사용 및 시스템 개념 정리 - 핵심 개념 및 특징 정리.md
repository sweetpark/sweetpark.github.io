---
title: "리눅스 기본 사용 및 시스템 개념 정리"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 3일 오전 10:37
modified: 2026-09-05
---

# 리눅스 기본 사용 및 시스템 개념 정리

> [!NOTE]
> 리눅스 기본 사용법과 시스템 개념. 가상 콘솔, Run Level/init·systemd, 에디터(vi), man 도움말, 마운트 개념을 정리.

## 📌 개념

### 가상 콘솔 (Virtual Console)

- Ubuntu는 기본적으로 6개의 가상 콘솔 제공(콘솔 번호 2~7번)
- 하나의 컴퓨터에 여러 개의 독립된 화면이 있는 것과 동일(모니터 6개 연결 효과)
- 콘솔 특징
    - `shutdown -h`: 모든 가상 콘솔 동시 종료
    - `shutdown -k`: 종료 메시지만 출력(실제 종료 안 됨)

### Run Level (런 레벨) / init

시스템의 동작 상태를 단계별로 정의한 개념. 전통적으로 `init (0~6)`, 최신 리눅스에서는 systemd target으로 관리한다.

| 레벨 | 설명 |
| --- | --- |
| init 0 | 시스템 종료 |
| init 1 | 복구 모드 (Single User) |
| init 3 | 텍스트 기반 다중 사용자 모드 (서버 기본) |
| init 5 | 그래픽 기반 다중 사용자 모드 (X Window) |
| init 6 | 시스템 재부팅 |

- init 레벨에 해당하는 target 위치: `/lib/systemd/system/runlevel?.target` (? = 0~6)
- `init 5`는 `init 3` 상태에서 X Window를 자동 실행

### man 섹션 번호

| 번호 | 설명 |
| --- | --- |
| 1 | 일반 명령어 |
| 2 | 시스템 호출 |
| 3 | 라이브러리 함수 |
| 4 | 디바이스 |
| 5 | 파일 형식 |
| 6 | 게임 |
| 7 | 기타 |
| 8 | 시스템 관리 |
| 9 | 커널 관련 |

### 마운트 (Mount)

- 리눅스는 물리적 장치를 특정 디렉토리에 연결(마운트)해야 사용 가능
- CD/DVD: 장치명 `sr0`(`cdrom`이 링크됨), 활성화 시 `/media` 아래 자동 마운트
- USB: FAT32 파일 시스템 인식 가능

### 전체 요약

- 가상 콘솔: 하나의 서버에 여러 화면
- Run Level: 시스템 동작 상태
- init / systemd: 부팅 및 모드 관리
- vi: 서버 필수 편집기 / man: 리눅스 공식 설명서
- mount: 장치는 디렉토리에 연결해야 사용 가능

## 💻 예시

### 콘솔 이동 / 모드 전환

```bash
# 가상 콘솔 이동 (기본 콘솔 F2, F3~F7 텍스트 모드)
Ctrl + Alt + F2 ~ F7

startx    # 텍스트 모드에서 X Window 실행

# 부팅 시 기본 텍스트 모드로 설정
ln -sf /lib/systemd/system/multi-user.target /lib/systemd/system/default.target
```

### 기본 명령 / 자동완성 · 히스토리

```bash
ln            # 심볼릭/하드 링크 생성
Tab           # 자동완성
history       # 명령어 히스토리 확인
history -c    # 히스토리 삭제
groups        # 현재 사용자가 속한 그룹 확인
```

### 에디터 (vi)

주요 에디터: `gedit`(GUI), `nano`(간단), `vi`/`vim`(표준). vi는 명령 모드/입력 모드로 구성된다.

```text
i        : 현재 커서 위치부터 입력
A        : 현재 줄 맨 끝에서 입력
yy       : 현재 행 복사
dd       : 현재 행 삭제
p        : 붙여넣기
x        : 한 글자 삭제
gg       : 첫 줄로 이동
/문자열   : 문자열 검색
:%s/기존문자/변경문자   : 전체 치환
:set number             : 행 번호 표시
```

```bash
sudo apt-get install vim   # 화살표 키 문제 해결
# 비정상 종료 시 .swp 파일 생성 → 삭제 후 재편집
```

### man 도움말

```bash
man [섹션번호] 명령어
```

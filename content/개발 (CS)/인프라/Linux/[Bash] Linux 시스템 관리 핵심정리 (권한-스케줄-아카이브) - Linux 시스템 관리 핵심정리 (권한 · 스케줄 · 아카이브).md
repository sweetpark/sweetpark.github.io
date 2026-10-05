---
title: "Linux 시스템 관리 핵심정리 (권한/스케줄/아카이브)"
tags: [학습, 개발-CS, 인프라, Linux, 개발]
created: 2026년 2월 2일 오후 11:20
modified: 2026-09-05
---

# Linux 시스템 관리 핵심정리 (권한 · 스케줄 · 아카이브)

> [!NOTE]
> umask·특수 권한, 백그라운드 실행, crontab 실습, at/cron 사용 제한, tar·gzip·bzip2 아카이브, 컴파일러 설치를 정리한 리눅스 시스템 관리 핵심 노트.

## 📌 개념

### umask (기본 권한 제어)

- 파일/디렉토리 생성 시 기본 권한에서 차감. 기본 umask 값 `0022`
- 디렉토리 기본값 `777`에서 `umask 777` 적용 시 생성 결과는 `d---------`

| 파일 | 적용 대상 |
| --- | --- |
| `/etc/profile` | 전체 사용자 |
| `~/.bashrc` | 특정 사용자 |

> [!IMPORTANT]
> umask는 로그아웃 시 초기화되므로 설정 파일에 넣어야 유지된다.

### 특수 권한 (setUID / setGID / Sticky Bit)

| 권한 | 값 |
| --- | --- |
| setUID | 4 |
| setGID | 2 |
| Sticky Bit | 1 |

- Sticky Bit: 파일 삭제 권한을 소유자로 제한, 디렉토리에만 설정 가능

### at / crontab 사용 제한

- at 제어 파일: `/etc/at.allow`, `/etc/at.deny`
- crontab 제어 파일: `/etc/cron.allow`, `/etc/cron.deny`
- 우선순위 규칙
    1. allow 없음 / deny 있음 → deny에 등록된 사용자 사용 불가
    2. allow 있음 / deny 있음 → allow에 등록된 사용자만 가능
    3. allow 없음 / deny 없음 → root만 가능

### 컴파일러 설치

| 배포판 | 명령 |
| --- | --- |
| RHEL / CentOS | `yum install gcc` |
| Ubuntu | `apt install gcc` |
| 전체 개발도구 | `yum groupinstall "Development Tools"` |

## 💻 예시

### 특수 권한 파일 찾기

```bash
find / -perm 4000 2>/dev/null           # setUID (에러는 /dev/null로 버림)
find / -perm -4000 -o -perm -2000       # setUID OR setGID
```

### 백그라운드 실행

```bash
명령어 &
sleep 100 &

find / -name "*" 2> find.err &                  # 오류만 저장
find / -name passwd > passwd.txt 2>&1 &         # stdout + stderr 함께 저장
jobs                                            # 백그라운드 작업 확인
```

### crontab 실습 (`/etc/crontab` 기준)

형식: `분 시 일 월 요일 사용자 명령어`

```bash
0 0 1-7 1 0 reboot                      # 매년 1월 첫 번째 일요일 00:00 재부팅
*/10 13-17 * * * date >> /datefile01    # 매월 13~17시, 10분마다 date 추가
20 14 8-14 3,6,9 2 cat /etc/passwd > /userfile   # 3·6·9월 2번째 화요일 14:20
30 0 1 * * date >> /root/datefile1      # 매월 1일 00:30
* * * * * date >> /root/datefile2       # 매분
0 12 1 1 * date > /root/datefile3       # 매년 1월 1일 12:00 (덮어쓰기)

# 특정 사용자 예약
crontab -e -u user
# 0 0 25 12 * echo "Merry christmas" > /tmp/christmas
# /etc/crontab 직접 수정 시:
# 0 0 25 12 * user echo "Merry christmas" > /tmp/christmas
```

### tar (아카이브)

```bash
tar cvf file.tar 대상     # 묶기
tar tvf file.tar          # 내용 확인
tar xvf file.tar          # 풀기
tar uvf file.tar 대상     # 업데이트
```

### gzip / bzip2 (압축)

```bash
gzip 파일
gunzip 파일.gz
gzip -l 파일.gz     # 정보 확인
zcat 파일.gz        # 내용 확인

bzip2 파일
bunzip2 파일.bz2
```

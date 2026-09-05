---
title: "실제 예제"
tags: [학습, 개발-CS, 언어, Shell-Script, 개발, Shell, 예제]
created: 2026-09-05
modified: 2026-09-05
---

# 실제 예제

> [!NOTE]
> 실무 셸 스크립트 예제 — 백업, 로그 파일 정리, 마운트 사용률 점검.

## 💻 예시

### 백업하기

```bash
#!/bin/bash

if [ -z $1 ] || [ -z $2 ]   # || (or) : 두 가지 하나라도 없으면
then
    echo usage : $0 sourcedir targetidir

else

    SRCDIR=$1

    DSTDIR=$2

    BACKUPFILE=backup.$(date +%y%m%d%H%M%S).tar.gz

    if [ -d $DSTDIR ]
    then

        tar -cvzf $DSTDIR/$BACKUPFILE $SRCDIR

    else

        mkdir $DSTDIR

        tar -cvzf $DSTDIR/$BACKUPFILE $SRCDIR

    fi

fi
```

### 로그 파일 정리

```bash
#!/bin/bash

LOGDIR=/var/log

GZIPDAY=1

DELDAY=2

cd $LOGDIR

echo "cd $LOGDIR"

sudo find . -type f -name '*log.?' -mtime +$GZIPDAY -exec bash -c "gzip {}" \; 2>

sudo find . -type f -name '*.gz' -mtime +$DELDAY -exec bash -c "rm -f {}" \; 2>
```

### 명령어 실행 예제 (마운트 사용률)

```bash
mount_used=$(`df -h`)
cnt=0   # 숫자는 그냥 들어감

for mount_used_item in ${mount_used[*]}
do
    if [[ "$mount_used_item" =~ [1-9][0-9][%] ]]; then   # 10% 이상 df -h 검열
        cnt3=$cnt
        cnt2=`expr $cnt + 1`
        echo "사용률:${mount_used[$cnt3]}, 디렉토리: ${mount_used[$cnt2]}"
    fi
    cnt=`expr $cnt + 1`
done
```


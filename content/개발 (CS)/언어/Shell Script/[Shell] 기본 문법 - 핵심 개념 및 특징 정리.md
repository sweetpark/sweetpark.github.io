---
title: "기본 문법"
tags: [학습, 개발-CS, 언어, Shell-Script, 개발, Shell, 문법]
created: 2026-09-05
modified: 2026-09-05
---

# 기본 문법

> [!NOTE]
> Bash 셸 스크립트 기본 문법 총정리 — 변수/배열/조건문/반복문/리다이렉션/환경변수와 cut·awk·sed 명령어.

## 📌 개념

### 쉘 스크립트 시작

- 쉘 스크립트는 **파일로 작성 후, 파일 실행**
- 파일의 가장 첫 라인은 ⇒ **`#!/bin/bash`**로 시작
- 코드 작성 후에는 **실행 권한**을 부여
- 일반적으로 '**파일이름.sh**' 형태의 파일 이름 작성
- 주석은 **`#내용`** 으로 처리

### echo

- 화면에 출력해주는 쉘 명령어

```bash
echo "Hello Bash"
```

### 변수 (변수명=데이터)

- 주의) 띄어쓰기하면 안 됨

```bash
mysql_id='root'   # 변수 설정
echo $mysql_id    # 호출
```

### 배열

- 인덱스 번호는 '0'부터 시작

```bash
daemons=("http" "mysql" "vsftpd")   # 배열 설정

echo ${daemons[1]}   # mysql 출력
echo ${daemons[@]}   # daemons의 모든 데이터 출력
echo ${daemons[*]}   # daemons의 모든 데이터 출력
echo ${#daemons[@]}  # daemons의 배열 size 출력

# 응용)
filelist=( $(ls) )   # 실행 디렉토리의 파일 리스트를 배열로 선언
echo ${filelist[*]}  # filelist의 모든 데이터 출력
```

### 사전에 정의된 지역변수

- `$$` : 쉘의 프로세스 번호 (pid)
- `$0` : 쉘 스크립트의 이름
- `$1` ~ `$9` : 명령줄 인수
- `$*` : 모든 명령줄 인수 리스트
- `$#` : 인수의 개수
- `$?` : 최근 실행한 명령어의 종료 값

> [!NOTE]
> 종료 값: 0 성공, 1 ~ 125 에러, 126 파일이 실행 가능하지 않음, 128 ~ 255 시그널 발생

```bash
# 예시) ls -al -z
# -. ls : $$ (실행 명령)
# -. -al : $1
# -. -z : $2
# -. $# : 2개

echo $$ $0 $1 $* $#
# $$ : pid
# $0 : 이름
# $1 : 첫번째 인자
# $* : 이름을 뺀 나머지 인자 리스트
# $# : 이름을 뺀 나머지 인자 개수
```

### 연산자 (expr)

- `expr` : 숫자 계산
    1. `expr` 사용 시 역 작은따옴표(`` ` ``)를 사용해야 함
    2. 연산자 `*`와 괄호 `()` 앞에는 역슬래시(`\`)를 같이 사용해야 함
    3. 연산자와 숫자, 변수, 기호 사이에는 space를 넣어야 함

```bash
num=`expr \( 3 \* 5 \) 4 + 7`
```

### 조건문 (if)

- `then`과 `fi` 안에만 들어가 있으면 됨 (꼭 탭으로 띄울 필요는 없음)

```bash
if [ 조건 ]
then
    명령문
fi

# 사용법)
if [ $1 != $2 ]
then
    echo "different values"
    exit
fi
```

- **조건 (문자 비교)**
    - `문자1 == 문자2` : 같음
    - `문자1 != 문자2` : 다름
    - `-z 문자` : 문자가 null이면 참 (값이 없으면 true)
    - `-n 문자` : 문자가 null이 아니면 참
- **수치 비교**
    - `값1 -eq 값2` : 값이 같음
    - `값1 -ne 값2` : 값이 다름
    - `값1 -lt 값2` : 값1 < 값2
    - `값1 -le 값2` : 값1 ≤ 값2
    - `값1 -gt 값2` : 값1 > 값2
    - `값1 -ge 값2` : 값1 ≥ 값2
- **파일 검사**
    - `-e 파일명` : 파일이 존재하면 참
    - `-d 파일명` : 파일이 디렉토리면 참
    - `-h 파일명` : 심볼릭 링크 파일이면 참
    - `-f 파일명` : 파일이 일반 파일이면 참
    - `-r 파일명` : 파일이 읽기 가능하면 참
    - `-s 파일명` : 파일 크기가 0이 아니면 참
    - `-u 파일명` : 파일이 set-user-id가 설정되면 참
    - `-w 파일명` : 파일이 쓰기 가능이면 참
    - `-x 파일명` : 파일이 실행 가능하면 참

```bash
# 사용법) 해당 파일이 있는지 확인
if [ -e $1 ]
then
    echo " file exit "
fi
```

- **논리 연산**
    - `조건1 -a 조건2` : AND
    - `조건1 -o 조건2` : OR
    - `조건1 && 조건2` : 양쪽 다 성립
    - `조건1 || 조건2` : 한쪽 또는 양쪽 다 성립
    - `!조건` : 조건 성립 X
    - `true` : 조건 언제나 성립
    - `false` : 조건 언제나 성립 X

- **if/else 구조**

```bash
# if / else
if [ 조건 ]
then
    명령문
else
    명령문
fi

# if / elif / else
if [ 조건 ]
then
    명령문
elif [ 조건 ]
then
    명령문
else
    명령문
fi

# 조건문 한 줄에 작성
if [ 조건 ]; then 명령문; fi
```

### 반복문

```bash
for 변수 in 변수값1 변수값2 ...
do
     명령문
done

while [ 조건문 ]
do
    명령문
done
```

```bash
# for문
#!/bin/bash
for database in $(ls)
do
    echo $database
done

# while문
lists=$(ls)
num=${#lists[@]}
index=0
while [ $num -ge 0 ]
do
    echo ${lists[$index]}
    index=`expr $index + 1`
    num=`expr $num - 1`
done
```

### ping

- 컴퓨터 연결 여부 확인
- `ping -c 1 [ip] 1>/dev/null`
    - `1>/dev/null` : 표준 출력 내용은 버려라
    - `-c` : n번만 체크

> [!NOTE]
> 0: 표준입력 / 1: 표준출력 / 2: 표준에러

```bash
# 사용법)
ping -c 1 192.168.0.1 1>/dev/null
if [ $? == 0 ]
then
    echo "gateway ping success"
else
    echo "gateway ping failed"
fi

# $? ⇒ 쉘 스크립트 안에서 최근에 실행한 명령어의 종료값
```

### 파이프

- `command1 | command2` : command1 결과 값을 command2 입력으로 전달
- `command1 |& command2` : 에러 값도 같이 넘어감

```bash
#!/bin/bash
cat /etc/passwd | grep wooyeong
```

### 리다이렉션

- `command1 > command2` : 파일 쓰기 (덮어쓰기)
- `command1 >> command2` : 이어 쓰기
- `command1 < command2` : 파일 읽기

```bash
#!/bin/bash
cat /etc/passwd > [파일명]   # 파일쓰기 (> : 덮어쓰기, >> : 이어쓰기)
```

### 2>&1와 /dev/null

| 구분 | 파일 디스크립터 |
| --- | --- |
| 표준입력 | 0 |
| 표준출력 | 1 |
| 표준에러 | 2 |

- `2>&1` : 표준에러(2)를 표준출력(1)으로 리다이렉션
    - 에러 내용을 화면에 출력하고, 프로그램은 계속 진행
    - `&1` : 표준 출력
- `/dev/null` : 표준출력을 버리기 위한 용도

```bash
#!/bin/bash
./shell_ex_0320.sh > /dev/null 2>&1
```

### 환경변수 설정 (env, set, export)

> [!IMPORTANT]
> 환경변수는 스크립트 내에서 동작하지 않음 (terminal에서 실행)

- `env` : 전역 변수 설정 및 조회
- `set` : 사용자 환경 변수 설정 및 조회

| 옵션 | 비고 |
| --- | --- |
| `-a` | 생성, 변경되는 변수 export 함 |
| `-e` | 오류가 발생하면 스크립트 종료 |
| `-x` | 수행하는 명령어를 출력 후 실행 |
| `-c` | 다음의 명령을 실행 (예: `bash -c "echo 'A'"`, `bash -c date`) |
| `-o` | 옵션 설정 |

- `export` : 사용자 환경 변수를 전역 변수로 설정
- sudo 작성 (ROOT 계정으로 실행)
    - `echo -n '패스워드' | sudo -S -u user2 /bin/true`
    - `sudo -u [user명] [./스크립트]`

```bash
# 다른 방법) 패스워드 파일 별도 분리
echo -n [변수명] > [패스워드파일]
cat [패스워드 파일] | sudo -S -u [user명] /bin/true
```

### Shell parameters

| 문자 | 설명 |
| --- | --- |
| `$0` | 실행된 스크립트 이름 |
| `$1` | $1,$2,$3,.. 인자 순서대로 번호 부여, 10번째부터는 `{}` 감싸줘야 함 |
| `$*` | 전체 인자 값 |
| `$@` | 전체 인자 값 |
| `$"@"` | 전체 인자값 한번에 출력 |
| `$#` | 매개변수 총 개수 |
| `$?` | 쉘에서 최근 실행한 명령어의 종료상태 |
| `$_` | 마지막 인수를 출력하는 변수 저장 |

- `for x in "$@"` : a,b,c,d 한 줄에 출력
- `for x in $*` : a / b / c / d 순으로 (줄바꿈) 출력됨

### Shell 특수문자

| 메타문자 | 기능 | 예제 |
| --- | --- | --- |
| `;` | 한 줄에 여러 개 명령 | `clear;date` |
| `*` | 임의의 문자 또는 문자들 | `ls h*` |
| `?` | 임의의 한 문자 | `ls h?` |
| `[]` | 현 문자 위치를 위한 문자 범위 표시 | `ls [a-z][A-Z]` |
| `{}` | 자릿수 표현 | `ls [a-z]{1,3}` (소문자 1개 또는 3연속 소문자) |
| `>, >>, <` | 입출력 방향 전환 | `ls > ls.out` |
| `\|` | 명령어 파이프 |  |
| `~` | 홈 디렉토리 |  |
| `-` | 이전 작업 디렉토리 |  |
| `''` | 모든 쉘 문자 표시 |  |
| `""` | `$`,`` ` ``,`\` 제외한 모든 쉘 문자 무시 |  |
| `` `` `` | 쉘 명령 수행 | `` echo `date` `` |
| `\` | 특수문자 제거 |  |

### Trouble Shooting

- `unary operator expected`
    - 해결) 1. 이중 대괄호 → if문 (`if [[ ~ ]]`), 2. 변수 쌍따옴표
- `not found` (조건절 오류)
    - `if [ (띄어쓰기 필수) ~ (띄어쓰기 필수) ]`

### 반복문 (for 범위)

```bash
for 변수 in 범위
do
     #명령
done
```

- `in` 뒤 범위: 리스트, 배열

```bash
# 리스트 나열
for var in A B C D E
do
    echo $var
done
```

- 배열: `array=(1,3,5,7,9)` → `for var in "${array[@]}"`
- 리스트: `list="A B C D E"` → `for var in $list`
- 시작..끝
    - `for var in {1..100}` : 1씩 증가
    - `for var in {1..100..5}` : 5씩 증가
    - `for var in {1..100..-5}` : 5씩 감소
- 이중 괄호: `for ((var=0; var <5; var++));`
- 무한 루프: `for (( ; ; ));`

### 주요 문법

- 명령어 사용: 명령어 입력 시 `` ` `` (역 따옴표) 사용
    - 예) `` `hostname` ``, `` `cat /etc/login.defs` ``
- `echo 값` : 값 출력
- `grep -v "특정문자"` : 특정 문자를 포함한 행을 제외한 나머지 행
- `awk` : 원하는 값 추출
- `2>&1` : 오류가 나더라도 메시지만 출력하고 프로그램은 중단하지 않음
- `if [ ~ ]` 주의점: 조건절에서 값이 없을 경우 오류날 수 있으므로 대괄호 2번씩 사용 (`if [[ ~ ]]`)

```bash
# 주요 구조)
if [ `cat /etc/login.defs |grep "PASS_MAX_DAYS" |grep -v "#" | awk '{print $2}'` -gt 8 ]
```

- 실행 예시 (파이프로 단계별로 좁혀가는 과정)

```bash
$ cat /etc/login.defs | grep "PASS_WARN_AGE"
#       PASS_WARN_AGE   Number of days warning given before a password expires.
PASS_WARN_AGE   7

$ cat /etc/login.defs | grep "PASS_WARN_AGE" | grep -v "#"
PASS_WARN_AGE   7

$ cat /etc/login.defs | grep "PASS_WARN_AGE" | grep -v "#" | awk '{print $2}'
7
```

### 주요 문법 (cut, awk, if 조건)

- C Shell 주의사항
    - bit 연산과 논리 연산 지원
    - `>>`, `<<`, `&`, `|`, `^` 연산자를 포함하는 식은 반드시 괄호 필요

> [!NOTE]
> Bit shift operator : `>>`(shift right), `<<`(shift left)
> Bit Unary operator : `~`(1의 보수), `!`(부정)
> Bit logic operator : `|`(OR), `^`(XOR), `&`(AND)
> Logical operator : `||`(logic OR), `&&`(logic AND)

- **cut** 명령어

| 옵션 | 의미 |
| --- | --- |
| `-b`, `--bytes` | 바이트를 기준으로 잘라냄 |
| `-c`, `--characters` | 문자열을 기준으로 잘라냄 |
| `-d`, `--delimiter` | 지정한 문자를 구분자로 사용 |
| `-f`, `--fields` | 필드를 기준으로 잘라냄 |
| `-z`, `--zero-terminated` | 라인의 구분자를 개행문자가 아닌 NULL로 사용 |

```bash
cut -c 2-5 /etc/passwd        # 파일의 2번째부터 5번째 문자까지 출력
cut -f 3 anaconda-ks.cfg      # 파일의 3번째 필드를 출력
cut -f 2 -d : /etc/passwd     # 파일의 2번째 필드를 출력 (필드 구분은 " : ")
```

- **awk** : 열 단위로 정리된 텍스트 파일에서 데이터를 뽑아낼 때 사용

```bash
$ echo "Hello World" | awk '{ print $0 }'
Hello World   # 전체

$ echo "Hello World" | awk '{ print $1 }'
Hello   # 첫번째 값

$ echo "Hello World" | awk '{ print $2 }'
World   # 2번째 값

$ echo "Hello,World" | awk -F "," '{ print $2 }'
World

awk -F ':' '{print $1}' filename       # 입력 필드를 ':' 로 구별
awk -F "[ :]" '{print $1 $2}' filename # 스페이스와 ':'로 입력 필드 구별
awk '/aaa/' filename                   # aaa라는 단어가 있는 라인 출력
awk '/^aaa/' filename                  # aaa로 시작하는 라인 출력
awk '/^(aa|bb)/' filename              # aa 또는 bb로 시작하는 라인 출력
```

- **if 문**
    - 조건절 비교 연산: `-gt` (값1 > 값2)
    - `if [ -z 변수 ]` : 변수가 null이면 true

> [!NOTE]
> `-n` 옵션 : 변수가 null이 아니면 true 반환

- 파일 관련 조건

| 조건 | 설명 |
| --- | --- |
| `if [ -d ${변수} ]; then` / `if [ ! -d ${변수} ]; then` | 디렉토리가 존재하면 참 / 존재하지 않으면 참 |
| `if [ -e ${변수} ]; then` / `if [ ! -e ${변수} ]; then` | 파일이 존재하면 참 / 존재하지 않으면 참 |
| `if [ -L ${변수} ]; then` | 파일이 symbolic link이면 참 |
| `if [ -s ${변수} ]; then` | 파일 크기가 0보다 크면 참 |
| `if [ -S ${변수} ]; then` | 파일 타입이 소켓이면 참 |
| `if [ -r ${변수} ]; then` | 파일을 읽을 수 있으면 참 |
| `if [ -w ${변수} ]; then` | 파일을 쓸 수 있으면 참 |
| `if [ -x ${변수} ]; then` | 파일을 실행할 수 있으면 참 |
| `if [ -f ${변수} ]; then` | 파일이 정규 파일이면 참 |
| `if [ -c ${변수} ]; then` | 파일이 문자 장치이면 참 |
| `if [ ${변수1} -nt ${변수2} ]; then` | 변수1이 변수2보다 최신 파일이면 참 |
| `if [ ${변수1} -ot ${변수2} ]; then` | 변수1이 변수2보다 최신이 아니면 참 |
| `if [ ${변수1} -ef ${변수2} ]; then` | 변수1과 변수2의 파일이 동일하면 참 |

    - 명령어 종료 코드: `exit();`

### sed 명령어

- 치환: `sed 's/원래값/바꿀값/' file`
    - 예) `sed 's/\t/\/' list.txt` : 탭 문자를 엔터로 변환
- 삭제: `sed '/지정문자/d' file`
    - 예) `sed '/TD/d' 1.html` : TD가 포함된 줄을 삭제
    - 예) `sed '/^$/d' 1.html` : 공백 라인을 삭제
    - 예) `sed '1,2d' 1.html` : 처음 1줄, 2줄을 지운다
    - 예) `sed '/Src/!d' 1.html` : Src 포함된 줄은 지우지 않는다

## 🔗 참고

- [LINUX BASH 쉘 프로그래밍 문법 마스터 총정리 (inpa)](https://inpa.tistory.com/entry/LINUX-%EC%89%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%ED%95%B5%EC%8B%AC-%EB%AC%B8%EB%B2%95-%EC%B4%9D%EC%A0%95%EB%A6%AC)

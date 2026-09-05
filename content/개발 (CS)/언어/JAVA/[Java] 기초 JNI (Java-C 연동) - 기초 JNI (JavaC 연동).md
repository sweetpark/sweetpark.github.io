---
title: "[기초] JNI (Java-C 연동)"
tags: [학습, 개발-CS, 언어, JAVA, 개발, JNI, C]
created: 2026-09-05
modified: 2026-09-05
---

# [기초] JNI (Java-C 연동)

> [!NOTE]
> Java-C 연동(JNI) 환경설정, so 파일 생성/확인, DLL 개념, gcc로 공유 라이브러리 만들기 정리.

## 🖥️ 시스템/환경
- JDK 관리: `alternatives`(Linux 계열, 여러 JDK 버전을 시스템 차원에서 전환)

## 📋 작업 내역

### JAVA 환경설정
- `/etc/bashrc`
    - JAVA_HOME 설정: `export JAVA_HOME=/usr/lib/jvm/[jdk버전 디렉토리]`
    - LD_LIBRARY_PATH 설정:
        ```bash
        export LD_LIBRARY_PATH=$JAVA_HOME:$JAVA_HOME/include:$JAVA_HOME/include/linux:/usr/java/packages/lib:/usr/lib64:/lib64:/lib:/usr/lib
        ```
- JAVA JDK 설정
    - 현재 설정 확인: `alternatives --list`
    - 설정 변경: `alternatives --config java`, `alternatives --config javac`

### C to JAVA library
- 기본적인 JNI 사용법 참고: [java에서 JNI를 이용하여 c 라이브러리(.so,.dll) 사용하기](https://shuming.tistory.com/entry/java%EC%97%90%EC%84%9C-JNI-%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%98%EC%97%AC-c-%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%ACsodll-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0)
- 헤더파일 만들기: `javac -h . <소스파일>`
- c 파일 → so 파일 만들기: `gcc -I$JAVA_HOME/include -I$JAVA_HOME/include/linux -shared -fpic -o libexample.so example.c`

> [!NOTE]
> so 파일 심볼 확인 → `nm [파일명].so`로 라이브러리가 내보내는 함수(예: `Java_패키지_클래스_메서드`)가 정상적으로 포함됐는지 확인 가능

> [!NOTE]
> 링크파일(의존성 확인) → `ldd [파일명].[확장자]`로 공유 라이브러리 의존성이 모두 해석되는지 확인

- 실행: `java -Djava.library.path=. NativeUtils` (외부 라이브러리이므로 경로를 지정해서 실행해야 함)

### 자주 겪는 오류
- 증상: `int NativeUtils.multiplyNumbers(int, int) → LinkError`, `Caused by: java.lang.NoClassDefFoundError`
- 원인: `LD_LIBRARY_PATH`에 so 파일이 위치한 작업 경로가 빠져있는 경우가 대부분
    ```bash
    export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$JAVA_HOME:$JAVA_HOME/include:$JAVA_HOME/include/linux:[so파일 위치 디렉토리]
    ```
- 참고: [(Error) Java 실행 명령어와 cannot find symbol 에러](https://dwaejinho.tistory.com/entry/Java-%EC%8B%A4%ED%96%89-%EB%AA%85%EB%A0%B9%EC%96%B4%EC%99%80-cannot-find-symbol-%EC%97%90%EB%9F%AC)

### DLL(Windows)
- 외부 라이브러리 / 동적 링크 라이브러리
- `__declspec(dllexport)` : 외부로 보여주기 위한 함수 선언
- `__declspec(dllimport)` : 내부에서 사용 목적으로 선언
- 과정: dll 만들기 → h(헤더) 만들기 → 컴파일 ⇒ lib + dll 파일 → new 프로젝트에서 cpp 연동 및 빌드 ⇒ release 파일 실행

### gcc로 so 파일 만들기(Linux)
- c file(`~.c`)
    - `gcc -c ~.c` // compile → 결과: `~.o`(목적파일 생성)
- dynamic 라이브러리 만들기: `gcc -shared (-fPIC) -o [라이브러리명].so [목적파일명].o`
- LD_LIBRARY_PATH 설정이 안 되면 `/usr/lib`에 so 파일을 직접 복사하는 방법도 있음
- MAIN file: `gcc -o [out 파일명] [main.c] -l [라이브러리명] -L [라이브러리 경로]`
    - 예) `libhello.so` ⇒ 라이브러리명: hello
- 참고: [리눅스 동적 라이브러리(공유 라이브러리) 생성하기](https://my-repo.tistory.com/68)

## 📌 비고
- Windows DLL 생성/의존성 이슈 대응은 원문에서 "구체적으로 파악 필요"로 남겨져 있던 부분이라, 추가 검증 후 보강 필요.

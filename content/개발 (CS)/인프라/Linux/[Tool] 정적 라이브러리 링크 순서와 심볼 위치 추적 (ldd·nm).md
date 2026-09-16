---
title: "정적 라이브러리 링크 순서와 심볼 위치 추적 (ldd·nm)"
tags: [학습, 개발-CS, 인프라, Linux, Makefile, 링커, ldd, nm]
created: 2026-09-16
modified: 2026-09-16
---

# 정적 라이브러리 링크 순서와 심볼 위치 추적 (ldd·nm)

> [!NOTE]
> 여러 모듈이 공통 빌드 설정을 공유하는 대규모 C 프로젝트에서, 라이브러리 링크가 실제로 어떻게 조립되는지와 정적 라이브러리 링크 순서 규칙, 심볼이 어느 라이브러리에서 오는지 역추적하는 방법을 정리한다. 기본적인 Makefile 구조(Target·매크로)는 [(Bash) 명령어 Makefile]([Bash]%20명령어%20Makefile%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.

## 1. 대규모 프로젝트의 공통 빌드 설정 패턴

모듈이 수십~수백 개인 C 프로젝트에서는 모듈마다 컴파일 옵션·경로를 반복해서 적지 않도록, 각 모듈의 `Makefile`은 소스 목록과 이 모듈만의 옵션만 담고 나머지는 공통 파일을 `include`하는 구조를 쓰는 게 일반적이다.

```makefile
# 모듈 Makefile — 이 모듈만의 정의
include $(COMMON_CONFIG)      # 컴파일러·경로·플래그 공통 정의
SRCS    = client.c
EXENAME = client
MLIBS   = -lcore -lipc -lutil
include $(COMMON_RULES)       # 빌드/설치 타깃(공통 규칙)
```

공통 파일(`COMMON_CONFIG`)이 컴파일러 종류, 시스템 헤더/라이브러리 경로, 공통 컴파일 플래그를 한 곳에서 관리하고, 공통 파일(`COMMON_RULES`)이 `all`/`clean`/`install` 같은 표준 타깃을 정의한다. 개별 모듈은 "무엇을 컴파일할지"만 적으면 되고, "어떻게 컴파일할지"는 공통 파일이 책임지는 구조다 — 옵션을 바꿔야 할 때 모듈 수백 개를 일일이 고치지 않고 공통 파일 한 곳만 고치면 되는 게 이 구조의 목적이다.

## 2. 링크가 조립되는 경로

```makefile
LDFLAGS = ... $(MLIBDIRS) $(COMMON_LIBDIRS) -L$(PROJECT_LIB_DIR)
LIBS    = $(MLIBS) $(COMMON_LIBS)

$(CC) $(LDFLAGS) -o $@ $(OBJS) ... $(LIBS)
```

`-l이름`은 "lib이름.so 또는 lib이름.a를 찾아 링크해라"는 뜻이고, 링커는 `-L`로 지정된 디렉토리를 순서대로 뒤진다. `-L` 탐색 경로는 공통 설정 파일이 정의하며, 보통 셸 초기화 스크립트(`.bashrc`/`.cshrc`)에서 잡아준 환경변수를 참조한다.

## 3. 실전 예시 — 사내 프레임워크 + 오픈소스 조합

실제 서비스 Makefile에서 자주 보이는 조합:

```makefile
MLIBS = -lcore -lipc -lutil -levent -levent_openssl -lnghttp2 -lcrypto -lssl
```

| 라이브러리 | 정체 | 어디서 오나 |
| :--- | :--- | :--- |
| `-lcore` | 사내 프레임워크 코어(스레드/로그/설정 유틸) | 사내 배포 경로 |
| `-lipc` | 사내 IPC 래퍼 | 사내 배포 경로 |
| `-lutil` | 사내 공용 유틸리티(자료구조 등) | 사내 배포 경로 |
| `-levent` | **libevent** — 오픈소스 이벤트 루프(epoll 래핑) | 시스템 패키지 또는 서드파티 vendor 경로 |
| `-levent_openssl` | libevent의 OpenSSL 확장(TLS 소켓을 이벤트 루프에 태움) | 위와 동일 |
| `-lnghttp2` | 오픈소스 **HTTP/2 프로토콜 라이브러리** (프레이밍/HPACK 구현) | 위와 동일 |
| `-lcrypto`, `-lssl` | **OpenSSL** 본체 | 시스템 기본 경로(`/usr/lib64`)인 경우가 많음 |

앞의 3개는 **사내 프레임워크 빌드 산출물**, 뒤의 5개는 **외부 오픈소스**다. 물리적으로 서로 다른 디렉토리에 있을 가능성이 높다. `event + event_openssl + nghttp2 + crypto/ssl` 조합은 전형적인 **HTTP/2 클라이언트·서버 자작 스택**의 재료다.

```
libevent         → 소켓 I/O 이벤트 루프 (accept/read/write 감지)
libevent_openssl → 그 이벤트 루프 위에 TLS 소켓을 얹음
nghttp2          → HTTP/2 프레임(HEADERS/DATA/SETTINGS) 파싱·생성, HPACK 압축
openssl          → TLS 핸드셰이크, 인증서 검증 (h2 negotiation용 ALPN 포함)
```

## 4. 실제 위치를 확인하는 법

```bash
# 1. Makefile이 실제로 어떤 값을 쓰는지 덤프 (많은 사내 빌드 템플릿이 이런 진단 타겟을 제공)
make check
# → LIBDIRS, MLIBS, LIBS, LDFLAGS 치환값이 그대로 출력됨

# 2. 환경변수가 어디를 가리키는지 확인
echo $PROJECT_HOME $VENDOR_LIB_HOME

# 3. 빌드된 바이너리가 런타임에 실제로 여는 .so 경로 확인
ldd ./서버바이너리 | grep -E 'event|nghttp2|ssl|crypto|core|ipc|util'

# 4. 심볼로 역추적 (라이브러리 이름을 모를 때)
for d in $PROJECT_HOME/lib $VENDOR_LIB_HOME/lib /usr/lib64; do
  for f in "$d"/*.so "$d"/*.a; do
    [ -e "$f" ] || continue
    nm -D "$f" 2>/dev/null | grep -q ' T nghttp2_session_send$' && echo "FOUND: $f"
  done
done
```

`ldd`는 실행 시점에 실제로 로드될 공유 라이브러리를 보여주고, `nm -D`(동적 심볼) / `nm`(정적 아카이브)는 어떤 라이브러리 파일이 특정 함수 심볼을 정의하는지 찾을 때 쓴다. "이 함수가 어느 라이브러리에서 왔는지 모르겠다"는 상황에서 라이브러리 후보들을 순회하며 심볼을 grep하는 패턴이다.

## 5. 링크 순서 주의

정적 라이브러리(`.a`)는 **왼쪽에서 오른쪽으로 심볼을 찾으므로**, 의존하는 쪽이 먼저 오고 의존받는 쪽이 뒤에 와야 한다.

```
-levent_openssl 은 -levent, -lssl/-lcrypto 심볼을 씀 → 그것들보다 앞에 있어야 함
-lnghttp2       는 (TLS 빌드 옵션에 따라) -lssl/-lcrypto 심볼을 쓸 수 있음 → 앞에 있어야 함
-lssl           은 -lcrypto 심볼을 씀 → -lcrypto보다 앞
```

`.so`(공유 라이브러리)는 순서에 덜 민감하지만, 정적 링크가 섞이면 순서를 바꿀 때 `undefined reference` 에러가 날 수 있다. 사내 라이브러리 사이에도 의존 관계(예: IPC 라이브러리가 내부적으로 유틸 라이브러리 심볼을 쓰는 경우)가 있으면 같은 규칙이 적용된다 — 링크 에러가 나면 먼저 "이 라이브러리가 어느 라이브러리에 의존하는지"부터 확인하고 순서를 맞춘다.

## 관련 문서
- [(Bash) 명령어 Makefile - 핵심 개념 및 특징 정리]([Bash]%20명령어%20Makefile%20-%20핵심%20개념%20및%20특징%20정리.md)
- [낯선 C 코드베이스 분석 순서 (방법론)]([Method]%20낯선%20C%20코드베이스%20분석%20순서%20(방법론).md)

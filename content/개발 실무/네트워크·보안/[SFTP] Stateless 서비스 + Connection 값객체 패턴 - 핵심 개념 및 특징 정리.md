---
title: "Stateless 서비스 + Connection 값객체 패턴"
tags: [학습, 개발실무, 아키텍처, 동시성]
modified: 2026-09-05
---

# Stateless 서비스 + Connection 값객체 패턴

> [!NOTE]
> 싱글톤 `@Service`가 연결 상태(세션·채널 등)를 인스턴스 필드로 들고 있어 멀티스레드 환경에서 경쟁 조건이 생기는 문제를, "서비스는 상태 없이, 연결 생명주기는 값객체가 전담"하는 구조로 해결하는 패턴.

---

## 1. 문제 — 싱글톤 서비스가 연결 상태를 필드로 들고 있으면

Spring의 `@Service`는 기본적으로 **싱글톤**(애플리케이션에 인스턴스 1개)이다. 그런데 이 싱글톤이 `init()`으로 연결(세션/채널 등)을 맺어 **인스턴스 필드에 저장**해두고 `upload()`/`download()`에서 그 필드를 쓰는 구조라면, 멀티스레드 환경에서 다음과 같은 경쟁 조건이 발생한다.

```text
@Service (싱글톤)
└── private Session  session       ← 인스턴스 필드(모든 스레드가 공유)
└── private Channel  channel       ← 인스턴스 필드

스레드 A: init() 호출 → session/channel 필드에 A의 연결 저장
스레드 B: init() 호출 → session/channel 필드를 B의 연결로 덮어씀
스레드 A: upload() 호출 → 이미 B의 연결로 바뀐 필드를 사용 → 엉뚱한 대상에 전송
```

이 구조에서 실제로 나타나는 증상 유형:
- 연결 도중 예외가 나면 `disconnection()`이 호출 안 돼 세션이 누적되는 **연결 누수**
- 여러 스레드가 동시에 `init()`을 호출하면 필드가 서로 덮어써져 **엉뚱한 대상으로 전송**
- 실패 시 임시 파일을 미리 만들어두면 **빈 파일이 남는** 문제
- 연결 실패 시 캐스팅한 참조를 그대로 쓰면 **NPE 잠재 위험**

---

## 2. 해결 — 서비스는 무상태로, 연결은 값객체가 `try-with-resources`로 전담

핵심 원칙은 세 가지다.

1. **서비스는 연결 상태 필드를 일절 보유하지 않는다.**
2. **접속 정보(호스트/계정/포트 등)는 호출부에서 매번 주입**받는다(서비스 필드가 아니라 메서드 파라미터로).
3. **연결의 생성·해제는 별도의 `Closeable` 값객체가 `try-with-resources`로 전담**한다 — 스레드마다 독립된 스택 프레임에서 그 값객체가 생성되므로, 애초에 필드 공유가 없어 경쟁 조건이 성립하지 않는다.

```text
ConnectInfo (record)        ← 접속 정보 값객체(호출부마다 다를 수 있음)
Connection  (Closeable)     ← 연결 생명주기 전담, try-with-resources로 자동 해제
Service     (@Service)      ← 비즈니스 로직만, 상태 필드 없음
```

```java
public record ConnectInfo(String host, String user, String password, int port) {}

public class Connection implements Closeable {
    private final Object session;   // 실제로는 라이브러리별 세션/채널 타입

    public Connection(ConnectInfo info) {
        // 연결 수립
    }

    public Object get() { return session; }

    @Override
    public void close() {
        // 예외 여부와 무관하게 항상 해제
    }
}

@Service
public class SomeIoService {
    // 인스턴스 필드 없음 — 스레드 안전은 "공유할 상태가 없다"는 사실 자체에서 나온다

    public int upload(ConnectInfo info, ...) {
        try (Connection conn = new Connection(info)) {
            // conn.get()으로 업로드 수행
            return 1;
        } catch (Exception e) {
            log.error("upload failed [{}]", info.host(), e);
            return -1;
        }
    }
}
```

### 부수적으로 함께 고치기 좋은 것들

같은 리팩터 타이밍에 아래 항목들도 함께 점검하면 좋다(이 패턴 자체의 부산물은 아니지만 관련도가 높다).

- **빈 파일 방지**: 출력 파일(`FileOutputStream` 등)은 원격 연결이 성공한 뒤에 생성한다 — 연결 시도 전에 미리 만들어두면 연결 실패 시 빈 파일이 남는다.
- **실패 시 산출물 정리**: catch 블록에서 이미 만든 파일이 있으면 삭제한다.
- **버퍼 단위 읽기**: 스트림을 1바이트씩 읽는 관용구가 남아있다면 버퍼(`byte[8192]` 등) 단위로 교체 — CPU 부하를 줄인다.

---

## 3. 왜 이 문제를 프레임워크가 제공하는 세션 팩토리로 해결하지 않는가

`DefaultSessionFactory`류(고정 서버 1개를 전제)나 `DelegatingSessionFactory`류(사전에 고정된 서버 목록을 전제)는 **접속 대상이 런타임에 동적으로 결정되는 경우**(예: 다수의 외부 파트너마다 접속 서버가 다름) 애초에 전제 자체가 맞지 않는다. 이런 경우 프레임워크 표준 팩토리에 억지로 끼워 맞추기보다, 위와 같이 **접속 정보를 호출부가 매번 넘기는 무상태 서비스 + 값객체** 조합이 구조적으로 더 잘 맞는다.

---

## 4. 언제 이 패턴을 적용하는가

```text
[ ] 싱글톤 서비스가 연결/세션 등 "상태"를 인스턴스 필드로 갖고 있는가?
[ ] 그 상태가 요청/스레드마다 달라질 수 있는가? (접속 대상이 동적으로 결정됨)
[ ] 멀티스레드 환경에서 그 서비스가 동시에 호출될 가능성이 있는가?
```

세 조건이 모두 해당하면, "서비스 무상태화 + 값객체가 생명주기 전담" 패턴을 우선 검토한다. 반대로 접속 대상이 애플리케이션 기동 시 고정되고 스레드 안전성이 프레임워크가 이미 보장하는 팩토리로 커버된다면, 표준 팩토리를 그대로 쓰는 편이 단순하다.

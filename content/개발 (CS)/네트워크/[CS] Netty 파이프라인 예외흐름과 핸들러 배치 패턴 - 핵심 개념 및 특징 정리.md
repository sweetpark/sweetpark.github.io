---
title: "Netty 파이프라인 예외흐름과 핸들러 배치 패턴"
tags: [학습, 개발-CS, 네트워크, Netty]
modified: 2026-09-05
---

# Netty 파이프라인 예외흐름과 핸들러 배치 패턴

> [!NOTE]
> Netty의 Inbound/Outbound 이벤트 전파 구조, 예외가 Head→Tail로만 흐르는 구조적 한계, 그리고 로깅/트레이스 핸들러를 어디에 배치해야 가독성과 예외 캡처를 모두 확보하는지 정리한 노트.
> 개인 미니프로젝트("Logging (최소 APM 구현)")에서 겹쳐 있던 3개 노트(Netty 파이프라인 이해 / Netty Handler 위치 / Netty Exception 전파)를 하나로 통합했다.
>
> 관련 노트: [(Java) Netty - 핵심 개념 및 특징 정리]([Java]%20Netty%20-%20핵심%20개념%20및%20특징%20정리.md) — Discard/Echo 서버 등 Netty 기본 구조

## ⚙️ 개념

### 1. 파이프라인 기본 원리 — Inbound/Outbound는 완전히 독립적

Netty는 **이벤트 방향 기반 전파 구조**다.

**🔵 Inbound (수신 이벤트)**: `Head → … → Tail`
- `addLast()`로 추가한 순서대로 실행
- `ChannelInboundHandler`만 실행됨
- Tail까지 내려가면 종료(자동 반전 없음)

**🔴 Outbound (송신 이벤트)**: `Tail → … → Head`
- `addLast()`의 역순으로 실행
- `ChannelOutboundHandler`만 실행됨
- 반드시 `write()` 또는 `flush()` 호출 시 시작됨

### 2. 핸들러 타입별 실행 여부

| 핸들러 | 상속 타입 | Inbound | Outbound |
| --- | --- | --- | --- |
| `ByteToMessageDecoder` | `ChannelInboundHandler` | ✅ | ❌ |
| `LoggingHandler`/`ChannelDuplexHandler` 계열 | `ChannelDuplexHandler` | ✅ | ✅ |
| `MessageEncoder` | `ChannelOutboundHandler` | ❌ | ✅ |
| 비즈니스 핸들러 | `ChannelInboundHandler` | ✅ | write() 호출 시 Outbound 시작점 |

- Inbound가 끝난다고 자동으로 Outbound를 타지 않는다 — Outbound는 반드시 `write()` 호출 시 시작된다.
- Inbound-only 핸들러(`ByteToMessageDecoder` 등)는 Outbound에서 자동 skip된다.

### 3. `ctx.write()` vs `channel.write()`

**`ctx.write()`** — 현재 핸들러 위치 기준으로 위쪽만 탐색, 중간 OutboundHandler를 건너뛸 수 있음
```
현재 위치(write() 호출 지점) → OutboundHandler 탐색 → Head
```

**`channel.write()`** — Tail부터 시작, 모든 OutboundHandler를 전부 탐색
```
Tail → OutboundHandler 전부 탐색 → Head
```

### 4. 예외 흐름의 구조적 한계 — 예외는 인바운드 이벤트다

> 예외 흐름 방향: **Head → Tail (앞 → 뒤)** 뿐이다.

로깅/트레이스 핸들러가 비즈니스 핸들러보다 **앞에만** 존재하면, 비즈니스 로직에서 발생한 예외는 그 핸들러의 `exceptionCaught()`로 도달하지 않는다.

| 항목 | 설명 |
| --- | --- |
| 예외 흐름 방향 | Head → Tail |
| 로깅 핸들러 위치가 앞쪽만 있을 경우 | 비즈니스 예외를 잡지 못함 |
| 결과 | 장애 로그 누락 가능 |

### 5. 해결 전략 — 동일 핸들러를 Head와 Tail에 각각 배치

목표: 모든 인바운드/아웃바운드 이벤트 캡처, 비즈니스 예외 완전 수집, 네트워크/인코딩 예외까지 로깅.

`@Sharable` 트레이스/로깅 핸들러는 하나의 인스턴스를 두 번 등록해도 안전하므로, Head와 Tail 양쪽에 동일 인스턴스를 배치한다.

```java
// 1. 핸들러 인스턴스 생성 (Bean 주입)
NettyTraceDuplexHandler loggingHandler = ...;

// 2. 파이프라인 구성
pipeline.addFirst("logging_head", loggingHandler); // 맨 앞
pipeline.addLast(new StringDecoder());
pipeline.addLast(new StringEncoder());
pipeline.addLast(new BusinessLogicHandler());     // 예외 발생 지점
pipeline.addLast("logging_tail", loggingHandler); // 맨 뒤 (예외 캡처)
```

역할 분담:

| 위치 | 주요 역할 |
| --- | --- |
| `logging_head` | TraceId 발급, 요청 바디 수집 시작, 최종 응답 로깅, 컨텍스트 정리 |
| `logging_tail` | 비즈니스 예외 캡처, `exceptionCaught` 처리 |

**인바운드(비즈니스 로직) 예외**: `BusinessLogicHandler` 예외 발생 → 다음 핸들러로 전달 → `logging_tail.exceptionCaught()` 실행 → 에러 정보 저장 → 로깅. **Tail에 배치하지 않으면 절대 잡을 수 없다.**

**아웃바운드(전송/인코딩) 예외**: `write()` 도중 예외(인코딩 실패, 소켓 단절) → `ChannelPromise` 리스너가 실패 감지 → 리스너에서 로깅 호출 + `fireExceptionCaught()` 전파 → `logging_tail`에서도 한 번 더 감지 가능(이중 감지 구조).

**중복 방지 안전장치**
- `traceId`는 사용 후 즉시 소모(null 처리) → Head/Tail 중 먼저 도착한 이벤트만 로그 출력(정확히 1회)
- `System.identityHashCode(msg)`로 동일 메시지 객체는 1회만 누적(요청/응답 바디 중복 저장 방지)
- 최초 요청 진입 시 결정한 샘플링 정책(`forceTrace`)을 채널 Attribute에 저장해 파이프라인 전체에서 일관 유지

### 6. 텍스트+바이너리 혼합 프로토콜에서의 배치 — "샌드위치 전략"

`bcdDateEncode()`(BCD 16진수 날짜), Length/Sequence(시프트 연산 삽입), STX/ETX 제어문자, CRC 등이 섞인 프로토콜은 `ByteBuf`를 그대로 로깅하면 깨진 문자로 출력된다. 가독성은 **Decoder 뒤 / Encoder 앞**에 로깅 핸들러를 둘 때 가장 좋다(DTO 상태이므로).

```java
channel.pipeline().addLast("proxyDetector", new ProxyDetector());
channel.pipeline().addLast(new LoggingHandler(LogLevel.INFO));
channel.pipeline().addLast("decoder", new MessageDecoder());      // 1. ByteBuf → DTO

channel.pipeline().addLast("logging_head", nettyTraceDuplexHandler); // ⭐ 위치 A(가독성 최적)

channel.pipeline().addLast("encoder", new MessageEncoder());      // 2. DTO → ByteBuf
channel.pipeline().addLast("handler", new MessageHandler(appMapper)); // 3. 비즈니스 로직

channel.pipeline().addLast("logging_tail", nettyTraceDuplexHandler); // ⭐ 위치 B(예외 전용)
```

| 위치 | 목적 | 보는 데이터 |
| --- | --- | --- |
| 위치 A: Decoder 뒤 / Encoder 앞 | 가독성 확보 | DTO(JSON, `@ToString` 등 사람이 읽기 좋은 상태) |
| 위치 B: MessageHandler 뒤 | 비즈니스 예외 캡처 | 예외 발생 시 `[EXCEPTION]` 마커로 로깅 |

- 정상 응답 기록 위치: `MessageHandler`의 `writeAndFlush()` 응답은 Encoder 앞의 `logging_head`에서 DTO 상태로 로깅된다. `logging_tail`은 비즈니스 예외/write 실패 감지용이지 정상 응답용이 아니다.
- 시간 측정 관점: 이 구조는 `코덱 처리 시간 + 비즈니스 로직 시간 = 서버 순수 처리 시간`을 측정하는 것이지, 네트워크 전송 시간을 포함하지 않는다.
- 바이너리 원문 분석이 필요하면 `safeToString()`을 Hex Dump로 개선한다.

```java
private String safeToString(Object msg) {
    if (msg instanceof io.netty.buffer.ByteBuf buf) {
        return io.netty.buffer.ByteBufUtil.hexDump(buf);
    }
    return msg.toString();
}
```

### 7. Netty EventLoop 스레드 재사용과 MDC/ThreadLocal

- `initChannel()`에서 MDC를 세팅하면 ❌ — `channelRead()` 시점에 세팅하고, 처리 완료 후 반드시 `clear()`한다.
- Netty는 EventLoop 스레드를 재사용하므로, 정리하지 않으면 ThreadLocal 오염(다른 요청에 이전 값이 새는 문제)이 발생할 수 있다.

### 8. 왜 Decoder는 Outbound에서 실행되지 않는가

```java
ByteToMessageDecoder extends ChannelInboundHandlerAdapter
```

Inbound 전용 핸들러라 write/flush를 처리하는 메서드가 없으므로 Outbound 이벤트에서는 자동으로 skip된다.

## 🔁 핵심 요약

- Inbound는 위 → 아래, Outbound는 아래 → 위. 핸들러는 방향에 맞는 것만 실행됨.
- 예외는 인바운드 이벤트로만 전파되므로(Head → Tail), 로깅/트레이스 핸들러를 **Head와 Tail 양쪽**에 배치해야 예외 누락이 없다.
- 바이너리+텍스트 혼합 프로토콜에서는 Decoder 뒤 / Encoder 앞이 가독성 최적 지점이다.
- `ctx.write`와 `channel.write`는 탐색 시작 위치가 다르다.
- Netty는 "왕복 구조"가 아니라 "이벤트 방향 + 핸들러 타입 기반 선택적 전파 구조"다.

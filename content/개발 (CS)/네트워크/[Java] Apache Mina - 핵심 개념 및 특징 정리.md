---
title: "Apache Mina"
tags: [학습, 개발-CS, 네트워크, Apache-Mina]
created: 2026-02-04
modified: 2026-09-05
---

# Apache Mina

> [!NOTE]
> Apache Mina 필터 체인 구조 및 주요 Filter 정리.

## 🖥️ 참고
- Apache Mina guide: [https://mina.apache.org/mina-project/developer-guide.html](https://mina.apache.org/mina-project/developer-guide.html)
- IoHandlerAdapter repo: [https://nightlies.apache.org/mina/mina/2.1.7/apidocs/org/apache/mina/core/service/IoHandlerAdapter.html](https://nightlies.apache.org/mina/mina/2.1.7/apidocs/org/apache/mina/core/service/IoHandlerAdapter.html)

## 📌 개념

### Filter 종류

| Filter | class | Description |
| --- | --- | --- |
| Blacklist | [BlacklistFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/firewall/BlacklistFilter.html#BlacklistFilter) | Blocks connections from blacklisted remote addresses |
| Buffered Write | [BufferedWriteFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/buffer/BufferedWriteFilter.html#BufferedWriteFilter) | Buffers outgoing requests like the BufferedOutputStream does |
| Compression | [CompressionFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/compression/CompressionFilter.html#CompressionFilter) |  |
| ConnectionThrottle | [ConnectionThrottleFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/firewall/ConnectionThrottleFilter.html#ConnectionThrottleFilter) |  |
| ErrorGenerating | [ErrorGeneratingFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/errorgenerating/ErrorGeneratingFilter.html#ErrorGeneratingFilter) |  |
| Executor | [ExecutorFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/executor/ExecutorFilter.html#ExecutorFilter) |  |
| FileRegionWrite | [FileRegionWriteFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/stream/FileRegionWriteFilter.html) |  |
| KeepAlive | [KeepAliveFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/keepalive/KeepAliveFilter.html) |  |
| Logging | [LoggingFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/logging/LoggingFilter.html) | Logs event messages, like MessageReceived, MessageSent, SessionOpened, … |
| MDC Injection | [MdcInjectionFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/logging/MdcInjectionFilter.html) | Inject key IoSession properties into the MDC |
| Noop | [NoopFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/util/NoopFilter.html) | A filter that does nothing. Useful for tests. |
| Profiler | [ProfilerTimerFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/statistic/ProfilerTimerFilter.html) | Profile event messages, like MessageReceived, MessageSent, SessionOpened, … |
| ProtocolCodec | [ProtocolCodecFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/codec/ProtocolCodecFilter.html) | A filter in charge of encoding and decoding messages |
| Proxy | [ProxyFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/proxy/filter/ProxyFilter.html) |  |
| Reference counting | [ReferenceCountingFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/util/ReferenceCountingFilter.html) | Keeps track of the number of usages of this filter |
| SessionAttributeInitializing | [SessionAttributeInitializingFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/util/SessionAttributeInitializingFilter.html) |  |
| StreamWrite | [StreamWriteFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/stream/StreamWriteFilter.html) |  |
| SslFilter | [SslFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/ssl/SslFilter.html) |  |
| WriteRequest | [WriteRequestFilter](https://nightlies.apache.org/mina/mina/2.0.22/xref/org/apache/mina/filter/util/WriteRequestFilter.html) |  |

- LoggingFilter: 모든 이벤트와 요청을 기록
- ProtocolCodecFilter: 들어오는 ByteBuffer 메시지를 POJO로 변환하고, 그 반대의 경우도 마찬가지
- CompressionFilter: 모든 데이터를 압축
- SSLFilter: SSL - TLS - StartTls 지원을 추가

```jsx
// filterChain에 넣는방법
NioSocketAccpetor acceptor = new NioSocketAcceptor();

//getFilterChain()을 이용하여, ProtocolCodecFilter 추가
acceptor.getFilterChain().addLast("codec", new protocolCodecFilter());
```

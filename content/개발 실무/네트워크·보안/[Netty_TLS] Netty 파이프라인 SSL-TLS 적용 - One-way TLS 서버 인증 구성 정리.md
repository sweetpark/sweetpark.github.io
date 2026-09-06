---
title: "[Netty_TLS] Netty 파이프라인 SSL-TLS 적용"
tags: [학습, 개발실무, Netty, TLS]
modified: 2026-09-05
---

# [Netty_TLS] Netty 파이프라인 SSL-TLS 적용

> [!NOTE]
> 평문 TCP 소켓 통신을 서버 인증서 기반 TLS로 암호화 전환할 때의 표준 절차(One-way TLS) 정리.

> [!NOTE] 실행 환경
> 이 노트 자체에는 코드가 없어(절차/설계 정리 중심) 버전을 특정할 직접적 근거는 없습니다. 연관 노트인 [Java] 04(SslContextBuilder, netty-tcnative-boringssl-static 사용)로 미루어 **Netty 4.1.x 계열**로 추정되며, JDK 버전은 명시되어 있지 않습니다.

## 📌 개념

- **One-way TLS(서버 인증만)**: 클라이언트가 서버 인증서를 검증하지만, 서버는 클라이언트 인증서를 요구하지 않는 방식(`ClientAuth.NONE`). 상호인증(mTLS)보다 구축이 간단하고, 대부분의 "구간 암호화" 요구사항(전자금융감독규정 등)은 이 수준으로 충족된다.
- Netty에서는 파이프라인 **최상단**에 `SslHandler`를 배선하면, 그 뒤에 오는 디코더/로깅/비즈니스 핸들러는 평문 바이트를 다루는 것처럼 그대로 동작한다 — TLS 복호화가 먼저 끝난 채로 전달되기 때문.

### 적용 절차

```
1. 서버 키 쌍 생성 (keytool -genkeypair, RSA 3072bit 권장, PKCS12 포맷)
2. 공개 인증서 추출 (keytool -exportcert → xxx.crt)
3. SHA-256 지문(fingerprint) 확인 → 별도 채널(전화/메신저 등)로 클라이언트팀에 통보
4. SslContext 생성 (keystore 로드, protocols("TLSv1.2") 고정, ClientAuth.NONE)
5. ChannelInitializer에서 파이프라인 맨 앞에 SslHandler 배선
6. 클라이언트가 인증서를 신뢰 저장소에 등록 → 이후 TLS 핸드셰이크 자동 수행
```

### SAN(Subject Alternative Name) 주의

- 최신 TLS 클라이언트(.NET `SslStream` 등)는 인증서의 **CN이 아니라 SAN 기준**으로 호스트를 검증한다.
- 발급 시 SAN에 클라이언트가 실제로 접속하는 IP/도메인을 정확히 넣어야 `RemoteCertificateNameMismatch` 같은 검증 실패를 피할 수 있다.

## 📌 설계 팁

| 항목 | 내용 |
| --- | --- |
| 적용 범위를 좁게 | 여러 포트를 운영 중이면 외부 클라이언트가 붙는 포트에만 TLS를 적용하고, 내부 전용 포트는 제외해도 됨(불필요한 변경 최소화) |
| 예외 처리 분리 | 핸드셰이크 실패(SSLException)는 기존 애플리케이션 프로토콜의 에러 응답 로직을 타지 않도록 별도 처리 — 비정상 핸드셰이크 상대에게 프로토콜 응답을 보내지 않기 위함 |
| 무중단 갱신은 별도 과제 | Netty는 보통 구동 시 keystore를 1회만 로드(fail-fast) — 인증서 갱신 시 재기동이 필요하다는 제약을 감수할지, SslContext 핫리로드를 구현할지는 트래픽 규모에 따라 결정(소규모면 재기동으로 충분, YAGNI) |
| 확장 여지 설계 | 처음부터 mTLS로 만들 필요는 없다. truststore 로딩 + `ClientAuth.REQUIRE`만 추가하면 되는 구조로 짜두면, 이후 상호인증이 필요해져도 쉽게 확장 가능 |

## 관련 문서

- [(학습/프레임워크/Netty) [Java] 04. Netty 소켓 파이프라인 SSL-TLS 적용과 mTLS 상호 인증 (SslHandler, KeyStore, SslContext)](../../프레임워크/Netty/[Java]%2004.%20Netty%20소켓%20파이프라인%20SSL-TLS%20적용과%20mTLS%20상호%20인증%20(SslHandler,%20KeyStore,%20SslContext).md) — SslContextFactory 코드 구현과 mTLS(ClientAuth.REQUIRE) 확장까지 다루는 심화 노트
- [(보안) 파일 무결성 전자서명 검증 - RSA 개인키 서명과 공개키 검증(사이드카 방식) 정리](./[보안]%20파일%20무결성%20전자서명%20검증%20-%20RSA%20개인키%20서명과%20공개키%20검증(사이드카%20방식)%20정리.md) — "키 발급 시 SAN 불필요" 항목에서 이 TLS 서버 인증서(SAN 필요) 발급 절차와 대비되는 자매 노트

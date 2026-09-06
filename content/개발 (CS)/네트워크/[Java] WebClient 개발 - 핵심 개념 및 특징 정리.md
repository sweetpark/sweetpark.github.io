---
title: "WebClient 개발 - Costel Daelim 버전"
tags: [학습, 개발-CS, 네트워크, SSL, WebSocket, 디자인패턴]
modified: 2026-09-05
---

# WebClient 개발 - Costel Daelim 버전

> [!NOTE]
> Costel/Daelim 버전 WebClient(WebSocket 기반) 개발 정리 — SSL Handshake, netty 비동기 처리, 디자인패턴 적용, AES256 암호화 포함.

## 🖥️ 시스템/환경
- Web Socket 사용

> [!NOTE]
> ssl 인증서 및 handshake 확인
>
> ```java
> openssl s_client -connect <파트너사-서버-IP>:<포트> -tls1_2 -showcerts
> ```

## 📌 개념

### SSL HandShake
- 비대칭키 기반 암호화

> [!NOTE]
> 대칭키 알고리즘
>
> - 한개의 키를 이용하여 암호화/복호화 진행

> [!NOTE]
> 비대칭키 알고리즘 (공개키/개인키)
>
> - 공개키를 이용하여 암호화 진행 → 개인키를 이용하여 복호화 진행
>     - 공개키는 말그대로, 외부에 공개하는 키 (클라이언트가 가지고 있음)
>     - 클라이언트는 해당 공개키를 기반으로 암호화 진행 (서버는 개인키를 기반으로 복호화 진행)
> - 반대로, 개인키를 이용하여 암호화 진행 → 공개키를 이용하여 복호화 가능
>     - 인증기관 발급시 사용

### SSL HandShake 과정

1. TCP Handshake 과정
    - 클라이언트 요청 (SYN)
    - 사이트 응답 (SYN / ACK)
    - 클라이언트 응답 (ACK)
2. SSL HandShake 과정

    > [!NOTE]
    > 사이트 인증서 발급 (인증기관 CA)
    >
    > - 사이트는 비대칭키 발급 (공개키/개인키)
    > - 사이트 → ( 공개키 + 사이트정보 ) → 인증기관 전달
    > - 인증기관은 "개인키로 암호화"하여 인증서 발급
    > - 인증기관 → 인증서 → 사이트 전달

    - 클라이언트 → 사이트 요청
    - 사이트 → 사이트 인증서 → 클라이언트
    - 클라이언트 (사이트 인증서 분석)

    > [!NOTE]
    > 클라이언트 분석
    >
    > - 인증기관 공개키 사용→ 사이트인증서 복호화 → 사이트 공개키 획득
    > - 클라이언트 대칭키 발급
    > - 대칭키 → 사이트 공개키로 암호화
    > - 사이트로 전송

    - 사이트 → 개인키를 이용하여 복호화를 하고, 사용자 대칭키 획득
    - 대칭키를 이용하여 세션 유지

> [!NOTE]
> 참고) 인증기관이 개인키로 암호화하는 이유
>
> - 인증서의 경우는 인증기관이 발급해줬다는 증거만 있으면됨
> - 따라서, 개인키를 이용하여 암호화하고 공개키로 복호화할 수 있게해야함
>     - 공개키는 클라이언트가 가질 수 있으므로, 인증기관이 발급해준거라는 것을 확인할 수 있음

### SSL Context
- netty 와 java 등등 ssl context가 갈림

[Java Platform SE 8](https://docs.oracle.com/javase/8/docs/api///?javax/net/ssl/SSLContext.html)

### SAN

```java
subject=C = KR, ST = Seoul, L = Seoul, O = <조직명>, OU = complex, CN = complex.server
issuer=C = KR, ST = Seoul, L = Seoul, O = <조직명>, OU = complex, CN = complex

C (Country)	: 국가 코드 (KR = 대한민국 🇰🇷)
ST (State or Province)	: 주 또는 도 (서울이면 Seoul)
L (Locality)	: 도시 또는 지역 (Seoul = 서울)
O (Organization) :	기관 또는 회사
OU (Organizational Unit) :	조직의 부서 또는 인증서 용도 (complex = 부서 또는 서비스명)
CN (Common Name) :	인증서의 대표 이름 (complex.server = 서버 도메인 또는 이름)

```

- subject: ssl 인증서 사용자
- issuer: ssl 인증서 발급자

> [!NOTE]
> - ✅ CN 필드는 접속하려는 도메인과 일치해야 함!
> - ✅ issuer가 공인 CA가 아니라면, 추가 설정 필요 (예: Netty에서 `trustManager()` 설정)
> - ✅ 자체 서명된 인증서라면, 클라이언트에서 수동으로 신뢰 추가해야 함

### SSL 인증 우회
- SSL 적용 안하는 방법

```java
//SSL, 인증서 없이 설정
sslCtx = SslContextBuilder.forClient().trustManager(InsecureTrustManagerFactory.INSTANCE).build();

```

- netty 비동기
    - netty 비동기이므로, 요청을 하고 다른 작업을 하게됨(중간에 handshake에서 걸릴 수 있음 → 동기화 진행)
    - `SimpleChannelInboundHandler`를 이용하여 `WebSocketClientHandler` 생성

    ```java
    // channeRead0
    -> 핸드셰이크 완료되지 않은 것들 확인
    if(!handshaker.isHandshakeComplete()){
        handshaker.finishHandshake(ch, (FullHttpResponse)msg ); // 핸드셰이크 종료
        handshakeFuture.setSuccess(); // 핸드셰이크 성공
        System.out.println("WebSocket Handshake 성공!");
        return;
    }
            //...
    // channelActive
    - 채녈 연결되있는 상태
    // handlerAdded
    - channelHandlerContext.newPromise (완료 알람 대기 -> 동기화)
    ```

- 스레드에서 동기화를 걸경우
    - 멀티스레드 환경이므로, 해당 스레드만 대기에 걸리고, 나머지 스레드들은 정상 동작을 수행한다.

### Command 처리 — 디자인패턴 적용
- 전략패턴 & 팩토리패턴

**전략패턴**

> [!NOTE]
> 전략패턴은 런타임중에 알고리즘 전략을 선택하여 객체 동작을 실시간으로 바뀌도록 할 수 있게하는 전략(행동계획이라고도 불림)

- 인터페이스와 구현체들로 나뉘어서 추상화를 진행
- 인터페이스를 통한 구현체 설정

```java
//추상화
public interface ServerMessageHandler {
    void handle();
}

@Slf4j
public class LoginHandler implements ServerMessageHandler {
    @Override
    public void handle() {
				//body
    }
}

@Slf4j
public class TimeHandler implements ServerMessageHandler {
    @Override
    public void handle() {
	        //body
    }
}

//실행
public static void main(String[] args){

		BufferedReader bf = new BufferedReader(new InputStreamReader(System.in));
		String command = bf.readLine();

		ServerMessageHandler handler;

		if ("login".equalsIgnoreCase(command)) {
		    handler = new LoginHandler();
		} else if ("time".equalsIgnoreCase(command)) {
		    handler = new TimeHandler();
		} else {
		    System.out.println("알 수 없는 명령어입니다.");
		    return;
		}

}
```

**팩토리패턴**

> [!NOTE]
> 객체 생성 책임을 맡는 클래스(동작행위x, 동작행위를 위한 객체 생성)
>
> - 객체 생성을 위한 클래스이므로, 추상화된 인터페이스를 활용

```java
public interface ServerMessageHandler {
    void handle();
}

@Slf4j
public class LoginHandler implements ServerMessageHandler {
    @Override
    public void handle() {
				//body
    }
}

@Slf4j
public class TimeHandler implements ServerMessageHandler {
    @Override
    public void handle(l) {
	        //body
    }
}

public class ServerMessageHandlerFactory{

	private final static Map<String, ServerMessageHandler> handlers = new HashMap<>();

	static{
			handlers.put("login", new LoginHandler());
			handlers.put("time", new TimeHandler());
	}

	public static ServerMessageHandler getHandler(String command){
	    return handlers.getOrDefault(command, new ServerMessageHandler(){
				@Override
				public void handle(){
					System.out.println("해당 command 없음");
				}
	    });
	}

	public static void main(String[] args){

		BufferedReader bf = new BufferedReader(new InputStreamReader(System.in));
		String command = bf.readLine();

		ServerMessageHandler handler = ServerMessageHandlerFactory.getHandler(command);
		handler.handle();

}
```

### 암호화 (AES 256)

> [!NOTE]
> AES256
>
> - 대칭키 알고리즘 (서버와 클라이언트가 서로 키값을 공유해야함)
> - 256비트 (키의 길이 = 32바이트 = 영어/숫자 32자)

> [!NOTE]
> AES256의 필수요소
>
> - Secret Key : 암호화/복호화시 사용되는 키 (공유하는 키)
> - IV : 초기화 벡터, 암호화 작업에서 첫 번째 블록 암호화 전에 사용되는 초기화 벡터 (16바이트)
> - Cipher Mode (EBC/CBC ..): 암호화 모드 (블록 결합 방식 지정)
> - Padding Mode (PKC55, PKCS7 ..) : 부족한 바이트를 채우는 패딩 방식

```java
Cipher c = Cipher.getInstance("AES/CBC/PKCS5Padding");

c.init(Cipher.ENCRYPT_MODE,
        new SecretKeySpec(privateKey.getBytes(StandardCharsets.UTF_8), "AES"),
        new IvParameterSpec(ivSeed.getBytes(StandardCharsets.UTF_8))
);

byte[] encrypted = c.doFinal(apiKey.getBytes(StandardCharsets.UTF_8));
```

- Cipher: 암호화 도구
    - `init()`: 암호화 키값 등록
    - `doFinal`: 암호화 적용(byte[] 리턴)
- SecretKeySpec: 키값 암호화 모드에 따른 key 등록
- IvParameterSpec: IV값 적용

> [!NOTE]
> 일반적인 사용) AES256 + BASE64 인코딩 후 전달

```java
// JSON으로 값을 보낼시에, byte[] 배열은 오류날 확률이 크므로, BASE64로 ASCII로 인코딩 후 전달
Base64.getEncoder.encodeToString(encrypted);
```

### 이벤트 처리
- DB 이벤트: RECHARGE 테이블 변화 alert

## 📌 비고

> [!NOTE]
> DC : 급속
> AC : 완속 (딱히 지정되어있지 않은거는 완속으로 묶으면 됨)

---
title: "Netty"
tags: [학습, 개발-CS, 네트워크, Netty]
created: 2026-02-04
modified: 2026-09-05
---

# Netty

> [!NOTE]
> Netty 프레임워크 기본 구조(Discard/Echo 서버) 및 특징 정리.
> 실무(충전기 EV 서버)에서 이관.

## 🖥️ 참고
- [Netty.docs: User guide for 4.x](https://netty.io/wiki/user-guide-for-4.x.html)

## 📌 개념

### Netty 프레임워크

**Discard Server**
- `ChannelInboundHandlerAdapter` → 데이터 수신
    - `channelRead()` 읽는 메서드(오버라이딩)
- Server 구조는 java `socket()`과 동일(추가적으로, Netty에 대한 설정값들만 추가됨)

```java
public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(); // (1)
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap(); // (2)
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class) // (3)
             .childHandler(new ChannelInitializer<SocketChannel>() { // (4)
                 @Override
                 public void initChannel(SocketChannel ch) throws Exception {
                     ch.pipeline().addLast(new DiscardServerHandler());
                 }
             })
             .option(ChannelOption.SO_BACKLOG, 128)          // (5)
             .childOption(ChannelOption.SO_KEEPALIVE, true); // (6)

            // Bind and start to accept incoming connections. -> accept()
            ChannelFuture f = b.bind(port).sync(); // (7)

            // Wait until the server socket is closed.
            // In this example, this does not happen, but you can do that to gracefully
            // shut down your server.
            f.channel().closeFuture().sync();
        } finally {
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }

```

**response가 있는 echo 서버**
- 실제적으로 `ChannelOutboundHandlerAdapter`가 응답을 보낼 때 사용하게 되는데, 현재 이 코드도 응답을 보낼 때 사용되는 코드

> [!NOTE]
> - ChannelInboundHandlerAdapter면 읽을 때 사용하는거 아닌가?
>     - 특수한 경우로, recv받자마자 바로 send할때에, 사용 가능
>     - channelActive가 요청받자마자 바로 응답 보낼때 사용

```java
public class TimeServerHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void channelActive(final ChannelHandlerContext ctx) { // (1)
        final ByteBuf time = ctx.alloc().buffer(4); // (2)
        time.writeInt((int) (System.currentTimeMillis() / 1000L + 2208988800L));

        final ChannelFuture f = ctx.writeAndFlush(time); // (3)
        f.addListener(new ChannelFutureListener() {
            @Override
            public void operationComplete(ChannelFuture future) {
                assert f == future;
                ctx.close();
            }
        }); // (4)
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### Netty 특징
- netty는 바이트 큐를 이용(기본 byte 단위로 통신 → channel)
- 단위: `ByteBuf`

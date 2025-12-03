---
date: 2020-04-03
title: websocket
shortTitle: websocket相关的说明
description: websocket相关的说明
tag:
  - websocket
  - 原理
category: 网络
banner: http://image.nikolazhang.top/wallhaven-nrwq11.jpg

author: nikola
icon: note

isOriginal: false
sticky: false
timeline: true
article: true
star: false

---

> web通信过程通常是浏览器发出请求, 服务器对此进行响应. 但对于实时要求高、海量并发的应用来说显得捉襟见肘. 基于web的实时通信一般采用轮询方案. 但会产生很多无效请求, 浪费带宽, 且效率低下.

原文请查看[WebSocket 原理说明](https://cloud.tencent.com/document/product/214/4150)

## WebSocket 机制

WebSocket是HTML5下一种新的协议。它实现了浏览器与服务器`全双工通信`，能更好的节省服务器资源和带宽并达到实时通讯的目的。

![2020-04-04-17-16-06](http://dewy-blog.nikolazh.eu.org/2020-04-04-17-16-06.png)

### 对比http

1. WebSocket是一种双向通信协议。在建立连接后，WebSocket服务器端和客户端都能主动发送数据给对方或向对方接收数据，就像Socket一样；
2. WebSocket需要像TCP一样，先建立连接，连接成功后才能相互通信。
3. http请求每次都要重新建立连接. websocket建立连接之后, 不需要重新建立连接. 在海量并发及客户端与服务器交互负载流量大的情况下，极大的节省了网络带宽资源的消耗.

### 对比http长连接

1. 工作方式: HTTP长连接基于HTTP，是传统的客户端对服务器发起请求的模式。 websocket则是真正的全双工, 建立连接后客户端与服务器端是完全平等的，可以互相主动请求。
2. 信息交换效率: HTTP长连接中，每次数据交换除了真正的数据部分外，服务器和客户端还要大量交换HTTP header，信息交换效率很低。Websocket协议通过第一个request建立了TCP连接之后，之后交换的数据都不需要发送 HTTP header就能交换数据，

### 请求报文

#### 客户端

在客户端通过new WebSocket方式创建客户端对象, 之后请求服务端websocket url `ws://yourdomain:port/path`, 发送数据格式:

```
GET /webfin/websocket/ HTTP/1.1
Host: localhost
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: xqBt3ImNzJbYqRINxEFlkg==
Origin: http://localhost:8080
Sec-WebSocket-Version: 13
```

说明: 客户端发起的WebSocket连接报文类似传统HTTP报文，

1. Upgrade：websocket参数值表明这是WebSocket类型请求.
2. Sec-WebSocket-Key是WebSocket客户端发送的一个 base64编码的密文，要求服务端必须返回一个对应加密的Sec-WebSocket-Accept应答，否则客户端会抛出Error during WebSocket handshake错误，并关闭连接。

#### 服务端

服务端收到报文后返回的数据格式类似：

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: K7DJLdLooIwIG/MOpvWFB3y3FE8=
```

说明:

1. Sec-WebSocket-Accept的值是服务端采用与客户端一致的密钥计算出来后返回客户端的，
2. HTTP/1.1 101 Switching Protocols表示服务端接受WebSocket协议的客户端连接，经过这样的请求-响应处理后，两端的WebSocket连接握手成功, 后续就可以进行TCP通讯了。

## 其他

一个使用WebSocket应用于视频的业务思路如下：

1. 使用心跳维护websocket链路，探测客户端端的网红/主播是否在线
2. 设置负载均衡7层的proxy_read_timeout默认为60s
3. 设置心跳为50s，即可长期保持Websocket不断开

---
title: 无法使用ip访问podman容器的问题
tag:
  - podman
category: 虚拟机
description: 解决无法使用ip访问podman容器的问题
date: 2025-12-10
author: nikola
icon: paw

isOriginal: true
sticky: false
timeline: true
article: true
star: false
---

## 环境配置

- podman desktop
- windows 11 (WSL2)

部署mysql服务器，配置已经设置bind-address为0.0.0.0，但是无法使用ip访问容器。
并且已经通过给远程用户进行授权，且`flush privileges`刷新权限。

服务启动正常，在主机上可以使用`127.0.0.1:3306`访问。但是使用ip地址访问容器，提示连接拒绝。

## 解决方法

```powershell
netsh interface portproxy add v4tov4 listenport=3306 listenaddress=0.0.0.0 connectport=3306 connectaddress=127.0.0.1
```

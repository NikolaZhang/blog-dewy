---
title: podman使用教程
tag:
  - linux
  - 容器
  - podman
category: linux
description: 详细介绍podman容器管理工具的安装、配置和使用方法
date: 2023-01-15
author: nikola
icon: paw

isOriginal: true
sticky: false
timeline: true
article: true
star: false
---


## 1. 简介

Podman是一个开源的容器管理工具，提供与Docker兼容的命令行界面，用于创建、运行和管理容器。Podman的主要特点是无守护进程（daemonless）架构，提高了安全性和资源利用率。与Docker不同，Podman不需要运行特权守护进程，支持rootless容器，允许普通用户在不需要root权限的情况下运行容器。

## 2. 架构原理

### 2.1 Podman架构

Podman采用无守护进程架构，直接与OCI（Open Container Initiative）运行时（如runc或crun）交互，避免了Docker的守护进程单点故障和安全风险。

### 2.2 核心组件

- **Podman CLI**: 命令行界面，提供与Docker兼容的命令
- **Libpod**: Podman的核心库，负责容器和Pod的管理
- **OCI Runtime**: 负责容器的实际运行（如runc、crun）
- **Container Storage**: 管理容器镜像和存储
- **Networking**: 管理容器网络

## 3. 安装配置

### 3.1 在不同Linux发行版上安装

#### 3.1.1 CentOS/RHEL 8+

```bash
sudo dnf install -y podman
```

#### 3.1.2 Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y podman
```

#### 3.1.3 Fedora

```bash
sudo dnf install -y podman
```

### 3.2 基本配置

Podman的配置文件位于`/etc/containers/`目录下，主要配置文件包括：

- `registries.conf`: 配置镜像仓库
- `storage.conf`: 配置存储后端
- `containers.conf`: 容器运行时配置

## 4. 基本使用

### 4.1 镜像管理

```bash
# 搜索镜像
podman search nginx

# 拉取镜像
podman pull nginx

# 列出本地镜像
podman images

# 删除镜像
podman rmi nginx
```

### 4.2 容器管理

```bash
# 运行容器
podman run -d -p 8080:80 --name mynginx nginx

# 列出运行中的容器
podman ps

# 列出所有容器
podman ps -a

# 停止容器
podman stop mynginx

# 启动容器
podman start mynginx

# 删除容器
podman rm mynginx
```

### 4.3 容器交互

```bash
# 进入容器
podman exec -it mynginx /bin/bash

# 查看容器日志
podman logs mynginx

# 查看容器资源使用情况
podman stats mynginx
```

## 5. 高级特性

### 5.1 Rootless容器

Podman支持rootless容器，允许普通用户在不需要root权限的情况下运行容器：

```bash
# 启用rootless容器
podman unshare --mount

# 以普通用户身份运行容器
podman run -d -p 8080:80 --name mynginx nginx
```

### 5.2 Pod管理

Podman支持Pod概念，允许将多个相关容器组织在一起：

```bash
# 创建Pod
podman pod create --name mypod -p 8080:80

# 在Pod中运行容器
podman run -d --pod mypod --name nginx nginx
podman run -d --pod mypod --name redis redis

# 列出Pod
podman pod ls
```

### 5.3 镜像构建

Podman支持使用Dockerfile构建镜像：

```bash
# 使用Dockerfile构建镜像
podman build -t myimage .

# 查看构建历史
podman history myimage
```

## 6. 与Docker的对比

| 特性 | Podman | Docker |
|------|--------|--------|
| 架构 | 无守护进程 | 有守护进程 |
| Rootless支持 | 原生支持 | 需要额外配置 |
| Pod支持 | 原生支持 | 需要Kubernetes |
| 命令兼容性 | 与Docker CLI兼容 | 标准Docker CLI |
| 安全性 | 更高（无特权守护进程） | 较低（需要特权守护进程） |

## 7. 常见问题及解决方案

### 7.1 Rootless容器网络问题

**问题**：Rootless容器无法访问外部网络

**解决方案**：

```bash
# 确保slirp4netns已安装
sudo dnf install -y slirp4netns

# 配置网络
podman network create mynet
podman run -d --network mynet nginx
```

### 7.2 权限问题

**问题**：普通用户无法拉取镜像或运行容器

**解决方案**：

```bash
# 将用户添加到docker组
sudo usermod -aG docker $USER

# 重新登录或刷新组权限
newgrp docker
```

## 8. 总结

Podman作为一款无守护进程的容器管理工具，提供了与Docker兼容的命令行界面，同时具有更高的安全性和资源利用率。通过本教程，您已经了解了Podman的基本概念、安装配置和使用方法，包括镜像管理、容器管理、rootless容器、Pod管理等高级特性。Podman的出现为容器管理提供了更多选择，特别是在安全性要求较高的环境中，Podman是一个值得考虑的替代方案。

---
isOriginal: true
title: 通过nps访问内网pc
date: 2021-06-25
icon: code
tag:
  - nps
  - 内网穿透
  - 远程
category: nps
description: nps搭建内网穿透
sticky: false
timeline: true
article: true
star: true
---

> 通过内网穿透我们可以在外网访问到内网设备，就好像内网设备拥有了公网ip一样。

## 环境

服务端使用阿里云ubuntu服务器，客户端就是本地的win10pc

## 服务端

### 安装服务端

1. 从github的[ehang-io/nps](https://github.com/ehang-io/nps/releases)中获取符合自己环境的发布包，这里我用的是[linux_amd64_server](https://github.com/ehang-io/nps/releases/download/v0.26.10/linux_amd64_server.tar.gz)
2. 解压，`tar -zxvf linux_amd64_server.tar.gz`
3. 在`linux_amd64_server`目录下我们可以看到解压的文件。
4. 需要注意的是直接修改此处的配置文件是无效的。运行时使用的配置文件目录为：`/etc/nps/conf/`。
5. 我的配置为：
  
  ```
  appname = nps
  #Boot mode(dev|pro)
  runmode = pro

  ##bridge
  ## 客户端与服务端连接方式kcp或tcp
  bridge_type=tcp
  ## 服务端客户端通信端口，也就是说客户端通过访问服务端的这个端口可以进行连接
  bridge_port=8024
  bridge_ip=0.0.0.0

  # Public password, which clients can use to connect to the server
  # After the connection, the server will be able to open relevant ports and parse related domain names according to its own configuration file.
  ## 客户端以配置文件模式启动时的密钥，设置为空表示关闭客户端配置文件连接模式
  public_vkey=123123


  # log level LevelEmergency->0  LevelAlert->1 LevelCritical->2 LevelError->3 LevelWarning->4 LevelNotice->5 LevelInformational->6 LevelDebug->7
  # 配置自己想要的日志级别以及日志文件目录
  log_level=7
  log_path=/home/nikola/app/nps-tool/nps.log

  # nps提供网页版的管理系统，此处为相关配置
  #web
  # 网址可以为ip或者域名
  web_host=xxx.xxxx.xxx
  # 登录nps的账号
  web_username=xxxx
  web_password=xxxx
  # 使用的端口 注意需要添加安全组
  web_port=8888
  web_ip=0.0.0.0
  ```
  
  将上面的配置替换到`nps.conf`文件中
6. 使用`nps start`命令启动服务

### 创建隧道和客户端

1. 访问我们配置的web页面, 并使用用户名和密码登录。  
    ![登录页面](https://tech-nikola.nikolazhang.top/tools/nps/nps-login.png)
2. 点击左侧客户端，之后点击新增按钮。按照下图进行配置。唯一验证密钥可以不填写，由系统生成。  
    ![配置信息](https://tech-nikola.nikolazhang.top/tools/nps/nps-client.png)
3. 保存之后，回到客户端列表页面，在刚才新增的客户端上点击隧道。
4. 按照下图配置隧道信息。客户端id为之前配置的客户端id可以在列表页面查看。服务端端口需要一个空闲端口。目标为本地的远程连接ip和端口（3389为默认的windows远程连接端口）。  
    ![隧道信息](https://tech-nikola.nikolazhang.top/tools/nps/nps-suidao.png)

## 客户端

### 安装客户端

从github的[ehang-io/nps](https://github.com/ehang-io/nps/releases)中获取符合自己的发布包，这里我用的是[windows_amd64_client](https://github.com/ehang-io/nps/releases/download/v0.26.10/windows_amd64_client.tar.gz)

解压该压缩包。并进入解压目录，可以看到一个`npc.exe`文件，和一个`conf`配置文件目录。

推荐你将当前目录添加到环境变量中去。（具体方法是打开控制面板->系统->环境变量->在path下添加该目录）这样我们就可以在全局使用npc命令。

回到我们服务端的web页面，查看客户端列表的信息。可以看到下图位置的命令行。（`npc -server=localhost:8024 -vkey=xxxxxxxx -type=tcp`）

将其复制变将localhost改成上面服务器的ip。执行命令可以看到连接成功的日志提示。

![success](https://tech-nikola.nikolazhang.top/tools/nps/nps-client-connect.png)

回到服务端的客户端列表页面，此时可以看到客户端已经在线了。

![client-online](https://tech-nikola.nikolazhang.top/tools/nps/nps-server-clients.png)
![suidao-online](https://tech-nikola.nikolazhang.top/tools/nps/nps-server-suidao.png)

## 使用远程连接访问

打开windows的远程连接功能。注意需要确保windows具有远程访问的功能，并且能正常使用，有些版本是被阉割的。（可以通过[修复工具](https://github.com/stascorp/rdpwrap/releases)解决）

![windows](https://tech-nikola.nikolazhang.top/tools/nps/nps-win-remote.png)

输入远程电脑的账号密码就可以访问了。



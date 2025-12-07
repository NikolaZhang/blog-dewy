---
isOriginal: true
title: jenkins部署相关
date: 2020-04-02
icon: cog
tag:
  - jenkins
  - 部署
  - webhook
  - 构建
category: jenkins
description: jenkins项目构建的一些步骤和问题处理

sticky: false
timeline: true
article: true
star: true
---

> 谈一谈jenkins部署的一些方法, 顺便把这几天踩的的坑简单的整理一下.

## 如何通过提交信息构建

通过webhook, 当提交代码到远程仓库后, 可以直接触发jenkins构建流程.

### gitee的webhook

在仓库中的setting中我们可以找到webhook选项
![2020-04-03-00-01-50](images/2020-04-03-00-01-50.png)

点击add.
url中需要填入jenkins路径
`http://<username>:<password>@<JENKINS_URL>/generic-webhook-trigger/invoke`
其中username和password为可以登录jenkins的用户账号密码.
JENKINS_URL为jenkins的访问路径. 当然你可以使用ip+端口的方式
上面的这个路径可以在jenkins项目配置中找到:
![2020-04-03-00-05-22](images/2020-04-03-00-05-22.png)
当你选择通过webhook触发构建的时候就可以找到这个路径.
之后根据需要选择触发的事件类型:
![2020-04-03-00-07-49](images/2020-04-03-00-07-49.png)

之后我们可以通过`Test`测试是否连接成功. 成功之后就可以进行jenkins端项目构建条件的配置.
以syscore模块的编译为例:
如下图所示我设置了两个变量一个是`repository`一个是`commits`, 这两个变量的值是通过`JSONPath`表达式从webhook请求体中获取构建的仓库以及提交信息中含有`build syscore`的数量. 之后通过`Optional filter`将这两个变量`$repository_$commits`, 进行正则匹配`^communicate_\[[1-9][0-9]*\]$`如果为`communicate`仓库且`build syscore`的数量大于0则触发构建.
![2020-04-03-00-10-29](images/2020-04-03-00-10-29.png)
![2020-04-03-00-10-49](images/2020-04-03-00-10-49.png)

所以针对不同类型的提交请求体可能是不同的, 因此需要根据实际情况进行配置.
之前我们在gitee仓库中对jenkins连接进行了测试, 我们可以在测试的请求信息中看到webhook请求体的详细情况.
![2020-04-03-00-19-04](images/2020-04-03-00-19-04.png)

## 构建之后

项目构建之后我们就需要将其发布.

注意构建成功之后项目的文件是放在jenkins的workspace目录下的. 这个目录默认位置为`/var/lib/jenkins/workspace`,
你可以在这个目录下找到构建成功的文件.

如果项目部署的位置和jenkins在同一台服务器上, 直接通过拷贝到对应的目录下就可以了. 否则就需要使用ssh进行文件传输. 你可以使用`scp`或者借助`Publish Over SSH`插件.

下面介绍一下这个插件如何使用.

安装插件之后你应该能看到下图中的红框内容:
![2020-04-03-00-26-45](images/2020-04-03-00-26-45.png)

![2020-04-03-00-28-46](images/2020-04-03-00-28-46.png)
首要你要选中一个你提前配置好的ssh server. 这个配置是在`Manage Jenkins`的`Config SYSTEM`中.
之后我们要配置传输的文件的路径, 注意这个路径是相对于当前构建模块来说的.
我使用的syscore模块的路径为`/var/lib/jenkins/workspace/commuicate/syscore/`, 注意这个路径末尾的syscore就是指的是这个构建模块的名字. 因此配置路径直接从这个路径下开始配置即可.
`Remove prefix`用来在远程创建文件时移除路径前缀.
`Remote directory` 这个路径的配置是相对于ssh server中的全局路径来说的.
你可以看下一节ssh server的介绍.
`Exec command` 这个就是你想要在远程服务器运行的命令. 一般我们用它来运行启动脚本. 不过你要提前在远程服务器添加启动脚本. 当然你可以尝试在此处编写启动脚本.

### 配置ssh server

找到`Publish over SSH`模块, 仿照下图进行配置:
![2020-04-03-00-32-27](images/2020-04-03-00-32-27.png)

`Passphrase`及ssh的密码, `Path to key`是你的私钥的路径. `Key`中的内容直接复制私钥中的信息粘贴即可.

`SSH Servers`的配置中hostname是远程服务器的地址, `username`是访问远程服务器的账号, `Remote Directory`是一个默认的全局路径.

## 前端构建和后端构建

前端构建和后端构建是不同的.

后端的构建我们创建item的时候使用的是`maven project`因此借助maven插件我们可以通过配置如下信息构建maven项目.
![2020-04-03-00-47-57](images/2020-04-03-00-47-57.png)
前端的构建也很简单, 可以直接添加一个构建脚本即可.
![2020-04-03-00-49-15](images/2020-04-03-00-49-15.png)

## 构建工作流

在一些情况下我们的构建是有先后顺序的, 比如我们修改了一个公共模块, 因此要优先构建该模块, 之后再构建其他模块. 这个可以通过设置构建触发器进行控制(webhook也是构建触发器的一种)

![2020-04-03-00-53-52](images/2020-04-03-00-53-52.png)

`Build after other projects are built` 中的`Projects to watch`中配置的就是优先构建的模块, 当这个`common`模块构建成功之后会触发当前模块的构建.

配置之后, 你可以在`common`模块的页面中看到`Downstream Projects`信息
![2020-04-03-00-55-39](images/2020-04-03-00-55-39.png)

## end

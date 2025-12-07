---
isOriginal: true
title: ElasticSearch[1]部署
tag:
  - ElasticSearch
  - 部署
category: ElasticSearch
description: elasticsearch 的使用部署篇
date: 2020-01-31
icon: search

sticky: false
timeline: true
article: true
star: false
---

> 开始一个新的系列谈谈关于elastic search的使用. 使用之前我们先谈一谈如何部署在服务器上部署一个elastic search应用.

## elasticsearch

### 安装

由于我之前win上有一个elasticsearch的安装包. 因此直接将其上传到到虚拟机对应的目录下.
![2020-01-30-19-22-09](http://dewy-blog.nikolazh.eu.org/2020-01-30-19-22-09.png)

之后执行`tar -zxvf elasticsearch-7.4.2-linux-x86_64.tar.gz`进行解压操作.

![2020-01-30-19-32-03](http://dewy-blog.nikolazh.eu.org/2020-01-30-19-32-03.png)

压缩包居然不完整??? 可能是没有下载完....
可以尝试使用wget从[镜像站](https://thans.cn/mirror/elasticsearch.html)获取镜像.

执行`wget https://elasticsearch.thans.cn/downloads/elasticsearch/elasticsearch-7.3.2-no-jdk-linux-x86_64.tar.gz`

![2020-01-30-19-42-15](http://dewy-blog.nikolazh.eu.org/2020-01-30-19-42-15.png)

重新执行`tar -zxvf elasticsearch-7.3.2-no-jdk-linux-x86_64.tar.gz`
![2020-01-30-19-43-48](http://dewy-blog.nikolazh.eu.org/2020-01-30-19-43-48.png)
解压成功.

### 配置java环境变量

将下面的内容复制到`/etc/profile`最后

```shell
# JAVA_HOME需要修改为你的路径, 不过jdk相同路径应该是相同的
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
export PATH=${JAVA_HOME}/bin:$PATH
```

执行`source profile`使修改生效`

### 启动及验证

![2020-01-31-09-46-18](http://dewy-blog.nikolazh.eu.org/2020-01-31-09-46-18.png)

首先jdk版本不匹配. 当然你可以忽略这个问题.
当然你也可以下载`openjdk-11-jdk`
重新配置环境变量, 执行`source /etc/profile`

![2020-01-31-09-57-29](http://dewy-blog.nikolazh.eu.org/2020-01-31-09-57-29.png)

另外我们需要切换到普通用户下进行启动.
![2020-01-31-10-11-25](http://dewy-blog.nikolazh.eu.org/2020-01-31-10-11-25.png)
出现这种情况直接对es目录777就完事了. `chmod -R 777 [安装目录]`

之后就可以正常启动:
![2020-01-31-12-05-12](http://dewy-blog.nikolazh.eu.org/2020-01-31-12-05-12.png)

访问接口, 但看到如下界面, es就安装成功了.
![2020-01-31-12-05-58](http://dewy-blog.nikolazh.eu.org/2020-01-31-12-05-58.png)

p.s.: 显式的启动不是很友好关闭终端, 应用就直接结束了. 可以使用`./elasticsearch -d`在后台启动

## elasticsearch-header

`elasticsearch-header`提供了一种图形化操作elasticsearch的方法.
部署方法见下:

### 安装elasticsearch-header[没有安装成功]

```shell
git clone git://github.com/mobz/elasticsearch-head.git
cd elasticsearch-head
npm install
npm run start
```

不知道为什么install很忙, 即使使用镜像也是很慢. 因此我就放弃安装这个了.

## kibana

kibana和elasticsearch-head都可以操作elasticsearch.

这里推荐一个镜像下载站`https://www.newbe.pro/tags/Mirrors/` 当然elasticsearch也可以在这里找到

获取kibana: `wget https://mirrors.huaweicloud.com/kibana/7.3.2/kibana-7.3.2-linux-x86_64.tar.gz`

安装很简单只需要将安装包解压即可. `tar -zxvf kibana-7.3.2-linux-x86_64.tar.gz`

### 启动

在bin目录下执行`./kibana --allow-root`

建议: `nohup ./kibana --allow-root &`

在浏览器中输入:`localhost:5601` 即可看到UI.

![2020-01-31-16-55-37](http://dewy-blog.nikolazh.eu.org/2020-01-31-16-55-37.png)

### 配置kibana

如果你需要自定义一些内容. 可以到 config目录下修改kibana.yml文件
![2020-01-31-17-01-39](http://dewy-blog.nikolazh.eu.org/2020-01-31-17-01-39.png)

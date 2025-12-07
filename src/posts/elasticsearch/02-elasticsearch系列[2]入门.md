---
isOriginal: true
title: ElasticSearch[2]入门篇-简介
tag:
  - ElasticSearch
  - 原理
category: ElasticSearch
description: 简单介绍一下elasticsearch的使用方法
date: 2020-02-01
icon: search

sticky: false
timeline: true
article: true
star: false
---

> 上一篇我们已经安装好了elasticsearch以及kibana. 这一篇简单介绍一下elasticsearch的相关知识.

## elasticsearch的特性

- 分布式的实时文件存储，每个字段都被索引并可被搜索
- 分布式的实时分析搜索引擎
- 可以扩展到上百台服务器，处理PB级结构化或非结构化数据

### 其他

- 面向文档, 所谓文档是一类信息的结合, 你可以理解为一个对象. 但是文档还会有除了对象本身之外的信息.
- 文档序列化使用json格式
- 基于http协议, 提供restful api进行通信

## 基本概念

### 结构

索引(indices): 多个类型的集合, 类似数据库中`库`的概念
类型(type): 所有文档的集合, 表示一类.类似`表`的概念
文档(document): 一条记录, 一个对象.类似`行`的概念.
字段(field): 对象中的具体属性. 类似`列`的概念.

### 倒排索引

使用传统数据库, 为了优化查询, 通常对条件中的列增加索引. 如mqsql通过建立b+树索引去获取主键索引, 之后读取数据.
但是elasticsearch使用倒排索引, 简单来说就是将文档中的内容作为索引, 根据索引去获取相应的文档.
比如, 下面的几句话:
A: 失败是成功之母.
B: 一次成功的背后是千百次的失败.
C: 丢你老母.

我们可以看到A,B中都包含`成功`,`失败`. A,C中都包含`母`.
因此建立倒排索引后可能会是这样的结果:

| 索引 | 文档 |
| ---- | ---- |
| 失败 | A,B  |
| 成功 | A,B  |
| 母   | A,C  |

因此当我们想搜索`成功`相关的内容时, 可以很快的找到对应的文档A,B.

## waiting

未完待续....
![2020-02-02-14-39-29](http://dewy-blog.nikolazh.eu.org/2020-02-02-14-39-29.png)

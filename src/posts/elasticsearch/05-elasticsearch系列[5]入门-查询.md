---
isOriginal: true
title: ElasticSearch[5]操作篇-简单的查询
tag:
  - ElasticSearch
  - es查询
category: ElasticSearch
description: 简单介绍一下elasticsearch的查询
date: 2020-02-03
icon: search

sticky: false
timeline: true
article: true
star: false
---

## 查询

1. 查询使用的是GET方式, 比如查询id为1的员工.

  ```json
  GET /megacorp/employee/1
  ```

  ![2020-02-01-13-45-39](http://dewy-blog.nikolazh.eu.org/2020-02-01-13-45-39.png)
2. 搜索全部

  ```json
  GET /megacorp/employee/_search
  ```

  ![2020-02-01-13-49-44](http://dewy-blog.nikolazh.eu.org/2020-02-01-13-49-44.png)

  响应内容的hits数组中包含了我们所有的三个文档。默认情况下搜索会返回前10个结果。
3. 根据字段值查询
  查询last_name包含Smith的员工. 此时仍然使用_search关键词进行查询, 但是需要在请求中添加参数q, 其值为一个键值对, 相当于sql中的条件.

  ```json
  GET /megacorp/employee/_search?q=last_name:Smith
  ```

  ![2020-02-01-13-53-46](http://dewy-blog.nikolazh.eu.org/2020-02-01-13-53-46.png)

  可以看到出现了两个匹配结果
4. 查询部分字段

  ```json
  GET /megacorp/employee/1?_source=first_name,last_name
  ```

  ![2020-02-01-20-02-12](http://dewy-blog.nikolazh.eu.org/2020-02-01-20-02-12.png)

  ```json
  GET /megacorp/employee/1/_source
  ```

  ![2020-02-01-16-57-09](http://dewy-blog.nikolazh.eu.org/2020-02-01-16-57-09.png)
5. 判断文档是否存在,而不关心内容
  将GET方法换成HEAD即可, 响应状态为200则存在, 404不存在

### DSL

以上使用的查询方法属于简单查询, DSL将查询条件放到请求体中, 以实现更复杂的查询方式. 其全称叫作Domain Specific Language. 它包含两种类型的语句.

叶查询语句: 主要适用于查询特定字段的特定值. 例如 match，term或 range查询.

复合查询语句:包含其他的叶查询和复合查询.(下一篇着重接介绍)

查询语句根据其所在的查询上下文和过滤上下文的不同起到不同的作用.

#### 查询上下文和过滤上下文

##### 查询上下文

在这种情况下, 查询语句的关注点是文档对查询语句条件的匹配度. 而这个匹配度通过查询结果的`_score`(相关性得分)可以看出.

只要将查询子句传递给query参数(比如Search API 中的query参数), 查询上下文就会生效

##### 过滤上下文

此时, 查询的关注点是文档是否匹配条件. 结果只能是是或者否. 频繁使用的过滤器会被缓存从而提高性能.

只要将查询子句传递给filter(如 bool 查询中的 filter 或 must not, constant_score 查询中的 filter 或aggregation中的filter), 过滤上下文就会生效.

##### 举例

```json
GET /megacorp/_search
{
  "filter": {
    "bool": {
      "must": [
        {
          "match": {
            "last_name": "Smith"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "age": { "gt": 30 }
          }
        }
      ]
    }
  }
}
```

第一个`query`表示这是一个查询上下文.
`bool`中的`must`用在查询上下文中去匹配文档.
`filter`参数表示其下为过滤上下文, 用来过滤出符合条件的文档.

### 全文搜索

使用`match`搜索包含词句的文档, 并返回相关分数

```json
GET /megacorp/employee/_search
{
    "query" : {
        "match" : {
            "about" : "rock climbing"
        }
    }
}
```

![2020-02-01-14-32-03](http://dewy-blog.nikolazh.eu.org/2020-02-01-14-32-03.png)

`hits`中的`_score`字段表示结果的相关程度.

### 短语搜索

返回同时包含`rock`和`climbing`的文档, 当使用`match`进行全文搜索时, 返回结果为所有匹配到的结果.

```json
GET /megacorp/employee/_search
{
    "query" : {
        "match_phrase" : {
            "about" : "rock climbing"
        }
    }
}
```

### 高亮查询

将查询结果单独显示出来并通过`<em>`标签显示匹配结果

```json
GET /megacorp/employee/_search
{
    "query" : {
        "match_phrase" : {
            "about" : "rock climbing"
        }
    },
    "highlight": {
        "fields" : {
            "about" : {}
        }
    }
}
```

![2020-02-01-15-13-49](http://dewy-blog.nikolazh.eu.org/2020-02-01-15-13-49.png)

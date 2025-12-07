---
isOriginal: true
title: ElasticSearch[3]操作篇-插入
tag:
  - ElasticSearch
  - es数据插入
  - es映射
category: ElasticSearch
description: es文档的插入以及映射的介绍
date: 2020-02-02
icon: search

sticky: false
timeline: true
article: true
star: false
---

## 基本操作

下面的操作基本上是按照[官网](https://www.elastic.co/guide/en/elasticsearch/reference/current/elasticsearch-intro.html)和[权威指南](https://www.elastic.co/guide/cn/elasticsearch/guide/current/index.html)上搞的. 你可以点击连接跳转查看. 但是需要注意权威指南的版本已经有些旧了. 主要还是按照官网英文7.5版本介绍(虽然英语不是很好, 勉强能够理解)

### 插入

通过做一个公司和员工的案例来熟悉基本的一些操作.
向公司(megacorp)中添加id为1的员工(employee)

```json
PUT /megacorp/employee/1
{
    "first_name" : "John",
    "last_name" :  "Smith",
    "age" :        25,
    "about" :      "I love to go rock climbing",
    "interests": [ "sports", "music" ]
}
```

此处的`megacorp`就是一个索引. `employee`为一个类型.
body中的json就是一个当前员工信息的文档. 其中的每一个属性即一个字段.

将上面的命令复制, 粘贴到kibana, 执行:
![2020-02-01-13-24-00](http://dewy-blog.nikolazh.eu.org/2020-02-01-13-24-00.png)

之后插入更多数据.

```json
PUT /megacorp/employee/2
{
    "first_name" :  "Jane",
    "last_name" :   "Smith",
    "age" :         32,
    "about" :       "I like to collect rock albums",
    "interests":  [ "music" ]
}

PUT /megacorp/employee/3
{
    "first_name" :  "Douglas",
    "last_name" :   "Fir",
    "age" :         35,
    "about":        "I like to build cabinets",
    "interests":  [ "forestry" ]
}
```

执行查询命令:

```json
GET /megacorp/_search
```

![2020-02-01-13-27-30](http://dewy-blog.nikolazh.eu.org/2020-02-01-13-27-30.png)

#### why PUT

为什么上面讲的例子插入都是使用PUT而不是POST. 这明显不restful啊.
![2020-02-02-20-43-38](http://dewy-blog.nikolazh.eu.org/2020-02-02-20-43-38.png)

当我们使用put方法进行请求指定id, 然而在查询之前我们并不知道这个id是不是已经存在了, 如果没有存在则是创建模式(`result`字段值为`created`), 否则为更新(`result`字段值为`updated`). 为了保证为创建模式有以下方法创建:

1. 使用POST方法, 让es自动生成唯一id. 通过下图你可以发现PUT和POST的不同.
  ![2020-02-01-20-33-47](http://dewy-blog.nikolazh.eu.org/2020-02-01-20-33-47.png)
  使用post方式生成的id, 长度为20个字符, URL安全, base64编码, GUID, 分布式系统并行生成时不可能会发生冲突

2. 使用PUT, 通过添加`?op_type=create`或者`_create`来进行控制, 如果已经存在则响应409.
  ![2020-02-01-20-47-53](http://dewy-blog.nikolazh.eu.org/2020-02-01-20-47-53.png)

#### 文档的结构

每个文档都含有元数据(描述数据的数据)字段, 有些元数据是可以在创建时自定义的, 诸如: `_index`, `_type`, `_id`.

##### 文档源元字段

`_source`: 表示的是文档的json序列化.
`_size`: 表示`_source`的比特值. 由`mapper-size`插件提供

##### 索引元字段

`_field_names`:
All fields in the document which contain non-null values.
`_ignored`:
All fields in the document that have been ignored at index time because of ignore_malformed.

##### 路由元字段

`_routing`
A custom routing value which routes a document to a particular shard.

##### 其他元字段

`_meta`
Application specific metadata.

## 映射

映射是定义一个文档包含哪些字段, 以及如何存储和索引的过程.

当我们使用传统数据库的时候, 创建一个表时, 需要指定表中字段的类型. 不知道你是否有这个疑问: 当我们插入一个文档的时候, 似乎并没有指定文档中的字段类型啊. 其实es的文档中的字段是有类型的, 只是当我们不指定字段类型的时候, 会给我们自动进行类型的匹配. 当然你可以给字段指定类型, 这就是映射.

### 字段数据类型

主要的数据类型有以下几种:

| 数据类型              | 关键字/说明                                                         |
| :-------------------- | :------------------------------------------------------------------ |
| 核心数据类型          |
| string                | text, keyword                                                       |
| Numeric               | long, integer, short, byte, double, float, half_float, scaled_float |
| Date                  | date                                                                |
| Date nanoseconds      | date_nanos                                                          |
| Boolean               | boolean                                                             |
| Binary                | binary                                                              |
| Range                 | integer_range, float_range, long_range, double_range, date_range    |
| 复杂数据类型          |
| Object                | `object` for single JSON objects                                    |
| Nested                | `nested` for arrays of JSON objects                                 |
| 地理数据类型          |
| Geo-point             | `geo_point` 用于经纬度定位                                          |
| Geo-shape             | `geo_shape` 用于像多边形这种复杂形状                                |
| 专用数据类型          |
| IP                    | `ip` for IPv4 and IPv6 addresses                                    |
| Completion datatype   | `completion` 提供自动完成的建议                                     |
| Token count           | `token_count` 计算字符串中标识数量                                  |
| mapper-murmur3        | `murmur3` 在索引时计算值的hash并存储在索引中                        |
| mapper-annotated-text | `annotated-text` 索引包含特殊标记的文本(通常用于标记命名实体)       |
| Percolator            | 接收用于查询的dsl                                                   |
| Join                  | 定义同一索引中文档的父子关心                                        |
| Rank feature          | 记录数字特征以在查询时提高命中                                      |
| Rank features         | 记录数字特征以在查询时提高命中                                      |
| Dense vector          | 记录浮点值的密集向量                                                |
| Sparse vector         | 记录浮点值的稀疏向量                                                |
| Search-as-you-type    | 一个类似文本的字段, 针对查询进行了优化, 以实现自动完成              |
| Alias                 | 定义现有字段的别名                                                  |
| Flattened             | 允许将整个JSON对象作为单个字段进行索引                              |
| Shape                 | `shape` 用于任意笛卡尔几何                                          |
| 阵列类型              | 所有值, 必须为相同的数据类型                                        |
| 多领域类型            | 允许字段应用于不同目的, 不同的分词方式等                            |

### 映射操作

可以看到给字段定义类型远比使用简单的自动转换功能要强大. 自定义映射允许你执行下面的操作:

- 全文字符串域和精确值字符串域的区别
- 使用特定语言分析器
- 优化域以适应部分匹配
- 指定自定义数据格式
- 还有更多

域最重要的属性是`type`, 对于不是 string 的域, 你一般只需要设置`type`.
默认, `string`类型域会被认为包含全文。就是说, 它们的值在索引前, 会通过一个分析器. 针对于这个域的查询在搜索前也会经过一个分析器。

string 域映射的两个最重要属性是 index 和 analyzer

#### index

这个字段值为: true和false. 当为false时, 表示该字段会被存储, 但是不会被索引和查找.

#### analyzer

被分解的字符串字段是通过一个分词器将字符串转换拿为一连串的标记或者词条. 例如: `"The quick Brown Foxes."`通过某种分词器可以被分解为`quick, brown, fox`三部分. 这些是真正用于构建索引这个字段的词语.

上述的分析过程不仅在索引时有效, 在查询时同样会发挥作用. 查询的字符串同样经过相同的分词器, 以使其查询中的词语和在索引中的词语为相同格式.

es查找分词器的过程如下(有些东西不翻译比较好, 英语渣, 翻译之后觉得容易误导又删了):

1. 在索引时
    - The analyzer defined in the field mapping.
    - An analyzer named default in the index settings.
    - The standard analyzer
2. 在查询时
    - The analyzer defined in a full-text query.
    - The search_analyzer defined in the field mapping.
    - The analyzer defined in the field mapping.
    - An analyzer named default_search in the index settings.
    - An analyzer named default in the index settings.
    - The standard analyzer.

##### 创建分词器

创建分词器最简单的方法是: 在映射中针对特定字段进行设置, 操作见下

```json
PUT /ana_index
{
  "mappings": {
    "properties": {
      "text": {
        "type": "text",
        "fields": {
          "english": {
            "type":     "text",
            "analyzer": "english"
          }
        }
      }
    }
  }
}

```

![2020-02-03-14-42-25](http://dewy-blog.nikolazh.eu.org/2020-02-03-14-42-25.png)

简单解释一下: `text`字段使用默认的分词器`standard`. `text.english`使用`english`分词器, 这种分词器会删除结束词并提取词干.

##### 使用分词器

通过一下方式我们可以使用上面的分词器:

```json

GET ana_index/_analyze
{
  "field": "text",
  "text": "The quick Brown Foxes."
}
```

![2020-02-03-14-57-29](http://dewy-blog.nikolazh.eu.org/2020-02-03-14-57-29.png)

```json
GET ana_index/_analyze
{
  "field": "text.english",
  "text": "The quick Brown Foxes."
}
```

![2020-02-03-14-58-07](http://dewy-blog.nikolazh.eu.org/2020-02-03-14-58-07.png)

你可以对比一下两种分词方式的不同, 但这不是重点. 之后有机会我们再继续研究不同的分词器.

### 映射基本操作

那么如何操作我们自己的映射呢.

#### 创建

```json
PUT /my-index
{
  "mappings": {
    "properties": {
      "age":    { "type": "integer" },  
      "email":  { "type": "keyword"  },
      "name":   { "type": "text"  }
    }
  }
}
```

![2020-02-03-13-24-43](http://dewy-blog.nikolazh.eu.org/2020-02-03-13-24-43.png)

### 修改

向存在的映射中添加一个字段:

```json
PUT /my-index/_mapping
{
  "properties": {
    "employee-id": {
      "type": "keyword",
      "index": false
    }
  }
}
```

![2020-02-03-13-25-10](http://dewy-blog.nikolazh.eu.org/2020-02-03-13-25-10.png)

我们可以使用上面的方式更改一个已经存在的字段吗? 答案是不能, 因为可能会导致已经建立索引的值无效. `Except for supported mapping parameters, you can’t change the mapping or field type of an existing field. Changing an existing field could invalidate data that’s already indexed.`

如果你非要更改已经存在的字段, 官方文档上给出的方法是, 重建一个索引, 并建立最新的映射, 之后将数据重新导入. 注意: 如果你只是想给之前的字段换个名字, 可以使用`alias`字段作为别名. 再说一遍, 直接更改原有字段会导致数据索引失效.

### 查看

1. 查看某个索引的映射

  ```json
  GET /my-index/_mapping
  ```

  ![2020-02-03-11-46-28](http://dewy-blog.nikolazh.eu.org/2020-02-03-11-46-28.png)
2. 查看映射的某个字段

  ```json
  GET /my-index/_mapping/field/name
  ```

  ![2020-02-03-11-45-58](http://dewy-blog.nikolazh.eu.org/2020-02-03-11-45-58.png)

---
isOriginal: true
title: ElasticSearch[6]操作篇-复合查询
tag:
  - ElasticSearch
  - es查询
category: ElasticSearch
description: 简单介绍一下elasticsearch的查询
date: 2020-02-04

sticky: false
timeline: true
article: true
star: false
---

## boolean query

查询语句中包含布尔类型的子句去匹配文本. 布尔查询中包含如下的事件类型, 可以理解为查询的条件类型.

| 事件     | 描述                                                                                            |
| :------- | :---------------------------------------------------------------------------------------------- |
| must     | 词句必须出现在匹配的文档中, 并且作用于相关性分数                                                |
| filter   | 词句必须出现在匹配的文档中. 但是和`must`不同, 它不影响得分. 因为filter是在过滤器上下文中作用的. |
| should   | 词句应该要出现在匹配的文档中                                                                    |
| must_not | 词句必须不出现在文档中, 注意这是作用在过滤器上下文中. 但是会返回得分为0的文档                   |

布尔查询遵循越匹配越好`more-matches-is-better`的原则. 因此`must`和`should`匹配上的得分都会作用到最终的分数上, 也就是文档的`_score`

### should

刚才我们提到`should`, 如何理解应该出现在文档中呢? 这需要提及`minimum_should_match`, 这个参数表示`should`子句返回的匹配文档必须匹配的程度或者数量.

如果布尔查询包括至少一个`should`子句并且没有`must`或者`filter`子句, 此时默认值为1, 否则默认值为0.

`minimum_should_match` 可以设置如下类型的值([官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-minimum-should-match.html)):

![2020-02-03-21-23-40](http://dewy-blog.nikolazh.eu.org/2020-02-03-21-23-40.png)

```json
PUT /poem/_doc/1
{
  "content": "one two three four five six"
}

PUT /poem/_doc/2
{
  "content": "one two three seven eight nine"
}

GET /poem/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "term": {
            "content": "one"
          }
        },
        {
          "term": {
            "content": "two"
          }
        },
        {
          "term": {
            "content": "four"
          }
        },
        {
          "term": {
            "content": "seven"
          }
        }
      ],
      "minimum_should_match": 3
    }
  }
}
```

![2020-02-04-13-09-49](http://dewy-blog.nikolazh.eu.org/2020-02-04-13-09-49.png)

注意: 在处理百分比时，可以使用负值来获得边缘情况下的不同行为。在处理4个条款时，75%和-25%意味着同样的事情，但在处理5个条件时，75%表示需要3，而-25%表示需要4。
无论计算到达哪个数，都不会使用大于可选子句数的值，或小于1的值。（即：无论计算结果的结果有多低或有多高，所需匹配的最小数目永远不会低于1或大于从句数。

## Boosting Query

返回匹配正查询的文档，同时减少匹配负查询的文档的相关性分数。
使用Boosting Query来降级某些文档，而不将它们排除在搜索结果之外。

![2020-02-04-13-40-59](http://dewy-blog.nikolazh.eu.org/2020-02-04-13-40-59.png)

参数介绍:

`positive`: 你想要匹配的查询条件. 返回的文档必须包含该条件.
`negative`: 用于降级文档的条件, 比如文档虽然匹配positive但是含有不是你最想要的东西. 注意匹配该条件的正向匹配得分会乘上`negative_boost`即为最终得分, 从图中可以看到.
`negative_boost`: 用于在文档匹配负参数时, 通过乘法运算扣分. 注意取值为`0-1`

注意: 如果你设置值为大于1的, 不是不能运行, 此时的逻辑正好反过来了. 不过从语义上还是遵循既有规则, 设定区间为`0-1`.

![2020-02-04-13-52-16](http://dewy-blog.nikolazh.eu.org/2020-02-04-13-52-16.png)

## Constant score query

包一个筛选器查询，并返回每个匹配文档的相关性分数等于Boost参数值.

![2020-02-04-13-58-21](http://dewy-blog.nikolazh.eu.org/2020-02-04-13-58-21.png)

我们知道在过滤器上下文查询中. 结果不会返回分数, 常分数查询会直接返回匹配过滤器的文档一个给定的`boost`分数.

## Disjunction max queryedit

将任何与任一查询匹配的文档作为结果返回，但只将最佳匹配的评分作为查询的评分结果返回.

### 参数介绍

`queries`: 一系列的查询子句.
`tie_breaker`: 可选参数, 介于0-1之间的浮点数. 用于增加匹配文档的相关性得分.

如果一个文档匹配多个查询子句, `dis_max query` 计算相关性分数的规则如下:

1. 从得分最高的匹配子句中获取相关性分数。
2. 将任何其他匹配子句的分数乘以`tie_breaker`值。
3. 将最高分添加到乘数分数中。

### 案例

```json

PUT /dis_test/_doc/1
{
    "title": "Quick brown rabbits",
    "body":  "Brown rabbits are commonly seen."
}

PUT /dis_test/_doc/2
{
    "title": "Keeping pets healthy",
    "body":  "My quick brown fox eats rabbits on a regular basis."
}

GET /dis_test/_search
{
    "query": {
        "bool": {
            "should": [
                { "match": { "title": "Brown fox" }},
                { "match": { "body":  "Brown fox" }}
            ]
        }
    }
}

GET /dis_test/_search
{
    "query": {
        "dis_max": {
            "queries": [
                { "match": { "title": "Brown fox" }},
                { "match": { "body":  "Brown fox" }}
            ]
        }
    }
}
```

执行布尔查询结果:
![2020-02-04-15-26-58](http://dewy-blog.nikolazh.eu.org/2020-02-04-15-26-58.png)
发现结果中最匹配的分数反而不高.
执行dis_max查询:
![2020-02-04-15-28-06](http://dewy-blog.nikolazh.eu.org/2020-02-04-15-28-06.png)
结果正确.

bool计算评分的方式(这是权威文档上的, 7.5没有找到对应的原文, 有待考据):

1. 执行 `should` 语句中的两个查询
2. 加和两个查询的评分
3. 乘以匹配语句的总数
4. 除以所有语句总数

下面分析一下产生这种结果的原因:

将两个子句分别执行.

```json
GET /dis_test/_search
{
    "query": {
        "bool": {
            "should": [
                { "match": { "title": "Brown fox" }}
            ]
        }
    }
}
```

此时只能匹配文档1, 得分为`0.6931472`

```json
GET /dis_test/_search
{
    "query": {
        "bool": {
            "should": [
                { "match": { "body":  "Brown fox" }}
            ]
        }
    }
}
```

此时两个文档均能匹配. 文档1: `0.21110919`. 文档2: `0.77041256`.

按照上面的算法计算最终得分:
文档1: `0.6931472 + 0.21110919 = 0.90425639`.
文档2: `0 + 0.77041256 = 0.77041256`.

因此得出上述结果也就不足奇怪.

顺便再分析一下`dis_max query`的规则.

注意之前的查询没有加tie_breaker参数, 这里我们设置为0.5.

```json
GET /dis_test/_search
{
    "query": {
        "dis_max": {
            "queries": [
                { "match": { "title": "Brown fox" }},
                { "match": { "body":  "Brown fox" }}
            ],
            "tie_breaker": 0.5
        }
    }
}
```

文档1:
最高匹配子句的最高得分为`0.6931472`, 加上其他匹配得分与tie_breaker的乘积.
`0.6931472 + 0.21110919 * 0.5 = 0.798701795`

文档2:
同理:
`0.77041256 + 0 * 0.5 = 0.77041256`

现在对比一下我们分析的结果和实际的结果. ok, 一切就明了了.
![2020-02-04-19-23-54](http://dewy-blog.nikolazh.eu.org/2020-02-04-19-23-54.png)

## Function score query

这个查询允许自定义分数计算规则.

[官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html)

感觉可以放到之后的文章介绍.... 这一篇已经比较长了, 总之敬请期待

![2020-02-04-19-32-49](http://dewy-blog.nikolazh.eu.org/2020-02-04-19-32-49.png)

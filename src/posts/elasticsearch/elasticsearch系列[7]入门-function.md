---
isOriginal: true
title: ElasticSearch[7]操作篇-Function score query
tag:
  - ElasticSearch
  - es查询
category: ElasticSearch
description: Function score query的介绍
date: 2020-02-05

sticky: false
timeline: true
article: true
star: false
---

> function_score允许自定义分数计算规则, 修改文档检索后的得分. 你可以指定一个或针对不同情形指定不同的规则. 以下内容有些枯燥, 基本上是对[官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html)的翻译.

## 指定单个函数

```json
GET /_search
{
    "query": {
        "function_score": {
            "query": { "match_all": {} },
            "boost": "5",
            "random_score": {},
            "boost_mode":"multiply"
        }
    }
}
```

`random_score`就是一个计算函数.

## 指定多个函数

```json
GET /_search
{
    "query": {
        "function_score": {
          "query": { "match_all": {} },
          "boost": "5",
          "functions": [
              {
                  "filter": { "match": { "test": "bar" } },
                  "random_score": {},
                  "weight": 23
              },
              {
                  "filter": { "match": { "test": "cat" } },
                  "weight": 42
              }
          ],
          "max_boost": 42,
          "score_mode": "max",
          "boost_mode": "multiply",
          "min_score" : 42
        }
    }
}
```

当文档匹配到对应的过滤器时, 会执行相应的函数. 如果没有提供函数的过滤器, 则等效于`"match_all": {}`

### score_mode参数

`score_mode`表示计算的分数会如何被组合. 有以下参数:
`multiply`, `sum`, `avg`, `first`, `max`, `min`
含义如同字面意思, 这里单独说一下`first`, 表示: 使用第一个匹配的.

### weight参数

得分可能有不同的域, 而且有时不同函数对分数产生不同程度的影响也是我们所期望的. 通过为每个函数设置权重`weight`我们可以达到调整对分数的影响. `weight`最终会被各自函数结果乘上. 如果权重没有相应的函数, 则`weight`相当于一个返回`weight`值的方法.

如果`score_mode`被设置为`avg`, 最终的分数为加权平均. 1的权重是3, 2的权重是4, 则加权平均每结果为 (1\*3 + 2\*4) / (3 + 4).

### max_boost参数

设置该参数可以防止新的分数超过某个值. 默认情况下, `max_boost`的值为: `FLT_MAX`.

### boost_mode参数

新的分数通过查询分数和函数分数以某种方式`boost_mode`运算得出.
`boost_mode`的值可以设置为如下:
`multiply`, `sum`, `avg`, `replace`, `max`, `min`

`replace`的含义是只使用函数得分忽略查询得分.

### min_score参数

默认情况下，修改分数不会更改与哪个文档匹配。要排除不符合特定分数阈值的文档，可以将min_score参数设置为所需的分数阈值。

要min_score工作，查询返回的所有文档都需要算分，然后逐个筛选。

## 函数种类

有以下六种函数:

- script_score
- weight
- random_score
- field_value_factor
- decay functions: gauss, linear, exp

### script score

script_score函数允许您包装另一个查询，并使用脚本表达式从文档中的其他数值字段值派生的计算来自定义它的评分。下面是一个简单的示例：

```json
GET /_search
{
    "query": {
        "function_score": {
            "query": {
                "match": { "message": "elasticsearch" }
            },
            "script_score" : {
                "script" : {
                  "source": "Math.log(2 + doc['likes'].value)"
                }
            }
        }
    }
}
```

注意: 所有文档的得都是正32bit浮点数. 如果函数生成更精确地浮点数, 则转换为最近的32bit浮点数. 另外分数不能是非负数, 否则会出现错误.

定义脚本参数, 并在脚本中使用:

```json
GET /_search
{
    "query": {
        "function_score": {
            "query": {
                "match": { "message": "elasticsearch" }
            },
            "script_score" : {
                "script" : {
                    "params": {
                        "a": 5,
                        "b": 1.2
                    },
                    "source": "params.a / Math.pow(params.b, doc['likes'].value)"
                }
            }
        }
    }
}
```

### weight

将分数与权重相乘.

### random_score

`random_score`生成[0,1)之间的分数。默认情况下，它使用内部 Lucene 文档 ID 作为随机性源，这非常有效，但不幸的是无法重现，因为文档可能通过合并重新编号。

如果希望分数重现, 则需要提供种子`seed`和字段`field`两个参数. 最终的分数的计算会根据`seed`, 文档的`field`字段的最小值, 以及基于索引名称和分片 ID 计算的盐值. 从而含有相同值, 但索引不同的文档会有不同的得分.

同一分片内具有相同`field`值的文档将获得相同的分数，因此通常需要使用对所有文档具有唯一值的字段。比较好的选择可能是使用`_seq_no`字段，其唯一缺点是如果文档更新，分数将发生变化，因为更新操作也会更新`_seq_no`字段的值。

可以在不设置字段的情况下设置种子，但这已被弃用，因为这需要在占用大量内存的_id字段上加载字段数据。

#### 案例

```json
GET /_search
{
    "query": {
        "function_score": {
            "random_score": {
                "seed": 10,
                "field": "_seq_no"
            }
        }
    }
}
```

### field_value_factor

`field_value_factor`函数允许使用文档中的字段来影响分数。它类似于使用`script_score`函数，但是，它避免了脚本的开销。如果在多值字段上使用，则在计算中仅使用该字段的第一个值。

#### 举例

```json
GET /_search
{
    "query": {
        "function_score": {
            "field_value_factor": {
                "field": "likes",
                "factor": 1.2,
                "modifier": "sqrt",
                "missing": 1
            }
        }
    }
}
```

上面的查询对应的计算公式为: `sqrt(1.2 * doc['likes'].value)`

#### field_value_factor的字段

| 字段名   | 含义                                         |
| :------- | :------------------------------------------- |
| field    | 从文档中提取的字段                           |
| factor   | 需要乘上字段值的操作因子, 默认值为1          |
| modifier | 应用到字段值的修饰符, 取值见下表             |
| missing  | 当文档中不存在提取的字段, 则使用该字段值替代 |

#### modifier取值

![2020-02-06-09-42-55](http://dewy-blog.nikolazh.eu.org/2020-02-06-09-42-55.png)

field_value_score函数生成的分数必须为非负数，否则将引发错误。如果对 0 和 1 之间的值使用，则对数和 ln 修饰符将生成负值。请务必使用范围筛选器限制字段的值以避免这种情况，或使用 log1p 和 ln1p。另外也要避免对0取对数这种非逻辑操作.

### decay

衰减函数依赖于用户给定的`origin`数值型间的距离计算得分. 这类似一个范围查询, 但是边缘平滑而不是框定具体的边缘值.

要对具有数字字段的查询使用距离评分，用户必须为每个字段定义`origin`和`scale`。需要`origin`来定义计算距离的"中心点"，`scale`用来定义衰减的速率. 衰减函数可以定义成如下:

```json
"DECAY_FUNCTION": {
    "FIELD_NAME": {
          "origin": "11, 12",
          "scale": "2km",
          "offset": "0km",
          "decay": 0.33
    }
}
```

`DECAY_FUNCTION`可以设置为: `liner`, `exp`, `gauss`.
`FIELD_NAME`字段的值类型必须为numeric, date, geo-point.

在上面的示例中，字段是geo_point，并且可以以地理格式提供原点。在这种情况下，必须使用单位给出比例和偏移量。如果字段是日期字段，则可以将缩放和偏移设置为天、周等。如:

```json
GET /_search
{
    "query": {
        "function_score": {
            "gauss": {
                "date": {
                      "origin": "2013-09-17",
                      "scale": "10d",
                      "offset": "5d",
                      "decay" : 0.5
                }
            }
        }
    }
}
```

`origin`的日期格式由映射中的`format`定义. 如果不设置`origin`,则使用当前时间.
`offset`和`decay`为可选字段.

#### 字段介绍

| 字段   | 描述                                                                                                                                                                                                                          |
| :----- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| origin | 用于计算距离的原点。必须为数字字段的数字、日期字段的日期和地理字段的地理点。对于地理和数字字段是必需的。对于日期字段，默认值为now。origin支持日期计算(如: now - 1h).                                                          |
| scale  | 所有类型都需要。定义与`origin + offset`的距离等于衰减参数。对于地理字段：可以定义为数字单位（1km，12m,... ）。默认单位为米。对于日期字段：可以定义为数字_单位 （"1h"， "10d",... ）。默认单位为毫秒。对于数字字段：任意数字。 |
| offset | 如果定义了偏移量，则衰减函数将仅计算距离大于定义的偏移量的文档的衰减函数。默认值为 0。                                                                                                                                        |
| decay  | 衰减参数定义文档如何通过`scale`进行评分。如果未定义衰减，则距离刻度处的文档将评分0.5。                                                                                                                                        |

第一个例子中文档可能包含地理位置字段的酒店信息. 您希望根据酒店与给定位置的远点计算衰减函数. 你可能不能立刻知道如何指定高斯函数的`scale`, 但是你可能知道"在2km的距离上分数应该衰减到1/3". `scale`参数将会被自动调整以确保0.33的得分会距离给定点2km.

在第二个示例中，字段值介于`2013-09-12`和`2013-09-22`之间的文档将得到1.0的权重，而从该日期起为15天的文档权重为0.5。

#### 衰减函数

`DECAY_FUNCTION`用来确定使用什么衰减函数, 支持的衰减函数见下:

![2020-02-06-16-51-55](http://dewy-blog.nikolazh.eu.org/2020-02-06-16-51-55.png)

### 多值字段

如果用于计算衰减的字段包含多个值，则每个默认值选择最接近原点的值来确定距离。这可以通过设置`multi_value_mode`, 取值为: `min`, `max`, `avg`, `sum`.

```json
"DECAY_FUNCTION": {
    "FIELD_NAME": {
            "origin": ...,
            "scale": ...
    },
    "multi_value_mode": "avg"
}
```

## 最后

有兴趣可以阅读[官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html)

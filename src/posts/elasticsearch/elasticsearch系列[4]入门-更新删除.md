---
isOriginal: true
title: ElasticSearch[4]操作篇-更新和删除
tag:
  - es更新
  - es删除
category: ElasticSearch
description: 简单介绍一下elasticsearch文档的更新和删除
date: 2020-02-03

sticky: false
timeline: true
article: true
star: false
---

## 更新文档

文档在elasticsearch中是不可变的. 但是可以通过重建索引进行替换.

![2020-02-01-20-17-00](http://dewy-blog.nikolazh.eu.org/2020-02-01-20-17-00.png)

如果我们要修改上面截图中的`age`字段, 可以将之前的PUT方法中的`age`值修改并重新运行, 即可.
![2020-02-01-20-18-20](http://dewy-blog.nikolazh.eu.org/2020-02-01-20-18-20.png)

注意此时的_version字段会增加1, 这个设计如同数据库中我们使用乐观锁. 都是通过版本号实现.

### 局部更新

上面通过全文更新过于繁琐. 现在就介绍一种更加简单的方式进行更新.

![2020-02-03-15-46-28](http://dewy-blog.nikolazh.eu.org/2020-02-03-15-46-28.png)

比如更改上面文档中的age:

```json
POST /megacorp/employee/3/_update
{
    "doc": {
      "age" :  40
    }
}
```

执行之后, 重新查询:
![2020-02-03-15-48-23](http://dewy-blog.nikolazh.eu.org/2020-02-03-15-48-23.png)
结果已经变成我们设置的值了.

#### 通过脚本更新

```json
POST /megacorp/employee/3/_update
{
    "script" : "ctx._source.age+=1"
}
```

`ctx._source`表示的是`_source`

注意如果不确定更新的字段是否存在, 可以使用`upsert`指定初始值创建.

```json
POST /megacorp/employee/1/_update
{
   "script" : "ctx._source.views+=1",
   "upsert": {
       "views": 1
   }
}
```

#### 更新和冲突

如果版本号发生冲突, 并且在更新先后不重要的情况下. 可以尝试再次更新.
这可以通过设置参数 `retry_on_conflict` 来自动完成,  这个参数规定了失败之前 update 应该重试的次数, 它的默认值为0 。

```json
POST /megacorp/employee/1/_update?retry_on_conflict=5
{
   "script" : "ctx._source.views+=1",
   "upsert": {
       "views": 0
   }
}
```

## 删除

```json
DELETE /school-demo/school/1
```

![2020-02-01-20-51-52](http://dewy-blog.nikolazh.eu.org/2020-02-01-20-51-52.png)

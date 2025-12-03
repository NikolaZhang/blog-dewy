---
isOriginal: true
title: 源码分析[1] HashMap的创建
mathjax: true
tag:
  - hashmap
  - 初始化
  - 原理
category: 源码
date: 2020-01-05
description: 来一波hashmap源码分析
sticky: false
timeline: true
article: true
star: false
---

> 基于java8介绍一下HashMap的实现. 写着写着就将近400行了, 因此打算这个作为一个系列分批次发出. 顺便还能占用一下篇数.

## 简介

![实现与继承关系](http://dewy-blog.nikolazh.eu.org/diagram.png)

HashMap 是基于哈希表的Map接口实现, 它了提供键值对的映射操作, 且键和值允许为空.
HashMap 是线程不安全的而且每次操作哈希表后键值对, 存储位置可能发生变化. 因为hashmap在存值的过程中会进行扩容和数据结构转换(链表和树的转换).

HashMap 的实例具有两个影响其性能的参数：初始容量和负载因子。
**初始容量**是哈希表中存储桶的数量，初始容量只是创建哈希表时的容量.其值DEFAULT_INITIAL_CAPACITY为16. 最大容量MAXIMUM_CAPACITY为 $2^{30}$
**负载因子**是在自动增加其哈希表容量的一种判断条件, 当哈希表中的条目数超过负载因子和当前容量的乘积时，哈希表将被重新哈希(即，内部数据结构将被重建). 其默认值DEFAULT_LOAD_FACTOR为0.75.
为了减少重建哈希表负载因此不能设置过低.

## 实例化一个HashMap

指定初始容量, 强烈建议初始化的时候指定初始容量. 因为HashMap每次进行扩容, 都是比较耗时的, 一开始就指定一个合适的容量, 就可以减少不必要的性能损耗.
至于负载因子, 建议使用默认值, 具体原因也不太清楚. 大概0.75就是一个比较合适的数值吧.

```java
HashMap<String, Integer> map = new HashMap<>(8);
```

### 实例化的步骤

HashMap的构造方法如下, 我只选取了传入初始容量和负载因子的.其他的可以自己参照源码进行分析.

```java 实例化对象
public HashMap(int initialCapacity, float loadFactor) {
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal initial capacity: " + initialCapacity);
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal load factor: " + loadFactor);
    this.loadFactor = loadFactor;
    this.threshold = tableSizeFor(initialCapacity);
}
```

实例化一个HashMap主要进行了下面的操作

1. 校验初始容量是否小于0或者大于最大容量, 如果小于0则抛出参数异常, 如果大于最大容量则使用最大容量作为初始容量.
2. 校验负载因子, 如果小于等于0或者不是浮点数则抛出参数异常. 否则初始化负载因子为设定值
3. 将容量转换到2的幂次. 暂且记住这个步骤, 之后你会发现会有很多神奇的操作.

下面详细解释一下容量是怎么扩展到2的幂次的.

```java 容量2的幂次化
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

如果你之前没怎么使用过移位运算符, 想必看到这段代码, 你一定是懵逼的. 这段代码获取2的幂次很巧妙, 但是在2进制的世界却又平平无奇.
首先为何要先进行减一运算: `int n = cap - 1;`, 这个我们分析完移位后再说.

n取值为0到MAXIMUM_CAPACITY, 则:

1. 当n高位右移1位后的结果与n进行或运算, 则有2个高位为1, 结果重新赋值为n.
2. 上一步的n右移2位后的结果再与n进行或运算, 重新赋值为n, 此时n中含有4个高位为1.
3. 移位4后结果有8个高位为1, 移位8后结果有16个高位为1, 移位16后结果有32个高位为1.

你可以参照下图进行理解:
![解析移位运算](http://dewy-blog.nikolazh.eu.org/移位运算.png)

高位如此, 当初始的n低位中含有1时, 最终的结果必然是2的幂次减1.
最后只需要将结果n加1就可以获得2的幂次结果了.

你或许会疑惑如果高位很高呢, 比如2的100次幂级, 移位16后肯定就不是2的幂次? 注意我们的输入是int类型, 最大值也不过 $2^{31}$-1也就是31个1. HashMap的存储上限是1 << 30, 也就是$2^{30}$. 因此`n |= n >>> 16`这一步之后n中所有的位均为1.

现在我们解答一开始进行`cap - 1`的原因: 如果我们一开始输入4, 扩容之后, 结果应该为8, 可是4已经是2的幂次了. 这样就导致扩充了额外的空间. 进行减一操作正好避免了容量额外扩充导致空间浪费的出现.

最后你尝试可以分析一下n为0时的情形.

## end

下一篇文章, 继续介绍HashMap的put方法. 敬请期待~

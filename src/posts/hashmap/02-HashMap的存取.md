---
isOriginal: true
title: 源码分析[3] HashMap的存取
mathjax: true
tag:
  - hashmap
  - put方法
category: 源码
date: 2020-01-09
icon: hashtag
description: 继续分析put
sticky: false
timeline: true
article: true
star: false
---

> 续上节, 当hashmap为空或者table长度为0时, 会进行扩容. 这一节分析单hashmap中含有值的情况

## 存取方法

下面的代码实现了对输入键值对的存储

```java
if ((p = tab[i = (n - 1) & hash]) == null)
    tab[i] = newNode(hash, key, value, null);
else {
    Node<K,V> e; K k;
    if (p.hash == hash &&
        ((k = p.key) == key || (key != null && key.equals(k))))
        e = p;
    else if (p instanceof TreeNode)
        e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
    else {
        for (int binCount = 0; ; ++binCount) {
            if ((e = p.next) == null) {
                p.next = newNode(hash, key, value, null);
                if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                    treeifyBin(tab, hash);
                break;
            }
            if (e.hash == hash &&
                ((k = e.key) == key || (key != null && key.equals(k))))
                break;
            p = e;
        }
    }
    if (e != null) { // existing mapping for key
        V oldValue = e.value;
        if (!onlyIfAbsent || oldValue == null)
            e.value = value;
        afterNodeAccess(e);
        return oldValue;
    }
}
```

n是table的长度, 这个长度的为2的幂次; Node<K,V>[] tab就是table.

`tab[i = (n - 1) & hash]`实际上一个取模的操作. 因为n-1后的结果转化为2进制后和hash作与运算, 其结果必然是取hash的低位. 实际相当于`hash % n`. 一般情况下hash要远远大于n, 知道了这个, 取模存值也就不难理解.

## 各安天命

下面继续说一下各个条件中的逻辑:

如果取模后的位置上没有存值, 就将值存放到这个位置上.
如果取模后的位置上已经存在一个节点. 那么考虑以下三种情况:

1. `p.hash == hash &&((k = p.key) == key || (key != null && key.equals(k)))` 即: 之前的节点和当前要存放的数据hash相同, 且key相同. key相同的含义为:地址相同或者调用重写equals结果为true. 在这种情况下, 还要进行如下操作:

```java
if (e != null) { // existing mapping for key
    V oldValue = e.value;
    if (!onlyIfAbsent || oldValue == null)
        e.value = value;
    afterNodeAccess(e);
    return oldValue;
}
```

这里的e就是当前节点. 即: `!onlyIfAbsent || oldValue == null` 当可修改原值或者原值为null的情况下替换原来节点的value. `afterNodeAccess`是个空方法. 估计是留着以后要做什么处理吧. 但是当前jdk没有逻辑实现. 因此我们就不管它了. 注意||是有短路现象的.
2. `p instanceof TreeNode`之前的节点是TreeNode类型, 那么调用红黑树的存值逻辑`putTreeVal(this, tab, hash, key, value)`
3. 非以上两种情况, 则遍历当前链表, 如果1中条件成立则停止遍历. 否则, 遍历直到尾结点后, 在尾结点新增一个节点存放最新的数据. 顺便判断是否应该转换为红黑树. 是则进行树化`treeifyBin(tab, hash)`

至此, put的逻辑已经结束了. 最后还有一点代码:

```java
++modCount;
if (++size > threshold)
    resize();
afterNodeInsertion(evict);
```

modCount是对hashmap操作的一个计数, 其目的是用于进行快速失败fail-fast.
size是映射数量, 也就是hashmap存放了多少个键值对. 如果这个存值后数量大于了阈值, 就需要再次扩容.
`afterNodeInsertion`又是个空方法. 这里就按下不表了.

最后, 希望注意一下这部分代码:

```java
.................
    if (e != null) { // existing mapping for key
        V oldValue = e.value;
        if (!onlyIfAbsent || oldValue == null)
            e.value = value;
        afterNodeAccess(e);
        return oldValue;
    }
}
++modCount;
if (++size > threshold)
    resize();
afterNodeInsertion(evict);
return null;
```

当出现相同的key和hash时替换原值后会直接返回原值, 就不会进行操作计数了.

## end

到此put的逻辑已经介绍完了. 下一篇当然还是要继续了. 我们谈一谈红黑树吧.

---
isOriginal: true
title: 源码分析[2] HashMap的扩容
mathjax: true
tag:
  - hashmap
  - 数据结构
  - 扩容
  - put方法
category: 源码
date: 2020-01-07
icon: hashtag
description: 分析一下put方法
sticky: false
timeline: true
article: true
star: true
---

## 铺垫

HashMap中定义了table用于存放键值对, 其定义为:

```java
transient Node<K,V>[] table;
```

看一下Node类型的定义:

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;

    Node(int hash, K key, V value, Node<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.value = value;
        this.next = next;
    }

    public final int hashCode() {
        return Objects.hashCode(key) ^ Objects.hashCode(value);
    }

    .......

}
```

很明显Node是一个链表结构, 每个节点中含有key, value, 以及根据key, value生成的hash. next是该节点指向的下一个节点. 准确的说这是一个单向链表.

另外我们还要提及另一个类型TreeNode

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
    TreeNode<K,V> parent;  // red-black tree links
    TreeNode<K,V> left;
    TreeNode<K,V> right;
    TreeNode<K,V> prev;    // needed to unlink next upon deletion
    boolean red;
    TreeNode(int hash, K key, V val, Node<K,V> next) {
        super(hash, key, val, next);
    }

    ............

}
```

TreeNode是一个红黑树类型. 这里需要注意下这个构造方法, 实际上是继承了
HashMap的Node, 也就是复用了构造链表的逻辑.

```java
static class Entry<K,V> extends HashMap.Node<K,V> {
    Entry<K,V> before, after;
    Entry(int hash, K key, V value, Node<K,V> next) {
        super(hash, key, value, next);
    }
}

// super(hash, key, value, next);
Node(int hash, K key, V value, Node<K,V> next) {
    this.hash = hash;
    this.key = key;
    this.value = value;
    this.next = next;
}
```

## put 操作

向HashMap中添加一个键值对很简单, 只需要put操作. 但是put的源码却不是那么简单.

```java HashMap.put入口
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}
```

首先将参数key哈希, 代码如下:

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

对应不同类型会有不同的hash算法, 此处就不再详述. 但是每次hash之后会异或右移16位, 我们暂且按下不表. 

对于`putVal(int hash, K key, V value, boolean onlyIfAbsent, boolean evict)` 简单说下后两个参数的含义.

- `onlyIfAbsent` 为true 则不改变已经存在的值
- `evict` 为false 则table使用创建模式, 这个两个参数之后会进行进一步介绍

`putVal`的实现主要是对table的操作, 具体代码见下:(这篇文章我们主要讲下面这段代码) 

```java
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    .................
```

## 扩容resize

从头开始分析

```java
Node<K,V>[] tab; Node<K,V> p; int n, i;
if ((tab = table) == null || (n = tab.length) == 0)
    n = (tab = resize()).length;
```

方法入口对table是否为空以及长度进行判断, 当table为空时, 首先进行初始化table的大小. 这里顺带提一句, 实例化HashMap时, 只是设置了threshold的大小, 而没有初始化table.

下面详细说一下`resize()` 的实现逻辑:

```java
Node<K,V>[] oldTab = table;
int oldCap = (oldTab == null) ? 0 : oldTab.length;
int oldThr = threshold;
int newCap, newThr = 0;
if (oldCap > 0) {
    if (oldCap >= MAXIMUM_CAPACITY) {
        threshold = Integer.MAX_VALUE;
        return oldTab;
    }
    else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
            oldCap >= DEFAULT_INITIAL_CAPACITY)
        newThr = oldThr << 1; // double threshold
}
else if (oldThr > 0) // initial capacity was placed in threshold
    newCap = oldThr;
else {               // zero initial threshold signifies using defaults
    newCap = DEFAULT_INITIAL_CAPACITY;
    newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
}
if (newThr == 0) {
    float ft = (float)newCap * loadFactor;
    newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
            (int)ft : Integer.MAX_VALUE);
}
```

注意resize(), 不是只有初始化的时候调用, 当容量达到阈值时, HashMap会调用该方法进行扩容.

当table为null时, 分两种情况考虑:

- 如果实例化时设置的threshold>0, 那么就使用threshold去初始化table.
- 如果实例化时设置的threshold为0, 那么使用默认的容量去初始化table, 并使用默认的负载因子和默认容量去设置threshold.

当table不为null, 这就是之后进行扩容的时候才会走的逻辑:

- 判断当前的table容量是否超过上限MAXIMUM_CAPACITY, 如果超过则threshold设置为Integer.MAX_VALUE, 并且直接返回table, 不做处理.
- 没有超过上限则将原来容量扩充一倍, 如果扩充后容量没有超过上限且容量大于默认容量, threshold也扩充一倍.

```java
threshold = newThr;
@SuppressWarnings({"rawtypes","unchecked"})
Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
table = newTab;
if (oldTab != null) {
    for (int j = 0; j < oldCap; ++j) {
        Node<K,V> e;
        if ((e = oldTab[j]) != null) {
            oldTab[j] = null;
            if (e.next == null)
                newTab[e.hash & (newCap - 1)] = e;
            else if (e instanceof TreeNode)
                ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
            else { // preserve order
                ........
            }
        }
    }
}
return newTab;
```

容量扩充之后, 实例化一个最新的容量Node<K,V> newTab数组.
之后将原来的数据oldTab, 放到新数组中. 下面介绍一下具体的流程.

遍历oldTab中所有元素, 在当前元素不为null的前提下(如果当前元素为null, 就不用做任何处理).

1. 如果当前元素没有子节点, 就将当期元素放到新数组的e.hash & (newCap - 1)位置上.
2.如果当前元素为TreeNode类型. 则使用split方法对红黑树进行进行拆分
3. 如果不是TreeNode类型, 则进行链表的处理

下面分别对2,3两步进行分析

### 树的拆分

`((TreeNode<K,V>)e).split(this, newTab, j, oldCap)`也是非常值得一说的:

```java
if ((e.hash & bit) == 0) {
    if ((e.prev = loTail) == null)
        loHead = e;
    else
        loTail.next = e;
    loTail = e;
    ++lc;
}
else {
    if ((e.prev = hiTail) == null)
        hiHead = e;
    else
        hiTail.next = e;
    hiTail = e;
    ++hc;
}
```

代码逻辑见下:

1. 当前node赋值e, 子节点赋值next
2. 去除当前node下的子节点
3. 判断(e.hash & bit) == 0, 并分分别进行处理

下面我们详细说一下`e.hash & bit`:

bit是原来hashmap的容量, 这个判断标准`e.hash & bit`实际上是为了将节点分散到新数组的后方区域和前方区域(其索引和原来的数组空间索引相同).

因为, 一般情况下一次扩容之后新的容量是原来的容量的2倍, 当拷贝原来的数据到新的空间的时候为了优化性能, 或者提高空间占用率. 原来的数据在新空间中越分散是越好的.
性能优化的提现就是如果原有空间的树层级较高, 那么查询肯定是耗时的. 将原来的树进行拆分,将原来的节点放到新的数组位置上, 一方面可能使用新拓展的空间位置, 另一方面减少了原来树的层级, 查询效率自然提升. 注意树降级之后有可能会变成链表.

里面嵌套的条件, 首先当是一个树的顶点时要记录head, 因此就需要多定义一个loHead, hiHead. 虽然到目前为止我们看不到记录head的有什么用. 这里的lo和hi表示的是分散到前方区域和后方区域.(loHead, hiHead是新生成的两个链表的起始)

loTail和hiTail才是真正用于之后重构的对象. 数据重构之后的结果无非两种链表和树. 注意这块if的操作只是把原来的树变成了两个链表(虽然命名是TreeNode但是只使用了next和prev). 并且使用lc和hc分别记录拆分到前方和后方的节点数. 而这两个变量的作用就是判断是否达到转换为树的阈值UNTREEIFY_THRESHOLD.

很明显, 每一个节点的`hash & bit`要么是等于0要么等于1. 当等于0时, 如果是第一次出现就需要记录为顶级节点loHead和loTail, 当之后出现等于0的时候, 就把当前节点作为hiTail的子节点; 当不等于0时亦然. 因此上面的代码块执行之后我们就得到了两个链表.

下面的代码就很简单了, 分别判断两个链表长度是否达到树化阈值.

```java
if (loHead != null) {
    if (lc <= UNTREEIFY_THRESHOLD)
        tab[index] = loHead.untreeify(map);
    else {
        tab[index] = loHead;
        if (hiHead != null) // (else is already treeified)
            loHead.treeify(tab);
    }
}
if (hiHead != null) {
    if (hc <= UNTREEIFY_THRESHOLD)
        tab[index + bit] = hiHead.untreeify(map);
    else {
        tab[index + bit] = hiHead;
        if (loHead != null)
            hiHead.treeify(tab);
    }
}
```

看到这里或许你已经明白了loHead和hiHead的作用, 就是为了便于找到头节点, 就目前生成的loTail, hiTail单向链表我们是无法从最后的节点推出头节点的.

如果链表长度没有超过UNTREEIFY_THRESHOLD, 则将树节点转化为链表节点
超过UNTREEIFY_THRESHOLD, 则转化为红黑树.
具体的流程之后在进行解说.

### 处理链表

```java
Node<K,V> loHead = null, loTail = null;
Node<K,V> hiHead = null, hiTail = null;
Node<K,V> next;
do {
    next = e.next;
    if ((e.hash & oldCap) == 0) {
        if (loTail == null)
            loHead = e;
        else
            loTail.next = e;
        loTail = e;
    }
    else {
        if (hiTail == null)
            hiHead = e;
        else
            hiTail.next = e;
        hiTail = e;
    }
} while ((e = next) != null);
if (loTail != null) {
    loTail.next = null;
    newTab[j] = loHead;
}
if (hiTail != null) {
    hiTail.next = null;
    newTab[j + oldCap] = hiHead;
}
```

相信看完上一节拆分红黑树的分析之后, 这段代码应该不难理解:
同样是以`e.hash & oldCap`作为条件将原有的链表分为loTail和hiTail.
最后将这两个链表分别放到新数组的newTab[j]和newTab[j + oldCap]上.当然放置的时候, 要放置头节点loHead和hiHead.

## end

这一篇主要讲了HashMap扩容的操作, 几乎全部是对resize方法的讲解. 下一篇文章会继续介绍putVal方法

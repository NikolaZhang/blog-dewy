---
isOriginal: true
title: Java并发集合类全面解析
tag:
  - thread
  - 并发集合
  - ConcurrentHashMap
category: thread
date: 2024-01-16
icon: coffee
description: 全面解析Java并发集合类的实现原理、使用场景和性能特性
sticky: false
timeline: true
article: true
star: false
---

## 1. 并发集合类概述

在Java中，传统的集合类（如ArrayList、HashMap等）在多线程环境下是不安全的，当多个线程同时对这些集合进行修改操作时，可能会导致数据不一致或抛出ConcurrentModificationException异常。为了解决这个问题，Java提供了一系列线程安全的并发集合类，这些集合类位于java.util.concurrent包下，专为高并发场景设计，提供了更好的性能和安全性。

并发集合类与传统集合类的主要区别：

- **线程安全性**：并发集合类通过各种机制（如锁分离、无锁算法等）保证线程安全
- **性能**：并发集合类针对不同的并发场景进行了优化，通常比使用synchronized包装的传统集合性能更好
- **迭代安全性**：大多数并发集合类支持安全的迭代操作，不会抛出ConcurrentModificationException
- **功能增强**：提供了丰富的原子操作和并发控制方法

## 2. 并发集合类的分类与设计原则

### 2.1 分类

Java并发集合类可以根据数据结构和设计思路分为以下几类：

| 类别 | 主要实现类 | 核心特性 |
|------|------------|----------|
| Map接口 | ConcurrentHashMap、ConcurrentSkipListMap | 键值对存储，支持高并发读写 |
| Set接口 | CopyOnWriteArraySet、ConcurrentSkipListSet | 元素不重复，线程安全 |
| List接口 | CopyOnWriteArrayList | 有序列表，支持随机访问 |
| Queue接口 | ConcurrentLinkedQueue、ConcurrentLinkedDeque、LinkedBlockingQueue、ArrayBlockingQueue、DelayQueue、PriorityBlockingQueue、SynchronousQueue | 队列操作，支持不同的阻塞策略 |

### 2.2 设计原则

Java并发集合类的设计遵循以下核心原则：

1. **锁分离技术**：将读写操作分离，允许多个线程同时读取，只有一个线程可以写入
2. **无锁算法**：使用CAS（Compare-And-Swap）等原子操作实现线程安全，避免锁竞争
3. **Copy-On-Write机制**：写入时复制，保证读取操作的无锁性
4. **分段锁技术**：将数据分成多个段，每个段独立加锁，提高并发度
5. **阻塞机制**：提供不同的阻塞策略，满足不同的应用场景

## 3. ConcurrentHashMap深度解析

ConcurrentHashMap是HashMap的线程安全版本，是Java并发编程中最常用的并发集合类之一。

### 3.1 JDK 7与JDK 8实现对比

| 特性 | JDK 7 | JDK 8 |
|------|-------|-------|
| 数据结构 | 数组 + 链表 | 数组 + 链表/红黑树 |
| 锁机制 | 分段锁（Segment） | 节点锁（synchronized）+ CAS |
| 并发度 | 取决于Segment数量（默认16） | 理论上无限制 |
| 扩容机制 | 分段扩容 | 整体扩容 |
| 迭代器 | 弱一致性 | 弱一致性 |

### 3.2 JDK 8 ConcurrentHashMap核心实现

```java
public class ConcurrentHashMap<K, V> extends AbstractMap<K, V>
        implements ConcurrentMap<K, V>, Serializable {
    
    // 核心属性
    transient volatile Node<K, V>[] table;
    private transient volatile Node<K, V>[] nextTable;
    private transient volatile long baseCount;
    private transient volatile int sizeCtl;
    
    // 节点类型
    static class Node<K, V> implements Map.Entry<K, V> {
        final int hash;
        final K key;
        volatile V val;
        volatile Node<K, V> next;
        // ...
    }
    
    // 红黑树节点
    static final class TreeNode<K, V> extends Node<K, V> {
        TreeNode<K, V> parent;
        TreeNode<K, V> left;
        TreeNode<K, V> right;
        TreeNode<K, V> prev;
        boolean red;
        // ...
    }
    
    // 插入操作
    public V put(K key, V value) {
        return putVal(key, value, false);
    }
    
    final V putVal(K key, V value, boolean onlyIfAbsent) {
        if (key == null || value == null) throw new NullPointerException();
        int hash = spread(key.hashCode());
        int binCount = 0;
        for (Node<K, V>[] tab = table;;) {
            Node<K, V> f;
            int n, i, fh;
            if (tab == null || (n = tab.length) == 0)
                tab = initTable();
            else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
                if (casTabAt(tab, i, null, new Node<K, V>(hash, key, value, null)))
                    break;
            }
            else if ((fh = f.hash) == MOVED)
                tab = helpTransfer(tab, f);
            else {
                V oldVal = null;
                synchronized (f) {
                    if (tabAt(tab, i) == f) {
                        if (fh >= 0) {
                            binCount = 1;
                            for (Node<K, V> e = f;; ++binCount) {
                                K ek;
                                if (e.hash == hash && ((ek = e.key) == key || (ek != null && key.equals(ek)))) {
                                    oldVal = e.val;
                                    if (!onlyIfAbsent)
                                        e.val = value;
                                    break;
                                }
                                Node<K, V> pred = e;
                                if ((e = e.next) == null) {
                                    pred.next = new Node<K, V>(hash, key, value, null);
                                    break;
                                }
                            }
                        }
                        else if (f instanceof TreeBin) {
                            Node<K, V> p;
                            binCount = 2;
                            if ((p = ((TreeBin<K, V>)f).putTreeVal(hash, key, value)) != null) {
                                oldVal = p.val;
                                if (!onlyIfAbsent)
                                    p.val = value;
                            }
                        }
                    }
                }
                if (binCount != 0) {
                    if (binCount >= TREEIFY_THRESHOLD)
                        treeifyBin(tab, i);
                    if (oldVal != null)
                        return oldVal;
                    break;
                }
            }
        }
        addCount(1L, binCount);
        return null;
    }
    
    // 其他方法...
}
```

### 3.3 ConcurrentHashMap的核心特性

1. **无锁读取**：使用volatile关键字保证可见性，读取操作不需要加锁
2. **节点锁写入**：写入操作只对链表头或红黑树根节点加锁，减少锁竞争
3. **CAS初始化**：使用CAS操作初始化数组，避免并发初始化问题
4. **红黑树优化**：当链表长度超过8时，自动转换为红黑树，提高查询效率
5. **扩容协助**：支持多线程协助扩容，提高扩容效率

## 4. CopyOnWriteArrayList与CopyOnWriteArraySet

### 4.1 CopyOnWriteArrayList

CopyOnWriteArrayList是ArrayList的线程安全版本，基于Copy-On-Write机制实现。

#### 核心原理

```java
public class CopyOnWriteArrayList<E> implements List<E>, RandomAccess, Cloneable, Serializable {
    private transient volatile Object[] array;
    
    public boolean add(E e) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            Object[] elements = getArray();
            int len = elements.length;
            Object[] newElements = Arrays.copyOf(elements, len + 1);
            newElements[len] = e;
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
    
    public E get(int index) {
        return get(getArray(), index);
    }
    
    private E get(Object[] a, int index) {
        return (E) a[index];
    }
    
    // 其他方法...
}
```

#### 特性分析

- **读取无锁**：读取操作不需要加锁，性能高
- **写入加锁复制**：写入操作需要加锁，并复制整个数组，保证线程安全
- **弱一致性迭代器**：迭代器基于创建时的数组快照，不会抛出ConcurrentModificationException
- **空间开销大**：每次写入都需要复制数组，空间开销较大

### 4.2 CopyOnWriteArraySet

CopyOnWriteArraySet是Set接口的线程安全实现，内部使用CopyOnWriteArrayList存储元素。

```java
public class CopyOnWriteArraySet<E> extends AbstractSet<E> implements Serializable {
    private final CopyOnWriteArrayList<E> al;
    
    public CopyOnWriteArraySet() {
        al = new CopyOnWriteArrayList<E>();
    }
    
    public boolean add(E e) {
        return al.addIfAbsent(e);
    }
    
    // 其他方法...
}
```

## 5. ConcurrentSkipListMap与ConcurrentSkipListSet

### 5.1 ConcurrentSkipListMap

ConcurrentSkipListMap是TreeMap的线程安全版本，基于跳表（Skip List）数据结构实现，支持并发的插入、删除和查询操作。

#### 核心特性

- **有序性**：按照键的自然顺序或指定比较器排序
- **无锁设计**：使用CAS操作保证线程安全，避免锁竞争
- **O(log n)时间复杂度**：插入、删除、查询操作的平均时间复杂度为O(log n)
- **并发度高**：支持多个线程同时进行读写操作

```java
public class ConcurrentSkipListMap<K, V> extends AbstractMap<K, V>
        implements ConcurrentNavigableMap<K, V>, Serializable {
    
    // 跳表节点
    static final class Node<K, V> {
        final K key;
        volatile Object value;
        volatile Node<K, V> next;
        // ...
    }
    
    // 索引节点
    static class Index<K, V> {
        final Node<K, V> node;
        final Index<K, V> down;
        volatile Index<K, V> right;
        // ...
    }
    
    // 头索引
    private transient volatile HeadIndex<K, V> head;
    
    // 其他方法...
}
```

### 5.2 ConcurrentSkipListSet

ConcurrentSkipListSet是SortedSet接口的线程安全实现，内部使用ConcurrentSkipListMap存储元素。

```java
public class ConcurrentSkipListSet<E> extends AbstractSet<E> implements NavigableSet<E>, Serializable {
    private final ConcurrentNavigableMap<E, Object> m;
    private static final Object PRESENT = new Object();
    
    public ConcurrentSkipListSet() {
        m = new ConcurrentSkipListMap<E, Object>();
    }
    
    public boolean add(E e) {
        return m.put(e, PRESENT) == null;
    }
    
    // 其他方法...
}
```

## 6. ConcurrentLinkedQueue与ConcurrentLinkedDeque

### 6.1 ConcurrentLinkedQueue

ConcurrentLinkedQueue是基于链表的无界线程安全队列，遵循FIFO（先进先出）原则。

#### 核心实现

```java
public class ConcurrentLinkedQueue<E> extends AbstractQueue<E>
        implements Queue<E>, java.io.Serializable {
    
    private transient volatile Node<E> head;
    private transient volatile Node<E> tail;
    
    private static class Node<E> {
        volatile E item;
        volatile Node<E> next;
        // ...
    }
    
    public boolean offer(E e) {
        checkNotNull(e);
        final Node<E> newNode = new Node<E>(e);
        
        for (Node<E> t = tail, p = t;;) {
            Node<E> q = p.next;
            if (q == null) {
                if (p.casNext(null, newNode)) {
                    if (p != t)
                        casTail(t, newNode);
                    return true;
                }
            }
            else if (p == q)
                p = (t != (t = tail)) ? t : head;
            else
                p = (p != t && t != (t = tail)) ? t : q;
        }
    }
    
    // 其他方法...
}
```

#### 特性分析

- **无锁设计**：使用CAS操作实现线程安全，避免锁竞争
- **无界队列**：队列大小可以无限增长
- **弱一致性**：迭代器基于创建时的队列快照，可能不反映最新变化

### 6.2 ConcurrentLinkedDeque

ConcurrentLinkedDeque是基于双向链表的无界线程安全双端队列，支持在两端进行插入和删除操作。

## 7. LinkedBlockingQueue与ArrayBlockingQueue

### 7.1 LinkedBlockingQueue

LinkedBlockingQueue是基于链表的有界或无界阻塞队列。

#### 核心实现

```java
public class LinkedBlockingQueue<E> extends AbstractQueue<E>
        implements BlockingQueue<E>, java.io.Serializable {
    
    private final int capacity;
    private final AtomicInteger count = new AtomicInteger();
    transient Node<E> head;
    private transient Node<E> last;
    private final ReentrantLock takeLock = new ReentrantLock();
    private final Condition notEmpty = takeLock.newCondition();
    private final ReentrantLock putLock = new ReentrantLock();
    private final Condition notFull = putLock.newCondition();
    
    static class Node<E> {
        E item;
        Node<E> next;
        Node(E x) { item = x; }
    }
    
    public void put(E e) throws InterruptedException {
        if (e == null) throw new NullPointerException();
        int c = -1;
        Node<E> node = new Node<E>(e);
        final ReentrantLock putLock = this.putLock;
        final AtomicInteger count = this.count;
        putLock.lockInterruptibly();
        try {
            while (count.get() == capacity)
                notFull.await();
            enqueue(node);
            c = count.getAndIncrement();
            if (c + 1 < capacity)
                notFull.signal();
        } finally {
            putLock.unlock();
        }
        if (c == 0)
            signalNotEmpty();
    }
    
    public E take() throws InterruptedException {
        E x;
        int c = -1;
        final AtomicInteger count = this.count;
        final ReentrantLock takeLock = this.takeLock;
        takeLock.lockInterruptibly();
        try {
            while (count.get() == 0)
                notEmpty.await();
            x = dequeue();
            c = count.getAndDecrement();
            if (c > 1)
                notEmpty.signal();
        } finally {
            takeLock.unlock();
        }
        if (c == capacity)
            signalNotFull();
        return x;
    }
    
    // 其他方法...
}
```

#### 特性分析

- **锁分离**：读写操作使用不同的锁，提高并发度
- **可选有界**：默认无界，也可以指定容量
- **阻塞操作**：支持put、take等阻塞方法
- **FIFO**：遵循先进先出原则

### 7.2 ArrayBlockingQueue

ArrayBlockingQueue是基于数组的有界阻塞队列。

#### 核心实现

```java
public class ArrayBlockingQueue<E> extends AbstractQueue<E>
        implements BlockingQueue<E>, java.io.Serializable {
    
    final Object[] items;
    int takeIndex;
    int putIndex;
    int count;
    final ReentrantLock lock;
    private final Condition notEmpty;
    private final Condition notFull;
    
    public ArrayBlockingQueue(int capacity) {
        this(capacity, false);
    }
    
    public ArrayBlockingQueue(int capacity, boolean fair) {
        if (capacity <= 0)
            throw new IllegalArgumentException();
        this.items = new Object[capacity];
        lock = new ReentrantLock(fair);
        notEmpty = lock.newCondition();
        notFull = lock.newCondition();
    }
    
    public void put(E e) throws InterruptedException {
        checkNotNull(e);
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
            while (count == items.length)
                notFull.await();
            enqueue(e);
        } finally {
            lock.unlock();
        }
    }
    
    public E take() throws InterruptedException {
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
            while (count == 0)
                notEmpty.await();
            return dequeue();
        } finally {
            lock.unlock();
        }
    }
    
    // 其他方法...
}
```

#### 特性分析

- **单锁设计**：读写操作使用同一个锁，简单但并发度较低
- **有界队列**：必须指定容量，队列大小固定
- **支持公平性**：可以指定是否使用公平锁，影响线程调度顺序
- **FIFO**：遵循先进先出原则

## 8. DelayQueue与PriorityBlockingQueue

### 8.1 DelayQueue

DelayQueue是基于PriorityQueue的延迟队列，元素只有在延迟时间到期后才能被取出。

#### 核心实现

```java
public class DelayQueue<E extends Delayed> extends AbstractQueue<E>
        implements BlockingQueue<E> {
    
    private final PriorityQueue<E> q;
    private final transient ReentrantLock lock = new ReentrantLock();
    private final Condition available = lock.newCondition();
    
    public E take() throws InterruptedException {
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
            for (;;) {
                E first = q.peek();
                if (first == null)
                    available.await();
                else {
                    long delay = first.getDelay(TimeUnit.NANOSECONDS);
                    if (delay <= 0)
                        return q.poll();
                    first = null; // 释放引用，避免内存泄漏
                    if (leader != null)
                        available.await();
                    else {
                        Thread thisThread = Thread.currentThread();
                        leader = thisThread;
                        try {
                            available.awaitNanos(delay);
                        } finally {
                            if (leader == thisThread)
                                leader = null;
                        }
                    }
                }
            }
        } finally {
            if (leader == null && q.peek() != null)
                available.signal();
            lock.unlock();
        }
    }
    
    // 其他方法...
}
```

#### 应用场景

- **任务调度**：延迟执行任务
- **缓存清理**：自动清理过期缓存
- **超时处理**：处理超时请求

### 8.2 PriorityBlockingQueue

PriorityBlockingQueue是基于堆的无界优先级阻塞队列。

#### 核心特性

- **无界队列**：队列大小可以无限增长
- **优先级排序**：元素按照自然顺序或指定比较器排序
- **线程安全**：使用锁保证线程安全
- **阻塞获取**：当队列为空时，take操作会阻塞

## 9. SynchronousQueue

SynchronousQueue是一个特殊的无界阻塞队列，不存储任何元素，每个put操作必须等待一个take操作，反之亦然。

### 核心实现

```java
public class SynchronousQueue<E> extends AbstractQueue<E>
        implements BlockingQueue<E>, java.io.Serializable {
    
    private final Transferer<E> transferer;
    
    public SynchronousQueue() {
        this(false);
    }
    
    public SynchronousQueue(boolean fair) {
        transferer = fair ? new TransferQueue<E>() : new TransferStack<E>();
    }
    
    public void put(E e) throws InterruptedException {
        if (e == null) throw new NullPointerException();
        if (transferer.transfer(e, false, 0) == null) {
            Thread.interrupted();
            throw new InterruptedException();
        }
    }
    
    public E take() throws InterruptedException {
        E e = transferer.transfer(null, false, 0);
        if (e != null)
            return e;
        Thread.interrupted();
        throw new InterruptedException();
    }
    
    // 其他方法...
}
```

### 应用场景

- **线程间直接传递数据**：生产者直接将数据传递给消费者
- **线程池**：Executors.newCachedThreadPool()内部使用SynchronousQueue
- **任务提交**：提交任务给工作线程执行

## 10. 并发集合类的选择与最佳实践

### 10.1 选择指南

| 场景 | 推荐集合类 |
|------|------------|
| 高并发读写Map | ConcurrentHashMap |
| 高并发读、低并发写List | CopyOnWriteArrayList |
| 高并发读写队列 | ConcurrentLinkedQueue/ConcurrentLinkedDeque |
| 有界阻塞队列 | ArrayBlockingQueue/LinkedBlockingQueue |
| 无界阻塞队列 | LinkedBlockingQueue |
| 优先级队列 | PriorityBlockingQueue |
| 延迟队列 | DelayQueue |
| 直接传递队列 | SynchronousQueue |
| 有序Map/Set | ConcurrentSkipListMap/ConcurrentSkipListSet |

### 10.2 最佳实践

1. **根据读写比例选择**：
   - 读多写少：选择CopyOnWriteArrayList、ConcurrentHashMap
   - 读写均衡：选择ConcurrentLinkedQueue、ArrayBlockingQueue

2. **避免频繁扩容**：
   - 为有界队列设置合理的初始容量
   - 为ConcurrentHashMap设置适当的初始容量

3. **合理使用迭代器**：
   - 并发集合类的迭代器是弱一致性的，不保证反映最新变化
   - 避免在迭代过程中修改集合（CopyOnWriteArrayList除外）

4. **注意内存开销**：
   - CopyOnWrite系列集合在频繁写入时会产生大量临时对象
   - 无界队列可能导致内存溢出，应根据实际情况设置合理的容量

5. **优先使用并发集合而非同步包装**：

   ```java
   // 不推荐
   List<String> syncList = Collections.synchronizedList(new ArrayList<>());
   
   // 推荐
   List<String> concurrentList = new CopyOnWriteArrayList<>();
   ```

## 11. 总结

Java并发集合类为多线程环境提供了高效、安全的数据结构，通过各种优化技术（如锁分离、无锁算法、Copy-On-Write等）提高了并发性能。在实际应用中，应根据具体的业务场景和性能要求选择合适的并发集合类，以达到最佳的性能和可靠性。

了解和掌握这些并发集合类的实现原理和使用方法，对于编写高效、安全的并发程序至关重要。在后续的学习中，我们将深入探讨更多Java并发编程的高级主题，如并发设计模式、性能优化等。

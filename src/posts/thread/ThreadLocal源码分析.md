---
isOriginal: true
title: ThreadLocal源码分析
tag:
  - thread
category: 源码
date: 2020-04-13
description: ThreadLocal源码
sticky: false
timeline: true
article: true
star: true
---

> 当多个线程同时使用共享变量时, 容易出现线程问题. ThreadLocal的作用是让每个线程访问各自的变量值. 这篇文章可能过于硬核, 我会尽量分析的详细些.

## 一个例子

```java
public class ThreadLocalTest {

    private static ThreadLocal<Integer> threadLocalInteger = new ThreadLocal<>();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            threadLocalInteger.set(100);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("t1: " + threadLocalInteger.get());
        }, "t1");
        Thread t2 = new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("t2: " + threadLocalInteger.get());
        }, "t2");

        t1.start();
        t2.start();
    }
}
```

这个例子中我们创建了一个`threadLocalInteger`共享变量. 之后线程t1通过set方法设置其当前现成的变量, 线程t1和线程t2都可以通过get方式取出.

实际运行结果如下:
t2: null
t1: 100

可以看到线程之前是不产生影响的. 接下来通过源码分析一下原因.

## ThreadLocal的实例化

ThreadLocal只有一个无参构造方法:

```java
    public ThreadLocal() {
    }
```

因此直接通过new就可以创建对象.

## ThreadLocal的set逻辑

通过set可以给当前线程设置变量值. 注意变量类型和泛型一致.

```java
    public void set(T value) {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
    }
```

```java
    ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
    }
```

首先获取当前线程的`ThreadLocalMap`对象.

`threadLocals`定义为`ThreadLocal.ThreadLocalMap threadLocals = null;`注意它是定义在`Thread`中的, 但是由`ThreadLocal`进行维护.

如果`ThreadLocalMap`对象存在则直接调用它的set方法, 否则使用`createMap`创建一个.

### ThreadLocalMap

```java
    void createMap(Thread t, T firstValue) {
        t.threadLocals = new ThreadLocalMap(this, firstValue);
    }

    ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
        table = new Entry[INITIAL_CAPACITY];
        int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1);
        table[i] = new Entry(firstKey, firstValue);
        size = 1;
        setThreshold(INITIAL_CAPACITY);
    }

    static class Entry extends WeakReference<ThreadLocal<?>> {
        /** The value associated with this ThreadLocal. */
        Object value;

        Entry(ThreadLocal<?> k, Object v) {
            super(k);
            value = v;
        }
    }
```

`ThreadLocalMap`和`HashMap`在设计上有些类似, `ThreadLocalMap`内部使用`Entry`数组去维护当前线程上的所有`ThreadLocal`. 当向map中添加的时候, 为了确定应该要添加到什么位置上通过hash值对数组长度取模方式进行.
`Entity`的key使用当前ThreadLocal对象, value为set的时候设置的值.

注意创建`ThreadLocalMap`是非常重要的, 而且只要创建一次就好. 只有有了这个map我们才能维护线程的Entry[].
之后有其他`ThreadLocal`的话, 直接使用已经创建的map进行处理就好了. 而且第一次创建, 并存放Entry的时候, 不用担心hash冲突. 而之后添加都要考虑.

### ThreadLocalMap的set方法

没有`ThreadLocalMap`, 我们就无法直接调用这个方法, 必须通过`createMap`创建,
有了`ThreadLocalMap`, 就可以愉快地进行一系列变量操作了.

下面看看`set`的逻辑:

```java
    private void set(ThreadLocal<?> key, Object value) {

        Entry[] tab = table;
        int len = tab.length;
        int i = key.threadLocalHashCode & (len-1);

        for (Entry e = tab[i];
                e != null;
                e = tab[i = nextIndex(i, len)]) {
            ThreadLocal<?> k = e.get();

            if (k == key) {
                e.value = value;
                return;
            }

            if (k == null) {
                replaceStaleEntry(key, value, i);
                return;
            }
        }

        tab[i] = new Entry(key, value);
        int sz = ++size;
        if (!cleanSomeSlots(i, sz) && sz >= threshold)
            rehash();
    }

    private static int nextIndex(int i, int len) {
        return ((i + 1 < len) ? i + 1 : 0);
    }
```

一般我们的`threadlocal`就在其hash取模(`key.threadLocalHashCode & (len-1)`)的位置上.
但是由于hash冲突的存在(不同threadlocal的取模结果相同), 因此我们不能直接把`threadlocal`放到取模值的位置上. 否则不同的`threadlocal`就互相覆盖了.

因此, 上面代码的for循环的理念就在于, 循环数组找到一个空位存放冲突的`threadlocal`.

继续看一下循环内部的逻辑:

如果当前循环到的节点的key与要存放的`threadlocal`相同(地址相同), 那么就相当于一个更新值的操作.
如果循环的节点key不存在了, 那么就执行`replaceStaleEntry`, 将`threadlocal`的值替换到这个位置上. 之后我们聊一聊为什么会出现key没了这种情形.

### 失活节点替换

下面继续看看`replaceStaleEntry`:

```java
    private void replaceStaleEntry(ThreadLocal<?> key, Object value,
                                    int staleSlot) {
        Entry[] tab = table;
        int len = tab.length;
        Entry e;

        int slotToExpunge = staleSlot;
        for (int i = prevIndex(staleSlot, len);
                (e = tab[i]) != null;
                i = prevIndex(i, len))
            if (e.get() == null)
                slotToExpunge = i;

        for (int i = nextIndex(staleSlot, len);
                (e = tab[i]) != null;
                i = nextIndex(i, len)) {
            ThreadLocal<?> k = e.get();

            if (k == key) {
                e.value = value;

                tab[i] = tab[staleSlot];
                tab[staleSlot] = e;

                if (slotToExpunge == staleSlot)
                    slotToExpunge = i;
                cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
                return;
            }

            if (k == null && slotToExpunge == staleSlot)
                slotToExpunge = i;
        }

        tab[staleSlot].value = null;
        tab[staleSlot] = new Entry(key, value);

        if (slotToExpunge != staleSlot)
            cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
    }
```

现在我们约定几个概念吧(相当于代号, 当然只是我这么叫, 只是为了简化描述)

失活: Entry数组的某一个节点对象存在但是它的key为null的状态
失活节点: 一个Entry数组上失活状态的对象
有效: Entry数组的某一个节点对象存在但是它的key不为null的状态(相对于失活来说的)
有效节点: 一个Entry数组上有效状态的对象
空节点: Entry数组上的一个null对象

首先我们明确一下这个方法的执行前提: 遍历Entry[]发现了`staleSlot`位置上节点失活. 传入参数为: 当前`threadlocal`, 设置的`value`, `staleSlot`为失活的位置.

第一个循环从`staleSlot`的前一个节点向前检测有没有失活节点产生, 如果出现了失活节点. 则将该位置用`slotToExpunge`标记, 直到遍历到下一个空节点. 之前外层循环(向后循环)的时候, 虽然有些节点为有效状态, 但是由于弱引用和gc的存在, 我们不确定key在什么时候被回收掉. 如果不处理的话, 在`staleSlot`位置之前的节点失活就无法被发现(只是说失去了这段前向搜索的代码).

然后看第二个循环, 从`staleSlot`后面的节点开始检测,
如果发现后面的节点和当前线程的threadlocal相同, 则交换后面的节点和`staleSlot`上的节点, 并将最新的value设置到`staleSlot`节点上, 这样就完成了替换.
完成上面的交换后, 失活节点位置发生了变化, 因此要重新设置`slotToExpunge`为后面节点的索引.

因为有失活节点的存在, 我们在退出之前要进行一次节点的整理工作. `cleanSomeSlots(expungeStaleEntry(slotToExpunge), len)`这个方法你知道是从一个失活节点位置开始整理整个数组就好了. 最后我们在说一下这两个方法.

如果每次遍历key不相同, 则判断当前节点是否失活, `slotToExpunge`相比于初始失活点位是否发生变化, 如果两个条件都成立则需要设置`slotToExpunge`为当前节点索引.

上面的两个for循环结束之后, 如果节点没有替换(即不是更新操作, 更大胆的说即threadlocal不连续调用set), 则直接设置原先的value对象为null, 并新生成一个对象Entry放到`staleSlot`上, 这样之前的失活点位有有效了.

这里多次一举设置value为null其实是为了gc回收内存的, 因为value为强引用, 他不向key一样当内存不够时能够回收. 因此还是非常有用的.

之后如果失活点位(`slotToExpunge`)发生变化, 也就是和说有其他失活点位, 那么我们就要进行一次整理工作.
如果相等, 就说明只有这一个地方失活, 而此处失活部分我们已经重新生成对象, 让其起死回生了. 因此没有必要多此一举去掉条件进行回收. 每次都要回收log2n次, 复杂度为nlog2(n), 随着数组长度越长, 扫描成本会大大增加.

`replaceStaleEntry`这个方法完成了失活节点的替换和数组的整理工作.
具体替换体现在两个地方:

1. 乾坤大挪移: 如果之前已经在Entry_A位置上设置了threadlocal, 则更新这个Entry_A的value. 并将对象放到失活位置上. Entry_A变为失活.
2. 起死回生术: 如果是新设置的threadlocal, 则直接重新生成Entry放到失活节点位置.

你会在很多循环的地方看到对key==null的判断, key失活意味着有些threadlocal已经弃用了, 我们需要及时将这些无用内存占用处理掉, 因此也就不难理解为什么动不动就要判断就要clean, expunge了.

好了`replaceStaleEntry`就是以上.

回过头, 我们看继续看set中for循环之后的逻辑. 此时的i位置对应的节点为空, 那么我们就直接生成一个Entry, 放到这个点位就好了.

设置新的节点后要累计size记录Entry数量. 并进行数组的整理, 如果没有失活节点被移除并且容量超出阈值, 也就是还说快没有位置放东西了. 就进行一次扩容操作.

注意这个阈值不是数组长度, 而是长度的2/3:

```java
    private void setThreshold(int len) {
        threshold = len * 2 / 3;
    }
```

## 扩容逻辑

下面看一下扩容的逻辑:

```java
    private void rehash() {
        expungeStaleEntries();

        // Use lower threshold for doubling to avoid hysteresis
        if (size >= threshold - threshold / 4)
            resize();
    }

    private void expungeStaleEntries() {
        Entry[] tab = table;
        int len = tab.length;
        for (int j = 0; j < len; j++) {
            Entry e = tab[j];
            if (e != null && e.get() == null)
                expungeStaleEntry(j);
        }
    }

    private void resize() {
        Entry[] oldTab = table;
        int oldLen = oldTab.length;
        int newLen = oldLen * 2;
        Entry[] newTab = new Entry[newLen];
        int count = 0;

        for (int j = 0; j < oldLen; ++j) {
            Entry e = oldTab[j];
            if (e != null) {
                ThreadLocal<?> k = e.get();
                if (k == null) {
                    e.value = null; // Help the GC
                } else {
                    int h = k.threadLocalHashCode & (newLen - 1);
                    while (newTab[h] != null)
                        h = nextIndex(h, newLen);
                    newTab[h] = e;
                    count++;
                }
            }
        }

        setThreshold(newLen);
        size = count;
        table = newTab;
    }
```

首先调用`expungeStaleEntries`清理所有失活节点. 可以看到这个方法的逻辑是: 遍历数组找到失活的节点后, 调用`expungeStaleEntry`进行处理.

如果数组长度超出阈值0.75则进行扩容. 0.75的值取的时候是获取上限. 可以参考下图:
![2020-04-13-23-12-51](http://dewy-blog.nikolazh.eu.org/2020-04-13-23-12-51.png)

扩容逻辑见下:

首先直接创建一个新的Entry[], 其长度为目前长度的2倍.
之后遍历原来的数组, 判断节点是否为null.
如果不是则判断key是否失效, 如果失效则设置value为null, 进行gc回收.
如果没有失效则将key对新的数组长度取模, 并且使用线性探测确定节点应该放到新的数组的什么位置上. 每成功转移一个, 注意不是创建新的Entry对象. 就累计count.
最后, 重新设置阈值(使用的数组长度). 重新设置size(有效key), 重新设置Entry[] table.

## get方法

已经知道了设置value的方法, 获取当前线程中的变量就很好理解了.

```java
    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        return setInitialValue();
    }

    ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
    }

    private Entry getEntry(ThreadLocal<?> key) {
        int i = key.threadLocalHashCode & (table.length - 1);
        Entry e = table[i];
        if (e != null && e.get() == key)
            return e;
        else
            return getEntryAfterMiss(key, i, e);
    }

    private T setInitialValue() {
        T value = initialValue();
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
        return value;
    }
    protected T initialValue() {
        return null;
    }
```

首先`Thread.currentThread()`获取当前线程对象, 之后调用`getMap`获取当前线程对应的`ThreadLocalMap`.
`ThreadLocalMap`如果存在使用其下的`getEntry`方法获取当前`threadlocal`对应的`Entry`. `Entry`存在则返回其value即可.

如果`Entry`或者`ThreadLocalMap`不存在, 则`setInitialValue`设置当前的`threadlocal`对应的值为`null`, 并返回.

下面的我们看看`getEntry`的逻辑:

1. 获取`threadlocal`的hashcode对数组长度取模后, 在数组中的位置.
2. 判断该位置上的Entry是否为空, 其key为`threadlocal`
3. 如果条件成立说明当前`Entry`就是`threadlocal`对应的`Entry`
4. 如果2中条件不成立, 我们是无法直接确定其他位置上是否有与`threadlocal`对应的`Entry`的(根本原因在于hashcode冲突, 以及线性探测这种解决方案导致的), 因此需要`getEntryAfterMiss`进行处理

下面看`getEntryAfterMiss`的逻辑

```java
    private Entry getEntryAfterMiss(ThreadLocal<?> key, int i, Entry e) {
        Entry[] tab = table;
        int len = tab.length;

        while (e != null) {
            ThreadLocal<?> k = e.get();
            if (k == key)
                return e;
            if (k == null)
                expungeStaleEntry(i);
            else
                i = nextIndex(i, len);
            e = tab[i];
        }
        return null;
    }
```

上面这段代码的关键在于循环部分. 主要是循环判断`e.get()`是否与`threadlocal`一致.
`expungeStaleEntry`这段逻辑我们之后再说.

## remove方法

注意使用完threadlocal之后要将其remove. 删除逻辑见下:

```java
    public void remove() {
        ThreadLocalMap m = getMap(Thread.currentThread());
        if (m != null)
            m.remove(this);
    }

    private void remove(ThreadLocal<?> key) {
        Entry[] tab = table;
        int len = tab.length;
        int i = key.threadLocalHashCode & (len-1);
        for (Entry e = tab[i];
                e != null;
                e = tab[i = nextIndex(i, len)]) {
            if (e.get() == key) {
                e.clear();
                expungeStaleEntry(i);
                return;
            }
        }
    }

    public void clear() {
        this.referent = null;
    }

```

使用`getMap`获取当前线程的`ThreadLocalMap`, 如果不为空则直接执行其下的`remove`方法;

`ThreadLocalMap`的`remove`的逻辑是:

获取当前`threadlocal`的取模值, 从这个位置开始遍历数组.

如果key和`threadlocal`相同则调用`clear()`. 这个`clear`是`Referce`的方法. 效果是将key设置为null.

当一个key失效了, 按照之前的套路, 我们就要整理一下数组了.

## expungeStaleEntry

相信`expungeStaleEntry`一定是一个非常勤劳的方法. 因为这篇文章从开始到结束, 出现了好多次它的身影.

下面我们就看一下这个方法的逻辑:

```java
    private int expungeStaleEntry(int staleSlot) {
        Entry[] tab = table;
        int len = tab.length;

        tab[staleSlot].value = null;
        tab[staleSlot] = null;
        size--;

        Entry e;
        int i;
        for (i = nextIndex(staleSlot, len);
                (e = tab[i]) != null;
                i = nextIndex(i, len)) {
            ThreadLocal<?> k = e.get();
            if (k == null) {
                e.value = null;
                tab[i] = null;
                size--;
            } else {
                int h = k.threadLocalHashCode & (len - 1);
                if (h != i) {
                    tab[i] = null;

                    while (tab[h] != null)
                        h = nextIndex(h, len);
                    tab[h] = e;
                }
            }
        }
        return i;
    }
```

方法传入的参数是某个失活节点的索引.
输出的结果是数组中失活节点后的第一个出现空节点位置. 注意可能和刚开始调用的时候的值不同.

1. 清理`staleSlot`上失活的节点, 设置value, entry为null, 有效节点自减.
2. 之后从失活节点的下一个节点开始遍历. 如果出现失活就重复1中的操作只不过是清除当前位置上的.
3. 如果节点没有失活, 则判断是否hashCode取模和索引相同, 不相同则重新放置. 主要还是想让众神归位. 但是对于后面的节点占用了索引就只能线性探测找到空节点放置了. 这也就是我说不能在方法调用前确定返回值的原因. 因为你`tab[h] != null`是可能为false的. `tab[h] = e`后, 空节点就非空了.
4. 当出现空节点的时候循环退出, 方法返回这个空节点索引.

再看看`cleanSomeSlots`吧:

```java
    private boolean cleanSomeSlots(int i, int n) {
        boolean removed = false;
        Entry[] tab = table;
        int len = tab.length;
        do {
            i = nextIndex(i, len);
            Entry e = tab[i];
            if (e != null && e.get() == null) {
                n = len;
                removed = true;
                i = expungeStaleEntry(i);
            }
        } while ( (n >>>= 1) != 0);
        return removed;
    }
```

`cleanSomeSlots`主要目的是如果出现了失活节点则进行`expungeStaleEntry`, 没有出现失活则循环log2n (`n >>>= 1`的作用就是每次折半, 相当于对数)次结束.
这里没什么好说的.

## 总结

最后两张图描述一下Thread, ThreadLocal, ThreadLocalMap, Entry的关系, 以及数据的存取方式

![2020-04-12-17-55-03](http://dewy-blog.nikolazh.eu.org/2020-04-12-17-55-03.png)

从类的结构上来说:
ThreadLocalMap是Thread的成员变量, 是ThreadLocal的内部类.
Entry是ThreadLocalMap的内部类.
ThreadLocalMap中维护了Entry[];
并且Entry是继承了弱引用，具体来说是将key交给了弱引用.

从代码逻辑上来说:
每一个线程都含有ThreadLocalMap, 因此虽然ThreadLocal对象是一个共享变量, 
但是设置ThreadLocal的值的时候是设置到当前线程的ThreadLocalMap的Entry中的.
因此不同的线程有不同的ThreadLocalMap自然就维护了相同threadLocal的不同值.

值不同的根本原因是不同线程的Entry中的相同key(threadLocal)对应的value是不同的.

自然我们获取的时候每个线程从各自的ThreadLocalMap中获取Entry中value的结果自然是不同的.

你可以参考下图进行理解上面的话.
![2020-04-12-20-54-49](http://dewy-blog.nikolazh.eu.org/2020-04-12-20-54-49.png)

说实话, 线程安全这种东西本身就不是容易去理解. 如果有什么不对的地方或者有更好的理解, 欢迎各位大佬留言分享.

以后如果有一些新的想法会继续分享, 感谢关注.

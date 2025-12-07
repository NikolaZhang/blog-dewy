---
isOriginal: true
title: Java死锁检测与调试实战
tag:
  - thread
  - 死锁
  - 调试
  - 并发编程
category: thread
date: 2024-01-22
icon: coffee
description: 实战解析Java死锁的检测、调试和避免方法
sticky: false
timeline: true
article: true
star: false
---

## 一、死锁的基本概念

### 1.1 什么是死锁

死锁是指两个或多个线程在执行过程中，因争夺资源而造成的一种互相等待的现象。当线程处于这种状态时，若无外力作用，它们都将无法继续执行下去。

### 1.2 死锁的危害

死锁会导致以下几个主要问题：

1. **线程资源浪费**：死锁的线程会占用系统资源，但无法完成任何工作。
2. **系统性能下降**：随着死锁线程数量的增加，系统性能会逐渐下降。
3. **应用程序无响应**：在严重情况下，死锁可能导致整个应用程序无响应。
4. **难以诊断和修复**：死锁问题通常难以诊断和修复，需要专业的工具和经验。

## 二、死锁的产生条件

死锁的产生需要同时满足以下四个条件，称为死锁的必要条件：

### 2.1 互斥条件

资源不能被多个线程同时使用，即一个资源每次只能被一个线程占用。

### 2.2 请求与保持条件

线程已经保持了至少一个资源，但又提出了新的资源请求，而该资源已被其他线程占用，此时请求线程阻塞，但不释放已持有的资源。

### 2.3 不剥夺条件

线程已获得的资源，在未使用完之前，不能被其他线程强行剥夺，只能由获得该资源的线程自己释放。

### 2.4 循环等待条件

若干线程之间形成一种头尾相接的循环等待资源关系。

## 三、死锁的示例代码

### 3.1 简单死锁示例

下面是一个简单的死锁示例代码：

```java
public class DeadLockExample {
    private static final Object resource1 = new Object();
    private static final Object resource2 = new Object();

    public static void main(String[] args) {
        // 线程1：先获取resource1，再获取resource2
        Thread thread1 = new Thread(() -> {
            synchronized (resource1) {
                System.out.println("线程1：已获取资源1");
                try {
                    // 模拟线程1执行一些操作
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("线程1：尝试获取资源2");
                synchronized (resource2) {
                    System.out.println("线程1：已获取资源2");
                }
            }
        });

        // 线程2：先获取resource2，再获取resource1
        Thread thread2 = new Thread(() -> {
            synchronized (resource2) {
                System.out.println("线程2：已获取资源2");
                try {
                    // 模拟线程2执行一些操作
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("线程2：尝试获取资源1");
                synchronized (resource1) {
                    System.out.println("线程2：已获取资源1");
                }
            }
        });

        // 启动线程
        thread1.start();
        thread2.start();
    }
}
```

### 3.2 运行结果

```plaintext
线程1：已获取资源1
线程2：已获取资源2
线程1：尝试获取资源2
线程2：尝试获取资源1
```

运行上述代码后，程序会一直处于运行状态，不会正常结束，因为两个线程已经进入死锁状态。

## 四、死锁的检测方法

### 4.1 JStack工具

JStack是JDK提供的一个命令行工具，可以用于生成Java虚拟机当前时刻的线程快照。线程快照是当前Java虚拟机内每一条线程正在执行的方法堆栈的集合，生成线程快照的主要目的是定位线程出现长时间停顿的原因，如线程间死锁、死循环、请求外部资源导致的长时间等待等。

#### 4.1.1 使用JStack检测死锁

1. **获取进程ID**：首先需要获取Java进程的ID，可以使用`jps`命令。

    ```bash
    jps -l
    ```

2. **生成线程快照**：使用`jstack`命令生成线程快照。

    ```bash
    jstack -l <pid> > thread_dump.txt
    ```

3. **分析线程快照**：打开生成的`thread_dump.txt`文件，查找是否存在死锁信息。

#### 4.1.2 JStack死锁检测结果示例

```plaintext
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007f9e0c0078c8 (object 0x000000076ab8b548, a java.lang.Object),
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x00007f9e0c005398 (object 0x000000076ab8b558, a java.lang.Object),
  which is held by "Thread-1"

Java stack information for the threads listed above:
==================================================
"Thread-1":
        at com.example.DeadLockExample.lambda$main$1(DeadLockExample.java:38)
        - waiting to lock <0x000000076ab8b548> (a java.lang.Object)
        - locked <0x000000076ab8b558> (a java.lang.Object)
        at com.example.DeadLockExample$$Lambda$2/1096979270.run(Unknown Source)
        at java.lang.Thread.run(Thread.java:748)
"Thread-0":
        at com.example.DeadLockExample.lambda$main$0(DeadLockExample.java:22)
        - waiting to lock <0x000000076ab8b558> (a java.lang.Object)
        - locked <0x000000076ab8b548> (a java.lang.Object)
        at com.example.DeadLockExample$$Lambda$1/1324119927.run(Unknown Source)
        at java.lang.Thread.run(Thread.java:748)

Found 1 deadlock.
```

### 4.2 JConsole工具

JConsole是JDK提供的一个图形化监控工具，可以用于监控Java应用程序的运行状态，包括线程状态、内存使用情况、CPU使用率等。

#### 4.2.1 使用JConsole检测死锁

1. **启动JConsole**：在命令行中输入`jconsole`命令。

2. **连接到Java进程**：在JConsole的连接窗口中选择要监控的Java进程，点击"连接"按钮。

3. **查看线程状态**：在JConsole的主界面中点击"线程"标签页，查看当前所有线程的状态。

4. **检测死锁**：点击"检测死锁"按钮，JConsole会自动检测是否存在死锁，并显示死锁线程的详细信息。

### 4.3 VisualVM工具

VisualVM是JDK提供的一个功能强大的可视化监控和调试工具，可以用于监控Java应用程序的运行状态、分析内存使用情况、生成线程快照等。

#### 4.3.1 使用VisualVM检测死锁

1. **启动VisualVM**：在命令行中输入`jvisualvm`命令。

2. **连接到Java进程**：在VisualVM的左侧面板中选择要监控的Java进程。

3. **查看线程状态**：在右侧面板中点击"线程"标签页，查看当前所有线程的状态。

4. **检测死锁**：如果存在死锁，VisualVM会自动在"线程"标签页中显示死锁信息，并提供详细的分析报告。

### 4.4 程序内部检测

除了使用外部工具外，还可以在程序内部实现死锁检测机制。Java提供了`ThreadMXBean`接口，可以用于获取线程的相关信息，包括死锁信息。

#### 4.4.1 程序内部死锁检测示例

```java
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class DeadLockDetector {
    private final ThreadMXBean threadMXBean;
    private final ScheduledExecutorService executorService;

    public DeadLockDetector() {
        this.threadMXBean = ManagementFactory.getThreadMXBean();
        this.executorService = Executors.newScheduledThreadPool(1);
    }

    public void startDetection(long interval, TimeUnit timeUnit) {
        executorService.scheduleAtFixedRate(() -> {
            long[] deadlockedThreads = threadMXBean.findDeadlockedThreads();
            if (deadlockedThreads != null && deadlockedThreads.length > 0) {
                System.out.println("检测到死锁！");
                ThreadInfo[] threadInfos = threadMXBean.getThreadInfo(deadlockedThreads);
                for (ThreadInfo threadInfo : threadInfos) {
                    System.out.println("死锁线程：" + threadInfo.getThreadName());
                    System.out.println("线程状态：" + threadInfo.getThreadState());
                    System.out.println("等待锁：" + threadInfo.getLockName());
                    System.out.println("持有锁：" + threadInfo.getLockedMonitors());
                    System.out.println("调用栈：");
                    StackTraceElement[] stackTrace = threadInfo.getStackTrace();
                    for (StackTraceElement element : stackTrace) {
                        System.out.println("    " + element.toString());
                    }
                    System.out.println();
                }
            } else {
                System.out.println("未检测到死锁。");
            }
        }, 0, interval, timeUnit);
    }

    public void stopDetection() {
        executorService.shutdown();
        try {
            executorService.awaitTermination(1, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        // 创建死锁检测器
        DeadLockDetector detector = new DeadLockDetector();
        // 每5秒检测一次死锁
        detector.startDetection(5, TimeUnit.SECONDS);

        // 创建死锁示例
        Object resource1 = new Object();
        Object resource2 = new Object();

        // 线程1
        Thread thread1 = new Thread(() -> {
            synchronized (resource1) {
                System.out.println("线程1：已获取资源1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                synchronized (resource2) {
                    System.out.println("线程1：已获取资源2");
                }
            }
        }, "Thread-1");

        // 线程2
        Thread thread2 = new Thread(() -> {
            synchronized (resource2) {
                System.out.println("线程2：已获取资源2");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                synchronized (resource1) {
                    System.out.println("线程2：已获取资源1");
                }
            }
        }, "Thread-2");

        // 启动线程
        thread1.start();
        thread2.start();

        // 等待一段时间后停止检测
        try {
            Thread.sleep(30000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        detector.stopDetection();
    }
}
```

## 五、死锁的调试工具

### 5.1 JStack

JStack工具已经在前面介绍过，它是一个命令行工具，可以生成线程快照，帮助分析死锁问题。

### 5.2 JConsole

JConsole是一个图形化监控工具，可以实时监控Java应用程序的运行状态，包括线程状态、内存使用情况等。

### 5.3 VisualVM

VisualVM是一个功能强大的可视化监控和调试工具，可以用于监控Java应用程序的运行状态、分析内存使用情况、生成线程快照等。

### 5.4 Async Profiler

Async Profiler是一个低开销的Java性能分析工具，可以用于分析CPU使用情况、内存分配情况、锁竞争情况等。

#### 5.4.1 使用Async Profiler分析锁竞争

1. **下载Async Profiler**：从GitHub上下载Async Profiler的最新版本。

2. **启动Async Profiler**：使用以下命令启动Async Profiler。

    ```bash
    ./profiler.sh start <pid>
    ```

3. **生成火焰图**：使用以下命令生成锁竞争的火焰图。

    ```bash
    ./profiler.sh stop --lock <pid> > lock.svg
    ```

4. **分析火焰图**：使用浏览器打开生成的`lock.svg`文件，分析锁竞争情况。

### 5.5 Eclipse MAT

Eclipse MAT是一个内存分析工具，可以用于分析Java堆转储文件，帮助定位内存泄漏问题。

## 六、死锁的预防和避免

### 6.1 死锁的预防

死锁的预防是指通过破坏死锁的四个必要条件中的一个或多个，来防止死锁的发生。

#### 6.1.1 破坏互斥条件

互斥条件是指资源不能被多个线程同时使用。破坏互斥条件的方法是允许资源被多个线程同时使用，例如使用读写锁代替互斥锁。

#### 6.1.2 破坏请求与保持条件

请求与保持条件是指线程已经保持了至少一个资源，但又提出了新的资源请求，而该资源已被其他线程占用。破坏请求与保持条件的方法是线程在获取资源时，必须一次性获取所有需要的资源，不能逐步获取。

#### 6.1.3 破坏不剥夺条件

不剥夺条件是指线程已获得的资源，在未使用完之前，不能被其他线程强行剥夺。破坏不剥夺条件的方法是允许线程在无法获取所需资源时，释放已持有的资源。

#### 6.1.4 破坏循环等待条件

循环等待条件是指若干线程之间形成一种头尾相接的循环等待资源关系。破坏循环等待条件的方法是对资源进行排序，线程在获取资源时必须按照一定的顺序获取。

### 6.2 死锁的避免

死锁的避免是指在资源分配过程中，通过某种算法来避免系统进入不安全状态，从而避免死锁的发生。

#### 6.2.1 银行家算法

银行家算法是一种经典的死锁避免算法，它通过模拟资源分配过程，来判断系统是否处于安全状态。如果系统处于安全状态，则可以进行资源分配；否则，拒绝资源分配请求。

### 6.3 死锁的解除

当系统发生死锁时，可以采取以下几种方法来解除死锁：

1. **资源剥夺法**：从其他线程剥夺足够的资源，分配给死锁线程，使死锁线程能够继续执行。

2. **撤销进程法**：撤销部分或全部死锁线程，释放它们持有的资源，使其他线程能够继续执行。

3. **进程回退法**：让死锁线程回退到之前的某个安全状态，释放它们持有的资源，使其他线程能够继续执行。

## 七、实际案例分析

### 7.1 案例背景

某电商平台的订单处理系统在高并发场景下出现了死锁问题，导致部分订单无法正常处理，系统性能下降。

### 7.2 问题分析

通过使用JStack工具生成线程快照，发现存在多个线程处于死锁状态。进一步分析线程快照后，发现死锁的原因是多个线程在处理订单时，同时争夺订单锁和用户锁，并且获取锁的顺序不一致。

### 7.3 解决方案

1. **统一锁获取顺序**：对订单锁和用户锁进行排序，线程在获取锁时必须按照一定的顺序获取。

2. **减少锁的持有时间**：尽量减少锁的持有时间，在获取锁后尽快释放锁。

3. **使用可重入锁**：使用`ReentrantLock`代替`synchronized`关键字，`ReentrantLock`提供了更多的功能，如可中断锁、公平锁等。

4. **实现超时机制**：在获取锁时设置超时时间，如果在超时时间内无法获取锁，则释放已持有的锁，并进行重试。

### 7.4 优化后的代码示例

```java
import java.util.concurrent.locks.ReentrantLock;

public class OrderProcessor {
    private static final int LOCK_TIMEOUT = 5000; // 锁超时时间，单位：毫秒

    public void processOrder(String orderId, String userId) {
        ReentrantLock orderLock = getOrderLock(orderId);
        ReentrantLock userLock = getUserLock(userId);

        // 统一锁获取顺序：先获取哈希值较小的锁
        ReentrantLock firstLock = orderId.hashCode() < userId.hashCode() ? orderLock : userLock;
        ReentrantLock secondLock = orderId.hashCode() < userId.hashCode() ? userLock : orderLock;

        boolean firstLocked = false;
        boolean secondLocked = false;

        try {
            // 获取第一个锁
            firstLocked = firstLock.tryLock(LOCK_TIMEOUT, TimeUnit.MILLISECONDS);
            if (!firstLocked) {
                throw new RuntimeException("获取第一个锁超时");
            }

            // 获取第二个锁
            secondLocked = secondLock.tryLock(LOCK_TIMEOUT, TimeUnit.MILLISECONDS);
            if (!secondLocked) {
                throw new RuntimeException("获取第二个锁超时");
            }

            // 处理订单
            processOrderInternal(orderId, userId);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("线程被中断", e);
        } finally {
            // 释放锁
            if (secondLocked) {
                secondLock.unlock();
            }
            if (firstLocked) {
                firstLock.unlock();
            }
        }
    }

    private void processOrderInternal(String orderId, String userId) {
        // 处理订单的业务逻辑
        System.out.println("处理订单：" + orderId + ", 用户：" + userId);
    }

    private ReentrantLock getOrderLock(String orderId) {
        // 获取订单锁的逻辑
        return new ReentrantLock();
    }

    private ReentrantLock getUserLock(String userId) {
        // 获取用户锁的逻辑
        return new ReentrantLock();
    }
}
```

## 八、总结

死锁是Java并发编程中常见的问题之一，它会导致线程资源浪费、系统性能下降、应用程序无响应等问题。本文介绍了死锁的基本概念、产生条件、检测方法、调试工具以及预防和避免措施。

在实际应用中，应该尽量避免死锁的发生，可以通过以下几种方法：

1. **统一锁获取顺序**：对资源进行排序，线程在获取锁时必须按照一定的顺序获取。
2. **减少锁的持有时间**：尽量减少锁的持有时间，在获取锁后尽快释放锁。
3. **使用可重入锁**：使用`ReentrantLock`代替`synchronized`关键字，`ReentrantLock`提供了更多的功能。
4. **实现超时机制**：在获取锁时设置超时时间，如果在超时时间内无法获取锁，则释放已持有的锁，并进行重试。
5. **使用并发工具类**：使用Java提供的并发工具类，如`Semaphore`、`CountDownLatch`、`CyclicBarrier`等，避免直接使用锁。

通过掌握死锁的检测和调试方法，可以快速定位和解决死锁问题，提高系统的稳定性和可靠性。

## 九、参考资料

1. 《Java并发编程的艺术》
2. 《Java并发编程实战》
3. JDK官方文档：JStack
4. JDK官方文档：JConsole
5. JDK官方文档：VisualVM
6. Async Profiler官方文档
7. Eclipse MAT官方文档

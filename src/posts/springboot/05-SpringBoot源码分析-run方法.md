---
isOriginal: true
title: springboot 源码分析[2] StopWatch
tag:
  - StopWatch
  - springboot
category: 源码
p: .\springboot\springboot源码分析
date: 2020-05-04
icon: leaf
description: springboot源码分析
sticky: false
timeline: true
article: true
star: false
---

> 聊一些关于stopwatch的东西, 也谈谈自己的想法.

## StopWatch

![2020-05-05-14-14-44](http://dewy-blog.nikolazh.eu.org/2020-05-05-14-14-44.png)

StopWatch中维护了一个`List<TaskInfo> taskList`用于记录各个task的name以及执行的时间. 而`StopWatch`相当于这些task的一个汇总信息. 这个类和springboot的关系不是很大, 不感兴趣的话可以跳过。

```java
public StopWatch() {
  this("");
}

public StopWatch(String id) {
  this.id = id;
}
```

首先我们要创建一个StopWatch对象, 默认使用的id是一个空字符串. 这个id的作用主要是为了区分多个stopwatch.
之后调用`start()`方法开始任务计时. 当然默认情况下, 任务的taskname也是空. 下面的方法设置了任务名和当前的纳秒.

```java
public void start() throws IllegalStateException {
  start("");
}
public void start(String taskName) throws IllegalStateException {
  if (this.currentTaskName != null) {
    throw new IllegalStateException("Can't start StopWatch: it's already running");
  }
  this.currentTaskName = taskName;
  this.startTimeNanos = System.nanoTime();
}
```

任务结束我们调用`stop()`方法, 通过当前时间和`startTimeNanos`计算时间差.
还有一些其他操作, 累计所有任务的执行时间.
备份当前任务的执行时间信息即TaskInfo.
累计任务数, 清空当前任务的名称, 留意一下start方法, 你就会发现使用任务名称作为任务是否运行的标记.

```java
public void stop() throws IllegalStateException {
  if (this.currentTaskName == null) {
    throw new IllegalStateException("Can't stop StopWatch: it's not running");
  }
  long lastTime = System.nanoTime() - this.startTimeNanos;
  this.totalTimeNanos += lastTime;
  this.lastTaskInfo = new TaskInfo(this.currentTaskName, lastTime);
  if (this.keepTaskList) {
    this.taskList.add(this.lastTaskInfo);
  }
  ++this.taskCount;
  this.currentTaskName = null;
}
```

这个类是独立的, 因此我们也可以使用它进行任务的执行时间统计. 注意多线程情况下是不适用的. 不过可以做一些顶级的封装.

### 不同阶段任务的统计

这里指的是单线程的情况下的使用. 下面是我写个一个简单的例子.

```java
public static void main(String[] args) throws InterruptedException {

    StopWatch stopWatch = new StopWatch("单线程统计");

    stopWatch.start("task1");
    TimeUnit.SECONDS.sleep(1);
    stopWatch.stop();

    stopWatch.start("task2");
    TimeUnit.SECONDS.sleep(1);
    stopWatch.stop();

    stopWatch.start("task3");
    TimeUnit.SECONDS.sleep(1);
    stopWatch.stop();

    System.out.println(stopWatch.prettyPrint());
}
```

这个很简单, 没什么可说的.`prettyPrint`是一种非常友好的任务信息打印的方法.

可以看一下输出结果:

```
StopWatch '单线程统计': running time = 3001237499 ns
---------------------------------------------
ns         %     Task name
---------------------------------------------
1000202200  033%  task1
1000465999  033%  task2
1000569300  033%  task3

```

### 多线程的任务统计

最简单的方法是每个线程都有一个StopWatch去记录当前线程的任务耗时, 在线程结束时分别打印. 基于这个思想, 我们可以做一些更灵活的设计, 即将每个线程对应的StopWatch存放到Map中进行管理.

```java
public class ThreadMultiStopWatch {

    private static final Map<Thread, StopWatch> stopWatchMap = new HashMap<>(4);

    public static void start(String taskName) {
        Thread t = Thread.currentThread();

        StopWatch stopWatch;
        if (Objects.isNull(stopWatch = stopWatchMap.get(t))) {
            stopWatch = new StopWatch(t.getId() + "-" + t.getName());
        }
        stopWatch.start(taskName);
        stopWatchMap.put(t, stopWatch);
    }

    public static void stop() {
        Thread t = Thread.currentThread();
        StopWatch stopWatch;
        if (Objects.isNull(stopWatch = stopWatchMap.get(t))) {
            return;
        }
        stopWatch.stop();
        stopWatchMap.put(t, stopWatch);
    }

    public static void prettyPrint(CountDownLatch countDownLatch) throws InterruptedException {
        countDownLatch.await();
        StringBuilder sb = new StringBuilder();
        stopWatchMap.forEach((k, v) -> {
            sb.append(String.format("======= 当前线程id: %d, 线程名称: %s ===========\n", k.getId(), k.getName()))
                    .append(v.prettyPrint()).append("\n\n");
        });
        System.out.println(sb.toString());
    }

}

```

prettyPrint中的countDownLatch.await();用于阻塞主线程直到计数归零, 即所有的线程执行结束, 打印我们需要的信息.

下面的程序用于记录多个线程中的任务执行状况.

```java
@Slf4j
public class Test {


    public static void main(String[] args) throws InterruptedException {

        ThreadPoolExecutor threadPoolExecutor = new ThreadPoolExecutor(3, 5, 10, TimeUnit.SECONDS, new ArrayBlockingQueue<>(8));
        CountDownLatch countDownLatch = new CountDownLatch(3);
        threadPoolExecutor.submit(() -> {
            try {
                ThreadMultiStopWatch.start("task1");
                log.info("thread1, task1");
                ThreadMultiStopWatch.stop();
                ThreadMultiStopWatch.start("task2");
                log.info("thread1, task2");
                ThreadMultiStopWatch.stop();
            } finally {
                countDownLatch.countDown();
            }
        });

        threadPoolExecutor.submit(() -> {
            try {
                ThreadMultiStopWatch.start("task1");
                log.info("thread2, task1");
                ThreadMultiStopWatch.stop();
                ThreadMultiStopWatch.start("task2");
                log.info("thread2, task2");
                ThreadMultiStopWatch.stop();
            } finally {
                countDownLatch.countDown();
            }
        });

        threadPoolExecutor.submit(() -> {
            try {
                ThreadMultiStopWatch.start("task1");
                log.info("thread3, task1");
                ThreadMultiStopWatch.stop();
                ThreadMultiStopWatch.start("task2");
                log.info("thread3, task2");
                ThreadMultiStopWatch.stop();
            } finally {
                countDownLatch.countDown();
            }
        });

        ThreadMultiStopWatch.prettyPrint(countDownLatch);

        threadPoolExecutor.shutdown();
    }
}

```

结果如下:

```
21:05:58.827 [pool-1-thread-2] INFO com.nikola.management.Test - thread2, task1
21:05:58.827 [pool-1-thread-3] INFO com.nikola.management.Test - thread3, task1
21:05:58.827 [pool-1-thread-1] INFO com.nikola.management.Test - thread1, task1
21:05:58.830 [pool-1-thread-2] INFO com.nikola.management.Test - thread2, task2
21:05:58.831 [pool-1-thread-3] INFO com.nikola.management.Test - thread3, task2
21:05:58.831 [pool-1-thread-1] INFO com.nikola.management.Test - thread1, task2
======= 当前线程id: 12, 线程名称: pool-1-thread-1 ===========
StopWatch '12-pool-1-thread-1': running time = 4540200 ns
---------------------------------------------
ns         %     Task name
---------------------------------------------
004419100  097%  task1
000121100  003%  task2


======= 当前线程id: 13, 线程名称: pool-1-thread-2 ===========
StopWatch '13-pool-1-thread-2': running time = 4481701 ns
---------------------------------------------
ns         %     Task name
---------------------------------------------
004356300  097%  task1
000125401  003%  task2


======= 当前线程id: 14, 线程名称: pool-1-thread-3 ===========
StopWatch '14-pool-1-thread-3': running time = 4461000 ns
---------------------------------------------
ns         %     Task name
---------------------------------------------
004387800  098%  task1
000073200  002%  task2




Process finished with exit code 0

```

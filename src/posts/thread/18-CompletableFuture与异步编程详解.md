---
isOriginal: true
title: CompletableFuture与异步编程详解
tag:
  - thread
  - 异步编程
  - CompletableFuture
  - Future
category: thread
date: 2024-01-21
icon: code-fork
description: 深入解析CompletableFuture的实现原理、使用场景和异步编程技巧
sticky: false
timeline: true
article: true
star: false
---

## 一、异步编程概述

### 1.1 什么是异步编程

异步编程是一种编程范式，它允许程序在执行耗时操作时不阻塞当前线程，而是继续执行其他任务，当耗时操作完成后，再通过回调或其他方式处理结果。异步编程的主要目的是提高程序的响应性和吞吐量。

### 1.2 异步编程的优势

异步编程具有以下几个主要优势：

1. **提高响应性**：在GUI应用程序中，异步编程可以避免UI线程被阻塞，确保用户界面始终保持响应状态。

2. **提高吞吐量**：在服务器应用程序中，异步编程可以处理更多的并发请求，提高服务器的吞吐量。

3. **资源利用率**：异步编程可以更有效地利用系统资源，避免线程因等待IO操作而被阻塞。

### 1.3 Java中的异步编程模型

在Java中，异步编程主要通过以下几种方式实现：

1. **线程池**：通过ThreadPoolExecutor等线程池框架，可以将任务提交到线程池中异步执行。

2. **Future接口**：Future接口表示异步计算的结果，可以通过get()方法获取计算结果。

3. **CompletableFuture**：CompletableFuture是Java 8引入的一个类，它扩展了Future接口，提供了更丰富的异步编程功能。

4. **响应式编程**：通过RxJava、Project Reactor等响应式编程框架，可以实现更复杂的异步编程模型。

## 二、Future接口的局限性

### 2.1 Future接口概述

Future接口是Java 5引入的，它表示异步计算的结果。Future接口提供了以下几个主要方法：

1. **get()**：获取异步计算的结果，如果计算尚未完成，则阻塞当前线程直到计算完成。

2. **get(long timeout, TimeUnit unit)**：在指定的时间内获取异步计算的结果，如果超时则抛出TimeoutException异常。

3. **cancel(boolean mayInterruptIfRunning)**：取消异步计算，如果计算尚未开始，则直接取消；如果计算已经开始，则根据mayInterruptIfRunning参数决定是否中断正在执行的线程。

4. **isDone()**：判断异步计算是否已经完成。

5. **isCancelled()**：判断异步计算是否已经被取消。

### 2.2 Future接口的局限性

虽然Future接口提供了基本的异步编程功能，但它存在以下几个主要局限性：

1. **阻塞获取结果**：Future接口的get()方法是阻塞的，当调用get()方法时，如果异步计算尚未完成，当前线程会被阻塞直到计算完成。

2. **无法组合多个Future**：Future接口没有提供组合多个Future的功能，例如，当一个异步计算的结果依赖于另一个异步计算的结果时，需要手动编写代码来处理这种依赖关系。

3. **缺乏异常处理机制**：Future接口没有提供良好的异常处理机制，当异步计算抛出异常时，只有在调用get()方法时才会被捕获到。

4. **无法主动完成**：Future接口没有提供主动完成异步计算的功能，只有当异步计算正常完成或抛出异常时，Future才会完成。

## 三、CompletableFuture核心API

### 3.1 CompletableFuture概述

CompletableFuture是Java 8引入的一个类，它扩展了Future接口，实现了CompletionStage接口，提供了更丰富的异步编程功能。CompletableFuture的主要特点包括：

1. **非阻塞获取结果**：CompletableFuture提供了非阻塞的方式获取异步计算的结果。

2. **组合多个CompletableFuture**：CompletableFuture提供了丰富的API来组合多个CompletableFuture。

3. **强大的异常处理机制**：CompletableFuture提供了良好的异常处理机制，可以捕获和处理异步计算过程中抛出的异常。

4. **主动完成**：CompletableFuture提供了主动完成异步计算的功能。

### 3.2 CompletableFuture的创建

CompletableFuture提供了以下几种创建方式：

1. **CompletableFuture.supplyAsync(Supplier\<U\> supplier)**：使用默认的线程池创建一个CompletableFuture，异步执行supplier提供的任务。

2. **CompletableFuture.supplyAsync(Supplier\<U\> supplier, Executor executor)**：使用指定的线程池创建一个CompletableFuture，异步执行supplier提供的任务。

3. **CompletableFuture.runAsync(Runnable runnable)**：使用默认的线程池创建一个CompletableFuture，异步执行runnable提供的任务。

4. **CompletableFuture.runAsync(Runnable runnable, Executor executor)**：使用指定的线程池创建一个CompletableFuture，异步执行runnable提供的任务。

5. **CompletableFuture.completedFuture(U value)**：创建一个已经完成的CompletableFuture，结果为指定的值。

6. **new CompletableFuture\<U\>()**：创建一个未完成的CompletableFuture，可以通过complete()、completeExceptionally()等方法手动完成。

### 3.3 CompletableFuture的核心API

CompletableFuture提供了丰富的API，主要包括以下几类：

#### 3.3.1 获取结果

1. **get()**：阻塞获取结果，与Future接口的get()方法相同。

2. **get(long timeout, TimeUnit unit)**：在指定时间内阻塞获取结果，与Future接口的get()方法相同。

3. **join()**：阻塞获取结果，但不抛出CheckedException异常，只抛出RuntimeException异常。

4. **getNow(U valueIfAbsent)**：非阻塞获取结果，如果CompletableFuture尚未完成，则返回valueIfAbsent。

#### 3.3.2 完成CompletableFuture

1. **complete(U value)**：主动完成CompletableFuture，结果为指定的值。

2. **completeExceptionally(Throwable ex)**：主动完成CompletableFuture，结果为指定的异常。

3. **completeOnTimeout(U value, long timeout, TimeUnit unit)**：如果CompletableFuture在指定时间内未完成，则使用指定的值完成。

4. **orTimeout(long timeout, TimeUnit unit)**：如果CompletableFuture在指定时间内未完成，则抛出TimeoutException异常。

#### 3.3.3 转换结果

1. **thenApply(Function<? super T, ? extends U> fn)**：当CompletableFuture完成时，将结果应用到fn函数，并返回一个新的CompletableFuture。

2. **thenApplyAsync(Function<? super T, ? extends U> fn)**：当CompletableFuture完成时，异步地将结果应用到fn函数，并返回一个新的CompletableFuture。

3. **thenApplyAsync(Function<? super T, ? extends U> fn, Executor executor)**：当CompletableFuture完成时，使用指定的线程池异步地将结果应用到fn函数，并返回一个新的CompletableFuture。

4. **thenAccept(Consumer<? super T> action)**：当CompletableFuture完成时，消费结果，不返回新的结果。

5. **thenRun(Runnable action)**：当CompletableFuture完成时，执行一个Runnable任务，不消费结果。

#### 3.3.4 组合CompletableFuture

1. **thenCompose(Function<? super T, ? extends CompletionStage\<U>\> fn)**：当CompletableFuture完成时，将结果应用到fn函数，返回一个新的CompletableFuture，用于处理依赖关系。

2. **thenCombine(CompletionStage<? extends U> other, BiFunction<? super T, ? super U, ? extends V> fn)**：当两个CompletableFuture都完成时，将它们的结果应用到fn函数，并返回一个新的CompletableFuture。

3. **thenAcceptBoth(CompletionStage<? extends U> other, BiConsumer<? super T, ? super U> action)**：当两个CompletableFuture都完成时，消费它们的结果。

4. **runAfterBoth(CompletionStage<?> other, Runnable action)**：当两个CompletableFuture都完成时，执行一个Runnable任务。

5. **applyToEither(CompletionStage<? extends T> other, Function<? super T, U> fn)**：当两个CompletableFuture中的任意一个完成时，将其结果应用到fn函数，并返回一个新的CompletableFuture。

6. **acceptEither(CompletionStage<? extends T> other, Consumer<? super T> action)**：当两个CompletableFuture中的任意一个完成时，消费其结果。

7. **runAfterEither(CompletionStage<?> other, Runnable action)**：当两个CompletableFuture中的任意一个完成时，执行一个Runnable任务。

#### 3.3.5 异常处理

1. **exceptionally(Function<Throwable, ? extends T> fn)**：当CompletableFuture抛出异常时，将异常应用到fn函数，并返回一个新的CompletableFuture。

2. **handle(BiFunction<? super T, Throwable, ? extends U> fn)**：当CompletableFuture完成时（无论是正常完成还是异常完成），将结果或异常应用到fn函数，并返回一个新的CompletableFuture。

3. **whenComplete(BiConsumer<? super T, ? super Throwable> action)**：当CompletableFuture完成时（无论是正常完成还是异常完成），消费结果或异常。

## 三、链式调用与组合操作

### 3.1 链式调用

CompletableFuture的一个重要特性是支持链式调用，可以将多个异步操作串联起来，形成一个异步操作链。链式调用的主要优势是可以更清晰地表达异步操作之间的依赖关系。

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 第一步：获取用户ID
    return "12345";
}).thenApply(userId -> {
    // 第二步：根据用户ID获取用户信息
    return "User{id='" + userId + "', name='张三'}";
}).thenApply(user -> {
    // 第三步：格式化用户信息
    return "格式化后的用户信息：" + user;
});

String result = future.join();
System.out.println(result); // 输出：格式化后的用户信息：User{id='12345', name='张三'}
```

### 3.2 组合操作

CompletableFuture还支持组合多个CompletableFuture，形成更复杂的异步操作。组合操作主要包括以下几种类型：

#### 3.2.1 依赖组合（thenCompose）

当一个异步操作的结果依赖于另一个异步操作的结果时，可以使用thenCompose方法。

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 获取用户ID
    return "12345";
}).thenCompose(userId -> {
    // 根据用户ID获取用户信息（返回CompletableFuture）
    return CompletableFuture.supplyAsync(() -> "User{id='" + userId + "', name='张三'}");
});

String result = future.join();
System.out.println(result); // 输出：User{id='12345', name='张三'}
```

#### 3.2.2 并行组合（thenCombine）

当两个异步操作可以并行执行，并且需要将它们的结果组合起来时，可以使用thenCombine方法。

```java
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
    // 获取用户信息
    return "User{id='12345', name='张三'}";
});

CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
    // 获取订单信息
    return "Order{id='67890', amount=100.0}";
});

CompletableFuture<String> future = future1.thenCombine(future2, (user, order) -> {
    // 组合用户信息和订单信息
    return "用户：" + user + "，订单：" + order;
});

String result = future.join();
System.out.println(result); // 输出：用户：User{id='12345', name='张三'}，订单：Order{id='67890', amount=100.0}
```

#### 3.2.3 任意完成（applyToEither）

当只需要两个异步操作中的任意一个完成的结果时，可以使用applyToEither方法。

```java
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    return "结果1";
});

CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
    try {
        Thread.sleep(500);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    return "结果2";
});

CompletableFuture<String> future = future1.applyToEither(future2, result -> {
    // 使用先完成的结果
    return "先完成的结果：" + result;
});

String result = future.join();
System.out.println(result); // 输出：先完成的结果：结果2
```

## 四、异常处理机制

### 4.1 异常传播

在CompletableFuture的链式调用中，如果某个操作抛出异常，异常会自动传播到后续的操作中。

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 抛出异常
    throw new RuntimeException("发生异常");
}).thenApply(result -> {
    // 这个操作不会执行
    return "处理结果：" + result;
});

try {
    String result = future.join();
    System.out.println(result);
} catch (CompletionException e) {
    System.out.println("捕获到异常：" + e.getCause().getMessage()); // 输出：捕获到异常：发生异常
}
```

### 4.2 异常处理方法

CompletableFuture提供了以下几种异常处理方法：

#### 4.2.1 exceptionally

exceptionally方法可以捕获CompletableFuture抛出的异常，并返回一个默认值。

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 抛出异常
    throw new RuntimeException("发生异常");
}).exceptionally(ex -> {
    // 处理异常并返回默认值
    System.out.println("捕获到异常：" + ex.getMessage());
    return "默认值";
});

String result = future.join();
System.out.println(result); // 输出：默认值
```

#### 4.2.2 handle

handle方法可以处理CompletableFuture的正常结果和异常，并返回一个新的结果。

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 抛出异常
    throw new RuntimeException("发生异常");
}).handle((result, ex) -> {
    if (ex != null) {
        // 处理异常
        System.out.println("捕获到异常：" + ex.getMessage());
        return "默认值";
    } else {
        // 处理正常结果
        return "处理结果：" + result;
    }
});

String result = future.join();
System.out.println(result); // 输出：默认值
```

#### 4.2.3 whenComplete

whenComplete方法可以处理CompletableFuture的正常结果和异常，但不返回新的结果。

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 抛出异常
    throw new RuntimeException("发生异常");
}).whenComplete((result, ex) -> {
    if (ex != null) {
        // 处理异常
        System.out.println("捕获到异常：" + ex.getMessage());
    } else {
        // 处理正常结果
        System.out.println("处理结果：" + result);
    }
});

try {
    String result = future.join();
    System.out.println(result);
} catch (CompletionException e) {
    // 异常仍然会传播
    System.out.println("最终捕获到异常：" + e.getCause().getMessage());
}
```

## 五、异步计算的性能优化

### 5.1 线程池的选择

CompletableFuture默认使用ForkJoinPool.commonPool()作为线程池，在高并发场景下，可能会导致性能问题。因此，建议为CompletableFuture指定一个专用的线程池。

```java
// 创建专用的线程池
ExecutorService executor = Executors.newFixedThreadPool(10);

CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 执行异步操作
    return "结果";
}, executor);
```

### 5.2 避免过度异步化

虽然异步编程可以提高程序的响应性和吞吐量，但过度异步化会导致以下问题：

1. **线程上下文切换开销**：过多的异步操作会导致线程上下文切换开销增加。

2. **代码复杂度**：过度异步化会增加代码的复杂度，降低代码的可读性和可维护性。

3. **内存开销**：每个CompletableFuture对象都会占用一定的内存，过多的CompletableFuture对象会增加内存开销。

因此，在实际应用中，应该根据具体情况合理使用异步编程，避免过度异步化。

### 5.3 批量处理

在处理大量数据时，可以使用CompletableFuture的allOf方法进行批量处理。

```java
List<String> ids = Arrays.asList("1", "2", "3", "4", "5");

// 创建多个CompletableFuture
List<CompletableFuture<String>> futures = ids.stream()
        .map(id -> CompletableFuture.supplyAsync(() -> {
            // 根据ID获取数据
            return "数据" + id;
        }))
        .collect(Collectors.toList());

// 等待所有CompletableFuture完成
CompletableFuture<Void> allFuture = CompletableFuture.allOf(
        futures.toArray(new CompletableFuture[0])
);

// 获取所有结果
CompletableFuture<List<String>> resultFuture = allFuture.thenApply(v -> {
    return futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());
});

List<String> results = resultFuture.join();
System.out.println(results); // 输出：[数据1, 数据2, 数据3, 数据4, 数据5]
```

## 六、与RxJava的对比

### 6.1 RxJava概述

RxJava是一个响应式编程框架，它基于观察者模式和迭代器模式，提供了丰富的异步编程功能。RxJava的主要特点包括：

1. **响应式编程模型**：RxJava采用响应式编程模型，可以轻松处理事件流。

2. **丰富的操作符**：RxJava提供了丰富的操作符，可以对事件流进行转换、过滤、组合等操作。

3. **背压支持**：RxJava支持背压，可以处理生产者和消费者之间的速率不匹配问题。

### 6.2 CompletableFuture与RxJava的对比

| 特性 | CompletableFuture | RxJava |
|------|-------------------|--------|
| 编程模型 | 基于Future接口 | 基于响应式编程模型 |
| 操作符丰富度 | 较少 | 非常丰富 |
| 背压支持 | 不支持 | 支持 |
| 错误处理 | 提供基本的错误处理机制 | 提供更丰富的错误处理机制 |
| 学习曲线 | 较简单 | 较复杂 |
| 适用场景 | 简单的异步操作和组合 | 复杂的事件流处理 |

### 6.3 如何选择

在选择CompletableFuture和RxJava时，应该根据具体的应用场景来决定：

1. **如果只需要简单的异步操作和组合**，可以使用CompletableFuture，它的学习曲线较简单，使用起来也更方便。

2. **如果需要处理复杂的事件流**，或者需要更丰富的操作符和错误处理机制，可以使用RxJava。

## 七、总结

CompletableFuture是Java 8引入的一个强大的异步编程工具，它扩展了Future接口，提供了更丰富的异步编程功能。CompletableFuture支持链式调用、组合操作、异常处理等功能，可以轻松实现复杂的异步编程模型。

在实际应用中，应该根据具体情况合理使用CompletableFuture，选择合适的线程池，避免过度异步化，以提高程序的性能和可维护性。

与RxJava相比，CompletableFuture的学习曲线较简单，适合处理简单的异步操作和组合；而RxJava提供了更丰富的功能，适合处理复杂的事件流。

## 八、参考资料

1. 《Java并发编程的艺术》
2. 《Java 8实战》
3. Java官方文档：CompletableFuture
4. RxJava官方文档

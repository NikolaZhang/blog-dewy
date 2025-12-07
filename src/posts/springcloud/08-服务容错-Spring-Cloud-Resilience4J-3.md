---
isOriginal: true
title: '服务容错 Resilience4J [2]'
date: 2018-12-22
icon: code
tag:
  - resilience4j
category: 技术
description: 服务容错的简单介绍
sticky: false
timeline: true
article: true
star: false
---

> 继续上一篇博客，这次我们聊一聊服务降级、异常处理等实现方法。最近内容有点多。。。。

<!--more-->

## 1 定义服务降级

在Resilience4J中，可以通过在注解中指定fallbackMethod参数来实现服务降级逻辑。Resilience4J会在方法执行过程中出现错误、超时、断路器熔断、线程池拒绝等情况时，执行fallbackMethod指定的方法。

### 1.1 通过注解实现服务降级

```java
// 使用注解实现的服务降级
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
public String service() {
    // 业务逻辑
    return restTemplate.getForObject("http://backend-service/api", String.class);
}

// 服务降级实现方法
public String fallback(Throwable t) {
    return "服务调用出错!";
}
```

### 1.2 异常类型匹配的降级方法

Resilience4J支持根据不同的异常类型匹配不同的降级方法：

```java
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
public String service() {
    // 业务逻辑
    return restTemplate.getForObject("http://backend-service/api", String.class);
}

// 处理特定异常的降级方法
public String fallback(HttpServerErrorException e) {
    return "服务端错误: " + e.getMessage();
}

// 处理通用异常的降级方法
public String fallback(Throwable t) {
    return "服务调用出错: " + t.getMessage();
}
```

### 1.3 函数式编程风格的降级

在Reactor或RxJava环境中，可以使用函数式风格实现降级：

```java
@CircuitBreaker(name = "backendService")
public Mono<String> reactiveService() {
    return webClient.get()
            .uri("/api")
            .retrieve()
            .bodyToMono(String.class)
            .onErrorResume(throwable -> Mono.just("服务调用出错!"));
}
```

## 2 异常处理

### 2.1 异常传播与忽略

在Resilience4J中，可以通过配置ignoreExceptions参数来指定不触发熔断和降级的异常类型。这些异常会被直接抛出，不会被Resilience4J拦截。

```java
@CircuitBreaker(
    name = "backendService",
    fallbackMethod = "fallback",
    ignoreExceptions = {BadRequestException.class, IllegalArgumentException.class}
)
public String service() {
    // 业务逻辑
    return restTemplate.getForObject("http://backend-service/api", String.class);
}
```

### 2.2 异常获取与处理

在Resilience4J中，降级方法可以接收Throwable参数来获取具体的异常信息：

```java
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
public String service() {
    // 业务逻辑
    return restTemplate.getForObject("http://backend-service/api", String.class);
}

public String fallback(Throwable e) {
    // 根据异常类型进行不同的处理
    if (e instanceof HttpServerErrorException) {
        return "服务端错误: " + e.getMessage();
    } else if (e instanceof TimeoutException) {
        return "请求超时: " + e.getMessage();
    }
    return "服务调用出错: " + e.getMessage();
}
```

### 2.3 异常包装

Resilience4J不会自动包装异常，它会直接抛出原始异常（除了被ignoreExceptions指定的异常）。如果需要对异常进行包装，可以在降级方法中实现：

```java
public String fallback(Throwable e) {
    // 包装并重新抛出异常
    throw new ServiceException("服务调用失败", e);
}
```

## 3 组件命名与线程隔离

### 3.1 组件命名

在Resilience4J中，每个组件（CircuitBreaker、RateLimiter、Retry等）都需要一个唯一的名称，用于标识和配置：

```java
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
public String service() {
    // 业务逻辑
    return restTemplate.getForObject("http://backend-service/api", String.class);
}
```

组件名称用于从配置文件中加载对应的配置：

```yaml
resilience4j:
  circuitbreaker:
    instances:
      backendService:  # 与注解中的name对应
        failureRateThreshold: 50
        waitDurationInOpenState: 10000
        slidingWindowSize: 100
```

### 3.2 线程隔离

Resilience4J提供了两种线程隔离方式：

1. **信号量隔离**（默认）：使用信号量限制并发调用数
2. **线程池隔离**：使用独立线程池执行被保护的方法

#### 3.2.1 信号量隔离

```java
@CircuitBreaker(
    name = "backendService",
    fallbackMethod = "fallback",
    circuitBreakerConfig = @CircuitBreakerConfig(
        executionIsolationStrategy = IsolationStrategy.SEMAPHORE,
        executionIsolationSemaphoreMaxConcurrentCalls = 10
    )
)
public String service() {
    // 业务逻辑
    return restTemplate.getForObject("http://backend-service/api", String.class);
}
```

#### 3.2.2 线程池隔离

```java
@CircuitBreaker(
    name = "backendService",
    fallbackMethod = "fallback"
)
@Bulkhead(
    name = "backendService",
    type = Bulkhead.Type.THREADPOOL,
    fallbackMethod = "fallback"
)
public CompletableFuture<String> serviceAsync() {
    // 异步业务逻辑
    return CompletableFuture.supplyAsync(() -> 
        restTemplate.getForObject("http://backend-service/api", String.class)
    );
}
```

线程池配置：

```yaml
resilience4j:
  bulkhead:
    instances:
      backendService:
        maxConcurrentCalls: 10
        maxWaitDuration: 100
  thread-pool-bulkhead:
    instances:
      backendService:
        corePoolSize: 10
        maxPoolSize: 50
        queueCapacity: 100
        keepAliveDuration: 20000
```

## 4 请求缓存

Resilience4J本身不提供请求缓存功能，而是推荐使用Spring Cache或其他专门的缓存框架来实现请求缓存。下面是使用Spring Cache的实现方式：

### 4.1 开启请求缓存

首先需要在Spring Boot应用中启用缓存：

```java
@SpringBootApplication
@EnableCaching
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

然后在需要缓存的方法上添加@Cacheable注解：

```java
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
@Cacheable(value = "backendServiceCache", key = "#id")
public String service(String id) {
    // 业务逻辑
    return restTemplate.getForObject("http://backend-service/api/{id}", String.class, id);
}
```

### 4.2 自定义缓存键

可以使用Spring Expression Language (SpEL)来自定义缓存键：

```java
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
@Cacheable(value = "backendServiceCache", key = "#user.id + '_' + #user.name")
public String service(User user) {
    // 业务逻辑
    return restTemplate.postForObject("http://backend-service/api", user, String.class);
}
```

### 4.3 清理失效缓存

当数据更新时，需要清理相应的缓存：

```java
@CacheEvict(value = "backendServiceCache", key = "#id")
public String updateService(String id, String data) {
    // 更新逻辑
    restTemplate.put("http://backend-service/api/{id}", data, id);
    return "Update successful";
}

// 清理所有缓存
@CacheEvict(value = "backendServiceCache", allEntries = true)
public void clearAllCache() {
    // 清理逻辑
}
```

### 4.4 缓存条件

可以通过condition参数设置缓存的条件：

```java
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
@Cacheable(value = "backendServiceCache", key = "#id", condition = "#id > 0")
public String service(String id) {
    // 业务逻辑
    return restTemplate.getForObject("http://backend-service/api/{id}", String.class, id);
}
```

### 4.4 请求合并

Resilience4J本身不提供请求合并功能，因为它更专注于核心的容错模式。但是我们可以通过以下几种方式实现请求合并的效果：

#### 4.4.1 服务端批量API设计

最直接的方式是在服务端提供批量处理API，客户端直接调用批量接口而不是合并请求：

```java
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
public List<String> getServices(List<String> ids) {
    // 直接调用服务端批量API
    return restTemplate.postForObject(
        "http://backend-service/api/batch", ids, List.class
    );
}
```

#### 4.4.2 客户端自定义请求合并

如果服务端不支持批量API，可以在客户端实现请求合并逻辑：

```java
@Component
public class ServiceClient {
    
    private final RestTemplate restTemplate;
    private final ScheduledExecutorService executorService;
    private final ConcurrentHashMap<String, CompletableFuture<String>> requestMap;
    
    // 构造函数和初始化
    
    @Scheduled(fixedDelay = 100) // 每100毫秒合并一次请求
    private void processBatchRequests() {
        if (requestMap.isEmpty()) {
            return;
        }
        
        // 批量处理所有请求
        List<String> ids = new ArrayList<>(requestMap.keySet());
        try {
            Map<String, String> results = restTemplate.postForObject(
                "http://backend-service/api/batch", ids, Map.class
            );
            
            // 处理结果
            results.forEach((id, result) -> {
                CompletableFuture<String> future = requestMap.remove(id);
                if (future != null) {
                    future.complete(result);
                }
            });
        } catch (Exception e) {
            // 处理异常
            requestMap.forEach((id, future) -> future.completeExceptionally(e));
            requestMap.clear();
        }
    }
    
    @CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
    public CompletableFuture<String> getService(String id) {
        CompletableFuture<String> future = new CompletableFuture<>();
        requestMap.put(id, future);
        return future;
    }
    
    public String fallback(String id, Throwable t) {
        return "服务调用出错!";
    }
}
```

#### 4.4.3 消息队列批量处理

使用消息队列可以实现异步请求合并：

```java
@CircuitBreaker(name = "backendService", fallbackMethod = "fallback")
public CompletableFuture<String> getService(String id) {
    CompletableFuture<String> future = new CompletableFuture<>();
    
    // 将请求发送到消息队列
    Message<String> message = MessageBuilder
        .withPayload(id)
        .setHeader("correlationId", UUID.randomUUID().toString())
        .build();
    
    rabbitTemplate.convertAndSend("service-requests", message);
    
    // 注册结果处理器
    resultHandlers.put(message.getHeaders().get("correlationId"), future);
    
    return future;
}

// 消息监听器，批量处理请求
@RabbitListener(queues = "service-requests")
public void handleRequests(List<Message<String>> messages) {
    List<String> ids = messages.stream()
        .map(Message::getPayload)
        .collect(Collectors.toList());
    
    // 批量调用服务
    Map<String, String> results = restTemplate.postForObject(
        "http://backend-service/api/batch", ids, Map.class
    );
    
    // 返回结果
    messages.forEach(message -> {
        String id = message.getPayload();
        String correlationId = message.getHeaders().get("correlationId");
        CompletableFuture<String> future = resultHandlers.remove(correlationId);
        if (future != null) {
            future.complete(results.get(id));
        }
    });
}
```

### 4.4.4 请求合并的注意事项

虽然请求合并可以减少网络请求次数，但也需要注意以下几点：

1. **额外开销**：请求合并会增加延迟（等待时间窗）和实现复杂度
2. **适用场景**：仅适用于高并发、低延迟的服务调用
3. **服务端支持**：优先使用服务端批量API，避免客户端复杂实现
4. **错误处理**：需要考虑部分请求失败的处理方式
5. **缓存结合**：可以与Spring Cache结合使用，减少重复请求

在现代微服务架构中，通常更推荐：

- 使用高效的网络协议（如gRPC）
- 优化服务端性能
- 合理设置连接池大小
- 使用服务网格（如Istio）管理服务间通信

这些方法通常比客户端请求合并更高效、更易于维护。

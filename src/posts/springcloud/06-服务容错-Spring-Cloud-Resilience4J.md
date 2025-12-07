---
isOriginal: true
title: 服务容错保护 Spring Cloud Resilience4J [1]
date: 2018-12-16
icon: code
update: 2024-01-01


tag:
  - resilience4j
  - springcloud
category: 技术
description: Resilience4J服务容错的详细介绍
sticky: false
timeline: true
article: true
star: false
---

> Resilience4J具有服务降级、服务熔断、线程和信号隔离、请求缓存、请求限制以及服务监控等功能，是Spring Cloud官方推荐的Hystrix替代方案。

<!--more-->

## 1 简单的配置

### 1.1 引入Spring Cloud Resilience4J

```xml
<!-- Resilience4J核心依赖 -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>

<!-- 可选：用于监控和指标 -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### 1.2 添加注解

Resilience4J不需要在主类上添加额外注解，只需要在需要容错保护的方法上使用对应的注解即可。

```java
@EnableDiscoveryClient
@SpringBootApplication
public class CustomerApplication {
    // ...
}
```

### 1.3 改造服务消费方式

在服务消费的方法上增加`@CircuitBreaker`注解，并指定fallback方法。当服务调用失败时，会自动触发fallback方法。

Resilience4J的默认超时时间可以通过配置进行调整，默认情况下没有全局超时设置（由底层调用框架决定）。

## 2 Resilience4J的工作流程

Resilience4J采用轻量级设计，基于函数式编程思想，提供模块化的弹性机制。其工作流程简化如下：

1. **请求拦截与包装**：通过函数式接口或注解将目标方法包装，实现弹性策略的切入
2. **断路器状态检查**：在执行目标方法前，检查断路器是否处于打开状态
3. **资源隔离检查**：验证当前请求是否在隔离限制范围内（线程池或信号量）
4. **超时控制**：为请求设置超时，超过指定时间自动中断
5. **执行目标方法**：在符合所有条件时，执行实际的业务逻辑
6. **结果处理与记录**：记录请求结果（成功/失败/超时），更新断路器统计信息
7. **熔断状态更新**：根据统计信息计算健康度，决定是否打开/关闭断路器
8. **服务降级**：当请求失败、超时、熔断或资源不足时，执行降级逻辑

## 3 Resilience4J的隔离机制

Resilience4J提供两种隔离策略：

### 3.1 信号量隔离（默认）

信号量是Resilience4J的默认隔离策略，它通过计数器控制并发请求数量，开销极小但功能受限：

- **优点**：
  1. 极低的性能开销（无线程上下文切换）
  2. 实现简单，配置成本低
  3. 适合高并发、低延迟的场景

- **限制**：
  1. 无法设置请求超时（依赖于底层调用框架）
  2. 不能实现真正的异步执行

### 3.2 线程池隔离

线程池隔离为每个服务调用创建独立的线程池，提供更强的隔离能力：

- **优点**：
  1. 完全隔离的执行环境，不会影响主线程
  2. 支持请求超时控制
  3. 可以实现异步执行模式
  4. 提供完整的线程生命周期管理

- **配置方式**：
  
  ```yaml
  resilience4j.circuitbreaker:
    instances:
      bookservice:
        registerHealthIndicator: true
        slidingWindowSize: 100
        minimumNumberOfCalls: 10
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
        eventConsumerBufferSize: 10
        recordExceptions:
          - org.springframework.web.client.HttpServerErrorException
          - java.util.concurrent.TimeoutException
        ignoreExceptions:
          - org.springframework.web.client.HttpClientErrorException

  resilience4j.timelimiter:
    instances:
      bookservice:
        timeoutDuration: 5s
        cancelRunningFuture: true

  resilience4j.bulkhead:
    instances:
      bookservice:
        maxConcurrentCalls: 10
        maxWaitDuration: 1s
  ```

## 4 Resilience4J的核心功能与使用方法

### 4.1 核心功能模块

Resilience4J提供以下主要模块：

- **CircuitBreaker**：断路器模式，防止系统级联故障
- **RateLimiter**：限流，控制请求速率
- **Bulkhead**：舱壁模式，限制并发请求数量
- **Retry**：重试机制，增强系统弹性
- **TimeLimiter**：超时控制，防止请求无限等待
- **Cache**：请求缓存，减少重复请求

### 4.2 基于注解的使用方式

Resilience4J提供了简洁的注解方式来实现服务容错：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.0</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.demo</groupId>
    <artifactId>resilience4j-demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>resilience4j-demo</name>
    <description>Demo project for Resilience4J</description>

    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2022.0.4</spring-cloud.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-loadbalancer</artifactId>
        </dependency>
        <dependency>
            <groupId>io.github.resilience4j</groupId>
            <artifactId>resilience4j-spring-boot3</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

#### 4.2.1 主类配置

```java
@EnableDiscoveryClient
@SpringBootApplication
public class Resilience4jDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(Resilience4jDemoApplication.class, args);
    }

    @Bean
    @LoadBalanced
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

#### 4.2.2 服务调用示例

```java
@Service
public class BookService {
    
    private final RestTemplate restTemplate;
    
    public BookService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    // 简单的断路器示例
    @CircuitBreaker(name = "bookservice", fallbackMethod = "getBookFallback")
    public String getBookInfo(Long bookId) {
        return restTemplate.getForObject("http://bookservice/api/books/{id}", 
            String.class, bookId);
    }
    
    // 降级方法
    public String getBookFallback(Long bookId, Throwable t) {
        return "Book information temporarily unavailable, please try again later.";
    }
    
    // 组合多种弹性策略
    @CircuitBreaker(name = "bookservice", fallbackMethod = "getBooksFallback")
    @Bulkhead(name = "bookservice")
    @TimeLimiter(name = "bookservice")
    @Retry(name = "bookservice")
    public CompletableFuture<String> getBooksAsync() {
        return CompletableFuture.supplyAsync(() -> 
            restTemplate.getForObject("http://bookservice/api/books", String.class)
        );
    }
    
    public CompletableFuture<String> getBooksFallback(Throwable t) {
        return CompletableFuture.completedFuture("Books list temporarily unavailable.");
    }
}


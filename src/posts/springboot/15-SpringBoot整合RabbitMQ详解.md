---
isOriginal: true
title: Spring Boot 整合 RabbitMQ 详解
tag:
  - rabbitmq
  - springboot
  - 消息队列
category: springboot
date: 2026-03-22
icon: message-square
Description: 详细讲解 Spring Boot 如何整合 RabbitMQ，包括基本配置、消息发送与接收、高级特性等
sticky: false
timeline: true
article: true
star: false
---

> 详细讲解 Spring Boot 如何整合 RabbitMQ，包括基本配置、消息发送与接收、高级特性等

## RabbitMQ 简介

RabbitMQ 是一个开源的消息代理和队列服务器，它实现了 AMQP（高级消息队列协议），提供了可靠的消息传递机制。在分布式系统中，RabbitMQ 常用于：

- 应用解耦
- 异步处理
- 流量削峰
- 消息分发

## 环境准备

### 1. 安装 RabbitMQ

可以通过 Docker 快速启动 RabbitMQ：

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

- 5672 端口：AMQP 协议端口
- 15672 端口：管理界面端口

启动后，可以通过 `http://localhost:15672` 访问管理界面，默认用户名和密码都是 `guest`。

### 2. 项目依赖

在 Spring Boot 项目的 `pom.xml` 中添加 RabbitMQ 依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

## 基本配置

### 1. 配置文件

在 `application.yml` 中添加 RabbitMQ 配置：

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    virtual-host: /
```

### 2. 配置类

创建 RabbitMQ 配置类，用于定义队列、交换机和绑定：

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // 队列名称
    public static final String QUEUE_NAME = "demo_queue";
    // 交换机名称
    public static final String EXCHANGE_NAME = "demo_exchange";
    // 路由键
    public static final String ROUTING_KEY = "demo.routing.key";

    // 创建队列
    @Bean
    public Queue queue() {
        /**
         * 创建队列
         * @param name 队列名称
         * @param durable 是否持久化
         * @param exclusive 是否排他性队列
         * @param autoDelete 是否自动删除
         */
        return new Queue(QUEUE_NAME, true, false, false);
    }

    // 创建交换机
    @Bean
    public DirectExchange exchange() {
        /**
         * 创建直连交换机
         * @param name 交换机名称
         * @param durable 是否持久化
         * @param autoDelete 是否自动删除
         */
        return new DirectExchange(EXCHANGE_NAME, true, false);
    }

    // 绑定队列和交换机
    @Bean
    public Binding binding(Queue queue, DirectExchange exchange) {
        /**
         * 绑定队列和交换机
         * @param queue 队列
         * @param exchange 交换机
         * @param routingKey 路由键
         */
        return BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY);
    }
}
```

## 消息发送

### 1. 消息发送服务

创建消息发送服务：

```java
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageSender {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendMessage(String message) {
        /**
         * 发送消息
         * @param exchange 交换机名称
         * @param routingKey 路由键
         * @param message 消息内容
         */
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.ROUTING_KEY,
            message
        );
        System.out.println("消息发送成功: " + message);
    }
}
```

### 2. 测试消息发送

创建测试类：

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class MessageSenderTest {

    @Autowired
    private MessageSender messageSender;

    @Test
    public void testSendMessage() {
        messageSender.sendMessage("Hello, RabbitMQ!");
    }
}
```

## 消息接收

### 1. 消息监听器

创建消息监听器：

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class MessageListener {

    /**
     * 消息监听器
     * @param queues 监听的队列名称
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void receiveMessage(String message) {
        System.out.println("接收到消息: " + message);
        // 处理消息逻辑
    }
}
```

### 2. 测试消息接收

运行应用程序，然后执行消息发送测试，观察控制台输出：

```
消息发送成功: Hello, RabbitMQ!
接收到消息: Hello, RabbitMQ!
```

## 高级特性

### 1. 消息确认机制

#### 生产者确认

在 `application.yml` 中配置：

```yaml
spring:
  rabbitmq:
    # 其他配置...
    publisher-confirm-type: correlated
    publisher-returns: true
```

配置 RabbitTemplate：

```java
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;

@Configuration
public class RabbitMQConfirmConfig {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @PostConstruct
    public void init() {
        // 设置确认回调
        rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
            if (ack) {
                System.out.println("消息发送到交换机成功");
            } else {
                System.out.println("消息发送到交换机失败: " + cause);
            }
        });

        // 设置返回回调
        rabbitTemplate.setReturnCallback((message, replyCode, replyText, exchange, routingKey) -> {
            System.out.println("消息未路由到队列: " + replyText);
        });
    }
}
```

#### 消费者确认

默认情况下，Spring AMQP 使用自动确认模式。可以通过 `@RabbitListener` 注解的 `ackMode` 属性设置确认模式：

```java
/**
 * 手动确认模式的消息监听器
 * @param queues 监听的队列名称
 * @param ackMode 确认模式，MANUAL 表示手动确认
 */
@RabbitListener(
    queues = RabbitMQConfig.QUEUE_NAME,
    ackMode = "MANUAL"
)
public void receiveMessage(Message message, Channel channel) throws IOException {
    try {
        System.out.println("接收到消息: " + new String(message.getBody()));
        // 处理消息逻辑
        /**
         * 确认消息
         * @param deliveryTag 消息标签
         * @param multiple 是否批量确认
         */
        channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
    } catch (Exception e) {
        /**
         * 拒绝消息
         * @param deliveryTag 消息标签
         * @param multiple 是否批量拒绝
         * @param requeue 是否重新入队
         */
        channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
    }
}
```

### 2. 消息重试机制

在 `application.yml` 中配置：

```yaml
spring:
  rabbitmq:
    # 其他配置...
  retry:
    enabled: true
    initial-interval: 1000ms
    max-interval: 10000ms
    multiplier: 2
    max-attempts: 3
```

### 3. 死信队列

配置死信队列：

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DeadLetterConfig {

    // 死信队列
    public static final String DEAD_LETTER_QUEUE = "dead_letter_queue";
    // 死信交换机
    public static final String DEAD_LETTER_EXCHANGE = "dead_letter_exchange";
    // 死信路由键
    public static final String DEAD_LETTER_ROUTING_KEY = "dead.letter.routing.key";

    // 死信队列
    @Bean
    public Queue deadLetterQueue() {
        return new Queue(DEAD_LETTER_QUEUE);
    }

    // 死信交换机
    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DEAD_LETTER_EXCHANGE);
    }

    // 绑定死信队列和交换机
    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with(DEAD_LETTER_ROUTING_KEY);
    }

    // 普通队列（设置死信属性）
    @Bean
    public Queue normalQueue() {
        return QueueBuilder.durable("normal_queue")
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DEAD_LETTER_ROUTING_KEY)
                .withArgument("x-message-ttl", 10000) // 消息过期时间 10秒
                .build();
    }
}
```

### 4. 延迟队列

使用死信队列实现延迟队列：

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DelayQueueConfig {

    // 延迟队列
    public static final String DELAY_QUEUE = "delay_queue";
    // 延迟交换机
    public static final String DELAY_EXCHANGE = "delay_exchange";
    // 处理队列
    public static final String PROCESS_QUEUE = "process_queue";
    // 处理交换机
    public static final String PROCESS_EXCHANGE = "process_exchange";

    // 延迟队列（实际是死信队列）
    @Bean
    public Queue delayQueue() {
        return QueueBuilder.durable(DELAY_QUEUE)
                .withArgument("x-dead-letter-exchange", PROCESS_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "process.routing.key")
                .build();
    }

    // 延迟交换机
    @Bean
    public DirectExchange delayExchange() {
        return new DirectExchange(DELAY_EXCHANGE);
    }

    // 绑定延迟队列和交换机
    @Bean
    public Binding delayBinding() {
        return BindingBuilder.bind(delayQueue())
                .to(delayExchange())
                .with("delay.routing.key");
    }

    // 处理队列
    @Bean
    public Queue processQueue() {
        return new Queue(PROCESS_QUEUE);
    }

    // 处理交换机
    @Bean
    public DirectExchange processExchange() {
        return new DirectExchange(PROCESS_EXCHANGE);
    }

    // 绑定处理队列和交换机
    @Bean
    public Binding processBinding() {
        return BindingBuilder.bind(processQueue())
                .to(processExchange())
                .with("process.routing.key");
    }
}
```

发送延迟消息：

```java
/**
 * 发送延迟消息
 * @param message 消息内容
 * @param delayMillis 延迟时间（毫秒）
 */
public void sendDelayMessage(String message, long delayMillis) {
    /**
     * 发送消息并设置消息属性
     * @param exchange 交换机名称
     * @param routingKey 路由键
     * @param message 消息内容
     * @param messagePostProcessor 消息处理器，用于设置消息属性
     */
    rabbitTemplate.convertAndSend(
        DelayQueueConfig.DELAY_EXCHANGE,
        "delay.routing.key",
        message,
        messagePostProcessor -> {
            /**
             * 设置消息过期时间
             * @param expiration 过期时间（毫秒）
             */
            messagePostProcessor.getMessageProperties().setExpiration(String.valueOf(delayMillis));
            return messagePostProcessor;
        }
    );
}
```

## 实战案例

### 订单超时处理

1. **创建队列配置**：

```java
@Configuration
public class OrderQueueConfig {

    // 订单队列
    public static final String ORDER_QUEUE = "order_queue";
    // 订单交换机
    public static final String ORDER_EXCHANGE = "order_exchange";
    // 死信队列
    public static final String ORDER_DEAD_QUEUE = "order_dead_queue";
    // 死信交换机
    public static final String ORDER_DEAD_EXCHANGE = "order_dead_exchange";

    // 订单队列
    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable(ORDER_QUEUE)
                .withArgument("x-dead-letter-exchange", ORDER_DEAD_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "order.dead.routing.key")
                .withArgument("x-message-ttl", 300000) // 5分钟超时
                .build();
    }

    // 订单交换机
    @Bean
    public DirectExchange orderExchange() {
        return new DirectExchange(ORDER_EXCHANGE);
    }

    // 绑定订单队列和交换机
    @Bean
    public Binding orderBinding() {
        return BindingBuilder.bind(orderQueue())
                .to(orderExchange())
                .with("order.routing.key");
    }

    // 死信队列
    @Bean
    public Queue orderDeadQueue() {
        return new Queue(ORDER_DEAD_QUEUE);
    }

    // 死信交换机
    @Bean
    public DirectExchange orderDeadExchange() {
        return new DirectExchange(ORDER_DEAD_EXCHANGE);
    }

    // 绑定死信队列和交换机
    @Bean
    public Binding orderDeadBinding() {
        return BindingBuilder.bind(orderDeadQueue())
                .to(orderDeadExchange())
                .with("order.dead.routing.key");
    }
}
```

2. **发送订单消息**：

```java
public void sendOrderMessage(String orderId) {
    rabbitTemplate.convertAndSend(
        OrderQueueConfig.ORDER_EXCHANGE,
        "order.routing.key",
        orderId
    );
}
```

3. **处理超时订单**：

```java
@Component
public class OrderListener {

    @RabbitListener(queues = OrderQueueConfig.ORDER_DEAD_QUEUE)
    public void handleTimeoutOrder(String orderId) {
        System.out.println("处理超时订单: " + orderId);
        // 执行取消订单逻辑
    }
}
```

## 常见问题与解决方案

### 1. 消息丢失

**原因**：
- 生产者未确认消息发送成功
- 消费者未确认消息处理成功
- 队列未持久化

**解决方案**：
- 开启生产者确认机制
- 使用手动确认模式
- 配置队列和消息持久化

### 2. 消息重复消费

**原因**：
- 消费者确认超时
- 网络波动导致确认消息丢失

**解决方案**：
- 实现幂等性处理
- 使用唯一消息ID
- 设置合理的确认超时时间

### 3. 消息堆积

**原因**：
- 消费者处理能力不足
- 生产速度大于消费速度

**解决方案**：
- 增加消费者数量
- 优化消费者处理逻辑
- 使用消息分片

## 总结

本文详细介绍了 Spring Boot 整合 RabbitMQ 的完整流程，包括：

1. **环境搭建**：安装 RabbitMQ 并添加依赖
2. **基本配置**：配置文件和配置类
3. **消息发送**：使用 RabbitTemplate 发送消息
4. **消息接收**：使用 @RabbitListener 注解接收消息
5. **高级特性**：消息确认、重试机制、死信队列、延迟队列
6. **实战案例**：订单超时处理
7. **常见问题**：消息丢失、重复消费、消息堆积的解决方案

通过本文的学习，你应该能够在 Spring Boot 项目中熟练使用 RabbitMQ 进行消息传递，构建可靠的分布式系统。

## 代码示例

完整的代码示例可以参考：[Spring Boot RabbitMQ 示例](https://github.com/spring-projects/spring-amqp-samples)

## 参考资料

- [RabbitMQ 官方文档](https://www.rabbitmq.com/documentation.html)
- [Spring AMQP 官方文档](https://docs.spring.io/spring-amqp/docs/current/reference/html/)
- [Spring Boot 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)

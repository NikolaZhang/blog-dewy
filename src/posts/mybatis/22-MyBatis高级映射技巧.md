---
title: MyBatis高级映射技巧
tag:
  - mybatis
  - 高级映射
  - association
  - collection
category: mybatis
description: 详细介绍MyBatis高级映射技巧，包括一对一映射、一对多映射、多对多映射、鉴别器映射等内容
author: nikola
icon: article
isOriginal: true
sticky: false
timeline: true
article: true
star: false
---

## 简介

MyBatis的高级映射功能是其强大特性之一，它允许开发者将复杂的数据库关系映射到Java对象模型中。通过高级映射，可以轻松处理一对一、一对多、多对多等复杂关系，避免了手动编写大量的JOIN查询和结果集处理代码。本文将详细介绍MyBatis的高级映射技巧，帮助开发者更好地利用这一功能。

<!-- more -->

## 1. 高级映射基础

### 1.1 映射的基本概念

在MyBatis中，映射主要通过`resultMap`元素实现，它允许开发者精确控制如何将数据库结果集映射到Java对象。高级映射则是在此基础上，处理对象之间的关联关系。

### 1.2 映射的类型

MyBatis支持以下几种高级映射类型：

1. **一对一映射**：通过`association`元素实现
2. **一对多映射**：通过`collection`元素实现
3. **多对多映射**：通过两个`collection`元素或中间表实现
4. **鉴别器映射**：通过`discriminator`元素实现

## 2. 一对一映射（Association）

一对一映射用于处理两个实体之间的一对一关系，例如用户和用户详情、订单和订单详情等。

### 2.1 嵌套结果方式

嵌套结果方式通过一次JOIN查询获取所有数据，然后通过`resultMap`将结果映射到关联对象中。

**实体类：**

```java
public class User {
    private Long id;
    private String userName;
    private String email;
    private UserDetail userDetail; // 一对一关联
    
    // getter和setter方法
}

public class UserDetail {
    private Long id;
    private Long userId;
    private String phone;
    private String address;
    private Date birthday;
    
    // getter和setter方法
}
```

**Mapper XML配置：**

```xml
<resultMap id="UserResultMap" type="User">
    <id property="id" column="id" />
    <result property="userName" column="user_name" />
    <result property="email" column="email" />
    <!-- 一对一关联映射 -->
    <association property="userDetail" javaType="UserDetail">
        <id property="id" column="detail_id" />
        <result property="userId" column="id" />
        <result property="phone" column="phone" />
        <result property="address" column="address" />
        <result property="birthday" column="birthday" />
    </association>
</resultMap>

<select id="findUserWithDetail" resultMap="UserResultMap">
    SELECT u.*, ud.id as detail_id, ud.phone, ud.address, ud.birthday
    FROM user u
    LEFT JOIN user_detail ud ON u.id = ud.user_id
    WHERE u.id = #{id}
</select>
```

### 2.2 嵌套查询方式

嵌套查询方式通过两次查询获取数据：首先查询主实体，然后根据主实体的关联字段查询关联实体。

**Mapper XML配置：**

```xml
<resultMap id="UserResultMap2" type="User">
    <id property="id" column="id" />
    <result property="userName" column="user_name" />
    <result property="email" column="email" />
    <!-- 一对一关联映射，嵌套查询 -->
    <association property="userDetail" javaType="UserDetail" select="findUserDetailById" column="id" />
</resultMap>

<select id="findUserById" resultMap="UserResultMap2">
    SELECT * FROM user WHERE id = #{id}
</select>

<select id="findUserDetailById" resultType="UserDetail">
    SELECT * FROM user_detail WHERE user_id = #{id}
</select>
```

## 3. 一对多映射（Collection）

一对多映射用于处理两个实体之间的一对多关系，例如用户和订单、部门和员工等。

### 3.1 嵌套结果方式

**实体类：**

```java
public class User {
    private Long id;
    private String userName;
    private String email;
    private List<Order> orders; // 一对多关联
    
    // getter和setter方法
}

public class Order {
    private Long id;
    private Long userId;
    private String orderNo;
    private BigDecimal amount;
    private Date createTime;
    
    // getter和setter方法
}
```

**Mapper XML配置：**

```xml
<resultMap id="UserWithOrdersResultMap" type="User">
    <id property="id" column="id" />
    <result property="userName" column="user_name" />
    <result property="email" column="email" />
    <!-- 一对多关联映射 -->
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id" />
        <result property="userId" column="id" />
        <result property="orderNo" column="order_no" />
        <result property="amount" column="amount" />
        <result property="createTime" column="order_create_time" />
    </collection>
</resultMap>

<select id="findUserWithOrders" resultMap="UserWithOrdersResultMap">
    SELECT u.*, o.id as order_id, o.order_no, o.amount, o.create_time as order_create_time
    FROM user u
    LEFT JOIN `order` o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>
```

### 3.2 嵌套查询方式

```xml
<resultMap id="UserWithOrdersResultMap2" type="User">
    <id property="id" column="id" />
    <result property="userName" column="user_name" />
    <result property="email" column="email" />
    <!-- 一对多关联映射，嵌套查询 -->
    <collection property="orders" ofType="Order" select="findOrdersByUserId" column="id" />
</resultMap>

<select id="findUserById2" resultMap="UserWithOrdersResultMap2">
    SELECT * FROM user WHERE id = #{id}
</select>

<select id="findOrdersByUserId" resultType="Order">
    SELECT * FROM `order` WHERE user_id = #{id}
</select>
```

## 4. 多对多映射

多对多映射用于处理两个实体之间的多对多关系，例如用户和角色、学生和课程等。通常需要一个中间表来维护这种关系。

### 4.1 基于嵌套结果的多对多映射

**实体类：**

```java
public class User {
    private Long id;
    private String userName;
    private String email;
    private List<Role> roles; // 多对多关联
    
    // getter和setter方法
}

public class Role {
    private Long id;
    private String roleName;
    private String description;
    
    // getter和setter方法
}
```

**Mapper XML配置：**

```xml
<resultMap id="UserWithRolesResultMap" type="User">
    <id property="id" column="id" />
    <result property="userName" column="user_name" />
    <result property="email" column="email" />
    <!-- 多对多关联映射 -->
    <collection property="roles" ofType="Role">
        <id property="id" column="role_id" />
        <result property="roleName" column="role_name" />
        <result property="description" column="role_description" />
    </collection>
</resultMap>

<select id="findUserWithRoles" resultMap="UserWithRolesResultMap">
    SELECT u.*, r.id as role_id, r.role_name, r.description as role_description
    FROM user u
    LEFT JOIN user_role ur ON u.id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.id
    WHERE u.id = #{id}
</select>
```

### 4.2 基于嵌套查询的多对多映射

```xml
<resultMap id="UserWithRolesResultMap2" type="User">
    <id property="id" column="id" />
    <result property="userName" column="user_name" />
    <result property="email" column="email" />
    <!-- 多对多关联映射，嵌套查询 -->
    <collection property="roles" ofType="Role" select="findRolesByUserId" column="id" />
</resultMap>

<select id="findUserById3" resultMap="UserWithRolesResultMap2">
    SELECT * FROM user WHERE id = #{id}
</select>

<select id="findRolesByUserId" resultType="Role">
    SELECT r.* FROM role r
    INNER JOIN user_role ur ON r.id = ur.role_id
    WHERE ur.user_id = #{id}
</select>
```

## 5. 鉴别器映射（Discriminator）

鉴别器映射是一种特殊的映射方式，它可以根据结果集中的某个列的值，动态选择不同的映射策略。这在处理继承关系时非常有用。

### 5.1 鉴别器映射的使用

**实体类：**

```java
public abstract class Payment {
    private Long id;
    private BigDecimal amount;
    private Date createTime;
    private String paymentType;
    
    // getter和setter方法
}

public class CreditCardPayment extends Payment {
    private String cardNumber;
    private String expiryDate;
    private String cvv;
    
    // getter和setter方法
}

public class AlipayPayment extends Payment {
    private String alipayAccount;
    
    // getter和setter方法
}
```

**Mapper XML配置：**

```xml
<resultMap id="PaymentResultMap" type="Payment">
    <id property="id" column="id" />
    <result property="amount" column="amount" />
    <result property="createTime" column="create_time" />
    <result property="paymentType" column="payment_type" />
    
    <!-- 鉴别器映射 -->
    <discriminator javaType="String" column="payment_type">
        <!-- 信用卡支付 -->
        <case value="CREDIT_CARD" resultMap="CreditCardPaymentResultMap" />
        <!-- 支付宝支付 -->
        <case value="ALIPAY" resultMap="AlipayPaymentResultMap" />
    </discriminator>
</resultMap>

<resultMap id="CreditCardPaymentResultMap" type="CreditCardPayment" extends="PaymentResultMap">
    <result property="cardNumber" column="card_number" />
    <result property="expiryDate" column="expiry_date" />
    <result property="cvv" column="cvv" />
</resultMap>

<resultMap id="AlipayPaymentResultMap" type="AlipayPayment" extends="PaymentResultMap">
    <result property="alipayAccount" column="alipay_account" />
</resultMap>

<select id="findPaymentById" resultMap="PaymentResultMap">
    SELECT * FROM payment WHERE id = #{id}
</select>
```

## 6. 高级映射的性能优化

### 6.1 嵌套查询 vs 嵌套结果

| 特性 | 嵌套查询 | 嵌套结果 |
|------|----------|----------|
| SQL查询次数 | 多次 | 一次 |
| 数据库负载 | 较低 | 较高 |
| 内存占用 | 较低 | 较高 |
| 复杂性 | 较低 | 较高 |
| N+1查询问题 | 可能存在 | 不存在 |

### 6.2 延迟加载

延迟加载（Lazy Loading）是指在需要的时候才加载关联对象，而不是在加载主对象时立即加载所有关联对象。这可以显著提高查询性能，特别是当关联对象数据量较大或不总是需要时。

**配置延迟加载：**

```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- 开启延迟加载 -->
    <setting name="lazyLoadingEnabled" value="true" />
    <!-- 关闭积极加载，改为按需加载 -->
    <setting name="aggressiveLazyLoading" value="false" />
    <!-- 启用延迟加载的方法签名匹配 -->
    <setting name="lazyLoadTriggerMethods" value="equals,clone,hashCode,toString" />
</settings>
```

**在映射中使用延迟加载：**

```xml
<resultMap id="UserWithOrdersLazyResultMap" type="User">
    <id property="id" column="id" />
    <result property="userName" column="user_name" />
    <result property="email" column="email" />
    <!-- 延迟加载订单 -->
    <collection property="orders" ofType="Order" select="findOrdersByUserId" column="id" fetchType="lazy" />
</resultMap>
```

### 6.3 避免N+1查询问题

N+1查询问题是指在使用嵌套查询时，可能会产生大量的额外查询。例如，查询100个用户，每个用户都需要额外查询一次订单，总共会产生1+100=101次查询。

**解决方案：**

1. 使用嵌套结果方式，通过一次JOIN查询获取所有数据
2. 使用`fetchType="eager"`强制立即加载，但只在必要时使用
3. 使用MyBatis的`@BatchSize`注解或`batchSize`属性优化嵌套查询

```java
@BatchSize(size = 10)
public List<Order> findOrdersByUserId(Long userId);
```

## 7. 高级映射的最佳实践

### 7.1 合理设计实体关系

1. 避免过度设计，只映射必要的关联关系
2. 优先使用单向关联，避免双向关联带来的复杂性
3. 对于复杂的多对多关系，考虑使用中间实体

### 7.2 选择合适的映射方式

1. 对于简单的关联关系，优先使用嵌套结果方式
2. 对于复杂的关联关系或大数据量，考虑使用嵌套查询+延迟加载
3. 对于继承关系，使用鉴别器映射

### 7.3 优化SQL查询

1. 只查询必要的字段，避免SELECT *
2. 使用适当的索引优化JOIN查询
3. 避免在WHERE子句中使用复杂的表达式

### 7.4 合理使用缓存

1. 对于频繁查询的数据，启用二级缓存
2. 注意缓存的失效策略，避免脏数据
3. 对于关联查询结果，考虑使用缓存引用

## 8. 常见问题及解决方案

### 8.1 关联对象为null

**问题**：查询结果中关联对象为null

**解决方案**：

1. 检查JOIN条件是否正确
2. 检查映射配置中的column属性是否与查询结果的列名一致
3. 检查关联对象的javaType或ofType是否正确

### 8.2 一对多映射重复数据

**问题**：一对多映射时，主对象数据重复

**解决方案**：

1. 确保在resultMap中正确配置了id元素，MyBatis使用id元素来识别唯一对象
2. 检查JOIN查询的结果是否存在重复的主对象记录

### 8.3 N+1查询问题

**问题**：使用嵌套查询时产生大量的额外查询

**解决方案**：

1. 改用嵌套结果方式
2. 使用@BatchSize注解优化嵌套查询
3. 考虑使用延迟加载，只在需要时才加载关联对象

### 8.4 延迟加载不生效

**问题**：配置了延迟加载，但关联对象仍然立即加载

**解决方案**：

1. 检查lazyLoadingEnabled是否设置为true
2. 检查aggressiveLazyLoading是否设置为false（MyBatis 3.4.1之前）
3. 检查是否调用了会触发延迟加载的方法（如toString、equals等）
4. 检查映射配置中是否设置了fetchType="lazy"

### 8.5 鉴别器映射不生效

**问题**：鉴别器映射没有根据条件选择正确的映射策略

**解决方案**：

1. 检查discriminator的column属性是否正确
2. 检查case的value值是否与数据库中的实际值一致
3. 检查case的resultMap是否正确配置

## 9. 总结

MyBatis的高级映射功能是其强大特性之一，它允许开发者轻松处理复杂的数据库关系。通过本文的介绍，我们了解了一对一映射、一对多映射、多对多映射、鉴别器映射等高级映射技巧，以及嵌套查询和嵌套结果、延迟加载等性能优化方法。

在实际开发中，我们应该根据具体的业务需求和性能要求，选择合适的映射方式和优化策略。合理使用高级映射功能，可以显著提高开发效率和系统性能。

希望本文对大家理解和使用MyBatis的高级映射功能有所帮助。

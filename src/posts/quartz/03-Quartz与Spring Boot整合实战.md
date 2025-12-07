---
title: Quartz与Spring Boot整合实战
date: 2023-01-14 08:00:00
categories:
- guide
- quartz
tags:
- Quartz
- Spring Boot
- 定时任务
- 整合
---

## 简介

Spring Boot作为目前最流行的Java企业级开发框架，提供了丰富的自动配置功能，简化了应用程序的开发和部署。Quartz作为功能强大的定时任务调度框架，与Spring Boot的整合可以让开发者更加便捷地实现复杂的定时任务需求。

本文将详细介绍Quartz与Spring Boot的整合方式，包括自动配置原理、依赖设置、基本使用方法、高级特性（如动态任务管理、多数据源支持、事务处理等），以及最佳实践。

## 整合方式

Quartz与Spring Boot的整合主要有两种方式：

1. **使用Spring Boot自带的定时任务**：简单的定时任务可以使用`@Scheduled`注解实现
2. **整合Quartz框架**：复杂的定时任务需求，如持久化、集群部署等，需要使用Quartz框架

本文将重点介绍第二种方式，即整合Quartz框架。

## 依赖设置

首先，需要在Spring Boot项目中添加Quartz的依赖。Spring Boot提供了`spring-boot-starter-quartz`启动器，简化了依赖管理。

### Maven依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
```

### Gradle依赖

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-quartz'
}
```

## 自动配置原理

Spring Boot通过`QuartzAutoConfiguration`类为Quartz提供了自动配置功能，主要包括：

1. **Scheduler自动配置**：自动创建`SchedulerFactoryBean`并初始化`Scheduler`
2. **JobFactory自动配置**：使用`SpringBeanJobFactory`将Job实例化委托给Spring容器
3. **数据源自动配置**：如果配置了数据源，自动使用`JobStoreTX`进行持久化
4. **属性配置**：支持通过`spring.quartz.*`前缀的属性进行配置

### 核心配置类

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(Scheduler.class)
@EnableConfigurationProperties(QuartzProperties.class)
@AutoConfigureAfter({ DataSourceAutoConfiguration.class, JdbcTemplateAutoConfiguration.class })
public class QuartzAutoConfiguration {
    // 自动配置实现
}
```

## 基本使用

### 1. 创建Job类

创建一个继承自`QuartzJobBean`的Job类，或者实现`Job`接口并使用`@Component`注解：

```java
@Component
public class MyQuartzJob extends QuartzJobBean {
    
    private final MyService myService;
    
    public MyQuartzJob(MyService myService) {
        this.myService = myService;
    }
    
    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        // 执行任务逻辑
        myService.doSomething();
        
        // 获取JobDataMap中的参数
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        String param = jobDataMap.getString("param");
        System.out.println("参数: " + param);
    }
}
```

### 2. 配置JobDetail和Trigger

可以通过两种方式配置JobDetail和Trigger：

#### 方式一：Java配置类

```java
@Configuration
public class QuartzConfig {
    
    @Bean
    public JobDetail myJobDetail() {
        return JobBuilder.newJob(MyQuartzJob.class)
                .withIdentity("myJob", "myJobGroup")
                .usingJobData("param", "Hello Quartz")
                .storeDurably()
                .build();
    }
    
    @Bean
    public Trigger myTrigger(JobDetail myJobDetail) {
        return TriggerBuilder.newTrigger()
                .forJob(myJobDetail)
                .withIdentity("myTrigger", "myTriggerGroup")
                .withSchedule(CronScheduleBuilder.cronSchedule("0 0/5 * * * ?")) // 每5分钟执行一次
                .build();
    }
}
```

#### 方式二：使用Spring Boot的配置文件

在`application.properties`或`application.yml`中配置：

```yaml
spring:
  quartz:
    job-store-type: jdbc  # 使用JDBC存储
    jdbc:
      initialize-schema: always  # 初始化数据库表
    properties:
      org:
        quartz:
          scheduler:
            instanceName: springBootQuartzScheduler
            instanceId: AUTO
          jobStore:
            class: org.quartz.impl.jdbcjobstore.JobStoreTX
            driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
            tablePrefix: QRTZ_
            isClustered: true
            clusterCheckinInterval: 10000
          threadPool:
            class: org.quartz.simpl.SimpleThreadPool
            threadCount: 10
            threadPriority: 5
            threadsInheritContextClassLoaderOfInitializingThread: true
```

### 3. 启动应用程序

启动Spring Boot应用程序，Quartz调度器会自动初始化并开始执行任务。

## 高级特性

### 1. 动态任务管理

在实际应用中，可能需要动态地创建、修改、暂停和删除定时任务。可以通过注入`Scheduler`来实现：

```java
@Service
public class QuartzJobService {
    
    private final Scheduler scheduler;
    
    public QuartzJobService(Scheduler scheduler) {
        this.scheduler = scheduler;
    }
    
    // 创建任务
    public String createJob(String jobName, String jobGroup, String triggerName, String triggerGroup, 
                          String cronExpression, Map<String, Object> params) throws SchedulerException {
        
        // 创建JobDetail
        JobDetail jobDetail = JobBuilder.newJob(MyQuartzJob.class)
                .withIdentity(jobName, jobGroup)
                .storeDurably()
                .build();
        
        // 设置参数
        if (params != null && !params.isEmpty()) {
            jobDetail.getJobDataMap().putAll(params);
        }
        
        // 创建Trigger
        Trigger trigger = TriggerBuilder.newTrigger()
                .forJob(jobDetail)
                .withIdentity(triggerName, triggerGroup)
                .withSchedule(CronScheduleBuilder.cronSchedule(cronExpression))
                .build();
        
        // 注册任务
        scheduler.scheduleJob(jobDetail, trigger);
        
        return jobDetail.getKey().toString();
    }
    
    // 修改任务调度规则
    public void updateJobTrigger(String triggerName, String triggerGroup, String cronExpression) 
            throws SchedulerException {
        
        TriggerKey triggerKey = TriggerKey.triggerKey(triggerName, triggerGroup);
        CronTrigger trigger = (CronTrigger) scheduler.getTrigger(triggerKey);
        
        if (trigger != null) {
            // 更新cron表达式
            CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule(cronExpression);
            trigger = trigger.getTriggerBuilder()
                    .withSchedule(scheduleBuilder)
                    .build();
            
            // 重新调度任务
            scheduler.rescheduleJob(triggerKey, trigger);
        }
    }
    
    // 暂停任务
    public void pauseJob(String jobName, String jobGroup) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
        scheduler.pauseJob(jobKey);
    }
    
    // 恢复任务
    public void resumeJob(String jobName, String jobGroup) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
        scheduler.resumeJob(jobKey);
    }
    
    // 删除任务
    public void deleteJob(String jobName, String jobGroup) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
        scheduler.deleteJob(jobKey);
    }
    
    // 立即执行任务
    public void triggerJob(String jobName, String jobGroup) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName, jobGroup);
        scheduler.triggerJob(jobKey);
    }
}
```

### 2. 多数据源支持

在复杂的应用中，可能需要将Quartz的元数据存储在单独的数据源中。可以通过配置多个数据源来实现：

```java
@Configuration
public class DataSourceConfig {
    
    // 主数据源
    @Primary
    @Bean(name = "mainDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.main")
    public DataSource mainDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    // Quartz数据源
    @Bean(name = "quartzDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.quartz")
    public DataSource quartzDataSource() {
        return DataSourceBuilder.create().build();
    }
}
```

然后配置Quartz使用指定的数据源：

```java
@Configuration
public class QuartzDataSourceConfig {
    
    @Bean
    public SchedulerFactoryBean schedulerFactoryBean(@Qualifier("quartzDataSource") DataSource dataSource) {
        SchedulerFactoryBean factoryBean = new SchedulerFactoryBean();
        factoryBean.setDataSource(dataSource);
        factoryBean.setJobFactory(springBeanJobFactory());
        factoryBean.setAutoStartup(true);
        factoryBean.setOverwriteExistingJobs(true);
        
        // 配置Quartz属性
        Properties properties = new Properties();
        properties.setProperty("org.quartz.scheduler.instanceName", "springBootQuartzScheduler");
        properties.setProperty("org.quartz.scheduler.instanceId", "AUTO");
        properties.setProperty("org.quartz.jobStore.class", "org.quartz.impl.jdbcjobstore.JobStoreTX");
        properties.setProperty("org.quartz.jobStore.driverDelegateClass", "org.quartz.impl.jdbcjobstore.StdJDBCDelegate");
        properties.setProperty("org.quartz.jobStore.tablePrefix", "QRTZ_");
        properties.setProperty("org.quartz.jobStore.isClustered", "true");
        properties.setProperty("org.quartz.jobStore.clusterCheckinInterval", "10000");
        properties.setProperty("org.quartz.threadPool.class", "org.quartz.simpl.SimpleThreadPool");
        properties.setProperty("org.quartz.threadPool.threadCount", "10");
        
        factoryBean.setQuartzProperties(properties);
        
        return factoryBean;
    }
    
    @Bean
    public SpringBeanJobFactory springBeanJobFactory() {
        return new SpringBeanJobFactory();
    }
}
```

### 3. 事务处理

在Job中执行的数据库操作需要支持事务，可以通过Spring的声明式事务或编程式事务实现：

#### 方式一：声明式事务

```java
@Component
public class MyTransactionJob extends QuartzJobBean {
    
    private final MyService myService;
    
    public MyTransactionJob(MyService myService) {
        this.myService = myService;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        // 执行事务操作
        myService.doTransactionOperation();
    }
}
```

#### 方式二：编程式事务

```java
@Component
public class MyProgrammaticTransactionJob extends QuartzJobBean {
    
    private final PlatformTransactionManager transactionManager;
    private final MyService myService;
    
    public MyProgrammaticTransactionJob(PlatformTransactionManager transactionManager, MyService myService) {
        this.transactionManager = transactionManager;
        this.myService = myService;
    }
    
    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());
        
        try {
            // 执行事务操作
            myService.doTransactionOperation();
            
            // 提交事务
            transactionManager.commit(status);
        } catch (Exception e) {
            // 回滚事务
            transactionManager.rollback(status);
            throw new JobExecutionException("任务执行失败，事务已回滚", e, false);
        }
    }
}
```

### 4. 任务监听器

可以通过实现`JobListener`接口来监听任务的执行过程：

```java
@Component
public class MyJobListener implements JobListener {
    
    private static final Logger logger = LoggerFactory.getLogger(MyJobListener.class);
    
    @Override
    public String getName() {
        return "myJobListener";
    }
    
    @Override
    public void jobToBeExecuted(JobExecutionContext context) {
        // 任务执行前调用
        logger.info("任务即将执行: {}", context.getJobDetail().getKey());
    }
    
    @Override
    public void jobExecutionVetoed(JobExecutionContext context) {
        // 任务被否决时调用
        logger.info("任务被否决: {}", context.getJobDetail().getKey());
    }
    
    @Override
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException) {
        // 任务执行后调用
        if (jobException != null) {
            logger.error("任务执行失败: {}", context.getJobDetail().getKey(), jobException);
        } else {
            logger.info("任务执行成功: {}", context.getJobDetail().getKey());
        }
    }
}
```

然后在配置类中注册监听器：

```java
@Configuration
public class QuartzListenerConfig {
    
    @Bean
    public SchedulerFactoryBeanCustomizer schedulerFactoryBeanCustomizer(MyJobListener myJobListener) {
        return factoryBean -> {
            // 全局注册监听器
            factoryBean.setGlobalJobListeners(myJobListener);
            
            // 或针对特定任务注册监听器
            // factoryBean.setJobListeners(myJobListener);
        };
    }
}
```

## 配置属性

Spring Boot支持通过`application.properties`或`application.yml`配置Quartz的各种属性，主要包括：

```yaml
spring:
  quartz:
    # 任务存储类型：memory（内存）或jdbc（数据库）
    job-store-type: jdbc
    
    # JDBC相关配置
    jdbc:
      # 是否初始化数据库表
      initialize-schema: always
      # 数据源名称
      data-source-name: quartzDataSource
    
    # 调度器相关配置
    scheduler:
      # 是否自动启动
      auto-startup: true
      # 是否覆盖已存在的任务
      overwrite-existing-jobs: true
      # 启动延迟时间（毫秒）
      startup-delay: 0
      # 调度器名称
      instance-name: springBootQuartzScheduler
      # 调度器实例ID
      instance-id: AUTO
    
    # 线程池配置
    thread-pool:
      # 线程数量
      size: 10
      # 线程优先级
      thread-priority: 5
      # 线程组名称
      thread-group-name: QuartzThreadGroup
    
    # 其他Quartz属性
    properties:
      org:
        quartz:
          jobStore:
            # 存储类
            class: org.quartz.impl.jdbcjobstore.JobStoreTX
            # 驱动委托类
            driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
            # 表前缀
            tablePrefix: QRTZ_
            # 是否集群
            isClustered: true
            # 集群检查间隔（毫秒）
            clusterCheckinInterval: 10000
            # 数据保存时间（毫秒）
            misfireThreshold: 60000
          threadPool:
            # 线程池类
            class: org.quartz.simpl.SimpleThreadPool
            # 线程数量
            threadCount: 10
            # 线程优先级
            threadPriority: 5
            # 是否继承上下文类加载器
            threadsInheritContextClassLoaderOfInitializingThread: true
```

## 最佳实践

### 1. 任务粒度设计

- 将任务拆分为小粒度的独立任务，便于管理和监控
- 避免在单个任务中执行过多的业务逻辑，影响任务的可靠性

### 2. 异常处理

- 始终在Job中捕获并处理异常，避免任务执行失败导致整个调度器出现问题
- 对关键任务实现重试机制，提高任务的可靠性

### 3. 日志记录

- 详细记录任务的执行情况，包括开始时间、结束时间、执行结果等
- 使用结构化日志，便于日志分析和监控

### 4. 性能优化

- 根据任务数量和执行频率，合理配置线程池大小
- 避免在任务执行期间进行耗时的IO操作，如网络请求、文件读写等
- 对频繁执行的任务进行性能优化，减少执行时间

### 5. 监控与告警

- 实现任务执行情况的监控，包括任务执行次数、成功率、执行时间等
- 对任务执行失败、超时等异常情况设置告警机制

### 6. 测试策略

- 编写单元测试验证Job的业务逻辑
- 编写集成测试验证任务的调度和执行
- 在测试环境充分测试任务的调度规则和执行情况

## 常见问题及解决方案

### 1. 任务不执行

- 检查是否配置了正确的cron表达式
- 检查Quartz调度器是否正常启动
- 检查Job类是否被Spring容器正确管理
- 检查是否有足够的线程资源

### 2. 任务重复执行

- 检查集群配置是否正确，避免多个节点同时执行任务
- 检查任务的并发设置，如使用`@DisallowConcurrentExecution`注解

### 3. 事务不生效

- 确保使用了正确的事务管理器
- 确保事务注解被正确应用
- 检查是否在Job的execute方法中直接调用了非事务方法

### 4. 参数传递问题

- 使用JobDataMap传递参数时，注意参数的类型转换
- 避免传递不可序列化的对象

## 总结

Quartz与Spring Boot的整合为开发者提供了强大而便捷的定时任务解决方案。通过自动配置功能，开发者可以快速搭建定时任务系统；通过动态任务管理，可以灵活地创建、修改和删除任务；通过多数据源支持和事务处理，可以满足复杂的企业级应用需求。

在实际应用中，需要根据具体的业务需求选择合适的整合方式，并遵循最佳实践，确保定时任务的可靠性、性能和可维护性。

在后续文章中，我们将深入探讨Quartz的集群部署、动态任务管理和性能优化等高级话题。

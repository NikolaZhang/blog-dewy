---
title: Quartz基本使用方法详解
date: 2023-01-13 08:00:00
categories:
- guide
- quartz
tags:
- Quartz
- 定时任务
- 使用方法
---

## 简介

Quartz作为一个功能强大的Java定时任务调度框架，提供了丰富的API来创建和管理定时任务。本文将详细介绍Quartz的基本使用方法，包括核心API的使用、各种触发器的配置、任务数据传递、任务调度控制等内容。

## 环境准备

在使用Quartz之前，需要先添加依赖。以Maven为例，添加以下依赖到pom.xml文件中：

```xml
<dependency>
    <groupId>org.quartz-scheduler</groupId>
    <artifactId>quartz</artifactId>
    <version>2.3.2</version>
</dependency>
<dependency>
    <groupId>org.quartz-scheduler</groupId>
    <artifactId>quartz-jobs</artifactId>
    <version>2.3.2</version>
</dependency>
```

## 核心API使用

### 1. 初始化Scheduler

Scheduler是Quartz的核心，所有的任务调度都通过Scheduler进行。初始化Scheduler的代码如下：

```java
// 创建调度器工厂
SchedulerFactory schedulerFactory = new StdSchedulerFactory();

// 获取调度器实例
Scheduler scheduler = schedulerFactory.getScheduler();
```

### 2. 创建Job

Job是需要执行的任务逻辑，需要实现`Job`接口并覆写`execute()`方法：

```java
public class HelloJob implements Job {
    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // 获取当前时间
        Date now = new Date();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        
        // 获取JobDataMap中的数据
        JobDataMap dataMap = context.getMergedJobDataMap();
        String jobName = dataMap.getString("jobName");
        
        System.out.println(jobName + " 执行时间: " + sdf.format(now));
    }
}
```

### 3. 创建JobDetail

JobDetail用于描述Job的实例，包含Job的名称、组名、描述等信息：

```java
JobDetail jobDetail = JobBuilder.newJob(HelloJob.class)
    .withIdentity("helloJob", "defaultGroup")  // 设置Job的唯一标识（名称+组名）
    .withDescription("这是一个简单的Hello World任务")  // 设置Job描述
    .usingJobData("jobName", "HelloJob")  // 设置JobDataMap参数
    .storeDurably()  // 即使没有Trigger关联，也保存Job
    .build();
```

### 4. 创建Trigger

Trigger定义了任务的调度规则，Quartz提供了多种类型的触发器。

#### 4.1 SimpleTrigger

SimpleTrigger用于实现简单的调度规则，如固定间隔执行、执行N次等：

```java
// 立即执行，然后每隔1秒执行一次，共执行5次
Trigger simpleTrigger = TriggerBuilder.newTrigger()
    .withIdentity("simpleTrigger", "defaultGroup")
    .withDescription("简单触发器")
    .startNow()  // 立即开始
    .withSchedule(SimpleScheduleBuilder.simpleSchedule()
        .withIntervalInSeconds(1)  // 执行间隔为1秒
        .withRepeatCount(4))  // 重复执行4次（共执行5次）
    .usingJobData("triggerParam", "simpleParam")  // 在Trigger中设置参数
    .build();

// 延迟2秒后执行，然后不再执行
Trigger onceTrigger = TriggerBuilder.newTrigger()
    .withIdentity("onceTrigger", "defaultGroup")
    .startAt(new Date(System.currentTimeMillis() + 2000))  // 延迟2秒执行
    .build();
```

#### 4.2 CronTrigger

CronTrigger使用Cron表达式实现复杂的调度规则，如每天9点执行、每周一执行等：

```java
// 每天上午9点执行
Trigger cronTrigger = TriggerBuilder.newTrigger()
    .withIdentity("cronTrigger", "defaultGroup")
    .withDescription("Cron表达式触发器")
    .withSchedule(CronScheduleBuilder.cronSchedule("0 0 9 * * ?"))  // 每天9点执行
    .build();

// 每分钟的第15秒执行
Trigger everyMinuteTrigger = TriggerBuilder.newTrigger()
    .withIdentity("everyMinuteTrigger", "defaultGroup")
    .withSchedule(CronScheduleBuilder.cronSchedule("15 * * * * ?"))
    .build();
```

#### 4.3 DailyTimeIntervalTrigger

DailyTimeIntervalTrigger用于实现每天内的时间间隔调度，如每天9:00-18:00，每隔30分钟执行一次：

```java
Trigger dailyTrigger = TriggerBuilder.newTrigger()
    .withIdentity("dailyTrigger", "defaultGroup")
    .withDescription("每天时间间隔触发器")
    .withSchedule(DailyTimeIntervalScheduleBuilder.dailyTimeIntervalSchedule()
        .startingDailyAt(TimeOfDay.hourAndMinuteOfDay(9, 0))  // 每天9:00开始
        .endingDailyAt(TimeOfDay.hourAndMinuteOfDay(18, 0))  // 每天18:00结束
        .withIntervalInMinutes(30)  // 间隔30分钟
        .onDaysOfTheWeek(1, 2, 3, 4, 5))  // 周一到周五执行
    .build();
```

#### 4.4 CalendarIntervalTrigger

CalendarIntervalTrigger用于实现日历相关的时间间隔调度，如每月执行一次、每年执行一次：

```java
// 每月1号凌晨1点执行
Trigger monthlyTrigger = TriggerBuilder.newTrigger()
    .withIdentity("monthlyTrigger", "defaultGroup")
    .withDescription("日历间隔触发器")
    .withSchedule(CalendarIntervalScheduleBuilder.calendarIntervalSchedule()
        .withIntervalInMonths(1))  // 每月执行一次
    .build();
```

### 5. 注册Job和Trigger

创建好JobDetail和Trigger后，需要将它们注册到Scheduler中：

```java
// 注册JobDetail和Trigger
if (!scheduler.checkExists(jobDetail.getKey())) {
    scheduler.scheduleJob(jobDetail, trigger);
}

// 如果JobDetail已经存在，可以单独注册Trigger
scheduler.scheduleJob(trigger);

// 或者使用批量注册
Map<JobDetail, Set<? extends Trigger>> jobTriggerMap = new HashMap<>();
jobTriggerMap.put(jobDetail1, Collections.singleton(trigger1));
jobTriggerMap.put(jobDetail2, Collections.singleton(trigger2));
scheduler.scheduleJobs(jobTriggerMap, false);
```

### 6. 启动和停止Scheduler

```java
// 启动Scheduler
scheduler.start();

// 暂停Scheduler（不会中断正在执行的任务）
scheduler.standby();

// 恢复Scheduler
scheduler.start();

// 关闭Scheduler（会等待正在执行的任务完成）
scheduler.shutdown();

// 立即关闭Scheduler（不会等待正在执行的任务完成）
scheduler.shutdown(true);
```

## JobDataMap使用

JobDataMap用于在Job执行时传递参数数据，支持多种数据类型：

### 1. 设置JobDataMap

```java
// 在创建JobDetail时设置
JobDetail jobDetail = JobBuilder.newJob(HelloJob.class)
    .usingJobData("stringParam", "value1")
    .usingJobData("intParam", 123)
    .usingJobData("doubleParam", 3.14)
    .build();

// 在创建Trigger时设置
Trigger trigger = TriggerBuilder.newTrigger()
    .usingJobData("triggerParam", "triggerValue")
    .build();
```

### 2. 获取JobDataMap

```java
public class HelloJob implements Job {
    // 通过成员变量注入（需要提供setter方法）
    private String stringParam;
    private int intParam;
    
    public void setStringParam(String stringParam) {
        this.stringParam = stringParam;
    }
    
    public void setIntParam(int intParam) {
        this.intParam = intParam;
    }
    
    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // 方式1：通过context获取合并后的JobDataMap
        JobDataMap mergedDataMap = context.getMergedJobDataMap();
        String triggerParam = mergedDataMap.getString("triggerParam");
        
        // 方式2：通过JobDetail获取JobDataMap
        JobDataMap jobDataMap = context.getJobDetail().getJobDataMap();
        
        // 方式3：通过Trigger获取JobDataMap
        JobDataMap triggerDataMap = context.getTrigger().getJobDataMap();
        
        System.out.println("stringParam: " + stringParam);  // 通过成员变量获取
        System.out.println("intParam: " + intParam);  // 通过成员变量获取
        System.out.println("triggerParam: " + triggerParam);  // 通过context获取
    }
}
```

## 任务调度控制

### 1. 暂停和恢复任务

```java
// 暂停指定组的所有Job
scheduler.pauseJobs(GroupMatcher.jobGroupEquals("defaultGroup"));

// 暂停指定Job
scheduler.pauseJob(JobKey.jobKey("helloJob", "defaultGroup"));

// 暂停指定组的所有Trigger
scheduler.pauseTriggers(GroupMatcher.triggerGroupEquals("defaultGroup"));

// 暂停指定Trigger
scheduler.pauseTrigger(TriggerKey.triggerKey("simpleTrigger", "defaultGroup"));

// 恢复所有Job
scheduler.resumeAll();

// 恢复指定Job
scheduler.resumeJob(JobKey.jobKey("helloJob", "defaultGroup"));
```

### 2. 删除任务

```java
// 删除指定Job（会同时删除关联的Trigger）
bool success = scheduler.deleteJob(JobKey.jobKey("helloJob", "defaultGroup"));

// 删除指定Trigger
bool success = scheduler.unscheduleJob(TriggerKey.triggerKey("simpleTrigger", "defaultGroup"));

// 批量删除Trigger
List<TriggerKey> triggerKeys = new ArrayList<>();
triggerKeys.add(TriggerKey.triggerKey("trigger1", "defaultGroup"));
triggerKeys.add(TriggerKey.triggerKey("trigger2", "defaultGroup"));
bool success = scheduler.unscheduleJobs(triggerKeys);
```

### 3. 立即执行任务

```java
// 立即执行任务（忽略Trigger的调度规则）
JobDataMap dataMap = new JobDataMap();
dataMap.put("immediateParam", "immediateValue");
scheduler.triggerJob(JobKey.jobKey("helloJob", "defaultGroup"), dataMap);
```

### 4. 重新调度任务

```java
// 获取旧的Trigger
Trigger oldTrigger = scheduler.getTrigger(TriggerKey.triggerKey("oldTrigger", "defaultGroup"));

// 创建新的Trigger
Trigger newTrigger = TriggerBuilder.newTrigger()
    .withIdentity("newTrigger", "defaultGroup")
    .withSchedule(SimpleScheduleBuilder.simpleSchedule()
        .withIntervalInSeconds(5)
        .repeatForever())
    .build();

// 重新调度任务
scheduler.rescheduleJob(oldTrigger.getKey(), newTrigger);
```

## Scheduler配置

### 1. 编程方式配置

```java
// 创建配置属性
Properties props = new Properties();
props.setProperty("org.quartz.scheduler.instanceName", "MyScheduler");
props.setProperty("org.quartz.scheduler.instanceId", "AUTO");

// 配置线程池
props.setProperty("org.quartz.threadPool.class", "org.quartz.simpl.SimpleThreadPool");
props.setProperty("org.quartz.threadPool.threadCount", "10");
props.setProperty("org.quartz.threadPool.threadPriority", "5");

// 配置存储
props.setProperty("org.quartz.jobStore.class", "org.quartz.simpl.RAMJobStore");

// 创建调度器工厂
SchedulerFactory schedulerFactory = new StdSchedulerFactory(props);

// 获取调度器
Scheduler scheduler = schedulerFactory.getScheduler();
```

### 2. 配置文件方式

创建`quartz.properties`文件放在classpath下：

```properties
# 调度器配置
org.quartz.scheduler.instanceName = MyScheduler
org.quartz.scheduler.instanceId = AUTO

# 线程池配置
org.quartz.threadPool.class = org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount = 10
org.quartz.threadPool.threadPriority = 5

# 存储配置
org.quartz.jobStore.class = org.quartz.simpl.RAMJobStore
```

## 完整示例

以下是一个完整的Quartz使用示例：

```java
import org.quartz.*;
import org.quartz.impl.StdSchedulerFactory;

import java.util.Date;
import java.text.SimpleDateFormat;

public class QuartzExample {
    public static void main(String[] args) throws SchedulerException, InterruptedException {
        // 1. 创建调度器
        SchedulerFactory schedulerFactory = new StdSchedulerFactory();
        Scheduler scheduler = schedulerFactory.getScheduler();
        
        // 2. 创建JobDetail
        JobDetail jobDetail = JobBuilder.newJob(HelloJob.class)
            .withIdentity("helloJob", "defaultGroup")
            .usingJobData("jobName", "HelloJob")
            .build();
        
        // 3. 创建Trigger
        Trigger trigger = TriggerBuilder.newTrigger()
            .withIdentity("simpleTrigger", "defaultGroup")
            .startNow()
            .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                .withIntervalInSeconds(2)
                .withRepeatCount(4))
            .build();
        
        // 4. 注册任务和触发器
        scheduler.scheduleJob(jobDetail, trigger);
        
        // 5. 启动调度器
        System.out.println("调度器启动时间: " + new Date());
        scheduler.start();
        
        // 等待任务执行完成
        Thread.sleep(15000);
        
        // 6. 关闭调度器
        System.out.println("调度器关闭时间: " + new Date());
        scheduler.shutdown();
    }
    
    public static class HelloJob implements Job {
        @Override
        public void execute(JobExecutionContext context) throws JobExecutionException {
            // 获取当前时间
            Date now = new Date();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            
            // 获取JobDataMap中的数据
            JobDataMap dataMap = context.getMergedJobDataMap();
            String jobName = dataMap.getString("jobName");
            
            System.out.println(jobName + " 执行时间: " + sdf.format(now));
        }
    }
}
```

## 注意事项

1. **Job实例的生命周期**：每次任务执行时，Quartz都会创建一个新的Job实例，执行完成后会被垃圾回收。

2. **线程安全性**：Job的`execute()`方法可能被多个线程同时调用（当同一个Job被多个Trigger触发时），需要注意线程安全问题。

3. **异常处理**：在`execute()`方法中抛出的异常会被Quartz捕获并处理，不会影响其他任务的执行。如果需要在任务执行失败时进行特殊处理，可以使用JobExecutionException的相关方法。

4. **资源清理**：Job执行完成后，需要手动清理打开的资源，如数据库连接、文件流等。

5. **调度器关闭**：应用程序关闭时，需要调用`scheduler.shutdown()`方法来优雅地关闭调度器，确保所有正在执行的任务能够完成。

## 总结

本文详细介绍了Quartz的基本使用方法，包括核心API的使用、各种触发器的配置、JobDataMap的使用和任务调度控制等内容。通过这些基础知识，开发者可以灵活地使用Quartz来实现各种定时任务需求。

在后续文章中，我们将深入探讨Quartz与Spring Boot的整合、动态任务管理、集群部署和源码分析等高级主题。

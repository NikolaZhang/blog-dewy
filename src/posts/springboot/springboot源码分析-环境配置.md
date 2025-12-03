---
isOriginal: true
title: springboot源码分析[3]环境配置加载
tag:
  - springboot
  - Environment
category: 源码
date: 2020-05-06
description: springboot源码分析
sticky: false
timeline: true
article: true
star: false
---

> 看一下环境加载相关的代码

## 总述

环境配置加载的相关代码

```java
ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);
configureIgnoreBeanInfo(environment);
```

## ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);

```java
public DefaultApplicationArguments(String... args) {
  Assert.notNull(args, "Args must not be null");
  this.source = new Source(args);
  this.args = args;
}
```

new Source层层调用后的关键逻辑为:

```java
public SimpleCommandLinePropertySource(String... args) {
  super(new SimpleCommandLineArgsParser().parse(args));
}
public CommandLinePropertySource(T source) {
  super(COMMAND_LINE_PROPERTY_SOURCE_NAME, source);
}
public PropertySource(String name, T source) {
  Assert.hasText(name, "Property source name must contain at least one character");
  Assert.notNull(source, "Property source must not be null");
  this.name = name;
  this.source = source;
}
```

使用`PropertySource`这个抽象父类去存放当前的参数类型和参数值. `DefaultApplicationArguments`解析的参数类型为`COMMAND_LINE_PROPERTY_SOURCE_NAME`即命令行参数.
参数值是使用`new SimpleCommandLineArgsParser().parse(args)`进行解析的. `parse`方法返回对象为`CommandLineArgs`类型.

### 关于SimpleCommandLineArgsParser

分两种情况解析:

1. `optionArgs`, 字符串中包含"--"
  这种情况又分为两种 1.含有"="2.不含有等号 含有等号就通过截取字符串的方式获取键和对应的值; 不含有等号其值就为null
2. `nonOptionArgs`, 字符串中不包含"--"

针对这两种类型, `CommandLineArgs commandLineArgs`分别使用:
`Map<String, List<String>> optionArgs = new HashMap<>();`和`List<String> nonOptionArgs = new ArrayList<>();`进行存放.
注意`optionArgs`的值为List结构

```java
public CommandLineArgs parse(String... args) {
  CommandLineArgs commandLineArgs = new CommandLineArgs();
  for (String arg : args) {
    if (arg.startsWith("--")) {
      String optionText = arg.substring(2, arg.length());
      String optionName;
      String optionValue = null;
      if (optionText.contains("=")) {
        optionName = optionText.substring(0, optionText.indexOf('='));
        optionValue = optionText.substring(optionText.indexOf('=')+1, optionText.length());
      }
      else {
        optionName = optionText;
      }
      if (optionName.isEmpty() || (optionValue != null && optionValue.isEmpty())) {
        throw new IllegalArgumentException("Invalid argument syntax: " + arg);
      }
      commandLineArgs.addOptionArg(optionName, optionValue);
    }
    else {
      commandLineArgs.addNonOptionArg(arg);
    }
  }
  return commandLineArgs;
}
```

## ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);

```java
private ConfigurableEnvironment prepareEnvironment(SpringApplicationRunListeners listeners,
    ApplicationArguments applicationArguments) {
  // Create and configure the environment
  ConfigurableEnvironment environment = getOrCreateEnvironment();
  configureEnvironment(environment, applicationArguments.getSourceArgs());
  ConfigurationPropertySources.attach(environment);
  listeners.environmentPrepared(environment);
  bindToSpringApplication(environment);
  if (!this.isCustomEnvironment) {
    environment = new EnvironmentConverter(getClassLoader()).convertEnvironmentIfNecessary(environment,
        deduceEnvironmentClass());
  }
  ConfigurationPropertySources.attach(environment);
  return environment;
}
```

### getOrCreateEnvironment

根据`new SpringApplication`是设置的`webApplicationType`加载不同的环境:

```java
private ConfigurableEnvironment getOrCreateEnvironment() {
  if (this.environment != null) {
    return this.environment;
  }
  switch (this.webApplicationType) {
  case SERVLET:
    return new StandardServletEnvironment();
  case REACTIVE:
    return new StandardReactiveWebEnvironment();
  default:
    return new StandardEnvironment();
  }
}
```

目前最常见的就是`SERVLET`类型. 以此为例. 其需要创建一个`StandardServletEnvironment`类型对象.
该类的继承关系见下:
![2020-05-07-22-17-45](http://dewy-blog.nikolazh.eu.org/2020-05-07-22-17-45.png)

上面的代码逻辑只是调用了该类默认的构造方法, 具体之后要做什么尚未可知, 不过根据该类继承的关系来看, 至少是要设置诸如: `servletContextInitParams`, `servletConfigInitParams`, `jndiProperties`, `systemEnvironment`等等的属性. 当然这个类只是提供了这种环境应该要设置哪些参数, 最终的参数类型和参数值还是要通过`PropertySource`存放的. 这段描述还有待验证(TODO).

## configureIgnoreBeanInfo(environment)

```java
private void configureIgnoreBeanInfo(ConfigurableEnvironment environment) {
  if (System.getProperty(CachedIntrospectionResults.IGNORE_BEANINFO_PROPERTY_NAME) == null) {
    Boolean ignore = environment.getProperty("spring.beaninfo.ignore", Boolean.class, Boolean.TRUE);
    System.setProperty(CachedIntrospectionResults.IGNORE_BEANINFO_PROPERTY_NAME, ignore.toString());
  }
}
```

如果没有设置`spring.beaninfo.ignore`属性值, 则设置为true.

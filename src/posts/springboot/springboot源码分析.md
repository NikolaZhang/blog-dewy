---
isOriginal: true
title: springboot 源码分析[1] new SpringApplication
tag:
  - springboot
  - SpringApplication
category: 源码
date: 2020-05-04
description: springboot源码分析
sticky: false
timeline: true
article: true
star: false
---

> 看一看springboot的源码。该源码是2.2.4.RELEASE版本的。

## SpringApplication

```java
public static ConfigurableApplicationContext run(Class<?>[] primarySources, String[] args) {
  return new SpringApplication(primarySources).run(args);
}

public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
  this.resourceLoader = resourceLoader;
  Assert.notNull(primarySources, "PrimarySources must not be null");
  this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
  this.webApplicationType = WebApplicationType.deduceFromClasspath();
  setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
  setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
  this.mainApplicationClass = deduceMainApplicationClass();
}
```

应用启动的时候首先要通过new SpringApplication创建一个应用的基本信息的对象. 之后调用`run`方法进行环境和上下文的配置等等.
上面的这段代码这里主要是初始化`SpringApplication`的一些成员变量:
`ResourceLoader resourceLoader`为null,
`Class<?>... primarySources`为包含启动类的class数组.
`WebApplicationType webApplicationType`: 表示当前应用的类型. 值有`NONE`, `SERVLET`, `REACTIVE`. 含义分别是非web应用, 基于servlet的web应用, 基于响应式的web应用. 低版本的springboot的类型为布尔类型, 表示当前应用是否为web类型.
`setInitializers(....)`这个方法用于设置`List<ApplicationContextInitializer<?>> initializers`, 加载所有的上下文初始化器.
`setListeners(....)`这个方法用于设置`List<ApplicationListener<?>> listeners`, 加载所有的监听器.
`Class<?> mainApplicationClass`表示当前应用的主类.

### WebApplicationType.deduceFromClasspath()

```java
private static final String[] SERVLET_INDICATOR_CLASSES = { "javax.servlet.Servlet",
    "org.springframework.web.context.ConfigurableWebApplicationContext" };

private static final String WEBMVC_INDICATOR_CLASS = "org.springframework.web.servlet.DispatcherServlet";

private static final String WEBFLUX_INDICATOR_CLASS = "org.springframework.web.reactive.DispatcherHandler";

private static final String JERSEY_INDICATOR_CLASS = "org.glassfish.jersey.servlet.ServletContainer";

private static final String SERVLET_APPLICATION_CONTEXT_CLASS = "org.springframework.web.context.WebApplicationContext";

private static final String REACTIVE_APPLICATION_CONTEXT_CLASS = "org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext";

static WebApplicationType deduceFromClasspath() {
  if (ClassUtils.isPresent(WEBFLUX_INDICATOR_CLASS, null) && !ClassUtils.isPresent(WEBMVC_INDICATOR_CLASS, null)
      && !ClassUtils.isPresent(JERSEY_INDICATOR_CLASS, null)) {
    return WebApplicationType.REACTIVE;
  }
  for (String className : SERVLET_INDICATOR_CLASSES) {
    if (!ClassUtils.isPresent(className, null)) {
      return WebApplicationType.NONE;
    }
  }
  return WebApplicationType.SERVLET;
}
```

如果我们想要在应用启动的时候推断web应用的类型, 最直接的方法就是, 判断当前应用中包含了什么依赖. 是否含有依赖中的类文件.
这里主要使用了`ClassUtils.isPresent`该方法通过反射去判断能否加载指定字符串的类, 如果没有抛异常, 这说明类是存在的.

```java
public static boolean isPresent(String className, @Nullable ClassLoader classLoader) {
  try {
    forName(className, classLoader);
    return true;
  }
  catch (IllegalAccessError err) {
    throw new IllegalStateException("Readability mismatch in inheritance hierarchy of class [" +
        className + "]: " + err.getMessage(), err);
  }
  catch (Throwable ex) {
    // Typically ClassNotFoundException or NoClassDefFoundError...
    return false;
  }
}
```

### setInitializers和setListeners

这两个方法逻辑结构相同, 是通过工厂模式, 获取指定接口的实现. 我们只以前者为例讲解:

```java
private <T> Collection<T> getSpringFactoriesInstances(Class<T> type) {
  return getSpringFactoriesInstances(type, new Class<?>[] {});
}

private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
  ClassLoader classLoader = getClassLoader();
  // Use names and ensure unique to protect against duplicates
  Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
  List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
  AnnotationAwareOrderComparator.sort(instances);
  return instances;
}
```

重要的方法有两个`loadFactoryNames`和`createSpringFactoriesInstances`.
下面分别来看一下:

#### loadFactoryNames

```java
public static List<String> loadFactoryNames(Class<?> factoryType, @Nullable ClassLoader classLoader) {
  String factoryTypeName = factoryType.getName();
  return loadSpringFactories(classLoader).getOrDefault(factoryTypeName, Collections.emptyList());
}
```

```java
public static final String FACTORIES_RESOURCE_LOCATION = "META-INF/spring.factories";

private static Map<String, List<String>> loadSpringFactories(@Nullable ClassLoader classLoader) {
  MultiValueMap<String, String> result = cache.get(classLoader);
  if (result != null) {
    return result;
  }

  try {
    Enumeration<URL> urls = (classLoader != null ?
        classLoader.getResources(FACTORIES_RESOURCE_LOCATION) :
        ClassLoader.getSystemResources(FACTORIES_RESOURCE_LOCATION));
    result = new LinkedMultiValueMap<>();
    while (urls.hasMoreElements()) {
      URL url = urls.nextElement();
      UrlResource resource = new UrlResource(url);
      Properties properties = PropertiesLoaderUtils.loadProperties(resource);
      for (Map.Entry<?, ?> entry : properties.entrySet()) {
        String factoryTypeName = ((String) entry.getKey()).trim();
        for (String factoryImplementationName : StringUtils.commaDelimitedListToStringArray((String) entry.getValue())) {
          result.add(factoryTypeName, factoryImplementationName.trim());
        }
      }
    }
    cache.put(classLoader, result);
    return result;
  }
  catch (IOException ex) {
    throw new IllegalArgumentException("Unable to load factories from location [" +
        FACTORIES_RESOURCE_LOCATION + "]", ex);
  }
}
```

`SpringFactoriesLoader.loadFactoryNames`中`loadSpringFactories`去加载`META-INF/spring.factories`中的配置, 将配置字符串放到`MultiValueMap<String, String> result`对象中.

`spring.factories`文件, 一个key对应一个value, key是从工厂获取实例的接口类字符串, value是接口的实现, 多个实现就通过逗号拼接. 为了优化加载, 会将加载的结果放到缓存`Map<ClassLoader, MultiValueMap<String, String>> cache = new ConcurrentReferenceHashMap<>()`中, 其key为加载当前配置使用的classloader. 最后我们想获取什么配置直接通过接口全类名即可拿到, 也就是`getOrDefault`.

有了所有实现的集合, 通过`createSpringFactoriesInstances`利用反射构建这些类的实例.

最后会对这些实例进行排序, 排序的逻辑见下:

```java
@Override
public int compare(@Nullable Object o1, @Nullable Object o2) {
  return doCompare(o1, o2, null);
}

private int doCompare(@Nullable Object o1, @Nullable Object o2, @Nullable OrderSourceProvider sourceProvider) {
  boolean p1 = (o1 instanceof PriorityOrdered);
  boolean p2 = (o2 instanceof PriorityOrdered);
  if (p1 && !p2) {
    return -1;
  }
  else if (p2 && !p1) {
    return 1;
  }

  int i1 = getOrder(o1, sourceProvider);
  int i2 = getOrder(o2, sourceProvider);
  return Integer.compare(i1, i2);
}
private int getOrder(@Nullable Object obj, @Nullable OrderSourceProvider sourceProvider) {
  Integer order = null;
  if (obj != null && sourceProvider != null) {
    Object orderSource = sourceProvider.getOrderSource(obj);
    if (orderSource != null) {
      if (orderSource.getClass().isArray()) {
        Object[] sources = ObjectUtils.toObjectArray(orderSource);
        for (Object source : sources) {
          order = findOrder(source);
          if (order != null) {
            break;
          }
        }
      }
      else {
        order = findOrder(orderSource);
      }
    }
  }
  return (order != null ? order : getOrder(obj));
}
protected int getOrder(@Nullable Object obj) {
  if (obj != null) {
    Integer order = findOrder(obj);
    if (order != null) {
      return order;
    }
  }
  return Ordered.LOWEST_PRECEDENCE;
}
protected Integer findOrder(Object obj) {
  return (obj instanceof Ordered ? ((Ordered) obj).getOrder() : null);
}

```

举个例子:
![2020-05-04-14-29-51](http://dewy-blog.nikolazh.eu.org/2020-05-04-14-29-51.png)

如果两个类都实现了PriorityOrdered接口, 则可以直接获取他们的order并比较.
如果一个类实现了Ordered接口, 并设置了order那么通过`((Ordered) obj).getOrder()`我们就可以去到值.
如果order为null就返回`Ordered.LOWEST_PRECEDENCE`即`Integer.MAX_VALUE`

使用`OrderSourceProvider`函数, 给出一个可替换的对象, 去获取它的排序. 如果对象为数组则循环直到出现一个order不为空的值为止.

### deduceMainApplicationClass

```java
private Class<?> deduceMainApplicationClass() {
  try {
    StackTraceElement[] stackTrace = new RuntimeException().getStackTrace();
    for (StackTraceElement stackTraceElement : stackTrace) {
      if ("main".equals(stackTraceElement.getMethodName())) {
        return Class.forName(stackTraceElement.getClassName());
      }
    }
  }
  catch (ClassNotFoundException ex) {
    // Swallow and continue
  }
  return null;
}
```

通过`new RuntimeException().getStackTrace()`获取当前的调用栈, 查找含有main方法的类.

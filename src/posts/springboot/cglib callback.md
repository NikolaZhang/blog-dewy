---
isOriginal: true
title: cglib回调器
tag:
  - proxy
  - cglib
  - 回调
category: cglib
date: 2020-06-21
description: cglib的回调器类型及使用方法
sticky: false
timeline: true
article: true
star: false
---

> 使用Enhance的callback方法可以指定回调, 方法的参数类型为Callback类型. 这篇文章就分析这些callback的使用情景

我们可以看到Callback接口一共有7种实现.

![2020-06-25-16-48-08](http://dewy-blog.nikolazh.eu.org/2020-06-25-16-48-08.png)

## MethodInterceptor

这是一种可以实现环绕增强的回调类型.

```java
@Test
public void testMethodInterceptor() {
    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(UserService.class);
    enhancer.setCallback((MethodInterceptor) (obj, method, args, proxy) -> {
        System.out.println("====== begin");
        Object object = proxy.invokeSuper(obj, args);
        System.out.println("====== end");
        return object;
    });
    UserService userServiceProxy = (UserService) enhancer.create();
    userServiceProxy.getInfo();
}
```

## NoOp

不进行其他操作, 直接执行目标方法

```java
@Test
public void testNoOp() {
    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(InfoService.class);
    enhancer.setCallback(NoOp.INSTANCE);
    InfoService selectProxy = (InfoService) enhancer.create();
    selectProxy.select();
}
```

## FixedValue

代理的方法始终返回给定的固定值

```java
@Test
public void testFixedValue() {

    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(InfoService.class);
    enhancer.setCallback((FixedValue) () -> 'a');
    InfoService selectProxy = (InfoService) enhancer.create();
    System.out.println(selectProxy.selectWord());
    selectProxy.select();
}
```

## Dispatcher

callback返回一个可以执行原始方法的对象.
每次调用目标方法都会执行callback.

```java
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(InfoService.class);
enhancer.setCallback((Dispatcher) () -> {
    InfoService infoService = new InfoService();
    System.out.println("====="+infoService);
    return infoService;
});
InfoService infoServiceProxy = (InfoService) enhancer.create();
infoServiceProxy.select();
infoServiceProxy.update();
```

运行结果:

```
=====demo.service.InfoService@1c6b6478
demo.service.InfoService.select
=====demo.service.InfoService@67f89fa3
demo.service.InfoService.update
```

## LazyLoader

和Dispatcher的作用相同, 只不过callback只调用一次, 每次调用方法的时候, 还是使用第一次创建出来的对象.

```java
@Test
public void testLazyLoader() {
    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(InfoService.class);
    enhancer.setCallback((LazyLoader) () -> {
        InfoService infoService = new InfoService();
        System.out.println("=====" + infoService);
        return infoService;
    });
    InfoService infoServiceProxy = (InfoService) enhancer.create();
    System.out.println(infoServiceProxy);
    infoServiceProxy.select();
    System.out.println(infoServiceProxy);
    infoServiceProxy.select();
}
```

运行结果:

```
=====demo.service.InfoService@1c6b6478
demo.service.InfoService@1c6b6478
demo.service.InfoService.select
demo.service.InfoService@1c6b6478
demo.service.InfoService.select
```

## ProxyRefDispatcher

和Dispatcher的作用相同, 但是loadObject方法中含有代理对象参数.

```java
@Test
public void testProxyRefDispatcher() {

    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(InfoService.class);
    enhancer.setCallback((ProxyRefDispatcher) (proxy) -> {
        InfoService infoService = new InfoService();
        return infoService;
    });
    InfoService infoServiceProxy = (InfoService) enhancer.create();
    infoServiceProxy.select();
    System.out.println(infoServiceProxy);
    infoServiceProxy.update();
    System.out.println(infoServiceProxy);
}
```

## InvocationHandler

InvocationHandler和jdk动态代理中的使用方法是相同的

```java
class MineInvocationHandler implements InvocationHandler {

    private Object target;

    public void setTarget(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("before invoke method: " + method.getName());
        return method.invoke(this.target, args);
    }
}

@Test
public void testInvocationHandler() {


    InfoService infoService = new InfoService();
    MineInvocationHandler mineInvocationHandler = new MineInvocationHandler();
    mineInvocationHandler.setTarget(infoService);
    Info infoServiceProxy = (Info) Proxy.newProxyInstance(
            InfoService.class.getClassLoader(),
            InfoService.class.getInterfaces(),
            mineInvocationHandler);

    infoServiceProxy.select();
}

```

---
isOriginal: true
title: cglib动态代理
tag:
  - cglib
  - 动态代理
category: cglib
date: 2020-06-20
description: 动态代理的第二篇文章, 讲讲cglib动态代理
sticky: false
timeline: true
article: true
star: false
---

> 之前我们说了jdk动态代理, 今天来看看cglib动态代理. 文章的最后我们对比一下jdk动态代理和cglib动态代理

首先创建一个业务类, 其中含有一个select方法.

```java
public class InfoService {
public void select() {
  System.out.println("com.nikola.demo.service.InfoService.select");
}
}
```

之后创建一个cglib动态代理对象的获取工厂. 当然你也可以不这么去做, 下面这种方式更加实用.
对外提供`getProxyInstance`, 传入委托类对象, 返回该委托类的代理对象.

```java
public final class CglibProxyFactory {

  private CglibProxyFactory() {}

  /**
    * 获取代理类实例
    */
  @SuppressWarnings("unchecked")
  public static <T> T getProxyInstance(Class<T> c) {
    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(c);
    enhancer.setCallback((MethodInterceptor) (o, method, objects, methodProxy) -> {
      System.out.println(String.format("=====> begin %s", method.getName()));
      Object res = methodProxy.invokeSuper(o, objects);
      System.out.println(String.format("=====> end %s, result %s", method.getName(), res));
      return res;
    });
    return (T) Optional.of(enhancer.create()).orElseThrow(() -> new RuntimeException("cannot get proxy class!!!"));
  }
}
```

最后测试一下上面的代码.

```java
InfoService infoServiceProxy = CglibProxyFactory.getProxyInstance(InfoService.class);
System.out.println("生成代理对象: " + infoServiceProxy);
infoServiceProxy.select();
```

![2020-06-17-03-40-33](http://dewy-blog.nikolazh.eu.org/2020-06-17-03-40-33.png)

可以看到, cglib如jdk动态代理一样会生成一个代理对象. 之后调用方法, 实际是执行了`MethodInterceptor`中的逻辑, 我们可以看到父类的公共方法也同样走了这样的逻辑, 这个接下来我们会慢慢探究. 这个不是我想要的啊?!

从感觉上cglib相比较jdk动态代理要方便很多, 首先我们不用规定必须有一个公共接口. cglib可以直接代理一个类. 其次cglib的操作封装在Enhance中, 直接对其进行操作可以完成整个代理过程. 这比jdk动态代理, 需要通过`Proxy`创建代理对象, 并传入`InvocationHandler`调度器, 要容易理解的多.

## Enhancer是什么

上面我们通过`Enhancer`实现了一个cglib动态代理的案例, 并且产生了一些疑问. 本节来探究原因.

`Enhancer`用于生成动态子类, 以实现方法拦截. 这个类一开始是作为jdk1.3标准动态代理的替代品, 但是它除了可以动态代理接口的实现, 还可以直接代理一个类(我是替补, 但我很牛B). 动态代理生成的子类会重写父类的非final类型的方法, 并且有通过钩子方法(即callback方法)回调自定义的拦截器实现.

最原始且通用的回调类型(拦截器)是`MethodInterceptor`(也就是我们例子中回调方法的传参). `MethodInterceptor`在AOP术语中允许实现环绕式增强(一般也叫通知, 增强更加准确, 灵感或许就来自Enhancer). 也就是说你可以在调用父类方法之前或者之后执行自定义的代码.另外你也可以在父类方法执行之前修改参数, 或者不去调用它.

虽然`MethodInterceptor`足以满足各种拦截需要, 但杀鸡焉用牛刀. 考虑到性能和简洁, 可以使用专门的回调类型, 比如`LazyLoader`. 通常一个增强类只有一个回调, 但是你可以通过使用`CallbackFilter`来控制每个方法使用哪种回调.

## 指定回调, CallbackFilter

在jdk动态代理中, 如果想要指定代理哪一个方法我们可能需要在invoke中做方法名的比较判断. 而cglib动态代理可以通过`CallbackFilter`来控制每个方法使用哪种回调.
比如: 委托类有如下两种方法.

```java
public class InfoService {

public void select() {
  System.out.println("demo.service.InfoService.select");
}

  public void update() {
      System.out.println("demo.service.InfoService.update");
  }
}

```

接下来我们设置回调器, 及通过方法名指定回调器索引.

```java
@Test
public void testCallbackFilter() {
    // 两种类型的回调器, 前者使用环绕增强, 后者直接执行
    Callback[] callbacks = {
            (MethodInterceptor) (obj, method, args, proxy) -> {
                System.out.println("====== begin");
                Object object = proxy.invokeSuper(obj, args);
                System.out.println("====== end");
                return object;
            },
            (MethodInterceptor) (obj, method, args, proxy) -> {
                Object object = proxy.invokeSuper(obj, args);
                return object;
            }
    };

    Enhancer enhancer = new Enhancer();
    enhancer.setSuperclass(InfoService.class);
    // 注意多个回调器使用setCallbacks设置
    enhancer.setCallbacks(callbacks);
    // 设置过滤策略 如果是update方法使用环绕增强, 否则直接执行
    enhancer.setCallbackFilter(method -> {
        if ("update".equals(method.getName())) {
            return 0;
        }
        return 1;
    });
    InfoService infoServiceProxy = (InfoService) enhancer.create();
    infoServiceProxy.select();
    infoServiceProxy.update();
}
```

接下来我们看看执行结果:

```
demo.service.InfoService.select
====== begin
demo.service.InfoService.update
====== end
```

## Enhance的create方法

这一节我们看一下create方法的源码.

```java
public Object create() {
  // classOnly表示只返回类对象而非实例对象
  classOnly = false;
  argumentTypes = null;
  return createHelper();
}

private Object createHelper() {
  // 前置校验
  preValidate();
  // 根据之前设置的参数生成一个key, 当然如你所料这个key其实是用于获取缓存中已经有的代理对象的.
  Object key = KEY_FACTORY.newInstance((superclass != null) ? superclass.getName() : null,
          ReflectUtils.getNames(interfaces),
          filter == ALL_ZERO ? null : new WeakCacheKey<CallbackFilter>(filter),
          callbackTypes,
          useFactory,
          interceptDuringConstruction,
          serialVersionUID);
  this.currentKey = key;
  Object result = super.create(key);
  return result;
}

protected Object create(Object key) {
  try {
      ClassLoader loader = getClassLoader();
      Map<ClassLoader, ClassLoaderData> cache = CACHE;
      ClassLoaderData data = cache.get(loader);
      // 如果缓存中不存在ClassLoaderData, 则使用同步方式生成, 并放入.
      if (data == null) {
          synchronized (AbstractClassGenerator.class) {
              cache = CACHE;
              data = cache.get(loader);
              // 加锁后重新获取, 并判断, 防止其他线程生成了ClassLoaderData后, 当前线程再次生成.
              if (data == null) {
                  Map<ClassLoader, ClassLoaderData> newCache = new WeakHashMap<ClassLoader, ClassLoaderData>(cache);
                  data = new ClassLoaderData(loader);
                  newCache.put(loader, data);
                  CACHE = newCache;
              }
          }
      }
      this.key = key;
      // 获取生成的代理类对象, 缓存中不存在则生成
      // getUseCache()用于获取系统属性cglib.useCache的值, 默认为true
      Object obj = data.get(this, getUseCache());
      if (obj instanceof Class) {
          return firstInstance((Class) obj);
      }
      return nextInstance(obj);
  } catch (RuntimeException e) {
      throw e;
  } catch (Error e) {
      throw e;
  } catch (Exception e) {
      throw new CodeGenerationException(e);
  }
}
```

下面看一下`data.get(this, getUseCache());`, 根据是否使用缓存, 分别执行两种逻辑

```java
public Object get(AbstractClassGenerator gen, boolean useCache) {
    if (!useCache) {
      return gen.generate(ClassLoaderData.this);
    } else {
       // 使用缓存则从缓存LoadingCache<AbstractClassGenerator, Object, Object> generatedClasses中获取
      Object cachedValue = generatedClasses.get(gen);
      return gen.unwrapCachedValue(cachedValue);
    }
}
```

首先看一下不使用缓存的情况:

`gen.generate(ClassLoaderData.this);`中的逻辑

```java
protected Class generate(ClassLoaderData data) {
  Class gen;
  // 获取上一次的对象...  CURRENT为ThreadLocal类型
  Object save = CURRENT.get();
  // 存入当前调用该方法的AbstractClassGenerator对象
  CURRENT.set(this);
  try {
      ClassLoader classLoader = data.getClassLoader();
      if (classLoader == null) {
          throw new IllegalStateException("ClassLoader is null while trying to define class " +
                  getClassName() + ". It seems that the loader has been expired from a weak reference somehow. " +
                  "Please file an issue at cglib's issue tracker.");
      }
      // 装载类实际需要的是classLoader, 不同的classLoader装载的是不同的. 多线程下生成类名, 可以减轻锁的重量吧?
      // 因为classLoader的这种特点没有必要都让所有的都锁住.
      synchronized (classLoader) {
          // 生成一个代理类名称, 没有指定命名策略则使用默认的DefaultNamingPolicy
          String name = generateClassName(data.getUniqueNamePredicate());
          System.out.println(String.format("==== 生成代理类名称为: %s", name));

          // 为了保证生成的名字唯一每次生成之后, 都需要添加到Set集合中, 保证之后的判断
          data.reserveName(name);
          this.setClassName(name);
      }
      if (attemptLoad) {
          try {
              // 生成名字之后尝试加载有没有这个类, 如果存在则直接返回
              // TODO attemptLoad不知道是干什么的, 生成名字会重复吗? 不会!
              //  难道是用户在相同路径下自定义了一个和生成名字相同的类文件, 优先加载该类?
              gen = classLoader.loadClass(getClassName());
              return gen;
          } catch (ClassNotFoundException e) {
              // ignore
          }
      }
      // strategy二进制字节码生成策略,
      // 默认为DefaultGeneratorStrategy, 实现自GeneratorStrategy
      byte[] b = strategy.generate(this);
      // 获取类名...
      String className = ClassNameReader.getClassName(new ClassReader(b));
      System.out.println(String.format("==== 获取类名为: %s", className));
      // 设置访问作用域 默认使用ReflectUtils的protectionDomain
      ProtectionDomain protectionDomain = getProtectionDomain();
      synchronized (classLoader) { // just in case
          if (protectionDomain == null) {
              gen = ReflectUtils.defineClass(className, b, classLoader);
          } else {
              gen = ReflectUtils.defineClass(className, b, classLoader, protectionDomain);
          }
      }
      return gen;
  } catch (RuntimeException e) {
      throw e;
  } catch (Error e) {
      throw e;
  } catch (Exception e) {
      throw new CodeGenerationException(e);
  } finally {
      CURRENT.set(save);
  }
}

```

你应该注意到`byte[] b = strategy.generate(this);`这个方法就是生成字节码的核心了.
这里就介绍默认的生成策略`DefaultGeneratorStrategy`, 自定义生成策略需要实现`GeneratorStrategy`.

```java
public byte[] generate(ClassGenerator cg) throws Exception {
    DebuggingClassWriter cw = getClassVisitor();
    transform(cg).generateClass(cw);
    return transform(cw.toByteArray());
}

protected byte[] transform(byte[] b) throws Exception {
    return b;
}

protected ClassGenerator transform(ClassGenerator cg) throws Exception {
    return cg;
}

```

其实默认的生成策略其实啥都没干, 实际上还是`ClassGenerator`调用了自身的`generateClass`方法.
不过, 如此也给我们自定义一个生成策略提供了一些启发. 我们可以在生成之前或者生成之后根据自己的需求做一些操作.

然后我们看一下使用缓存的情况:
generatedClasses的类型为`LoadingCache<AbstractClassGenerator, Object, Object>`, 提供`get`方法根据key获取缓存数据.

```java
public V get(K key) {
    // key为AbstractClassGenerator对象, 首先生成cacheKey即第二个泛型参数
    final KK cacheKey = keyMapper.apply(key);
    // 之后根据KK获取实际的值, 而实际的值是存放于ConcurrentMap<KK, Object> map中的
    Object v = map.get(cacheKey);
    // 如果其值存在且不为FutureTask则直接返回, 否则表名value已经miss, 需要重新创建.
    // 关于FutureTask需要继续看createEntry才能理解
    // 在多线程情况下, 为了防止多次创建value, 使用了FutureTask进行阻塞获取
    if (v != null && !(v instanceof FutureTask)) {
        return (V) v;
    }

    return createEntry(key, cacheKey, v);
}
```

下面看一下createEntry

```java
protected V createEntry(final K key, KK cacheKey, Object v) {
    FutureTask<V> task;
    boolean creator = false;
    // v不为null, 则为FutureTask, 因为如果非FutureTask则net.sf.cglib.core.internal.LoadingCache.get已经退出
    if (v != null) {
        // 其他线程已经在创建实例,
        // Another thread is already loading an instance
        task = (FutureTask<V>) v;
    } else {
        // 如果v不存在, 可以理解为miss v之后第一次执行createEntry
        // 第一次创建, 先创建FutureTask作为v, 并将其放入缓存map中, 用来防止其他线程进入到这个代码块执行创建
        task = new FutureTask<V>(new Callable<V>() {
            public V call() throws Exception {
                // 执行代理类创建, 这个loader需要看ClassLoaderData的构造器, 此处的函数实际是Function<AbstractClassGenerator, Object>
                // 其核心目的在于执行 gen.generate(ClassLoaderData.this)
                return loader.apply(key);
            }
        });
        Object prevTask = map.putIfAbsent(cacheKey, task);
        // 放入时候, 已经存在一个task, 因为上面那行代码也是有可能被多个线程执行的.
        // 因为多个线程可能同时获取到v=null, 因此task被其他线程放入也是有可能的
        if (prevTask == null) {
            // creator does the load
            creator = true;
            // 执行当前task
            task.run();
        } else if (prevTask instanceof FutureTask) {
            // 之前放入了task, 使用原始的task相当于v != null中的逻辑
            task = (FutureTask<V>) prevTask;
        } else {
            // 已经生成了v
            return (V) prevTask;
        }
    }

    // 构建最终结果
    V result;
    try {
        // 阻塞, 获取生成代理类对象
        result = task.get();
    } catch (InterruptedException e) {
        throw new IllegalStateException("Interrupted while loading cache item", e);
    } catch (ExecutionException e) {
        Throwable cause = e.getCause();
        if (cause instanceof RuntimeException) {
            throw ((RuntimeException) cause);
        }
        throw new IllegalStateException("Unable to load cache item", cause);
    }
    // TODO creator为false, 最终结果不放入缓存? 有点懵逼
    if (creator) {
        map.put(cacheKey, result);
    }
    return result;
}
```

以上使用缓存和不使用缓存的分析就告一段落.

我们继续看代理类的生成之前我们已经分析到策略类`DefaultGeneratorStrategy`那部分了.
继续看`generateClass`, 我们看他的一个实现`net.sf.cglib.core.KeyFactory.Generator#generateClass`.
代码有点多, 其核心思想在于通过操作asm控制代码的生成.

## jdk动态代理与cglib动态代理

1. cglib动态代理基于继承, 因此无法代理final方法, jdk动态代理基于接口. cglib也可以设置通过接口代理.
2. cglib动态代理能实现基于方法级别的拦截处理, 需要配合CallbackFilter并提供Callbacks, 准确来说是可以在方法级别上动态指定回调
3. 代理类生成上, jdk动态代理纯手撸, cglib则使用了asm
4. 整体来说cglib要比前者更加灵活, 可定制化更强, 比如类名生成策略, 类生成策略, 缓存使用等等.
5. 性能上, 从网上找到的资料来看, 不易比较. (毕竟也没见过什么数据)
Cglib比JDK快？
1、cglib底层是ASM字节码生成框架，但是字节码技术生成代理类，在JDL1.6之前比使用java反射的效率要高
2、在jdk6之后逐步对JDK动态代理进行了优化，在调用次数比较少时效率高于cglib代理效率
3、只有在大量调用的时候cglib的效率高，但是在1.8的时候JDK的效率已高于cglib

可以参考[Cglib和jdk动态代理的区别](https://www.cnblogs.com/sandaman2019/p/12636727.html)

## end

下一篇主要讲cglib的回调器, 以及其他定制操作. 本文中的todo有待进一步研究, 如果更新会发公告通知.

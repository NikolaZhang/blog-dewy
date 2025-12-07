---
isOriginal: true
title: TypeHandler注册方式
date: 2021-03-03
icon: code
tag:
  - mybatis
  - configuration
  - typeHandler
category: 源码
description: mybatis 配置文件解析 主要说一说TypeHandler注册方式
sticky: false
timeline: true
article: true
star: false
---

> 本文对`typeHandlers节点`的解析进行详细的说明.

## 配置方式

mybatis中对类型转换器有两种配置方式

1. 使用package方式配置

    ```xml
    <typeHandlers>
        <package name="org.mybatis.example"/>
    </typeHandlers>
    ```

2. 使用`typeHandler`指定handler等信息.

   ```xml
    <typeHandlers>
        <typeHandler handler="org.mybatis.example.ExampleTypeHandler"/>
    </typeHandlers>
    ```

其使用规范可以在``中获取:

```xml
<!ELEMENT typeHandlers (typeHandler*,package*)>

<!ELEMENT typeHandler EMPTY>
<!ATTLIST typeHandler
javaType CDATA #IMPLIED
jdbcType CDATA #IMPLIED
handler CDATA #REQUIRED
>
<!ELEMENT package EMPTY>
<!ATTLIST package
name CDATA #REQUIRED
>
```

对于`package`方式的配置, 必须指定类的全限定路径名. 对于`typeHandler`方式必须指定`handler`.

## 程序中的解析

`typeHandlerElement`是解析`typeHandlers`配置的入口, 其方法见下:

```java
private void typeHandlerElement(XNode parent) {
    if (parent != null) {
        for (XNode child : parent.getChildren()) {
            if ("package".equals(child.getName())) {
                String typeHandlerPackage = child.getStringAttribute("name");
                typeHandlerRegistry.register(typeHandlerPackage);
            } else {
                String javaTypeName = child.getStringAttribute("javaType");
                String jdbcTypeName = child.getStringAttribute("jdbcType");
                String handlerTypeName = child.getStringAttribute("handler");
                Class<?> javaTypeClass = resolveClass(javaTypeName);
                JdbcType jdbcType = resolveJdbcType(jdbcTypeName);
                Class<?> typeHandlerClass = resolveClass(handlerTypeName);
                if (javaTypeClass != null) {
                if (jdbcType == null) {
                    typeHandlerRegistry.register(javaTypeClass, typeHandlerClass);
                } else {
                    typeHandlerRegistry.register(javaTypeClass, jdbcType, typeHandlerClass);
                }
                } else {
                    typeHandlerRegistry.register(typeHandlerClass);
                }
            }
        }
    }
}

```

### typeHandler配置方式

对于`typeHandler`这种配置方式, 直接获取节点的`javaType`, `jdbcType`, `handler`参数, 并通过取对应的类型.

`resolveClass` 方法, 会查看别名中是否存在配置的名字, 如果存在获取其对应的类型, 不存在则使用`Resources.classForName(string);`通过反射获取.

`JdbcType`是枚举类型, `resolveJdbcType`通过枚举的`valueOf`方法获取字符串对应的枚举类型.

由于`javaType`, `jdbcType`可有可无, 使用三种重载方法进行注册:

- java类型及类型转换器 `void register(Class<?> javaTypeClass, Class<?> typeHandlerClass)`
- java类型,jdbc类型及类型转换器 `void register(Class<?> javaTypeClass, JdbcType jdbcType, Class<?> typeHandlerClass)`
- 只配置类型转换器 `void register(Class<?> typeHandlerClass)`

需要注意的是, 单独使用`jdbcType`而不配置`javaType`. `jdbcType`不起作用.

对于只配置类型转换器的注册方式, 可以继续划分, 其处理逻辑如下:

```java
  public void register(Class<?> typeHandlerClass) {
    boolean mappedTypeFound = false;
    MappedTypes mappedTypes = typeHandlerClass.getAnnotation(MappedTypes.class);
    if (mappedTypes != null) {
      for (Class<?> javaTypeClass : mappedTypes.value()) {
        register(javaTypeClass, typeHandlerClass);
        mappedTypeFound = true;
      }
    }
    if (!mappedTypeFound) {
      register(getInstance(null, typeHandlerClass));
    }
  }

```

只配置了转换器, 这种方式需要先看`@MappedTypes`注解, 该注解表示类型转换器映射的java类型. 该配置为数组类型, 因此需要通过遍历调用第一种注册方式(使用java类型和类型转换器进行注册的重载方法).

如果没有配置`@MappedTypes`注解, 或者该注解中没有设置映射的java类型, 那么使用`register(getInstance(null, typeHandlerClass))`进行注册.

#### 关于getInstance

进入`typeHandlerRegistry.register`. 会看到一个`getInstance`方法.

```java
public void register(Class<?> javaTypeClass, Class<?> typeHandlerClass) {
    register(javaTypeClass, getInstance(javaTypeClass, typeHandlerClass));
}

public <T> TypeHandler<T> getInstance(Class<?> javaTypeClass, Class<?> typeHandlerClass) {
    if (javaTypeClass != null) {
        try {
            Constructor<?> c = typeHandlerClass.getConstructor(Class.class);
            return (TypeHandler<T>) c.newInstance(javaTypeClass);
        } catch (NoSuchMethodException ignored) {
            // ignored
        } catch (Exception e) {
            throw new TypeException("Failed invoking constructor for handler " + typeHandlerClass, e);
        }
    }
    try {
        Constructor<?> c = typeHandlerClass.getConstructor();
        return (TypeHandler<T>) c.newInstance();
    } catch (Exception e) {
        throw new TypeException("Unable to find a usable constructor for " + typeHandlerClass, e);
    }
  }
```

`getInstance`方法的返回值为`TypeHandler`, 其目的在于通过`Class<?> javaTypeClass`, `Class<?> typeHandlerClass`通过反射创建`typeHandlerClass`对应的实例.

如果`javaTypeClass`非空, 尝试将其作为构造器参数创建转换器对象. 如果创建失败, 则使用`TypeHandler`的无参构造器创建转换器实例.

#### 三种重载方法

上面提到三种重载方法分别对应三种后续注册实例的重载方法

1. `<T> void register(Type javaType, TypeHandler<? extends T> typeHandler)`
2. `void register(Type javaType, JdbcType jdbcType, TypeHandler<?> handler)`
3. `<T> void register(TypeHandler<T> typeHandler)`

##### `<T> void register(Type javaType, TypeHandler<? extends T> typeHandler)`

第一种的方法的具体内容为:

```java
  private <T> void register(Type javaType, TypeHandler<? extends T> typeHandler) {
    MappedJdbcTypes mappedJdbcTypes = typeHandler.getClass().getAnnotation(MappedJdbcTypes.class);
    if (mappedJdbcTypes != null) {
      for (JdbcType handledJdbcType : mappedJdbcTypes.value()) {
        register(javaType, handledJdbcType, typeHandler);
      }
      if (mappedJdbcTypes.includeNullJdbcType()) {
        register(javaType, null, typeHandler);
      }
    } else {
      register(javaType, null, typeHandler);
    }
  }
```

因为没有显示传入`JdbcType`参数, 因此需要通过类型型转换器的注解`@MappedJdbcTypes`间接获取.
比如可以在类型转换器上配置`@MappedJdbcTypes(JdbcType.VARCHAR)`.

当类型转换器上存在映射的jdbc类型注解时, 对注解的两个参数进行处理.

1. value: 映射的jdbc类型, 可以有多个映射, 因此需要通过遍历进行注册.
2. includeNullJdbcType: 是否可以映射为空的jdbc类型.

如果不存在注解配置, 则使用2中的逻辑, 即认为jdbc类型为空.

##### `void register(Type javaType, JdbcType jdbcType, TypeHandler<?> handler)`

等同于`<T> void register(Type javaType, TypeHandler<? extends T> typeHandler)` 存在注解jdbc类型映射的配置.
即直接调用`register(javaType, handledJdbcType, typeHandler)`

##### `<T> void register(TypeHandler<T> typeHandler)`

```java
  public <T> void register(TypeHandler<T> typeHandler) {
    boolean mappedTypeFound = false;
    MappedTypes mappedTypes = typeHandler.getClass().getAnnotation(MappedTypes.class);
    if (mappedTypes != null) {
      for (Class<?> handledType : mappedTypes.value()) {
        register(handledType, typeHandler);
        mappedTypeFound = true;
      }
    }
    // @since 3.1.0 - try to auto-discover the mapped type
    if (!mappedTypeFound && typeHandler instanceof TypeReference) {
      try {
        TypeReference<T> typeReference = (TypeReference<T>) typeHandler;
        register(typeReference.getRawType(), typeHandler);
        mappedTypeFound = true;
      } catch (Throwable t) {
        // maybe users define the TypeReference with a different type and are not assignable, so just ignore it
      }
    }
    if (!mappedTypeFound) {
      register((Class<T>) null, typeHandler);
    }
  }
```

1. 方法首先获取`@MappedTypes`配置的java类型映射, 并遍历调用第一种注册方式`<T> void register(Type javaType, TypeHandler<? extends T> typeHandler)`, 即使用java类型和类型转换器的注册方式.
2. 如果没有java类型映射, 并且类型转换器继承了`TypeReference`, 则使用指定的泛型类作为映射的java类.
3. 如果仍旧没有java类型映射, 则使用第一种方式注册, java映射类型传入空. **因此, 使用java类型和转换器作为参数的注册方式, 在没有java映射配置的时候, 对应的参数是会为空的.**

### 最后的注册

以上三种注册的情况, 最后都会调用下面的方法进行注册:

```java
  private void register(Type javaType, JdbcType jdbcType, TypeHandler<?> handler) {
    if (javaType != null) {
      Map<JdbcType, TypeHandler<?>> map = typeHandlerMap.get(javaType);
      if (map == null || map == NULL_TYPE_HANDLER_MAP) {
        map = new HashMap<>();
      }
      map.put(jdbcType, handler);
      typeHandlerMap.put(javaType, map);
    }
    allTypeHandlersMap.put(handler.getClass(), handler);
  }

```

只不过外层的方法, 会通过各种途径获取该方法的三个参数.

1. `javaType`: 可以通过`typeHandler`子节点直接指定, `@MappedTypes`指定, 获取`TypeReference`泛型参数指定.
2. `jdbcType`: 可以通过`typeHandler`子节点直接指定, `@MappedJdbcTypes`指定
3. `handler`: 通过`package`, `typeHandler`节点进行指定.

但是仍旧不能保证使用者配置了前两个参数. 因此进入该方法也就会有为空的情况.

此处的`register`方法, 使用到了两个Map类型, 他们的定义分别为:

- `private final Map<Type, Map<JdbcType, TypeHandler<?>>> typeHandlerMap = new ConcurrentHashMap<>();`
- `private final Map<Class<?>, TypeHandler<?>> allTypeHandlersMap = new HashMap<>();`

如果`javaType`存在, `typeHandlerMap`中需要缓存其映射的jdbc类型以及转换器.
最后`allTypeHandlersMap`, 缓存类型转换器类型以及其实例.

## 总结

1. 外层三个重载方法之间的关系
2. 内部三个重载方法之间的关系
3. typeHandler如何实例化, `getInstance`的逻辑
4. `MappedTypes`与`MappedJdbcTypes`的作用, 与作用时机
5. 存储映射关系的数据结构

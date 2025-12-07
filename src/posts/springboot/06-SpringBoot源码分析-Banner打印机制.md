---
isOriginal: true
title: springboot源码分析[4]banner打印
tag:
  - springboot
  - banner
category: 源码
date: 2020-05-10
icon: leaf
description: springboot 启动时是如何打印banner的, 以及如何配置一个自己的banner
sticky: false
timeline: true
article: true
star: false
---

> springboot 启动时是如何打印banner的, 以及如何配置一个自己的banner.

## 入口方法

```java
private Banner printBanner(ConfigurableEnvironment environment) {
  if (this.bannerMode == Banner.Mode.OFF) {
    return null;
  }
  ResourceLoader resourceLoader = (this.resourceLoader != null) ? this.resourceLoader
      : new DefaultResourceLoader(getClassLoader());
  SpringApplicationBannerPrinter bannerPrinter = new SpringApplicationBannerPrinter(resourceLoader, this.banner);
  if (this.bannerMode == Mode.LOG) {
    return bannerPrinter.print(environment, this.mainApplicationClass, logger);
  }
  return bannerPrinter.print(environment, this.mainApplicationClass, System.out);
}
```

`printBanner`是banner打印的入口方法, 该方法根据不同的`Banner.Mode`为枚举类型, 值有`OFF`, `CONSOLE`, `LOG`, 分别对应不打印, 控制台输出, 输出到日志文件.
对于`CONSOLE`和`LOG`类型需要通过`ResourceLoader resourceLoader`加载banner资源. banner打印需要通过`SpringApplicationBannerPrinter`类中的`print`方法(重载)进行处理, 对于`CONSOLE`类型, 第三个参数为`PrintStream`类型, 传入`System.out`进行处理, `LOG`类型则通过日志对象`logger`(其定义为private static final Log logger = LogFactory.getLog(SpringApplication.class);)进行处理. 不过两个重载方法逻辑是一致的.

## print

以`CONSOLE`类型为例, 其代码为:

```java
Banner print(Environment environment, Class<?> sourceClass, PrintStream out) {
  Banner banner = getBanner(environment);
  banner.printBanner(environment, sourceClass, out);
  return new PrintedBanner(banner, sourceClass);
}
```

首先要获取一个Banner对象(函数式), 调用打印方法`printBanner`输出banner, 打印完毕, 构造一个`PrintedBanner`继承于`Banner`返回.

下面具体看一下`getBanner`方法:

```java
private Banner getBanner(Environment environment) {
  Banners banners = new Banners();
  banners.addIfNotNull(getImageBanner(environment));
  banners.addIfNotNull(getTextBanner(environment));
  if (banners.hasAtLeastOneBanner()) {
    return banners;
  }
  if (this.fallbackBanner != null) {
    return this.fallbackBanner;
  }
  return DEFAULT_BANNER;
}
```

`Banners`类是`Banner`接口的实现, 内部维护一个`private final List<Banner> banners = new ArrayList<>();`用来存放所有的Banner, 该类也重写`printBanner`为:

```java
@Override
public void printBanner(Environment environment, Class<?> sourceClass, PrintStream out) {
  for (Banner banner : this.banners) {
    banner.printBanner(environment, sourceClass, out);
  }
}
```

即: 将banners中的banner对象全部打印. 而banners中的banner来自于`getImageBanner`和`getTextBanner`加载的资源. 下面分别来看一下这两个方法.

## getImageBanner

```java

static final String BANNER_IMAGE_LOCATION_PROPERTY = "spring.banner.image.location";

private Banner getImageBanner(Environment environment) {
  String location = environment.getProperty(BANNER_IMAGE_LOCATION_PROPERTY);
  if (StringUtils.hasLength(location)) {
    Resource resource = this.resourceLoader.getResource(location);
    return resource.exists() ? new ImageBanner(resource) : null;
  }
  for (String ext : IMAGE_EXTENSION) {
    Resource resource = this.resourceLoader.getResource("banner." + ext);
    if (resource.exists()) {
      return new ImageBanner(resource);
    }
  }
  return null;
}

```

`BANNER_IMAGE_LOCATION_PROPERTY`配置用来表示图片类型banner资源的加载位置, 之后`resourceLoader`会生成一个对应位置资源的操作对象`Resource resource`.
如果该位置下存在资源则返回`ImageBanner`类型的对象, 该类也是`Banner`的一个实现.

如果没有定义`BANNER_IMAGE_LOCATION_PROPERTY`则`resourceLoader`加载以`banner`为前缀, `"gif", "jpg", "png"`等格式的文件. 如果存在则直接返回一个`ImageBanner`类型的对象.

注意如果不存在由于`addIfNotNull`会判断`Banner`是否为null, 是则不会将其放入`banners`中.

## getTextBanner

```java

static final String BANNER_LOCATION_PROPERTY = "spring.banner.location";
static final String DEFAULT_BANNER_LOCATION = "banner.txt";

private Banner getTextBanner(Environment environment) {
  String location = environment.getProperty(BANNER_LOCATION_PROPERTY, DEFAULT_BANNER_LOCATION);
  Resource resource = this.resourceLoader.getResource(location);
  if (resource.exists()) {
    return new ResourceBanner(resource);
  }
  return null;
}
```

此时会从`BANNER_LOCATION_PROPERTY`出加载`banner.txt`文件, 并返回`ResourceBanner`对象.

对于一个默认的系统配置, 无法加载图片和文本banner此时直接返回一个默认的`DEFAULT_BANNER`, 其为`SpringBootBanner`类型. 该类定义如下, 可以看到`BANNER`为系统的默认
输出.

```java
class SpringBootBanner implements Banner {
private static final String[] BANNER = { "", "  .   ____          _            __ _ _",
    " /\\\\ / ___'_ __ _ _(_)_ __  __ _ \\ \\ \\ \\", "( ( )\\___ | '_ | '_| | '_ \\/ _` | \\ \\ \\ \\",
    " \\\\/  ___)| |_)| | | | | || (_| |  ) ) ) )", "  '  |____| .__|_| |_|_| |_\\__, | / / / /",
    " =========|_|==============|___/=/_/_/_/" };

private static final String SPRING_BOOT = " :: Spring Boot :: ";

private static final int STRAP_LINE_SIZE = 42;

@Override
public void printBanner(Environment environment, Class<?> sourceClass, PrintStream printStream) {
  for (String line : BANNER) {
    printStream.println(line);
  }
  String version = SpringBootVersion.getVersion();
  version = (version != null) ? " (v" + version + ")" : "";
  StringBuilder padding = new StringBuilder();
  while (padding.length() < STRAP_LINE_SIZE - (version.length() + SPRING_BOOT.length())) {
    padding.append(" ");
  }

  printStream.println(AnsiOutput.toString(AnsiColor.GREEN, SPRING_BOOT, AnsiColor.DEFAULT, padding.toString(),
      AnsiStyle.FAINT, version));
  printStream.println();
}

}

```

## 自定义banner

从上面的分析我们可知, banner有三种形式:

1. 图片`ImageBanner`, banner是在`spring.banner.image.location`位置下的, 或者是默认路径下的`banner.png|gif|jpg`文件
2. 文本`ResourceBanner`, banner是在`spring.banner.location`位置下的, 或者是默认路径下的`banner.txt`文件.
3. 系统默认`SpringBootBanner`, banner样式是写在一个String数组中的

对于图片, 在资源目录下添加一个`banner.png`文件, 运行:
![2020-05-10-14-04-01](http://dewy-blog.nikolazh.eu.org/2020-05-10-14-04-01.png)

另外springboot还提供了图片打印的一些参数控制, 比如长度,宽度,`bitdepth`(值为4, 8, 分别只16色和256色), `pixelmode`(值为block, 默认text, 分别对应方块输出和字符画)
一通配置之后的打印banner.
![2020-05-10-14-10-34](http://dewy-blog.nikolazh.eu.org/2020-05-10-14-10-34.png)

那么, 这些参数又是在什么时候生效的呢? 这就要看ImageBanner中重写的`printBanner`

下面的方法是核心方法, 就不分析了.

```java
private void printBanner(Environment environment, PrintStream out) throws IOException {
  int width = getProperty(environment, "width", Integer.class, 76);
  int height = getProperty(environment, "height", Integer.class, 0);
  int margin = getProperty(environment, "margin", Integer.class, 2);
  boolean invert = getProperty(environment, "invert", Boolean.class, false);
  BitDepth bitDepth = getBitDepthProperty(environment);
  PixelMode pixelMode = getPixelModeProperty(environment);
  Frame[] frames = readFrames(width, height);
  for (int i = 0; i < frames.length; i++) {
    if (i > 0) {
      resetCursor(frames[i - 1].getImage(), out);
    }
    printBanner(frames[i].getImage(), margin, invert, bitDepth, pixelMode, out);
    sleep(frames[i].getDelayTime());
  }
}
```

对于文本,  在资源目录下添加`banner.txt`文件. 运行:
![2020-05-10-13-52-09](http://dewy-blog.nikolazh.eu.org/2020-05-10-13-52-09.png)

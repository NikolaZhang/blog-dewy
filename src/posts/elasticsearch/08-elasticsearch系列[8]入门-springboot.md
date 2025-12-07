---
isOriginal: true
title: ElasticSearch[8]操作篇-springboot连接es
tag:
  - ElasticSearch
  - springboot
category: ElasticSearch
description: 如何通过springboot操作es
date: 2020-02-10
icon: search

sticky: false
timeline: true
article: true
star: false
---

> 前面七篇文章大体讲解了es的一些基本操作, 包括增删改查. 这一篇讲一讲springboot连接es服务器并进行相关操作的方法

## 工程创建

创建一个工程你可以通过多种方式 maven, springboot脚手架等.

但是最后一定要引如es的相关依赖, 我使用的依赖是springboot全家桶中的`spring-boot-starter-data-elasticsearch`
我使用的依赖见下:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

需要注意springboot和es版本的匹配:
![2020-02-10-20-31-34](http://dewy-blog.nikolazh.eu.org/2020-02-10-20-31-34.png)

## 配置es连接

```java
@Configuration
public class ElasticSearchConfig {

    @Value("${es-host}")
    private String location;

    @Bean
    public RestHighLevelClient client() {
        ClientConfiguration clientConfiguration = ClientConfiguration.builder()
                .connectedTo(location)
                .build();
        return RestClients.create(clientConfiguration).rest();
    }
}
```

`es-host` 就是yml中自定义的es地址:

```yml
es-host: 192.168.23.140:9200
```

## 一个博客文章的实体

```java
@Data
@Slf4j
@Document(indexName = "blog")
public class BlogArtical implements Serializable {

    @Id
    private String id;
    private String title;
    private String content;
    private Integer authorId;

}

```

## repository

你一定不会对springdata的这个东西感到陌生.

```java
public interface BlogRepository extends ElasticsearchRepository<BlogArtical, String> {
}
```

## service

 这里我们添加几个用于测试的方法

```java
@Slf4j
@Service
public class BlogService {

    @Autowired
    private BlogRepository blogRepository;

    /**
     * 保存
     * @param blogArtical
     */
    public String saveBlogInfo(BlogArtical blogArtical) {
        blogArtical = blogRepository.save(blogArtical);
        return blogArtical.getId();
    }

    /**
     * 查询
     * @param blogArticalId
     * @return
     */
    public BlogArtical findBlogArticalInfo(int blogArticalId) {
        return blogRepository.findById(blogArticalId).orElse(null);
    }

    public List<BlogArtical> listBLogArticalInfo() {
        return Lists.newArrayList(blogRepository.findAll());
    }

    /**
     * 删除
     * @param blogArticalId
     */
    public void deleteBlogArtical(int blogArticalId) {
        blogRepository.deleteById(blogArticalId);
    }

    /**
     * 保存博客文章信息集合
     * @param blogArticalList
     */
    public void saveBlogInfoList(List<BlogArtical> blogArticalList) {
        blogRepository.saveAll(blogArticalList);
    }


}

```

## controller

定义几个接口, 在启动时我们先初始化放入4条数据

```java
@Slf4j
@RestController
@RequestMapping("/blog")
public class BlogController {

    @Autowired
    private BlogService blogService;

    @PostConstruct
    public void init() {
        List<BlogArtical> blogArticalList = new ArrayList<>(4);
        BlogArtical blogArtical1 = new BlogArtical();
        blogArtical1.setTitle("hello world");
        blogArtical1.setContent("第一篇博客敬请关注");
        blogArtical1.setAuthorId(1);

        BlogArtical blogArtical2 = new BlogArtical();
        blogArtical2.setTitle("温故而知新");
        blogArtical2.setContent("已经是第二篇博客了");
        blogArtical2.setAuthorId(1);

        BlogArtical blogArtical3 = new BlogArtical();
        blogArtical3.setTitle("新人");
        blogArtical3.setContent("这是什么博客平台啊");
        blogArtical3.setAuthorId(2);

        BlogArtical blogArtical4 = new BlogArtical();
        blogArtical4.setTitle("coffee and honey");
        blogArtical4.setContent("i love coffee and honey");
        blogArtical4.setAuthorId(3);

        blogArticalList.add(blogArtical1);
        blogArticalList.add(blogArtical2);
        blogArticalList.add(blogArtical3);
        blogArticalList.add(blogArtical4);

        log.debug("=============> 初始化");
        blogService.saveBlogInfoList(blogArticalList);
        log.debug("=============> 初始化结束");

    }

    @PostMapping("/artical")
    public void saveBLogArticalInfo(BlogArtical blogArtical) {
        blogService.saveBlogInfo(blogArtical);
    }

    @PutMapping("/artical")
    public void updateBLogArticalInfo(BlogArtical blogArtical) {
        blogService.saveBlogInfo(blogArtical);
    }

    @GetMapping("/artical")
    public BlogArtical findBLogArticalInfo(String blogArticalId) {
        return blogService.findBlogArticalInfo(blogArticalId);
    }

    @GetMapping("/list/artical")
    public List<BlogArtical> listBLogArticalInfo() {
        return blogService.listBLogArticalInfo();
    }

    @DeleteMapping("/artical")
    public void deleteBLogArticalInfo(String blogArticalId) {
        blogService.deleteBlogArtical(blogArticalId);
    }

}

```

启动之后, 可以通过es head看到我们已经插入的数据:
![2020-02-10-21-22-14](http://dewy-blog.nikolazh.eu.org/2020-02-10-21-22-14.png)

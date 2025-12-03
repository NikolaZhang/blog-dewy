---
isOriginal: true
title: 基于zookeeper的SpringBootAdmin
date: 2020-04-03
tag:
  - SpringAdmin
  - zookeeper
category: springboot
description: 介绍一下基于zookeeper的服务健康监控如何配置
sticky: false
timeline: true
article: true
star: false
---

> 介绍一下基于zookeeper的服务健康监控如何配置

## 吐槽: 网上的技术教程简直了

建议你参考如下的两个资料:

1. `https://github.com/codecentric/spring-boot-admin`这个项目的`spring-boot-admin-samples`中含有使用各种类型的注册中心配置admin的方式.
2. [springbootAdmin参考手册](https://codecentric.github.io/spring-boot-admin/2.1.6/#getting-started)

我主要是参考1中的项目进行配置的.
注意我们的前提是你的模块已经引入了zookeeper相关的依赖, 并且服务能正确注册到注册中心.

## 被监控模块的处理

被监控的模块要添加如下配置

```yml
management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    health:
      show-details: ALWAYS
```

如果关于日志需要配置

```yml
logging:
  path: ./log_syscore
  level:
    root: info
    com.nikola.syscore: debug
```

你可以根据需要自定义日志输出目录和日志级别. 生产环境直接info就可以了, 本地的话可以配置debug.

## 监控模块

```yml
spring:
  boot:
    admin:
      ui:
        title: "聊天室相关模块健康监控"
        brand: "<img src='assets/img/icon-spring-boot-admin.svg'><span>聊天室相关模块健康监控</span>"
  security:
    user:
      name: admin
      password: admin
  cloud:
    zookeeper:
      connect-string: localhost:2181
      discovery:
        register: true
        enabled: true
```

spring.boot.admin中可以对监控平台进行一些配置.
spring.boot.security当我们使用springsecurity框架时, 可以为监控平台设置账号密码登录

在启动类上需要设置`@EnableAdminServer`注解表示这个一个AdminServer.

## 关于springsecurity的配置

这个直接使用了官方的配置

```java
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final AdminServerProperties adminServer;

    public SecurityConfig(AdminServerProperties adminServer) {
        this.adminServer = adminServer;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        SavedRequestAwareAuthenticationSuccessHandler successHandler = new SavedRequestAwareAuthenticationSuccessHandler();
        successHandler.setTargetUrlParameter("redirectTo");
        successHandler.setDefaultTargetUrl(this.adminServer.path("/"));

        http.authorizeRequests((authorizeRequests) -> authorizeRequests
                .antMatchers(this.adminServer.path("/assets/**")).permitAll()
                .antMatchers(this.adminServer.path("/actuator/**")).permitAll()
                .antMatchers(this.adminServer.path("/login")).permitAll().anyRequest().authenticated())
                .formLogin((formLogin) -> formLogin.loginPage(this.adminServer.path("/login"))
                        .successHandler(successHandler))
                .logout((logout) -> logout.logoutUrl(this.adminServer.path("/logout")))
                .httpBasic(Customizer.withDefaults())
                .csrf((csrf) -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .ignoringRequestMatchers(
                                new AntPathRequestMatcher(this.adminServer.path("/instances"),
                                        HttpMethod.POST.toString()),
                                new AntPathRequestMatcher(this.adminServer.path("/instances/*"),
                                        HttpMethod.DELETE.toString()),
                                new AntPathRequestMatcher(this.adminServer.path("/actuator/**"))));
    }

}
```

## 启动

登录界面
![2020-04-03-01-27-29](http://dewy-blog.nikolazh.eu.org/2020-04-03-01-27-29.png)
首页(这里可以看到服务的状态)
![2020-04-03-01-28-07](http://dewy-blog.nikolazh.eu.org/2020-04-03-01-28-07.png)
![2020-04-03-01-31-42](http://dewy-blog.nikolazh.eu.org/2020-04-03-01-31-42.png)
你可以进入一个服务查看服务的内存等运行情况
![2020-04-03-01-29-01](http://dewy-blog.nikolazh.eu.org/2020-04-03-01-29-01.png)
logging中可以查看当前服务的日志信息. 这个对于分布式的部署方式日志查看帮助极大, loggers中可以配置指定文件或者包下的日志级别. 也就是你可以实时调整日志的级别.
![2020-04-03-01-29-31](http://dewy-blog.nikolazh.eu.org/2020-04-03-01-29-31.png)

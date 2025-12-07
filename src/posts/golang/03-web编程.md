---
isOriginal: true
title: web编程-gin框架[1]
mathjax: true
tag:
  - golang
  - web编程
  - gin
category: go
date: 2020-07-04
icon: globe
description: gin框架文档的学习

sticky: false
timeline: true
article: true
star: false
---

## quick start

1. 获取gin框架

``` go
go get -u github.com/gin-gonic/gin
```

建议一般加上-v命令, 可以输出下载进度. 一般情况下ide, 会有自动依赖导入的功能.
vscode用户建议安装 `Go 0.14.4` 和 `go snippets` 插件. 代码运行建议安装 `code runner` .
2. 测试程序

``` go
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()
    // 请求路由配置, 支持的请求操作有GET, POST, PUT, PATCH, DELETE and OPTIONS
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "pong pong",
        })
    })
    // 启动web 方法可以指定端口 传入字符串":port"即可
    r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
```

在你的IDE中运行上面的代码. 之后通过浏览器访问 `http://localhost:8080/ping` 

正确情况下会看到浏览器中显示: `{"message": "pong pong"}` .

下面正式介绍gin框架相关的基础, 主要参考[官方wiki](https://github.com/gin-gonic/gin)

## 请求路径匹配及参数获取

### 路径中的参数

``` go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    router := gin.Default()

    // This handler will match /user/john but will not match /user/ or /user
    router.GET("/user/:name", func(c *gin.Context) {
        name := c.Param("name")
        c.String(http.StatusOK, "Hello %s", name)
    })

    // However, this one will match /user/john/ and also /user/john/send
    // If no other routers match /user/john, it will redirect to /user/john/
    router.GET("/user/:name/*action", func(c *gin.Context) {
        name := c.Param("name")
        action := c.Param("action")
        message := name + " is " + action
        c.String(http.StatusOK, message)
    })

    // For each matched request Context will hold the route definition
    router.POST("/user/:name/*action", func(c *gin.Context) {
        //c.FullPath() == "/user/:name/*action" // true
        println(c.FullPath() == "/user/:name/*action")
    })

    router.Run(":8080")
}

```

使用:param或者*param去匹配路径中的参数, 前者只能匹配该位置上的非'/'字符
后者可以匹配'/'后的所有内容, 并且能自动在路径后增加'/'进行路由转发.

可以通过 `Param` 方法获取上面参数值.
比如: /user/john/aa
`/user/:name/*action` 可以匹配name为john, action为/aa

### 查询参数

``` go
func main() {
    router := gin.Default()

    // Query string parameters are parsed using the existing underlying request object.
    // The request responds to a url matching:  /welcome?firstname=Jane&lastname=Doe
    router.GET("/welcome", func(c *gin.Context) {
        firstname := c.DefaultQuery("firstname", "Guest")
        lastname := c.Query("lastname") // shortcut for c.Request.URL.Query().Get("lastname")

        c.String(http.StatusOK, "Hello %s %s", firstname, lastname)
    })
    router.Run(":8080")
}
```

通过 `DefaultQuery` 或者 `Query` 可以获取到 `/welcome?firstname=Jane&lastname=Doe` 问号后面的请求参数.
前者方法, 如果不存在参数则指定返回一个默认值.

### 表单处理

``` go
func main() {
  router := gin.Default()

  router.POST("/form_post", func(c *gin.Context) {
    message := c.PostForm("message")
    nick := c.DefaultPostForm("nick", "anonymous")

    c.JSON(200, gin.H{
      "status":  "posted",
      "message": message,
      "nick":    nick,
    })
  })
  router.Run(":8080")
}

```

使用`DefaultPostForm`或者`PostForm`获取表单中的信息. 如果混在请求参数则可通过`Query`, `Param`等方法获取.

### map格式数据

对于形如:

```
POST /post?ids[a]=1234&ids[b]=hello HTTP/1.1
Content-Type: application/x-www-form-urlencoded

names[first]=thinkerou&names[second]=tianou
```

的请求可以转换为map格式数据:

```go
func main() {
    router := gin.Default()

    router.POST("/post", func(c *gin.Context) {

        ids := c.QueryMap("ids")
        names := c.PostFormMap("names")

        fmt.Printf("ids: %v; names: %v", ids, names)
    })
    router.Run(":8080")
}
```

其结果为: `ids: map[a:1234 b:hello]; names: map[first:thinkerou second:tianou]`

### 文件上传

```go
package main

import (
    "fmt"
    "github.com/gin-gonic/gin"
    "log"
    "net/http"
)
func main() {
    router := gin.Default()
    // Set a lower memory limit for multipart forms (default is 32 MiB)
    router.MaxMultipartMemory = 8 << 20  // 8 MiB
    router.POST("/upload", func(c *gin.Context) {
        // single file
        file, _ := c.FormFile("file")
        log.Println(file.Filename)

        // Upload the file to specific dst.
        c.SaveUploadedFile(file, "D:\\uploaded-files\\"+file.Filename)

        c.String(http.StatusOK, fmt.Sprintf("'%s' uploaded!", file.Filename))
    })
    router.Run(":8080")
}

```

`MaxMultipartMemory`设置提交内容的大小限制
`FormFile`获取上传内容
`SaveUploadedFile`将上传文件保存到一个路径下

多个文件的上传

```go
form, _ := c.MultipartForm()
files := form.File["upload[]"]
for _, file := range files {
    log.Println(file.Filename)

    // Upload the file to specific dst.
    c.SaveUploadedFile(file, dst)
}
```

## 分组路由

通过前缀对不同的路由分组.

``` go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    router := gin.Default()

    // Simple group: v1
    v1 := router.Group("/v1")
    {
        v1.GET("/info", func(c *gin.Context) {
            c.String(http.StatusOK, "%s", c.FullPath())
        })
    }

    // Simple group: v2
    v2 := router.Group("/v2")
    {
        v2.GET("/info", func(c *gin.Context) {
            c.String(http.StatusOK, "%s", c.FullPath())
        })
    }

    router.Run(":8080")
}
```

## 中间件的使用

以上我们使用`r := gin.Default()`会返回带有默认中间件的路由，默认是包含logger和recovery中间件的.

`r := gin.New()`则不具备任何中间件. 如果增加中间件可以通过`User`方法添加.

``` go
r.Use(gin.Logger())
r.Use(gin.Recovery())
```

## 日志

``` go
package main

import (
    "github.com/gin-gonic/gin"
    "io"
    "os"
)

func main() {
    // Disable Console Color, you don't need console color when writing the logs to file.
    gin.DisableConsoleColor()

    // Logging to a file.
    f, _ := os.Create("gin.log")
    gin.DefaultWriter = io.MultiWriter(f)

    // Use the following code if you need to write the logs to file and console at the same time.
    // gin.DefaultWriter = io.MultiWriter(f, os.Stdout)

    router := gin.Default()
    router.GET("/ping", func(c *gin.Context) {
        c.String(200, "pong")
    })

    router.Run(":8080")
}


```

`os.Create("gin.log")`该方法会在项目根目录创建一个名为gin.log的文件, 之后设置DefaultWriter
`gin.DisableConsoleColor()`可以禁用控制台打印颜色, `gin.ForceConsoleColor()`则使用控制台打印颜色

通过`gin.LoggerWithFormatter`可以设置日志打印的样式:

``` go

router.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
    // your custom format
    return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
        param.ClientIP,
        param.TimeStamp.Format(time.RFC1123),
        param.Method,
        param.Path,
        param.Request.Proto,
        param.StatusCode,
        param.Latency,
        param.Request.UserAgent(),
        param.ErrorMessage,
    )
}))
```

## 数据绑定与校验

数据绑定支持JSON, XML, YAML 以及标准的表单格式(如: foo=bar&boo=baz)

Gin提供了两种类型的绑定方法集.

1. 必须绑定
方法有: Bind, BindJSON, BindXML, BindQuery, BindYAML, BindHeader

2. 可以绑定
方法有: ShouldBind, ShouldBindJSON, ShouldBindXML, ShouldBindQuery, ShouldBindYAML, ShouldBindHeader

两种方式的区别在于: 第一种出现绑定错误直接抛出异常, 而后者会返回异常, 有开发者自己决定如何处理.
对于指定字段绑定为required, 而实际参数为空, 就会出现上面的所提到的绑定错误

前者实际上会调用后者的方法, 之后对于返回参数进行判断, 并决定是否调用`AbortWithError`.

``` go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

// form, json, xml为三种消息格式对应的字段名称, binding为字段是否需要校验, 无需校验可指定为"-"
type Login struct {
    User     string `form:"user" json:"user" xml:"user"  binding:"required"`
    Password string `form:"password" json:"password" xml:"password" binding:"required"`
}

func main() {
    router := gin.Default()

    // Example for binding JSON ({"user": "manu", "password": "123"})
    router.POST("/loginJSON", func(c *gin.Context) {
        var json Login
        if err := c.ShouldBindJSON(&json); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"请求参数异常 error": err.Error()})
            return
        }

        if json.User != "manu" || json.Password != "123" {
            c.JSON(http.StatusUnauthorized, gin.H{"status": "unauthorized"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"status": "you are logged in"})
    })

    // Example for binding XML (
    //	<?xml version="1.0" encoding="UTF-8"?>
    //	<root>
    //		<user>user</user>
    //		<password>123</password>
    //	</root>)
    router.POST("/loginXML", func(c *gin.Context) {
        var xml Login

        // 虽然报了异常但是程序没有结束, 注意返回的请求状态码
        c.BindXML(&xml)

        if xml.User != "manu" || xml.Password != "123" {
            c.JSON(http.StatusUnauthorized, gin.H{"status": "unauthorized"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"status": "you are logged in"})
    })

    // Example for binding a HTML form (user=manu&password=123)
    router.POST("/loginForm", func(c *gin.Context) {
        var form Login
        // This will infer what binder to use depending on the content-type header.
        if err := c.ShouldBind(&form); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        if form.User != "manu" || form.Password != "123" {
            c.JSON(http.StatusUnauthorized, gin.H{"status": "unauthorized"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"status": "you are logged in"})
    })

    // Listen and serve on 0.0.0.0:8080
    router.Run(":8080")
}


```

如果某些参数我们不想进行绑定可以使用 "-"替换"required"

### 绑定请求参数

构造体中指定类型为: `form`, 并使用`ShouldBindQuery`方法进行绑定

```go
package main

import (
    "log"

    "github.com/gin-gonic/gin"
)

type Person struct {
    Name    string `form:"name"`
    Address string `form:"address"`
}

func main() {
    route := gin.Default()
    route.Any("/testing", startPage)
    route.Run(":8080")
}

func startPage(c *gin.Context) {
    var person Person
    if c.ShouldBindQuery(&person) == nil {
        log.Println("====== Only Bind By Query String ======")
        log.Println(person.Name)
        log.Println(person.Address)
    }
    c.String(200, "Success")
}


```

### 绑定请求参数和请求体参数

结构体定义同上, 绑定时需要使用`ShouldBind`

### 绑定uri

结构体中使用`uri`, 绑定方法使用`ShouldBindUri`

```go
package main

import "github.com/gin-gonic/gin"

type Person struct {
    ID string `uri:"id" binding:"required,uuid"`
    Name string `uri:"name" binding:"required"`
}

func main() {
    route := gin.Default()
    route.GET("/:name/:id", func(c *gin.Context) {
        var person Person
        if err := c.ShouldBindUri(&person); err != nil {
            c.JSON(400, gin.H{"msg": err})
            return
        }
        c.JSON(200, gin.H{"name": person.Name, "uuid": person.ID})
    })
    route.Run(":8088")
}

```

### 绑定header

结构体中使用`header`, 绑定方法使用`ShouldBindHeader`

```go
package main

import (
    "fmt"
    "github.com/gin-gonic/gin"
)

type testHeader struct {
    Rate   int    `header:"Rate"`
    Domain string `header:"Domain"`
}

func main() {
    r := gin.Default()
    r.GET("/", func(c *gin.Context) {
        h := testHeader{}

        if err := c.ShouldBindHeader(&h); err != nil {
            c.JSON(200, err)
        }

        fmt.Printf("%#v\n", h)
        c.JSON(200, gin.H{"Rate": h.Rate, "Domain": h.Domain})
    })

    r.Run()

    // client
    // curl -H "rate:300" -H "domain:music" 127.0.0.1:8080/
    // output
    // {"Domain":"music","Rate":300}
}
```

### 绑定html数据

以绑定如下的复选框数据为例:

```html
<form action="/" method="POST">
    <p>Check some colors</p>
    <label for="red">Red</label>
    <input type="checkbox" name="colors[]" value="red" id="red">
    <label for="green">Green</label>
    <input type="checkbox" name="colors[]" value="green" id="green">
    <label for="blue">Blue</label>
    <input type="checkbox" name="colors[]" value="blue" id="blue">
    <input type="submit">
</form>
```

结构体中form绑定的数据类型为数组, 使用`ShouldBind`方法进行绑定

```go
...

type myForm struct {
    Colors []string `form:"colors[]"`
}

...

func formHandler(c *gin.Context) {
    var fakeForm myForm
    c.ShouldBind(&fakeForm)
    c.JSON(200, gin.H{"color": fakeForm.Colors})
}
...
```

### Multipart/Urlencoded binding

```go
package main

import (
    "github.com/gin-gonic/gin"
    "mime/multipart"
    "net/http"
)

type ProfileForm struct {
    Name   string                `form:"name" binding:"required"`
    Avatar *multipart.FileHeader `form:"avatar" binding:"required"`

    // or for multiple files
    // Avatars []*multipart.FileHeader `form:"avatar" binding:"required"`
}

func main() {
    router := gin.Default()
    router.POST("/profile", func(c *gin.Context) {
        // you can bind multipart form with explicit binding declaration:
        // c.ShouldBindWith(&form, binding.Form)
        // or you can simply use autobinding with ShouldBind method:
        var form ProfileForm
        // in this case proper binding will be automatically selected
        if err := c.ShouldBind(&form); err != nil {
            c.String(http.StatusBadRequest, "bad request")
            return
        }

        err := c.SaveUploadedFile(form.Avatar, form.Avatar.Filename)
        if err != nil {
            c.String(http.StatusInternalServerError, "unknown error")
            return
        }

        // db.Save(&form)

        c.String(http.StatusOK, "ok")
    })
    router.Run(":8080")
}
```

## html 数据渲染

``` go
package main

import (
    "github.com/gin-gonic/gin"
    "mime/multipart"
    "net/http"
)

type ProfileForm struct {
    Name   string                `form:"name" binding:"required"`
    Avatar *multipart.FileHeader `form:"avatar" binding:"required"`

    // or for multiple files
    // Avatars []*multipart.FileHeader `form:"avatar" binding:"required"`
}
func main() {
    router := gin.Default()
    router.LoadHTMLGlob("templates/*")
    //router.LoadHTMLFiles("templates/template1.html", "templates/template2.html")
    router.GET("/index", func(c *gin.Context) {
        c.HTML(http.StatusOK, "index.tmpl", gin.H{
            "title": "Main website",
        })
    })
    router.Run(":8080")
}
```

上面的程序使用`LoadHTMLGlob`或`LoadHTMLFiles`加载模板, `HTML`方法中指定渲染的文件名称, 以及渲染的数据.

``` html
<html>
<h1>
{{ .title }}
</h1>
</html>
```

## 鉴权

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)
var secrets = gin.H{
    "foo":    gin.H{"email": "foo@bar.com", "phone": "123433"},
    "austin": gin.H{"email": "austin@example.com", "phone": "666"},
    "lena":   gin.H{"email": "lena@guapa.com", "phone": "523443"},
}

func main() {
    r := gin.Default()

    // Group using gin.BasicAuth() middleware
    // gin.Accounts is a shortcut for map[string]string
    authorized := r.Group("/admin", gin.BasicAuth(gin.Accounts{
        "foo":    "bar",
        "austin": "1234",
        "lena":   "hello2",
        "manu":   "4321",
    }))

    // /admin/secrets endpoint
    // hit "localhost:8080/admin/secrets
    authorized.GET("/secrets", func(c *gin.Context) {
        // get user, it was set by the BasicAuth middleware
        user := c.MustGet(gin.AuthUserKey).(string)
        if secret, ok := secrets[user]; ok {
            c.JSON(http.StatusOK, gin.H{"user": user, "secret": secret})
        } else {
            c.JSON(http.StatusOK, gin.H{"user": user, "secret": "NO SECRET :("})
        }
    })

    // Listen and serve on 0.0.0.0:8080
    r.Run(":8080")
}

```

上面代码中的`gin.Accounts`是预置的用户账号和密码. `authorized.GET`设置下面的get请求将需要进行权限验证, 浏览器中会弹出提示框要求输入账号密码. 回调方法中对输入的参数进行验证, 并决定是否具有资源的访问权限.

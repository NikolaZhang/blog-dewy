---
isOriginal: false
title: sed命令使用
date: 2023-06-06
tag:
  - linux
  - 命令
  - sed
category: linux
description: 在Linux中使用sed命令
sticky: false
timeline: true
article: true
star: false
---

## 简介

`sed` 是一种流式文本编辑工具，在 Linux 系统中被广泛使用。它运行在终端中，能够对文本进行替换、删除、插入、取代等操作。

sed对文本的处理很强大，并且sed非常小，参数少，容易掌握，他的操作方式根awk有点像。sed按顺序逐行读取文件。

然后，它执行为该行指定的所有操作，并在完成请求的修改之后的内容显示出来，也可以存放到文件中。完成了一行上的所有操作之后，它读取文件的下一行，然后重复该过程直到它完成该文件。

在这里要注意一点，`源文件（默认地）保持不被修改`。sed 默认读取整个文件并对其中的每一行进行修改。说白了就是一行一行的操作。

## 命令

```shell
sed -h
 -n, --quiet, --silent    取消自动打印模式空间
 -e 脚本, --expression=脚本   添加“脚本”到程序的运行列表
 -f 脚本文件, --file=脚本文件  添加“脚本文件”到程序的运行列表
 --follow-symlinks    直接修改文件时跟随软链接
 -i[扩展名], --in-place[=扩展名]    直接修改文件(如果指定扩展名就备份文件)
 -l N, --line-length=N   指定“l”命令的换行期望长度
 --posix  关闭所有 GNU 扩展
 -r, --regexp-extended  在脚本中使用扩展正则表达式
 -s, --separate  将输入文件视为各个独立的文件而不是一个长的连续输入
 -u, --unbuffered  从输入文件读取最少的数据，更频繁的刷新输出
 --help     打印帮助并退出
 --version  输出版本信息并退出
 -a ∶新增， a 的后面可以接字串，而这些字串会在新的一行出现(目前的下一行)～
 -c ∶取代， c 的后面可以接字串，这些字串可以取代 n1,n2 之间的行！
 -d ∶删除，因为是删除啊，所以 d 后面通常不接任何咚咚；
 -i ∶插入， i 的后面可以接字串，而这些字串会在新的一行出现(目前的上一行)；
 -p ∶列印，亦即将某个选择的资料印出。通常 p 会与参数 sed -n 一起运作～
 -s ∶取代，可以直接进行取代的工作哩！通常这个 s 的动作可以搭配正规表示法


```

## 案例

下面的案例使用如下文本进行演示：

```shell
old:case:bash
old1:graph:
old2:code:shell
old3:print:mail
dewy:year:text
```

### 替换

1. 将文件 `file.txt` 中的 `old` 替换为 `new`。

    ```bash
    sed 's/old/new/' file.txt
    ```

2. 如果需要替换所有的字符串，需要添加`g`参数：

    ```bash
    sed 's/old/new/g' file.txt
    ```

3. 如果需要查看哪些行发生了变化，可以添加`-n`和`p`参数：

    ```bash
    sed -n 's/old/new/gp' file.txt
    ```

4. 指定替换范围，如果需要替换前2到3行范围内的文本：

    ```bash
    sed -n '2,3s/old/new/gp' file.txt
    ```

5. 如果不同的范围需要替换不同的内容，可以参考：

    ```bash
    sed -n '2,3s/old/new1/gp;4s/old/new2/gp' file.txt
    ```

    2,3行之间的old使用new1替换，第4行的old使用new2替换。`;`用于分割两个命令。

    关于命令的分割，可以使用-e参数：

    ```bash
    sed -ne '2,3s/old/new1/gp' -ne  '4s/old/new2/gp' file.txt
    ```

    如果不知道要替换的范围，但是直到开始和结束的字符串。比如从old1开始到old2之间的文本需要替换。

    ```bash
    sed -ne '/^old1/,/old2/s/old/new/gp' file.txt
    ```

6. 使用正则替换时，特殊符号要进行转义：

    ```bash
    sed -n 's/^\(ol\w\{1\}\)/new/gp' file.txt
    ```

    这里匹配ol字符后有一个字符的文本替换为new

7. `&`用于在匹配的文本后，附加文本

    ```bash
    sed 's/old/&new/' file.txt
    ```

    上面的命令会在匹配到`old`的文本后面添加`new`

8. `n;`是next的缩写，

    ```bash
    sed '/old/{n;s/old1/new1/}' file.txt
    ```

    上面的命令会在匹配到old的文本之后，将下一行的old1替换为new1

9. y的作用是进行字符集替换，不过替换字符和被替换字符长度要一样

    ```bash
    sed 'y/old/new/' file.txt
    ```

    该命令会将所有的o替换为n，l替换为e，d替换为w。这个命令与s是不同的，需要注意。

10. h的作用是将找到的行，放到一个缓存区，G的作用是将缓存区中的内容放到最后一行

    ```bash
    sed '/old1/h;$G' file.txt
    ```

    该命令会见匹配到old1所在的行放到缓存区，$G会将该内容放到最后一行。

    行替换，用匹配old1的行，来替换匹配old2的行

    ```bash
    sed '/old1/h;/old2/g' file.txt
    ```

11. 退出`q`

    ```bash
    sed 's/old/new/g;3q' file.txt
    ```

    3q的意思为匹配到第3行退出

12. 特殊匹配，以下文本表示符合某种规则

  ```shell
  匹配数字别忘了中括号外面还有一个中括号。
  [:alnum:] 字母数字 [a-z A-Z 0-9]
  [:alpha:] 字母 [a-z A-Z]
  [:blank:] 空格或制表键
  [:cntrl:] 任何控制字符
  [:digit:] 数字 [0-9]
  [:graph:] 任何可视字符（无空格）
  [:lower:] 小写 [a-z]
  [:print:] 非控制字符
  [:punct:] 标点字符
  [:space:] 空格
  [:upper:] 大写 [A-Z]
  [:xdigit:] 十六进制数字 [0-9 a-f A-F]
  ```

  使用方法如：

  ```bash
  sed -n 's/[[:digit:]]/xxx/gp' file.txt
  ```

  该命令将所有的数字替换为xxx

### 删除

1. 删除行：

   ```bash
   sed '/old/d' file.txt
   ```

   删除文件 `file.txt` 中包含 `old` 的所有行。

2. 删除1到3行

    ```bash
    sed '1,3d' file.txt
    ```

3. 删除3行之后的所有

    ```bash
    sed '3,$d' file.txt
    ```

4. 删除包括old1的行，或者包括old2的行，别忘了加\

    ```bash
    sed '/\(old1\|old2\)/d' file.txt
    ```

5. 字符匹配范围删除

    ```bash
    sed '/old1/,/^old3/d' file.txt
    ```

    从old1开始到old3开头的数据

## 插入

1. 插入行：

   ```bash
   sed '3idewy yr' file.txt
   ```

   在文件 `file.txt` 的第 3 行之前插入 `dewy yr`。

2. 在匹配行后添加一行：

   ```bash
   sed '/old/a new_line' file.txt
   ```

   在文件 `file.txt` 中包含 `old` 的所有行后添加一行 `new_line`。

3. 读取test2的内容，并将其写入到匹配行的下面

    ```bash
    sed '/^old/r test2' file.txt
    ```

4. 将匹配的内容写入test2中

    ```bash
    sed '/old/w test2' file.txt
    ```

## 参考

1. [51yip](http://linux.51yip.com/search/sed)

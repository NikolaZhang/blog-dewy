---
isOriginal: true
title: 安装一个新的ubuntu系统后应该要做的事
tag:
  - ubuntu
  - 部署
category: linux
description: 简单记录一下如何让新的系统更适合自己的开发环境, 以后有什么需要直接按照这篇文章搞
date: 2020-01-31
sticky: false
timeline: true
article: true
star: false
---

> 注意: 对应ubuntu系统为18.04, 这篇文章会随时更新

## 更换镜像源

为了加快镜像下载速度可以将ubuntu镜像源切换阿里或者是其他源.

### 阿里镜像源

```shell
deb http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
```

### 清华源

```shell
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic main restricted universe multiverse
deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-proposed main restricted universe multiverse
```

### 中科大源

```shell
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-proposed main restricted universe multiverse
```

### 更换方法

```shell
# 首先备份系统之前的镜像源配置.
cp /etc/apt/sources.list /etc/apt/sources.list.bak
# 删除并添加新的配置
rm -f /etc/apt/sources.list
vi /etc/apt/sources.list
# 将复制内容粘贴, wq退出
# 更新
apt-get update
```

## 安装ssh-server

```shell
apt-get install openssh-server
# 启动
service ssh start
```

ssh-server需要进行配置否则会连接不上
![2020-01-31-09-09-38](http://dewy-blog.nikolazh.eu.org/2020-01-31-09-09-38.png)

解决方法是:

```shell
# 这里我使用的文本编辑器是neovim
nvim /etc/ssh/sshd_config
# 将PermitRootLogin的值修改为yes
# 重启
service ssh restart
```

重新连接, 连接成功
![2020-01-31-09-15-12](http://dewy-blog.nikolazh.eu.org/2020-01-31-09-15-12.png)

### 使用别名方式登录

1. 在本地`.ssh`目录下创建config文件.
2. 文件内容如下:

```
Host localroot
HostName 192.168.0.106
User root
IdentityFile ~/.ssh/id_rsa
IdentitiesOnly yes
```

`localroot`为远程服务器的别名;
`HostName`为远程服务器的IP;
`IdentityFile`为ssh密钥的位置, 这里我使用的是私钥, 因此使用密钥登录时, 需要输入生成ssh key的密码.

拷贝公钥的到远程服务器

```shell
ssh-copy-id -i .ssh/id_rsa.pub 用户名字@服务器ip
```

之后就可以使用`ssh localroot`进行登录了

## 安装jdk配置java home

```shell
apt-get install openjdk-8-jdk
```

安装结果
![2020-01-31-09-29-27](http://dewy-blog.nikolazh.eu.org/2020-01-31-09-29-27.png)
上面的这个路径需要用来配置java home

### 配置java home

将下面的内容复制到`/etc/profile`最后

```shell
# JAVA_HOME需要修改为你的路径, 不过jdk相同路径应该是相同的
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
export PATH=${JAVA_HOME}/bin:$PATH
```

执行`source profile`使修改生效

## 其他安装

### 安装neovim

```shell
apt-get install neovim
```

#### neovim相关的配置

如果你想使用vim中的配置则可以使用软链接

```shell
ln -s ~/.vim .config/nvim
ln -s ~/.vimrc .config/nvim/init.vim
```

- vim中使用vim-plug进行插件管理

```shell
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

之后在用户目录下创建`.vimrc`文件

- neovim中使用vim-plug进行插件管理

```shell
curl -fLo ~/.local/share/nvim/site/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

之后在`.config/nvim`中创建`init.vim`

新创建的文件中, 就可以对vim或者neovim进行插件的添加

```shell
call plug#begin('~/.vim/plugged')

" Make sure you use single quotes

" Shorthand notation; fetches https://github.com/junegunn/vim-easy-align
Plug 'junegunn/vim-easy-align'

" Initialize plugin system
call plug#end()
```

`call plug#begin`和`call plug#end()`的中间部分是插件并且以`Plug`开头:
`begin`中的参数是插件安装后的位置.

注意我们配置好相应的文件后, 可以通过nvim or vim后输入PlugInstall命令进行插件的安装, 安装过程会显示进度.

其他的命令

1. PlugInstall 安装插件
2. PlugUpdate 安装和更新插件
3. PlugClean 清除没有配置的插件
4. PlugUpgrade 升级vim-plug
5. PlugStatus 检查插件状态

#### 关于YouCompleteMe的问题

如果你使用vim命令出现`unavailable: No module named 'ycmd'`的问题, 可以参考以下处理方法.

```shell
# 可以选择你需要的进行安装, 这个是github上该项目readme中的
apt install build-essential cmake vim python3-dev
# 注意此处的目录是你的插件实际安装的位置(不同插件管理有不同的风格吧), 我的目录为`~/.vim/plugged/YouCompleteMe`
cd ~/.vim/bundle/YouCompleteMe
python3 install.py --all
```

如果以上不能解决你的问题, 可以访问[github YouCompleteMe](https://github.com/ycm-core/YouCompleteMe)或者留言吧.

### 安装net-tools

ifconfig依赖这个源

```shell
apt install net-tools
```

### 安装git

```shell
apt install git
```

### 安装npm

```shell
apt install npm
# 淘宝镜像
npm config set registry https://registry.npm.taobao.org/
npm config get registry
```

## 暂时告一段落

![2020-01-31-09-51-09](http://dewy-blog.nikolazh.eu.org/2020-01-31-09-51-09.png)
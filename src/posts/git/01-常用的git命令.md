---
isOriginal: true
title: 常用的git命令
date: 2018-11-25
icon: git-alt
tag:
  - git
  - 原理
category: git
description: Git命令学习笔记

sticky: false
timeline: true
article: true
star: false
---

## 1. 工作区，暂存区，版本库

![工作区，暂存区，版本库](/images/article/25/threestore.png)

![20251206204636-2025-12-06](http://dewy-blog.nikolazh.eu.org/01-常用的git命令/20251206204636-2025-12-06.png)

+ 工作区：就是你在电脑里能看到的目录。
+ 暂存区：英文叫stage, 或index。一般存放在 ".git目录下" 下的index文件（.git/index）中，所以我们把暂存区有时也叫作索引（index）。
+ 版本库：工作区有一个隐藏目录.git，这个不算工作区，而是Git的版本库。

<!--more-->

### 1.1 需要注意的地方

+ 当执行提交操作 `git commit` 时，暂存区的目录树写到版本库（对象库）中，master 分支会做相应的更新。即 master 指向的目录树就是提交时暂存区的目录树。

+ 当执行 `git reset HEAD` 命令时，暂存区的目录树会被重写，被 master 分支指向的目录树所替换，但是工作区不受影响。

+ 当执行 `git rm --cached <file>` 命令时，会直接从暂存区删除文件，工作区则不做出改变。

+ 当执行 `git checkout .` 或者 `git checkout -- <file>` 命令时，会用暂存区全部或指定的文件替换工作区的文件。这个操作很危险，会清除工作区中未添加到暂存区的改动。

+ 当执行 `git checkout HEAD .` 或者 `git checkout HEAD <file>` 命令时，会用 HEAD 指向的 master 分支中的全部或者部分文件替换暂存区和以及工作区中的文件。这个命令也是极具危险性的，因为不但会清除工作区中未提交的改动，也会清除暂存区中未提交的改动。

## 2. 基本命令【实现创建到提交远程仓库】
 >
 >1. 初始化仓库 `git init [name]`
 >2. 纳入版本库 `git add <file>` <file\> 支持 . name *.<格式>等。
 >3. 提交到分支仓库 `git commit -m '<description>'`

如果想从github上拷贝项目可以使用下面的命令：
 > 拷贝项目 `git clone <远程项目> <本地仓库>`

## 3. 文件操作命令

### 3.1 创建修改文件

`vim <file name>`进入vim编辑器界面
输入想要的内容之后，按下 `esc` 退出编辑状态，按下 `shift+;` 输入 `wq!` 退出。此时文件内容已经变更。 如果输入 `q!` 则不会保存变更。

### 3.2 文件状态变更

`git status -s` 可以查看我们提交的文件的状态。
`git add .` 添加我们修改后的文件.
最后使用 `git commit -m "<description>"` 提交

### 3.3 状态详细信息

`git diff` 查看文件变更后的详细信息。

+ 尚未缓存的改动（保存后）：`git diff`
+ 查看已缓存的改动（add后）： `git diff --cached`
+ 查看已缓存的与未缓存的所有改动：`git diff HEAD`
+ 显示摘要而非整个 `git diff --stat`
+ 使用提交后，以上命令均无内容。

### 3.3 流程简化

`git commit -a "message"` 直接提交
`git commit -am "message"` add后，又修改文件，提交

### 3.4 取消添加变更

`git reset HEAD [file name]` 取消已缓存的内容，使用commit后不会提交该文件，但该文件仍是变更状态。

### 3.5 移除

+ 从 Git 中移除某个文件，必须从已跟踪文件清单中移除，然后提交。 `git rm <file>`
+ 如果删除之前修改过并且已经放到暂存区域的话，则必须要用强制删除选项。 `git rm -f <file>`
+ 如果把文件从暂存区域移除，但仍然希望保留在当前工作目录中，换句话说，仅是从跟踪清单中删除。 `git rm --cached <file>`
+ 可以递归删除，即如果后面跟的是一个目录做为参数，则会递归删除整个目录中的所有子目录和文件。`git rm –r *`
+ `git mv [file origin] [file new]` 命令用于移动或重命名一个文件、目录、软连接。

## 4. 分支管理

常用命令：
> `git branch` 列出分支
`git branch <branch name>` 创建分支
`git checkout <branch name>` 切换分支
`git checkout -b <branch name>` 创建分支并且切换
`git merge <branch name>` 分支合并
`git branch -d <branch name>` 删除分支

## 5. 查看提交历史
>
> `git log` 详细历史
`git log --oneline` 查看历史记录的简洁的版本。
`git log --graph` 查看历史中什么时候出现了分支、合并。
`git log --reverse --oneline` 逆向显示

更多命令：[git log](http://git-scm.com/docs/git-log)

## 6. 标签

`git tag -a [标签] [历史版本号]` 添加标签
`git log --decorate` 查看标签
`git tag` 查看所有标签

## 7. 远程仓库

`git remote add [shortname 一般使用origin] [url]` 添加远程仓库
`git push -u [shortname] master` 提交到master
`git remote` 查看远程仓库列表
`git fetch [shortname]` 获取远程更新
`git merge [shortname]/master` 合并
`git push [shortname] master` 推送到远程
`git remote rm [shortname]`

## 8. 其他命令

文本编辑工具 `git config --global core.editor emacs`
差异分析工具 `git config --global merge.tool vimdiff`
设置用户名 `git config --global user.name "runoob"`
设置邮箱 `git config --global user.email test@runoob.com`
查看文件内容 `cat README.md`

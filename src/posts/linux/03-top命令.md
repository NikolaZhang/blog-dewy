---
title: linux top命令
isOriginal: false
tag:
  - linux
  - 命令
  - top
category: linux
description: 在Linux中使用top命令
date: 2021-05-28

sticky: false
timeline: true
article: true
star: false
---

> top 可以显示当前系统正在执行的进程的相关信息，包括进程ID、内存占用率、CPU占用率等.

## 命令格式

top [选项]

- d : 改变显示的更新速度，或是在交谈式指令列( interactive command)按 s
- q : 没有任何延迟的显示速度，如果使用者是有 superuser 的权限，则 top 将会以最高的优先序执行
- c : 切换显示模式，共有两种模式，一是只显示执行档的名称，另一种是显示完整的路径与名称
- S : 累积模式，会将己完成或消失的子行程 ( dead child process ) 的 CPU time 累积起来
- s : 安全模式，将交谈式指令取消, 避免潜在的危机
- i : 不显示任何闲置 (idle) 或无用 (zombie) 的行程
- n : 更新的次数，完成后将会退出 top
- b : 批次档模式，搭配 "n" 参数一起使用，可以用来将 top 的结果输出到档案内

## top命令输出及含义

```
top - 14:18:24 up 32 days, 18:52,  1 user,  load average: 0.05, 0.08, 0.08
Tasks:  96 total,   2 running,  94 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.4 us,  1.4 sy,  0.0 ni, 94.9 id,  1.4 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   1987.7 total,     67.8 free,   1068.5 used,    851.4 buff/cache
MiB Swap:      0.0 total,      0.0 free,      0.0 used.    744.4 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 182011 root      10 -10  128696  31332  10156 S   1.7   1.5 644:37.44 AliYunDun
   1147 systemd+  20   0 1282756 457292  14872 S   0.7  22.5 324:11.54 mysqld
    462 syslog    20   0  224348   3920   2360 S   0.3   0.2   2:35.88 rsyslogd
    ..............
```

前五行是系统整体的统计信息。

第一行是任务队列信息，同 uptime 命令的执行结果。

|                                |                                                                                       |
| :----------------------------- | :------------------------------------------------------------------------------------ |
| 14:18:24                       | 系统当前时间                                                                          |
| up 32 days, 18:52              | 系统运行时间，格式为: XXXdays, 时:分                                                  |
| 1 user                         | 当前登录用户数                                                                        |
| load average: 0.05, 0.08, 0.08 | 系统负载，即任务队列的平均长度(三个数值分别为 1分钟、5分钟、15分钟前到现在的平均值。) |

第二、三行为进程和CPU的信息。当有多个CPU时，这些内容可能会超过两行。内容如下：

|                 |                                               |
| :-------------- | :-------------------------------------------- |
| Tasks: 96 total | 进程总数                                      |
| 2 running       | 正在运行的进程数                              |
| 94 sleeping     | 睡眠的进程数                                  |
| 0 stopped       | 停止的进程数                                  |
| 0 zombie        | 僵尸进程数                                    |
| Cpu(s): 2.4 us  | 用户空间占用CPU百分比                         |
| 1.4 sy sy       | 内核空间占用CPU百分比                         |
| 0.0 ni          | 用户进程空间内改变过优先级的进程占用CPU百分比 |
| 94.9 id         | 空闲CPU百分比                                 |
| 1.4 wa          | cpu运行时在等待io的时间                       |
| 0.0% hi         | cpu处理硬中断的数量                           |
| 0.0% si         | cpu处理软中断的数量                           |

最后两行为内存信息。内容如下：

|                   |                                                  |
| :---------------- | :----------------------------------------------- |
| Mem: 1987.7 total | 物理内存总量                                     |
| 67.8 free         | 空闲内存总量                                     |
| 1068.5 used       | 使用的物理内存总量                               |
| 851.4 buff/cache  | 用作内核缓存的内存量                             |
| Swap: 0.0 total   | 交换区总量                                       |
| 0.0 used          | 使用的交换区总量                                 |
| 0.0 free          | 空闲交换区总量                                   |
| 744.4 avail Mem   | 无需交换时, 大概有多少内存可用于启动新的应用程序 |

内存中的内容被换出到交换区，而后又被换入到内存，但使用过的交换区尚未被覆盖，
该数值即为这些内容已存在于内存中的交换区的大小。
相应的内存再次被换出时可不必再对交换区写入。

列表展示部分的各个列的含义:

| 列名    | 含义                                                                 |
| :------ | :------------------------------------------------------------------- |
| PID     | 进程id                                                               |
| PPID    | 父进程id                                                             |
| RUSER   | Real user name                                                       |
| UID     | 进程所有者的用户id                                                   |
| USER    | 进程所有者的用户名                                                   |
| GROUP   | 进程所有者的组名                                                     |
| TTY     | 启动进程的终端名。不是从终端启动的进程则显示为 ?                     |
| PR      | 优先级                                                               |
| NI      | nice值。负值表示高优先级，正值表示低优先级                           |
| P       | 最后使用的CPU，仅在多CPU环境下有意义                                 |
| %CPU    | 上次更新到现在的CPU时间占用百分比                                    |
| TIME    | 进程使用的CPU时间总计，单位秒                                        |
| TIME+   | 进程使用的CPU时间总计，单位1/100秒                                   |
| %MEM    | 进程使用的物理内存百分比                                             |
| VIRT    | 进程使用的虚拟内存总量，单位kb。VIRT=SWAP+RES                        |
| SWAP    | 进程使用的虚拟内存中，被换出的大小，单位kb。                         |
| RES     | 进程使用的、未被换出的物理内存大小，单位kb。RES=CODE+DATA            |
| CODE    | 可执行代码占用的物理内存大小，单位kb                                 |
| DATA    | 可执行代码以外的部分(数据段+栈)占用的物理内存大小，单位kb            |
| SHR     | 共享内存大小，单位kb                                                 |
| nFLT    | 页面错误次数                                                         |
| nDRT    | 最后一次写入到现在，被修改过的页面数。                               |
| S       | 进程状态。 D=不可中断的睡眠状态 R=运行 S=睡眠 T=跟踪/停止 Z=僵尸进程 |
| COMMAND | 命令名/命令行                                                        |
| WCHAN   | 若该进程在睡眠，则显示睡眠中的系统函数名                             |
| Flags   | 任务标志，参考 sched.h                                               |

## 更多命令

进入top命令后, 按?可以查看帮助:

```
Help for Interactive Commands - procps-ng UNKNOWN
Window 1:Def: Cumulative mode Off.  System: Delay 3.0 secs; Secure mode Off.

  Z,B,E,e   Global: 'Z' colors; 'B' bold; 'E'/'e' summary/task memory scale
  l,t,m     Toggle Summary: 'l' load avg; 't' task/cpu stats; 'm' memory info
  0,1,2,3,I Toggle: '0' zeros; '1/2/3' cpus or numa node views; 'I' Irix mode
  f,F,X     Fields: 'f'/'F' add/remove/order/sort; 'X' increase fixed-width

  L,&,<,> . Locate: 'L'/'&' find/again; Move sort column: '<'/'>' left/right
  R,H,J,C . Toggle: 'R' Sort; 'H' Threads; 'J' Num justify; 'C' Coordinates
  c,i,S,j . Toggle: 'c' Cmd name/line; 'i' Idle; 'S' Time; 'j' Str justify
  x,y     . Toggle highlights: 'x' sort field; 'y' running tasks
  z,b     . Toggle: 'z' color/mono; 'b' bold/reverse (only if 'x' or 'y')
  u,U,o,O . Filter by: 'u'/'U' effective/any user; 'o'/'O' other criteria
  n,#,^O  . Set: 'n'/'#' max tasks displayed; Show: Ctrl+'O' other filter(s)
  V,v     . Toggle: 'V' forest view; 'v' hide/show forest view children

  k,r       Manipulate tasks: 'k' kill; 'r' renice
  d or s    Set update interval
  W,Y       Write configuration file 'W'; Inspect other output 'Y'
  q         Quit
          ( commands shown with '.' require a visible task display window )
```

这里说一下比较有用的命令.

|      |                                                                                     |
| :--- | :---------------------------------------------------------------------------------- |
| E    | 更改summery区域(前5行)中`memory`的单位 依次会变为: K, M, G, T, P, E                 |
| e    | 更改进程区域(前5行)中`memory`的单位 依次会变为: k, m, g, t, p                       |
| i    | 开/关忽略闲置和僵死进程                                                             |
| k    | 终止一个进程                                                                        |
| c    | 切换显示命令名称和完整命令行                                                        |
| l    | 切换显示平均负载和启动时间信息                                                      |
| m    | 切换显示内存信息                                                                    |
| t    | 切换显示进程和CPU状态信息                                                           |
| S    | 切换到累计模式,会将己完成或消失的子行程 ( dead child process ) 的 CPU time 累积起来 |
| s    | 更改刷新间隔时间，单位秒                                                            |
| 1    | 展开多核cpu显示                                                                     |
| L    | 查找字符                                                                            |
| T    | 根据时间/累计时间进行排序                                                           |
| P    | 根据CPU使用率进行排序  （默认排序）                                                 |
| M    | 根据内存使用大小排序                                                                |
| o,O  | 改变显示项目的顺序                                                                  |
| </>  | 切换列变更展示顺序                                                                  |
| f,F  | 从当前显示中添加或者删除项目                                                        |
| r    | 重新安排一个进程的优先级别                                                          |
| w    | 将当前设置写入~/.toprc文件中                                                        |
| h    | 显示快捷键帮助                                                                      |
| q    | 退出程序                                                                            |

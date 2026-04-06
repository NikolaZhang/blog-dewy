---
title: Spring AI Alibaba Agents
category: Spring Boot AI
tag: [Spring Boot AI, Alibaba Agents]
description: Spring AI Alibaba Agents 是一个基于 Spring Boot AI 框架的智能体，用于在 Spring Boot 应用中实现智能体功能。
date: 2026-04-04
author: dewyyr

icon: paw
isOriginal: false
sticky: false
timeline: true
article: true
star: false
---

> 本文是Spring AI Alibaba框架中Agent Framework核心模块 ——Agents的官方说明文档，聚焦生产级ReactAgent的原理、组件、用法与高级特性，帮助 Java 开发者快速构建 LLM 智能体应用。

## 一、核心定位

Agents 定义：将大语言模型与工具结合，具备推理、工具调用、循环迭代能力的自动化系统，直至问题解决或达到迭代上限。
核心实现：基于ReAct 范式的ReactAgent，是 Spring AI Alibaba 提供的生产级 Agent 方案。

## 二、ReAct 理论与工作原理

1. ReAct 范式（Reasoning + Acting）
Agent 执行四步循环：思考→行动→观察→迭代，可拆解复杂问题、动态调整策略、处理多工具调用任务。
2. ReactAgent 运行机制
基于Graph 运行时，由节点驱动执行：
Model Node：LLM 推理决策
Tool Node：执行工具调用
Hook Nodes：插入自定义逻辑

![2026-04-06-00-57-24](http://dewy-blog.nikolazh.eu.org/SpringAIAlibabaAgents/2026-04-06-00-57-24.png?imageslim/zlevel/5)

## 三、核心组件

1. Model（模型）
作为 Agent 推理引擎，支持通义 DashScope 等模型
可通过ChatOptions配置temperature、maxTokens、topP等参数，控制输出随机性与长度
2. Tools（工具）
赋予 Agent 实操能力，支持顺序 / 并行调用、动态选择、错误拦截
提供ToolInterceptor实现工具异常捕获、监控与重试
3. System Prompt（系统提示）
基础配置：直接传入字符串
详细指令：使用instruction参数
动态提示：通过ModelInterceptor实现上下文感知的动态 prompt

## 四、Agent 调用方式

基础调用：call()方法，直接获取最终响应
完整状态：invoke()方法，获取消息历史、自定义状态等全量执行信息
运行配置：RunnableConfig传递threadId、元数据，维护对话上下文

## 五、高级特性

结构化输出
outputType：Java 类定义结构，自动生成 JSON Schema（推荐）
outputSchema：自定义 Schema，适配动态 / 复杂格式
Memory（记忆）
自动维护对话历史，支持MemorySaver（内存）、RedisSaver/MongoSaver（生产持久化）
用threadId关联多轮对话上下文
Hooks（钩子）
执行位置：Agent 全局前后、模型调用前后
用途：日志、消息修剪、迭代次数限制
Interceptors（拦截器）
ModelInterceptor：内容安全、动态提示、日志监控
ToolInterceptor：工具错误处理、权限校验、结果缓存
控制与流式输出
迭代控制：限制模型调用次数、自定义停止条件，避免无限循环
流式输出：通过OutputType区分模型 / 工具 / Hook 的流式增量与完成状态，支持展示模型思考过程（Thinking）
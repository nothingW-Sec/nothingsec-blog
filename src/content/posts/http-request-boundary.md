---
title: "重新理解 HTTP 请求：安全测试中的边界在哪里"
description: "从请求行、头部到正文，梳理一次请求在代理工具中被观察和修改的全过程。"
publishDate: "2026-07-21"
category: "网络与协议"
type: "学习笔记"
tags: [HTTP, Burp Suite]
difficulty: "入门"
platform: "Burp Suite"
draft: false
featured: false
---
## 从数据流开始

浏览器里的一个按钮，最终会变成结构化的字节流。理解安全边界，首先要知道数据在哪一层被解释。

## 一份观察清单

- 请求方法与资源路径是否匹配
- 身份状态依赖 Cookie 还是 Authorization
- 服务端真正信任了哪些客户端字段

```text
client -> proxy -> edge -> application -> database
```

## 给未来的提醒

代理工具看到的是通信切面，不是系统全貌。每个结论都需要服务端行为或多组响应作为支撑。

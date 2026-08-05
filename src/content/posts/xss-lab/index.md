---
title: "xss-lab"
description: "暂无描述"
publishDate: "2026-08-05"
category: "技术学习"
tags:
  - "xss"
type: "实验复盘"
featured: false
draft: false
cover: "./images/image-20260805144458-5s66wtv.webp"
coverAlt: "image"
---

# xss-lab

# xss-lab

```yaml
原理：对用户输入做过滤/转义，直接把输入拼进 HTML 输出
本质：窃密，劫持，钓鱼
边界：网页环境（JavaScript权限）

```

## less1

![image](./images/image-20260805144458-5s66wtv.webp)

直接输入`<script>alert(123)</script> `进入下一关

# NothingSec

Astro + TypeScript + Markdown/MDX 的静态网络安全博客，部署目标为 GitHub 与 Cloudflare Pages。

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

静态产物位于 `dist/`。

## 写文章

推荐打开 `https://nothingsec.com/admin/` 使用可视化后台管理文章；也可以复制 `docs/post-template.md` 手动编辑。`draft: true` 的文章不会发布。

## 文章管理后台

后台使用 Decap CMS 管理 `src/content/posts`，图片上传到 `public/uploads`。采用“草稿 → 审核中 → 发布”的编辑工作流，发布时会由 GitHub 提交并触发 Cloudflare Pages 自动部署。

首次启用前需要部署 `cms-auth-worker` 并创建 GitHub OAuth App：

- Homepage URL：`https://cms-auth.nothingsec.com`
- Authorization callback URL：`https://cms-auth.nothingsec.com/callback`

具体命令见 `cms-auth-worker/README.md`。OAuth Client Secret 只写入 Cloudflare Worker Secret，禁止提交到 GitHub。

## Cloudflare Pages

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `astro-blog`（仓库根目录为当前父项目时）
- Node.js version: `22`
- Environment variable: `ASTRO_TELEMETRY_DISABLED=1`

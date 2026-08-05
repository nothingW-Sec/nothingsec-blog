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

复制 `docs/post-template.md`，在 `src/content/posts/<slug>/index.md` 中编写文章。文章图片放在同目录的 `images/` 中，并使用相对路径引用。

文章采用 Markdown Frontmatter 管理。`draft: true` 的文章不会生成页面，也不会进入文章列表、RSS、sitemap 或搜索；`draft: false` 或省略 `draft` 时正常发布。

## 发布文章

完成本地检查后，可以运行：

```bat
publish.bat
```

脚本会先通过 `git pull --rebase --autostash` 同步远程修改，再确认、提交并推送本地内容。也可以直接在 GitHub 的 `main` 分支上传符合文章结构的 Markdown 文件。每次推送都会触发 Cloudflare Pages 自动构建和部署。

## Cloudflare Pages

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `astro-blog`（仓库根目录为当前父项目时）
- Node.js version: `22`
- Environment variable: `ASTRO_TELEMETRY_DISABLED=1`

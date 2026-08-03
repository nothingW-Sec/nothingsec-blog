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

复制 `src/content/posts/_template.md`，修改文件名与 frontmatter。`draft: true` 的文章不会发布。

## Cloudflare Pages

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `astro-blog`（仓库根目录为当前父项目时）
- Node.js version: `22`
- Environment variable: `ASTRO_TELEMETRY_DISABLED=1`

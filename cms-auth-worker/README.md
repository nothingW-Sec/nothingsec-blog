# NothingSec CMS OAuth Worker

为 `https://nothingsec.com/admin/` 提供 GitHub OAuth 登录，仅接受 NothingSec 正式站点与本地 Astro 开发地址。

## 配置和部署

1. 在 GitHub 创建 OAuth App：
   - Homepage URL：`https://cms-auth.nothingsec.com`
   - Authorization callback URL：`https://cms-auth.nothingsec.com/callback`
2. 安装依赖并登录 Cloudflare：

   ```bash
   npm install
   npx wrangler login
   ```

3. 写入 OAuth App 的 Client ID 与 Client Secret：

   ```bash
   npx wrangler secret put GITHUB_OAUTH_ID
   npx wrangler secret put GITHUB_OAUTH_SECRET
   ```

4. 部署：

   ```bash
   npm run deploy
   ```

本地调试时可将 `.dev.vars.example` 复制为 `.dev.vars`，不要提交 `.dev.vars` 或任何真实密钥。

interface Env {
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  GITHUB_REPO_PRIVATE?: string;
}

interface StatePayload {
  origin: string;
  nonce: string;
  expiresAt: number;
}

const allowedOrigins = new Set([
  "https://nothingsec.com",
  "https://www.nothingsec.com",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);

const encoder = new TextEncoder();
const securityHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function base64Url(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signature(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

async function createState(origin: string, secret: string): Promise<string> {
  const payload: StatePayload = {
    origin,
    nonce: crypto.randomUUID(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  const encoded = base64Url(encoder.encode(JSON.stringify(payload)));
  return `${encoded}.${await signature(encoded, secret)}`;
}

async function readState(state: string, secret: string): Promise<StatePayload | null> {
  const [encoded, suppliedSignature, extra] = state.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  const expectedSignature = await signature(encoded, secret);
  if (suppliedSignature.length !== expectedSignature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < suppliedSignature.length; index += 1) {
    mismatch |= suppliedSignature.charCodeAt(index) ^ expectedSignature.charCodeAt(index);
  }
  if (mismatch !== 0) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encoded))) as StatePayload;
    if (!allowedOrigins.has(payload.origin) || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getAdminOrigin(siteId: string | null): string | null {
  if (!siteId) return null;
  try {
    const candidate = siteId.includes("://") ? new URL(siteId).origin : `https://${siteId}`;
    return allowedOrigins.has(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function textResponse(message: string, status = 200): Response {
  return new Response(message, {
    status,
    headers: { ...securityHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}

function callbackPage(origin: string, status: "success" | "error", payload: Record<string, string>): Response {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const safeOrigin = JSON.stringify(origin).replace(/</g, "\\u003c");
  const safeMessage = JSON.stringify(message).replace(/</g, "\\u003c");
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>NothingSec 登录</title></head><body><p>认证完成，此窗口将自动关闭。</p><script>const target=${safeOrigin};const result=${safeMessage};function finish(){if(window.opener){window.opener.postMessage(result,target);window.close();}}window.addEventListener('message',event=>{if(event.origin===target)finish();},{once:true});if(window.opener){window.opener.postMessage('authorizing:github',target);setTimeout(finish,500);}</script></body></html>`;
  return new Response(html, {
    status: status === "success" ? 200 : 400,
    headers: {
      ...securityHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; img-src 'none'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    },
  });
}

async function authorize(url: URL, env: Env): Promise<Response> {
  if (url.searchParams.get("provider") !== "github") return textResponse("不支持的认证提供商。", 400);
  const origin = getAdminOrigin(url.searchParams.get("site_id"));
  if (!origin) return textResponse("不允许的站点来源。", 403);
  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) return textResponse("OAuth 服务尚未配置。", 503);

  const state = await createState(origin, env.GITHUB_OAUTH_SECRET);
  const params = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_ID,
    redirect_uri: `${url.origin}/callback`,
    scope: env.GITHUB_REPO_PRIVATE === "1" ? "repo" : "public_repo",
    state,
  });
  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302);
}

async function callback(url: URL, env: Env): Promise<Response> {
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code || !env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) {
    return textResponse("认证参数不完整。", 400);
  }
  const payload = await readState(state, env.GITHUB_OAUTH_SECRET);
  if (!payload) return textResponse("认证状态无效或已过期。", 400);

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_ID,
      client_secret: env.GITHUB_OAUTH_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });
  const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    return callbackPage(payload.origin, "error", { message: tokenData.error ?? "token_exchange_failed" });
  }
  return callbackPage(payload.origin, "success", { token: tokenData.access_token });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") return textResponse("Method Not Allowed", 405);
    const url = new URL(request.url);
    if (url.pathname === "/auth") return authorize(url, env);
    if (url.pathname === "/callback") return callback(url, env);
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ service: "nothingsec-cms-auth", status: "ok" }), {
        headers: { ...securityHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }
    return textResponse("Not Found", 404);
  },
};

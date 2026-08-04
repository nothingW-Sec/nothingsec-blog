import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const env = {
  GITHUB_OAUTH_ID: "client-id",
  GITHUB_OAUTH_SECRET: "test-secret",
  GITHUB_REPO_PRIVATE: "0",
};

async function beginLogin(siteId = "nothingsec.com"): Promise<Response> {
  return worker.fetch(new Request(`https://cms-auth.nothingsec.com/auth?provider=github&site_id=${siteId}`), env);
}

describe("NothingSec CMS OAuth worker", () => {
  afterEach(() => vi.restoreAllMocks());

  it("rejects an unknown site", async () => {
    const response = await beginLogin("evil.example");
    expect(response.status).toBe(403);
  });

  it("starts GitHub OAuth with a signed state", async () => {
    const response = await beginLogin();
    const location = new URL(response.headers.get("location")!);
    expect(response.status).toBe(302);
    expect(location.origin).toBe("https://github.com");
    expect(location.searchParams.get("scope")).toBe("public_repo");
    expect(location.searchParams.get("state")).toContain(".");
  });

  it("rejects a tampered callback state", async () => {
    const login = await beginLogin();
    const state = new URL(login.headers.get("location")!).searchParams.get("state")!;
    const response = await worker.fetch(
      new Request(`https://cms-auth.nothingsec.com/callback?code=test&state=${state}x`),
      env,
    );
    expect(response.status).toBe(400);
  });

  it("returns the token only to the approved admin origin", async () => {
    const login = await beginLogin();
    const state = new URL(login.headers.get("location")!).searchParams.get("state")!;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: "secret-token" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
    const response = await worker.fetch(
      new Request(`https://cms-auth.nothingsec.com/callback?code=test&state=${encodeURIComponent(state)}`),
      env,
    );
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("authorization:github:success");
    expect(html).toContain("https://nothingsec.com");
  });
});

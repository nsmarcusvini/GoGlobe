import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("env", () => {
  it("parses feature flags as booleans, defaulting to false", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test");
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    vi.stubEnv("AI_ENABLED", "");
    const { readServerEnv } = await import("./env");
    const env = readServerEnv();
    expect(env.PAYMENTS_ENABLED).toBe(true);
    expect(env.AI_ENABLED).toBe(false);
  });

  it("rejects an invalid Supabase URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "key");
    const { publicEnv } = await import("./env");
    expect(() => publicEnv()).toThrow();
  });
});

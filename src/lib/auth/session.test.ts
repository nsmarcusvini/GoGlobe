import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { safeNextPath } = await import("./session");

describe("safeNextPath", () => {
  it.each(["/admin", "/app/painel?x=1", "/"])("keeps relative path %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "admin",
    "",
    null,
    undefined,
  ])("rejects %s", (path) => {
    expect(safeNextPath(path, "/fallback")).toBe("/fallback");
  });
});

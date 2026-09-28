import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Needs a Supabase instance (local stack + .env.local). CI runs the database
// tests in their own job, so this is skipped there.
test.skip(!existsSync(".env.local"), "Supabase not configured");

test("admin area redirects anonymous visitors to the sign-in page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/entrar$/);
  await expect(page.getByRole("heading", { name: "Entrar na curadoria" })).toBeVisible();
});

test("admin pages are not indexed", async ({ page }) => {
  await page.goto("/admin/entrar");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("pathway editor rejects malformed ids", async ({ page }) => {
  const response = await page.goto("/admin/caminhos/not-a-uuid");
  // Anonymous users are redirected before the id is even looked at.
  expect(response?.url()).toMatch(/\/admin\/entrar$/);
});

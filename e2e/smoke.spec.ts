import { expect, test } from "@playwright/test";

test("home loads with the legal notice", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/GoGlobe/);
  await expect(page.getByTestId("legal-notice")).toBeVisible();
});

test("legal notice page is reachable from home", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Leia o aviso legal completo" }).click();
  await expect(page).toHaveURL(/\/aviso-legal$/);
  await expect(page.getByRole("heading", { level: 1, name: "Aviso legal" })).toBeVisible();
});

test("security headers are set", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

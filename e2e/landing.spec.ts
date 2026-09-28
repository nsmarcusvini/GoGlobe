import { expect, test } from "@playwright/test";

test("primary CTA starts onboarding", async ({ page }) => {
  await page.goto("/");
  const cta = page.getByRole("link", { name: "Criar meu perfil grátis" }).first();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "/app/onboarding");
});

test("landing never uses recommendation language", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("main").innerText()).toLowerCase();
  for (const banned of [
    "recomendado para você",
    "melhor opção",
    "você deve aplicar",
    "visto garantido",
  ]) {
    expect(text).not.toContain(banned);
  }
});

test("theme toggle switches and persists", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");

  const toggle = page.getByRole("button", { name: /^Tema:/ });
  await toggle.click(); // system -> light
  await toggle.click(); // light -> dark
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("follows the OS dark preference by default", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("country story exposes every official authority as text", async ({ page }) => {
  await page.goto("/");
  for (const authority of [
    "Department of Home Affairs",
    "Immigration New Zealand",
    "Immigration, Refugees and Citizenship Canada (IRCC)",
  ]) {
    await expect(
      page.locator("#paises").getByRole("link", { name: authority, exact: false }),
    ).toHaveCount(1);
  }
});

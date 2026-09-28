import { expect, test } from "@playwright/test";

test("unknown route shows the off-route page with a way back", async ({ page }) => {
  const response = await page.goto("/rota-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Esta página não está no mapa.");
  await expect(
    page.getByRole("navigation", { name: "Já no mapa" }).getByRole("link", { name: /Início/ }),
  ).toHaveAttribute("href", "/");
});

test("under-construction page says what it will hold", async ({ page }) => {
  await page.goto("/precos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Planos e preços");
  await expect(page.getByText("Trecho em construção · Fase 6")).toBeVisible();
});

test("hero route ledger lists every destination", async ({ page }) => {
  await page.goto("/");
  const ledger = page.getByRole("table", { name: "Plano de rota" });
  for (const code of ["BR", "AU", "NZ", "CA"]) {
    await expect(ledger.getByRole("rowheader", { name: code })).toBeVisible();
  }
});

test("mobile menu opens, links and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The menu only exists below the lg breakpoint");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Abrir menu" });
  await toggle.click();
  const link = page.getByRole("link", { name: /Como funciona/ }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

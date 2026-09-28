import { expect, test } from "@playwright/test";

test("unknown route shows the off-route page with a way back", async ({ page }) => {
  const response = await page.goto("/rota-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Esta página não está no mapa.");
  await expect(
    page.getByRole("navigation", { name: "Já no mapa" }).getByRole("link", { name: /Início/ }),
  ).toHaveAttribute("href", "/");
});

test("terms page is a draft with pending facts marked", async ({ page }) => {
  await page.goto("/termos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termos de uso");
  await expect(page.getByText(/pendente de revisão jurídica/)).toBeVisible();
  await expect(page.getByText("[cidade do foro: pendente]")).toBeVisible();
  await expect(page.getByText(/artigo 49 do Código de Defesa do Consumidor/)).toBeVisible();
});

test("about page traces the method and lists what GoGlobe never does", async ({ page }) => {
  await page.goto("/sobre");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Uma informação, do governo até a sua tela.",
  );
  for (const step of [
    "Publicado pelo governo",
    "Lido por nós",
    "Verificado e datado",
    "Na sua tela",
    "Conferido de novo",
  ]) {
    await expect(page.getByRole("heading", { name: step })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "O que o GoGlobe não faz" })).toBeVisible();
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

import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("consent card asks once, with equal choices, and can be reopened", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const card = page.getByRole("region", { name: "Medição de uso" });
  await expect(card).toBeVisible();
  const accept = card.getByRole("button", { name: "Aceitar medição" });
  const reject = card.getByRole("button", { name: "Recusar" });
  // Same visual weight: identical height and no primary colour on either.
  const [a, r] = [await accept.boundingBox(), await reject.boundingBox()];
  expect(Math.abs((a?.height ?? 0) - (r?.height ?? 0))).toBeLessThan(1);

  await reject.click();
  await expect(card).toBeHidden();
  const consent = (await context.cookies()).find((c) => c.name === "gg_consent");
  expect(consent?.value).toBe("rejected");
  expect((await context.cookies()).find((c) => c.name === "gg_aid")).toBeUndefined();

  await page.reload();
  await expect(card).toBeHidden();

  await page.getByRole("button", { name: "Preferências de cookies" }).click();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Aceitar medição" }).click();
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "gg_consent")?.value).toBe("accepted");
  expect(cookies.find((c) => c.name === "gg_aid")?.value).toMatch(/^[0-9a-f-]{36}$/);
});

test("pricing shows the configured prices and the Pro honesty note", async ({ page }) => {
  await page.goto("/precos");
  // Intl formats "R$ 29" with a non-breaking space (\s matches it).
  await expect(page.getByText(/^R\$\s29$/)).toBeVisible();
  await expect(page.getByText(/R\$\s129 por 6 meses/)).toBeVisible();
  await expect(page.getByText(/não inclui aconselhamento migratório/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "O que cada plano inclui" })).toBeVisible();
});

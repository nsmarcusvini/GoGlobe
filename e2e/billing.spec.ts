import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Fake door and plan limits need Supabase (waitlist + database triggers).
test.skip(!existsSync(".env.local") && !process.env.E2E_SUPABASE, "Supabase not configured");
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

test("fake door: Pro opens an honest waitlist panel and records the e-mail", async ({ page }) => {
  test.skip(process.env.PAYMENTS_ENABLED === "true", "Payments are open: no fake door");
  await page.goto("/precos");
  await page.getByRole("button", { name: "Assinar mensal" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Os pagamentos ainda não estão abertos." });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("E-mail").fill(`lead-${Date.now()}@goglobe.test`);
  await dialog.getByRole("button", { name: "Quero ser avisado" }).click();
  await expect(
    dialog.getByText("Pronto. Avisaremos neste e-mail quando o Pro abrir."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

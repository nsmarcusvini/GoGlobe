import { existsSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Subscriber Base ("Próxima Parada") against a real local Supabase. A Pro user
// is created with the service role; the checklist comes from following a
// pathway through the UI, like a real member.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, "Supabase not configured");
test.describe.configure({ mode: "serial" });

async function signInPro(page: Page) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    },
  );
  const email = `base-${Date.now()}@goglobe.test`;
  const { data: created, error } = await db.auth.admin.createUser({ email, email_confirm: true });
  if (error || !created.user) throw error ?? new Error("user");
  const id = created.user.id;
  await db
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString(), target_countries: ["AU"] })
    .eq("user_id", id);
  await db.from("subscriptions").insert({
    user_id: id,
    plan: "pro",
    status: "active",
    billing_kind: "pass",
    current_period_end: new Date(Date.now() + 180 * 864e5).toISOString(),
  });
  const { data: link } = await db.auth.admin.generateLink({ type: "magiclink", email });
  await page.goto(
    `/auth/callback?token_hash=${link.properties!.hashed_token}&type=magiclink&next=/app`,
  );
  return () => db.auth.admin.deleteUser(id);
}

test("Pro member lands on the Base, not the onboarding rail, and advances the route", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One run is enough");
  test.setTimeout(90_000);
  const cleanup = await signInPro(page);

  // /app sends Pro members to the Base; the onboarding rail is gone.
  await expect(page).toHaveURL(/\/app\/base$/);
  const nav = page.getByRole("navigation", { name: "Navegação da conta Pro" });
  await expect(nav.getByRole("link", { name: "Base" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Sua jornada" })).toHaveCount(0);

  // Incomplete profile shows as an open stop; no pathway yet means "choose one".
  await expect(page.getByText("Complete seu perfil")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Escolha um caminho para traçar a rota.",
  );
  await expect(page.getByRole("heading", { name: "Austrália" })).toHaveCount(0);
  await expect(page.getByText("Austrália", { exact: true })).toBeVisible();

  // Following a pathway turns its checklist into the route.
  await page.goto("/app/caminhos/skilled-independent-189");
  await page.getByRole("button", { name: "Acompanhar este caminho" }).click();
  await expect(page).toHaveURL(/\/app\/planos\/[0-9a-f-]{36}$/);

  // Due dates (Pro) save: regression for the date validation.
  // The date saves on change (no button).
  await page.locator('input[name="due_date"]').first().fill("2026-12-01");
  await expect(page.getByText("Prazo salvo.")).toBeVisible();

  await page.goto("/app/base");
  const title = page.locator("#next-stop-title");
  const first = (await title.textContent())?.trim();
  expect(first).toBeTruthy();
  await expect(page.getByText("prazo 01/12/2026").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Provas de inglês" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Áreas de trabalho" })).toBeVisible();
  for (const banned of ["recomendado para você", "melhor opção", "você deve aplicar"]) {
    await expect(page.locator("main")).not.toContainText(banned);
  }

  // Marking the next stop done lights the following one.
  await page.getByRole("button", { name: "Marcar como feito" }).click();
  await expect(title).not.toHaveText(first!, { timeout: 15_000 });
  await expect(page.getByText(first!, { exact: true })).toBeVisible();

  // No WCAG A/AA violations on the Base (light and dark).
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.waitForTimeout(900);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual(
      [],
    );
  }

  await cleanup();
});

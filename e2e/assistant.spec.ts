import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Phase 7 assistant against a real local Supabase, with the offline stand-ins
// (AI_MOCK: lexical embeddings + canned answers). Needs AI_ENABLED=true and the
// knowledge base ingested (`npm run ingest -- --curated-only`).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const enabled = process.env.AI_ENABLED === "true" && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
test.skip(!enabled, "Assistant disabled or Supabase not configured");
test.describe.configure({ mode: "serial" });

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    },
  );
}

/** Creates a user (optionally Pro, following the 189), signs the page in. */
async function signIn(page: Page, { pro }: { pro: boolean }) {
  const db = admin();
  const email = `ai-${pro ? "pro" : "free"}-${Date.now()}@goglobe.test`;
  const { data: created, error } = await db.auth.admin.createUser({ email, email_confirm: true });
  if (error || !created.user) throw error ?? new Error("user");
  const id = created.user.id;
  await db
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("user_id", id);
  if (pro) {
    await db.from("subscriptions").insert({
      user_id: id,
      plan: "pro",
      status: "active",
      billing_kind: "subscription",
      current_period_end: new Date(Date.now() + 30 * 864e5).toISOString(),
    });
    const { data: pathway } = await db
      .from("pathways")
      .select("id")
      .eq("slug", "skilled-independent-189")
      .single();
    await db.from("user_plans").insert({ user_id: id, pathway_id: pathway!.id });
  }
  const { data: link } = await db.auth.admin.generateLink({ type: "magiclink", email });
  await page.goto(
    `/auth/callback?token_hash=${link.properties!.hashed_token}&type=magiclink&next=/app/assistente`,
  );
  await expect(page).toHaveURL(/\/app\/assistente$/);
  return { id, cleanup: () => db.auth.admin.deleteUser(id) };
}

test("Pro user asks, sees cited official sources, and advice is redirected", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One run is enough");
  test.setTimeout(90_000);
  const { cleanup } = await signIn(page, { pro: true });

  await expect(page.getByRole("heading", { name: "Pergunte às fontes." })).toBeVisible();
  await expect(page.getByTestId("assistant-legal")).toContainText(
    "Não é aconselhamento migratório",
  );
  const gauge = page.getByRole("meter", { name: "Mensagens do mês" });
  await expect(gauge).toHaveAttribute("aria-valuenow", "0");

  // A factual question: the answer cites [1] and the source card shows the official domain.
  const box = page.getByPlaceholder(/quais testes de inglês/);
  await box.fill("Qual a idade máxima para o visto?");
  await box.press("Enter");
  const first = page.locator("li#reg-1");
  await expect(first).toHaveAttribute("aria-busy", "false", { timeout: 20_000 });
  const marker = first.getByRole("button", { name: /^Fonte 1: / });
  await expect(marker).toBeVisible();
  await marker.hover();
  await expect(first.locator('[data-source="1"]')).toHaveClass(/border-route/);
  await expect(first.locator('[data-source="1"] a')).toHaveAttribute("href", /^https:\/\//);
  await expect(gauge).toHaveAttribute("aria-valuenow", "1");

  // An advice request becomes the "fora da rota" sign with licensed professionals.
  await box.fill("Qual visto devo escolher, o 189 ou o 190?");
  await box.press("Enter");
  const detour = page.locator("li#reg-2").getByTestId("assistant-detour");
  await expect(detour).toBeVisible({ timeout: 20_000 });
  await expect(detour).toContainText("Isto pede um profissional licenciado.");
  await expect(detour.getByRole("link", { name: /OMARA/ })).toHaveAttribute(
    "href",
    "https://www.mara.gov.au/",
  );
  for (const banned of ["recomendado para você", "melhor opção", "você deve aplicar"]) {
    await expect(page.locator("main")).not.toContainText(banned);
  }

  // Summary from the pathway page opens the side panel.
  await page.goto("/app/caminhos/skilled-independent-189");
  const panel = page.getByRole("dialog", { name: "Diário de bordo" });
  // Retry until hydrated (the button is server-rendered before React attaches).
  await expect(async () => {
    await page.getByRole("button", { name: "Resumir em linguagem simples" }).first().click();
    await expect(panel).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
  await expect(panel.locator("li#reg-1")).toHaveAttribute("aria-busy", "false", {
    timeout: 20_000,
  });
  await expect(panel.locator("li#reg-1")).toContainText("Resumo em linguagem simples");
  await expect(panel.getByTestId("assistant-legal")).toBeVisible();

  await cleanup();
});

test("free user sees the sealed logbook and the API refuses", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One run is enough");
  const { cleanup } = await signIn(page, { pro: false });
  await expect(page.getByRole("heading", { name: "Diário selado." })).toBeVisible();
  const response = await page.request.post("/api/ai", {
    data: { mode: "chat", messages: [{ role: "user", content: "Oi" }] },
  });
  expect(response.status()).toBe(403);
  await cleanup();
});

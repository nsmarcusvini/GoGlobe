import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Full user journey against a real local Supabase (auth + Mailpit):
// sign up → onboarding → results → follow a pathway → tick an item → export → delete.
// Runs when Supabase is configured (.env.local locally, or the CI app job).
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

test.skip(!existsSync(".env.local") && !process.env.E2E_SUPABASE, "Supabase not configured");
test.describe.configure({ mode: "serial" });

async function magicLinkFor(email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const { messages } = (await list.json()) as { messages: Array<{ ID: string }> };
    if (messages?.length) {
      const message = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0]!.ID}`)).json();
      const body = String(message.Text || message.HTML);
      const link = body.match(/https?:\/\/[^\s"<>)]+verify[^\s"<>)]*/)?.[0];
      if (link) return link.replace(/&amp;/g, "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No magic link e-mail for ${email}`);
}

async function choose(page: Page, label: string | RegExp) {
  await page.getByRole("radio", { name: label }).click();
}

async function next(page: Page) {
  await page.getByRole("button", { name: "Continuar" }).click();
}

test("new user goes from sign-up to a ticked checklist item", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One run is enough for the full journey");
  test.setTimeout(120_000);
  const email = `e2e-${Date.now()}@goglobe.test`;

  // Sign up with a magic link.
  await page.goto("/entrar?next=/app/onboarding");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link de acesso" }).click();
  await expect(page.getByText(`Enviamos um link de acesso para ${email}.`)).toBeVisible();
  await page.goto(await magicLinkFor(email));
  await expect(page).toHaveURL(/\/app\/onboarding$/);

  // Onboarding: one question per screen.
  await expect(
    page.getByRole("heading", { name: "Qual é a sua data de nascimento?" }),
  ).toBeVisible();
  await page.getByLabel("Qual é a sua data de nascimento?").fill("1996-05-10");
  await next(page);
  await choose(page, "Solteiro(a)");
  await choose(page, "Não");
  await choose(page, /Morar de forma permanente/);
  await page.locator("label", { hasText: "Austrália" }).click();
  await next(page);
  await choose(page, /Graduação/);
  await page.getByLabel("Qual é a sua profissão atual?").fill("Enfermeira");
  await next(page);
  await page.getByLabel(/Quantos anos de experiência/).fill("5");
  await next(page);
  await choose(page, "Avançado");
  await page.locator("label", { hasText: "IELTS" }).click();
  await page.getByLabel("Nota geral").fill("7");
  await page.getByLabel("Menor nota entre as 4 habilidades").fill("6,5");
  await next(page);
  await page.getByLabel(/Quanto você tem disponível/).fill("80000");
  await next(page);
  await expect(page.getByRole("heading", { name: "Perfil completo." })).toBeVisible();
  await page.getByRole("button", { name: "Ver meus resultados" }).click();

  // Results: only the chosen country, with the organisation disclaimer.
  await expect(page).toHaveURL(/\/app\/resultados$/);
  await expect(page.getByRole("heading", { name: "Caminhos e requisitos" })).toBeVisible();
  await expect(page.getByText(/não uma recomendação/).first()).toBeVisible();
  await expect(page.getByTestId("legal-notice")).toBeVisible();
  const main = page.locator("main");
  for (const banned of ["recomendado para você", "melhor opção", "você deve aplicar"]) {
    await expect(main).not.toContainText(banned);
  }

  // Personalised pathway: age and English are evaluated for this profile.
  await page
    .getByRole("link", { name: "Visto de trabalho qualificado independente (subclasse 189)" })
    .click();
  await expect(page.getByText("Você tem", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Acompanhar este caminho" }).click();

  // Checklist: tick the first stop, and it stays ticked after a reload.
  await expect(page).toHaveURL(/\/app\/planos\/[0-9a-f-]{36}$/);
  const first = page.getByRole("checkbox").first();
  await expect(first).toHaveAttribute("aria-checked", "false");
  await first.click();
  await expect(first).toHaveAttribute("aria-checked", "true");
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByRole("checkbox").first()).toHaveAttribute("aria-checked", "true");

  // Free plan: a second pathway is blocked by the database and leads to pricing.
  await page.goto("/app/caminhos/skilled-nominated-190");
  await page.getByRole("button", { name: "Acompanhar este caminho" }).click();
  await expect(page).toHaveURL(/\/precos\?limite=1$/);
  await expect(page.getByText(/limite do plano gratuito/)).toBeVisible();

  // Pro-only tools stay locked for a free account.
  await page.goto("/app/comparar?c=skilled-independent-189&c=skilled-nominated-190");
  await expect(page.getByText("O comparador é um recurso do plano Pro.")).toBeVisible();

  // Dashboard shows the followed route.
  await page.goto("/app/painel");
  await expect(
    page.getByText("Visto de trabalho qualificado independente (subclasse 189)"),
  ).toBeVisible();

  // LGPD: export returns this user's data as JSON.
  const exported = await page.request.get("/app/conta/exportar");
  expect(exported.headers()["content-type"]).toContain("application/json");
  const data = await exported.json();
  expect(data.account.email).toBe(email);
  expect(data.plans).toHaveLength(1);

  // LGPD: account deletion (also cleans up this test user).
  await page.goto("/app/conta");
  await page.getByLabel("Digite EXCLUIR para confirmar").fill("EXCLUIR");
  await page.getByRole("button", { name: "Excluir minha conta" }).click();
  await expect(page).toHaveURL(/\/\?conta=excluida$/);
  await page.goto("/app/painel");
  await expect(page).toHaveURL(/\/entrar\?next=/);
});

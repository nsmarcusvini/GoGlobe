import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated WCAG 2.1 A/AA scan of the public pages (desktop and mobile
// projects). Manual checks (keyboard order, screen reader wording) stay in the
// Phase 8 audit notes; this keeps regressions out.
const PAGES = [
  "/",
  "/paises/au",
  "/caminhos/au/skilled-independent-189",
  "/precos",
  "/aviso-legal",
  "/privacidade",
  "/termos",
  "/sobre",
  "/entrar",
  "/rota-que-nao-existe",
];

for (const [path, scheme] of PAGES.flatMap((p) => [[p, "light"] as const, [p, "dark"] as const])) {
  test(`no WCAG A/AA violations on ${path} (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    // Let entrance animations settle so contrast is measured on final colours.
    await page.waitForTimeout(1_200);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
    );
    expect(summary).toEqual([]);
  });
}

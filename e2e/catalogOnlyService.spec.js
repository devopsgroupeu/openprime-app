/**
 * OP-208 — the one-place goal, proven end to end.
 *
 * The promise of the runtime catalog (OP-202) is that a knob added to
 * openprime-infra-templates reaches the wizard with no frontend release. Unit
 * tests cannot prove that: they exercise the hydration function directly, so
 * they would still pass if the wizard silently fell back to the static config.
 *
 * This test serves a catalog containing a service that `src/config/services/aws.js`
 * does NOT define, then asserts the wizard renders its card and its fields. The
 * static config cannot produce that service, so a pass is only possible if the
 * catalog actually drove the UI.
 *
 * Requires mock mode: MSW serves the catalog and auth is faked, so no backend,
 * database or Keycloak is involved.
 *
 *   npm run build:mock && npm run preview
 *   PLAYWRIGHT_BASE_URL=http://localhost:4173 BROWSER_CHANNEL=chrome npm run test:e2e
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const baseCatalog = JSON.parse(
  readFileSync(join(here, "../src/mocks/catalog.json"), "utf8"),
);
const staticAws = readFileSync(
  join(here, "../src/config/services/aws.js"),
  "utf8",
);

// Deliberately not a real AWS service. If this ever becomes one, the guard test
// below fails rather than the suite quietly proving nothing.
const SERVICE_KEY = "quantumledger";
const SERVICE_LABEL = "Quantum Ledger (catalog-only)";
const FIELD_LABEL = "Ledger Shard Count";

const catalogWithExtraService = {
  ...baseCatalog,
  services: {
    ...baseCatalog.services,
    // Shaped exactly like a real extracted service — copied from the fixture's
    // own entries rather than invented, so the test cannot pass on a shape the
    // extractor would never produce.
    [SERVICE_KEY]: {
      key: SERVICE_KEY,
      displayName: SERVICE_LABEL,
      description: "Exists only in the catalog, never in the static config.",
      category: "Database",
      fields: {
        enabled: {
          name: "enabled",
          path: `services.${SERVICE_KEY}.enabled`,
          tfVar: null,
          valueType: "boolean",
          type: "toggle",
          defaultValue: false,
          displayName: `Enable ${SERVICE_LABEL}`,
          sectionGated: true,
        },
        shardCount: {
          name: "shardCount",
          path: `services.${SERVICE_KEY}.shardCount`,
          tfVar: "quantumledger_shard_count",
          valueType: "number",
          type: "number",
          defaultValue: 3,
          displayName: FIELD_LABEL,
          description: "How many shards the ledger is split across.",
        },
      },
    },
  },
};

/** Boot the app with a catalog the checked-in fixture does not contain. */
async function gotoWizardWithCatalog(ctx, catalog) {
  await ctx.page.addInitScript((doc) => {
    window.__e2eCatalog = doc;
  }, catalog);
  await ctx.goto("/environments/create");
  await ctx.waitForLoadState("networkidle");
}

/** Step 1 needs a name before Continue is enabled. */
async function advanceToServicesStep(ctx) {
  await ctx.page.getByPlaceholder(/e\.g\., production/).fill("catalogonlytest");
  await ctx.page.getByRole("button", { name: /Continue/i }).click();
  await ctx.page.getByText(/\/ \d+ services/).waitFor({ timeout: 10000 });
}

describe("OP-208 runtime catalog drives the wizard", () => {
  test("the static config genuinely lacks the service this suite relies on", async () => {
    // Without this the whole suite could pass on the fallback path and mean
    // nothing. Reading the file is the point — an import would be hydrated.
    if (staticAws.includes(SERVICE_KEY)) {
      throw new Error(
        `aws.js now defines "${SERVICE_KEY}", so a catalog-only render can no ` +
          `longer be distinguished from the static config. Pick another key.`,
      );
    }
    if (baseCatalog.services[SERVICE_KEY]) {
      throw new Error(`catalog.json already contains "${SERVICE_KEY}".`);
    }
  });

  test("renders a service card that exists only in the catalog", async (ctx) => {
    await gotoWizardWithCatalog(ctx, catalogWithExtraService);
    await advanceToServicesStep(ctx);

    const card = ctx.page.getByRole("heading", { name: SERVICE_LABEL });
    expect(await card.isVisible({ timeout: 10000 })).toBe(true);
  });

  test("renders that service's catalog-only fields once enabled", async (ctx) => {
    await gotoWizardWithCatalog(ctx, catalogWithExtraService);
    await advanceToServicesStep(ctx);

    const heading = ctx.page.getByRole("heading", { name: SERVICE_LABEL });
    await heading.waitFor({ timeout: 10000 });

    // The nearest ancestor that actually holds the toggle. `filter({has})` picks
    // the *innermost* matching div, which here is a text-only wrapper with no
    // controls in it — measured, not assumed.
    const card = ctx.page.locator(
      `xpath=//h3[normalize-space()="${SERVICE_LABEL}"]/ancestor::div[.//input[@type="checkbox"]][1]`,
    );

    // The input is `sr-only`, so Playwright will not act on it. Click the label.
    await card.locator("label").first().click();

    // Two separate conditions gate the fields: `enabled` AND `expanded`. The
    // toggle only sets the first, so the card still has to be opened.
    const field = ctx.page.getByText(FIELD_LABEL, { exact: false }).first();
    await heading.click();
    expect(await field.isVisible({ timeout: 10000 })).toBe(true);
  });

  test("without the extra service the wizard does not invent it", async (ctx) => {
    // Negative control. Serving the unmodified fixture must NOT render the card,
    // otherwise the assertions above would pass for some unrelated reason.
    await gotoWizardWithCatalog(ctx, baseCatalog);
    await advanceToServicesStep(ctx);

    const card = ctx.page.getByRole("heading", { name: SERVICE_LABEL });
    expect(await card.isVisible({ timeout: 2000 }).catch(() => false)).toBe(
      false,
    );
  });
});

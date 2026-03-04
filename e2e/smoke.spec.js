/**
 * Smoke Tests - Basic Application Health Checks
 *
 * These tests verify the application loads and basic functionality works using playwright-core.
 *
 * Run headed (visible browser): HEADLESS=false npm run test:e2e
 * Run with auth via env vars:   KEYCLOAK_USERNAME=testuser KEYCLOAK_PASSWORD=password123 npm run test:e2e
 * Or use run.sh which sets all of the above.
 */

/**
 * Navigates to the app and handles Keycloak login if redirected.
 * Uses KEYCLOAK_USERNAME/PASSWORD env vars, falling back to default test credentials.
 */
async function navigateAndAuth(ctx, path = "/") {
  await ctx.goto(path);
  await ctx.waitForLoadState("networkidle");

  const usernameInput = ctx.page.getByRole("textbox", { name: /username or email/i });
  const onLoginPage = await usernameInput.isVisible({ timeout: 2000 }).catch(() => false);

  if (onLoginPage) {
    const username = process.env.KEYCLOAK_USERNAME || "testuser";
    const password = process.env.KEYCLOAK_PASSWORD || "password123";

    await usernameInput.fill(username);
    await ctx.page.getByRole("textbox", { name: /password/i }).fill(password);
    await ctx.page.getByRole("button", { name: /sign in/i }).click();
    await ctx.page.waitForLoadState("networkidle");
  }
}

describe("Application Smoke Tests", () => {
  test("should load the home page", async (ctx) => {
    await navigateAndAuth(ctx);

    // Verify page title
    const title = await ctx.title();
    expect(title).toContain("OpenPrime");

    // Verify main heading or logo is visible
    const heading = ctx.page.getByRole("heading", { level: 1 }).first();
    expect(await heading.isVisible()).toBe(true);
  });

  test("should display navigation elements", async (ctx) => {
    await navigateAndAuth(ctx);

    const nav = ctx.page.getByRole("navigation");
    expect(await nav.isVisible()).toBe(true);
  });

  test("should display create environment button", async (ctx) => {
    await navigateAndAuth(ctx);

    const createButton = ctx.page.getByRole("button", { name: /new environment/i });
    expect(await createButton.isVisible()).toBe(true);
    expect(await createButton.isEnabled()).toBe(true);
  });

  test("should open and close environment wizard", async (ctx) => {
    await navigateAndAuth(ctx);

    const createButton = ctx.page.getByRole("button", { name: /new environment/i });
    await createButton.click();
    await ctx.page.waitForTimeout(500);

    // Verify wizard modal opened
    const wizardHeading = ctx.page.getByText(/basic configuration/i).first();
    expect(await wizardHeading.isVisible()).toBe(true);

    // Close the wizard
    const closeButton = ctx.page
      .locator('button[aria-label="Close"]')
      .or(ctx.page.getByRole("button").filter({ hasText: /×|close/i }));
    if ((await closeButton.count()) > 0) {
      await closeButton.first().click();
    }

    await ctx.page.waitForTimeout(500);
  });

  test("should navigate through wizard steps", async (ctx) => {
    await navigateAndAuth(ctx);

    // Open wizard
    const createButton = ctx.page.getByRole("button", { name: /new environment/i });
    await createButton.click();
    await ctx.page.waitForTimeout(500);

    // Fill environment name
    const nameInput = ctx.page.getByPlaceholder(/production|staging|development/i);
    await nameInput.fill("smoke-test-env");

    // Fill global prefix
    const prefixInput = ctx.page.getByPlaceholder(/myapp-|prod-|company-/i);
    if ((await prefixInput.count()) > 0) {
      await prefixInput.fill("smoke");
      await ctx.page.waitForTimeout(200);
    }

    // Select region from the region dropdown
    const allSelects = await ctx.page.locator("select").all();
    for (const select of allSelects) {
      const options = await select.locator("option").allTextContents();
      if (options.some((opt) => opt.includes("EU (Ireland)") || opt.includes("US East"))) {
        await select.selectOption("eu-west-1");
        break;
      }
    }

    await ctx.page.waitForTimeout(300);

    // Proceed to next step
    const continueButton = ctx.page.getByRole("button", { name: /continue/i });
    const isDisabled = await continueButton.evaluate((btn) => btn.disabled);
    if (isDisabled) {
      throw new Error("Continue button is disabled — basic configuration validation failed");
    }

    await continueButton.click();
    await ctx.page.waitForTimeout(500);

    // Verify we advanced to the services step
    const servicesHeading = ctx.page.getByText(/services configuration/i).first();
    expect(await servicesHeading.isVisible()).toBe(true);
  });
});

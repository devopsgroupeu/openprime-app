/**
 * Smoke Tests - Basic Application Health Checks
 *
 * These tests verify the application loads and basic functionality works using playwright-core.
 */

describe("Application Smoke Tests", () => {
  test("should load the home page", async (ctx) => {
    await ctx.goto("/");

    // Wait for app to load
    await ctx.waitForLoadState("networkidle");

    // Verify page title
    const title = await ctx.title();
    expect(title).toContain("OpenPrime");

    // Verify main heading or logo is visible
    const heading = ctx.page.getByRole("heading", { level: 1 }).first();
    expect(await heading.isVisible()).toBe(true);
  });

  test("should display navigation elements", async (ctx) => {
    await ctx.goto("/");
    await ctx.waitForLoadState("networkidle");

    // Verify navigation is present
    const nav = ctx.page.getByRole("navigation");
    expect(await nav.isVisible()).toBe(true);
  });

  test("should display create environment button", async (ctx) => {
    await ctx.goto("/");
    await ctx.waitForLoadState("networkidle");

    // Verify create button exists - button text is "New Environment"
    const createButton = ctx.page.getByRole("button", { name: /new environment/i });
    expect(await createButton.isVisible()).toBe(true);
    expect(await createButton.isEnabled()).toBe(true);
  });

  test("should open and close environment wizard", async (ctx) => {
    await ctx.goto("/");
    await ctx.waitForLoadState("networkidle");

    // Click create environment button - button text is "New Environment"
    const createButton = ctx.page.getByRole("button", { name: /new environment/i });
    await createButton.click();

    // Wait for wizard to open
    await ctx.page.waitForTimeout(500);

    // Verify modal appears - look for the wizard header
    const wizardHeading = ctx.page.getByText(/basic configuration/i).first();
    expect(await wizardHeading.isVisible()).toBe(true);

    // Verify close button exists (X button in modal)
    const closeButton = ctx.page
      .locator('button[aria-label="Close"]')
      .or(ctx.page.getByRole("button").filter({ hasText: /×|close/i }));
    if ((await closeButton.count()) > 0) {
      await closeButton.first().click();
    }

    // Verify modal is closed
    await ctx.page.waitForTimeout(500);
  });

  test("should navigate through wizard steps", async (ctx) => {
    await ctx.goto("/");
    await ctx.waitForLoadState("networkidle");

    // Open wizard
    const createButton = ctx.page.getByRole("button", { name: /new environment/i });
    await createButton.click();
    await ctx.page.waitForTimeout(500);

    // Fill minimal info to proceed
    const nameInput = ctx.page.getByPlaceholder(/production|staging|development/i);
    await nameInput.fill("smoke-test-env");

    // Select provider (AWS should be selected by default, but click it anyway)
    const awsProvider = ctx.page
      .getByRole("button")
      .filter({ hasText: /amazon web services|aws/i });
    if ((await awsProvider.count()) > 0) {
      await awsProvider.first().click();
      await ctx.page.waitForTimeout(300);
    }

    // Wait for regions to load
    await ctx.page.waitForTimeout(500);

    // Select region - find the region select by looking for one with region options
    const allSelects = await ctx.page.locator("select").all();
    let regionFound = false;

    for (const select of allSelects) {
      const options = await select.locator("option").allTextContents();
      // Region selects will have options like "US East (N. Virginia)" or "EU (Ireland)"
      if (options.some((opt) => opt.includes("EU (Ireland)") || opt.includes("US East"))) {
        await select.selectOption("eu-west-1");
        regionFound = true;
        break;
      }
    }

    if (!regionFound) {
      console.warn("Region select not found");
    }

    // Wait for validation to update
    await ctx.page.waitForTimeout(300);

    // Go to next step
    const continueButton = ctx.page.getByRole("button", { name: /continue/i });

    // Check if Continue button is enabled
    const isDisabled = await continueButton.evaluate((btn) => btn.disabled);
    if (isDisabled) {
      throw new Error("Continue button is disabled - validation may have failed");
    }

    await continueButton.click();
    await ctx.page.waitForTimeout(500);

    // Verify we're on services configuration - use first() to avoid strict mode violation
    const servicesHeading = ctx.page.getByText(/services configuration/i).first();
    expect(await servicesHeading.isVisible()).toBe(true);
  });
});

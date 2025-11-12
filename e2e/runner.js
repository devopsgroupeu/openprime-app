/**
 * Custom Test Runner for Playwright Core
 *
 * This runner executes E2E tests using playwright-core without the @playwright/test framework.
 * It provides a simple test execution environment with browser automation.
 */

import { chromium, firefox, webkit } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdir } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
  browser: process.env.BROWSER || "chromium",
  headless: process.env.HEADLESS !== "false",
  timeout: 30000,
  // Keycloak auth configuration
  auth: {
    username: process.env.KEYCLOAK_USERNAME || "",
    password: process.env.KEYCLOAK_PASSWORD || "",
    enabled: process.env.KEYCLOAK_AUTH === "true" || !!process.env.KEYCLOAK_USERNAME,
  },
};

// Browser launcher map
const browsers = {
  chromium,
  firefox,
  webkit,
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

/**
 * Simple assertion helper
 */
class Expect {
  constructor(actual) {
    this.actual = actual;
  }

  toBeVisible() {
    if (!this.actual) {
      throw new Error("Element is not visible");
    }
  }

  toBeEnabled() {
    if (!this.actual) {
      throw new Error("Element is not enabled");
    }
  }

  toHaveText(expected) {
    if (
      typeof this.actual !== "string" ||
      !this.actual.toLowerCase().includes(expected.toLowerCase())
    ) {
      throw new Error(`Expected text to include "${expected}", but got "${this.actual}"`);
    }
  }

  async toHaveTitle(pattern) {
    const matches =
      pattern instanceof RegExp ? pattern.test(this.actual) : this.actual.includes(pattern);
    if (!matches) {
      throw new Error(`Expected title to match "${pattern}", but got "${this.actual}"`);
    }
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${expected}, but got ${this.actual}`);
    }
  }

  toContain(expected) {
    if (!this.actual || !this.actual.includes(expected)) {
      throw new Error(`Expected to contain "${expected}", but got "${this.actual}"`);
    }
  }
}

function expect(actual) {
  return new Expect(actual);
}

/**
 * Test context
 */
class TestContext {
  constructor(browser, context, page) {
    this.browser = browser;
    this.context = context;
    this.page = page;
  }

  async goto(path) {
    const url = path.startsWith("http") ? path : `${config.baseURL}${path}`;
    await this.page.goto(url, { waitUntil: "networkidle", timeout: config.timeout });
  }

  getByRole(role, options = {}) {
    return this.page.getByRole(role, options);
  }

  getByText(text) {
    return this.page.getByText(text);
  }

  getByLabel(label) {
    return this.page.getByLabel(label);
  }

  getByTestId(testId) {
    return this.page.getByTestId(testId);
  }

  async waitForLoadState(state = "load") {
    await this.page.waitForLoadState(state);
  }

  async title() {
    return await this.page.title();
  }
}

/**
 * Perform Keycloak authentication
 */
async function authenticateWithKeycloak(page) {
  if (!config.auth.enabled) {
    return;
  }

  console.log("  🔐 Authenticating with Keycloak...");

  try {
    // Navigate to the app, which should redirect to Keycloak
    await page.goto(config.baseURL, { waitUntil: "networkidle", timeout: config.timeout });

    // Check if we're on Keycloak login page
    const isKeycloakPage =
      page.url().includes("auth") ||
      page.url().includes("realms") ||
      (await page.locator('input[name="username"]').count()) > 0;

    if (!isKeycloakPage) {
      console.log("  ✓ Already authenticated or no auth required");
      return;
    }

    // Fill in username
    const usernameInput = page.locator('input[name="username"]').or(page.locator("#username"));
    await usernameInput.waitFor({ state: "visible", timeout: 5000 });
    await usernameInput.fill(config.auth.username);

    // Fill in password
    const passwordInput = page.locator('input[name="password"]').or(page.locator("#password"));
    await passwordInput.fill(config.auth.password);

    // Click submit button
    const submitButton = page
      .locator('input[type="submit"]')
      .or(page.locator('button[type="submit"]'))
      .or(page.getByRole("button", { name: /sign in|log in|submit/i }));

    await submitButton.click();

    // Wait for redirect back to the app
    await page.waitForURL((url) => url.toString().includes(config.baseURL), {
      timeout: 10000,
    });

    // Wait for the app to fully load
    await page.waitForLoadState("networkidle");

    console.log("  ✓ Authentication successful");
  } catch (error) {
    console.error("  ✗ Authentication failed:", error.message);
    throw new Error(`Keycloak authentication failed: ${error.message}`);
  }
}

/**
 * Test suite definition
 */
const tests = [];
let currentSuite = null;

function describe(name, fn) {
  const suite = { name, tests: [], beforeEach: null };
  const previousSuite = currentSuite;
  currentSuite = suite;
  fn();
  currentSuite = previousSuite;
  tests.push(suite);
}

function test(name, fn) {
  if (currentSuite) {
    currentSuite.tests.push({ name, fn });
  } else {
    tests.push({ name, tests: [{ name, fn }], beforeEach: null });
  }
}

test.beforeEach = function (fn) {
  if (currentSuite) {
    currentSuite.beforeEach = fn;
  }
};

test.step = async function (name, fn) {
  console.log(`    ↳ ${name}`);
  await fn();
};

/**
 * Run a single test
 */
async function runTest(testDef, ctx) {
  totalTests++;
  const startTime = Date.now();

  try {
    await testDef.fn(ctx);
    passedTests++;
    const duration = Date.now() - startTime;
    console.log(`  ✓ ${testDef.name} (${duration}ms)`);
    return true;
  } catch (error) {
    failedTests++;
    const duration = Date.now() - startTime;
    console.log(`  ✗ ${testDef.name} (${duration}ms)`);
    failures.push({
      test: testDef.name,
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests(testFiles) {
  console.log(`\nRunning tests with ${config.browser} browser...\n`);

  if (config.auth.enabled) {
    console.log(`Authentication enabled for user: ${config.auth.username}\n`);
  }

  const browserType = browsers[config.browser];
  const browser = await browserType.launch({ headless: config.headless });

  // Shared authenticated context (reuse authentication across tests)
  let sharedContext = null;

  for (const testFile of testFiles) {
    console.log(`\nFile: ${testFile}`);

    // Import the test file
    await import(testFile);

    // Run each test suite
    for (const suite of tests) {
      console.log(`\n${suite.name}`);

      for (const testDef of suite.tests) {
        // Create new context and page for each test
        const context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
        });
        const page = await context.newPage();

        // Authenticate if enabled (only on first test)
        if (config.auth.enabled && !sharedContext) {
          await authenticateWithKeycloak(page);
          sharedContext = context; // Mark that we've authenticated
        } else if (config.auth.enabled && sharedContext) {
          // Reuse cookies from authenticated session
          const cookies = await sharedContext.cookies();
          await context.addCookies(cookies);
        }

        const ctx = new TestContext(browser, context, page);

        // Run beforeEach if defined
        if (suite.beforeEach) {
          await suite.beforeEach(ctx);
        }

        // Run the test
        await runTest(testDef, ctx);

        // Cleanup
        await page.close();
        if (context !== sharedContext) {
          await context.close();
        }
      }
    }

    // Clear tests for next file
    tests.length = 0;
  }

  // Close shared context if it exists
  if (sharedContext) {
    await sharedContext.close();
  }

  await browser.close();
}

/**
 * Print test results
 */
function printResults() {
  console.log("\n" + "=".repeat(50));
  console.log(`\nTest Results:`);
  console.log(`  Total:  ${totalTests}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);

  if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.test}`);
      console.log(`   ${failure.error}`);
      if (process.env.VERBOSE) {
        console.log(`   ${failure.stack}`);
      }
    });
  }

  console.log("\n" + "=".repeat(50) + "\n");
}

/**
 * Main execution
 */
async function main() {
  try {
    // Find all test files
    const files = await readdir(__dirname);
    const testFiles = files
      .filter((file) => file.endsWith(".spec.js"))
      .map((file) => join(__dirname, file));

    if (testFiles.length === 0) {
      console.log("No test files found");
      process.exit(0);
    }

    // Make test helpers globally available
    global.describe = describe;
    global.test = test;
    global.expect = expect;

    // Run tests
    await runTests(testFiles);

    // Print results
    printResults();

    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();

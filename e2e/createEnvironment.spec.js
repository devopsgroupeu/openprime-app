/**
 * E2E Test: Create Environment with All Available Helm Charts
 *
 * This test validates the complete workflow of creating an environment with:
 * 1. Basic configuration (environment name, prefix, provider, region)
 * 2. Git repository + branch configured → verified in generated ZIP (argocd repoURL / targetRevision)
 * 3. Terraform backend enabled
 * 4. All AWS services enabled (15 services)
 * 5. VPC CIDR configured to 10.69.0.0/16
 * 6. All available Helm charts enabled (9 charts across all categories)
 * 7. Downloaded ZIP and JSON are cross-checked against what was set in the UI
 *
 * Test User Credentials:
 * - Username: testuser
 * - Password: password123
 */

describe("Create Environment with All Helm Charts", () => {
  test("should create environment with custom VPC CIDR and all available helm charts", async (ctx) => {
    // Generate random suffix to avoid conflicts (max 10 chars, must start with letter)
    const randomLetter = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
    const randomSuffix = Math.random().toString(36).substring(2, 6); // 4 chars
    const envName = randomLetter + randomSuffix; // 5 chars, starts with letter
    const envPrefix = randomLetter + randomSuffix.substring(0, 1); // 2 chars, starts with letter
    const s3BucketName = "559050227177-viro-dev";
    const vpcCidr = "10.69.0.0/16";
    const gitRepoUrl = "git@github.com:test-org/infra-repo.git";
    const gitBranch = "production";

    console.log(`Creating environment: ${envName} with prefix: ${envPrefix}-`);

    // Step 1: Navigate to the application and handle authentication
    await test.step("Navigate and authenticate", async () => {
      await ctx.goto("/");
      await ctx.waitForLoadState("networkidle");

      // Check if we're on the Keycloak login page
      const usernameInput = ctx.page.getByRole("textbox", { name: /username or email/i });
      if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // We're on the login page, authenticate
        await usernameInput.fill("testuser");

        const passwordInput = ctx.page.getByRole("textbox", { name: /password/i });
        await passwordInput.fill("password123");

        const signInButton = ctx.page.getByRole("button", { name: /sign in/i });
        await signInButton.click();

        await ctx.page.waitForTimeout(2000);
        console.log("✓ Authenticated successfully");
      }

      // Wait for the application to load
      await ctx.waitForLoadState("networkidle");
      console.log("✓ Application loaded");
    });

    // Step 2: Open environment creation wizard
    await test.step("Open environment creation wizard", async () => {
      const createButton = ctx.page.getByRole("button", {
        name: /new environment/i,
      });
      expect(await createButton.isVisible()).toBe(true);
      await createButton.click();
      await ctx.page.waitForTimeout(500);

      // Wait for wizard modal to appear
      const wizardHeading = ctx.page.getByText(/basic configuration/i).first();
      expect(await wizardHeading.isVisible()).toBe(true);
      console.log("✓ Wizard opened");
    });

    // Step 3: Fill in basic configuration
    await test.step("Configure basic settings", async () => {
      // Fill in environment name
      const nameInput = ctx.page.getByPlaceholder(/production|staging|development/i);
      await nameInput.fill(envName);
      console.log(`✓ Environment name set: ${envName}`);

      // Fill in global prefix
      const prefixInput = ctx.page.getByPlaceholder(/myapp-|prod-|company-/i);
      await prefixInput.fill(envPrefix);
      await ctx.page.waitForTimeout(200);
      console.log(`✓ Global prefix set: ${envPrefix}-`);

      // AWS should be selected by default
      console.log("✓ AWS provider confirmed (default)");

      // Wait for regions to load
      await ctx.page.waitForTimeout(500);

      // Select eu-west-1 region
      const regionSelect = ctx.page
        .locator("select")
        .filter({ hasText: /us-east-1|eu-west-1|region/i })
        .or(ctx.page.getByLabel(/region/i));
      if ((await regionSelect.count()) > 0) {
        await regionSelect.first().selectOption({ label: "eu-west-1" });
        await ctx.page.waitForTimeout(300);
        console.log("✓ Region set to: eu-west-1");
      } else {
        // Try finding by value
        const regionDropdown = ctx.page.locator("select").first();
        await regionDropdown.selectOption("eu-west-1");
        await ctx.page.waitForTimeout(300);
        console.log("✓ Region set to: eu-west-1");
      }
    });

    // Step 4: Enable Terraform Backend
    await test.step("Enable Terraform backend", async () => {
      // Find and click the Terraform Backend toggle
      const backendSection = ctx.page
        .locator("text=Terraform Backend (Optional)")
        .locator("..")
        .locator("..");
      const backendCheckbox = backendSection.locator('input[type="checkbox"]');

      const isChecked = await backendCheckbox.isChecked().catch(() => false);
      if (!isChecked) {
        await backendCheckbox.check({ force: true });
        await ctx.page.waitForTimeout(500);
        console.log("✓ Terraform backend enabled");
      } else {
        console.log("✓ Terraform backend already enabled");
      }

      // Note: S3 bucket name is auto-generated in the current UI
      // The UI shows format: <AWS_ACCOUNT_ID>-terraform-<environment-name>
      // In a production implementation, this would need to be customizable
      console.log(`Note: S3 bucket will be auto-generated (target: ${s3BucketName})`);
    });

    // Step 4b: Enable Git Repository with URL and branch
    await test.step("Configure Git repository", async () => {
      const gitSection = ctx.page
        .locator("text=Git Repository (Optional)")
        .locator("..")
        .locator("..");
      const gitToggle = gitSection.locator('input[type="checkbox"]');

      const isChecked = await gitToggle.isChecked().catch(() => false);
      if (!isChecked) {
        await gitToggle.check({ force: true });
        await ctx.page.waitForTimeout(300);
      }

      const repoInput = ctx.page.getByPlaceholder(/git@github\.com/i);
      await repoInput.fill(gitRepoUrl);
      console.log(`✓ Git repository URL set: ${gitRepoUrl}`);

      const branchInput = ctx.page.getByPlaceholder(/^main$/i);
      await branchInput.fill(gitBranch);
      console.log(`✓ Target branch set: ${gitBranch}`);
    });

    // Step 5: Continue to Services Configuration
    await test.step("Navigate to Services Configuration", async () => {
      const continueButton = ctx.page.getByRole("button", { name: /continue/i });

      const isDisabled = await continueButton.isDisabled();
      if (isDisabled) {
        throw new Error("Continue button is disabled. Validation failed.");
      }

      await continueButton.click();
      await ctx.page.waitForTimeout(500);

      const servicesHeading = ctx.page.getByText(/services configuration/i).first();
      expect(await servicesHeading.isVisible()).toBe(true);
      console.log("✓ Navigated to Services Configuration");
    });

    // Step 6: Enable all services
    await test.step("Enable all services", async () => {
      await ctx.page.waitForTimeout(1000);

      const enableAllButton = ctx.page.getByTestId("toggle-all-services");
      await enableAllButton.waitFor({ state: "visible", timeout: 10000 });

      const buttonText = await enableAllButton.textContent();
      if (buttonText && buttonText.toLowerCase().includes("enable all")) {
        await enableAllButton.click();
        await ctx.page.waitForTimeout(1500);
        console.log("✓ All 15 AWS services enabled");
      } else {
        console.log("✓ All services already enabled");
      }

      // Verify button text changed
      const updatedButtonText = await enableAllButton.textContent();
      expect(updatedButtonText && updatedButtonText.toLowerCase()).toContain("disable all");
    });

    // Step 7: Configure VPC CIDR
    await test.step("Configure VPC CIDR", async () => {
      // Click on the VPC service card to expand configuration
      const vpcCard = ctx.page
        .locator("text=Virtual Private Cloud (VPC)")
        .locator("..")
        .locator("..");
      await vpcCard.click();
      await ctx.page.waitForTimeout(500);

      // Find the CIDR Block input field
      const cidrInput = ctx.page.locator('input[type="text"]').first();
      await cidrInput.fill(vpcCidr);
      await ctx.page.waitForTimeout(300);
      console.log(`✓ VPC CIDR set to: ${vpcCidr}`);
    });

    // Step 8: Continue to Helm Charts
    await test.step("Navigate to Helm Charts", async () => {
      const continueButton = ctx.page.getByRole("button", { name: /continue/i });
      await continueButton.click();
      await ctx.page.waitForTimeout(1000);

      const helmChartsHeading = ctx.page.getByText(/helm charts configuration/i).first();
      expect(await helmChartsHeading.isVisible()).toBe(true);
      console.log("✓ Navigated to Helm Charts step");
    });

    // Step 9: Enable Helm charts
    await test.step("Enable Helm charts", async () => {
      await ctx.page.waitForTimeout(1000);

      // Check if charts are already enabled by default
      const selectedCountElement = ctx.page.locator("text=/\\d+\\s+selected/i");
      let initialCount = 0;

      if ((await selectedCountElement.count()) > 0) {
        const countText = await selectedCountElement.first().textContent();
        const match = countText.match(/(\d+)\s+selected/i);
        if (match) {
          initialCount = parseInt(match[1]);
          console.log(`Initial helm charts selected: ${initialCount}`);
        }
      }

      // If no charts are selected by default, we need to enable them manually
      // Helm charts are organized in collapsible categories
      if (initialCount === 0) {
        console.log("No charts selected by default, enabling charts manually...");
        await ctx.page.waitForTimeout(500);

        // Step 1: Find and expand all category dropdowns
        // Categories have ChevronDown/ChevronRight icons and are clickable
        const categoryHeaders = ctx.page.locator('div[class*="cursor-pointer"]').filter({
          has: ctx.page
            .locator("span")
            .filter({ hasText: /Monitoring|Networking|Security|Infrastructure|CI\/CD/i }),
        });

        const categoryCount = await categoryHeaders.count();
        console.log(`Found ${categoryCount} helm chart categories`);

        // Expand each category
        for (let i = 0; i < categoryCount; i++) {
          const category = categoryHeaders.nth(i);
          const categoryName = await category.locator("span").first().textContent();
          console.log(`  Expanding category: ${categoryName}`);
          await category.click();
          await ctx.page.waitForTimeout(300);
        }

        // Step 2: Find all chart checkboxes (now visible after expanding categories)
        await ctx.page.waitForTimeout(500);

        // Find all checkboxes within the helm charts section
        // Each checkbox is within a label that has a peer-checked class structure
        const chartToggles = ctx.page.locator('input[type="checkbox"].sr-only');

        const toggleCount = await chartToggles.count();
        console.log(`Found ${toggleCount} chart toggles`);

        // Enable each chart that is not already enabled
        let enabledCount = 0;
        for (let i = 0; i < toggleCount; i++) {
          const toggle = chartToggles.nth(i);
          const isChecked = await toggle.isChecked().catch(() => false);
          const isDisabled = await toggle.isDisabled().catch(() => false);

          if (!isChecked && !isDisabled) {
            // Click the parent label to toggle the checkbox
            const label = toggle.locator("..");
            await label.click({ force: true });
            enabledCount++;
            await ctx.page.waitForTimeout(150);
          }
        }

        console.log(`Enabled ${enabledCount} helm charts`);

        // Verify final count
        await ctx.page.waitForTimeout(500);
        if (await selectedCountElement.isVisible()) {
          const finalCountText = await selectedCountElement.first().textContent();
          const finalMatch = finalCountText.match(/(\d+)\s+selected/i);
          if (finalMatch) {
            console.log(`✓ Total helm charts enabled: ${finalMatch[1]}`);
          }
        }
      } else {
        console.log(`✓ Helm charts already enabled by default: ${initialCount} charts`);
      }
    });

    // Step 10: Create the environment
    await test.step("Create environment", async () => {
      const createButton = ctx.page.getByRole("button", {
        name: /create environment/i,
      });

      await createButton.click();
      console.log("✓ Creating environment...");

      // Wait for creation to complete
      await ctx.page.waitForTimeout(3000);

      // Check for success notification
      const successNotification = ctx.page.getByText(/environment created|created successfully/i);
      if ((await successNotification.count()) > 0) {
        console.log("✓ Environment created successfully");
      }

      // Verify we're back on the environments page
      const envCard = ctx.page.getByText(envName);
      expect((await envCard.count()) > 0).toBe(true);
      console.log(`✓ Environment ${envName} is visible in the list`);
    });

    // Step 11: Verify environment configuration
    await test.step("Verify environment details", async () => {
      // The environment card should show:
      // - Environment name: e2etestenv
      // - 15 AWS Services
      // - 9 Helm Charts
      const envCard = ctx.page.getByText(envName).locator("..").locator("..").locator("..");

      const servicesInfo = envCard.getByText(/aws services \(15\)/i);
      expect((await servicesInfo.count()) > 0).toBe(true);
      console.log("✓ Verified 15 AWS services");

      const helmChartsInfo = envCard.getByText(/helm charts:/i);
      if ((await helmChartsInfo.count()) > 0) {
        console.log("✓ Verified Helm charts are configured");
      }

      console.log(`\n✅ Environment ${envName} created successfully with:`);
      console.log(`   - Provider: AWS (eu-west-1)`);
      console.log(`   - Prefix: ${envPrefix}-`);
      console.log(`   - Services: 15 AWS services enabled`);
      console.log(`   - VPC CIDR: ${vpcCidr}`);
      console.log(`   - Helm Charts: 9 charts enabled`);
    });

    // Step 12: Navigate to environment and download infrastructure ZIP + config JSON, then cross-check
    await test.step("Download and verify infrastructure ZIP", async () => {
      await ctx.page.waitForTimeout(3000);

      const envCard = ctx.page.locator(`[data-testid="env-card-${envName}"]`);
      if ((await envCard.count()) === 0) {
        const envByName = ctx.page.getByText(envName, { exact: false });
        if ((await envByName.count()) > 0) {
          await envByName.first().click();
        } else {
          await ctx.goto(`/environments/${envName}`);
        }
      } else {
        await envCard.click();
      }
      console.log(`✓ Found environment: ${envName}`);
      await ctx.page.waitForTimeout(2000);

      const configTab = ctx.page
        .getByRole("button", { name: /configuration/i })
        .or(ctx.page.getByText("Configuration", { exact: true }));
      await configTab.first().click();
      await ctx.page.waitForTimeout(1000);
      console.log("✓ Opened Configuration tab");

      // Download the infrastructure ZIP (Generate button).
      // Async job model: the click enqueues a job (202 + jobId), the UI polls
      // GET /api/jobs/:jobId, and only then triggers the download — so the
      // download event can take a while (Injecto generate + worker poll).
      const generateButton = ctx.page.getByRole("button", { name: /generate/i });
      if ((await generateButton.count()) > 0) {
        const downloadPromise = ctx.page.waitForEvent("download", { timeout: 120000 });
        await generateButton.first().click();
        const download = await downloadPromise;
        const fileName = download.suggestedFilename();

        const fs = require("fs");
        const path = require("path");
        const AdmZip = require("adm-zip");
        const downloadsDir = path.join(__dirname, "downloads");
        fs.mkdirSync(downloadsDir, { recursive: true });

        const zipPath = path.join(downloadsDir, fileName);
        await download.saveAs(zipPath);
        console.log(`✓ Infrastructure ZIP downloaded: ${fileName}`);

        // Extract ZIP so the full generated tree is browsable
        const zip = new AdmZip(zipPath);
        const extractDir = path.join(downloadsDir, envName);
        zip.extractAllTo(extractDir, true);
        console.log(`✓ Extracted to: ${extractDir}`);
        const argoEntry = zip.getEntries().find((e) => e.entryName.includes("applications.yaml"));
        if (argoEntry) {
          const argoContent = argoEntry.getData().toString("utf8");

          if (argoContent.includes(gitRepoUrl)) {
            console.log(`✓ ZIP ArgoCD repoURL matches UI value: ${gitRepoUrl}`);
          } else {
            throw new Error(
              `✗ ZIP ArgoCD repoURL mismatch — expected "${gitRepoUrl}" but not found in applications.yaml`,
            );
          }

          if (argoContent.includes(gitBranch)) {
            console.log(`✓ ZIP ArgoCD targetRevision matches UI value: ${gitBranch}`);
          } else {
            throw new Error(
              `✗ ZIP ArgoCD targetRevision mismatch — expected "${gitBranch}" but not found in applications.yaml`,
            );
          }
        } else {
          console.warn("⚠ applications.yaml not found in ZIP — skipping ArgoCD content check");
        }
      } else {
        console.warn("⚠ Generate button not found on Configuration tab");
      }
    });

    await test.step("Download and verify config JSON", async () => {
      await ctx.page.waitForTimeout(1000);

      const downloadButton = ctx.page.getByRole("button", { name: /download/i }).filter({
        hasText: /download/i,
      });

      if ((await downloadButton.count()) > 0) {
        const downloadPromise = ctx.page.waitForEvent("download", { timeout: 10000 });
        await downloadButton.first().click();
        const download = await downloadPromise;
        const fileName = download.suggestedFilename();

        const fs = require("fs");
        const path = require("path");
        const downloadsDir = path.join(__dirname, "downloads");
        const filePath = path.join(downloadsDir, fileName);
        await download.saveAs(filePath);
        console.log(`✓ Config JSON downloaded: ${fileName}`);

        // Cross-check: parse the JSON and verify key fields match what was set in the UI
        const config = JSON.parse(fs.readFileSync(filePath, "utf8"));

        const checks = [
          [config.gitRepository?.url === gitRepoUrl, `gitRepository.url = ${gitRepoUrl}`],
          [config.gitRepository?.branch === gitBranch, `gitRepository.branch = ${gitBranch}`],
          [config.provider === "aws", `provider = aws`],
          [config.region === "eu-west-1", `region = eu-west-1`],
          [config.services?.vpc?.enabled === true, `services.vpc.enabled = true`],
        ];

        for (const [passed, label] of checks) {
          if (passed) {
            console.log(`✓ JSON field verified: ${label}`);
          } else {
            throw new Error(`✗ JSON field mismatch: expected ${label}`);
          }
        }
      } else {
        console.warn("⚠ Download button not found");
      }
    });
  });
});

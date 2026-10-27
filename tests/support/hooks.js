import { After, Before, Status } from "@cucumber/cucumber";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { ApiClient } from "../helpers/api-client.js";
import { DashboardPage } from "../pages/DashboardPage.js";
import { ReportPage } from "../pages/ReportPage.js";
import { getAppBaseUrl, getBrowserLaunchOptions } from "./config.js";

async function startBrowserScenario(world) {
  world.browser = await chromium.launch(getBrowserLaunchOptions());
  world.context = await world.browser.newContext();
  world.page = await world.context.newPage();
  world.dashboardPage = new DashboardPage(world.page);
  world.reportPage = new ReportPage(world.page);
}

Before({ tags: "@ui" }, async function () {
  await startBrowserScenario(this);
});

Before({ tags: "@broken-locator" }, async function () {
  await startBrowserScenario(this);
});

Before({ tags: "@api" }, async function () {
  this.apiClient = new ApiClient();
  await this.apiClient.initialize();
});

Before({ tags: "@api-local" }, async function () {
  this.apiClient = new ApiClient({ baseURL: getAppBaseUrl() });
  await this.apiClient.initialize();
});

After(async function ({ pickle, result }) {
  try {
    const usesBrowser = pickle.tags.some(({ name }) => name === "@ui" || name === "@broken-locator");
    if (usesBrowser && result?.status === Status.FAILED && this.page) {
      const screenshotDirectory = resolve(process.cwd(), "reports", "screenshots");
      const scenarioName = slugify(pickle.name);
      const screenshotPath = resolve(screenshotDirectory, `${scenarioName}-${randomUUID()}.png`);

      try {
        await mkdir(screenshotDirectory, { recursive: true });
        const screenshot = await this.page.screenshot({ path: screenshotPath, fullPage: true });
        await this.attach(screenshot, "image/png");
      } catch (error) {
        this.log(`Could not capture the failure screenshot: ${error.message}`);
      }
    }
  } finally {
    await this.apiClient?.dispose();
    await this.context?.close();
    await this.browser?.close();
  }
});

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario";
}

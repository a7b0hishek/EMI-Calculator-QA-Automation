import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";

const exerciseExamples = {
  "dashboard heading": {
    brokenSelector: ".hero-title",
    intendedElement: "dashboard h1#page-title",
    createRobustLocator({ page, dashboardPage }) {
      return dashboardPage.heading;
    },
    async verifyTarget(locator) {
      assert.equal(await locator.evaluate((element) => element.tagName), "H1");
      const heading = (await locator.innerText()).replace(/\s+/g, " ").trim();
      assert.match(heading, /Know your EMI\. Own your next move\./);
    }
  },
  "loan amount input": {
    brokenSelector: "#loanAmount",
    intendedElement: "numeric input#loan-amount",
    createRobustLocator({ dashboardPage }) {
      return dashboardPage.loanAmountInput;
    },
    async verifyTarget(locator) {
      assert.equal(await locator.getAttribute("id"), "loan-amount");
      assert.equal(await locator.getAttribute("type"), "number");
    }
  },
  "calculate button": {
    brokenSelector: "button.submit-loan",
    intendedElement: "submit button[data-testid=calculate-emi]",
    createRobustLocator({ dashboardPage }) {
      return dashboardPage.calculateButton;
    },
    async verifyTarget(locator) {
      assert.equal(await locator.getAttribute("data-testid"), "calculate-emi");
      assert.equal(await locator.getAttribute("type"), "submit");
      assert.match((await locator.innerText()).replace(/\s+/g, " ").trim(), /^Calculate EMI/);
    }
  },
  "repayment chart": {
    brokenSelector: "#emi-chart",
    intendedElement: "chart canvas#repayment-chart with role=img",
    createRobustLocator({ page }) {
      return page.getByTestId("chart-container").getByRole("img", {
        name: /No chart data\. Calculate a valid loan to view principal and interest\./
      });
    },
    async verifyTarget(locator) {
      assert.equal(await locator.evaluate((element) => element.tagName), "CANVAS");
      assert.equal(await locator.getAttribute("id"), "repayment-chart");
      assert.match(await locator.getAttribute("aria-label"), /^No chart data\./);
    }
  }
};

Given("the loan dashboard is open for the locator exercise", async function () {
  await this.dashboardPage.goto();
  await this.dashboardPage.waitForDashboard();
});

When("I inspect the intentionally broken locator for {string}", async function (exampleName) {
  const example = exerciseExamples[exampleName];
  assert.ok(example, `Unknown broken-locator example: ${exampleName}`);

  const robustLocator = example.createRobustLocator(this);
  const robustCount = await robustLocator.count();
  assert.equal(robustCount, 1, `Robust candidate for ${exampleName} must resolve exactly once`);
  assert.equal(await robustLocator.isVisible(), true, `Robust candidate for ${exampleName} must be visible`);
  await example.verifyTarget(robustLocator);

  const targetHtml = await robustLocator.evaluate((element) => element.outerHTML);
  const brokenLocator = this.page.locator(example.brokenSelector);
  const brokenCount = await brokenLocator.count();

  this.locatorExercise = { exampleName, brokenSelector: example.brokenSelector, brokenCount };
  await this.attach(JSON.stringify({
    exercise: exampleName,
    intentionallyBrokenLocator: example.brokenSelector,
    brokenLocatorMatches: brokenCount,
    intendedElement: example.intendedElement,
    robustCandidateValidated: true,
    robustCandidateMatches: robustCount,
    intendedElementHtml: targetHtml
  }, null, 2), "application/json");
  this.log(`${exampleName}: broken selector matched ${brokenCount}; robust candidate uniquely matched the real target.`);
});

Then("the intentionally broken locator for {string} resolves to exactly one element", function (exampleName) {
  assert.equal(this.locatorExercise?.exampleName, exampleName, "The matching locator evidence must be collected first");
  assert.equal(
    this.locatorExercise.brokenCount,
    1,
    `Intentional locator ${this.locatorExercise.brokenSelector} matched ${this.locatorExercise.brokenCount} elements; expected one target`
  );
});

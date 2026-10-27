import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { calculateExpectedEmi, isWithinMoneyTolerance, roundCurrency } from "../helpers/emi-oracle.js";

Given("the loan dashboard is open", async function () {
  await this.dashboardPage.goto();
  await this.dashboardPage.waitForDashboard();
});

When("I calculate a loan of {int} INR at {float}% for {int} year(s)", async function (principal, annualRate, tenureYears) {
  this.loanInputs = { principal, annualRate, tenureYears };
  await this.dashboardPage.fillLoanDetails(this.loanInputs);
  await this.dashboardPage.calculate();
});

When("I clear the loan amount and calculate again", async function () {
  await this.dashboardPage.clearLoanAmount();
  await this.dashboardPage.calculate();
});

Then("the dashboard heading and loan controls are visible", async function () {
  await this.dashboardPage.heading.waitFor({ state: "visible" });
  for (const control of [
    this.dashboardPage.loanAmountInput,
    this.dashboardPage.annualRateInput,
    this.dashboardPage.tenureInput,
    this.dashboardPage.calculateButton
  ]) {
    await control.waitFor({ state: "visible" });
  }
});

Then("the displayed loan figures match the independent calculation", async function () {
  const expected = calculateExpectedEmi(this.loanInputs);
  const displayed = await this.dashboardPage.getDisplayedResults();
  assertMoneyText(displayed.emi, expected.emi, "monthly EMI");
  assertMoneyText(displayed.principal, expected.principal, "principal");
  assertMoneyText(displayed.interest, expected.totalInterest, "total interest");
  assertMoneyText(displayed.totalPayment, expected.totalPayment, "total payment");
});

Then("the chart is visible and its principal and interest values are positive", async function () {
  const expected = calculateExpectedEmi(this.loanInputs);
  assert.ok(expected.rounded.principal > 0, "Expected principal should be positive");
  assert.ok(expected.rounded.totalInterest > 0, "Expected total interest should be positive");

  await this.dashboardPage.chartCanvas.waitFor({ state: "visible" });
  const summary = await this.dashboardPage.getChartSummary();
  assert.ok(summary.includes(formatInr(expected.rounded.principal)), "Chart summary should show the current principal");
  assert.ok(summary.includes(formatInr(expected.rounded.totalInterest)), "Chart summary should show the current interest");
});

Then("validation feedback is shown and stale results are cleared", async function () {
  await this.dashboardPage.validationMessage.waitFor({ state: "visible" });
  const displayed = await this.dashboardPage.getDisplayedResults();
  assert.deepEqual(displayed, { emi: "—", principal: "—", interest: "—", totalPayment: "—" });
  assert.equal(await this.dashboardPage.getChartSummary(), "Correct the highlighted loan details and calculate again.");
  assert.equal(await this.dashboardPage.isChartPlaceholderVisible(), true);
  assert.equal(await this.dashboardPage.reportLink.getAttribute("aria-disabled"), "true");
});

function formatInr(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function assertMoneyText(actualText, expectedAmount, label) {
  const actualAmount = Number(actualText.replace(/[^\d.-]/g, ""));
  assert.ok(Number.isFinite(actualAmount), `${label} should be displayed as an INR amount: ${actualText}`);
  assert.ok(
    isWithinMoneyTolerance(actualAmount, expectedAmount),
    `${label} ${actualAmount} should be within INR 0.01 of expected ${expectedAmount}`
  );
  assert.equal(actualText, formatInr(roundCurrency(expectedAmount)), `${label} should use the documented INR display rounding`);
}

import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { calculateExpectedEmi, isWithinMoneyTolerance, roundCurrency } from "../helpers/emi-oracle.js";

When("I open repayment details", async function () {
  await this.dashboardPage.openReport();
  await this.reportPage.waitForReport();
});

When("I return to the calculator from the report", async function () {
  await this.reportPage.returnToCalculator();
  await this.dashboardPage.waitForDashboard();
});

Given("the report is opened without loan query parameters", async function () {
  await this.reportPage.goto();
  await this.reportPage.waitForError();
});

Given("the report is opened with invalid loan parameters", async function () {
  await this.reportPage.goto({ principal: 0, annualRate: 8.5, tenureYears: 20 });
  await this.reportPage.waitForError();
});

Then("the report shows the submitted loan inputs and independent calculation", async function () {
  const expected = calculateExpectedEmi(this.loanInputs);
  const displayed = await this.reportPage.getDisplayedDetails();
  assertMoneyText(displayed.emi, expected.emi, "monthly EMI");
  assertMoneyText(displayed.principal, expected.principal, "principal");
  assert.equal(displayed.annualRate, `${this.loanInputs.annualRate}% per year`);
  assert.equal(displayed.tenure, `${this.loanInputs.tenureYears} ${this.loanInputs.tenureYears === 1 ? "year" : "years"}`);
  assertMoneyText(displayed.totalPrincipal, expected.principal, "total principal");
  assertMoneyText(displayed.totalInterest, expected.totalInterest, "total interest");
  assertMoneyText(displayed.totalPayment, expected.totalPayment, "total payment");
});

Then("the loan dashboard is visible again", async function () {
  await this.dashboardPage.heading.waitFor({ state: "visible" });
  await this.dashboardPage.loanForm.waitFor({ state: "visible" });
});

Then("the report shows a clear error instead of calculated results", async function () {
  await this.reportPage.errorMessage.waitFor({ state: "visible" });
  assert.equal(await this.reportPage.reportCard.isVisible(), false);
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

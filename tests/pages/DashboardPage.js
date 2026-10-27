import { getAppBaseUrl } from "../support/config.js";

export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: /Know your EMI\.\s*Own your next move\./ });
    this.loanForm = page.getByTestId("loan-form");
    this.loanAmountInput = page.getByRole("spinbutton", { name: "Loan amount (INR)" });
    this.annualRateInput = page.getByRole("spinbutton", { name: "Annual interest rate" });
    this.tenureInput = page.getByRole("spinbutton", { name: "Loan tenure" });
    this.calculateButton = page.getByRole("button", { name: "Calculate EMI" });
    this.validationMessage = page.getByTestId("validation-message");
    this.monthlyEmi = page.getByTestId("monthly-emi");
    this.principalTotal = page.getByTestId("principal-total");
    this.interestTotal = page.getByTestId("interest-total");
    this.totalPayment = page.getByTestId("total-payment");
    this.chartContainer = page.getByTestId("chart-container");
    this.chartCanvas = this.chartContainer.locator("canvas");
    this.chartPlaceholder = page.locator("#chart-empty");
    this.chartSummary = page.getByTestId("chart-summary");
    this.reportLink = page.getByTestId("report-link");
  }

  async goto() {
    await this.page.goto(getAppBaseUrl());
  }

  async waitForDashboard() {
    await this.heading.waitFor({ state: "visible" });
    await this.loanForm.waitFor({ state: "visible" });
  }

  async fillLoanDetails({ principal, annualRate, tenureYears }) {
    await this.loanAmountInput.fill(String(principal));
    await this.annualRateInput.fill(String(annualRate));
    await this.tenureInput.fill(String(tenureYears));
  }

  async calculate() {
    await this.calculateButton.click();
  }

  async clearLoanAmount() {
    await this.loanAmountInput.fill("");
  }

  async openReport() {
    await this.reportLink.click();
  }

  async isChartVisible() {
    return this.chartCanvas.isVisible();
  }

  async getChartSummary() {
    return this.chartSummary.innerText();
  }

  async isChartPlaceholderVisible() {
    return this.chartPlaceholder.isVisible();
  }

  async getDisplayedResults() {
    const [emi, principal, interest, totalPayment] = await Promise.all([
      this.monthlyEmi.innerText(),
      this.principalTotal.innerText(),
      this.interestTotal.innerText(),
      this.totalPayment.innerText()
    ]);
    return { emi, principal, interest, totalPayment };
  }
}

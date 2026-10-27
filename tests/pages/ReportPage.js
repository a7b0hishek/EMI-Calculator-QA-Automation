import { getAppBaseUrl } from "../support/config.js";

export class ReportPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: /The details behind\s*your monthly plan\./ });
    this.reportCard = page.getByTestId("report-card");
    this.errorMessage = page.getByTestId("report-error");
    this.monthlyEmi = page.getByTestId("report-monthly-emi");
    this.principal = page.getByTestId("report-principal");
    this.annualRate = page.getByTestId("report-rate");
    this.tenure = page.getByTestId("report-tenure");
    this.totalPrincipal = page.getByTestId("report-total-principal");
    this.totalInterest = page.getByTestId("report-interest");
    this.totalPayment = page.getByTestId("report-total-payment");
    this.backToCalculatorLink = page.getByRole("link", { name: "Edit loan details" });
  }

  async goto(parameters) {
    const reportUrl = new URL("/report.html", getAppBaseUrl());
    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        if (value !== undefined && value !== null) reportUrl.searchParams.set(key, String(value));
      }
    }
    await this.page.goto(reportUrl.toString());
  }

  async waitForReport() {
    await this.heading.waitFor({ state: "visible" });
    await this.reportCard.waitFor({ state: "visible" });
  }

  async waitForError() {
    await this.errorMessage.waitFor({ state: "visible" });
  }

  async getDisplayedDetails() {
    const [emi, principal, annualRate, tenure, totalPrincipal, totalInterest, totalPayment] = await Promise.all([
      this.monthlyEmi.innerText(),
      this.principal.innerText(),
      this.annualRate.innerText(),
      this.tenure.innerText(),
      this.totalPrincipal.innerText(),
      this.totalInterest.innerText(),
      this.totalPayment.innerText()
    ]);
    return { emi, principal, annualRate, tenure, totalPrincipal, totalInterest, totalPayment };
  }

  async returnToCalculator() {
    await this.backToCalculatorLink.click();
  }
}

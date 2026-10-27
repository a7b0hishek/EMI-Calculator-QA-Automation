import { calculateLoan, validateLoanInputs } from "/js/emi-calculator.js";

const parameters = new URLSearchParams(window.location.search);
const reportCard = document.querySelector("#report-card");
const reportError = document.querySelector("#report-error");
const reportErrorMessage = document.querySelector("#report-error-message");
const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const requiredParameters = ["principal", "annualRate", "tenureYears"];
const missingParameters = requiredParameters.filter((key) => !parameters.has(key) || parameters.get(key).trim() === "");

if (missingParameters.length > 0) {
  showError("The report link is missing loan details. Return to the calculator and submit a new estimate.");
} else {
  const inputs = {
    principal: Number(parameters.get("principal")),
    annualRate: Number(parameters.get("annualRate")),
    tenureYears: Number(parameters.get("tenureYears"))
  };
  const issues = validateLoanInputs(inputs);

  if (issues.length > 0) {
    showError(`The loan details in this link are invalid. ${issues.join(" ")}`);
  } else {
    try {
      renderReport(calculateLoan(inputs));
    } catch {
      showError("We could not calculate this report. Return to the calculator and submit valid loan details.");
    }
  }
}

function renderReport(loan) {
  document.querySelector("#report-card-title").textContent = formatMoney(loan.emi);
  document.querySelector("#report-tenure-caption").textContent = `${loan.months} monthly payments over ${loan.tenureYears} ${loan.tenureYears === 1 ? "year" : "years"}`;
  document.querySelector("#report-principal").textContent = formatMoney(loan.principal);
  document.querySelector("#report-rate").textContent = `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(loan.annualRate)}% per year`;
  document.querySelector("#report-tenure").textContent = `${loan.tenureYears} ${loan.tenureYears === 1 ? "year" : "years"}`;
  document.querySelector("#report-total-principal").textContent = formatMoney(loan.principal);
  document.querySelector("#report-interest").textContent = formatMoney(loan.totalInterest);
  document.querySelector("#report-total-payment").textContent = formatMoney(loan.totalPayment);
  reportCard.hidden = false;
}

function showError(message) {
  reportErrorMessage.textContent = message;
  reportError.hidden = false;
  reportCard.hidden = true;
}

function formatMoney(value) {
  return moneyFormatter.format(Math.round((value + Number.EPSILON) * 100) / 100);
}
